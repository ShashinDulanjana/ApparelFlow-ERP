const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// 1. CREATE CUTTING ORDER (Cutting Supervisor Only)
router.post('/', authenticateToken, authorizeRoles('cutting_supervisor'), async (req, res) => {
  try {
    const { orderNo, recipeId, targetQty, fabricRollId, actualFabricYds } = req.body;

    const order = await prisma.cuttingOrder.create({
      data: {
        orderNo,
        recipeId,
        targetQty: parseInt(targetQty),
        fabricRollId,
        actualFabricYds: parseFloat(actualFabricYds),
        status: 'PENDING_VERIFICATION',
        createdBy: req.user.userId
      },
      include: { recipe: { include: { components: true } } }
    });

    res.status(201).json(order);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 2. GET ALL ORDERS
router.get('/', authenticateToken, async (req, res) => {
  try {
    const orders = await prisma.cuttingOrder.findMany({
      include: {
        recipe: { include: { components: true } },
        creator: { select: { fullName: true, role: true } },
        verificationItems: { include: { component: true } },
        verificationLogs: { include: { verifier: { select: { fullName: true } } } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. VERIFY ORDER COMPONENTS (Cutting Verifier Only - TRAFFIC LIGHT GATEKEEPER ENGINE)
router.post('/:id/verify', authenticateToken, authorizeRoles('cutting_verifier'), async (req, res) => {
  try {
    const { id } = req.params;
    const { componentCounts, rejectionNote } = req.body; // componentCounts = [{ componentId, actualQty }]

    const order = await prisma.cuttingOrder.findUnique({
      where: { id },
      include: { recipe: { include: { components: true } } }
    });

    if (!order) return res.status(404).json({ error: 'Order not found' });

    let hasRedComponent = false;
    const verificationItemsData = [];

    // Evaluate Traffic Light Status for each component
    for (const comp of order.recipe.components) {
      const expectedQty = order.targetQty * comp.piecesPerGarment;
      const actualItem = componentCounts.find(c => c.componentId === comp.id);
      const actualQty = actualItem ? parseInt(actualItem.actualQty) : 0;

      const matchRatio = actualQty / expectedQty;
      let status = 'GREEN';

      if (matchRatio < 0.95) {
        status = 'RED'; // Shortage under 95% = RED
        hasRedComponent = true;
      } else if (matchRatio < 1.0) {
        status = 'YELLOW'; // Minor discrepancy 95%-99% = YELLOW
      }

      verificationItemsData.push({
        orderId: id,
        componentId: comp.id,
        expectedQty,
        actualQty,
        status
      });
    }

    // Calculate Fabric Wastage %
    const expectedFabric = order.targetQty * order.recipe.stdFabricYards;
    const wastagePct = ((order.actualFabricYds - expectedFabric) / expectedFabric) * 100;
    const wastageExceeded = wastagePct > order.recipe.wastageCap;

    // HARD STOP VALIDATION LOGIC
    let decision = 'APPROVED';
    let finalOrderStatus = 'VERIFIED';

    if (hasRedComponent || wastageExceeded) {
      decision = 'REJECTED';
      finalOrderStatus = 'REJECTED';
    }

    // Database Transaction
    await prisma.$transaction([
      prisma.verificationItem.deleteMany({ where: { orderId: id } }),
      prisma.verificationItem.createMany({ data: verificationItemsData }),
      prisma.verificationLog.create({
        data: {
          orderId: id,
          verifierId: req.user.userId,
          decision,
          rejectionNote: decision === 'REJECTED' ? (rejectionNote || 'Failed component or wastage threshold check.') : null,
          wastagePct: parseFloat(wastagePct.toFixed(2))
        }
      }),
      prisma.cuttingOrder.update({
        where: { id },
        data: { status: finalOrderStatus }
      })
    ]);

    res.json({
      message: decision === 'APPROVED' ? 'Verification Passed!' : 'HARD STOP: Verification Rejected!',
      decision,
      status: finalOrderStatus,
      hasRedComponent,
      wastagePct: wastagePct.toFixed(2),
      wastageExceeded
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 4. HANDOVER TO SEWING (Sewing Supervisor Only - HARD STOP ENFORCED)
router.post('/:id/handover', authenticateToken, authorizeRoles('sewing_supervisor'), async (req, res) => {
  try {
    const { id } = req.params;
    const order = await prisma.cuttingOrder.findUnique({ where: { id } });

    if (!order) return res.status(404).json({ error: 'Order not found' });

    // SERVER-SIDE HARD STOP ENFORCEMENT
    if (order.status !== 'VERIFIED') {
      return res.status(403).json({ 
        error: 'HARD STOP BLOCK: Order cannot be accepted into Sewing line because verification was REJECTED or PENDING.' 
      });
    }

    res.json({ message: 'Order successfully received into Sewing Production Line!' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/recipes - List all recipes with components
router.get('/', authenticateToken, async (req, res) => {
  try {
    const recipes = await prisma.recipe.findMany({
      include: { components: true }
    });
    res.json(recipes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
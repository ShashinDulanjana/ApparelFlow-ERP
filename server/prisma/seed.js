const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial data...');

  // Clear existing records to prevent duplicates
  await prisma.verificationLog.deleteMany();
  await prisma.verificationItem.deleteMany();
  await prisma.cuttingOrder.deleteMany();
  await prisma.recipeComponent.deleteMany();
  await prisma.recipe.deleteMany();
  await prisma.user.deleteMany();

  // Hash standard password for demo users
  const defaultPassword = await bcrypt.hash('password123', 10);

  // 1. Create Default Users for 3 RBAC Roles
  await prisma.user.createMany({
    data: [
      {
        email: 'supervisor@apparelflow.com',
        passwordHash: defaultPassword,
        role: 'cutting_supervisor',
        fullName: 'Kasun Perera (Cutting Sup)',
      },
      {
        email: 'verifier@apparelflow.com',
        passwordHash: defaultPassword,
        role: 'cutting_verifier',
        fullName: 'Nimal Jayasinghe (Verifier)',
      },
      {
        email: 'sewing@apparelflow.com',
        passwordHash: defaultPassword,
        role: 'sewing_supervisor',
        fullName: 'Sunil Silva (Sewing Sup)',
      },
    ],
  });

  console.log('✅ Demo Users created (Password: password123)');

  // 2. Create Pre-required Recipes
  // Recipe A: Casual Blouse
  await prisma.recipe.create({
    data: {
      recipeCode: 'RCP-BLOUSE-01',
      name: 'Casual Blouse',
      category: 'Womenswear',
      stdFabricYards: 1.5,
      wastageCap: 5.0, // Max 5% allowed wastage
      components: {
        create: [
          { componentName: 'Front Panel', piecesPerGarment: 2 },
          { componentName: 'Back Panel', piecesPerGarment: 1 },
          { componentName: 'Sleeves', piecesPerGarment: 2 },
          { componentName: 'Collar', piecesPerGarment: 1 },
        ],
      },
    },
  });

  // Recipe B: Crop Top
  await prisma.recipe.create({
    data: {
      recipeCode: 'RCP-CROP-02',
      name: 'Crop Top',
      category: 'Womenswear',
      stdFabricYards: 1.0,
      wastageCap: 4.0, // Max 4% allowed wastage
      components: {
        create: [
          { componentName: 'Front Piece', piecesPerGarment: 1 },
          { componentName: 'Back Piece', piecesPerGarment: 1 },
          { componentName: 'Shoulder Straps', piecesPerGarment: 2 },
        ],
      },
    },
  });

  console.log('✅ "Casual Blouse" & "Crop Top" Recipes seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
// Migration script: convert any Trip.status === 'settled' to 'completed'
// Usage: ensure DATABASE_URL is available in env (or in .env), then run:
//    node scripts/migrate-settled.js

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.trip.updateMany({
    where: { status: 'settled' },
    data: { status: 'completed' },
  });

  console.log(`Updated ${result.count} trip(s) from 'settled' to 'completed'.`);
}

main()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

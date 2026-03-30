const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User',
      cognitiveState: 'BEGINNER'
    }
  });
  console.log('Test user created:', user);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());

const { PrismaClient } = require('./backend/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const allCourses = await prisma.course.findMany();
  console.log(`TOTAL COURSES IN DB: ${allCourses.length}`);
  allCourses.forEach((c, idx) => {
    console.log(`[${idx+1}] ID: ${c.id} | title: "${c.title}" | userId: "${c.userId}" | dept: "${c.department}"`);
  });
}

run().catch(console.error).finally(() => prisma.$disconnect());

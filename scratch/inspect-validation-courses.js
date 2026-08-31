const { PrismaClient } = require('./backend/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function inspectCourses() {
  const allCourses = await prisma.course.findMany({
    select: {
      id: true,
      title: true,
      userId: true,
      department: true,
      createdAt: true
    }
  });

  console.log(`Total courses in Prisma DB: ${allCourses.length}`);
  allCourses.forEach((c, idx) => {
    console.log(`[${idx+1}] ID: ${c.id} | Title: "${c.title}" | UserId: ${c.userId} | Dept: "${c.department}"`);
  });
}

inspectCourses().finally(() => prisma.$disconnect());

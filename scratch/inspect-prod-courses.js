const { PrismaClient } = require('./backend/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function inspectAllCourses() {
  const courses = await prisma.course.findMany({
    select: {
      id: true,
      title: true,
      userId: true,
      department: true,
      createdAt: true
    }
  });

  console.log(`Total courses in database: ${courses.length}`);
  courses.forEach((c, idx) => {
    console.log(`[${idx+1}] ID: ${c.id} | Title: "${c.title}" | UserId: "${c.userId}" | Dept: "${c.department}"`);
  });
}

inspectAllCourses().finally(() => prisma.$disconnect());

const { PrismaClient } = require('./backend/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function testValidationService() {
  const userId = '3mBj9lZJITheXPhb9Md1nXczAWU2'; // Dr. Tetteh
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { lecturerProfile: true, studentProfile: true },
    });

    console.log('User found:', user ? user.email : 'null');
    const dept = user?.lecturerProfile?.department || user?.studentProfile?.programme || user?.institution;

    const courses = await prisma.course.findMany({
      where: {
        userId: { not: 'system-bot' }
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, email: true, role: true } },
        modules: {
          orderBy: { orderIndex: 'asc' },
          select: { id: true, title: true, content: true },
        },
        generatedReferences: true,
      },
    });

    console.log(`Found ${courses.length} courses.`);

    const sortedCourses = courses.sort((a, b) => {
      const aIsMine = a.userId === userId || (dept && a.department?.toLowerCase() === dept.toLowerCase());
      const bIsMine = b.userId === userId || (dept && b.department?.toLowerCase() === dept.toLowerCase());
      if (aIsMine && !bIsMine) return -1;
      if (!aIsMine && bIsMine) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    console.log('Sorted courses count:', sortedCourses.length);

    for (let c of sortedCourses) {
      let totalInTextCitations = 0;
      let totalModulesWithReferences = 0;
      let totalStructuralScore = 0;

      const apaRegex = /\([A-Z][a-zA-Z\s&,.]+(?:et al\.)?,\s*\d{4}\)/g;

      c.modules.forEach((mod) => {
        const text = mod.content || '';
        const matches = text.match(apaRegex);
        if (matches) totalInTextCitations += matches.length;
        if (text.toLowerCase().includes('### references') || text.toLowerCase().includes('## references')) {
          totalModulesWithReferences++;
        }
      });
      console.log(`Course "${c.title}": ${c.modules.length} modules, ${totalInTextCitations} citations.`);
    }

  } catch (err) {
    console.error('Service error:', err.stack);
  }
}

testValidationService().finally(() => prisma.$disconnect());

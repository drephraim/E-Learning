const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Checking for the most recent user...");
  const user = await prisma.user.findFirst({
    orderBy: { createdAt: 'desc' }
  });

  if (!user) {
    console.log("No user found. Please register a user or run the seed-user.js script.");
    console.log("WAITING_FOR_USER");
    return;
  }

  console.log(`Found most recent user: ${user.name} (${user.email}) - ID: ${user.id}`);
  console.log(`Initial global cognitiveState: ${user.cognitiveState}`);

  const topic = 'HTML Basics';

  // 1. Generate Course
  console.log(`Generating course for topic "${topic}"...`);
  const genResponse = await fetch('http://localhost:3000/courses/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: user.id,
      topic: topic,
      difficulty: 'BEGINNER',
      chapters: 3,
      includeYoutube: false
    })
  });

  const genResult = await genResponse.json();
  if (!genResult.success) {
    console.error("Course generation failed:", genResult);
    return;
  }

  const courseId = genResult.courseId;
  console.log(`Course generated successfully! Course ID: ${courseId}`);

  // 2. Fetch full course details to get modules and their learning aids
  console.log("Fetching course details...");
  const courseDetailsResponse = await fetch(`http://localhost:3000/courses/${courseId}?userId=${user.id}`);
  const courseDetails = await courseDetailsResponse.json();

  const modules = courseDetails.modules;
  console.log(`Found ${modules.length} modules.`);

  // Reset TopicState and user cognitiveState to start fresh
  const normalizedTopic = topic.toLowerCase().replace(/[^a-z0-9]/g, '');
  await prisma.topicState.deleteMany({
    where: { userId: user.id, topic: normalizedTopic }
  });
  await prisma.user.update({
    where: { id: user.id },
    data: { cognitiveState: 'BEGINNER' }
  });

  console.log("Reset topicState and user cognitiveState to BEGINNER for testing.");

  // Loop through modules
  for (let idx = 0; idx < modules.length; idx++) {
    const mod = modules[idx];
    console.log(`\n--- Processing Module ${idx + 1}: ${mod.title} ---`);

    // Find quiz learning aid
    const quizAid = mod.learningAids.find(a => a.type === 'QUIZ');
    const quizCount = quizAid?.payload?.quizzes?.length || 5;

    // Find task learning aid to construct metadata
    const taskAid = mod.learningAids.find(a => a.type === 'TASK');
    const tasks = taskAid?.payload?.tasks || [];
    const completedTasks = {};
    tasks.forEach((t, i) => {
      completedTasks[i] = true;
    });

    console.log(`Completing module with quiz score ${quizCount}/${quizCount} (100%) and 5/5 confidence...`);

    // Submit progress
    const progressResponse = await fetch(`http://localhost:3000/courses/progress/${mod.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        status: 'COMPLETED',
        quizScore: quizCount,
        confidenceRating: 5,
        metadata: { completedTasks }
      })
    });
    const progressResult = await progressResponse.json();
    console.log(`Progress updated: status = ${progressResult.status}`);

    // Trigger Adapt API
    console.log("Triggering Adapt API...");
    const adaptResponse = await fetch(`http://localhost:3000/users/${user.id}/adapt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        moduleId: mod.id,
        confidenceRating: 5
      })
    });
    const adaptResult = await adaptResponse.json();
    console.log("Adapt API response:", JSON.stringify(adaptResult));

    // Verify database states
    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id }
    });
    const topicState = await prisma.topicState.findUnique({
      where: { userId_topic: { userId: user.id, topic: normalizedTopic } }
    });

    console.log("DATABASE VERIFICATION:");
    console.log(`- TopicState (${normalizedTopic}):`);
    console.log(`  * cognitiveState: ${topicState?.cognitiveState}`);
    console.log(`  * emaScore: ${topicState?.emaScore}`);
    console.log(`  * totalQuizzes: ${topicState?.totalQuizzes}`);
    console.log(`- User global cognitiveState: ${updatedUser?.cognitiveState}`);
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());

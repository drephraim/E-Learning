const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();

async function main() {
  const topic = 'Course to Delete ' + Date.now();
  
  // -- Programmatic SVG Gen (Mirrors CoursesService) --
  const hash = crypto.createHash('md5').update(topic).digest('hex');
  const hue1 = parseInt(hash.substring(0, 2), 16) % 360;
  const hue2 = (hue1 + 40 + (parseInt(hash.substring(2, 4), 16) % 40)) % 360;
  const sat = 65 + (parseInt(hash.substring(4, 6), 16) % 25);
  const light1 = 45 + (parseInt(hash.substring(6, 8), 16) % 15);
  const light2 = 35 + (parseInt(hash.substring(8, 10), 16) % 15);
  
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
  <rect width="800" height="450" fill="hsl(${hue1}, ${sat}%, ${light1}%)"/>
  <circle cx="400" cy="225" r="100" fill="white" opacity="0.1"/>
</svg>`;

  const base64 = Buffer.from(svg).toString('base64');
  const coverPath = `data:image/svg+xml;base64,${base64}`;

  const course = await prisma.course.create({
    data: {
      userId: 'test-user-id',
      title: topic,
      targetDifficulty: 'BEGINNER',
      coverImage: coverPath,
      modules: {
        create: [
          {
            title: 'Module 1',
            orderIndex: 0,
            learningAids: {
              create: [
                {
                  type: 'QUIZ',
                  payload: { questions: [] }
                }
              ]
            }
          }
        ]
      }
    }
  });
  console.log('Test course created with AI cover:', course.id);
  console.log('Cover URL path:', coverPath);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());

const path = require('path');
const { Client } = require(path.join(__dirname, '../node_modules/pg'));
const connectionString = "postgresql://neondb_owner:npg_6Bp2SLuqGhQU@100.51.95.243:5432/neondb?sslmode=require&options=endpoint%3Dep-royal-salad-anihxqyx-pooler";

async function main() {
  const client = new Client({ connectionString });
  await client.connect();
  console.log('Connected to Neon PostgreSQL via IPv4!');

  await client.query(`
    ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "visibility" TEXT NOT NULL DEFAULT 'PUBLIC';
    ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "department" TEXT;
    ALTER TABLE "LecturerProfile" ADD COLUMN IF NOT EXISTS "secondaryDepartments" TEXT[] DEFAULT ARRAY[]::TEXT[];
    ALTER TABLE "LecturerProfile" ADD COLUMN IF NOT EXISTS "coursesTaught" TEXT[] DEFAULT ARRAY[]::TEXT[];
    ALTER TABLE "LecturerProfile" ADD COLUMN IF NOT EXISTS "officeHours" TEXT;
    ALTER TABLE "LecturerProfile" ADD COLUMN IF NOT EXISTS "phone" TEXT;
    ALTER TABLE "LecturerProfile" ADD COLUMN IF NOT EXISTS "bio" TEXT;
  `);
  console.log('Updated Course and LecturerProfile table columns.');

  await client.query(`
    CREATE TABLE IF NOT EXISTS "CourseEnrollment" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "courseId" TEXT NOT NULL,
      "studentEmail" TEXT NOT NULL,
      "studentId" TEXT,
      "lecturerId" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'ENROLLED',
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "CourseEnrollment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "CourseEnrollment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
      CONSTRAINT "CourseEnrollment_lecturerId_fkey" FOREIGN KEY ("lecturerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
    );
  `);
  console.log('Created CourseEnrollment table.');

  await client.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS "CourseEnrollment_courseId_studentEmail_key" ON "CourseEnrollment"("courseId", "studentEmail");
  `);
  console.log('Created unique index.');

  await client.end();
  console.log('Migration complete!');
}

main().catch(err => console.error(err));

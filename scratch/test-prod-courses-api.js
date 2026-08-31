const axios = require('axios');

async function testProdCoursesAPI() {
  const testUserId = '3mBj9lZJITheXPhb9Md1nXczAWU2';
  try {
    const url = `https://e-learning-lyart-psi.vercel.app/api/lecturer/courses/${testUserId}`;
    console.log(`Querying ${url}...`);
    const res = await axios.get(url, { headers: { 'x-user-id': testUserId } });
    console.log(`Generated courses count in DB: ${res.data?.generatedCourses?.length}`);
    res.data?.generatedCourses?.forEach((c, i) => {
      console.log(`[${i+1}] ID: ${c.id} | Title: "${c.title}" | userId: "${c.userId}" | dept: "${c.department}"`);
    });
  } catch (err) {
    console.error('Error:', err.response?.status, err.response?.data);
  }
}

testProdCoursesAPI();

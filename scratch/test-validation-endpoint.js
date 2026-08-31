const axios = require('axios');

async function testValidationEndpoint() {
  const testUserId = '3mBj9lZJITheXPhb9Md1nXczAWU2'; // Dr. Tetteh
  const prodUrl = `https://e-learning-lyart-psi.vercel.app/api/lecturer/validation/${testUserId}`;
  try {
    console.log(`Querying ${prodUrl}...`);
    const res = await axios.get(prodUrl, {
      headers: { 'x-user-id': testUserId }
    });
    console.log(`HTTP ${res.status} SUCCESS! Courses count: ${res.data?.length}`);
    if (res.data?.length > 0) {
      console.log('First 2 courses:');
      res.data.slice(0, 2).forEach(c => console.log(` - ${c.title} (${c.authenticityScore}% score)`));
    }
  } catch (err) {
    console.error('HTTP Error:', err.response?.status, err.response?.data);
  }
}

testValidationEndpoint();

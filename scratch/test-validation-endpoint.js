const axios = require('axios');

async function testValidationEndpoint() {
  const testUserId = '3mBj9lZJITheXPhb9Md1nXczAWU2';
  try {
    const url = `https://e-learning-lyart-psi.vercel.app/api/lecturer/validation/${testUserId}`;
    console.log(`Querying ${url}...`);
    const res = await axios.get(url, { headers: { 'x-user-id': testUserId } });
    console.log('HTTP 200 SUCCESS! Item 0:', JSON.stringify(res.data[0], null, 2));
  } catch (err) {
    console.error('HTTP Error:', err.response?.status, err.response?.data);
  }
}

testValidationEndpoint();

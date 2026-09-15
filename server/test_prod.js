const http = require('http');
const https = require('https');

async function testPost(url, data) {
  return new Promise((resolve) => {
    const bodyStr = JSON.stringify(data);
    const parsed = new URL(url);
    const client = parsed.protocol === 'https:' ? https : http;

    const req = client.request(parsed, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(bodyStr),
      },
    }, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => responseBody += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: responseBody,
        });
      });
    });

    req.on('error', (err) => {
      resolve({ error: err.message });
    });

    req.write(bodyStr);
    req.end();
  });
}

async function run() {
  console.log('--- Testing Forgot Password on Prod ---');
  const res1 = await testPost('https://tour.speshway.site/api/v1/auth/forgot-password', {
    email: 'naveenkumar970100@gmail.com'
  });
  console.log('Forgot Password Status:', res1.statusCode);
  console.log('Forgot Password Body:', res1.body);

  console.log('\n--- Testing Reset Password on Prod ---');
  const res2 = await testPost('https://tour.speshway.site/api/v1/auth/reset-password', {
    email: 'naveenkumar970100@gmail.com',
    otp: '123456',
    password: 'newpassword123'
  });
  console.log('Reset Password Status:', res2.statusCode);
  console.log('Reset Password Body:', res2.body);
}

run();

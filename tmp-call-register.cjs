const http = require('http');

const data = JSON.stringify({
  email: 'testuser+api@acemaingenieria.com',
  password: 'pass1234',
  firstName: 'Test',
  lastName: 'User',
  role: 'user',
});

const options = {
  hostname: '127.0.0.1',
  port: 3001,
  path: '/api/auth/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data),
  },
};

const req = http.request(options, (res) => {
  console.log('statusCode:', res.statusCode);
  const chunks = [];
  res.on('data', (chunk) => chunks.push(chunk));
  res.on('end', () => {
    const body = Buffer.concat(chunks).toString('utf8');
    console.log('body:', body);
  });
});

req.on('error', (error) => {
  console.error('request error:', error);
});

req.write(data);
req.end();

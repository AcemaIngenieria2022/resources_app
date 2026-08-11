import fetch from 'node-fetch';

(async () => {
  try {
    const response = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'testuser+api@acemaingenieria.com',
        password: 'pass1234',
        firstName: 'Test',
        lastName: 'User',
        role: 'user'
      }),
    });
    console.log('status', response.status);
    console.log('text', await response.text());
  } catch (err) {
    console.error(err);
  }
})();

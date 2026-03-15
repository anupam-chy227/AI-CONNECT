const http = require('http');

const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI3ZmZlODc5My1lMGU0LTQ2NzMtOWQ1YS04NWZkODNjM2Q0YWUiLCJ1c2VybmFtZSI6InRlc3R1c2VyIiwiaWF0IjoxNzczNDk3NzkyLCJleHAiOjE3NzM1ODQxOTJ9.TwWfvv1QW63RtQWQ7PMYe466b2sRz52kjViTTbBDXho";

async function testPayments() {
  const data = JSON.stringify({
    amount: 1999,
    currency: 'USD',
    card_token: 'tok_visa_4242',
    metadata: { item: 'premium_upgrade' }
  });

  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/payments/charge',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length,
      'Authorization': `Bearer ${token}`
    }
  };

  return new Promise((resolve) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        console.log('[Test Payments] Response:', body);
        resolve(JSON.parse(body));
      });
    });
    req.write(data);
    req.end();
  });
}

async function testKYC() {
  const data = JSON.stringify({
    persona_id: 'per_123',
    id_type: 'passport',
    id_number: 'E12345678'
  });

  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/kyc/verify',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length,
      'Authorization': `Bearer ${token}`
    }
  };

  return new Promise((resolve) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        console.log('[Test KYC] Response:', body);
        resolve(JSON.parse(body));
      });
    });
    req.write(data);
    req.end();
  });
}

async function runTests() {
  await testPayments();
  await testKYC();
  process.exit(0);
}

runTests();

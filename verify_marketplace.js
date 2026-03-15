const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/presets',
  method: 'GET'
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log('[Verify] Presets:', body);
    if (JSON.parse(body).length > 0) {
      console.log('[Verify] SUCCESS: Presets found.');
    } else {
      console.log('[Verify] FAILED: No presets found.');
    }
    process.exit(0);
  });
});

req.on('error', (e) => {
  console.error(e);
  process.exit(1);
});

req.end();

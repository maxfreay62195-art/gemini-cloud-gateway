const assert = require('node:assert/strict');
const http = require('node:http');
const test = require('node:test');

process.env.GEMINI_API_KEY = 'synthetic-upstream-test-value';
process.env.GATEWAY_API_KEY = 'synthetic-caller-credential-for-offline-test';
const app = require('./gemini_gateway');

test('Generation Route Requires A Configured Caller Key', async () => {
  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const post = { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' };
  const request = (options = post) => fetch(base + '/v1/images/generations', options);
  try {
    assert.equal((await fetch(base + '/')).status, 200);
    assert.equal((await request()).status, 401);
    assert.equal((await request({ ...post, headers: { ...post.headers, Authorization: 'Basic invalid' } })).status, 401);
    assert.equal((await request({ ...post, headers: { ...post.headers, Authorization: `Bearer ${'x'.repeat(40)}` } })).status, 401);

    delete process.env.GATEWAY_API_KEY;
    assert.equal((await request()).status, 503);
    process.env.GATEWAY_API_KEY = 'short';
    assert.equal((await request()).status, 503);
    process.env.GATEWAY_API_KEY = 'synthetic-caller-credential-for-offline-test';

    assert.equal((await request({ ...post, headers: { ...post.headers, Authorization: `Bearer ${process.env.GATEWAY_API_KEY}` } })).status, 400);
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
    delete process.env.GATEWAY_API_KEY;
    delete process.env.GEMINI_API_KEY;
  }
});

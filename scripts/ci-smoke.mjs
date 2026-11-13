import assert from 'node:assert/strict';

const base = 'http://localhost:3000';
const health = await fetch(`${base}/api/health`);
assert.equal(health.status, 200, 'Database readiness must succeed');
assert.equal((await health.json()).database, 'connected');
for (const path of ['/', '/login', '/signup', '/believers-training', '/final-assessment', '/final-assessment/print']) {
  const response = await fetch(base + path);
  assert.equal(response.status, 200, `${path} must render`);
  const html = await response.text();
  assert.match(html, /<html/, `${path} must return HTML`);
  if (path.endsWith("/print")) assert.doesNotMatch(html, /NEXT_REDIRECT|correctIndex|Correct answer/);
}
for (const path of ['/dashboard', '/admin', '/admin/course', '/admin/final-assessment']) {
  const response = await fetch(base + path, { redirect: 'manual' });
  const html = await response.text();
  // App Router may stream the auth redirect after an initial 200 response.
  const destination = response.headers.get('location') ?? '';
  assert.ok(
    ([303, 307, 308].includes(response.status) && destination.startsWith('/login')) ||
      (response.status === 200 && /NEXT_REDIRECT;replace;\/login/.test(html)),
    `${path} must require authentication`,
  );
  assert.ok(!html.includes('Correct answer'), `${path} must not expose answer keys`);
}
console.log('Production smoke checks passed: database readiness, public pages, and protected routes.');

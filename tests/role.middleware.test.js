import test from 'node:test';
import assert from 'node:assert/strict';
import { authorizeRoles } from '../middlewares/role.middleware.js';

function responseHarness() {
  return {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; }
  };
}

test('multi-role authorization accepts both Admin and Operator', () => {
  const middleware = authorizeRoles('ADMIN', 'OPERATOR');
  for (const role of ['ADMIN', 'OPERATOR']) {
    const req = { user: { role } }, res = responseHarness();
    let continued = false;
    middleware(req, res, () => { continued = true; });
    assert.equal(continued, true);
  }
});

test('role authorization returns 401 without a user and 403 for a disallowed role', () => {
  const middleware = authorizeRoles('ADMIN');
  const unauthenticated = responseHarness();
  middleware({ user: null }, unauthenticated, () => assert.fail('must not continue'));
  assert.equal(unauthenticated.statusCode, 401);

  const forbidden = responseHarness();
  middleware({ user: { role: 'OPERATOR' } }, forbidden, () => assert.fail('must not continue'));
  assert.equal(forbidden.statusCode, 403);
});

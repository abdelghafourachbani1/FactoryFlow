import test from 'node:test';
import assert from 'node:assert/strict';
import { swaggerDocument } from '../swagger.js';

function walk(value, visit) {
  if (!value || typeof value !== 'object') return;
  visit(value);
  for (const child of Object.values(value)) walk(child, visit);
}

test('OpenAPI document describes every API route with a response', () => {
  const expectedPaths = [
    '/installation/status', '/installation', '/auth/login', '/auth/profile', '/auth/users/operators', '/auth/users/admins',
    '/matierPr', '/matierPr/{id}', '/matierPr/{id}/stock', '/matierPr/alerts', '/matierPr/movements',
    '/products', '/products/{id}', '/orders', '/orders/mine', '/orders/history', '/orders/{id}',
    '/orders/{id}/cancel', '/orders/{id}/start', '/orders/{id}/complete'
  ];
  for (const path of expectedPaths) {
    assert.ok(swaggerDocument.paths[path], `missing path ${path}`);
    for (const operation of Object.values(swaggerDocument.paths[path])) {
      if (operation && typeof operation === 'object' && 'summary' in operation) {
        assert.ok(operation.responses && Object.keys(operation.responses).length, `missing responses for ${path}`);
      }
    }
  }
});

test('OpenAPI references resolve to declared components', () => {
  walk(swaggerDocument, value => {
    if (typeof value.$ref !== 'string' || !value.$ref.startsWith('#/')) return;
    const target = value.$ref.slice(2).split('/').reduce((current, key) => current?.[key], swaggerDocument);
    assert.notEqual(target, undefined, `unresolved ref ${value.$ref}`);
  });
});

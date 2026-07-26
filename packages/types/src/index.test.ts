import assert from 'node:assert/strict';
import test from 'node:test';
import type { HealthResponse } from './index.js';

test('HealthResponse shape is usable', () => {
  const payload: HealthResponse = {
    status: 'ok',
    service: 'api',
    timestamp: new Date().toISOString(),
  };
  assert.equal(payload.status, 'ok');
});

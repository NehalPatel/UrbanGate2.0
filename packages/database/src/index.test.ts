import assert from 'node:assert/strict';
import test from 'node:test';
import { createPrismaClient } from './index';

test('createPrismaClient returns a PrismaClient instance', () => {
  const client = createPrismaClient('mongodb://127.0.0.1:27017/urbangate');
  assert.equal(typeof client.$connect, 'function');
  assert.equal(typeof client.$disconnect, 'function');
});

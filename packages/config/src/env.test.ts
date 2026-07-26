import assert from 'node:assert/strict';
import test from 'node:test';
import { loadEnv } from './index';

test('loadEnv accepts valid development defaults', () => {
  const env = loadEnv({
    NODE_ENV: 'development',
    DATABASE_URL: 'mongodb://127.0.0.1:27017/urbangate',
    REDIS_URL: 'redis://localhost:6379',
    SESSION_SECRET: 'change-me-to-a-long-random-string',
    CORS_ORIGINS: 'http://localhost:3000, http://localhost:3002',
  });

  assert.equal(env.API_PORT, 3001);
  assert.deepEqual(env.CORS_ORIGINS, ['http://localhost:3000', 'http://localhost:3002']);
  assert.equal(env.STORAGE_DRIVER, 'local');
});

test('loadEnv rejects missing DATABASE_URL', () => {
  assert.throws(
    () =>
      loadEnv({
        SESSION_SECRET: 'change-me-to-a-long-random-string',
      }),
    /Invalid environment configuration/,
  );
});

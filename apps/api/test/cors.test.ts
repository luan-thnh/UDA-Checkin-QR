import assert from 'node:assert/strict';
import test from 'node:test';
import { getAllowedOrigins, isOriginAllowed } from '../src/utils/cors.js';

test('CORS mac dinh mo dashboard :3000 + miniapp :3002', () => {
  delete process.env.CORS_ORIGINS;
  assert.ok(isOriginAllowed('http://localhost:3000'));
  assert.ok(isOriginAllowed('http://localhost:3002'));
  assert.equal(isOriginAllowed('https://evil.example'), false);
});

test('CORS doc tu ENV, ho tro *', () => {
  process.env.CORS_ORIGINS = 'https://a.vercel.app, https://b.vercel.app';
  assert.deepEqual(getAllowedOrigins(), ['https://a.vercel.app', 'https://b.vercel.app']);
  assert.ok(isOriginAllowed('https://a.vercel.app'));
  assert.equal(isOriginAllowed('http://localhost:3000'), false);
  process.env.CORS_ORIGINS = '*';
  assert.ok(isOriginAllowed('https://bat-cu-dau.example'));
  delete process.env.CORS_ORIGINS;
});

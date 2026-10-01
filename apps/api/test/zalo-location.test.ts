import assert from 'node:assert/strict';
import test from 'node:test';
import { parseZaloLocationPayload } from '../src/services/zalo-location.service.js';

test('parse dung payload graph.zalo.me mau docs', () => {
  const coords = parseZaloLocationPayload({
    data: { provider: 'gps', latitude: '10.758341', longitude: '106.745863', timestamp: '1666249171003' },
    error: 0,
    message: 'Success',
  });
  assert.equal(coords.lat, 10.758341);
  assert.equal(coords.lng, 106.745863);
  assert.equal(coords.provider, 'gps');
});

test('parse nem loi khi Zalo bao error != 0', () => {
  assert.throws(() => parseZaloLocationPayload({ error: -201, message: 'Invalid code' }), /Invalid code/);
});

test('parse nem loi khi toa do rac', () => {
  assert.throws(
    () => parseZaloLocationPayload({ error: 0, message: 'Success', data: { latitude: 'abc', longitude: '9999' } }),
    /khong hop le/,
  );
});

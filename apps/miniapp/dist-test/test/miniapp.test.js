import assert from 'node:assert/strict';
import test from 'node:test';
import { parseSessionIdFromQuery, haversineMeters } from '@checkin/shared';
test('miniapp doc duoc sessionId tu QR (?session=xxx)', () => {
    assert.equal(parseSessionIdFromQuery({ session: 'SS-001' }), 'SS-001');
    assert.equal(parseSessionIdFromQuery({ sessionId: 'SS-002' }), 'SS-002');
    assert.equal(parseSessionIdFromQuery({}), '');
});
test('miniapp hien thi khoang cach dung threshold 2km', () => {
    const near = haversineMeters(10.762622, 106.660172, 10.762622, 106.660172);
    assert.equal(near, 0);
    const far = haversineMeters(10.762622, 106.660172, 10.8, 106.7);
    assert.ok(far > 2000, `far=${far}`);
});

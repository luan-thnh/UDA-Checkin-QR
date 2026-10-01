import assert from 'node:assert/strict';
import test from 'node:test';
import { haversineMeters, isWithinRadius, normalizeStudentCode, isValidStudentCode, normalizeRadiusM, buildSessionDeepLink, } from '../src/index.js';
test('normalizeStudentCode trims and uppercases', () => {
    assert.equal(normalizeStudentCode('  sv001 '), 'SV001');
    assert.equal(normalizeStudentCode('sv-001'), 'SV-001');
});
test('isValidStudentCode rejects empty and symbols', () => {
    assert.equal(isValidStudentCode('SV001'), true);
    assert.equal(isValidStudentCode('  '), false);
    assert.equal(isValidStudentCode('SV@001'), false);
});
test('haversineMeters: same point = 0, ~111km per 1 degree lat', () => {
    assert.equal(haversineMeters(10, 106, 10, 106), 0);
    const d = haversineMeters(10, 106, 11, 106);
    assert.ok(d > 110000 && d < 112000, `expected ~111km, got ${d}`);
});
test('isWithinRadius respects 2000m default boundary', () => {
    // ~1.9km north of center -> inside
    assert.equal(isWithinRadius(10.0171, 105.78, 10, 105.78, 2000), true);
    // ~2.2km north -> outside
    assert.equal(isWithinRadius(10.0198, 105.78, 10, 105.78, 2000), false);
});
test('normalizeRadiusM falls back to default', () => {
    assert.equal(normalizeRadiusM(undefined), 2000);
    assert.equal(normalizeRadiusM(-5), 2000);
    assert.equal(normalizeRadiusM(500), 500);
});
test('buildSessionDeepLink encodes session id', () => {
    const link = buildSessionDeepLink('123456', 'SS 001');
    assert.equal(link, 'https://zalo.me/s/123456/?session=SS%20001');
});

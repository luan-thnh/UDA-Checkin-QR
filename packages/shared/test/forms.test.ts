import assert from 'node:assert/strict';
import test from 'node:test';
import { validateAttendForm, validateLoginForm, validateSessionForm } from '../src/index.js';

test('validateLoginForm bat email sai + pass ngan', () => {
  assert.deepEqual(validateLoginForm('', ''), { email: 'Nhập email admin.', password: 'Nhập mật khẩu.' });
  assert.ok(validateLoginForm('khong-phai-email', '123456').email);
  assert.ok(validateLoginForm('a@x.vn', '123').password);
  assert.deepEqual(validateLoginForm('admin@truong.edu.vn', 'admin123'), {});
});

test('validateSessionForm bat ten trong, toa do sai, gio nguoc', () => {
  const base = {
    title: 'Toan R1',
    latCenter: '10.762622',
    lngCenter: '106.660172',
    radiusM: '2000',
    startsAt: '2026-10-01T08:00',
    endsAt: '2026-10-01T10:00',
  };
  assert.deepEqual(validateSessionForm(base), {});
  assert.ok(validateSessionForm({ ...base, title: '  ' }).title);
  assert.ok(validateSessionForm({ ...base, latCenter: 'abc' }).latCenter);
  assert.ok(validateSessionForm({ ...base, radiusM: '5' }).radiusM);
  assert.ok(validateSessionForm({ ...base, radiusM: '99999' }).radiusM);
  assert.ok(
    validateSessionForm({ ...base, startsAt: base.endsAt, endsAt: base.startsAt }).endsAt,
  );
});

test('validateAttendForm bat MSSV trong + ky tu la', () => {
  assert.ok(validateAttendForm('   ').studentCode);
  assert.ok(validateAttendForm('SV@001!').studentCode);
  assert.deepEqual(validateAttendForm('sv001'), {});
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { parseStudentRows, studentsToCsv } from '@checkin/shared';
import { createMemoryDb } from '../src/store/memory.store.js';
import { upsertStudents, listStudents } from '../src/services/student.service.js';
import { createSession, closeSession } from '../src/services/session.service.js';

test('parseStudentRows: loc dong loi, bao so dong excel', () => {
  const { imported, skipped } = parseStudentRows([
    { MSSV: ' sv001 ', HoTen: 'Nguyen Van A', Lop: 'CTK45' },
    { MSSV: 'SV001', HoTen: 'Trung trong file', Lop: 'CTK45' },
    { MSSV: '???', HoTen: 'Sai MSSV', Lop: 'CTK45' },
    { MSSV: 'SV003', HoTen: '', Lop: 'CTK45' },
  ]);
  assert.equal(imported.length, 1);
  assert.equal(imported[0].studentCode, 'SV001');
  assert.equal(skipped.length, 3);
});

test('upsertStudents + listStudents tim kiem theo ten/MSSV', () => {
  const db = createMemoryDb();
  upsertStudents(db, [{ studentCode: 'sv001', fullName: 'Nguyen Van A', className: 'CTK45' }]);
  upsertStudents(db, [{ studentCode: 'SV001', fullName: 'Nguyen Van Updated', className: 'CTK45' }]);
  assert.equal(db.students.size, 1);
  assert.equal(listStudents(db, 'updated').length, 1);
  assert.equal(listStudents(db, '').length, 1);
});

test('studentsToCsv xuat dung header Excel', () => {
  const csv = studentsToCsv([{ studentCode: 'SV001', fullName: 'A', className: 'CTK45' }]);
  assert.ok(csv.startsWith('MSSV,HoTen,Lop,Khoa,Email'));
  assert.ok(csv.includes('SV001'));
});

test('createSession validate gio + toa do, closeSession khoa QR cu', () => {
  const db = createMemoryDb();
  const now = Date.now();
  const session = createSession(db, {
    title: 'Toan R1',
    latCenter: 10.762622,
    lngCenter: 106.660172,
    radiusM: 2000,
    startsAt: new Date(now - 1000).toISOString(),
    endsAt: new Date(now + 3600_000).toISOString(),
  });
  assert.equal(session.radiusM, 2000);
  assert.throws(() =>
    createSession(db, {
      title: 'Sai gio',
      latCenter: 10,
      lngCenter: 106,
      startsAt: new Date(now + 3600_000).toISOString(),
      endsAt: new Date(now).toISOString(),
    }),
  );
  closeSession(db, session.id);
  assert.equal(db.sessions.get(session.id)?.status, 'closed');
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { parseStudentRows } from '@checkin/shared';

test('dashboard import map dung header Excel VN', () => {
  const { imported } = parseStudentRows([
    { MSSV: 'SV001', HoTen: 'A', Lop: 'CTK45', Khoa: 'CNTT', Email: 'a@x.vn' },
  ]);
  assert.equal(imported[0].studentCode, 'SV001');
  assert.equal(imported[0].email, 'a@x.vn');
});

test('dashboard export CSV mo duoc bang Excel', async () => {
  const { studentsToCsv } = await import('@checkin/shared');
  const csv = studentsToCsv([{ studentCode: 'SV001', fullName: 'A', className: 'CTK45' }]);
  assert.ok(csv.includes('MSSV,HoTen,Lop,Khoa,Email'));
});

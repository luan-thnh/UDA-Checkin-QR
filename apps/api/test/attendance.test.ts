import assert from 'node:assert/strict';
import test from 'node:test';
import { createMemoryDb, seedDemoData } from '../src/store/memory.store.js';
import { checkIn } from '../src/services/attendance.service.js';

const CENTER = { lat: 10.762622, lng: 106.660172 };

function freshDb() {
  const db = createMemoryDb();
  seedDemoData(db);
  return db;
}

test('check-in thanh cong khi trong 2km', () => {
  const result = checkIn(freshDb(), {
    sessionId: 'SS-DEMO-001',
    studentCode: 'sv001',
    lat: CENTER.lat,
    lng: CENTER.lng,
  });
  assert.equal(result.code, 'SUCCESS');
});

test('quét lại cùng QR + cùng MSSV -> ALREADY_CHECKED, không insert trùng', () => {
  const db = freshDb();
  const first = checkIn(db, { sessionId: 'SS-DEMO-001', studentCode: 'SV001', lat: CENTER.lat, lng: CENTER.lng });
  const second = checkIn(db, { sessionId: 'SS-DEMO-001', studentCode: 'SV001', lat: CENTER.lat, lng: CENTER.lng });
  assert.equal(first.code, 'SUCCESS');
  assert.equal(second.code, 'ALREADY_CHECKED');
  assert.equal(db.attendances.size, 1);
});

test('ngoài 2km -> OUT_OF_RANGE', () => {
  const result = checkIn(freshDb(), {
    sessionId: 'SS-DEMO-001',
    studentCode: 'SV001',
    lat: CENTER.lat + 0.05,
    lng: CENTER.lng,
  });
  assert.equal(result.code, 'OUT_OF_RANGE');
});

test('MSSV lạ -> STUDENT_NOT_FOUND', () => {
  const result = checkIn(freshDb(), {
    sessionId: 'SS-DEMO-001',
    studentCode: 'SV999',
    lat: CENTER.lat,
    lng: CENTER.lng,
  });
  assert.equal(result.code, 'STUDENT_NOT_FOUND');
});

test('session đóng -> SESSION_CLOSED', () => {
  const db = freshDb();
  const session = db.sessions.get('SS-DEMO-001');
  assert.ok(session);
  session.status = 'closed';
  const result = checkIn(db, {
    sessionId: 'SS-DEMO-001',
    studentCode: 'SV001',
    lat: CENTER.lat,
    lng: CENTER.lng,
  });
  assert.equal(result.code, 'SESSION_CLOSED');
});

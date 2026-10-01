import type { AttendanceRecord, CheckinSession, Student } from '@checkin/shared';

export interface MemoryDb {
  students: Map<string, Student>;
  sessions: Map<string, CheckinSession>;
  attendances: Map<string, AttendanceRecord>;
}

export function createMemoryDb(): MemoryDb {
  return { students: new Map(), sessions: new Map(), attendances: new Map() };
}

export function attendanceKey(sessionId: string, studentCode: string): string {
  return `${sessionId}::${studentCode}`;
}

export function seedDemoData(db: MemoryDb): void {
  // Empty - User requested no mock data
}

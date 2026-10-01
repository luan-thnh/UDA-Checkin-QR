import type { Student } from '@checkin/shared';
import { normalizeStudentCode } from '@checkin/shared';
import type { MemoryDb } from '../store/memory.store.js';

export function listStudents(db: MemoryDb, query: string): Student[] {
  const keyword = query.trim().toUpperCase();
  const all = [...db.students.values()];
  if (!keyword) return all.sort(byStudentCode);
  return all
    .filter(
      (student) =>
        student.studentCode.includes(keyword) ||
        student.fullName.toUpperCase().includes(keyword) ||
        student.className.toUpperCase().includes(keyword),
    )
    .sort(byStudentCode);
}

export function upsertStudents(db: MemoryDb, students: Student[]): { upserted: number } {
  for (const student of students) {
    db.students.set(normalizeStudentCode(student.studentCode), {
      ...student,
      studentCode: normalizeStudentCode(student.studentCode),
    });
  }
  return { upserted: students.length };
}

function byStudentCode(a: Student, b: Student): number {
  return a.studentCode.localeCompare(b.studentCode);
}

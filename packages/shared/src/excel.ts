import { normalizeStudentCode, isValidStudentCode } from './validate.js';
import type { Student } from './types.js';

export interface RawStudentRow {
  MSSV?: unknown;
  HoTen?: unknown;
  Lop?: unknown;
  Khoa?: unknown;
  Email?: unknown;
}

export interface ImportStudentsResult {
  imported: Student[];
  skipped: Array<{ row: number; reason: string }>;
}

export function parseStudentRows(rows: RawStudentRow[]): ImportStudentsResult {
  const imported: Student[] = [];
  const skipped: Array<{ row: number; reason: string }> = [];
  const seen = new Set<string>();

  rows.forEach((row, index) => {
    const rowNumber = index + 2;
    const code = normalizeStudentCode(String(row.MSSV ?? ''));
    const fullName = String(row.HoTen ?? '').trim();

    if (!isValidStudentCode(code)) {
      skipped.push({ row: rowNumber, reason: `MSSV khong hop le: ${String(row.MSSV ?? '')}` });
      return;
    }
    if (!fullName) {
      skipped.push({ row: rowNumber, reason: `Thieu HoTen cho MSSV ${code}` });
      return;
    }
    if (seen.has(code)) {
      skipped.push({ row: rowNumber, reason: `Trung MSSV ${code} trong file` });
      return;
    }
    seen.add(code);
    imported.push({
      studentCode: code,
      fullName,
      className: String(row.Lop ?? '').trim(),
      faculty: String(row.Khoa ?? '').trim() || undefined,
      email: String(row.Email ?? '').trim() || undefined,
    });
  });

  return { imported, skipped };
}

function escapeCsvCell(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export function studentsToCsv(students: Student[]): string {
  const header = 'MSSV,HoTen,Lop,Khoa,Email';
  const lines = students.map((student) =>
    [
      student.studentCode,
      student.fullName,
      student.className,
      student.faculty ?? '',
      student.email ?? '',
    ]
      .map(escapeCsvCell)
      .join(','),
  );
  return [header, ...lines].join('\n');
}

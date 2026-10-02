import * as XLSX from 'xlsx';
import type { RawStudentRow } from '@checkin/shared';

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/\s+/g, '');
}

const HEADER_MAP: Record<string, keyof RawStudentRow> = {
  mssv: 'MSSV',
  masinhvien: 'MSSV',
  hoten: 'HoTen',
  ten: 'HoTen',
  lop: 'Lop',
  class: 'Lop',
  monhoc: 'MonHoc',
  mon: 'MonHoc',
  subject: 'MonHoc',
  khoa: 'Khoa',
  email: 'Email',
};

export async function readStudentRowsFromFile(file: File): Promise<RawStudentRow[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new Error('File Excel không có sheet nào.');
  const sheet = workbook.Sheets[sheetName];
  const grid = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' }) as unknown[][];
  if (grid.length < 2) throw new Error('File cần ít nhất 1 dòng header + 1 dòng dữ liệu.');

  const headers = (grid[0] as unknown[]).map((cell) => HEADER_MAP[normalizeHeader(String(cell))] ?? null);
  return (grid.slice(1) as unknown[][])
    .filter((row) => row.some((cell) => String(cell).trim() !== ''))
    .map((row) => {
      const record: RawStudentRow = {};
      headers.forEach((key, index) => {
        if (key) record[key] = row[index] as string;
      });
      return record;
    });
}

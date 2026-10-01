import { normalizeStudentCode, isValidStudentCode } from './validate.js';
export function parseStudentRows(rows) {
    const imported = [];
    const skipped = [];
    const seen = new Set();
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
function escapeCsvCell(value) {
    return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}
export function studentsToCsv(students) {
    const header = 'MSSV,HoTen,Lop,Khoa,Email';
    const lines = students.map((student) => [
        student.studentCode,
        student.fullName,
        student.className,
        student.faculty ?? '',
        student.email ?? '',
    ]
        .map(escapeCsvCell)
        .join(','));
    return [header, ...lines].join('\n');
}

import * as XLSX from 'xlsx';
function normalizeHeader(header) {
    return header.trim().toLowerCase().replace(/\s+/g, '');
}
const HEADER_MAP = {
    mssv: 'MSSV',
    masinhvien: 'MSSV',
    hoten: 'HoTen',
    ten: 'HoTen',
    lop: 'Lop',
    class: 'Lop',
    khoa: 'Khoa',
    email: 'Email',
};
export async function readStudentRowsFromFile(file) {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName)
        throw new Error('File Excel không có sheet nào.');
    const sheet = workbook.Sheets[sheetName];
    const grid = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    if (grid.length < 2)
        throw new Error('File cần ít nhất 1 dòng header + 1 dòng dữ liệu.');
    const headers = grid[0].map((cell) => HEADER_MAP[normalizeHeader(String(cell))] ?? null);
    return grid.slice(1)
        .filter((row) => row.some((cell) => String(cell).trim() !== ''))
        .map((row) => {
        const record = {};
        headers.forEach((key, index) => {
            if (key)
                record[key] = row[index];
        });
        return record;
    });
}

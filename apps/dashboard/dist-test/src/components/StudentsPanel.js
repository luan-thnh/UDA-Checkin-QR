import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { downloadWithAuth, fetchStudents, importStudents } from '../services/api';
import { readStudentRowsFromFile } from '../utils/excel';
export function StudentsPanel() {
    const [query, setQuery] = useState('');
    const [students, setStudents] = useState([]);
    const [notice, setNotice] = useState('');
    const [loading, setLoading] = useState(false);
    async function reload(nextQuery = query) {
        setLoading(true);
        try {
            setStudents(await fetchStudents(nextQuery));
        }
        catch (error) {
            setNotice(error instanceof Error ? error.message : 'Lỗi tải SV.');
        }
        finally {
            setLoading(false);
        }
    }
    useEffect(() => {
        void reload('');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    async function handleFile(file) {
        if (!file)
            return;
        setNotice('Đang đọc file…');
        try {
            const rows = await readStudentRowsFromFile(file);
            const result = await importStudents(rows);
            setNotice(`Nhập ${result.imported} SV, bỏ qua ${result.skipped.length} dòng.` +
                (result.skipped.length ? ` VD: dòng ${result.skipped[0].row}: ${result.skipped[0].reason}` : ''));
            await reload('');
        }
        catch (error) {
            setNotice(error instanceof Error ? error.message : 'Import thất bại.');
        }
    }
    return (_jsxs("section", { children: [_jsxs("h3", { children: ["Sinh vi\u00EAn (", students.length, ")"] }), _jsxs("div", { style: { display: 'flex', gap: 8, flexWrap: 'wrap' }, children: [_jsx("input", { placeholder: "T\u00ECm MSSV / t\u00EAn / l\u1EDBp", value: query, onChange: (e) => {
                            setQuery(e.target.value);
                            void reload(e.target.value);
                        } }), _jsxs("label", { style: { border: '1px solid #ccc', padding: '4px 8px', cursor: 'pointer' }, children: ["Import Excel", _jsx("input", { type: "file", accept: ".xlsx,.xls,.csv", hidden: true, onChange: (e) => void handleFile(e.target.files?.[0]) })] }), _jsx("button", { onClick: () => downloadWithAuth('/api/students/export', 'danh-sach-sinh-vien.csv'), children: "Xu\u1EA5t Excel (CSV)" })] }), notice ? _jsx("p", { children: notice }) : null, loading ? _jsx("p", { children: "\u0110ang t\u1EA3i\u2026" }) : null, _jsxs("table", { border: 1, cellPadding: 6, style: { marginTop: 12, borderCollapse: 'collapse', width: '100%' }, children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "MSSV" }), _jsx("th", { children: "H\u1ECD t\u00EAn" }), _jsx("th", { children: "L\u1EDBp" }), _jsx("th", { children: "Khoa" })] }) }), _jsx("tbody", { children: students.map((student) => (_jsxs("tr", { children: [_jsx("td", { children: student.studentCode }), _jsx("td", { children: student.fullName }), _jsx("td", { children: student.className }), _jsx("td", { children: student.faculty ?? '' })] }, student.studentCode))) })] })] }));
}

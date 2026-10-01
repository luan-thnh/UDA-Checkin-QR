import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { downloadWithAuth, fetchStudents, importStudents } from '../services/api';
import { readStudentRowsFromFile } from '../utils/excel';
export function StudentsPanel() {
    const [query, setQuery] = useState('');
    const [students, setStudents] = useState([]);
    const [notice, setNotice] = useState('');
    const [noticeError, setNoticeError] = useState(false);
    const [loading, setLoading] = useState(false);
    async function reload(nextQuery = query) {
        setLoading(true);
        try {
            setStudents(await fetchStudents(nextQuery));
        }
        catch (error) {
            setNotice(error instanceof Error ? error.message : 'Lỗi tải SV.');
            setNoticeError(true);
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
        if (!/\.(xlsx|xls|csv)$/i.test(file.name)) {
            setNotice('Chỉ nhận file .xlsx, .xls, .csv.');
            setNoticeError(true);
            return;
        }
        setNotice('Đang đọc file…');
        setNoticeError(false);
        try {
            const rows = await readStudentRowsFromFile(file);
            if (rows.length === 0) {
                setNotice('File không có dòng dữ liệu nào.');
                setNoticeError(true);
                return;
            }
            if (rows.length > 5000) {
                setNotice('File quá lớn (tối đa 5000 SV / lần).');
                setNoticeError(true);
                return;
            }
            const result = await importStudents(rows);
            setNoticeError(result.skipped.length > 0 && result.imported === 0);
            setNotice(`Nhập ${result.imported} SV, bỏ qua ${result.skipped.length} dòng.` +
                (result.skipped.length
                    ? ` VD: dòng ${result.skipped[0].row}: ${result.skipped[0].reason}`
                    : ''));
            await reload('');
        }
        catch (error) {
            setNotice(error instanceof Error ? error.message : 'Import thất bại.');
            setNoticeError(true);
        }
    }
    return (_jsxs("section", { className: "card", children: [_jsxs("h3", { children: ["Sinh vi\u00EAn (", students.length, ")"] }), _jsxs("div", { className: "toolbar", children: [_jsx("input", { placeholder: "T\u00ECm MSSV / t\u00EAn / l\u1EDBp", value: query, onChange: (e) => {
                            setQuery(e.target.value);
                            void reload(e.target.value);
                        } }), _jsxs("label", { className: "btn btn-ghost", style: { cursor: 'pointer' }, children: ["Import Excel", _jsx("input", { type: "file", accept: ".xlsx,.xls,.csv", hidden: true, onChange: (e) => void handleFile(e.target.files?.[0]) })] }), _jsx("button", { className: "btn btn-ghost", onClick: () => downloadWithAuth('/api/students/export', 'danh-sach-sinh-vien.csv'), children: "Xu\u1EA5t Excel" })] }), notice ? _jsx("p", { className: noticeError ? 'notice error' : 'notice', children: notice }) : null, loading ? _jsx("p", { style: { color: 'var(--muted)' }, children: "\u0110ang t\u1EA3i\u2026" }) : null, students.length === 0 && !loading ? (_jsxs("p", { style: { color: 'var(--muted)' }, children: ["Ch\u01B0a c\u00F3 sinh vi\u00EAn n\u00E0o. B\u1EA5m ", _jsx("b", { children: "Import Excel" }), " \u0111\u1EC3 th\u00EAm danh s\u00E1ch l\u1EDBp."] })) : null, students.length > 0 ? (_jsxs("table", { className: "grid", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "MSSV" }), _jsx("th", { children: "H\u1ECD t\u00EAn" }), _jsx("th", { children: "L\u1EDBp" }), _jsx("th", { children: "Khoa" })] }) }), _jsx("tbody", { children: students.map((student) => (_jsxs("tr", { children: [_jsx("td", { children: _jsx("b", { children: student.studentCode }) }), _jsx("td", { children: student.fullName }), _jsx("td", { children: student.className }), _jsx("td", { children: student.faculty ?? '' })] }, student.studentCode))) })] })) : null] }));
}

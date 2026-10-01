import { useEffect, useState } from 'react';
import type { Student } from '@checkin/shared';
import { downloadWithAuth, fetchStudents, importStudents } from '../services/api';
import { readStudentRowsFromFile } from '../utils/excel';

export function StudentsPanel() {
  const [query, setQuery] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [notice, setNotice] = useState('');
  const [noticeError, setNoticeError] = useState(false);
  const [loading, setLoading] = useState(false);

  async function reload(nextQuery = query) {
    setLoading(true);
    try {
      setStudents(await fetchStudents(nextQuery));
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Lỗi tải SV.');
      setNoticeError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleFile(file: File | undefined) {
    if (!file) return;
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
      setNotice(
        `Nhập ${result.imported} SV, bỏ qua ${result.skipped.length} dòng.` +
          (result.skipped.length
            ? ` VD: dòng ${result.skipped[0].row}: ${result.skipped[0].reason}`
            : ''),
      );
      await reload('');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Import thất bại.');
      setNoticeError(true);
    }
  }

  return (
    <section className="card">
      <h3>Sinh viên ({students.length})</h3>
      <div className="toolbar">
        <input
          placeholder="Tìm MSSV / tên / lớp"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            void reload(e.target.value);
          }}
        />
        <label className="btn btn-ghost" style={{ cursor: 'pointer' }}>
          Import Excel
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            hidden
            onChange={(e) => void handleFile(e.target.files?.[0])}
          />
        </label>
        <button
          className="btn btn-ghost"
          onClick={() => downloadWithAuth('/api/students/export', 'danh-sach-sinh-vien.csv')}
        >
          Xuất Excel
        </button>
      </div>
      {notice ? <p className={noticeError ? 'notice error' : 'notice'}>{notice}</p> : null}
      {loading ? <p style={{ color: 'var(--muted)' }}>Đang tải…</p> : null}
      {students.length === 0 && !loading ? (
        <p style={{ color: 'var(--muted)' }}>
          Chưa có sinh viên nào. Bấm <b>Import Excel</b> để thêm danh sách lớp.
        </p>
      ) : null}
      {students.length > 0 ? (
        <table className="grid">
          <thead>
            <tr>
              <th>MSSV</th>
              <th>Họ tên</th>
              <th>Lớp</th>
              <th>Khoa</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr key={student.studentCode}>
                <td>
                  <b>{student.studentCode}</b>
                </td>
                <td>{student.fullName}</td>
                <td>{student.className}</td>
                <td>{student.faculty ?? ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </section>
  );
}

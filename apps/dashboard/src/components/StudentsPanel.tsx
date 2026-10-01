import { useEffect, useState } from 'react';
import type { Student } from '@checkin/shared';
import { downloadWithAuth, fetchStudents, importStudents } from '../services/api';
import { readStudentRowsFromFile } from '../utils/excel';

export function StudentsPanel() {
  const [query, setQuery] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);

  async function reload(nextQuery = query) {
    setLoading(true);
    try {
      setStudents(await fetchStudents(nextQuery));
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Lỗi tải SV.');
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
    setNotice('Đang đọc file…');
    try {
      const rows = await readStudentRowsFromFile(file);
      const result = await importStudents(rows);
      setNotice(`Nhập ${result.imported} SV, bỏ qua ${result.skipped.length} dòng.` +
        (result.skipped.length ? ` VD: dòng ${result.skipped[0].row}: ${result.skipped[0].reason}` : ''));
      await reload('');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Import thất bại.');
    }
  }

  return (
    <section>
      <h3>Sinh viên ({students.length})</h3>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <input
          placeholder="Tìm MSSV / tên / lớp"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            void reload(e.target.value);
          }}
        />
        <label style={{ border: '1px solid #ccc', padding: '4px 8px', cursor: 'pointer' }}>
          Import Excel
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            hidden
            onChange={(e) => void handleFile(e.target.files?.[0])}
          />
        </label>
        <button onClick={() => downloadWithAuth('/api/students/export', 'danh-sach-sinh-vien.csv')}>
          Xuất Excel (CSV)
        </button>
      </div>
      {notice ? <p>{notice}</p> : null}
      {loading ? <p>Đang tải…</p> : null}
      <table border={1} cellPadding={6} style={{ marginTop: 12, borderCollapse: 'collapse', width: '100%' }}>
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
              <td>{student.studentCode}</td>
              <td>{student.fullName}</td>
              <td>{student.className}</td>
              <td>{student.faculty ?? ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

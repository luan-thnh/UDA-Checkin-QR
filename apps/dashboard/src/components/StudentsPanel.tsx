import { useEffect, useState, useMemo } from 'react';
import type { Student } from '@checkin/shared';
import { downloadWithAuth, fetchStudents, importStudents } from '../services/api';
import { readStudentRowsFromFile } from '../utils/excel';
import { Search, Upload, Download, Filter, Info, Users, FileDown, ChevronLeft, ChevronRight } from 'lucide-react';

export function StudentsPanel() {
  const [query, setQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [notice, setNotice] = useState('');
  const [noticeError, setNoticeError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  async function reload(nextQuery = query) {
    setLoading(true);
    try {
      setStudents(await fetchStudents(nextQuery));
      setCurrentPage(1);
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

  const uniqueClasses = useMemo(() => {
    const cls = new Set(students.map(s => s.className).filter(Boolean));
    return Array.from(cls).sort();
  }, [students]);

  const filteredStudents = useMemo(() => {
    if (!selectedClass) return students;
    return students.filter(s => s.className === selectedClass);
  }, [students, selectedClass]);

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage) || 1;
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredStudents.slice(start, start + itemsPerPage);
  }, [filteredStudents, currentPage]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Danh sách Sinh viên</h2>
          <p className="text-slate-500 mt-1">Quản lý và cập nhật thông tin sinh viên từ Excel</p>
        </div>
      </div>

      <div className="card">
        <div className="p-4 border-b border-slate-100 flex flex-wrap gap-4 justify-between items-end bg-slate-50/50">
          <div className="flex flex-wrap gap-4 flex-1">
            <div className="relative w-full max-w-[280px]">
              <label className="label text-xs uppercase tracking-wider text-slate-500 font-semibold">Tìm kiếm</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={16} className="text-slate-400" />
                </div>
                <input
                  type="text"
                  className="input pl-10"
                  placeholder="MSSV / Tên..."
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    void reload(e.target.value);
                  }}
                />
              </div>
            </div>

            <div className="relative w-48">
              <label className="label text-xs uppercase tracking-wider text-slate-500 font-semibold">Lọc Lớp</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Filter size={16} className="text-slate-400" />
                </div>
                <select 
                  className="input pl-10 appearance-none bg-white"
                  value={selectedClass}
                  onChange={e => {
                    setSelectedClass(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="">Tất cả các lớp</option>
                  {uniqueClasses.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button className="btn btn-outline" onClick={() => downloadWithAuth('/api/students/template', 'template-danh-sach.csv')}>
              <FileDown size={16} className="mr-2" /> Tải file mẫu
            </button>
            <label className="btn btn-primary cursor-pointer shadow-md shadow-primary/20">
              <Upload size={16} className="mr-2" /> Import Excel
              <input type="file" accept=".xlsx,.xls,.csv" hidden onChange={(e) => void handleFile(e.target.files?.[0])} />
            </label>
            <button className="btn btn-outline" onClick={() => downloadWithAuth('/api/students/export', 'danh-sach-sinh-vien.csv')}>
              <Download size={16} className="mr-2" /> Xuất Excel
            </button>
          </div>
        </div>

        {notice ? (
          <div className={`px-4 py-3 border-b flex items-center gap-2 ${noticeError ? 'bg-danger-tint text-danger border-danger/20' : 'bg-success-tint text-success-700 border-success/20'}`}>
            <Info size={18} /> <span className="font-medium text-sm">{notice}</span>
          </div>
        ) : null}

        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-12 text-center text-slate-500">Đang tải dữ liệu...</div>
          ) : filteredStudents.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center text-slate-500">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <Users size={32} className="text-slate-300" />
              </div>
              <p className="text-lg font-medium text-slate-700 mb-1">Chưa có sinh viên nào</p>
              <p className="text-sm">Bấm <b>Tải file mẫu</b> sau đó <b>Import Excel</b> để thêm danh sách lớp.</p>
            </div>
          ) : (
            <>
              <table className="w-full text-sm text-left">
                <thead>
                  <tr>
                    <th className="table-th w-32">MSSV</th>
                    <th className="table-th">Họ và tên</th>
                    <th className="table-th w-40">Lớp</th>
                    <th className="table-th w-64">Khoa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedStudents.map((student) => (
                    <tr key={student.studentCode} className="hover:bg-slate-50/50 transition-colors">
                      <td className="table-td font-semibold text-slate-800">{student.studentCode}</td>
                      <td className="table-td font-medium text-slate-700">{student.fullName}</td>
                      <td className="table-td text-slate-600">
                        <span className="inline-flex bg-slate-100 px-2 py-0.5 rounded-full text-xs font-semibold text-slate-600 border border-slate-200">
                          {student.className}
                        </span>
                      </td>
                      <td className="table-td text-slate-500">{student.faculty || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                <span className="text-sm text-slate-500">
                  Hiển thị {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredStudents.length)} / {filteredStudents.length} sinh viên
                </span>
                <div className="flex gap-2">
                  <button 
                    disabled={currentPage === 1} 
                    onClick={() => setCurrentPage(p => p - 1)}
                    className="btn btn-outline px-2 py-1 disabled:opacity-50"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button 
                    disabled={currentPage === totalPages} 
                    onClick={() => setCurrentPage(p => p + 1)}
                    className="btn btn-outline px-2 py-1 disabled:opacity-50"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

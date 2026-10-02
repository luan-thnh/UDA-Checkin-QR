import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Student } from '@checkin/shared';
import { fetchStudents, importStudents, downloadWithAuth } from '../services/api';
import { Search, Filter, FileDown, Upload, Download, Info, Users, Trash2, ChevronLeft, ChevronRight, X, Clock, MapPin, CheckCircle2 } from 'lucide-react';

import { request } from '../services/api';

// Reusable fetcher for getting all attendances to filter by student
async function fetchAllAttendances() {
  const res = await request<any>('/api/attendances');
  return res.data || [];
}

export function StudentsPanel() {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const [notice, setNotice] = useState('');
  const [noticeError, setNoticeError] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Queries
  const { data: students = [], isLoading: loading } = useQuery({
    queryKey: ['students'],
    queryFn: () => fetchStudents(''),
  });

  const { data: allAttendances = [] } = useQuery({
    queryKey: ['attendances'],
    queryFn: fetchAllAttendances,
    enabled: !!selectedStudent, // Only fetch when a student is selected to save bandwidth
  });

  // Mutations
  const deleteStudentMutation = useMutation({
    mutationFn: async (studentCode: string) => {
      const { deleteStudent } = await import('../services/api');
      return deleteStudent(studentCode);
    },
    onMutate: async (deletedCode) => {
      await queryClient.cancelQueries({ queryKey: ['students'] });
      const previous = queryClient.getQueryData<Student[]>(['students']);
      // Optimistic update: remove immediately
      queryClient.setQueryData<Student[]>(['students'], old => (old ?? []).filter(s => s.studentCode !== deletedCode));
      return { previous };
    },
    onError: (err, _, context) => {
      queryClient.setQueryData(['students'], context?.previous);
      setNotice(err instanceof Error ? err.message : 'Lỗi xóa sinh viên');
      setNoticeError(true);
    },
    onSuccess: (_, deletedCode) => {
      setNotice(`Đã xóa sinh viên ${deletedCode}`);
      setNoticeError(false);
    }
  });

  const deleteClassMutation = useMutation({
    mutationFn: async (cls: string) => {
      const { deleteClass } = await import('../services/api');
      return deleteClass(cls);
    },
    onSuccess: (res, cls) => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setNotice(`Đã xóa thành công ${res.deleted} sinh viên lớp ${cls}`);
      setNoticeError(false);
      setSelectedClass('');
    },
    onError: (err) => {
      setNotice(err instanceof Error ? err.message : 'Lỗi xóa lớp');
      setNoticeError(true);
    }
  });

  const uniqueClasses = useMemo(() => {
    const cls = new Set(students.map(s => s.className).filter(Boolean));
    return Array.from(cls).sort();
  }, [students]);

  const filteredStudents = useMemo(() => {
    let result = students;
    if (selectedClass) {
      result = result.filter(s => s.className === selectedClass);
    }
    if (query) {
      const q = query.toLowerCase();
      result = result.filter(s => 
        s.studentCode.toLowerCase().includes(q) || 
        s.fullName.toLowerCase().includes(q) ||
        (s.subject && s.subject.toLowerCase().includes(q)) ||
        (s.faculty && s.faculty.toLowerCase().includes(q))
      );
    }
    return result;
  }, [students, query, selectedClass]);

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / itemsPerPage));
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredStudents.slice(start, start + itemsPerPage);
  }, [filteredStudents, currentPage, itemsPerPage]);

  const studentHistory = useMemo(() => {
    if (!selectedStudent) return [];
    return allAttendances.filter((a: any) => a.studentCode === selectedStudent.studentCode);
  }, [selectedStudent, allAttendances]);

  async function handleFile(file?: File) {
    if (!file) return;
    try {
      setNotice('Đang đọc file Excel...');
      setNoticeError(false);
      const { readStudentRowsFromFile } = await import('../utils/excel');
      const rows = await readStudentRowsFromFile(file);
      
      setNotice('Đang lưu vào hệ thống...');
      const res = await importStudents(rows);
      setNotice(`Import thành công ${res.imported} sinh viên.`);
      queryClient.invalidateQueries({ queryKey: ['students'] });
    } catch (e) {
      setNotice(e instanceof Error ? e.message : 'Import thất bại');
      setNoticeError(true);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Quản lý Sinh Viên</h2>
          <p className="text-slate-500 mt-1">Quản lý danh sách và Import từ Excel</p>
        </div>
      </div>

      <div className="card">
        <div className="p-4 border-b border-slate-100 flex flex-wrap gap-4 justify-between items-center bg-slate-50/50">
          <div className="flex flex-wrap gap-4 w-full md:w-auto flex-1">
            <div className="relative w-full md:w-80">
              <label className="label text-xs uppercase tracking-wider text-slate-500 font-semibold">Tìm Kiếm</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={16} className="text-slate-400" />
                </div>
                <input
                  type="text"
                  className="input pl-10 bg-white"
                  placeholder="Tên, MSSV, Môn học, Khoa..."
                  value={query}
                  onChange={e => {
                    setQuery(e.target.value);
                    setCurrentPage(1);
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
            <label className="btn bg-primary text-white hover:bg-primary-dark cursor-pointer shadow-md shadow-primary/20">
              <Upload size={16} className="mr-2" /> Import Excel
              <input type="file" accept=".xlsx,.xls,.csv" hidden onChange={(e) => void handleFile(e.target.files?.[0])} />
            </label>
            <button className="btn btn-outline" onClick={() => downloadWithAuth('/api/students?action=export', 'danh-sach-sinh-vien.csv')}>
              <Download size={16} className="mr-2" /> Xuất Excel
            </button>
          </div>
        </div>

        {notice && (
          <div className={`px-4 py-3 border-b flex items-center gap-2 ${noticeError ? 'bg-danger-tint text-danger border-danger/20' : 'bg-success-tint text-success-700 border-success/20'}`}>
            <Info size={18} /> <span className="font-medium text-sm">{notice}</span>
          </div>
        )}

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
                    <th className="table-th w-40">Môn học</th>
                    <th className="table-th w-64">Khoa</th>
                    <th className="table-th w-24 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedStudents.map((student) => (
                    <tr 
                      key={student.studentCode} 
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={() => setSelectedStudent(student)}
                    >
                      <td className="table-td font-semibold text-slate-800">{student.studentCode}</td>
                      <td className="table-td font-medium text-slate-700">{student.fullName}</td>
                      <td className="table-td text-slate-600">
                        <span className="inline-flex bg-slate-100 px-2 py-0.5 rounded-full text-xs font-semibold text-slate-600 border border-slate-200">
                          {student.className}
                        </span>
                      </td>
                      <td className="table-td text-slate-600">{student.subject || '-'}</td>
                      <td className="table-td text-slate-500">{student.faculty || '-'}</td>
                      <td className="table-td text-right">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation(); // Ngăn click row khi bấm xoá
                            if (confirm(`Bạn có chắc muốn xóa sinh viên ${student.fullName} không?`)) {
                              deleteStudentMutation.mutate(student.studentCode);
                            }
                          }}
                          className="text-danger/70 hover:text-danger hover:bg-danger-tint p-1.5 rounded-md transition-colors" title="Xóa sinh viên"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                <span className="text-sm text-slate-500">
                  Hiển thị {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredStudents.length)} / {filteredStudents.length} sinh viên
                </span>
                <div className="flex gap-2 items-center">
                  {selectedClass && (
                    <button 
                      onClick={() => {
                        if (confirm(`CẢNH BÁO: Xóa TOÀN BỘ sinh viên lớp ${selectedClass}?`)) {
                          deleteClassMutation.mutate(selectedClass);
                        }
                      }}
                      className="btn btn-ghost text-danger border border-danger/20 hover:bg-danger hover:text-white px-3 py-1 mr-4"
                    >
                      <Trash2 size={16} className="mr-1.5" /> Xóa lớp {selectedClass}
                    </button>
                  )}
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

      {/* Student Detail Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-200" onClick={() => setSelectedStudent(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-primary p-5 flex justify-between items-start text-white">
              <div>
                <h3 className="text-xl font-bold">{selectedStudent.fullName}</h3>
                <div className="text-primary-light text-sm mt-1 flex gap-4">
                  <span>MSSV: {selectedStudent.studentCode}</span>
                  <span>Lớp: {selectedStudent.className}</span>
                  {selectedStudent.subject && <span>Môn học: {selectedStudent.subject}</span>}
                  {selectedStudent.faculty && <span>Khoa: {selectedStudent.faculty}</span>}
                </div>
              </div>
              <button className="text-white/70 hover:text-white transition-colors" onClick={() => setSelectedStudent(null)}>
                <X size={24} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto bg-slate-50">
              <div className="p-5">
                <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-accent" /> 
                  Lịch sử điểm danh ({studentHistory.length} lượt)
                </h4>
                
                {studentHistory.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 bg-white rounded-xl border border-slate-100">
                    Sinh viên này chưa có lượt điểm danh nào.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {studentHistory.map((hist: any) => (
                      <div key={hist.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex justify-between items-center hover:border-accent/30 transition-colors">
                        <div>
                          <div className="font-semibold text-slate-800 text-base mb-1">
                            {hist.sessionTitle}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
                            {hist.sessionSubject && <span className="text-accent bg-accent-tint px-2 py-0.5 rounded-full">{hist.sessionSubject}</span>}
                            <span className="flex items-center gap-1"><Clock size={12} /> {new Date(hist.checkedAt).toLocaleString('vi-VN')}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="inline-flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-full text-xs font-semibold text-slate-600">
                            <MapPin size={12} className="text-primary" /> {hist.distanceM}m
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

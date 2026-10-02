import { useEffect, useState, useMemo } from 'react';
import type { Student, CheckinSession } from '@checkin/shared';
import { fetchStudents, fetchSessions, fetchAllAttendances, deleteAttendance } from '../services/api';
import { toast } from "sonner";
import { Search, Filter, CalendarDays, CheckCircle2, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';

export function ReportsPanel() {
  const [students, setStudents] = useState<Student[]>([]);
  const [sessions, setSessions] = useState<CheckinSession[]>([]);
  const [attendances, setAttendances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const handleDeleteAttendance = async (sessionId: string, studentCode: string, studentName: string) => {
    if (!window.confirm(`Xóa lượt điểm danh của sinh viên ${studentName}?\n(Hành động này cũng sẽ gỡ Device ID giúp thiết bị đó có thể điểm danh lại)`)) return;
    
    try {
      await deleteAttendance(sessionId, studentCode);
      setAttendances(prev => prev.filter(a => !(a.sessionId === sessionId && a.studentCode === studentCode)));
      toast.success('Đã xóa lượt điểm danh và giải phóng thiết bị!');
    } catch (err: any) {
      toast.error('Lỗi khi xóa: ' + err.message);
    }
  };

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [stData, ssData, attData] = await Promise.all([
          fetchStudents(''),
          fetchSessions(),
          fetchAllAttendances()
        ]);
        setStudents(stData);
        setSessions(ssData);
        setAttendances(attData);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Lỗi tải báo cáo');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const uniqueClasses = useMemo(() => {
    const cls = new Set(students.map(s => s.className).filter(Boolean));
    return Array.from(cls).sort();
  }, [students]);

  const uniqueSubjects = useMemo(() => {
    const subj = new Set(sessions.map(s => s.subject).filter(Boolean));
    return Array.from(subj).sort();
  }, [sessions]);

  // Filter students based on search and class
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchClass = selectedClass ? s.className === selectedClass : true;
      const matchSearch = searchQuery ? 
        (s.studentCode.toLowerCase().includes(searchQuery.toLowerCase()) || 
         s.fullName.toLowerCase().includes(searchQuery.toLowerCase())) : true;
      return matchClass && matchSearch;
    });
  }, [students, selectedClass, searchQuery]);

  // Filter sessions based on subject
  const filteredSessions = useMemo(() => {
    let list = sessions;
    if (selectedSubject) {
      list = list.filter(s => s.subject === selectedSubject);
    }
    return list.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  }, [sessions, selectedSubject]);

  // Map attendances for O(1) lookup: key = `${studentCode}_${sessionId}`
  const attendanceMap = useMemo(() => {
    const map = new Map<string, any>();
    for (const att of attendances) {
      map.set(`${att.studentCode}_${att.sessionId}`, att);
    }
    return map;
  }, [attendances]);
  
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage) || 1;
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredStudents.slice(start, start + itemsPerPage);
  }, [filteredStudents, currentPage]);

  if (loading) {
    return <div className="text-slate-500 py-12 text-center">Đang tải dữ liệu báo cáo...</div>;
  }

  if (error) {
    return <div className="text-danger bg-danger-tint p-4 rounded-lg">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Báo cáo lịch sử điểm danh</h2>
          <p className="text-slate-500 mt-1">Xem chi tiết tình trạng điểm danh của sinh viên qua các phiên</p>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="label text-xs uppercase tracking-wider text-slate-500 font-semibold">Tìm kiếm</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-slate-400" />
              </div>
              <input
                type="text"
                className="input pl-10"
                placeholder="Tìm MSSV hoặc Tên..."
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>
          
          <div className="w-48">
            <label className="label text-xs uppercase tracking-wider text-slate-500 font-semibold">Lọc theo Lớp</label>
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

          <div className="w-48">
            <label className="label text-xs uppercase tracking-wider text-slate-500 font-semibold">Lọc theo Môn</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <CalendarDays size={16} className="text-slate-400" />
              </div>
              <select 
                className="input pl-10 appearance-none bg-white"
                value={selectedSubject}
                onChange={e => setSelectedSubject(e.target.value)}
              >
                <option value="">Tất cả môn học</option>
                {uniqueSubjects.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="card overflow-x-auto">
        {filteredStudents.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            Không tìm thấy sinh viên nào phù hợp với bộ lọc.
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            Chưa có phiên điểm danh nào cho môn học này.
          </div>
        ) : (
          <>
            <table className="w-full min-w-max text-sm text-left">
              <thead>
                <tr>
                  <th className="table-th sticky left-0 z-20 bg-slate-50 min-w-[220px] shadow-[1px_0_0_0_#e2e8f0]">Sinh viên</th>
                  <th className="table-th text-center">Lớp</th>
                  {filteredSessions.map(session => (
                    <th key={session.id} className="table-th text-center min-w-[120px]">
                      <div className="font-semibold text-slate-700 whitespace-nowrap" title={session.title}>
                        {session.title}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {session.startsAt && !isNaN(new Date(session.startsAt).getTime()) 
                          ? new Date(session.startsAt).toLocaleDateString('vi-VN') 
                          : ''}
                      </div>
                    </th>
                  ))}
                  <th className="table-th text-center sticky right-0 z-20 bg-primary-light text-primary-dark shadow-[-1px_0_0_0_#e2e8f0]">Tổng</th>
                </tr>
              </thead>
              <tbody>
                {paginatedStudents.map(student => {
                  let presentCount = 0;
                  
                  return (
                    <tr key={student.studentCode} className="hover:bg-slate-50/50 transition-colors">
                      <td className="table-td sticky left-0 z-10 bg-white shadow-[1px_0_0_0_#e2e8f0] group-hover:bg-slate-50/50">
                        <div className="font-semibold text-slate-800 whitespace-nowrap">{student.fullName}</div>
                        <div className="text-xs text-slate-500 font-mono">{student.studentCode}</div>
                      </td>
                      <td className="table-td text-center text-slate-600">{student.className}</td>
                      
                      {filteredSessions.map(session => {
                        const att = attendanceMap.get(`${student.studentCode}_${session.id}`);
                        if (att) presentCount++;
                        
                        return (
                          <td key={session.id} className="table-td text-center p-0">
                            <div 
                              className="flex items-center justify-center h-full w-full py-3 cursor-pointer hover:bg-danger/5 transition-colors" 
                              title={att ? `Điểm danh lúc: ${new Date(att.checkedAt).toLocaleString('vi-VN')}\n(Click để xóa)` : 'Vắng'}
                              onClick={() => att ? handleDeleteAttendance(session.id, student.studentCode, student.fullName) : null}
                            >
                              {att ? (
                                <CheckCircle2 size={20} className="text-primary hover:text-danger transition-colors" />
                              ) : (
                                <XCircle size={20} className="text-slate-200" />
                              )}
                            </div>
                          </td>
                        );
                      })}
                      <td className="table-td text-center font-bold text-slate-700 sticky right-0 z-10 bg-slate-50 shadow-[-1px_0_0_0_#e2e8f0]">
                        {presentCount} / {filteredSessions.length}
                      </td>
                    </tr>
                  );
                })}
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
  );
}

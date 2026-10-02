import { Suspense, useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { buildSessionDeepLink, type CheckinSession } from '@checkin/shared';
import { QRCodeSVG } from 'qrcode.react';
import { closeSession, downloadWithAuth, fetchAttendances, fetchSessions, type AttendanceListData, type CreatedSession } from '../services/api';
import { QrCode, Plus, Search, MapPin, Clock, Copy, Download, PowerOff, List, CheckCircle2, Users, Trash2, Loader2, Globe, Smartphone } from 'lucide-react';
import { CreateSessionForm } from './CreateSessionForm';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

export function SessionsPanel() {
  const queryClient = useQueryClient();

  const { data: sessions = [], isLoading: loadingSessions } = useQuery<CheckinSession[]>({ queryKey: ['sessions'], queryFn: fetchSessions });
  

  const [query, setQuery] = useState('');

  const deleteSessionMutation = useMutation({
    mutationFn: async (id: string) => {
      const { deleteSession } = await import('../services/api');
      return deleteSession(id);
    },
    onSuccess: () => {
      toast.success('Đã xóa phiên điểm danh');
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Lỗi xóa phiên')
  });

  const closeSessionMutation = useMutation({
    mutationFn: (id: string) => closeSession(id),
    onSuccess: () => {
      toast.success('Đã kết thúc phiên điểm danh');
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Lỗi kết thúc phiên')
  });
  

  // Modals / Overlays
  const [qrSession, setQrSession] = useState<CreatedSession | CheckinSession | null>(null);
  const [detail, setDetail] = useState<AttendanceListData | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const [qrMode, setQrMode] = useState<'web' | 'miniapp'>(() => {
    return (localStorage.getItem('checkin_qr_mode') as 'web' | 'miniapp') || 'web';
  });

  const handleQrModeChange = (mode: 'web' | 'miniapp') => {
    setQrMode(mode);
    localStorage.setItem('checkin_qr_mode', mode);
  };


  const filteredSessions = useMemo(() => {
    if (!query) return sessions;
    const q = query.toLowerCase();
    return sessions.filter(s => 
      s.title.toLowerCase().includes(q) || 
      (s.subject && s.subject.toLowerCase().includes(q)) || 
      (s.className && s.className.toLowerCase().includes(q)) || 
      s.id.toLowerCase().includes(q)
    );
  }, [sessions, query]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Quản lý Phiên Điểm Danh</h2>
          <p className="text-slate-500 mt-1">Tạo mã QR và theo dõi điểm danh realtime</p>
        </div>
        <div className="flex bg-slate-100 rounded-lg p-1 mr-4">
          <button 
            className={`px-3 py-1.5 text-sm font-medium rounded-md flex items-center gap-1.5 transition-all ${qrMode === 'web' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => handleQrModeChange('web')}
          >
            <Globe size={14} /> Web
          </button>
          <button 
            className={`px-3 py-1.5 text-sm font-medium rounded-md flex items-center gap-1.5 transition-all ${qrMode === 'miniapp' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => handleQrModeChange('miniapp')}
          >
            <Smartphone size={14} /> Zalo Mini App
          </button>
        </div>
        <button className="btn bg-primary text-white hover:bg-primary-dark focus:ring-primary shadow-md shadow-primary/20" onClick={() => setIsCreating(!isCreating)}>
          <Plus size={18} className="mr-2" /> Tạo Phiên Mới
        </button>
      </div>

      {isCreating && (
        <CreateSessionForm 
          onCreated={(session) => {
            setQrSession(session);
            setIsCreating(false);
          }}
          onCancel={() => setIsCreating(false)}
        />
      )}

      <div className="card">
        <div className="p-4 border-b border-slate-100 flex flex-wrap gap-4 justify-between items-center bg-slate-50/50">
          <div className="relative w-full md:w-80">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-slate-400" />
            </div>
            <input
              type="text"
              className="input pl-10"
              placeholder="Tìm theo tên phiên, môn học..."
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>
          <div className="text-sm font-medium text-slate-500">
            Tổng cộng: <span className="text-slate-800">{filteredSessions.length}</span> phiên
          </div>
        </div>

        
        
        {loadingSessions ? (
          <div className="p-12 text-center text-slate-500">Đang tải danh sách...</div>
        ) : filteredSessions.length === 0 ? (
          <div className="p-12 text-center text-slate-500">Không có phiên nào.</div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {filteredSessions.map((session) => (
              <li key={session.id} className="p-5 hover:bg-slate-50 transition-colors flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className="font-bold text-slate-800 text-lg">{session.title}</h4>
                    {(() => {
                      const isExpired = session.endsAt && !isNaN(new Date(session.endsAt).getTime()) && new Date(session.endsAt) < new Date();
                      const isActive = session.status === 'active' && !isExpired;
                      return (
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${isActive ? 'bg-accent-tint text-accent border border-accent/20' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                          {isActive ? 'Đang mở' : 'Đã đóng'}
                        </span>
                      );
                    })()}
                  </div>
                  <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500 mt-2">
                    {session.className && (
                      <span className="flex items-center gap-1.5"><Users size={14} /> Lớp: <strong className="text-slate-700">{session.className}</strong></span>
                    )}
                    {session.subject && (
                      <span className="flex items-center gap-1.5"><List size={14} /> Môn: <strong className="text-slate-700">{session.subject}</strong></span>
                    )}
                    <span className="flex items-center gap-1.5"><MapPin size={14} /> {session.radiusM}m</span>
                    <span className="flex items-center gap-1.5">
                      <Clock size={14} /> 
                      {session.endsAt && !isNaN(new Date(session.endsAt).getTime()) ? (
                        <>Hết hạn: {new Date(session.endsAt).toLocaleTimeString('vi-VN', {hour:'2-digit', minute:'2-digit'})} {new Date(session.endsAt).toLocaleDateString('vi-VN')}</>
                      ) : (
                        <>Không rõ thời hạn</>
                      )}
                    </span>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                  <button className="btn btn-outline text-primary hover:bg-primary-light/50 border-primary/30" onClick={() => setQrSession(session)}>
                    <QrCode size={16} className="mr-2" /> QR
                  </button>
                  <button className="btn btn-ghost" onClick={() => fetchAttendances(session.id).then(setDetail).catch(() => alert('Lỗi tải dữ liệu'))}>
                    <List size={16} className="mr-2" /> Live
                  </button>
                  <button className="btn btn-ghost" onClick={() => downloadWithAuth(`/api/sessions/${session.id}?action=export`, `diem-danh-${session.id}.csv`)}>
                    <Download size={16} className="mr-2" /> Xuất
                  </button>
                  {session.status === 'active' && (
                    <button 
                      className="btn btn-ghost text-slate-500 hover:bg-slate-100 disabled:opacity-50" 
                      disabled={closeSessionMutation.isPending}
                      onClick={() => closeSessionMutation.mutate(session.id)}
                    >
                      {closeSessionMutation.isPending && closeSessionMutation.variables === session.id ? <Loader2 size={16} className="mr-2 animate-spin" /> : <PowerOff size={16} className="mr-2" />} 
                      {closeSessionMutation.isPending && closeSessionMutation.variables === session.id ? 'Đang đóng' : 'Đóng'}
                    </button>
                  )}
                  <button 
                    className="btn btn-ghost text-danger hover:bg-danger-tint disabled:opacity-50" 
                    disabled={deleteSessionMutation.isPending}
                    onClick={() => {
                      if (!confirm(`Bạn có chắc muốn xóa vĩnh viễn phiên "${session.title}" không? Thao tác này sẽ xóa cả dữ liệu điểm danh của phiên này!`)) return;
                      deleteSessionMutation.mutate(session.id);
                    }}
                  >
                    {deleteSessionMutation.isPending && deleteSessionMutation.variables === session.id ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Trash2 size={16} className="mr-2" />} 
                    {deleteSessionMutation.isPending && deleteSessionMutation.variables === session.id ? 'Đang xóa' : 'Xóa'}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* QR Code Modal Overlay */}
      {qrSession && (
        (() => {
          const actualQrPayload = qrMode === 'web' 
            ? `${window.location.origin}/c/${qrSession.id}` 
            : (qrSession.qrPayload ?? buildSessionDeepLink(import.meta.env.VITE_MINI_APP_ID || '4134446949382821265', qrSession.id));
          return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-primary p-6 text-center text-white">
              <h3 className="text-xl font-bold">{qrSession.title}</h3>
              {qrSession.subject && <p className="opacity-90 text-sm mt-1">{qrSession.subject}</p>}
            </div>
            <div className="p-8 flex flex-col items-center">
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <Suspense fallback={<div className="w-64 h-64 bg-slate-100 animate-pulse rounded-lg"></div>}>
                  <QRCodeSVG 
                    value={actualQrPayload} 
                    size={256} 
                  />
                </Suspense>
              </div>
              <p className="mt-6 text-sm text-slate-500 font-mono bg-slate-50 px-4 py-2 rounded-lg border border-slate-200 flex items-center gap-2">
                ID: {qrSession.id.substring(0, 8)}...
                <button 
                  className="hover:text-primary transition-colors" 
                  title="Copy payload" 
                  onClick={() => {
                    navigator.clipboard.writeText(actualQrPayload);
                    toast.success('Đã copy mã QR Payload');
                  }}
                >
                  <Copy size={14}/>
                </button>
              </p>
              <button className="btn btn-primary w-full mt-6" onClick={() => setQrSession(null)}>Đóng lại</button>
            </div>
          </div>
        </div>
      );
    })()
  )}

      {/* Live Detail Modal */}
      {detail && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-lg font-bold text-slate-800">{detail.session.title}</h3>
                <p className="text-sm text-slate-500 font-medium mt-0.5 flex items-center gap-1.5"><CheckCircle2 size={14} className="text-primary"/> Đã check-in: <strong className="text-slate-800">{detail.total}</strong> sinh viên</p>
              </div>
              <button className="btn btn-ghost" onClick={() => setDetail(null)}>Đóng</button>
            </div>
            <div className="overflow-auto flex-1 p-0">
              <table className="w-full text-sm text-left">
                <thead className="sticky top-0 bg-white shadow-sm z-10">
                  <tr>
                    <th className="table-th">MSSV</th>
                    <th className="table-th">Họ tên</th>
                    <th className="table-th text-center">Khoảng cách</th>
                    <th className="table-th text-right">Giờ Check-in</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {detail.records.map((row) => (
                    <tr key={String(row['id'] ?? row['studentCode'])} className="hover:bg-slate-50/50">
                      <td className="table-td font-bold text-slate-800">{String(row['studentCode'] ?? '')}</td>
                      <td className="table-td text-slate-600">{String(row['fullName'] ?? '-')}</td>
                      <td className="table-td text-center">
                        <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-full text-xs font-medium text-slate-600">
                          {String(row['distanceM'] ?? '')}m
                        </span>
                      </td>
                      <td className="table-td text-right text-slate-500">
                        {new Date(String(row['checkedAt'] ?? '')).toLocaleTimeString('vi-VN', {hour:'2-digit', minute:'2-digit', second:'2-digit'})}
                      </td>
                    </tr>
                  ))}
                  {detail.records.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-slate-400">Chưa có lượt điểm danh nào.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

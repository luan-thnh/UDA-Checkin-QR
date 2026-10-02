import { useState, useMemo } from 'react';
import { useQueryClient, useQuery, useMutation } from '@tanstack/react-query';
import { createSession, fetchSessions, fetchStudents, type CreatedSession } from '../services/api';
import { MapPin, Loader2 } from 'lucide-react';
import { MiniMap } from './MiniMap';
import { MapModal } from './MapModal';
import { toast } from 'sonner';
import type { CheckinSession, Student } from '@checkin/shared';

function todayLabel(): string {
  const d = new Date();
  return `Điểm danh ${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

export function CreateSessionForm({ onCreated, onCancel }: { onCreated: (session: CreatedSession) => void, onCancel: () => void }) {
  const queryClient = useQueryClient();

  const { data: sessions = [] } = useQuery<CheckinSession[]>({ queryKey: ['sessions'], queryFn: fetchSessions });
  const { data: students = [] } = useQuery<Student[]>({ queryKey: ['students'], queryFn: () => fetchStudents('') });

  const [title, setTitle] = useState(todayLabel());
  const [subject, setSubject] = useState('');
  const [className, setClassName] = useState('');
  const [radius, setRadius] = useState('2000');
  const [minutes, setMinutes] = useState('60');
  
  // Default coordinates (e.g., Da Nang)
  const [lat, setLat] = useState('16.0319');
  const [lng, setLng] = useState('108.2205');
  
  const [showMap, setShowMap] = useState(false);

  const uniqueClasses = useMemo(() => {
    const cls = new Set(students.map(s => s.className).filter(Boolean));
    return Array.from(cls).sort();
  }, [students]);

  const subjectsByClass = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const s of sessions) {
      if (s.className && s.subject) {
        if (!map.has(s.className)) map.set(s.className, new Set());
        map.get(s.className)!.add(s.subject);
      }
    }
    for (const s of students) {
      if (s.className && s.subject) {
        if (!map.has(s.className)) map.set(s.className, new Set());
        map.get(s.className)!.add(s.subject);
      }
    }
    return map;
  }, [sessions, students]);

  const subjectsForSelectedClass = useMemo(() => {
    if (!className) return [];
    return Array.from(subjectsByClass.get(className) || []).sort();
  }, [className, subjectsByClass]);

  function handleClassChange(cls: string) {
    setClassName(cls);
    const available = Array.from(subjectsByClass.get(cls) || []);
    if (available.length === 1) {
      setSubject(available[0]);
    } else {
      setSubject('');
    }
  }

  const createMutation = useMutation({
    mutationFn: async () => {
      const now = new Date();
      const end = new Date(now.getTime() + Number(minutes) * 60000);
      return createSession({
        title,
        subject,
        className,
        latCenter: Number(lat),
        lngCenter: Number(lng),
        radiusM: Number(radius),
        startsAt: now.toISOString(),
        endsAt: end.toISOString(),
      });
    },
    onSuccess: (res) => {
      toast.success('Đã tạo phiên điểm danh thành công!');
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      onCreated(res);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Lỗi tạo phiên');
    }
  });

  return (
    <div className="card p-6 border-primary/20 bg-primary-light/10 mb-8 animate-in fade-in slide-in-from-top-4">
      <h3 className="text-lg font-bold mb-6 text-slate-800">Tạo phiên điểm danh mới</h3>
      <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(); }} className="flex flex-col gap-6">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="md:col-span-2">
            <label className="label">Tên phiên / Mô tả</label>
            <input required className="input" placeholder="VD: Điểm danh tuần 1" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <label className="label">Lớp học</label>
            <select className="input bg-white appearance-none" value={className} onChange={(e) => handleClassChange(e.target.value)}>
              <option value="">-- Chọn hoặc để trống --</option>
              {uniqueClasses.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Môn học</label>
            <select className="input bg-white appearance-none w-full" value={subject} onChange={(e) => setSubject(e.target.value)}>
              <option value="">-- Chọn môn --</option>
              {subjectsForSelectedClass.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="lg:col-span-1 flex flex-col gap-4">
            <h4 className="font-semibold text-slate-700 text-sm uppercase tracking-wider mb-1 flex items-center"><MapPin size={16} className="mr-2 text-primary" /> Cấu hình Vị trí & Giờ</h4>
            
            <div>
              <label className="label">Thời gian mở (phút)</label>
              <input required type="number" className="input" value={minutes} onChange={(e) => setMinutes(e.target.value)} />
            </div>
            <div>
              <label className="label">Bán kính cho phép (mét)</label>
              <input required type="number" className="input" value={radius} onChange={(e) => setRadius(e.target.value)} />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Vĩ độ (Lat)</label>
                <input required type="number" step="any" className="input font-mono text-sm" value={lat} onChange={(e) => setLat(e.target.value)} />
              </div>
              <div>
                <label className="label">Kinh độ (Lng)</label>
                <input required type="number" step="any" className="input font-mono text-sm" value={lng} onChange={(e) => setLng(e.target.value)} />
              </div>
            </div>
            
            <button 
              type="button" 
              className="btn btn-outline text-slate-700 bg-slate-50 border-slate-200 mt-1"
              onClick={() => setShowMap(true)}
            >
              <MapPin size={16} className="mr-2 text-primary" /> Mở bản đồ lớn
            </button>
          </div>
          
          <div className="lg:col-span-2">
             <MiniMap 
               lat={Number(lat) || 16.0319} 
               lng={Number(lng) || 108.2205} 
               radius={Number(radius) || 2000} 
               onClick={() => setShowMap(true)} 
             />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={createMutation.isPending}>Hủy</button>
          <button type="submit" className="btn btn-primary px-8 disabled:opacity-50" disabled={createMutation.isPending}>
            {createMutation.isPending ? <Loader2 size={18} className="animate-spin mr-2" /> : null}
            {createMutation.isPending ? 'Đang tạo...' : 'Xác nhận tạo QR'}
          </button>
        </div>
      </form>

      {showMap && (
        <MapModal 
          initialLat={Number(lat) || 16.0319} 
          initialLng={Number(lng) || 108.2205} 
          onConfirm={(lt, lg) => { setLat(lt.toString()); setLng(lg.toString()); }}
          onClose={() => setShowMap(false)}
        />
      )}
    </div>
  );
}

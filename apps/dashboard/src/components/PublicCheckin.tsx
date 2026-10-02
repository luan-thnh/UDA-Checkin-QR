import fpPromise from "@fingerprintjs/fingerprintjs";
import { useState, useEffect } from 'react';
import { useParams, useSearchParams, Navigate } from 'react-router-dom';
import { MapPin, AlertTriangle, CheckCircle2, LogOut } from 'lucide-react';
import { StudentMap } from "./StudentMap";
import { type CheckinSession, type AttendSuccessData, type ApiResponse } from '@checkin/shared';

function apiBase(): string {
  const env = (import.meta as unknown as { env?: Record<string, string> }).env;
  return (env?.['VITE_API_URL'] ?? 'http://localhost:3001').replace(/\/$/, '');
}

async function getSessionPublic(id: string): Promise<CheckinSession> {
  const res = await fetch(`${apiBase()}/api/sessions/${id}`);
  const data = await res.json();
  if (data.code !== 'SUCCESS') throw new Error(data.message);
  return data.data;
}

async function checkDeviceDB(sessionId: string, deviceId: string) {
  const res = await fetch(`${apiBase()}/api/attendances/check-device?session=${sessionId}&device=${deviceId}`);
  const data = await res.json();
  return data.data;
}

async function submitAttend(payload: any): Promise<ApiResponse<AttendSuccessData>> {
  const res = await fetch(`${apiBase()}/api/attend`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export function PublicCheckin() {
  const { sessionId: routeSessionId } = useParams();
  const [searchParams] = useSearchParams();
  
  // Accept both /c/:sessionId and ?session=...
  const sessionId = routeSessionId || searchParams.get('session');
  
  const [session, setSession] = useState<CheckinSession | null>(null);
  const [sessionError, setSessionError] = useState('');
  
  const [studentCode, setStudentCode] = useState(() => localStorage.getItem('lastStudentCode') ?? '');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  const [result, setResult] = useState<ApiResponse<AttendSuccessData> | null>(null);
  const [alreadyCheckedInLocal, setAlreadyCheckedInLocal] = useState(false);
  
  // Geolocation
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [acc, setAcc] = useState<number | null>(null);
  const [geoStatus, setGeoStatus] = useState<'idle' | 'requesting' | 'granted' | 'denied'>('idle');
  const [geoError, setGeoError] = useState('');
  const [deviceId, setDeviceId] = useState<string>("");
  useEffect(() => {
    if (!sessionId) return;
    fpPromise.load().then(fp => fp.get()).then(async res => {
      setDeviceId(res.visitorId);
      // Khi đã có Device ID, lập tức hỏi Server xem thiết bị này đã điểm danh trong session này chưa!
      try {
        const deviceRecord = await checkDeviceDB(sessionId, res.visitorId);
        if (deviceRecord && deviceRecord.studentCode) {
          // Bắt được thiết bị này đã điểm danh! Chặn hiển thị ô nhập luôn.
          setAlreadyCheckedInLocal(true);
          setResult({
            code: 'ALREADY_CHECKED',
            message: 'Thiết bị này đã điểm danh',
            data: {
              session_id: sessionId,
              student_code: deviceRecord.studentCode,
              distance_m: 0,
              checked_at: new Date().toISOString()
            } as any
          });
        }
      } catch (err) {
        console.error("Lỗi kiểm tra thiết bị:", err);
      }
    });
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) {
      setSessionError('Không tìm thấy mã phiên điểm danh (Session ID).');
      return;
    }
    
    // Check local storage for already checked in
    if (localStorage.getItem(`checkedInSession_${sessionId}`)) {
      setAlreadyCheckedInLocal(true);
    }
    
    getSessionPublic(sessionId)
      .then(setSession)
      .catch(e => setSessionError(e.message || 'Phiên không tồn tại hoặc đã đóng.'));
  }, [sessionId]);

  const requestLocation = () => {
    setGeoStatus('requesting');
    setGeoError('');
    if (!navigator.geolocation) {
      setGeoStatus('denied');
      setGeoError('Trình duyệt của bạn không hỗ trợ định vị.');
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setAcc(pos.coords.accuracy);
        setGeoStatus('granted');
        setGeoError(''); // Fix: Xóa thông báo lỗi cũ nếu có
      },
      (err) => {
        setGeoStatus('denied');
        if (err.code === 1) setGeoError('Bạn đã từ chối cấp quyền vị trí. Vui lòng bật lại trong cài đặt trình duyệt.');
        else setGeoError('Không thể lấy vị trí hiện tại của bạn.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    if (session && !alreadyCheckedInLocal) requestLocation();
  }, [session, alreadyCheckedInLocal]);

  const handleCheckin = async () => {
    if (!sessionId) return;
    const code = studentCode.trim().toUpperCase();
    if (!code) {
      setFormError('Vui lòng nhập MSSV');
      return;
    }
    if (lat === null || lng === null) {
      setFormError('Chưa có vị trí. Vui lòng cấp quyền vị trí.');
      return;
    }

    setSubmitting(true);
    setFormError('');
    try {
      const res = await submitAttend({ sessionId, studentCode: code, lat, lng, accuracyM: acc || undefined, deviceId });
      if (res.code === 'SUCCESS' || res.code === 'ALREADY_CHECKED') {
        localStorage.setItem(`checkedInSession_${sessionId}`, code);
        localStorage.setItem('lastStudentCode', code);
        setResult(res);
      } else {
        setFormError(res.message || 'Có lỗi xảy ra');
      }
    } catch (e: any) {
      setFormError(e.message || 'Mất kết nối máy chủ');
    } finally {
      setSubmitting(false);
    }
  };

  if (!sessionId) {
    return <Navigate to="/qr" replace />;
  }

  if (sessionError) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 text-center border-t-4 border-danger">
          <AlertTriangle size={48} className="text-danger mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">Lỗi Phiên</h2>
          <p className="text-slate-600">{sessionError}</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const isExpired = session.endsAt && !isNaN(new Date(session.endsAt).getTime()) && new Date(session.endsAt) < new Date();
  if (session.status !== 'active' || isExpired) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 text-center border-t-4 border-danger">
          <AlertTriangle size={48} className="text-danger mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">Phiên Đã Đóng</h2>
          <p className="text-slate-600">Phiên điểm danh này đã kết thúc hoặc đã bị đóng bởi giảng viên.</p>
        </div>
      </div>
    );
  }

  // Already checked in (Local Memory)
  if (alreadyCheckedInLocal && !result) {
    const savedCode = localStorage.getItem(`checkedInSession_${sessionId}`);
    return (
      <div className="min-h-screen bg-primary flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-success"></div>
          <CheckCircle2 size={72} className="text-success mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Đã điểm danh</h2>
          <p className="text-slate-500 mb-4">Sinh viên <b>{savedCode}</b> đã điểm danh phiên này trên thiết bị.</p>
          <div className="bg-slate-50 rounded-xl p-4 mb-6 border border-slate-100">
            <p className="font-semibold text-primary">{session.title}</p>
            {session.subject && <p className="text-sm text-slate-600 mt-1">{session.subject}</p>}
          </div>
          <button 
            onClick={() => {
              localStorage.removeItem(`checkedInSession_${sessionId}`);
              setAlreadyCheckedInLocal(false);
            }}
            className="text-sm text-slate-400 hover:text-slate-600 font-medium underline flex items-center justify-center gap-1 mx-auto"
          >
            <LogOut size={14} /> Điểm danh cho sinh viên khác
          </button>
        </div>
      </div>
    );
  }

  // Success screen
  if (result) {
    const isSuccess = result.code === 'SUCCESS';
    
    
    return (
      <div className="min-h-screen bg-primary flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 text-center relative overflow-hidden">
          <div className={`absolute top-0 left-0 w-full h-2 ${isSuccess ? 'bg-success' : 'bg-accent'}`}></div>
          {isSuccess ? (
             <CheckCircle2 size={72} className="text-success mx-auto mb-4" />
          ) : (
             <AlertTriangle size={72} className="text-accent mx-auto mb-4" />
          )}
          <h2 className="text-2xl font-bold text-slate-800 mb-2">{isSuccess ? 'Điểm danh thành công!' : 'Đã điểm danh rồi!'}</h2>
          
          <div className="bg-slate-50 rounded-xl p-4 my-6 border border-slate-100 text-left space-y-2 text-sm">
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500">MSSV:</span>
              <span className="font-bold text-slate-800">{result.data?.attendance.studentCode}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500">Sai số vị trí:</span>
              <span className="font-bold text-primary">{result.data?.distanceM} mét</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Thời gian:</span>
              <span className="font-medium text-slate-700">{new Date(result.data?.attendance.checkedAt ?? '').toLocaleString('vi-VN')}</span>
            </div>
          </div>
          
          <button 
            onClick={() => window.close()}
            className="w-full py-3 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors"
          >
            Đóng cửa sổ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center p-4 pt-10">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-xl p-6 mb-4">
          <div className="w-12 h-12 bg-primary-light text-primary-dark rounded-xl flex items-center justify-center mb-4">
            <MapPin size={24} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-1 leading-tight">{session.title}</h1>
          <div className="flex flex-wrap gap-2 text-sm mt-2">
            {session.subject && <span className="text-accent font-semibold bg-accent-tint px-2 py-0.5 rounded-md">{session.subject}</span>}
            {session.className && <span className="text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">{session.className}</span>}
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-6 relative overflow-hidden border-t-4 border-primary">
          <label className="block text-sm font-semibold text-slate-700 mb-2 uppercase tracking-wide">Mã Số Sinh Viên (MSSV)</label>
          <input
            type="text"
            className="w-full h-14 bg-slate-50 border border-slate-200 rounded-xl px-4 tracking-widest font-mono text-lg uppercase outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-slate-800 mb-2"
            placeholder="Nhập MSSV của bạn"
            value={studentCode}
            onChange={e => { setStudentCode(e.target.value.toUpperCase()); setFormError(''); }}
          />

          {/* Location Status */}
          <div className="flex items-center gap-2 mb-4">
            <div className={`w-2.5 h-2.5 rounded-full ${geoStatus === 'granted' ? 'bg-success' : geoStatus === 'denied' ? 'bg-danger' : 'bg-accent animate-pulse'}`}></div>
            <span className="text-xs font-medium text-slate-500">
              {geoStatus === 'granted' ? 'Đã lấy được vị trí GPS' : geoStatus === 'denied' ? 'Không có quyền truy cập vị trí' : 'Đang tìm tín hiệu GPS...'}
            </span>
            {geoStatus === 'denied' && (
              <button onClick={requestLocation} className="text-xs text-primary underline ml-auto">Thử lại</button>
            )}
          </div>
          
          {geoStatus === 'granted' && lat !== null && lng !== null && session && (
            <StudentMap 
              sessionLat={session.latCenter}
              sessionLng={session.lngCenter}
              radius={session.radiusM}
              studentLat={lat}
              studentLng={lng}
            />
          )}

          {(formError || geoError) && (
            <div className="bg-danger-tint border border-danger/20 text-danger text-sm p-3 rounded-lg mb-6 flex items-start gap-2">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
              <span>{formError || geoError}</span>
            </div>
          )}

          <button
            onClick={handleCheckin}
            disabled={submitting || geoStatus !== 'granted'}
            className="w-full h-14 bg-primary text-white rounded-xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-dark transition-colors shadow-lg shadow-primary/30 flex items-center justify-center gap-2"
          >
            {submitting ? 'ĐANG ĐIỂM DANH...' : 'XÁC NHẬN ĐIỂM DANH'}
          </button>
        </div>
      </div>
      
      <div className="mt-8 text-center text-xs text-slate-400">
        Hệ thống điểm danh sinh viên UDA<br/>
        &copy; {new Date().getFullYear()}
      </div>
    </div>
  );
}

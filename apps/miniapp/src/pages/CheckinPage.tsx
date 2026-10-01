import { useEffect, useMemo, useState } from 'react';
import api from 'zmp-sdk';
import { Button, Header, Input, Page, Spinner, Icon, useNavigate } from 'zmp-ui';
import {
  parseSessionIdFromQuery,
  validateAttendForm,
  type ApiResponse,
  type AttendSuccessData,
  type CheckinSession,
} from '@checkin/shared';
import { getSessionPublic, submitAttend } from '../services/api';
import { useCheckinLocation } from '../hooks/useCheckinLocation';
import { StatusCard } from '../components/StatusCard';

function readSessionId(): string {
  try {
    const routeParams = api.getRouteParams();
    if (routeParams && routeParams.session) {
      return parseSessionIdFromQuery({ session: routeParams.session });
    }
  } catch (e) {}

  let params = new URLSearchParams(window.location.search);
  let sessionParam = params.get('session');

  if (!sessionParam && window.location.hash.includes('?')) {
    const hashQuery = window.location.hash.split('?')[1];
    params = new URLSearchParams(hashQuery);
    sessionParam = params.get('session');
  }

  return parseSessionIdFromQuery({ session: sessionParam ?? undefined });
}

export function CheckinPage() {
  const navigate = useNavigate();
  const [sessionId, setSessionId] = useState(readSessionId);
  const [session, setSession] = useState<CheckinSession | null>(null);
  const [sessionError, setSessionError] = useState('');
  const [studentCode, setStudentCode] = useState(() => localStorage.getItem('lastStudentCode') ?? '');

  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ApiResponse<AttendSuccessData> | null>(null);

  const [alreadyCheckedInLocal, setAlreadyCheckedInLocal] = useState(false);
  const { fix, status, errorMessage, requestLocation } = useCheckinLocation();
  
  const [manualSessionCode, setManualSessionCode] = useState('');

  useEffect(() => {
    if (!sessionId) {
      setSessionError('Vui lòng quét mã QR hoặc nhập mã phiên do Giảng viên cung cấp.');
      return;
    }
    
    setSessionError(''); // Clear old error

    if (localStorage.getItem(`checkin_${sessionId}`)) {
      setAlreadyCheckedInLocal(true);
    }
    
    getSessionPublic(sessionId).then(setSession).catch((error: Error) => setSessionError(error.message));
  }, [sessionId]);

  useEffect(() => {
    if (!alreadyCheckedInLocal && sessionId) {
      requestLocation();
    }
  }, [requestLocation, alreadyCheckedInLocal, sessionId]);

  const distanceM = useMemo(() => {
    if (!fix || !session) return null;
    const dx = fix.lat - session.latCenter;
    const dy = fix.lng - session.lngCenter;
    return Math.sqrt(dx * dx + dy * dy) * 111320;
  }, [fix, session]);

  const blockReason = useMemo(() => {
    if (!session) return 'Đang tải...';
    if (session.status !== 'active') return 'Phiên đã đóng';
    if (status === 'error') return 'Chưa cấp quyền vị trí';
    if (!fix) return 'Đang lấy vị trí...';
    if (distanceM !== null && distanceM > session.radiusM) return `Quá xa (${Math.round(distanceM)}m > ${session.radiusM}m)`;
    return null;
  }, [session, status, fix, distanceM]);

  const canSubmit = !blockReason && !submitting;

  function handleCodeChange(value: string) {
    setStudentCode(value.toUpperCase());
    setResult(null);
    setFormError(validateAttendForm(value).studentCode ?? '');
  }

  async function handleSubmit() {
    const fieldErrors = validateAttendForm(studentCode);
    if (fieldErrors.studentCode) {
      setFormError(fieldErrors.studentCode);
      return;
    }
    if (!fix || !session) return;
    setSubmitting(true);
    setResult(null);

    try {
      const res = await submitAttend({
        sessionId: session.id,
        studentCode,
        lat: fix.lat,
        lng: fix.lng,
      });
      setResult(res);
      if (res.code === 'SUCCESS' || res.code === 'ALREADY_CHECKED') {
        localStorage.setItem(`checkin_${session.id}`, studentCode);
        localStorage.setItem('lastStudentCode', studentCode);
        setAlreadyCheckedInLocal(true);
      }
    } catch (e: any) {
      setResult({ code: 'INVALID_INPUT', message: e.message, data: null as any });
    } finally {
      setSubmitting(false);
    }
  }

  function handleBack() {
    if (window.history.length <= 1) {
      api.closeApp({});
    } else {
      navigate(-1);
    }
  }

  if (!sessionId) {
    return (
      <Page className="page">
        <Header title="Điểm danh UDA" onBackClick={handleBack} />
        <div className="empty-state ci-wrap">
          <div className="icon-wrapper" style={{ margin: '40px auto 24px' }}>
            <Icon icon="zi-qrline" size={48} style={{ color: 'var(--primary)' }} />
          </div>
          <h2 style={{ marginBottom: 12 }}>Bắt đầu điểm danh</h2>
          <p style={{ color: 'var(--muted)', marginBottom: 32, fontSize: 15 }}>
            Quét mã QR từ màn hình của Giảng viên để tiếp tục.
          </p>
          <Button
            className="btn-submit"
            fullWidth
            onClick={() => {
              try {
                api.scanQRCode({
                  success: (data) => {
                    const content = data?.content;
                    if (content) {
                      let newSessionId = '';
                      try {
                        const url = new URL(content);
                        newSessionId = url.searchParams.get('session') || '';
                      } catch {
                        if (content.includes('session=')) {
                          newSessionId = content.split('session=')[1].split('&')[0];
                        } else {
                          newSessionId = content;
                        }
                      }
                      
                      if (newSessionId) {
                        setSessionId(newSessionId);
                        navigate(`/?session=${encodeURIComponent(newSessionId)}`, { replace: true });
                      } else {
                        alert('Mã QR không hợp lệ. Nội dung: ' + content);
                      }
                    }
                  },
                  fail: (error) => {
                    alert('Lỗi quét QR: ' + JSON.stringify(error));
                  },
                });
              } catch (e) {
                alert('Không thể mở Camera.');
              }
            }}
          >
            Quét mã QR ngay
          </Button>
          
          <div style={{ marginTop: 40, borderTop: '1px solid var(--line)', paddingTop: 24, width: '100%', textAlign: 'left' }}>
            <p style={{ color: 'var(--muted)', marginBottom: 16, fontSize: 14, fontWeight: 500 }}>Hoặc nhập mã phiên bằng tay:</p>
            <Input
              type="text"
              placeholder="VD: SS-MUP6ILIE"
              value={manualSessionCode}
              onChange={(e) => setManualSessionCode(e.target.value.toUpperCase())}
              clearable
              style={{ marginBottom: 16 }}
            />
            <Button
              variant="secondary"
              fullWidth
              onClick={() => {
                if (manualSessionCode.trim()) {
                  const code = manualSessionCode.trim().toUpperCase();
                  setSessionId(code);
                  navigate(`/?session=${encodeURIComponent(code)}`, { replace: true });
                }
              }}
            >
              Vào điểm danh
            </Button>
          </div>
        </div>
      </Page>
    );
  }

  return (
    <Page className="page">
      <Header title="Điểm danh sinh viên" onBackClick={handleBack} />
      <div className="ci-wrap">
        {!session && !sessionError ? (
          <div className="loading-state">
            <Spinner visible />
            <span>Đang tải thông tin phiên...</span>
          </div>
        ) : null}
        
        {sessionError && sessionId ? (
          <div className="ci-result fail">
            <div className="icon-wrapper-small">
              <Icon icon="zi-warning-solid" size={32} style={{ color: 'var(--danger)' }} />
            </div>
            <h3>Lỗi tải dữ liệu</h3>
            <p style={{ wordBreak: 'break-word', margin: '12px 0', fontSize: 14 }}>{sessionError}</p>
            <Button size="small" variant="secondary" onClick={() => { setSessionId(''); navigate('/', { replace: true }); }}>Thử mã khác</Button>
          </div>
        ) : null}

        {session ? (
          <div className="ci-session">
            <div className="ci-session-bg"></div>
            <div className="ci-session-content">
              <h2>{session.title}</h2>
              <div className="subject">
                <Icon icon="zi-bookmark" size={16} style={{ marginRight: 6 }} /> {session.subject}
              </div>
              <div className="time-info">
                <Icon icon="zi-clock-1" size={16} /> 
                <span>Đến {new Date(session.endsAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          </div>
        ) : null}

        {session ? (
          <div className="ci-card">
            <div className="ci-gps">
              <Icon icon="zi-location-solid" size={24} style={{ color: 'var(--primary)' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: 'var(--ink)', fontSize: 16, marginBottom: 4 }}>Vị trí của bạn</div>
                <div className="distance-text">
                  {status === 'ok' && fix
                    ? distanceM !== null
                      ? <span className={distanceM <= session.radiusM ? 'text-green' : 'text-red'}>Cách điểm danh {Math.round(distanceM)}m</span>
                      : 'Đang tính toán...'
                    : status === 'error'
                    ? <span className="text-red">Bị từ chối (Chưa cấp quyền)</span>
                    : errorMessage || 'Đang chờ vị trí...'}
                </div>
              </div>
              {status !== 'ok' ? (
                <Button size="small" onClick={requestLocation} variant="secondary">Cấp quyền</Button>
              ) : null}
            </div>

            {result ? (
              <div style={{ marginTop: 24 }}>
                <StatusCard 
                  code={result.code} 
                  message={result.message} 
                  checkedAt={result.data?.attendance?.checkedAt}
                />
              </div>
            ) : (
              <div style={{ marginTop: 24 }}>
                {alreadyCheckedInLocal ? (
                  <StatusCard code="ALREADY_CHECKED" message="Bạn đã check-in thành công trên thiết bị này." />
                ) : (
                  <>
                    <div style={{ marginBottom: 24 }}>
                      <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 15 }}>Mã số sinh viên (MSSV)</label>
                      <Input
                        type="text"
                        placeholder="Nhập MSSV của bạn (vd: 205053120)"
                        value={studentCode}
                        onChange={(e) => handleCodeChange(e.target.value)}
                        errorText={formError}
                        status={formError ? 'error' : ''}
                        clearable
                        disabled={submitting}
                      />
                    </div>
                    
                    <Button
                      className="btn-submit"
                      fullWidth
                      loading={submitting}
                      disabled={!canSubmit || !studentCode.trim()}
                      onClick={handleSubmit}
                    >
                      {blockReason || 'Xác nhận điểm danh'}
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </Page>
  );
}

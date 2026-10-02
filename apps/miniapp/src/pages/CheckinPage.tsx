import { useEffect, useMemo, useState } from 'react';
import api from 'zmp-sdk';
import { Button, Header, Page, Spinner, Icon, useNavigate } from 'zmp-ui';
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
  
  const [manualCode, setManualCode] = useState('');

  useEffect(() => {
    if (!sessionId) {
      setSessionError('NO_SESSION');
      return;
    }
    setSessionError('');
    if (localStorage.getItem(`checkin_${sessionId}`)) {
      setAlreadyCheckedInLocal(true);
    }
    getSessionPublic(sessionId)
      .then(setSession)
      .catch((error: Error) => setSessionError(error.message));
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
    if (distanceM !== null && distanceM > session.radiusM)
      return `Quá xa (${Math.round(distanceM)}m)`;
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
    if (sessionId) {
      setSessionId('');
      setSession(null);
      setSessionError('NO_SESSION');
      setResult(null);
      setAlreadyCheckedInLocal(false);
      navigate('/', { replace: true });
    } else if (window.history.length <= 1) {
      api.closeApp({});
    } else {
      navigate(-1);
    }
  }

  function handleScanQR() {
    try {
      api.scanQRCode({
        success: (data) => {
          const content = data?.content;
          if (!content) return;
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
            alert('Mã QR không hợp lệ.');
          }
        },
        fail: () => alert('Lỗi quét QR.'),
      });
    } catch {
      alert('Không thể mở Camera.');
    }
  }

  function goToSession(code: string) {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    setSessionId(trimmed);
    navigate(`/?session=${encodeURIComponent(trimmed)}`, { replace: true });
  }

  /* ==========================================
     HOME SCREEN — no session
     ========================================== */
  if (!sessionId) {
    return (
      <Page className="page">
        <Header title="UDA Check In" showBackIcon={false} />
        <div className="home-screen">
          <div className="home-logo">
            <Icon icon="zi-note" size={36} style={{ color: 'white' }} />
            <span className="badge"><Icon icon="zi-check-circle-solid" size={18} /></span>
          </div>

          <div className="home-pill">
            <Icon icon="zi-star-solid" size={14} /> Hệ thống Điểm danh UDA
          </div>

          <h1 className="home-title">Điểm danh sinh viên</h1>
          <p className="home-desc">
            Quét mã QR hoặc nhập mã điểm danh<br/>để bắt đầu tiết học
          </p>

          <Button className="btn-scan" onClick={handleScanQR}>
            <Icon icon="zi-qrline" size={22} />
            QUÉT MÃ QR
          </Button>

          <div className="home-divider">hoặc</div>

          <div className="manual-card">
            <div className="manual-card-header">
              <span className="label">Mã điểm danh</span>
              <span className="hint">Mã phiên từ giảng viên</span>
            </div>
            <div className="manual-input-row">
              <input
                type="text"
                placeholder="VD: SS-MUP6ILIE"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && goToSession(manualCode)}
              />
              <Button className="btn-go" onClick={() => goToSession(manualCode)}>
                Tiếp tục →
              </Button>
            </div>
            <div className="manual-hint">
              <Icon icon="zi-info-circle" size={14} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>Nhập mã phiên nếu không thể quét camera.</span>
            </div>
          </div>

          <div className="home-footer">
            <div className="home-footer-dot">
              <Icon icon="zi-check-circle" size={22} />
            </div>
            <div>
              <h4>Cổng điểm danh đang mở</h4>
              <p>Đại học Đông Á (UDA)</p>
            </div>
            <div className="pulse-green" />
          </div>

          <div className="home-credit">
            Trung tâm Đào tạo &amp; Khảo thí<br/>
            Đại học Đông Á • Zalo Mini App
          </div>
        </div>
      </Page>
    );
  }

  /* ==========================================
     SESSION SCREEN — has sessionId
     ========================================== */
  return (
    <Page className="page">
      <Header title="Điểm danh" onBackClick={handleBack} />
      <div className="ci-wrap">
        {/* Loading */}
        {!session && !sessionError && (
          <div className="loading-center">
            <Spinner visible />
            <span>Đang tải thông tin phiên...</span>
          </div>
        )}

        {/* Error */}
        {sessionError && sessionError !== 'NO_SESSION' && (
          <div className="error-card">
            <div className="error-card-header">
              <Icon icon="zi-warning-solid" size={22} />
              <h3>Lỗi tải dữ liệu</h3>
            </div>
            <p>{sessionError}</p>
            <Button size="small" onClick={handleBack}>← Quay lại</Button>
          </div>
        )}

        {/* Session Info */}
        {session && (
          <div className="card">
            <div className="session-header">
              <span className="session-tag">
                #{session.id.slice(-6)}
              </span>
              <span className="session-status">
                {session.status === 'active' ? 'Đang mở' : 'Đã đóng'}
              </span>
            </div>
            <h2>{session.title}</h2>
            <div className="session-meta">
              <span>
                <Icon icon="zi-clock-1" size={15} style={{ color: 'var(--primary)' }} />
                Đến {new Date(session.endsAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
              </span>
              <span>
                <Icon icon="zi-location" size={15} style={{ color: 'var(--primary)' }} />
                {session.subject || 'Phòng học'}
              </span>
            </div>
          </div>
        )}

        {/* GPS */}
        {session && (
          <div className="card gps-row">
            <div className={`gps-icon ${status === 'ok' ? '' : 'error'}`}>
              <Icon icon={status === 'ok' ? 'zi-check' : 'zi-close'} size={24} />
            </div>
            <div className="gps-body">
              <h4 className="gps-title">
                {status === 'ok' && fix ? 'Đã xác định vị trí' : 'Chưa có vị trí'}
                <span className={`gps-badge ${status === 'ok' ? '' : 'error'}`}>
                  GPS {status === 'ok' ? 'OK' : '...'}
                </span>
              </h4>
              <p className="gps-desc">
                {status === 'ok' && fix
                  ? distanceM !== null
                    ? distanceM <= session.radiusM
                      ? `Hợp lệ — cách điểm danh ${Math.round(distanceM)}m.`
                      : `Ngoài vùng — cách ${Math.round(distanceM)}m (tối đa ${session.radiusM}m).`
                    : 'Đang tính toán...'
                  : status === 'error'
                  ? 'Không lấy được vị trí. Vui lòng cấp quyền.'
                  : errorMessage || 'Đang chờ vị trí...'}
              </p>
              <div className="gps-source">
                <Icon icon="zi-shield-solid" size={12} /> Zalo Location API
              </div>
              {status !== 'ok' && (
                <Button size="small" onClick={requestLocation} style={{ marginTop: 10 }}>
                  Cấp quyền vị trí
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Form / Result */}
        {session && (
          <div className="card form-card">
            <div className="form-header">
              <span>Mã sinh viên</span>
              <span style={{ color: 'var(--primary)' }}>
                <Icon icon="zi-edit-text" size={12} /> Nhập tay
              </span>
            </div>

            {result ? (
              <StatusCard
                code={result.code}
                message={result.message}
                checkedAt={result.data?.attendance?.checkedAt}
              />
            ) : alreadyCheckedInLocal ? (
              <StatusCard code="ALREADY_CHECKED" message="Bạn đã check-in thành công trên thiết bị này." />
            ) : (
              <>
                <div className="student-input">
                  <input
                    type="text"
                    placeholder="Nhập MSSV..."
                    value={studentCode}
                    onChange={(e) => handleCodeChange(e.target.value)}
                    disabled={submitting}
                  />
                  {studentCode && (
                    <div className="clear-btn" onClick={() => handleCodeChange('')}>
                      <Icon icon="zi-close-circle" size={18} />
                    </div>
                  )}
                </div>
                {formError && <div className="form-error">{formError}</div>}

                <Button
                  className="btn-submit"
                  loading={submitting}
                  disabled={!canSubmit || !studentCode.trim()}
                  onClick={handleSubmit}
                >
                  <Icon icon="zi-check-circle" size={18} />
                  {blockReason || 'ĐIỂM DANH NGAY'}
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </Page>
  );
}

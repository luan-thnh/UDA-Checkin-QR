import { useEffect, useMemo, useState } from 'react';
import { Box, Button, Header, Input, Page, Spinner, Icon, useNavigate } from 'zmp-ui';
import api from 'zmp-sdk';
import {
  haversineMeters,
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
  // 1. Try Zalo SDK getRouteParams
  try {
    const routeParams = api.getRouteParams();
    if (routeParams && routeParams.session) {
      return parseSessionIdFromQuery({ session: routeParams.session });
    }
  } catch (e) {
    // Ignore if api is not ready
  }

  // 2. Try window.location.search (Standard URL)
  let params = new URLSearchParams(window.location.search);
  let sessionParam = params.get('session');

  // 3. Try window.location.hash (Hash router with query, e.g., #/?session=123)
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

  useEffect(() => {
    if (!sessionId) {
      setSessionError('Vui lòng quét mã QR do Giảng viên cung cấp để điểm danh.');
      return;
    }
    
    // Kiem tra lich su checkin o local
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
    return Math.round(haversineMeters(fix.lat, fix.lng, session.latCenter, session.lngCenter));
  }, [fix, session]);

  const inRange = distanceM !== null && session !== null && distanceM <= session.radiusM;

  function submitReason(): string {
    if (!session || sessionError) return 'Chưa tải được phiên điểm danh.';
    if (!studentCode.trim()) return 'Nhập MSSV trước khi điểm danh.';
    if (formError) return formError;
    if (status === 'loading') return 'Đang chờ GPS…';
    if (!fix) return 'Chưa có vị trí. Bấm “Lấy lại vị trí”.';
    return '';
  }

  const blockReason = submitReason();
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
      const response = await submitAttend({
        sessionId: session.id,
        studentCode: studentCode.trim(),
        lat: fix.lat,
        lng: fix.lng,
        accuracyM: fix.accuracyM,
      });
      setResult(response);
      
      if (response.code === 'SUCCESS' || response.code === 'ALREADY_CHECKED') {
        localStorage.setItem(`checkin_${session.id}`, studentCode.trim());
        localStorage.setItem('lastStudentCode', studentCode.trim());
      }
    } catch {
      setResult({ code: 'INVALID_INPUT', message: 'Không gọi được server. Kiểm tra mạng.', data: null as never });
    } finally {
      setSubmitting(false);
    }
  }

  if (!sessionId) {
    return (
      <Page>
        <Header title="Điểm danh UDA" showBackIcon={false} />
        <div className="ci-wrap empty-state text-center flex flex-col items-center justify-center h-full pt-20">
          <div className="icon-wrapper mb-4">
            <Icon icon="zi-qrline" size={64} style={{ color: 'var(--primary)' }} />
          </div>
          <h2 className="mb-2">Chưa có mã phiên</h2>
          <p className="mb-6">{sessionError}</p>
          <Button
            className="btn-submit"
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
                    console.error('Scan fail:', error);
                    alert('Lỗi quét QR (Có thể do bạn đang dùng bản Web/PC). Chi tiết: ' + JSON.stringify(error));
                  }
                });
              } catch (error) {
                console.error('Scan catch:', error);
                alert('Không thể gọi API quét QR: ' + JSON.stringify(error));
              }
            }}
          >
            Quét mã QR ngay
          </Button>
        </div>
      </Page>
    );
  }

  return (
    <Page>
      <Header title="Điểm danh sinh viên" />
      <div className="ci-wrap">
        {!session && !sessionError ? (
          <div className="loading-state">
            <Spinner visible />
            <p>Đang tải thông tin phiên...</p>
          </div>
        ) : null}
        
        {sessionError && sessionId ? <StatusCard code="SESSION_CLOSED" message={sessionError} /> : null}

        {session ? (
          <div className="ci-session">
            <div className="ci-session-bg"></div>
            <div className="ci-session-content">
              <h2>{session.title}</h2>
              {session.subject && <p className="subject">{session.subject}</p>}
              <div className="time-info">
                <Icon icon="zi-clock-1" size={16} />
                <span>
                  {new Date(session.startsAt).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})} - {new Date(session.endsAt).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}
                </span>
              </div>
              <p className="radius-info">Bán kính cho phép: <b>{session.radiusM}m</b></p>
              <span className={`pill ${session.status === 'active' ? 'active' : 'closed'}`}>
                {session.status === 'active' ? 'Đang mở' : 'Đã đóng'}
              </span>
            </div>
          </div>
        ) : null}

        {alreadyCheckedInLocal && session ? (
          <div className="ci-result success mt-4">
            <div className="icon-wrapper-small">
              <Icon icon="zi-check-circle-solid" size={32} style={{ color: 'var(--primary-deep)' }} />
            </div>
            <h3>Đã điểm danh thành công</h3>
            <p>Bạn đã điểm danh cho phiên này với MSSV <b>{localStorage.getItem(`checkin_${session.id}`)}</b>.</p>
          </div>
        ) : null}

        {!alreadyCheckedInLocal && session && !result?.data ? (
          <>
            <div className="ci-card">
              <h4>Thông tin sinh viên</h4>
              <Input 
                placeholder="Nhập MSSV (VD: SV001)" 
                value={studentCode} 
                onChange={(e) => handleCodeChange(e.target.value)} 
                status={formError ? 'error' : 'success'}
                errorText={formError}
                clearable
              />
            </div>

            <div className="ci-card">
              <div className="card-header">
                <h4>Vị trí của bạn</h4>
                <Button variant="tertiary" size="small" icon={<Icon icon="zi-location" />} onClick={requestLocation}>
                  Làm mới
                </Button>
              </div>
              
              {status === 'loading' ? (
                <div className="location-status loading">
                  <Spinner visible /> <span className="ml-2">Đang định vị...</span>
                </div>
              ) : null}
              
              {status === 'error' ? (
                <div className="ci-error flex-center">
                  <Icon icon="zi-warning-solid" size={18} /> {errorMessage}
                </div>
              ) : null}
              
              {fix && distanceM !== null ? (
                <div className={`ci-gps ${inRange ? 'ok' : 'far'}`}>
                  <div className="distance-badge">
                    {distanceM}m
                  </div>
                  <div className="distance-text">
                    Cách trường ({fix.source === 'zalo' ? 'Zalo' : 'Web'})<br/>
                    <strong className={inRange ? 'text-green' : 'text-red'}>
                      {inRange ? 'Trong phạm vi' : 'Ngoài phạm vi'}
                    </strong>
                  </div>
                </div>
              ) : null}
              
              {fix?.accuracyM && fix.accuracyM > 200 ? (
                <div className="ci-hint warning">
                  <Icon icon="zi-info-circle" size={14} /> GPS yếu (±{Math.round(fix.accuracyM)}m). Hãy ra không gian thoáng.
                </div>
              ) : null}
            </div>

            <div className="action-area">
              {!canSubmit && !submitting ? <div className="ci-hint text-center mb-2">{blockReason}</div> : null}
              <Button 
                fullWidth 
                disabled={!canSubmit} 
                loading={submitting} 
                onClick={handleSubmit}
                className="btn-submit"
              >
                Xác nhận điểm danh
              </Button>
            </div>
          </>
        ) : null}

        {result ? (
          <Box mt={4}>
            <StatusCard
              code={result.code}
              message={result.message}
              checkedAt={result.data?.attendance.checkedAt}
            />
          </Box>
        ) : null}
      </div>
    </Page>
  );
}

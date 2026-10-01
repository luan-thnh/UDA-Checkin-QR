import { useEffect, useMemo, useState } from 'react';
import { Box, Button, Header, Input, Page, Spinner, Text } from 'zmp-ui';
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
  const params = new URLSearchParams(window.location.search);
  return parseSessionIdFromQuery({ session: params.get('session') ?? undefined });
}

export function CheckinPage() {
  const [sessionId] = useState(readSessionId);
  const [session, setSession] = useState<CheckinSession | null>(null);
  const [sessionError, setSessionError] = useState('');
  const [studentCode, setStudentCode] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ApiResponse<AttendSuccessData> | null>(null);
  const { fix, status, errorMessage, requestLocation } = useCheckinLocation();

  useEffect(() => {
    if (!sessionId) {
      setSessionError('Thiếu mã phiên. Hãy quét lại QR từ giảng viên.');
      return;
    }
    getSessionPublic(sessionId).then(setSession).catch((error: Error) => setSessionError(error.message));
  }, [sessionId]);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

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
    setStudentCode(value);
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
    } catch {
      setResult({ code: 'INVALID_INPUT', message: 'Không gọi được server. Kiểm tra mạng.', data: null as never });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Page>
      <Header title="Check-in sinh viên" />
      <div className="ci-wrap">
        {!session && !sessionError ? <Spinner /> : null}
        {sessionError ? <StatusCard code="SESSION_CLOSED" message={sessionError} /> : null}

        {session ? (
          <div className="ci-session">
            <h2>{session.title}</h2>
            <p>
              {new Date(session.startsAt).toLocaleString('vi-VN')} —{' '}
              {new Date(session.endsAt).toLocaleString('vi-VN')}
            </p>
            <p>Trong {session.radiusM}m từ trường mới được điểm danh</p>
            <span className="pill">{session.status === 'active' ? 'Đang mở' : 'Đã đóng'}</span>
          </div>
        ) : null}

        <div className="ci-card">
          <h4>MSSV của bạn</h4>
          <Input placeholder="VD: SV001" value={studentCode} onChange={(e) => handleCodeChange(e.target.value)} />
          <div className="ci-error">{formError}</div>
        </div>

        <div className="ci-card">
          <h4>Vị trí</h4>
          {status === 'loading' ? <Text>Đang lấy vị trí…</Text> : null}
          {status === 'error' ? <div className="ci-error">GPS lỗi: {errorMessage}</div> : null}
          {fix && distanceM !== null ? (
            <div className={`ci-gps ${inRange ? 'ok' : 'far'}`}>
              Cách trường {distanceM}m ({fix.source === 'zalo' ? 'Zalo GPS' : 'trình duyệt'}) —{' '}
              {inRange ? 'đủ điều kiện' : 'ngoài phạm vi'}.
            </div>
          ) : null}
          {fix?.accuracyM && fix.accuracyM > 200 ? (
            <div className="ci-hint">GPS yếu (±{Math.round(fix.accuracyM)}m). Ra chỗ thoáng rồi lấy lại.</div>
          ) : null}
          <Box mt={2}>
            <Button variant="secondary" onClick={requestLocation}>
              Lấy lại vị trí
            </Button>
          </Box>
        </div>

        {!canSubmit && !submitting ? <div className="ci-hint">{blockReason}</div> : null}
        <Button disabled={!canSubmit} loading={submitting} onClick={handleSubmit}>
          Điểm danh
        </Button>

        {result ? (
          <StatusCard
            code={result.code}
            message={result.message}
            checkedAt={result.data?.attendance.checkedAt}
          />
        ) : null}
      </div>
    </Page>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { Box, Button, Header, Input, Page, Spinner, Text } from 'zmp-ui';
import {
  haversineMeters,
  parseSessionIdFromQuery,
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
  const canSubmit = Boolean(session && studentCode.trim() && fix && !submitting);

  async function handleSubmit() {
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
      <Box p={4} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {!session && !sessionError ? <Spinner /> : null}
        {sessionError ? <StatusCard code="SESSION_CLOSED" message={sessionError} /> : null}

        {session ? (
          <Box style={{ background: '#f2f4f7', borderRadius: 12 }} p={4}>
            <Text size="large" bold>
              {session.title}
            </Text>
            <Box mt={1}>
              <Text size="small">
                {new Date(session.startsAt).toLocaleString('vi-VN')} —{' '}
                {new Date(session.endsAt).toLocaleString('vi-VN')}
              </Text>
            </Box>
            <Box mt={1}>
              <Text size="small">
                Phạm vi: trong {session.radiusM}m từ trường • Trạng thái: {session.status}
              </Text>
            </Box>
          </Box>
        ) : null}

        <Box>
          <Text bold>MSSV</Text>
          <Box mt={1}>
            <Input
              placeholder="VD: SV001"
              value={studentCode}
              onChange={(e) => setStudentCode(e.target.value)}
            />
          </Box>
        </Box>

        <Box style={{ background: '#f2f4f7', borderRadius: 12 }} p={4}>
          {status === 'loading' ? <Text>Đang lấy vị trí…</Text> : null}
          {status === 'error' ? <Text>GPS lỗi: {errorMessage}</Text> : null}
          {fix && distanceM !== null ? (
            <Text>
              Bạn cách trường {distanceM}m ({fix.source === 'zalo' ? 'Zalo GPS' : 'trình duyệt'}) —{' '}
              {inRange ? 'đủ điều kiện' : 'ngoài phạm vi'}.
            </Text>
          ) : null}
          {fix && 'accuracyM' in fix && fix.accuracyM && fix.accuracyM > 200 ? (
            <Box mt={1}>
              <Text size="small">GPS yếu (±{Math.round(fix.accuracyM)}m). Hãy ra chỗ thoáng.</Text>
            </Box>
          ) : null}
          <Box mt={2}>
            <Button variant="secondary" onClick={requestLocation}>
              Lấy lại vị trí
            </Button>
          </Box>
        </Box>

        <Button disabled={!canSubmit} loading={submitting} onClick={handleSubmit}>
          {inRange === false ? 'Ngoài phạm vi — vẫn thử gửi' : 'Điểm danh'}
        </Button>

        {result ? (
          <StatusCard
            code={result.code}
            message={result.message}
            checkedAt={result.data?.attendance.checkedAt}
          />
        ) : null}
      </Box>
    </Page>
  );
}

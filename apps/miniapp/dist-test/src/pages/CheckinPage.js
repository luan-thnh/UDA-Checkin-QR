import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { Box, Button, Header, Input, Page, Spinner, Text } from 'zmp-ui';
import { haversineMeters, parseSessionIdFromQuery, } from '@checkin/shared';
import { getSessionPublic, submitAttend } from '../services/api';
import { useCheckinLocation } from '../hooks/useCheckinLocation';
import { StatusCard } from '../components/StatusCard';
function readSessionId() {
    const params = new URLSearchParams(window.location.search);
    return parseSessionIdFromQuery({ session: params.get('session') ?? undefined });
}
export function CheckinPage() {
    const [sessionId] = useState(readSessionId);
    const [session, setSession] = useState(null);
    const [sessionError, setSessionError] = useState('');
    const [studentCode, setStudentCode] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState(null);
    const { fix, status, errorMessage, requestLocation } = useCheckinLocation();
    useEffect(() => {
        if (!sessionId) {
            setSessionError('Thiếu mã phiên. Hãy quét lại QR từ giảng viên.');
            return;
        }
        getSessionPublic(sessionId).then(setSession).catch((error) => setSessionError(error.message));
    }, [sessionId]);
    useEffect(() => {
        requestLocation();
    }, [requestLocation]);
    const distanceM = useMemo(() => {
        if (!fix || !session)
            return null;
        return Math.round(haversineMeters(fix.lat, fix.lng, session.latCenter, session.lngCenter));
    }, [fix, session]);
    const inRange = distanceM !== null && session !== null && distanceM <= session.radiusM;
    const canSubmit = Boolean(session && studentCode.trim() && fix && !submitting);
    async function handleSubmit() {
        if (!fix || !session)
            return;
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
        }
        catch {
            setResult({ code: 'INVALID_INPUT', message: 'Không gọi được server. Kiểm tra mạng.', data: null });
        }
        finally {
            setSubmitting(false);
        }
    }
    return (_jsxs(Page, { children: [_jsx(Header, { title: "Check-in sinh vi\u00EAn" }), _jsxs(Box, { p: 4, style: { display: 'flex', flexDirection: 'column', gap: 12 }, children: [!session && !sessionError ? _jsx(Spinner, {}) : null, sessionError ? _jsx(StatusCard, { code: "SESSION_CLOSED", message: sessionError }) : null, session ? (_jsxs(Box, { style: { background: '#f2f4f7', borderRadius: 12 }, p: 4, children: [_jsx(Text, { size: "large", bold: true, children: session.title }), _jsx(Box, { mt: 1, children: _jsxs(Text, { size: "small", children: [new Date(session.startsAt).toLocaleString('vi-VN'), " \u2014", ' ', new Date(session.endsAt).toLocaleString('vi-VN')] }) }), _jsx(Box, { mt: 1, children: _jsxs(Text, { size: "small", children: ["Ph\u1EA1m vi: trong ", session.radiusM, "m t\u1EEB tr\u01B0\u1EDDng \u2022 Tr\u1EA1ng th\u00E1i: ", session.status] }) })] })) : null, _jsxs(Box, { children: [_jsx(Text, { bold: true, children: "MSSV" }), _jsx(Box, { mt: 1, children: _jsx(Input, { placeholder: "VD: SV001", value: studentCode, onChange: (e) => setStudentCode(e.target.value) }) })] }), _jsxs(Box, { style: { background: '#f2f4f7', borderRadius: 12 }, p: 4, children: [status === 'loading' ? _jsx(Text, { children: "\u0110ang l\u1EA5y v\u1ECB tr\u00ED\u2026" }) : null, status === 'error' ? _jsxs(Text, { children: ["GPS l\u1ED7i: ", errorMessage] }) : null, fix && distanceM !== null ? (_jsxs(Text, { children: ["B\u1EA1n c\u00E1ch tr\u01B0\u1EDDng ", distanceM, "m (", fix.source === 'zalo' ? 'Zalo GPS' : 'trình duyệt', ") \u2014", ' ', inRange ? 'đủ điều kiện' : 'ngoài phạm vi', "."] })) : null, fix && 'accuracyM' in fix && fix.accuracyM && fix.accuracyM > 200 ? (_jsx(Box, { mt: 1, children: _jsxs(Text, { size: "small", children: ["GPS y\u1EBFu (\u00B1", Math.round(fix.accuracyM), "m). H\u00E3y ra ch\u1ED7 tho\u00E1ng."] }) })) : null, _jsx(Box, { mt: 2, children: _jsx(Button, { variant: "secondary", onClick: requestLocation, children: "L\u1EA5y l\u1EA1i v\u1ECB tr\u00ED" }) })] }), _jsx(Button, { disabled: !canSubmit, loading: submitting, onClick: handleSubmit, children: inRange === false ? 'Ngoài phạm vi — vẫn thử gửi' : 'Điểm danh' }), result ? (_jsx(StatusCard, { code: result.code, message: result.message, checkedAt: result.data?.attendance.checkedAt })) : null] })] }));
}

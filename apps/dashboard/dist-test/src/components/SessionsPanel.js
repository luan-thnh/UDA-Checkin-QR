import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Suspense, lazy, useEffect, useState } from 'react';
import { validateSessionForm } from '@checkin/shared';
import { closeSession, createSession, downloadWithAuth, fetchAttendances, fetchSessions, } from '../services/api';
const QRCodeSVG = lazy(() => import('qrcode.react').then((m) => ({ default: m.QRCodeSVG })));
const DEFAULT_CENTER = { lat: '10.762622', lng: '106.660172' };
export function SessionsPanel() {
    const [sessions, setSessions] = useState([]);
    const [title, setTitle] = useState('Lập trình Web - Tuần 1');
    const [lat, setLat] = useState(DEFAULT_CENTER.lat);
    const [lng, setLng] = useState(DEFAULT_CENTER.lng);
    const [radius, setRadius] = useState('2000');
    const [errors, setErrors] = useState({});
    const [notice, setNotice] = useState('');
    const [creating, setCreating] = useState(false);
    const [qrSession, setQrSession] = useState(null);
    const [detail, setDetail] = useState(null);
    async function reload() {
        try {
            setSessions((await fetchSessions()));
        }
        catch (error) {
            setNotice(error instanceof Error ? error.message : 'Lỗi tải phiên.');
        }
    }
    useEffect(() => {
        void reload();
    }, []);
    useEffect(() => {
        if (!detail)
            return;
        const sessionId = detail.session.id;
        const timer = setInterval(() => {
            fetchAttendances(sessionId).then(setDetail).catch(() => undefined);
        }, 5000);
        return () => clearInterval(timer);
    }, [detail]);
    async function handleCreate(event) {
        event.preventDefault();
        const now = new Date();
        const fieldErrors = validateSessionForm({
            title,
            latCenter: lat,
            lngCenter: lng,
            radiusM: radius,
            startsAt: now.toISOString(),
            endsAt: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(),
        });
        setErrors(fieldErrors);
        if (Object.keys(fieldErrors).length > 0)
            return;
        setCreating(true);
        try {
            const created = await createSession({
                title: title.trim(),
                latCenter: Number(lat),
                lngCenter: Number(lng),
                radiusM: Number(radius),
                startsAt: now.toISOString(),
                endsAt: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(),
            });
            setNotice(`Đã tạo phiên ${created.id}. Bấm QR để chiếu cho SV quét.`);
            setQrSession(created);
            await reload();
        }
        catch (error) {
            setNotice(error instanceof Error ? error.message : 'Tạo phiên thất bại.');
        }
        finally {
            setCreating(false);
        }
    }
    return (_jsxs(_Fragment, { children: [_jsxs("section", { className: "card", children: [_jsx("h3", { children: "T\u1EA1o phi\u00EAn \u0111i\u1EC3m danh" }), _jsxs("form", { onSubmit: handleCreate, noValidate: true, style: { display: 'grid', gap: 4 }, children: [_jsxs("label", { className: "field", children: ["T\u00EAn m\u00F4n / s\u1EF1 ki\u1EC7n", _jsx("input", { value: title, onChange: (e) => setTitle(e.target.value), placeholder: "VD: L\u1EADp tr\u00ECnh Web - Tu\u1EA7n 1", maxLength: 120, className: errors.title ? 'invalid' : '' }), _jsx("span", { className: "field-error", children: errors.title ?? '' })] }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }, children: [_jsxs("label", { className: "field", children: ["V\u0129 \u0111\u1ED9 tr\u01B0\u1EDDng", _jsx("input", { value: lat, onChange: (e) => setLat(e.target.value), placeholder: "10.762622", inputMode: "decimal", className: errors.latCenter ? 'invalid' : '' }), _jsx("span", { className: "field-error", children: errors.latCenter ?? '' })] }), _jsxs("label", { className: "field", children: ["Kinh \u0111\u1ED9 tr\u01B0\u1EDDng", _jsx("input", { value: lng, onChange: (e) => setLng(e.target.value), placeholder: "106.660172", inputMode: "decimal", className: errors.lngCenter ? 'invalid' : '' }), _jsx("span", { className: "field-error", children: errors.lngCenter ?? '' })] }), _jsxs("label", { className: "field", children: ["B\u00E1n k\u00EDnh (m)", _jsx("input", { value: radius, onChange: (e) => setRadius(e.target.value), placeholder: "2000", inputMode: "numeric", className: errors.radiusM ? 'invalid' : '' }), _jsx("span", { className: "field-error", children: errors.radiusM ?? '' })] })] }), _jsx("div", { children: _jsx("button", { type: "submit", className: "btn btn-primary", disabled: creating, children: creating ? 'Đang tạo…' : 'Tạo + sinh QR' }) })] }), notice ? _jsx("p", { className: "notice", children: notice }) : null] }), _jsxs("section", { className: "card", children: [_jsxs("h3", { children: ["Phi\u00EAn \u0111\u00E3 t\u1EA1o (", sessions.length, ")"] }), sessions.length === 0 ? (_jsx("p", { style: { color: 'var(--muted)' }, children: "Ch\u01B0a c\u00F3 phi\u00EAn n\u00E0o. T\u1EA1o phi\u00EAn \u0111\u1EA7u ti\u00EAn \u1EDF tr\u00EAn." })) : (_jsx("ul", { className: "session-list", children: sessions.map((session) => (_jsxs("li", { className: "session-item", children: [_jsxs("div", { className: "meta", children: [_jsx("b", { children: session.title }), ' ', _jsx("span", { className: session.status === 'active' ? 'pill' : 'pill closed', children: session.status === 'active' ? 'Đang mở' : 'Đã đóng' }), _jsx("br", {}), _jsxs("small", { children: [session.id, " \u00B7 b\u00E1n k\u00EDnh ", session.radiusM, "m \u00B7", ' ', new Date(session.endsAt).toLocaleString('vi-VN')] })] }), _jsx("button", { className: "btn btn-accent", onClick: () => setQrSession(session), children: "QR" }), _jsx("button", { className: "btn btn-ghost", onClick: () => fetchAttendances(session.id).then(setDetail).catch(() => undefined), children: "Live" }), _jsx("button", { className: "btn btn-ghost", onClick: () => downloadWithAuth(`/api/sessions/${session.id}/export`, `diem-danh-${session.id}.csv`), children: "Xu\u1EA5t" }), session.status === 'active' ? (_jsx("button", { className: "btn btn-danger-ghost", onClick: () => closeSession(session.id).then(() => void reload()), children: "\u0110\u00F3ng" })) : null] }, session.id))) })), qrSession ? (_jsxs("div", { className: "qr-panel", children: [_jsx("h4", { style: { margin: '0 0 8px' }, children: qrSession.title }), _jsx(Suspense, { fallback: _jsx("p", { children: "\u0110ang t\u1EA3i QR\u2026" }), children: _jsx(QRCodeSVG, { value: qrSession.qrPayload ?? `session=${qrSession.id}`, size: 232 }) }), _jsx("p", { children: _jsx("code", { children: qrSession.qrPayload ?? qrSession.id }) }), _jsx("button", { className: "btn btn-ghost", onClick: () => setQrSession(null), children: "\u0110\u00F3ng" })] })) : null, detail ? (_jsxs("div", { children: [_jsxs("h4", { children: ["Live: ", detail.session.title, " \u2014 ", detail.total, " \u0111\u00E3 check-in"] }), _jsxs("table", { className: "grid", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "MSSV" }), _jsx("th", { children: "H\u1ECD t\u00EAn" }), _jsx("th", { children: "Gi\u1EDD check-in" }), _jsx("th", { children: "C\u00E1ch tr\u01B0\u1EDDng (m)" })] }) }), _jsx("tbody", { children: detail.records.map((row) => (_jsxs("tr", { children: [_jsx("td", { children: _jsx("b", { children: String(row['studentCode'] ?? '') }) }), _jsx("td", { children: String(row['fullName'] ?? '') }), _jsx("td", { children: new Date(String(row['checkedAt'] ?? '')).toLocaleString('vi-VN') }), _jsx("td", { children: String(row['distanceM'] ?? '') })] }, String(row['id'] ?? row['studentCode'])))) })] })] })) : null] })] }));
}

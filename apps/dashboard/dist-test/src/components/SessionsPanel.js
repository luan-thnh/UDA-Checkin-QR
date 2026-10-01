import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Suspense, lazy, useEffect, useState } from 'react';
import { closeSession, createSession, downloadWithAuth, fetchAttendances, fetchSessions, } from '../services/api';
const QRCodeSVG = lazy(() => import('qrcode.react').then((m) => ({ default: m.QRCodeSVG })));
const DEFAULT_CENTER = { lat: 10.762622, lng: 106.660172 };
function toLocalInput(iso) {
    return iso.slice(0, 16);
}
export function SessionsPanel() {
    const [sessions, setSessions] = useState([]);
    const [title, setTitle] = useState('Lập trình Web - Tuần 1');
    const [lat, setLat] = useState(String(DEFAULT_CENTER.lat));
    const [lng, setLng] = useState(String(DEFAULT_CENTER.lng));
    const [radius, setRadius] = useState('2000');
    const [notice, setNotice] = useState('');
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
        const timer = setInterval(() => {
            fetchAttendances(detail.session.id).then(setDetail).catch(() => undefined);
        }, 5000);
        return () => clearInterval(timer);
    }, [detail?.session.id]);
    async function handleCreate(event) {
        event.preventDefault();
        const now = new Date();
        try {
            const created = await createSession({
                title,
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
    }
    return (_jsxs("section", { children: [_jsx("h3", { children: "T\u1EA1o phi\u00EAn \u0111i\u1EC3m danh (QR)" }), _jsxs("form", { onSubmit: handleCreate, style: { display: 'grid', gap: 8, maxWidth: 480 }, children: [_jsx("input", { value: title, onChange: (e) => setTitle(e.target.value), placeholder: "T\u00EAn m\u00F4n / s\u1EF1 ki\u1EC7n" }), _jsxs("div", { style: { display: 'flex', gap: 8 }, children: [_jsx("input", { value: lat, onChange: (e) => setLat(e.target.value), placeholder: "V\u0129 \u0111\u1ED9 tr\u01B0\u1EDDng" }), _jsx("input", { value: lng, onChange: (e) => setLng(e.target.value), placeholder: "Kinh \u0111\u1ED9 tr\u01B0\u1EDDng" }), _jsx("input", { value: radius, onChange: (e) => setRadius(e.target.value), placeholder: "B\u00E1n k\u00EDnh (m)" })] }), _jsx("button", { type: "submit", children: "T\u1EA1o + sinh QR" })] }), notice ? _jsx("p", { children: notice }) : null, _jsx("h3", { children: "Danh s\u00E1ch phi\u00EAn" }), _jsx("ul", { children: sessions.map((session) => (_jsxs("li", { style: { marginBottom: 8 }, children: [_jsx("b", { children: session.title }), " (", session.id, ") \u2014 ", session.status, " \u2014 b\u00E1n k\u00EDnh ", session.radiusM, "m \u2014", ' ', toLocalInput(session.startsAt), " \u2192 ", toLocalInput(session.endsAt), ' ', _jsx("button", { onClick: () => setQrSession(session), children: "QR" }), ' ', _jsx("button", { onClick: () => fetchAttendances(session.id).then(setDetail).catch(() => undefined), children: "Live" }), ' ', _jsx("button", { onClick: () => downloadWithAuth(`/api/sessions/${session.id}/export`, `diem-danh-${session.id}.csv`), children: "Xu\u1EA5t" }), ' ', session.status === 'active' ? (_jsx("button", { onClick: () => closeSession(session.id).then(() => void reload()), children: "\u0110\u00F3ng" })) : null] }, session.id))) }), qrSession ? (_jsxs("div", { style: { border: '1px solid #ccc', padding: 16, maxWidth: 360 }, children: [_jsxs("h4", { children: ["QR: ", qrSession.title] }), _jsx(Suspense, { fallback: _jsx("p", { children: "\u0110ang t\u1EA3i QR\u2026" }), children: _jsx(QRCodeSVG, { value: qrSession.qrPayload ?? `session=${qrSession.id}`, size: 256 }) }), _jsx("p", { style: { wordBreak: 'break-all' }, children: qrSession.qrPayload ?? qrSession.id }), _jsx("button", { onClick: () => setQrSession(null), children: "\u0110\u00F3ng" })] })) : null, detail ? (_jsxs("div", { children: [_jsxs("h4", { children: ["Live: ", detail.session.title, " \u2014 ", detail.total, " \u0111\u00E3 check-in"] }), _jsxs("table", { border: 1, cellPadding: 6, style: { borderCollapse: 'collapse', width: '100%' }, children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "MSSV" }), _jsx("th", { children: "H\u1ECD t\u00EAn" }), _jsx("th", { children: "Gi\u1EDD check-in" }), _jsx("th", { children: "C\u00E1ch tr\u01B0\u1EDDng (m)" })] }) }), _jsx("tbody", { children: detail.records.map((row) => (_jsxs("tr", { children: [_jsx("td", { children: String(row['studentCode'] ?? '') }), _jsx("td", { children: String(row['fullName'] ?? '') }), _jsx("td", { children: new Date(String(row['checkedAt'] ?? '')).toLocaleString('vi-VN') }), _jsx("td", { children: String(row['distanceM'] ?? '') })] }, String(row['id'] ?? row['studentCode'])))) })] })] })) : null] }));
}

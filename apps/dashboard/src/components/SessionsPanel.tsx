import { Suspense, lazy, useEffect, useState } from 'react';
import {
  closeSession,
  createSession,
  downloadWithAuth,
  fetchAttendances,
  fetchSessions,
  type AttendanceListData,
  type CreatedSession,
} from '../services/api';

const QRCodeSVG = lazy(() => import('qrcode.react').then((m) => ({ default: m.QRCodeSVG })));

const DEFAULT_CENTER = { lat: 10.762622, lng: 106.660172 };

function toLocalInput(iso: string): string {
  return iso.slice(0, 16);
}

export function SessionsPanel() {
  const [sessions, setSessions] = useState<CreatedSession[]>([]);
  const [title, setTitle] = useState('Lập trình Web - Tuần 1');
  const [lat, setLat] = useState(String(DEFAULT_CENTER.lat));
  const [lng, setLng] = useState(String(DEFAULT_CENTER.lng));
  const [radius, setRadius] = useState('2000');
  const [notice, setNotice] = useState('');
  const [qrSession, setQrSession] = useState<CreatedSession | null>(null);
  const [detail, setDetail] = useState<AttendanceListData | null>(null);

  async function reload() {
    try {
      setSessions((await fetchSessions()) as CreatedSession[]);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Lỗi tải phiên.');
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  useEffect(() => {
    if (!detail) return;
    const timer = setInterval(() => {
      fetchAttendances(detail.session.id).then(setDetail).catch(() => undefined);
    }, 5000);
    return () => clearInterval(timer);
  }, [detail?.session.id]);

  async function handleCreate(event: React.FormEvent) {
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
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Tạo phiên thất bại.');
    }
  }

  return (
    <section>
      <h3>Tạo phiên điểm danh (QR)</h3>
      <form onSubmit={handleCreate} style={{ display: 'grid', gap: 8, maxWidth: 480 }}>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Tên môn / sự kiện" />
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={lat} onChange={(e) => setLat(e.target.value)} placeholder="Vĩ độ trường" />
          <input value={lng} onChange={(e) => setLng(e.target.value)} placeholder="Kinh độ trường" />
          <input value={radius} onChange={(e) => setRadius(e.target.value)} placeholder="Bán kính (m)" />
        </div>
        <button type="submit">Tạo + sinh QR</button>
      </form>
      {notice ? <p>{notice}</p> : null}

      <h3>Danh sách phiên</h3>
      <ul>
        {sessions.map((session) => (
          <li key={session.id} style={{ marginBottom: 8 }}>
            <b>{session.title}</b> ({session.id}) — {session.status} — bán kính {session.radiusM}m —{' '}
            {toLocalInput(session.startsAt)} → {toLocalInput(session.endsAt)}{' '}
            <button onClick={() => setQrSession(session)}>QR</button>{' '}
            <button onClick={() => fetchAttendances(session.id).then(setDetail).catch(() => undefined)}>
              Live
            </button>{' '}
            <button
              onClick={() => downloadWithAuth(`/api/sessions/${session.id}/export`, `diem-danh-${session.id}.csv`)}
            >
              Xuất
            </button>{' '}
            {session.status === 'active' ? (
              <button onClick={() => closeSession(session.id).then(() => void reload())}>Đóng</button>
            ) : null}
          </li>
        ))}
      </ul>

      {qrSession ? (
        <div style={{ border: '1px solid #ccc', padding: 16, maxWidth: 360 }}>
          <h4>QR: {qrSession.title}</h4>
          <Suspense fallback={<p>Đang tải QR…</p>}>
            <QRCodeSVG
              value={qrSession.qrPayload ?? `session=${qrSession.id}`}
              size={256}
            />
          </Suspense>
          <p style={{ wordBreak: 'break-all' }}>{qrSession.qrPayload ?? qrSession.id}</p>
          <button onClick={() => setQrSession(null)}>Đóng</button>
        </div>
      ) : null}

      {detail ? (
        <div>
          <h4>
            Live: {detail.session.title} — {detail.total} đã check-in
          </h4>
          <table border={1} cellPadding={6} style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr>
                <th>MSSV</th>
                <th>Họ tên</th>
                <th>Giờ check-in</th>
                <th>Cách trường (m)</th>
              </tr>
            </thead>
            <tbody>
              {detail.records.map((row) => (
                <tr key={String(row['id'] ?? row['studentCode'])}>
                  <td>{String(row['studentCode'] ?? '')}</td>
                  <td>{String(row['fullName'] ?? '')}</td>
                  <td>{new Date(String(row['checkedAt'] ?? '')).toLocaleString('vi-VN')}</td>
                  <td>{String(row['distanceM'] ?? '')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}

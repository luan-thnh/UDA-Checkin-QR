import { Suspense, lazy, useEffect, useState } from 'react';
import { validateSessionForm, type FieldErrors } from '@checkin/shared';
import {
  closeSession,
  createSession,
  downloadWithAuth,
  fetchAttendances,
  fetchSessions,
  type AttendanceListData,
  type CreatedSession,
} from '../services/api';
import { QrPresent } from './QrPresent';

const QRCodeSVG = lazy(() => import('qrcode.react').then((m) => ({ default: m.QRCodeSVG })));

const DEFAULT_CENTER = { lat: '10.762622', lng: '106.660172' };

export function SessionsPanel() {
  const [sessions, setSessions] = useState<CreatedSession[]>([]);
  const [title, setTitle] = useState('Lập trình Web - Tuần 1');
  const [lat, setLat] = useState(DEFAULT_CENTER.lat);
  const [lng, setLng] = useState(DEFAULT_CENTER.lng);
  const [radius, setRadius] = useState('2000');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [notice, setNotice] = useState('');
  const [creating, setCreating] = useState(false);
  const [qrSession, setQrSession] = useState<CreatedSession | null>(null);
  const [presentSession, setPresentSession] = useState<CreatedSession | null>(null);
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
    const sessionId = detail.session.id;
    const timer = setInterval(() => {
      fetchAttendances(sessionId).then(setDetail).catch(() => undefined);
    }, 5000);
    return () => clearInterval(timer);
  }, [detail]);

  async function handleCreate(event: React.FormEvent) {
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
    if (Object.keys(fieldErrors).length > 0) return;
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
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Tạo phiên thất bại.');
    } finally {
      setCreating(false);
    }
  }

  return (
    <>
      <section className="card">
        <h3>Tạo phiên điểm danh</h3>
        <form onSubmit={handleCreate} noValidate style={{ display: 'grid', gap: 4 }}>
          <label className="field">
            Tên môn / sự kiện
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Lập trình Web - Tuần 1"
              maxLength={120}
              className={errors.title ? 'invalid' : ''}
            />
            <span className="field-error">{errors.title ?? ''}</span>
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <label className="field">
              Vĩ độ trường
              <input
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                placeholder="10.762622"
                inputMode="decimal"
                className={errors.latCenter ? 'invalid' : ''}
              />
              <span className="field-error">{errors.latCenter ?? ''}</span>
            </label>
            <label className="field">
              Kinh độ trường
              <input
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                placeholder="106.660172"
                inputMode="decimal"
                className={errors.lngCenter ? 'invalid' : ''}
              />
              <span className="field-error">{errors.lngCenter ?? ''}</span>
            </label>
            <label className="field">
              Bán kính (m)
              <input
                value={radius}
                onChange={(e) => setRadius(e.target.value)}
                placeholder="2000"
                inputMode="numeric"
                className={errors.radiusM ? 'invalid' : ''}
              />
              <span className="field-error">{errors.radiusM ?? ''}</span>
            </label>
          </div>
          <div>
            <button type="submit" className="btn btn-primary" disabled={creating}>
              {creating ? 'Đang tạo…' : 'Tạo + sinh QR'}
            </button>
          </div>
        </form>
        {notice ? <p className="notice">{notice}</p> : null}
      </section>

      <section className="card">
        <h3>Phiên đã tạo ({sessions.length})</h3>
        {sessions.length === 0 ? (
          <p style={{ color: 'var(--muted)' }}>Chưa có phiên nào. Tạo phiên đầu tiên ở trên.</p>
        ) : (
          <ul className="session-list">
            {sessions.map((session) => (
              <li key={session.id} className="session-item">
                <div className="meta">
                  <b>{session.title}</b>{' '}
                  <span className={session.status === 'active' ? 'pill' : 'pill closed'}>
                    {session.status === 'active' ? 'Đang mở' : 'Đã đóng'}
                  </span>
                  <br />
                  <small>
                    {session.id} · bán kính {session.radiusM}m ·{' '}
                    {new Date(session.endsAt).toLocaleString('vi-VN')}
                  </small>
                </div>
                <button className="btn btn-accent" onClick={() => setQrSession(session)}>
                  QR
                </button>
                <button className="btn btn-primary" onClick={() => setPresentSession(session)}>
                  Chiếu
                </button>
                <button
                  className="btn btn-ghost"
                  onClick={() => fetchAttendances(session.id).then(setDetail).catch(() => undefined)}
                >
                  Live
                </button>
                <button
                  className="btn btn-ghost"
                  onClick={() =>
                    downloadWithAuth(`/api/sessions/${session.id}/export`, `diem-danh-${session.id}.csv`)
                  }
                >
                  Xuất
                </button>
                {session.status === 'active' ? (
                  <button
                    className="btn btn-danger-ghost"
                    onClick={() => closeSession(session.id).then(() => void reload())}
                  >
                    Đóng
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        )}

        {presentSession ? (
          <QrPresent
            sessionId={presentSession.id}
            title={presentSession.title}
            qrPayload={presentSession.qrPayload ?? `session=${presentSession.id}`}
            endsAt={presentSession.endsAt}
            onClose={() => setPresentSession(null)}
          />
        ) : null}

        {qrSession ? (
          <div className="qr-panel">
            <h4 style={{ margin: '0 0 8px' }}>{qrSession.title}</h4>
            <Suspense fallback={<p>Đang tải QR…</p>}>
              <QRCodeSVG value={qrSession.qrPayload ?? `session=${qrSession.id}`} size={232} />
            </Suspense>
            <p>
              <code>{qrSession.qrPayload ?? qrSession.id}</code>
            </p>
            <button className="btn btn-ghost" onClick={() => setQrSession(null)}>
              Đóng
            </button>
          </div>
        ) : null}

        {detail ? (
          <div>
            <h4>
              Live: {detail.session.title} — {detail.total} đã check-in
            </h4>
            <table className="grid">
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
                    <td>
                      <b>{String(row['studentCode'] ?? '')}</b>
                    </td>
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
    </>
  );
}

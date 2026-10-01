import { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { fetchAttendances, type AttendanceListData } from '../services/api';

const QRCodeSVG = lazy(() => import('qrcode.react').then((m) => ({ default: m.QRCodeSVG })));

interface Props {
  sessionId: string;
  title: string;
  qrPayload: string;
  endsAt: string;
  onClose: () => void;
}

function remainingLabel(endsAt: string, now: number): string {
  const ms = new Date(endsAt).getTime() - now;
  if (ms <= 0) return 'Đã hết giờ';
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const hours = Math.floor(minutes / 60);
  const pad = (n: number) => String(n).padStart(2, '0');
  return hours > 0 ? `Còn ${hours}:${pad(minutes % 60)}:${pad(seconds)}` : `Còn ${pad(minutes)}:${pad(seconds)}`;
}

export function QrPresent({ sessionId, title, qrPayload, endsAt, onClose }: Props) {
  const [detail, setDetail] = useState<AttendanceListData | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    fetchAttendances(sessionId).then(setDetail).catch(() => undefined);
    const timer = setInterval(() => {
      setNow(Date.now());
      fetchAttendances(sessionId).then(setDetail).catch(() => undefined);
    }, 3000);
    return () => clearInterval(timer);
  }, [sessionId]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const expired = useMemo(() => new Date(endsAt).getTime() <= now, [endsAt, now]);

  return (
    <div className="present" role="dialog" aria-label="Chiếu mã QR điểm danh">
      <div className="present-top">
        <div>
          <div className="present-kicker">Quét Zalo để điểm danh</div>
          <h2>{title}</h2>
        </div>
        <div className="present-tools no-print">
          <button className="btn btn-ghost" onClick={() => window.print()}>
            In QR
          </button>
          <button className="btn btn-ghost" onClick={onClose}>
            Thoát (Esc)
          </button>
        </div>
      </div>
      <div className="present-qr">
        <Suspense fallback={<p>Đang tải QR…</p>}>
          <QRCodeSVG value={qrPayload} size={420} />
        </Suspense>
      </div>
      <div className="present-stats">
        <span className={expired ? 'pill closed' : 'pill'}>
          {remainingLabel(endsAt, now)}
        </span>
        <span className="present-count">
          <b>{detail?.total ?? '…'}</b> đã điểm danh
        </span>
      </div>
    </div>
  );
}

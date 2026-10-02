import { Icon } from 'zmp-ui';
import type { AttendanceResultCode } from '@checkin/shared';

const CLASS_BY_CODE: Record<AttendanceResultCode, 'success' | 'warn' | 'fail'> = {
  SUCCESS: 'success',
  ALREADY_CHECKED: 'warn',
  OUT_OF_RANGE: 'fail',
  SESSION_CLOSED: 'fail',
  STUDENT_NOT_FOUND: 'fail',
  INVALID_INPUT: 'fail',
};

const TITLE_BY_CODE: Record<AttendanceResultCode, string> = {
  SUCCESS: 'Điểm danh thành công',
  ALREADY_CHECKED: 'Bạn đã điểm danh rồi',
  OUT_OF_RANGE: 'Ngoài phạm vi cho phép',
  SESSION_CLOSED: 'Phiên đã đóng',
  STUDENT_NOT_FOUND: 'Không tìm thấy MSSV',
  INVALID_INPUT: 'Dữ liệu chưa hợp lệ',
};

const ICON_BY_CODE: Record<AttendanceResultCode, string> = {
  SUCCESS: 'zi-check-circle-solid',
  ALREADY_CHECKED: 'zi-info-circle-solid',
  OUT_OF_RANGE: 'zi-location-solid',
  SESSION_CLOSED: 'zi-close-circle-solid',
  STUDENT_NOT_FOUND: 'zi-user-solid',
  INVALID_INPUT: 'zi-warning-solid',
};

interface Props {
  code: AttendanceResultCode;
  message: string;
  checkedAt?: string;
}

export function StatusCard({ code, message, checkedAt }: Props) {
  const type = CLASS_BY_CODE[code];
  
  let iconColor = 'var(--primary-deep)';
  if (type === 'warn') iconColor = '#B45309';
  if (type === 'fail') iconColor = 'var(--danger)';

  return (
    <div className={`result-card ${type}`}>
      <div className="result-icon">
        <Icon icon={ICON_BY_CODE[code] as any} size={36} style={{ color: iconColor }} />
      </div>
      <h3>{TITLE_BY_CODE[code]}</h3>
      <p>{message}</p>
      {checkedAt ? (
        <p style={{ fontSize: 12, marginTop: 8, color: 'var(--muted)' }}>
          Giờ check-in: {new Date(checkedAt).toLocaleString('vi-VN')}
        </p>
      ) : null}
    </div>
  );
}

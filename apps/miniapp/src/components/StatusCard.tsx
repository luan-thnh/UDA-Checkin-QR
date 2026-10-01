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

interface Props {
  code: AttendanceResultCode;
  message: string;
  checkedAt?: string;
}

export function StatusCard({ code, message, checkedAt }: Props) {
  return (
    <div className={`ci-result ${CLASS_BY_CODE[code]}`}>
      <h3>{TITLE_BY_CODE[code]}</h3>
      <p>{message}</p>
      {checkedAt ? (
        <p style={{ fontSize: 12, marginTop: 4 }}>
          Giờ check-in: {new Date(checkedAt).toLocaleString('vi-VN')}
        </p>
      ) : null}
    </div>
  );
}

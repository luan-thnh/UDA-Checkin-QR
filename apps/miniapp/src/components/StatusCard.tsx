import { Box, Text } from 'zmp-ui';
import type { AttendanceResultCode } from '@checkin/shared';

const STYLE_BY_CODE: Record<AttendanceResultCode, { bg: string; title: string }> = {
  SUCCESS: { bg: '#e7f6ec', title: 'Điểm danh thành công' },
  ALREADY_CHECKED: { bg: '#fff4d6', title: 'Bạn đã điểm danh rồi' },
  OUT_OF_RANGE: { bg: '#fde8e8', title: 'Ngoài phạm vi cho phép' },
  SESSION_CLOSED: { bg: '#fde8e8', title: 'Phiên đã đóng' },
  STUDENT_NOT_FOUND: { bg: '#fde8e8', title: 'Không tìm thấy MSSV' },
  INVALID_INPUT: { bg: '#fde8e8', title: 'Dữ liệu chưa hợp lệ' },
};

interface Props {
  code: AttendanceResultCode;
  message: string;
  checkedAt?: string;
}

export function StatusCard({ code, message, checkedAt }: Props) {
  const style = STYLE_BY_CODE[code];
  return (
    <Box p={4} style={{ background: style.bg, borderRadius: 12 }}>
      <Text size="large" bold>
        {style.title}
      </Text>
      <Box mt={2}>
        <Text>{message}</Text>
      </Box>
      {checkedAt ? (
        <Box mt={1}>
          <Text size="small">Giờ check-in: {new Date(checkedAt).toLocaleString('vi-VN')}</Text>
        </Box>
      ) : null}
    </Box>
  );
}

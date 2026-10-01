import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from 'zmp-ui';
const STYLE_BY_CODE = {
    SUCCESS: { bg: '#e7f6ec', title: 'Điểm danh thành công' },
    ALREADY_CHECKED: { bg: '#fff4d6', title: 'Bạn đã điểm danh rồi' },
    OUT_OF_RANGE: { bg: '#fde8e8', title: 'Ngoài phạm vi cho phép' },
    SESSION_CLOSED: { bg: '#fde8e8', title: 'Phiên đã đóng' },
    STUDENT_NOT_FOUND: { bg: '#fde8e8', title: 'Không tìm thấy MSSV' },
    INVALID_INPUT: { bg: '#fde8e8', title: 'Dữ liệu chưa hợp lệ' },
};
export function StatusCard({ code, message, checkedAt }) {
    const style = STYLE_BY_CODE[code];
    return (_jsxs(Box, { p: 4, style: { background: style.bg, borderRadius: 12 }, children: [_jsx(Text, { size: "large", bold: true, children: style.title }), _jsx(Box, { mt: 2, children: _jsx(Text, { children: message }) }), checkedAt ? (_jsx(Box, { mt: 1, children: _jsxs(Text, { size: "small", children: ["Gi\u1EDD check-in: ", new Date(checkedAt).toLocaleString('vi-VN')] }) })) : null] }));
}

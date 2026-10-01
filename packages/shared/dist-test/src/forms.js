import { isValidCoordinate, isValidStudentCode, normalizeRadiusM, normalizeStudentCode, } from './validate.js';
import { DEFAULT_RADIUS_M } from './types.js';
export function validateLoginForm(email, password) {
    const errors = {};
    if (!email.trim()) {
        errors.email = 'Nhập email admin.';
    }
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        errors.email = 'Email chưa đúng định dạng.';
    }
    if (!password) {
        errors.password = 'Nhập mật khẩu.';
    }
    else if (password.length < 6) {
        errors.password = 'Mật khẩu ít nhất 6 ký tự.';
    }
    return errors;
}
export function validateSessionForm(values) {
    const errors = {};
    if (!values.title.trim()) {
        errors.title = 'Nhập tên môn / sự kiện.';
    }
    else if (values.title.trim().length > 120) {
        errors.title = 'Tên quá dài (tối đa 120 ký tự).';
    }
    const lat = Number(values.latCenter);
    const lng = Number(values.lngCenter);
    if (!values.latCenter.trim() || Number.isNaN(lat)) {
        errors.latCenter = 'Nhập vĩ độ (số, VD: 10.762622).';
    }
    if (!values.lngCenter.trim() || Number.isNaN(lng)) {
        errors.lngCenter = 'Nhập kinh độ (số, VD: 106.660172).';
    }
    if (!Number.isNaN(lat) && !Number.isNaN(lng) && !isValidCoordinate(lat, lng)) {
        errors.latCenter = 'Tọa độ ngoài quả đất (vĩ độ -90..90, kinh độ -180..180).';
    }
    const radius = Number(values.radiusM);
    if (!values.radiusM.trim() || Number.isNaN(radius)) {
        errors.radiusM = `Nhập bán kính (mặc định ${DEFAULT_RADIUS_M}m).`;
    }
    else if (radius < 50 || radius > 10000) {
        errors.radiusM = 'Bán kính phải từ 50m đến 10000m.';
    }
    const startsAt = new Date(values.startsAt);
    const endsAt = new Date(values.endsAt);
    if (Number.isNaN(startsAt.getTime()))
        errors.startsAt = 'Chọn giờ bắt đầu.';
    if (Number.isNaN(endsAt.getTime()))
        errors.endsAt = 'Chọn giờ kết thúc.';
    if (!errors.startsAt && !errors.endsAt && endsAt <= startsAt) {
        errors.endsAt = 'Giờ kết thúc phải sau giờ bắt đầu.';
    }
    return errors;
}
export function validateAttendForm(studentCode) {
    const errors = {};
    const normalized = normalizeStudentCode(studentCode);
    if (!normalized) {
        errors.studentCode = 'Nhập MSSV của bạn.';
    }
    else if (!isValidStudentCode(normalized)) {
        errors.studentCode = 'MSSV chỉ gồm chữ, số, gạch ngang (4–20 ký tự).';
    }
    return errors;
}
export { normalizeRadiusM };

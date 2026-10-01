import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { validateLoginForm } from '@checkin/shared';
import { login, setToken } from '../services/api';
export function LoginForm({ onDone }) {
    const [email, setEmail] = useState('admin@truong.edu.vn');
    const [password, setPassword] = useState('admin123');
    const [errors, setErrors] = useState({});
    const [serverError, setServerError] = useState('');
    const [loading, setLoading] = useState(false);
    async function handleSubmit(event) {
        event.preventDefault();
        const fieldErrors = validateLoginForm(email, password);
        setErrors(fieldErrors);
        if (Object.keys(fieldErrors).length > 0)
            return;
        setLoading(true);
        setServerError('');
        try {
            const data = await login(email.trim(), password);
            setToken(data.token);
            onDone();
        }
        catch (err) {
            setServerError(err instanceof Error ? err.message : 'Đăng nhập thất bại.');
        }
        finally {
            setLoading(false);
        }
    }
    return (_jsx("div", { className: "login-wrap", children: _jsxs("div", { className: "card login-card", children: [_jsxs("div", { className: "brand", children: [_jsx("span", { className: "brand-mark", children: "\u2713" }), _jsxs("div", { children: [_jsx("h1", { children: "\u0110i\u1EC3m danh QR" }), _jsx("p", { children: "\u0110\u0103ng nh\u1EADp qu\u1EA3n tr\u1ECB vi\u00EAn" })] })] }), _jsxs("form", { onSubmit: handleSubmit, noValidate: true, children: [_jsxs("label", { className: "field", children: ["Email admin", _jsx("input", { value: email, onChange: (e) => setEmail(e.target.value), placeholder: "admin@truong.edu.vn", autoComplete: "username", className: errors.email ? 'invalid' : '' }), _jsx("span", { className: "field-error", children: errors.email ?? '' })] }), _jsxs("label", { className: "field", children: ["M\u1EADt kh\u1EA9u", _jsx("input", { type: "password", value: password, onChange: (e) => setPassword(e.target.value), placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", autoComplete: "current-password", className: errors.password ? 'invalid' : '' }), _jsx("span", { className: "field-error", children: errors.password ?? '' })] }), serverError ? _jsx("p", { className: "notice error", children: serverError }) : null, _jsx("button", { type: "submit", className: "btn btn-primary", disabled: loading, children: loading ? 'Đang đăng nhập…' : 'Đăng nhập' })] })] }) }));
}

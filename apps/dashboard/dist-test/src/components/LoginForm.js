import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { login, setToken } from '../services/api';
export function LoginForm({ onDone }) {
    const [email, setEmail] = useState('admin@truong.edu.vn');
    const [password, setPassword] = useState('admin123');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    async function handleSubmit(event) {
        event.preventDefault();
        setLoading(true);
        setError('');
        try {
            const data = await login(email, password);
            setToken(data.token);
            onDone();
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Đăng nhập thất bại.');
        }
        finally {
            setLoading(false);
        }
    }
    return (_jsxs("form", { onSubmit: handleSubmit, style: { maxWidth: 360, margin: '80px auto', display: 'grid', gap: 12 }, children: [_jsx("h2", { children: "Dashboard \u0111i\u1EC3m danh" }), _jsx("input", { value: email, onChange: (e) => setEmail(e.target.value), placeholder: "Email admin" }), _jsx("input", { type: "password", value: password, onChange: (e) => setPassword(e.target.value), placeholder: "M\u1EADt kh\u1EA9u" }), error ? _jsx("p", { style: { color: 'red' }, children: error }) : null, _jsx("button", { type: "submit", disabled: loading, children: loading ? 'Đang đăng nhập…' : 'Đăng nhập' })] }));
}

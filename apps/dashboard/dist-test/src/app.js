import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { clearToken, getToken } from './services/api';
import { LoginForm } from './components/LoginForm';
import { StudentsPanel } from './components/StudentsPanel';
import { SessionsPanel } from './components/SessionsPanel';
export function DashboardApp() {
    const [authed, setAuthed] = useState(() => Boolean(getToken()));
    const [tab, setTab] = useState('sessions');
    if (!authed)
        return _jsx(LoginForm, { onDone: () => setAuthed(true) });
    return (_jsxs("div", { className: "shell", children: [_jsxs("header", { className: "brandbar", children: [_jsxs("div", { className: "brand", children: [_jsx("span", { className: "brand-mark", children: "\u2713" }), _jsxs("div", { children: [_jsx("h1", { children: "\u0110i\u1EC3m danh QR" }), _jsx("p", { children: "Zalo Mini App \u00B7 Dashboard qu\u1EA3n l\u00FD" })] })] }), _jsx("button", { className: "btn btn-ghost", onClick: () => {
                            clearToken();
                            setAuthed(false);
                        }, children: "\u0110\u0103ng xu\u1EA5t" })] }), _jsxs("nav", { className: "tabs", children: [_jsx("button", { onClick: () => setTab('sessions'), disabled: tab === 'sessions', children: "Phi\u00EAn + QR" }), _jsx("button", { onClick: () => setTab('students'), disabled: tab === 'students', children: "Sinh vi\u00EAn" })] }), _jsx("main", { children: tab === 'sessions' ? _jsx(SessionsPanel, {}) : _jsx(StudentsPanel, {}) })] }));
}

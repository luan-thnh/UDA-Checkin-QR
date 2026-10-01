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
    return (_jsxs("div", { style: { maxWidth: 960, margin: '0 auto', padding: 16 }, children: [_jsxs("header", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, children: [_jsx("h2", { children: "Dashboard \u0111i\u1EC3m danh" }), _jsx("button", { onClick: () => {
                            clearToken();
                            setAuthed(false);
                        }, children: "\u0110\u0103ng xu\u1EA5t" })] }), _jsxs("nav", { style: { display: 'flex', gap: 8, margin: '12px 0' }, children: [_jsx("button", { onClick: () => setTab('sessions'), disabled: tab === 'sessions', children: "Phi\u00EAn + QR" }), _jsx("button", { onClick: () => setTab('students'), disabled: tab === 'students', children: "Sinh vi\u00EAn" })] }), tab === 'sessions' ? _jsx(SessionsPanel, {}) : _jsx(StudentsPanel, {})] }));
}

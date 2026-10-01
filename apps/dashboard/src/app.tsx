import { useState } from 'react';
import { clearToken, getToken } from './services/api';
import { LoginForm } from './components/LoginForm';
import { StudentsPanel } from './components/StudentsPanel';
import { SessionsPanel } from './components/SessionsPanel';

type Tab = 'students' | 'sessions';

export function DashboardApp() {
  const [authed, setAuthed] = useState(() => Boolean(getToken()));
  const [tab, setTab] = useState<Tab>('sessions');

  if (!authed) return <LoginForm onDone={() => setAuthed(true)} />;

  return (
    <div className="shell">
      <header className="brandbar">
        <div className="brand">
          <span className="brand-mark">✓</span>
          <div>
            <h1>Điểm danh QR</h1>
            <p>Zalo Mini App · Dashboard quản lý</p>
          </div>
        </div>
        <button
          className="btn btn-ghost"
          onClick={() => {
            clearToken();
            setAuthed(false);
          }}
        >
          Đăng xuất
        </button>
      </header>
      <nav className="tabs">
        <button onClick={() => setTab('sessions')} disabled={tab === 'sessions'}>
          Phiên + QR
        </button>
        <button onClick={() => setTab('students')} disabled={tab === 'students'}>
          Sinh viên
        </button>
      </nav>
      <main>{tab === 'sessions' ? <SessionsPanel /> : <StudentsPanel />}</main>
    </div>
  );
}

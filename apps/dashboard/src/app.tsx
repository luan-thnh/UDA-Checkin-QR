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
    <div style={{ maxWidth: 960, margin: '0 auto', padding: 16 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Dashboard điểm danh</h2>
        <button
          onClick={() => {
            clearToken();
            setAuthed(false);
          }}
        >
          Đăng xuất
        </button>
      </header>
      <nav style={{ display: 'flex', gap: 8, margin: '12px 0' }}>
        <button onClick={() => setTab('sessions')} disabled={tab === 'sessions'}>
          Phiên + QR
        </button>
        <button onClick={() => setTab('students')} disabled={tab === 'students'}>
          Sinh viên
        </button>
      </nav>
      {tab === 'sessions' ? <SessionsPanel /> : <StudentsPanel />}
    </div>
  );
}

import { useState } from 'react';
import { clearToken, getToken } from './services/api';
import { LoginForm } from './components/LoginForm';
import { StudentsPanel } from './components/StudentsPanel';
import { SessionsPanel } from './components/SessionsPanel';
import { ReportsPanel } from './components/ReportsPanel';
import { QrCode, Users, FileBarChart, LogOut, CheckCircle } from 'lucide-react';

type Tab = 'sessions' | 'students' | 'reports';

export function DashboardApp() {
  const [authed, setAuthed] = useState(() => Boolean(getToken()));
  const [tab, setTab] = useState<Tab>('sessions');

  if (!authed) return <LoginForm onDone={() => setAuthed(true)} />;

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-slate-800">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shadow-sm z-10">
        <div className="h-16 flex items-center px-6 border-b border-slate-100">
          <div className="w-8 h-8 rounded-lg bg-primary-light flex items-center justify-center text-primary mr-3">
            <CheckCircle size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 leading-tight">Điểm danh QR</h1>
            <p className="text-[11px] text-slate-500 font-medium">Dashboard Quản Lý</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          <button
            onClick={() => setTab('sessions')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              tab === 'sessions'
                ? 'bg-primary-light text-primary-dark'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <QrCode size={18} />
            Quản lý Phiên
          </button>
          <button
            onClick={() => setTab('students')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              tab === 'students'
                ? 'bg-primary-light text-primary-dark'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Users size={18} />
            Sinh viên
          </button>
          <button
            onClick={() => setTab('reports')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              tab === 'reports'
                ? 'bg-primary-light text-primary-dark'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <FileBarChart size={18} />
            Báo cáo lịch sử
          </button>
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button
            onClick={() => {
              clearToken();
              setAuthed(false);
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-danger transition-colors focus:outline-none focus:ring-2 focus:ring-slate-200"
          >
            <LogOut size={16} />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-6xl mx-auto">
          {tab === 'sessions' && <SessionsPanel />}
          {tab === 'students' && <StudentsPanel />}
          {tab === 'reports' && <ReportsPanel />}
        </div>
      </main>
    </div>
  );
}

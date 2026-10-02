import { useState } from 'react';
import { Routes, Route, Navigate, NavLink } from 'react-router-dom';
import { clearToken, getToken } from './services/api';
import { LoginForm } from './components/LoginForm';
import { StudentsPanel } from './components/StudentsPanel';
import { SessionsPanel } from './components/SessionsPanel';
import { ReportsPanel } from './components/ReportsPanel';
import { QrCode, Users, FileBarChart, LogOut, CheckCircle } from 'lucide-react';

function DashboardLayout({ onLogout }: { onLogout: () => void }) {
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
          <NavLink
            to="/sessions"
            className={({ isActive }) => `w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive
                ? 'bg-primary-light text-primary-dark'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <QrCode size={18} />
            Quản lý Phiên
          </NavLink>
          <NavLink
            to="/students"
            className={({ isActive }) => `w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive
                ? 'bg-primary-light text-primary-dark'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Users size={18} />
            Sinh viên
          </NavLink>
          <NavLink
            to="/reports"
            className={({ isActive }) => `w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive
                ? 'bg-primary-light text-primary-dark'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <FileBarChart size={18} />
            Báo cáo lịch sử
          </NavLink>
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button
            onClick={onLogout}
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
          <Routes>
            <Route path="/sessions" element={<SessionsPanel />} />
            <Route path="/students" element={<StudentsPanel />} />
            <Route path="/reports" element={<ReportsPanel />} />
            <Route path="*" element={<Navigate to="/sessions" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PublicCheckin } from './components/PublicCheckin';
import { StudentHome } from './components/StudentHome';
import { Toaster } from 'sonner';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 60 * 1000,
    },
  },
});

export function DashboardApp() {
  const [authed, setAuthed] = useState(() => Boolean(getToken()));

  return (
    <QueryClientProvider client={queryClient}>
      <Toaster position="top-right" richColors />
      <Routes>
        <Route path="/c/:sessionId" element={<PublicCheckin />} />
        <Route path="/c" element={<StudentHome />} />
        <Route path="/qr" element={<StudentHome />} />
        <Route path="/*" element={
          !authed ? <LoginForm onDone={() => setAuthed(true)} /> :
          <DashboardLayout onLogout={() => {
            clearToken();
            setAuthed(false);
          }} />
        } />
      </Routes>
    </QueryClientProvider>
  );
}

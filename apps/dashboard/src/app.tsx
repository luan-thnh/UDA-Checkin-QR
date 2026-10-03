import { useState } from 'react';
import { Routes, Route, Navigate, NavLink, useLocation } from 'react-router-dom';
import { clearToken, getToken } from './services/api';
import { LoginForm } from './components/LoginForm';
import { OverviewPanel } from './components/OverviewPanel';
import { StudentsPanel } from './components/StudentsPanel';
import { SessionsPanel } from './components/SessionsPanel';
import { ReportsPanel } from './components/ReportsPanel';
import { QrCode, Users, FileBarChart, LogOut, CheckCircle, LayoutDashboard, Menu, X, Settings } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/overview', icon: LayoutDashboard, label: 'Tổng quan', section: 'CHÍNH' },
  { to: '/sessions', icon: QrCode, label: 'Quản lý Phiên', section: 'CHÍNH' },
  { to: '/students', icon: Users, label: 'Sinh viên', section: 'DỮ LIỆU' },
  { to: '/reports', icon: FileBarChart, label: 'Báo cáo lịch sử', section: 'DỮ LIỆU' },
] as const;

function DashboardLayout({ onLogout }: { onLogout: () => void }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  // Get current page title for header
  const currentNav = NAV_ITEMS.find(item => location.pathname.startsWith(item.to));
  const pageTitle = currentNav?.label ?? 'Dashboard';

  // Group nav items by section
  const sections = NAV_ITEMS.reduce<Record<string, typeof NAV_ITEMS[number][]>>((acc, item) => {
    if (!acc[item.section]) acc[item.section] = [];
    acc[item.section].push(item);
    return acc;
  }, {});

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-30
        ${sidebarOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full lg:w-20 lg:translate-x-0'}
        bg-white border-r border-slate-200/80 flex flex-col
        shadow-[0_0_15px_-3px_rgba(0,0,0,0.05)]
        transition-all duration-300 overflow-hidden
      `}>
        {/* Brand */}
        <div className="h-16 flex items-center px-5 border-b border-slate-100/80 flex-shrink-0">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white mr-3 shadow-sm shadow-primary/20 flex-shrink-0">
            <CheckCircle size={20} strokeWidth={2.5} />
          </div>
          {sidebarOpen && (
            <div className="animate-fade-in">
              <h1 className="text-base font-bold text-slate-900 leading-tight tracking-tight">Điểm danh QR</h1>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest">UDA Dashboard</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
          {Object.entries(sections).map(([sectionName, items]) => (
            <div key={sectionName}>
              {sidebarOpen && (
                <p className="px-3 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">
                  {sectionName}
                </p>
              )}
              <div className="space-y-0.5">
                {items.map(({ to, icon: Icon, label }) => (
                  <NavLink
                    key={to}
                    to={to}
                    title={!sidebarOpen ? label : undefined}
                    className={({ isActive }) =>
                      `sidebar-link group ${isActive ? 'sidebar-link-active' : 'sidebar-link-inactive'}`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-r-full" />
                        )}
                        <Icon size={18} className={`flex-shrink-0 ${isActive ? 'text-primary' : 'text-slate-400 group-hover:text-slate-600'} transition-colors`} />
                        {sidebarOpen && <span>{label}</span>}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* User + Logout */}
        <div className="p-3 border-t border-slate-100/80 flex-shrink-0">
          {sidebarOpen ? (
            <div className="space-y-2">
              <div className="flex items-center gap-3 px-3 py-2 bg-slate-50 rounded-xl">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm">
                  A
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-800 truncate">Admin</p>
                  <p className="text-[11px] text-slate-400 truncate">Quản trị viên</p>
                </div>
                <button title="Cài đặt" className="p-1 text-slate-400 hover:text-slate-600 transition-colors">
                  <Settings size={14} />
                </button>
              </div>
              <button
                onClick={onLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-slate-500 bg-white border border-slate-200 rounded-xl hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all focus:outline-none focus:ring-2 focus:ring-slate-200"
              >
                <LogOut size={14} />
                Đăng xuất
              </button>
            </div>
          ) : (
            <button
              onClick={onLogout}
              title="Đăng xuất"
              className="w-full flex items-center justify-center p-2 text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
            >
              <LogOut size={18} />
            </button>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/60 flex items-center justify-between px-6 flex-shrink-0 z-10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              title={sidebarOpen ? 'Thu gọn menu' : 'Mở rộng menu'}
            >
              {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
            <div>
              <h2 className="text-lg font-bold text-slate-800 tracking-tight">{pageTitle}</h2>
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm text-slate-500">
            <span className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-xs font-semibold border border-emerald-100">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              Online
            </span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="max-w-7xl mx-auto animate-fade-in-up">
            <Routes>
              <Route path="/overview" element={<OverviewPanel />} />
              <Route path="/sessions" element={<SessionsPanel />} />
              <Route path="/students" element={<StudentsPanel />} />
              <Route path="/reports" element={<ReportsPanel />} />
              <Route path="*" element={<Navigate to="/overview" replace />} />
            </Routes>
          </div>
        </main>
      </div>
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

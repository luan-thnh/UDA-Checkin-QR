import { useQuery } from '@tanstack/react-query';
import { fetchSessions, fetchStudents, fetchAllAttendances } from '../services/api';
import type { CheckinSession } from '@checkin/shared';
import { Users, QrCode, CheckCircle, Activity, TrendingUp, Clock, CalendarDays, AlertTriangle } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const PIE_COLORS = ['#099153', '#0ea5e9', '#f46b23', '#8b5cf6', '#ec4899'];

export function OverviewPanel() {
  const { data: sessions = [], isLoading: isLoadingSessions } = useQuery({
    queryKey: ['sessions'],
    queryFn: fetchSessions,
  });

  const { data: students = [], isLoading: isLoadingStudents } = useQuery({
    queryKey: ['students', ''],
    queryFn: () => fetchStudents(''),
  });

  const { data: attendances = [], isLoading: isLoadingAttendances } = useQuery({
    queryKey: ['all-attendances'],
    queryFn: fetchAllAttendances,
  });

  const isLoading = isLoadingSessions || isLoadingStudents || isLoadingAttendances;

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-80 text-slate-400 gap-3">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-primary rounded-full animate-spin" />
        <span className="text-sm font-medium">Đang tải dữ liệu tổng quan...</span>
      </div>
    );
  }

  // Calculate stats
  const now = new Date();
  const activeSessions = sessions.filter(s => s.status === 'active' && new Date(s.endsAt) > now).length;
  const closedSessions = sessions.length - activeSessions;
  const totalStudents = students.length;
  const totalCheckins = attendances.length;

  // Attendance by day (last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const attendanceByDay = last7Days.map(date => {
    const count = attendances.filter(a => {
      const timeStr = String(a['Thời gian'] || a['checkedAt'] || '');
      if (!timeStr) return false;
      try {
        const parts = timeStr.split(/[\/\s:]/);
        if (parts.length >= 3) {
          const attDate = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
          return attDate.toDateString() === date.toDateString();
        }
      } catch {
        // Fallback: try ISO parse
        const parsed = new Date(timeStr);
        if (!isNaN(parsed.getTime())) {
          return parsed.toDateString() === date.toDateString();
        }
      }
      return false;
    }).length;

    return {
      name: date.toLocaleDateString('vi-VN', { weekday: 'short', day: 'numeric' }),
      'Lượt điểm danh': count,
    };
  });

  // Classes distribution for pie chart
  const classesMap = new Map<string, number>();
  students.forEach(s => {
    const c = s.className || 'Khác';
    classesMap.set(c, (classesMap.get(c) || 0) + 1);
  });
  const classesData = Array.from(classesMap.entries())
    .map(([name, count]) => ({ name, value: count }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  // Recent sessions (last 5)
  const recentSessions = [...sessions]
    .sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 stagger-children">
        <MetricCard
          label="Phiên đang mở"
          value={activeSessions}
          icon={QrCode}
          iconBgClass="from-blue-50 to-blue-100"
          iconColorClass="text-blue-600"
          footer={<><Clock size={13} className="mr-1 text-blue-400" /> Đang diễn ra</>}
        />
        <MetricCard
          label="Tổng Sinh viên"
          value={totalStudents}
          icon={Users}
          iconBgClass="from-emerald-50 to-emerald-100"
          iconColorClass="text-emerald-600"
          footer={<><TrendingUp size={13} className="mr-1 text-emerald-400" /> Đã đồng bộ</>}
        />
        <MetricCard
          label="Lượt điểm danh"
          value={totalCheckins}
          icon={CheckCircle}
          iconBgClass="from-purple-50 to-purple-100"
          iconColorClass="text-purple-600"
          footer={<><Activity size={13} className="mr-1 text-purple-400" /> Tích lũy toàn hệ thống</>}
        />
        <MetricCard
          label="Tổng Phiên tạo"
          value={sessions.length}
          icon={CalendarDays}
          iconBgClass="from-amber-50 to-amber-100"
          iconColorClass="text-amber-600"
          footer={<><CheckCircle size={13} className="mr-1 text-amber-400" /> {closedSessions} đã đóng</>}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Area Chart - spans 2 cols */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp size={18} className="text-primary" />
              Lượt điểm danh 7 ngày qua
            </h3>
            <span className="text-xs font-medium text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
              Cập nhật gần đây
            </span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={attendanceByDay} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradCheckin" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#099153" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#099153" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} dy={8} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
                <CartesianGrid vertical={false} stroke="#f1f5f9" strokeDasharray="4 4" />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)', fontSize: '13px' }}
                  labelStyle={{ fontWeight: 700, color: '#1e293b', marginBottom: '2px' }}
                />
                <Area
                  type="monotone"
                  dataKey="Lượt điểm danh"
                  stroke="#099153"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#gradCheckin)"
                  activeDot={{ r: 6, strokeWidth: 0, fill: '#06703f' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="card p-6">
          <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Users size={18} className="text-emerald-500" />
            Phân bố theo Lớp
          </h3>
          {classesData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-60 text-slate-400">
              <AlertTriangle size={32} className="mb-2 text-slate-300" />
              <span className="text-sm">Chưa có dữ liệu</span>
            </div>
          ) : (
            <>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={classesData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {classesData.map((_, idx) => (
                        <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px -2px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                      formatter={(value: unknown) => [`${value} SV`, 'Số lượng']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 mt-2">
                {classesData.map((item, idx) => (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                      <span className="text-slate-600 truncate max-w-[140px]">{item.name}</span>
                    </div>
                    <span className="font-bold text-slate-800">{item.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Recent Sessions */}
      <div className="card">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <CalendarDays size={18} className="text-amber-500" />
            Phiên điểm danh gần đây
          </h3>
          <span className="text-xs text-slate-400 font-medium">{recentSessions.length} phiên mới nhất</span>
        </div>
        {recentSessions.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">Chưa có phiên điểm danh nào.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentSessions.map(session => (
              <RecentSessionRow key={session.id} session={session} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Sub-components ─────────────────────────────────────────────── */

interface MetricCardProps {
  label: string;
  value: number;
  icon: React.ComponentType<Record<string, unknown>>;
  iconBgClass: string;
  iconColorClass: string;
  footer: React.ReactNode;
}

function MetricCard({ label, value, icon: Icon, iconBgClass, iconColorClass, footer }: MetricCardProps) {
  return (
    <div className="stat-card">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</p>
          <h3 className="text-3xl font-extrabold text-slate-800 mt-2 tabular-nums">{value}</h3>
        </div>
        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${iconBgClass} flex items-center justify-center ${iconColorClass}`}>
          <Icon size={22} />
        </div>
      </div>
      <div className="mt-4 text-xs text-slate-400 font-medium flex items-center">
        {footer}
      </div>
    </div>
  );
}

function RecentSessionRow({ session }: { session: CheckinSession }) {
  const isExpired = session.endsAt && new Date(session.endsAt) < new Date();
  const isActive = session.status === 'active' && !isExpired;

  return (
    <div className="px-6 py-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors">
      <div className="flex items-center gap-4">
        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${isActive ? 'bg-emerald-500' : 'bg-slate-300'}`} />
        <div>
          <p className="font-semibold text-slate-800 text-sm">{session.title}</p>
          <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-400">
            {session.className && <span>Lớp: {session.className}</span>}
            {session.subject && <span>• {session.subject}</span>}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
          isActive
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            : 'bg-slate-100 text-slate-500 border border-slate-200'
        }`}>
          {isActive ? 'Đang mở' : 'Đã đóng'}
        </span>
        <span className="text-xs text-slate-400 tabular-nums hidden sm:inline">
          {session.startsAt && !isNaN(new Date(session.startsAt).getTime())
            ? new Date(session.startsAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
            : '—'
          }
        </span>
      </div>
    </div>
  );
}

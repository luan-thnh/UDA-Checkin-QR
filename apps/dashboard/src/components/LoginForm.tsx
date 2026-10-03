import { useState } from 'react';
import { validateLoginForm, type FieldErrors } from '@checkin/shared';
import { login, setToken } from '../services/api';
import { CheckCircle, Eye, EyeOff, Loader2 } from 'lucide-react';

export function LoginForm({ onDone }: { onDone: () => void }) {
  const [email, setEmail] = useState('admin@truong.edu.vn');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const fieldErrors = validateLoginForm(email, password);
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) return;
    setLoading(true);
    setServerError('');
    try {
      const data = await login(email.trim(), password);
      setToken(data.token);
      onDone();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Đăng nhập thất bại.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 p-4">
      {/* Decorative background circles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md animate-fade-in-up">
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-900/5 border border-slate-200/60 overflow-hidden">
          {/* Top accent bar */}
          <div className="h-1.5 bg-gradient-to-r from-primary via-primary-dark to-primary" />

          <div className="p-8 sm:p-10">
            {/* Brand */}
            <div className="flex flex-col items-center justify-center mb-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary-dark rounded-2xl flex items-center justify-center text-white mb-5 shadow-lg shadow-primary/25 rotate-3 hover:rotate-0 transition-transform duration-300">
                <CheckCircle size={34} strokeWidth={2.5} />
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Điểm danh QR</h1>
              <p className="text-slate-400 mt-1.5 text-sm font-medium">Đăng nhập vào trang quản trị</p>
            </div>
            
            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Email quản trị</label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@truong.edu.vn"
                  autoComplete="username"
                  className={`input h-11 rounded-xl ${errors.email ? 'border-red-400 focus:ring-red-400' : 'border-slate-200 focus:ring-primary'}`}
                />
                {errors.email && <span className="text-xs text-red-500 mt-1.5 block font-medium">{errors.email}</span>}
              </div>
              
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Mật khẩu</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className={`input h-11 rounded-xl pr-11 ${errors.password ? 'border-red-400 focus:ring-red-400' : 'border-slate-200 focus:ring-primary'}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && <span className="text-xs text-red-500 mt-1.5 block font-medium">{errors.password}</span>}
              </div>
              
              {serverError && (
                <div className="p-3.5 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 font-medium flex items-start gap-2">
                  <span className="flex-shrink-0 mt-0.5">⚠️</span>
                  {serverError}
                </div>
              )}
              
              <button 
                type="submit" 
                className="w-full h-12 bg-gradient-to-r from-primary to-primary-dark text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-primary/25 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base mt-2" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Đang đăng nhập…
                  </>
                ) : (
                  'Đăng nhập'
                )}
              </button>
            </form>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          UDA Check-in QR System &middot; Đại học Đông Á
        </p>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { validateLoginForm, type FieldErrors } from '@checkin/shared';
import { login, setToken } from '../services/api';
import { Check } from 'lucide-react';

export function LoginForm({ onDone }: { onDone: () => void }) {
  const [email, setEmail] = useState('admin@truong.edu.vn');
  const [password, setPassword] = useState('admin123');
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
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="card w-full max-w-md p-8 shadow-xl border-0 ring-1 ring-slate-900/5">
        <div className="flex flex-col items-center justify-center mb-8 text-center">
          <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg shadow-primary/30">
            <Check size={32} strokeWidth={3} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Điểm danh QR</h1>
          <p className="text-slate-500 mt-1">Đăng nhập quản trị viên</p>
        </div>
        
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <div>
            <label className="label">Email admin</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@truong.edu.vn"
              autoComplete="username"
              className={`input ${errors.email ? 'border-danger focus:ring-danger' : ''}`}
            />
            {errors.email && <span className="text-xs text-danger mt-1 block">{errors.email}</span>}
          </div>
          
          <div>
            <label className="label">Mật khẩu</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              className={`input ${errors.password ? 'border-danger focus:ring-danger' : ''}`}
            />
            {errors.password && <span className="text-xs text-danger mt-1 block">{errors.password}</span>}
          </div>
          
          {serverError && (
            <div className="p-3 bg-danger/10 text-danger text-sm rounded-lg border border-danger/20 font-medium">
              {serverError}
            </div>
          )}
          
          <button type="submit" className="btn btn-primary w-full h-11 text-base mt-2" disabled={loading}>
            {loading ? 'Đang đăng nhập…' : 'Đăng nhập'}
          </button>
        </form>
      </div>
    </div>
  );
}

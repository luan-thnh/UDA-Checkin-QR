import { useState } from 'react';
import { validateLoginForm, type FieldErrors } from '@checkin/shared';
import { login, setToken } from '../services/api';

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
    <div className="login-wrap">
      <div className="card login-card">
        <div className="brand">
          <span className="brand-mark">✓</span>
          <div>
            <h1>Điểm danh QR</h1>
            <p>Đăng nhập quản trị viên</p>
          </div>
        </div>
        <form onSubmit={handleSubmit} noValidate>
          <label className="field">
            Email admin
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@truong.edu.vn"
              autoComplete="username"
              className={errors.email ? 'invalid' : ''}
            />
            <span className="field-error">{errors.email ?? ''}</span>
          </label>
          <label className="field">
            Mật khẩu
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              className={errors.password ? 'invalid' : ''}
            />
            <span className="field-error">{errors.password ?? ''}</span>
          </label>
          {serverError ? <p className="notice error">{serverError}</p> : null}
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Đang đăng nhập…' : 'Đăng nhập'}
          </button>
        </form>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { login, setToken } from '../services/api';

export function LoginForm({ onDone }: { onDone: () => void }) {
  const [email, setEmail] = useState('admin@truong.edu.vn');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await login(email, password);
      setToken(data.token);
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng nhập thất bại.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 360, margin: '80px auto', display: 'grid', gap: 12 }}>
      <h2>Dashboard điểm danh</h2>
      <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email admin" />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Mật khẩu"
      />
      {error ? <p style={{ color: 'red' }}>{error}</p> : null}
      <button type="submit" disabled={loading}>
        {loading ? 'Đang đăng nhập…' : 'Đăng nhập'}
      </button>
    </form>
  );
}

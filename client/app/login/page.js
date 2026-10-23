'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, setAuth } from '../../lib/api';

const DEMOS = [
  { email: 'customer@zuryo.demo', label: 'Customer' },
  { email: 'trainer@zuryo.demo', label: 'Trainer' },
  { email: 'admin@zuryo.demo', label: 'Admin' },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('customer@zuryo.demo');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function login(e) {
    e?.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await api('/auth/login', {
        method: 'POST',
        body: { email, password },
      });
      setAuth(data.token, data.user);
      if (data.user.role === 'customer') router.push('/customer');
      else if (data.user.role === 'trainer') router.push('/trainer');
      else router.push('/admin');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="hero-login">
      <div className="card login-panel">
        <h1>
          ZUR<span style={{ color: 'var(--accent)' }}>YO</span>
        </h1>
        <p className="muted">On-demand fitness booking MVP — demo auth</p>
        <form onSubmit={login}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
          />
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
          {error && <p className="error">{error}</p>}
          <button type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <div className="stack" style={{ marginTop: '1rem' }}>
          <p className="muted">Quick demo users (password: password123)</p>
          <div className="row">
            {DEMOS.map((d) => (
              <button
                key={d.email}
                type="button"
                className="secondary"
                onClick={() => {
                  setEmail(d.email);
                  setPassword('password123');
                }}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

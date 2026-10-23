'use client';

import { useState } from 'react';
import AppShell from '../../../components/AppShell';
import { api } from '../../../lib/api';

export default function RecommendPage() {
  const [plan, setPlan] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    setError('');
    try {
      const data = await api('/fitness/recommend', { method: 'POST', body: {} });
      setPlan(data.recommendation);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <h1>Personalized workout</h1>
      <p className="muted">
        Rules-based AI feature using your fitness profile and recent session history (server-side).
      </p>
      {error && <p className="error">{error}</p>}
      <button type="button" onClick={generate} disabled={loading}>
        {loading ? 'Generating…' : 'Generate recommendation'}
      </button>

      {plan && (
        <div className="card" style={{ marginTop: '1rem' }}>
          <h2>{plan.title}</h2>
          <p className="muted">Engine: {plan.engine}</p>
          {plan.blocks.map((b) => (
            <div key={b.name} style={{ marginBottom: '0.75rem' }}>
              <strong>
                {b.name} · {b.minutes} min
              </strong>
              <ul>
                {b.activities.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </div>
          ))}
          <p>
            <strong>Suggested next:</strong> {plan.suggestedNext}
          </p>
          <div className="muted">
            {plan.rationale.map((r) => (
              <div key={r}>• {r}</div>
            ))}
          </div>
        </div>
      )}
    </AppShell>
  );
}

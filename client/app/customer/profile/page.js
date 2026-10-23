'use client';

import { useEffect, useState } from 'react';
import AppShell from '../../../components/AppShell';
import { api } from '../../../lib/api';

export default function ProfilePage() {
  const [form, setForm] = useState({
    age: 28,
    weight: 62,
    goals: 'weight_loss',
    level: 'beginner',
    preferences: 'home workout, low impact',
  });
  const [history, setHistory] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const [p, h] = await Promise.all([api('/fitness/profile'), api('/fitness/history')]);
        if (p.profile) {
          setForm({
            age: p.profile.age,
            weight: p.profile.weight,
            goals: (p.profile.goals || []).join(', '),
            level: p.profile.level,
            preferences: (p.profile.preferences || []).join(', '),
          });
        }
        setHistory(h.sessions || []);
      } catch (err) {
        setError(err.message);
      }
    }
    load();
  }, []);

  async function save(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      await api('/fitness/profile', {
        method: 'PUT',
        body: {
          age: Number(form.age),
          weight: Number(form.weight),
          level: form.level,
          goals: form.goals.split(',').map((s) => s.trim()).filter(Boolean),
          preferences: form.preferences.split(',').map((s) => s.trim()).filter(Boolean),
        },
      });
      setMessage('Profile saved');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <AppShell>
      <h1>Fitness profile</h1>
      {error && <p className="error">{error}</p>}
      {message && <p className="success">{message}</p>}
      <div className="grid grid-2">
        <form className="card" onSubmit={save}>
          <label>Age</label>
          <input
            type="number"
            value={form.age}
            onChange={(e) => setForm({ ...form, age: e.target.value })}
          />
          <label>Weight (kg)</label>
          <input
            type="number"
            value={form.weight}
            onChange={(e) => setForm({ ...form, weight: e.target.value })}
          />
          <label>Level</label>
          <select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
          <label>Goals (comma-separated)</label>
          <input
            value={form.goals}
            onChange={(e) => setForm({ ...form, goals: e.target.value })}
            placeholder="weight_loss, endurance"
          />
          <label>Preferences</label>
          <input
            value={form.preferences}
            onChange={(e) => setForm({ ...form, preferences: e.target.value })}
          />
          <button type="submit">Save assessment</button>
        </form>

        <div className="card">
          <h2>Session history</h2>
          {history.length === 0 && <p className="muted">No completed session records yet</p>}
          <ul className="stack">
            {history.map((s) => (
              <li key={s._id}>
                <strong>{s.status}</strong> · {s.exercises?.join(', ') || 'No exercises logged'}
                <div className="muted">{s.trainerNotes || s.customerFeedback || ''}</div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </AppShell>
  );
}

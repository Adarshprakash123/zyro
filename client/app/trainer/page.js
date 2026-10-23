'use client';

import { useEffect, useState } from 'react';
import AppShell from '../../components/AppShell';
import { api } from '../../lib/api';

function formatMs(remainingMinutes) {
  const totalSec = Math.max(0, Math.floor(remainingMinutes * 60));
  const m = String(Math.floor(totalSec / 60)).padStart(2, '0');
  const s = String(totalSec % 60).padStart(2, '0');
  return `${m}:${s}`;
}

export default function TrainerHome() {
  const [bookings, setBookings] = useState([]);
  const [active, setActive] = useState(null);
  const [notes, setNotes] = useState('');
  const [exercises, setExercises] = useState('Squats, Push-ups, Plank');
  const [error, setError] = useState('');
  const [notifications, setNotifications] = useState([]);

  async function load() {
    try {
      const [b, n] = await Promise.all([api('/bookings'), api('/notifications')]);
      setBookings(b.bookings || []);
      setNotifications(n.notifications || []);
      if (active?.session?._id) {
        const status = await api(`/sessions/${active.session._id}/status`);
        setActive(status);
      }
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 3000);
    return () => clearInterval(t);
  }, [active?.session?._id]);

  async function start(bookingId) {
    setError('');
    try {
      const result = await startSession(bookingId);
      setActive(result);
    } catch (err) {
      setError(err.message);
    }
  }

  async function startSession(bookingId) {
    return api(`/sessions/${bookingId}/start`, { method: 'POST' });
  }

  async function saveNotes() {
    if (!active?.session?._id) return;
    try {
      await api(`/sessions/${active.session._id}`, {
        method: 'PATCH',
        body: {
          trainerNotes: notes,
          exercises: exercises.split(',').map((s) => s.trim()).filter(Boolean),
          suggestedNext: 'Progressive overload on main lifts next session',
        },
      });
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <AppShell>
      <h1>Trainer sessions</h1>
      {error && <p className="error">{error}</p>}

      {active?.session && (
        <div className="card">
          <h2>Live session timer (server-authoritative)</h2>
          <div className="timer">{formatMs(active.remainingMinutes)}</div>
          <p>
            Status: <span className={`badge ${active.status === 'warning' ? 'warn' : 'ok'}`}>{active.status}</span>
          </p>
          <p className="muted">
            Started at {active.session.startedAt ? new Date(active.session.startedAt).toLocaleString() : '—'}
          </p>
          <label>Exercises (comma-separated)</label>
          <input value={exercises} onChange={(e) => setExercises(e.target.value)} />
          <label>Trainer notes</label>
          <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
          <button type="button" onClick={saveNotes}>
            Save session notes
          </button>
        </div>
      )}

      <div className="grid grid-2">
        <div className="card">
          <h2>Assigned bookings</h2>
          <table className="table">
            <thead>
              <tr>
                <th>When</th>
                <th>Customer</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b._id}>
                  <td>{new Date(b.startAt).toLocaleString()}</td>
                  <td>{b.customerId?.name || '—'}</td>
                  <td>
                    <span className="badge">{b.status}</span>
                  </td>
                  <td>
                    {['assigned', 'confirmed'].includes(b.status) && (
                      <button type="button" onClick={() => start(b._id)}>
                        Start
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h2>Notifications</h2>
          {notifications.slice(0, 8).map((n) => (
            <div key={n._id} className="muted" style={{ marginBottom: '0.5rem' }}>
              <span className="badge">{n.type}</span> {n.message}
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

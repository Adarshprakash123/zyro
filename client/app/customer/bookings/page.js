'use client';

import { useEffect, useState } from 'react';
import AppShell from '../../../components/AppShell';
import { api } from '../../../lib/api';

export default function CustomerBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [sessionMap, setSessionMap] = useState({});
  const [error, setError] = useState('');

  async function load() {
    try {
      const data = await api('/bookings');
      setBookings(data.bookings || []);
      const map = {};
      await Promise.all(
        (data.bookings || [])
          .filter((b) => ['assigned', 'in_progress', 'completed'].includes(b.status))
          .map(async (b) => {
            try {
              const s = await api(`/sessions/by-booking/${b._id}`);
              map[b._id] = s;
            } catch {
              /* no session yet */
            }
          })
      );
      setSessionMap(map);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
  }, []);

  async function cancel(id) {
    try {
      await api(`/bookings/${id}/cancel`, { method: 'POST' });
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <AppShell>
      <h1>My bookings</h1>
      {error && <p className="error">{error}</p>}
      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>When</th>
              <th>Mode</th>
              <th>Trainer</th>
              <th>Status</th>
              <th>Price</th>
              <th>Session</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => {
              const s = sessionMap[b._id];
              return (
                <tr key={b._id}>
                  <td>{new Date(b.startAt).toLocaleString()}</td>
                  <td>{b.mode}</td>
                  <td>{b.trainerId?.name || '—'}</td>
                  <td>
                    <span className="badge">{b.status}</span>
                  </td>
                  <td>₹{b.priceBreakdown?.total}</td>
                  <td>
                    {s ? (
                      <span className={`badge ${s.status === 'warning' ? 'warn' : 'ok'}`}>
                        {s.status} · {Math.floor(s.remainingMinutes || 0)}m left
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td>
                    {!['cancelled', 'completed'].includes(b.status) && (
                      <button type="button" className="danger" onClick={() => cancel(b._id)}>
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {bookings.length === 0 && <p className="muted">No bookings yet</p>}
      </div>
    </AppShell>
  );
}

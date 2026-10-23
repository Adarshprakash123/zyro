'use client';

import { useEffect, useState } from 'react';
import AppShell from '../../components/AppShell';
import { api } from '../../lib/api';

export default function AdminPage() {
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = () =>
      api('/admin/bookings')
        .then((d) => setBookings(d.bookings || []))
        .catch((err) => setError(err.message));
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <AppShell>
      <h1>Operations — bookings</h1>
      <p className="muted">Assignment decisions, pricing snapshot, and session status.</p>
      {error && <p className="error">{error}</p>}
      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>When</th>
              <th>Customer</th>
              <th>Trainer</th>
              <th>Zone</th>
              <th>Status</th>
              <th>Total</th>
              <th>Peak</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={b._id}>
                <td>{new Date(b.startAt).toLocaleString()}</td>
                <td>{b.customerId?.name}</td>
                <td>{b.trainerId?.name || '—'}</td>
                <td>{b.societyZone}</td>
                <td>
                  <span className="badge">{b.status}</span>
                </td>
                <td>₹{b.priceBreakdown?.total}</td>
                <td>{b.priceBreakdown?.isPeak ? 'Yes' : 'No'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}

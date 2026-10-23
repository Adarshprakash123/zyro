'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AppShell from '../../components/AppShell';
import { api } from '../../lib/api';

export default function CustomerHome() {
  const [pkg, setPkg] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState('');

  async function load() {
    try {
      const [p, n] = await Promise.all([api('/packages/me'), api('/notifications')]);
      setPkg(p.package);
      setNotifications(n.notifications || []);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <AppShell>
      <h1>Customer home</h1>
      <p className="muted">Book a 60-minute session with a community trainer.</p>
      {error && <p className="error">{error}</p>}

      <div className="grid grid-2">
        <div className="card">
          <h2>Package</h2>
          {pkg ? (
            <ul>
              <li>Purchased: {pkg.sessionsPurchased}</li>
              <li>Used: {pkg.sessionsUsed}</li>
              <li>Remaining: {pkg.sessionsRemaining}</li>
              <li>
                Status: <span className="badge ok">{pkg.status}</span>
              </li>
            </ul>
          ) : (
            <p className="muted">No package found</p>
          )}
          <div className="row">
            <Link className="btn" href="/customer/book">
              Book session
            </Link>
            <Link className="btn secondary" href="/customer/bookings">
              My bookings
            </Link>
          </div>
        </div>

        <div className="card">
          <h2>Notifications</h2>
          {notifications.length === 0 && <p className="muted">None yet</p>}
          <ul className="stack">
            {notifications.slice(0, 6).map((n) => (
              <li key={n._id} className="muted">
                <span className="badge">{n.type}</span> {n.message}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </AppShell>
  );
}

'use client';

import { useEffect, useState } from 'react';
import AppShell from '../../../components/AppShell';
import { api } from '../../../lib/api';

export default function AvailabilityPage() {
  const [profile, setProfile] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api('/trainers/availability')
      .then((d) => setProfile(d.profile))
      .catch((err) => setError(err.message));
  }, []);

  async function toggleActive() {
    if (!profile) return;
    try {
      const data = await api('/trainers/availability', {
        method: 'PUT',
        body: {
          availabilitySlots: profile.availabilitySlots,
          zones: profile.zones,
          isActive: !profile.isActive,
        },
      });
      setProfile(data.profile);
      setMessage(`Active: ${data.profile.isActive}`);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <AppShell>
      <h1>Availability</h1>
      {error && <p className="error">{error}</p>}
      {message && <p className="success">{message}</p>}
      <div className="card">
        {!profile && <p className="muted">Loading…</p>}
        {profile && (
          <>
            <p>
              Zones: {(profile.zones || []).join(', ')} ·{' '}
              <span className={`badge ${profile.isActive ? 'ok' : ''}`}>
                {profile.isActive ? 'active' : 'inactive'}
              </span>
            </p>
            <button type="button" onClick={toggleActive}>
              Toggle active
            </button>
            <h3>Slots</h3>
            <ul>
              {(profile.availabilitySlots || []).slice(0, 14).map((s, i) => (
                <li key={i} className="muted">
                  Day {s.dayOfWeek}: {s.start}–{s.end}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </AppShell>
  );
}

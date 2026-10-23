'use client';

import { useEffect, useState } from 'react';
import AppShell from '../../../components/AppShell';
import { api } from '../../../lib/api';

export default function PricingAdminPage() {
  const [form, setForm] = useState({
    normalPrice: 399,
    peakPrice: 499,
    societyCommissionRate: 0.1,
    peakHours: '17,18,19,20',
    peakDays: '0,6',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api('/admin/pricing')
      .then((d) => {
        const c = d.config;
        setForm({
          normalPrice: c.normalPrice,
          peakPrice: c.peakPrice,
          societyCommissionRate: c.societyCommissionRate,
          peakHours: (c.peakHours || []).join(','),
          peakDays: (c.peakDays || []).join(','),
        });
      })
      .catch((err) => setError(err.message));
  }, []);

  async function save(e) {
    e.preventDefault();
    setError('');
    try {
      await api('/admin/pricing', {
        method: 'PUT',
        body: {
          normalPrice: Number(form.normalPrice),
          peakPrice: Number(form.peakPrice),
          societyCommissionRate: Number(form.societyCommissionRate),
          peakHours: form.peakHours.split(',').map((x) => Number(x.trim())).filter((n) => !Number.isNaN(n)),
          peakDays: form.peakDays.split(',').map((x) => Number(x.trim())).filter((n) => !Number.isNaN(n)),
        },
      });
      setMessage('Pricing updated — applied to new bookings only');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <AppShell>
      <h1>Pricing config</h1>
      <p className="muted">
        Peak slots: configured hours and weekend days. Totals are always computed on the server.
      </p>
      {error && <p className="error">{error}</p>}
      {message && <p className="success">{message}</p>}
      <form className="card" onSubmit={save}>
        <label>Normal price (₹)</label>
        <input
          type="number"
          value={form.normalPrice}
          onChange={(e) => setForm({ ...form, normalPrice: e.target.value })}
        />
        <label>Peak price (₹)</label>
        <input
          type="number"
          value={form.peakPrice}
          onChange={(e) => setForm({ ...form, peakPrice: e.target.value })}
        />
        <label>Society commission rate</label>
        <input
          type="number"
          step="0.01"
          value={form.societyCommissionRate}
          onChange={(e) => setForm({ ...form, societyCommissionRate: e.target.value })}
        />
        <label>Peak hours (0–23, comma-separated)</label>
        <input value={form.peakHours} onChange={(e) => setForm({ ...form, peakHours: e.target.value })} />
        <label>Peak days (0=Sun … 6=Sat)</label>
        <input value={form.peakDays} onChange={(e) => setForm({ ...form, peakDays: e.target.value })} />
        <button type="submit">Save</button>
      </form>
    </AppShell>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '../../../components/AppShell';
import { api } from '../../../lib/api';

export default function BookPage() {
  const router = useRouter();
  const [mode, setMode] = useState('scheduled');
  const [slots, setSlots] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [preferredTrainerId, setPreferredTrainerId] = useState('');
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadMeta() {
      try {
        const [s, t] = await Promise.all([api('/bookings/slots'), api('/bookings/trainers')]);
        setSlots(s.slots || []);
        setTrainers(t.trainers || []);
      } catch (err) {
        setError(err.message);
      }
    }
    loadMeta();
  }, []);

  async function createBooking() {
    setLoading(true);
    setError('');
    try {
      const body = { mode };
      if (mode === 'scheduled') {
        if (!selectedSlot) throw new Error('Select a time slot');
        body.startAt = selectedSlot.startAt;
      }
      if (preferredTrainerId) body.preferredTrainerId = preferredTrainerId;
      const data = await api('/bookings', { method: 'POST', body });
      setBooking(data.booking);
    } catch (err) {
      setError(err.message);
      if (err.data?.booking) setBooking(err.data.booking);
    } finally {
      setLoading(false);
    }
  }

  async function pay() {
    if (!booking?._id) return;
    setLoading(true);
    setError('');
    try {
      await api(`/bookings/${booking._id}/pay`, {
        method: 'POST',
        idempotencyKey: `pay-${booking._id}-${Date.now()}`,
      });
      router.push('/customer/bookings');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const preview =
    mode === 'instant'
      ? null
      : selectedSlot?.priceBreakdown || null;

  return (
    <AppShell>
      <h1>Book a session</h1>
      <p className="muted">Instant (within ~15–60 min) or scheduled. Price is recalculated on the server.</p>
      {error && <p className="error">{error}</p>}

      <div className="card">
        <label>Booking mode</label>
        <div className="row" style={{ marginBottom: '1rem' }}>
          <button
            type="button"
            className={mode === 'instant' ? '' : 'secondary'}
            onClick={() => setMode('instant')}
          >
            Instant
          </button>
          <button
            type="button"
            className={mode === 'scheduled' ? '' : 'secondary'}
            onClick={() => setMode('scheduled')}
          >
            Scheduled
          </button>
        </div>

        <label htmlFor="preferred">Preferred trainer (optional)</label>
        <select
          id="preferred"
          value={preferredTrainerId}
          onChange={(e) => setPreferredTrainerId(e.target.value)}
        >
          <option value="">Auto-assign best available</option>
          {trainers.map((t) => (
            <option key={t._id} value={t._id}>
              {t.name}
            </option>
          ))}
        </select>

        {mode === 'scheduled' && (
          <>
            <h3>Available slots</h3>
            {slots.length === 0 && <p className="muted">No slots in the next few days</p>}
            <div style={{ maxHeight: 280, overflow: 'auto' }}>
              {slots.map((s) => (
                <button
                  key={s.startAt}
                  type="button"
                  className={`slot ${selectedSlot?.startAt === s.startAt ? 'selected' : ''}`}
                  onClick={() => setSelectedSlot(s)}
                >
                  {new Date(s.startAt).toLocaleString()}{' '}
                  {s.priceBreakdown?.isPeak && <span className="badge peak">Peak</span>} · ₹
                  {s.priceBreakdown?.total}
                </button>
              ))}
            </div>
          </>
        )}

        {preview && (
          <div className="price-box">
            <div>
              <span>Session ({preview.isPeak ? 'peak' : 'normal'})</span>
              <span>₹{preview.sessionPrice}</span>
            </div>
            <div>
              <span>Society commission ({preview.commissionRate * 100}%)</span>
              <span>₹{preview.commission}</span>
            </div>
            <div>
              <strong>Total payable</strong>
              <strong>₹{preview.total}</strong>
            </div>
          </div>
        )}

        {!booking && (
          <button type="button" onClick={createBooking} disabled={loading} style={{ marginTop: '1rem' }}>
            {loading ? 'Creating…' : 'Create booking'}
          </button>
        )}
      </div>

      {booking && (
        <div className="card">
          <h2>Booking draft</h2>
          <p>
            Status: <span className="badge">{booking.status}</span>
          </p>
          <p>Start: {new Date(booking.startAt).toLocaleString()}</p>
          {booking.priceBreakdown && (
            <div className="price-box">
              <div>
                <span>Session</span>
                <span>₹{booking.priceBreakdown.sessionPrice}</span>
              </div>
              <div>
                <span>Commission</span>
                <span>₹{booking.priceBreakdown.commission}</span>
              </div>
              <div>
                <strong>Total</strong>
                <strong>₹{booking.priceBreakdown.total}</strong>
              </div>
            </div>
          )}
          {booking.status !== 'no_trainer' && booking.paymentStatus !== 'paid' && (
            <button type="button" onClick={pay} disabled={loading} style={{ marginTop: '1rem' }}>
              Pay (sandbox)
            </button>
          )}
          {booking.status === 'no_trainer' && (
            <p className="error">No trainer available — try another slot.</p>
          )}
        </div>
      )}
    </AppShell>
  );
}

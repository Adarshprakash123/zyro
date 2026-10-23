function parseHm(hm) {
  const [h, m] = hm.split(':').map(Number);
  return h * 60 + m;
}

function dateMinutesLocal(date) {
  return date.getHours() * 60 + date.getMinutes();
}

function isWithinAvailability(date, slots) {
  const dow = date.getDay();
  const mins = dateMinutesLocal(date);
  return slots.some((s) => {
    if (s.dayOfWeek !== dow) return false;
    const start = parseHm(s.start);
    const end = parseHm(s.end);
    return mins >= start && mins + 60 <= end;
  });
}

function roundToNextSlot(date, slotMinutes = 30) {
  const d = new Date(date);
  const ms = slotMinutes * 60 * 1000;
  return new Date(Math.ceil(d.getTime() / ms) * ms);
}

module.exports = { parseHm, dateMinutesLocal, isWithinAvailability, roundToNextSlot };

// Dates are stored as local "YYYY-MM-DD" strings so they never shift by timezone.

export const toISO = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const fromISO = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const formatShort = (iso) =>
  iso
    ? fromISO(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
    : '';

export const formatLong = (iso) =>
  iso
    ? fromISO(iso).toLocaleDateString('en-GB', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      })
    : '';

export const formatRange = (range) => {
  if (!range?.start) return 'No dates yet';
  if (!range.end || range.end === range.start) return formatShort(range.start);
  return `${formatShort(range.start)} – ${formatShort(range.end)}`;
};
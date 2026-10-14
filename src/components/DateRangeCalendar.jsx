import { useMemo, useState } from 'react';
import { Box, IconButton, Typography } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { fromISO, toISO, formatRange } from '../utils/dates';

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

/**
 * value:        { start: 'YYYY-MM-DD' | null, end: 'YYYY-MM-DD' | null }
 * onChange:     called with a new { start, end }
 * markedDates:  array of 'YYYY-MM-DD' that have an itinerary (shown as a dot)
 * onDayClick:   optional, called with the clicked date
 */
export default function DateRangeCalendar({
  value,
  onChange,
  markedDates = [],
  onDayClick,
}) {
  const start = value?.start || null;
  const end = value?.end || null;

  const [cursor, setCursor] = useState(() => {
    const base = start ? fromISO(start) : new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });

  const marked = useMemo(() => new Set(markedDates), [markedDates]);

  const cells = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const offset = (first.getDay() + 6) % 7; // Monday first
    const daysInMonth = new Date(
      cursor.getFullYear(),
      cursor.getMonth() + 1,
      0
    ).getDate();
    const list = Array(offset).fill(null);
    for (let d = 1; d <= daysInMonth; d += 1) {
      list.push(toISO(new Date(cursor.getFullYear(), cursor.getMonth(), d)));
    }
    return list;
  }, [cursor]);

  const handleClick = (iso) => {
    onDayClick?.(iso);
    if (!onChange) return;

    if (!start || (start && end)) {
      onChange({ start: iso, end: null });
    } else if (iso < start) {
      onChange({ start: iso, end: null });
    } else {
      onChange({ start, end: iso });
    }
  };

  const monthLabel = cursor.toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
  });

  const shiftMonth = (n) =>
    setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + n, 1));

  return (
    <Box
      sx={{
        bgcolor: '#fff',
        borderRadius: '24px',
        p: 2,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <IconButton aria-label="Previous month" size="small" onClick={() => shiftMonth(-1)}>
          <ChevronLeftIcon />
        </IconButton>
        <Typography sx={{ fontWeight: 700, color: 'text.primary' }}>{monthLabel}</Typography>
        <IconButton aria-label="Next month" size="small" onClick={() => shiftMonth(1)}>
          <ChevronRightIcon />
        </IconButton>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          mt: 1,
          rowGap: 0.5,
          textAlign: 'center',
        }}
      >
        {WEEKDAYS.map((d) => (
          <Typography key={d} sx={{ fontSize: 13, fontWeight: 700, py: 0.5 }}>
            {d}
          </Typography>
        ))}

        {cells.map((iso, i) => {
          if (!iso) return <Box key={`blank-${i}`} />;

          const isStart = iso === start;
          const isEnd = iso === end;
          const inRange = start && end && iso > start && iso < end;
          const hasItinerary = marked.has(iso);
          const day = Number(iso.slice(8));
          const edge = isStart || isEnd;

          return (
            <Box
              key={iso}
              sx={{
                position: 'relative',
                bgcolor: inRange ? '#DCEEEE' : 'transparent',
                borderRadius: isStart && end ? '20px 0 0 20px' : isEnd ? '0 20px 20px 0' : 0,
              }}
            >
              <Box
                component="button"
                type="button"
                onClick={() => handleClick(iso)}
                aria-label={`${iso}${hasItinerary ? ', has itinerary' : ''}`}
                aria-pressed={edge}
                sx={{
                  width: 36,
                  height: 40,
                  border: 0,
                  borderRadius: '20px',
                  cursor: 'pointer',
                  font: 'inherit',
                  fontSize: 14,
                  fontWeight: edge ? 700 : 400,
                  bgcolor: edge ? 'primary.main' : 'transparent',
                  color: edge ? '#fff' : 'text.primary',
                  display: 'inline-flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '2px',
                  '&:hover': { bgcolor: edge ? 'primary.main' : '#EEF6F6' },
                }}
              >
                {day}
                <Box
                  sx={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    bgcolor: hasItinerary ? (edge ? '#F1C36B' : '#E0A030') : 'transparent',
                  }}
                />
              </Box>
            </Box>
          );
        })}
      </Box>

      <Box sx={{ mt: 1.5, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        <Typography sx={{ fontSize: 14, fontWeight: 500, color: 'primary.main' }}>
          {start || end ? formatRange({ start, end }) : 'Pick a start and end date'}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#E0A030' }} />
          <Typography sx={{ fontSize: 12 }}>Day with an itinerary</Typography>
        </Box>
      </Box>
    </Box>
  );
}
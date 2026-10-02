import { useEffect, useState } from "react";
import { Box, Typography, Skeleton, Link } from '@mui/material';
import { getDestinationOverview } from '../services/wikivoyage';

export default function OverviewCard({ name }) {
  const [status, setStatus] = useState('loading'); // loading | success | empty | error
  const [overview, setOverview] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');

    getDestinationOverview(name)
      .then((data) => {
        if (cancelled) return;
        setOverview(data);
        setStatus(data ? 'success' : 'empty');
      })
      .catch((error) => {
        if (cancelled) return;
        console.error('Could not load Wikivoyage overview:', error);
        setStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, [name]);

  return (
    <Box
      sx={{
        border: '1px solid #DCEEEE',
        borderRadius: '32px',
        p: 4,
        mb: 3,
        maxWidth: 640,
      }}
    >
      <Typography
        sx={{
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'primary.main',
          mb: 2,
        }}
      >
        Overview
      </Typography>

      {/* Loading: skeleton placeholder lines */}
      {status === 'loading' && (
        <>
          <Skeleton variant="text" height={28} />
          <Skeleton variant="text" height={28} />
          <Skeleton variant="text" height={28} width="70%" />
        </>
      )}

      {/* Success: overview text plus the required license credit */}
      {status === 'success' && (
        <>
          <Typography sx={{ fontSize: 18, lineHeight: 1.7 }}>
            {overview.extract}
          </Typography>

          {overview.url && (
            <Typography color="text.secondary" sx={{ mt: 2, fontSize: 14 }}>
              Source:{' '}
              <Link href={overview.url} target="_blank" rel="noopener noreferrer">
                Wikivoyage
              </Link>{' '}
              (CC BY-SA)
            </Typography>
          )}
        </>
      )}

      {/* Empty: Wikivoyage has no page for this place (common for small towns) */}
      {status === 'empty' && (
        <Typography color="text.secondary">
          No overview available for this destination yet.
        </Typography>
      )}

      {/* Error: network or server problem. Details are logged to the console */}
      {status === 'error' && (
        <Typography color="error">
          Couldn't load the overview. Please try again later.
        </Typography>
      )}
    </Box>
  );
}
import { useNavigate } from 'react-router-dom';
import { Box, Button, Drawer, IconButton, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import CardTravelIcon from '@mui/icons-material/CardTravel';

const links = [
  { label: 'Saved Places', path: '/saved', icon: <StarBorderIcon /> },
  { label: 'My Trips', path: '/trips', icon: <CardTravelIcon /> },
];

export default function SideNav({ open, onClose }) {
  const navigate = useNavigate();

  const go = (path) => {
    onClose();
    navigate(path);
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { width: 300, bgcolor: '#DCEEEE', p: 3, borderRadius: '32px 0 0 32px' },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 3,
        }}
      >
        <Typography variant="h3" sx={{ fontSize: 32, color: 'primary.main' }}>
          Settings
        </Typography>
        <IconButton aria-label="Close menu" onClick={onClose} sx={{ color: 'primary.main' }}>
          <CloseIcon />
        </IconButton>
      </Box>

      <Box component="nav" sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {links.map((link) => (
          <Button
            key={link.path}
            variant="contained"
            size="large"
            startIcon={link.icon}
            onClick={() => go(link.path)}
            sx={{ justifyContent: 'flex-start' }}
          >
            {link.label}
          </Button>
        ))}
      </Box>
    </Drawer>
  );
}
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStytch, useStytchUser } from '@stytch/react';
import { Box, CircularProgress, Typography } from '@mui/material';

const Authenticate = () => {
  const stytch = useStytch();
  const navigate = useNavigate();
  const { user } = useStytchUser();

  useEffect(() => {
    if (user) {
      navigate('/');
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const tokenType = params.get('stytch_token_type');

    if (token && tokenType === 'magic_links') {
      stytch.magicLinks
        .authenticate(token, { session_duration_minutes: 60 })
        .then(() => navigate('/'))
        .catch((err) => {
          console.error('Authentication failed:', err);
          navigate('/');
        });
    } else {
      navigate('/');
    }
  }, [stytch, user, navigate]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <CircularProgress sx={{ mb: 2 }} />
      <Typography>Authenticating...</Typography>
    </Box>
  );
};

export default Authenticate;

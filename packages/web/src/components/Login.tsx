import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { StytchLogin, useStytchUser } from '@stytch/react';
import { Products } from '@stytch/vanilla-js';
import { Box, Typography, Paper, Button } from '@mui/material';

const Login = () => {
  const navigate = useNavigate();
  const { user } = useStytchUser();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const config = {
    products: [Products.emailMagicLinks],
    emailMagicLinksOptions: {
      loginRedirectURL: window.location.origin + '/authenticate',
      signupRedirectURL: window.location.origin + '/authenticate',
      loginExpirationMinutes: 60,
      signupExpirationMinutes: 60,
    },
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#f5f5f5',
      }}
    >
      <Paper elevation={3} sx={{ p: 4, maxWidth: 450 }}>
        <Typography variant="h4" align="center" gutterBottom>
          Baseball Lineup Manager
        </Typography>
        <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 3 }}>
          Sign in to save your lineups
        </Typography>
        <StytchLogin config={config} />
        <Button
          fullWidth
          variant="text"
          sx={{ mt: 2 }}
          onClick={() => navigate('/')}
        >
          Continue without signing in
        </Button>
      </Paper>
    </Box>
  );
};

export default Login;

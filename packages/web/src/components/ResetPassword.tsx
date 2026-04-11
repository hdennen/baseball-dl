import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStytch } from '@stytch/react';
import { Alert, Box, Button, CircularProgress, IconButton, InputAdornment, Paper, Stack, TextField, Typography } from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

const ResetPassword = () => {
  const stytch = useStytch();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [authenticatingMagicLink, setAuthenticatingMagicLink] = useState(false);

  const { token, tokenType } = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return {
      token: params.get('token'),
      tokenType: params.get('stytch_token_type'),
    };
  }, []);

  useEffect(() => {
    if (!token || tokenType !== 'magic_links') {
      return;
    }

    setAuthenticatingMagicLink(true);
    stytch.magicLinks
      .authenticate(token, { session_duration_minutes: 60 })
      .then(() => navigate('/'))
      .catch((authError: unknown) => {
        console.error('Magic link authentication failed:', authError);
        setError('This login link is invalid or expired. Please request a new one.');
      })
      .finally(() => setAuthenticatingMagicLink(false));
  }, [navigate, stytch.magicLinks, token, tokenType]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!token) {
      setError('Missing token. Please use the link from your email.');
      return;
    }

    if (tokenType === 'magic_links') {
      setError('This link is for magic-link login, not password reset.');
      return;
    }

    if (!password) {
      setError('Please enter a new password.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await stytch.passwords.resetByEmail({
        token,
        password,
        session_duration_minutes: 60,
      });
      navigate('/');
    } catch (resetError: unknown) {
      console.error('Password reset failed:', resetError);
      setError('Unable to reset password. The link may be expired or the password may be too weak.');
    } finally {
      setSubmitting(false);
    }
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
      <Paper elevation={3} sx={{ p: 4, width: '100%', maxWidth: 450 }}>
        {authenticatingMagicLink ? (
          <Stack spacing={2} alignItems="center">
            <CircularProgress />
            <Typography>Signing you in...</Typography>
          </Stack>
        ) : (
          <Box component="form" onSubmit={handleSubmit}>
            <Typography variant="h5" align="center" gutterBottom>
              Set your password
            </Typography>
            <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 3 }}>
              Enter a new password for your account.
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Stack spacing={2}>
              <TextField
                type={showPasswords ? 'text' : 'password'}
                label="New password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
                fullWidth
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label={showPasswords ? 'Hide passwords' : 'Show passwords'}
                        onClick={() => setShowPasswords((prev) => !prev)}
                        edge="end"
                      >
                        {showPasswords ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                type={showPasswords ? 'text' : 'password'}
                label="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                required
                fullWidth
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label={showPasswords ? 'Hide passwords' : 'Show passwords'}
                        onClick={() => setShowPasswords((prev) => !prev)}
                        edge="end"
                      >
                        {showPasswords ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <Button type="submit" variant="contained" disabled={submitting} fullWidth>
                {submitting ? <CircularProgress size={20} /> : 'Save password'}
              </Button>
              <Button variant="text" onClick={() => navigate('/login')} fullWidth>
                Back to sign in
              </Button>
            </Stack>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default ResetPassword;

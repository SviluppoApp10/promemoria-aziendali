import { useState } from 'react';
import {
  Box, Typography, Paper, TextField, Button, Alert,
  Avatar, Divider, Stack, CircularProgress,
} from '@mui/material';
import { authApi } from '../services/api';
import { useAuth } from '../store/AuthContext';

export default function ProfilePage() {
  const { user } = useAuth();
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleChangePwd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPwd !== confirmPwd) { setError('Le password non coincidono'); return; }
    if (newPwd.length < 8) { setError('La password deve essere di almeno 8 caratteri'); return; }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await authApi.changePassword(currentPwd, newPwd);
      setSuccess('Password aggiornata con successo');
      setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Errore aggiornamento password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h5" fontWeight={700} mb={3}>Il mio profilo</Typography>

      <Paper sx={{ p: 3, borderRadius: 3, mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center" mb={2}>
          <Avatar sx={{ width: 64, height: 64, bgcolor: 'primary.main', fontSize: 24 }}>
            {user?.first_name?.[0]}{user?.last_name?.[0]}
          </Avatar>
          <Box>
            <Typography variant="h6" fontWeight={600}>
              {user?.first_name} {user?.last_name}
            </Typography>
            <Typography color="text.secondary">@{user?.username}</Typography>
            <Typography color="text.secondary">{user?.email}</Typography>
          </Box>
        </Stack>
        <Divider />
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Ruolo: <strong>{user?.role === 'admin' ? 'Amministratore' : 'Utente'}</strong>
          </Typography>
        </Box>
      </Paper>

      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Typography variant="h6" fontWeight={600} mb={2}>Cambia password</Typography>
        <form onSubmit={handleChangePwd}>
          <Stack spacing={2}>
            <TextField label="Password attuale" type="password" value={currentPwd}
              onChange={e => setCurrentPwd(e.target.value)} required fullWidth />
            <TextField label="Nuova password" type="password" value={newPwd}
              onChange={e => setNewPwd(e.target.value)} required fullWidth helperText="Min. 8 caratteri" />
            <TextField label="Conferma nuova password" type="password" value={confirmPwd}
              onChange={e => setConfirmPwd(e.target.value)} required fullWidth />
            {error && <Alert severity="error">{error}</Alert>}
            {success && <Alert severity="success">{success}</Alert>}
            <Button type="submit" variant="contained" disabled={loading}>
              {loading ? <CircularProgress size={20} /> : 'Aggiorna password'}
            </Button>
          </Stack>
        </form>
      </Paper>
    </Box>
  );
}

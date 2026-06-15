import { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, IconButton,
  Chip, Avatar, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Select, MenuItem, FormControl, InputLabel, Stack,
  Switch, FormControlLabel, Alert, CircularProgress,
} from '@mui/material';
import { Add, Edit, Lock } from '@mui/icons-material';
import { usersApi } from '../services/api';
import type { User } from '../types';

function UserAvatar({ user }: { user: User }) {
  return (
    <Avatar sx={{ width: 32, height: 32, bgcolor: user.role === 'admin' ? 'error.main' : 'primary.main', fontSize: 13 }}>
      {user.first_name?.[0]}{user.last_name?.[0]}
    </Avatar>
  );
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [pwdDialogOpen, setPwdDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [newPwd, setNewPwd] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    username: '', email: '', password: '', role: 'user',
    first_name: '', last_name: '', is_active: true,
  });

  const fetch = async () => {
    setLoading(true);
    usersApi.getAll().then(({ data }) => setUsers(data)).finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []);

  const openCreate = () => {
    setEditUser(null);
    setForm({ username: '', email: '', password: '', role: 'user', first_name: '', last_name: '', is_active: true });
    setDialogOpen(true);
  };

  const openEdit = (u: User) => {
    setEditUser(u);
    setForm({ username: u.username, email: u.email, password: '', role: u.role, first_name: u.first_name || '', last_name: u.last_name || '', is_active: u.is_active ?? true });
    setDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editUser) {
        await usersApi.update(editUser.id, { email: form.email, role: form.role as 'admin' | 'user', first_name: form.first_name, last_name: form.last_name, is_active: form.is_active });
      } else {
        await usersApi.create({ username: form.username, email: form.email, password: form.password, role: form.role as 'admin' | 'user', first_name: form.first_name, last_name: form.last_name });
      }
      setDialogOpen(false);
      fetch();
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Errore salvataggio');
    } finally {
      setSaving(false);
    }
  };

  const handleResetPwd = async () => {
    if (!selectedUserId || newPwd.length < 8) return;
    await usersApi.resetPassword(selectedUserId, newPwd);
    setPwdDialogOpen(false);
    setNewPwd('');
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Gestione utenti</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={openCreate}>Nuovo utente</Button>
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Utente</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Ruolo</TableCell>
              <TableCell>Stato</TableCell>
              <TableCell>Ultimo accesso</TableCell>
              <TableCell align="right">Azioni</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} align="center"><CircularProgress size={24} /></TableCell></TableRow>
            ) : users.map(u => (
              <TableRow key={u.id} hover>
                <TableCell>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <UserAvatar user={u} />
                    <Box>
                      <Typography variant="body2" fontWeight={500}>{u.first_name} {u.last_name}</Typography>
                      <Typography variant="caption" color="text.secondary">@{u.username}</Typography>
                    </Box>
                  </Stack>
                </TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>
                  <Chip label={u.role} color={u.role === 'admin' ? 'error' : 'default'} size="small" />
                </TableCell>
                <TableCell>
                  <Chip label={u.is_active ? 'Attivo' : 'Disabilitato'} color={u.is_active ? 'success' : 'default'} size="small" />
                </TableCell>
                <TableCell>
                  {u.last_login ? new Date(u.last_login).toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                </TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => openEdit(u)} title="Modifica"><Edit fontSize="small" /></IconButton>
                  <IconButton size="small" onClick={() => { setSelectedUserId(u.id); setNewPwd(''); setPwdDialogOpen(true); }} title="Reimposta password">
                    <Lock fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog crea/modifica */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleSave}>
          <DialogTitle>{editUser ? 'Modifica utente' : 'Nuovo utente'}</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              {!editUser && (
                <TextField label="Username" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} required fullWidth />
              )}
              <TextField label="Email" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required fullWidth />
              {!editUser && (
                <TextField label="Password" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required fullWidth helperText="Min. 8 caratteri" />
              )}
              <Stack direction="row" spacing={2}>
                <TextField label="Nome" value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} fullWidth />
                <TextField label="Cognome" value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} fullWidth />
              </Stack>
              <FormControl fullWidth>
                <InputLabel>Ruolo</InputLabel>
                <Select value={form.role} label="Ruolo" onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                  <MenuItem value="user">Utente</MenuItem>
                  <MenuItem value="admin">Amministratore</MenuItem>
                </Select>
              </FormControl>
              {editUser && (
                <FormControlLabel
                  control={<Switch checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />}
                  label="Account attivo"
                />
              )}
              {error && <Alert severity="error">{error}</Alert>}
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setDialogOpen(false)}>Annulla</Button>
            <Button type="submit" variant="contained" disabled={saving}>
              {saving ? <CircularProgress size={20} /> : 'Salva'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Dialog reset password */}
      <Dialog open={pwdDialogOpen} onClose={() => setPwdDialogOpen(false)}>
        <DialogTitle>Reimposta password</DialogTitle>
        <DialogContent>
          <TextField label="Nuova password" type="password" value={newPwd}
            onChange={e => setNewPwd(e.target.value)}
            fullWidth sx={{ mt: 1 }} helperText="Min. 8 caratteri" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPwdDialogOpen(false)}>Annulla</Button>
          <Button variant="contained" onClick={handleResetPwd} disabled={newPwd.length < 8}>
            Reimposta
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

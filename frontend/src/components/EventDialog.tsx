import { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Grid, MenuItem, CircularProgress,
} from '@mui/material';
import type { Event } from '../types';
import { eventsApi } from '../services/api';

interface Props {
  open: boolean;
  event?: Event | null;
  onClose: () => void;
  onSaved: () => void;
}

const EMPTY = {
  collaborator_name: '',
  collaborator_email: '',
  title: '',
  description: '',
  event_date: '',
  event_time: '',
  reminder_datetime: '',
};

export default function EventDialog({ open, event, onClose, onSaved }: Props) {
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (event) {
      setForm({
        collaborator_name: event.collaborator_name,
        collaborator_email: event.collaborator_email,
        title: event.title,
        description: event.description || '',
        event_date: event.event_date,
        event_time: event.event_time.substring(0, 5),
        reminder_datetime: event.reminder_datetime
          ? new Date(event.reminder_datetime).toISOString().slice(0, 16)
          : '',
      });
    } else {
      setForm(EMPTY);
    }
    setError('');
  }, [event, open]);

  const set = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload = {
        ...form,
        reminder_datetime: form.reminder_datetime || undefined,
      };
      if (event) {
        await eventsApi.update(event.id, payload);
      } else {
        await eventsApi.create(payload);
      }
      onSaved();
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg || 'Errore salvataggio');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>{event ? 'Modifica evento' : 'Nuovo evento'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <TextField label="Nome collaboratore" value={form.collaborator_name}
                onChange={e => set('collaborator_name', e.target.value)}
                fullWidth required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Email collaboratore" type="email" value={form.collaborator_email}
                onChange={e => set('collaborator_email', e.target.value)}
                fullWidth required />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Titolo evento" value={form.title}
                onChange={e => set('title', e.target.value)}
                fullWidth required />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Descrizione" value={form.description}
                onChange={e => set('description', e.target.value)}
                fullWidth multiline rows={3} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Data evento" type="date" value={form.event_date}
                onChange={e => set('event_date', e.target.value)}
                fullWidth required InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Ora evento" type="time" value={form.event_time}
                onChange={e => set('event_time', e.target.value)}
                fullWidth required InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Data e ora promemoria"
                type="datetime-local"
                value={form.reminder_datetime}
                onChange={e => set('reminder_datetime', e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
                helperText="Lascia vuoto per nessun promemoria automatico"
              />
            </Grid>
            {error && (
              <Grid item xs={12}>
                <span style={{ color: 'red', fontSize: 13 }}>{error}</span>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose}>Annulla</Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={20} /> : event ? 'Salva' : 'Crea'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

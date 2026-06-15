import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Button, TextField, InputAdornment, Select,
  MenuItem, FormControl, InputLabel, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, IconButton, Chip,
  Tooltip, TablePagination, Alert, Skeleton, Stack,
} from '@mui/material';
import {
  Add, Search, Edit, Delete, FilterList, Download, Clear,
} from '@mui/icons-material';
import { eventsApi } from '../services/api';
import type { Event, Collaborator } from '../types';
import EventDialog from '../components/EventDialog';

function formatDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('it-IT');
}
function formatDateTime(d?: string) {
  if (!d) return '—';
  return new Date(d).toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' });
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [search, setSearch] = useState('');
  const [collaboratorFilter, setCollaboratorFilter] = useState('');
  const [reminderFilter, setReminderFilter] = useState('');
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editEvent, setEditEvent] = useState<Event | null>(null);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await eventsApi.getAll({
        search: search || undefined,
        collaborator_email: collaboratorFilter || undefined,
        reminder_sent: reminderFilter || undefined,
        page: page + 1,
        limit: rowsPerPage,
      });
      setEvents(data.events);
      setTotal(data.total);
    } catch {
      setError('Errore caricamento eventi');
    } finally {
      setLoading(false);
    }
  }, [search, collaboratorFilter, reminderFilter, page, rowsPerPage]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  useEffect(() => {
    eventsApi.getCollaborators().then(({ data }) => setCollaborators(data)).catch(() => {});
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Eliminare questo evento?')) return;
    await eventsApi.delete(id);
    fetchEvents();
  };

  const handleExport = async () => {
    const { data } = await eventsApi.exportExcel({
      collaborator_email: collaboratorFilter || undefined,
    });
    const url = URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eventi_${new Date().toISOString().split('T')[0]}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setSearch('');
    setCollaboratorFilter('');
    setReminderFilter('');
    setPage(0);
  };

  const hasFilters = search || collaboratorFilter || reminderFilter;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Gestione eventi</Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<Download />} onClick={handleExport}>
            Excel
          </Button>
          <Button variant="contained" startIcon={<Add />} onClick={() => { setEditEvent(null); setDialogOpen(true); }}>
            Nuovo evento
          </Button>
        </Stack>
      </Box>

      {/* Filtri */}
      <Paper sx={{ p: 2, mb: 2, borderRadius: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <TextField
            size="small" placeholder="Cerca titolo, collaboratore..." value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }}
            sx={{ minWidth: 240 }}
          />
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Collaboratore</InputLabel>
            <Select value={collaboratorFilter} label="Collaboratore"
              onChange={e => { setCollaboratorFilter(e.target.value); setPage(0); }}>
              <MenuItem value="">Tutti</MenuItem>
              {collaborators.map(c => (
                <MenuItem key={c.collaborator_email} value={c.collaborator_email}>
                  {c.collaborator_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Promemoria</InputLabel>
            <Select value={reminderFilter} label="Promemoria"
              onChange={e => { setReminderFilter(e.target.value); setPage(0); }}>
              <MenuItem value="">Tutti</MenuItem>
              <MenuItem value="true">Inviato</MenuItem>
              <MenuItem value="false">Non inviato</MenuItem>
            </Select>
          </FormControl>
          {hasFilters && (
            <Tooltip title="Rimuovi filtri">
              <IconButton onClick={clearFilters}><Clear /></IconButton>
            </Tooltip>
          )}
          <Box sx={{ ml: 'auto' }}>
            <Chip icon={<FilterList />} label={`${total} risultati`} variant="outlined" />
          </Box>
        </Stack>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell><strong>Collaboratore</strong></TableCell>
              <TableCell><strong>Titolo</strong></TableCell>
              <TableCell><strong>Data</strong></TableCell>
              <TableCell><strong>Ora</strong></TableCell>
              <TableCell><strong>Promemoria</strong></TableCell>
              <TableCell><strong>Stato</strong></TableCell>
              <TableCell align="right"><strong>Azioni</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  {[...Array(7)].map((__, j) => (
                    <TableCell key={j}><Skeleton /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : events.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  Nessun evento trovato
                </TableCell>
              </TableRow>
            ) : (
              events.map(ev => (
                <TableRow key={ev.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>{ev.collaborator_name}</Typography>
                    <Typography variant="caption" color="text.secondary">{ev.collaborator_email}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{ev.title}</Typography>
                    {ev.description && (
                      <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 200, display: 'block' }}>
                        {ev.description}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>{formatDate(ev.event_date)}</TableCell>
                  <TableCell>{ev.event_time.substring(0, 5)}</TableCell>
                  <TableCell>{formatDateTime(ev.reminder_datetime)}</TableCell>
                  <TableCell>
                    {ev.reminder_datetime ? (
                      <Chip
                        label={ev.reminder_sent ? 'Inviato' : 'In attesa'}
                        color={ev.reminder_sent ? 'success' : 'warning'}
                        size="small"
                      />
                    ) : (
                      <Chip label="Nessuno" size="small" variant="outlined" />
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Modifica">
                      <IconButton size="small" onClick={() => { setEditEvent(ev); setDialogOpen(true); }}>
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Elimina">
                      <IconButton size="small" color="error" onClick={() => handleDelete(ev.id)}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={total}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={(_, p) => setPage(p)}
          onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value)); setPage(0); }}
          rowsPerPageOptions={[10, 20, 50]}
          labelRowsPerPage="Righe:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} di ${count}`}
        />
      </TableContainer>

      <EventDialog
        open={dialogOpen}
        event={editEvent}
        onClose={() => setDialogOpen(false)}
        onSaved={fetchEvents}
      />
    </Box>
  );
}

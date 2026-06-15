import { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TablePagination,
  Chip, CircularProgress, FormControl, InputLabel, Select, MenuItem, Stack,
} from '@mui/material';
import { notificationsApi } from '../services/api';
import type { EmailLog } from '../types';

export default function EmailLogsPage() {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [status, setStatus] = useState('');

  const fetch = async () => {
    setLoading(true);
    notificationsApi.getEmailLogs({ page: page + 1, limit: 20, status: status || undefined })
      .then(({ data }) => { setLogs(data.logs); setTotal(data.total); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, [page, status]);

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Storico email inviate</Typography>
        <Stack direction="row" spacing={2}>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Stato</InputLabel>
            <Select value={status} label="Stato" onChange={e => { setStatus(e.target.value); setPage(0); }}>
              <MenuItem value="">Tutti</MenuItem>
              <MenuItem value="sent">Inviati</MenuItem>
              <MenuItem value="failed">Falliti</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Data invio</TableCell>
              <TableCell>Destinatario</TableCell>
              <TableCell>Evento</TableCell>
              <TableCell>Oggetto</TableCell>
              <TableCell>Stato</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} align="center"><CircularProgress size={24} /></TableCell></TableRow>
            ) : logs.length === 0 ? (
              <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>Nessun log trovato</TableCell></TableRow>
            ) : logs.map(log => (
              <TableRow key={log.id} hover>
                <TableCell>
                  <Typography variant="caption">
                    {new Date(log.sent_at).toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' })}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{log.recipient_name}</Typography>
                  <Typography variant="caption" color="text.secondary">{log.recipient_email}</Typography>
                </TableCell>
                <TableCell>{log.event_title || '—'}</TableCell>
                <TableCell>
                  <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>{log.subject}</Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={log.status === 'sent' ? 'Inviato' : log.status === 'failed' ? 'Fallito' : 'In coda'}
                    color={log.status === 'sent' ? 'success' : log.status === 'failed' ? 'error' : 'warning'}
                    size="small"
                  />
                  {log.error_message && (
                    <Typography variant="caption" color="error" display="block">{log.error_message}</Typography>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination
          component="div" count={total} page={page} rowsPerPage={20}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPageOptions={[20]}
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} di ${count}`}
        />
      </TableContainer>
    </Box>
  );
}

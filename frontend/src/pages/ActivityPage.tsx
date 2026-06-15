import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TablePagination,
  Chip, CircularProgress, TextField, InputAdornment,
} from '@mui/material';
import { Search } from '@mui/icons-material';
import { activityApi } from '../services/api';
import type { ActivityLog } from '../types';

const actionColors: Record<string, 'default' | 'primary' | 'success' | 'error' | 'warning'> = {
  LOGIN: 'success',
  LOGOUT: 'default',
  CREATE_EVENT: 'primary',
  UPDATE_EVENT: 'warning',
  DELETE_EVENT: 'error',
  CREATE_USER: 'primary',
};

export default function ActivityPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [actionFilter, setActionFilter] = useState('');

  const fetch = useCallback(async () => {
    setLoading(true);
    activityApi.getAll({ page: page + 1, limit: 50, action: actionFilter || undefined })
      .then(({ data }) => { setLogs(data.logs); setTotal(data.total); })
      .finally(() => setLoading(false));
  }, [page, actionFilter]);

  useEffect(() => { fetch(); }, [fetch]);

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Log attività utenti</Typography>
        <TextField size="small" placeholder="Filtra azione..." value={actionFilter}
          onChange={e => { setActionFilter(e.target.value); setPage(0); }}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }}
        />
      </Box>
      <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Data/Ora</TableCell>
              <TableCell>Utente</TableCell>
              <TableCell>Azione</TableCell>
              <TableCell>Entità</TableCell>
              <TableCell>IP</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} align="center"><CircularProgress size={24} /></TableCell></TableRow>
            ) : logs.map(log => (
              <TableRow key={log.id} hover>
                <TableCell>
                  <Typography variant="caption">
                    {new Date(log.created_at).toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'medium' })}
                  </Typography>
                </TableCell>
                <TableCell>
                  {log.username ? (
                    <Box>
                      <Typography variant="body2">{log.first_name} {log.last_name}</Typography>
                      <Typography variant="caption" color="text.secondary">@{log.username}</Typography>
                    </Box>
                  ) : '—'}
                </TableCell>
                <TableCell>
                  <Chip label={log.action} color={actionColors[log.action] || 'default'} size="small" />
                </TableCell>
                <TableCell>
                  {log.entity_type ? `${log.entity_type} #${log.entity_id}` : '—'}
                </TableCell>
                <TableCell>
                  <Typography variant="caption" color="text.secondary">{log.ip_address || '—'}</Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination
          component="div" count={total} page={page} rowsPerPage={50}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPageOptions={[50]}
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} di ${count}`}
        />
      </TableContainer>
    </Box>
  );
}

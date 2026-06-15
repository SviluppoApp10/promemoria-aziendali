import { useState, useEffect } from 'react';
import {
  Box, Typography, List, ListItem, ListItemText, ListItemIcon,
  IconButton, Button, Chip, Paper, Divider, CircularProgress,
} from '@mui/material';
import { Info, Warning, CheckCircle, Error, DoneAll, Check } from '@mui/icons-material';
import { notificationsApi } from '../services/api';
import type { Notification } from '../types';

const iconMap = {
  info: <Info color="info" />,
  warning: <Warning color="warning" />,
  success: <CheckCircle color="success" />,
  error: <Error color="error" />,
};

export default function NotificationsPage() {
  const [data, setData] = useState<{ notifications: Notification[]; unread: number }>({ notifications: [], unread: 0 });
  const [loading, setLoading] = useState(true);

  const fetch = () => {
    notificationsApi.getAll()
      .then(({ data: d }) => setData(d))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []);

  const handleRead = async (id: number) => {
    await notificationsApi.markRead(id);
    fetch();
  };

  const handleReadAll = async () => {
    await notificationsApi.markAllRead();
    fetch();
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h5" fontWeight={700}>Notifiche</Typography>
          {data.unread > 0 && <Chip label={`${data.unread} non lette`} color="error" size="small" />}
        </Box>
        {data.unread > 0 && (
          <Button startIcon={<DoneAll />} onClick={handleReadAll}>
            Segna tutte come lette
          </Button>
        )}
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper sx={{ borderRadius: 3 }}>
          <List>
            {data.notifications.length === 0 ? (
              <ListItem>
                <ListItemText primary="Nessuna notifica" sx={{ textAlign: 'center', color: 'text.secondary' }} />
              </ListItem>
            ) : (
              data.notifications.map((n, i) => (
                <Box key={n.id}>
                  <ListItem
                    sx={{ bgcolor: n.is_read ? 'transparent' : 'action.hover', px: 3 }}
                    secondaryAction={
                      !n.is_read && (
                        <IconButton size="small" onClick={() => handleRead(n.id)} title="Segna come letta">
                          <Check fontSize="small" />
                        </IconButton>
                      )
                    }
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      {iconMap[n.type]}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body1" fontWeight={n.is_read ? 400 : 600}>
                            {n.title}
                          </Typography>
                          {!n.is_read && <Chip label="Nuova" size="small" color="primary" sx={{ height: 16, fontSize: 10 }} />}
                        </Box>
                      }
                      secondary={
                        <Box>
                          {n.message && <Typography variant="body2" color="text.secondary">{n.message}</Typography>}
                          <Typography variant="caption" color="text.disabled">
                            {new Date(n.created_at).toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' })}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                  {i < data.notifications.length - 1 && <Divider />}
                </Box>
              ))
            )}
          </List>
        </Paper>
      )}
    </Box>
  );
}

import { useState, useEffect } from 'react';
import {
  Grid, Typography, Box, Card, CardContent, CardHeader,
  List, ListItem, ListItemText, Chip, Button, Alert,
} from '@mui/material';
import {
  Event, CheckCircle, Schedule, People, Email,
  TrendingUp, Download,
} from '@mui/icons-material';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { statsApi, eventsApi, backupApi } from '../services/api';
import type { DashboardStats, Event as EventType } from '../types';
import StatCard from '../components/StatCard';
import { useAuth } from '../store/AuthContext';

const COLORS = ['#1976d2', '#42a5f5', '#90caf9', '#bbdefb', '#e3f2fd'];

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });
}

export default function DashboardPage() {
  const { isAdmin } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [upcoming, setUpcoming] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      statsApi.getDashboard(),
      eventsApi.getUpcoming(7),
    ])
      .then(([s, u]) => {
        setStats(s.data);
        setUpcoming(u.data);
      })
      .catch(() => setError('Errore caricamento dashboard'))
      .finally(() => setLoading(false));
  }, []);

  const handleBackup = async () => {
    const { data } = await backupApi.download();
    const url = URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const monthlyData = stats?.events_by_month.map(m => ({
    name: m.month.substring(5),
    eventi: parseInt(m.count),
  })) || [];

  const reminderPie = stats ? [
    { name: 'Inviati', value: stats.reminders.sent },
    { name: 'In attesa', value: stats.reminders.pending },
    { name: 'Senza promemoria', value: stats.events.total - stats.reminders.total },
  ].filter(d => d.value > 0) : [];

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Dashboard</Typography>
        {isAdmin && (
          <Button variant="outlined" startIcon={<Download />} onClick={handleBackup}>
            Backup DB
          </Button>
        )}
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={3}>
        {/* Stat cards */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Totale eventi" value={stats?.events.total ?? 0}
            subtitle={`${stats?.events.future ?? 0} futuri`}
            icon={<Event />} color="#1976d2" loading={loading} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Promemoria inviati" value={stats?.reminders.sent ?? 0}
            subtitle={`${stats?.reminders.pending ?? 0} in attesa`}
            icon={<CheckCircle />} color="#2e7d32" loading={loading} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Prossimi 7 giorni" value={stats?.upcoming_7_days ?? 0}
            subtitle="eventi imminenti"
            icon={<Schedule />} color="#ed6c02" loading={loading} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Email inviate" value={stats?.email_logs.sent ?? 0}
            subtitle={`su ${stats?.email_logs.total ?? 0} totali`}
            icon={<Email />} color="#9c27b0" loading={loading} />
        </Grid>

        {/* Grafico mensile */}
        <Grid item xs={12} md={8}>
          <Card sx={{ borderRadius: 3 }}>
            <CardHeader title="Eventi per mese" avatar={<TrendingUp color="primary" />} />
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="eventi" fill="#1976d2" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Grafico promemoria */}
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 3 }}>
            <CardHeader title="Stato promemoria" />
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={reminderPie} cx="50%" cy="50%" innerRadius={60} outerRadius={90}
                    dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}>
                    {reminderPie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Eventi imminenti */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3 }}>
            <CardHeader title="Eventi imminenti (7 giorni)" avatar={<Schedule color="warning" />} />
            <CardContent sx={{ pt: 0 }}>
              {upcoming.length === 0 ? (
                <Typography color="text.secondary" variant="body2">Nessun evento nei prossimi 7 giorni</Typography>
              ) : (
                <List dense>
                  {upcoming.slice(0, 8).map((ev) => (
                    <ListItem key={ev.id} divider sx={{ px: 0 }}>
                      <ListItemText
                        primary={ev.title}
                        secondary={`${ev.collaborator_name} — ${formatDate(ev.event_date)} alle ${ev.event_time.substring(0, 5)}`}
                      />
                      <Chip
                        label={ev.reminder_sent ? 'Inviato' : 'In attesa'}
                        color={ev.reminder_sent ? 'success' : 'warning'}
                        size="small"
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Top collaboratori */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3 }}>
            <CardHeader title="Top collaboratori" avatar={<People color="primary" />} />
            <CardContent sx={{ pt: 0 }}>
              {!stats?.top_collaborators.length ? (
                <Typography color="text.secondary" variant="body2">Nessun dato</Typography>
              ) : (
                <List dense>
                  {stats.top_collaborators.map((c, i) => (
                    <ListItem key={i} divider sx={{ px: 0 }}>
                      <ListItemText
                        primary={c.collaborator_name}
                        secondary={c.collaborator_email}
                      />
                      <Chip label={`${c.event_count} eventi`} variant="outlined" size="small" />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

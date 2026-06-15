import { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Button, IconButton, Grid, Chip,
  ToggleButtonGroup, ToggleButton, Tooltip, Stack,
} from '@mui/material';
import {
  ChevronLeft, ChevronRight, Today, Add,
} from '@mui/icons-material';
import { eventsApi } from '../services/api';
import type { Event } from '../types';
import EventDialog from '../components/EventDialog';

type ViewMode = 'month' | 'week' | 'day';

const DAYS_IT = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
const MONTHS_IT = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre',
];

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<ViewMode>('month');
  const [events, setEvents] = useState<Event[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editEvent, setEditEvent] = useState<Event | null>(null);

  const fetchEvents = async () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const start = new Date(year, month - 1, 1).toISOString().split('T')[0];
    const end = new Date(year, month + 2, 0).toISOString().split('T')[0];
    const { data } = await eventsApi.getAll({ start_date: start, end_date: end, limit: 500 });
    setEvents(data.events);
  };

  useEffect(() => { fetchEvents(); }, [currentDate]);

  const eventsOnDate = (date: Date) => {
    const key = date.toISOString().split('T')[0];
    return events.filter(e => e.event_date === key);
  };

  const navigate = (delta: number) => {
    const d = new Date(currentDate);
    if (view === 'month') d.setMonth(d.getMonth() + delta);
    else if (view === 'week') d.setDate(d.getDate() + delta * 7);
    else d.setDate(d.getDate() + delta);
    setCurrentDate(d);
  };

  // Celle mese
  const getMonthDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const days: (Date | null)[] = [];
    for (let i = 0; i < first.getDay(); i++) days.push(null);
    for (let d = 1; d <= last.getDate(); d++) days.push(new Date(year, month, d));
    return days;
  };

  // Celle settimana
  const getWeekDays = () => {
    const d = new Date(currentDate);
    const day = d.getDay();
    d.setDate(d.getDate() - day);
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(d);
      date.setDate(d.getDate() + i);
      return date;
    });
  };

  const isToday = (date: Date) => date.toDateString() === new Date().toDateString();

  const headerTitle = () => {
    if (view === 'month') return `${MONTHS_IT[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    if (view === 'week') {
      const week = getWeekDays();
      return `${week[0].getDate()} – ${week[6].getDate()} ${MONTHS_IT[week[6].getMonth()]} ${week[6].getFullYear()}`;
    }
    return currentDate.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  const DayCell = ({ date, height = 100 }: { date: Date; height?: number }) => {
    const dayEvents = eventsOnDate(date);
    return (
      <Box sx={{
        border: '1px solid', borderColor: 'divider',
        borderRadius: 1, p: 0.5, minHeight: height,
        bgcolor: isToday(date) ? 'primary.50' : 'background.paper',
        '&:hover': { bgcolor: 'action.hover' },
        cursor: 'default',
      }}>
        <Typography variant="caption" fontWeight={isToday(date) ? 700 : 400}
          color={isToday(date) ? 'primary' : 'text.primary'}
          sx={{ display: 'block', mb: 0.5 }}>
          {date.getDate()}
        </Typography>
        {dayEvents.slice(0, 3).map(ev => (
          <Chip
            key={ev.id}
            label={ev.title}
            size="small"
            onClick={() => { setEditEvent(ev); setDialogOpen(true); }}
            color={ev.reminder_sent ? 'success' : 'primary'}
            sx={{ mb: 0.25, maxWidth: '100%', fontSize: 10, height: 18 }}
          />
        ))}
        {dayEvents.length > 3 && (
          <Typography variant="caption" color="text.secondary">+{dayEvents.length - 3} altri</Typography>
        )}
      </Box>
    );
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5" fontWeight={700}>Calendario</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => { setEditEvent(null); setDialogOpen(true); }}>
          Nuovo evento
        </Button>
      </Box>

      <Paper sx={{ p: 2, borderRadius: 3 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <IconButton onClick={() => navigate(-1)}><ChevronLeft /></IconButton>
            <Typography variant="h6" fontWeight={600} sx={{ minWidth: 280, textAlign: 'center' }}>
              {headerTitle()}
            </Typography>
            <IconButton onClick={() => navigate(1)}><ChevronRight /></IconButton>
            <Tooltip title="Oggi">
              <IconButton onClick={() => setCurrentDate(new Date())}><Today /></IconButton>
            </Tooltip>
          </Stack>
          <ToggleButtonGroup value={view} exclusive onChange={(_, v) => v && setView(v)} size="small">
            <ToggleButton value="month">Mese</ToggleButton>
            <ToggleButton value="week">Settimana</ToggleButton>
            <ToggleButton value="day">Giorno</ToggleButton>
          </ToggleButtonGroup>
        </Stack>

        {view === 'month' && (
          <>
            <Grid container columns={7} sx={{ mb: 0.5 }}>
              {DAYS_IT.map(d => (
                <Grid item xs={1} key={d}>
                  <Typography variant="caption" fontWeight={600} color="text.secondary" align="center" display="block">
                    {d}
                  </Typography>
                </Grid>
              ))}
            </Grid>
            <Grid container columns={7} spacing={0.5}>
              {getMonthDays().map((date, i) => (
                <Grid item xs={1} key={i}>
                  {date ? <DayCell date={date} height={90} /> : <Box sx={{ minHeight: 90 }} />}
                </Grid>
              ))}
            </Grid>
          </>
        )}

        {view === 'week' && (
          <>
            <Grid container spacing={0.5}>
              {getWeekDays().map((date, i) => (
                <Grid item xs key={i}>
                  <Typography variant="caption" fontWeight={600} color="text.secondary" align="center" display="block" mb={0.5}>
                    {DAYS_IT[date.getDay()]} {date.getDate()}
                  </Typography>
                  <DayCell date={date} height={200} />
                </Grid>
              ))}
            </Grid>
          </>
        )}

        {view === 'day' && (
          <Box>
            <Typography variant="h6" gutterBottom>
              {currentDate.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}
            </Typography>
            {eventsOnDate(currentDate).length === 0 ? (
              <Typography color="text.secondary">Nessun evento in questa giornata</Typography>
            ) : (
              eventsOnDate(currentDate).map(ev => (
                <Paper key={ev.id} sx={{ p: 2, mb: 1, borderLeft: '4px solid', borderColor: 'primary.main', borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Typography fontWeight={600}>{ev.event_time.substring(0, 5)} — {ev.title}</Typography>
                      <Typography variant="body2" color="text.secondary">{ev.collaborator_name} ({ev.collaborator_email})</Typography>
                      {ev.description && <Typography variant="body2" sx={{ mt: 0.5 }}>{ev.description}</Typography>}
                    </Box>
                    <Chip
                      label={ev.reminder_sent ? 'Promemoria inviato' : 'In attesa'}
                      color={ev.reminder_sent ? 'success' : 'warning'}
                      size="small"
                    />
                  </Box>
                </Paper>
              ))
            )}
          </Box>
        )}
      </Paper>

      <EventDialog
        open={dialogOpen}
        event={editEvent}
        onClose={() => setDialogOpen(false)}
        onSaved={fetchEvents}
      />
    </Box>
  );
}

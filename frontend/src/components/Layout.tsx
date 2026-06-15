import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Drawer, AppBar, Toolbar, List, ListItem, ListItemButton,
  ListItemIcon, ListItemText, IconButton, Typography, Avatar,
  Badge, Menu, MenuItem, Divider, Tooltip, useTheme, useMediaQuery,
} from '@mui/material';
import {
  Dashboard, Event, CalendarMonth, People, Notifications,
  History, Email, Menu as MenuIcon, Brightness4, Brightness7,
  AccountCircle, Logout, Person, ChevronLeft,
} from '@mui/icons-material';
import { useAuth } from '../store/AuthContext';
import { useThemeMode } from '../store/ThemeContext';
import { notificationsApi } from '../services/api';

const DRAWER_WIDTH = 240;

const navItems = [
  { label: 'Dashboard', icon: <Dashboard />, path: '/' },
  { label: 'Eventi', icon: <Event />, path: '/events' },
  { label: 'Calendario', icon: <CalendarMonth />, path: '/calendar' },
  { label: 'Notifiche', icon: <Notifications />, path: '/notifications' },
];

const adminItems = [
  { label: 'Utenti', icon: <People />, path: '/users' },
  { label: 'Log Attività', icon: <History />, path: '/activity' },
  { label: 'Log Email', icon: <Email />, path: '/email-logs' },
];

export default function Layout() {
  const { user, logout, isAdmin } = useAuth();
  const { mode, toggleTheme } = useThemeMode();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [drawerOpen, setDrawerOpen] = useState(!isMobile);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    const fetchUnread = () => {
      notificationsApi.getAll()
        .then(({ data }) => setUnread(data.unread))
        .catch(() => {});
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar sx={{ justifyContent: 'space-between', px: 2 }}>
        <Typography variant="h6" fontWeight={700} color="primary" noWrap>
          Promemoria
        </Typography>
        {isMobile && (
          <IconButton onClick={() => setDrawerOpen(false)}>
            <ChevronLeft />
          </IconButton>
        )}
      </Toolbar>
      <Divider />
      <List sx={{ flex: 1, pt: 1 }}>
        {navItems.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => { navigate(item.path); if (isMobile) setDrawerOpen(false); }}
              sx={{ mx: 1, borderRadius: 2, mb: 0.5 }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                {item.path === '/notifications'
                  ? <Badge badgeContent={unread} color="error">{item.icon}</Badge>
                  : item.icon}
              </ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
        {isAdmin && (
          <>
            <Divider sx={{ my: 1 }} />
            <Typography variant="caption" sx={{ px: 3, color: 'text.secondary', fontWeight: 600 }}>
              AMMINISTRAZIONE
            </Typography>
            {adminItems.map((item) => (
              <ListItem key={item.path} disablePadding>
                <ListItemButton
                  selected={location.pathname === item.path}
                  onClick={() => { navigate(item.path); if (isMobile) setDrawerOpen(false); }}
                  sx={{ mx: 1, borderRadius: 2, mb: 0.5, mt: 0.5 }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.label} />
                </ListItemButton>
              </ListItem>
            ))}
          </>
        )}
      </List>
      <Divider />
      <Box sx={{ p: 2 }}>
        <Typography variant="caption" color="text.secondary">
          {user?.first_name} {user?.last_name}
        </Typography>
        <br />
        <Typography variant="caption" color="text.secondary">{user?.role}</Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar position="fixed" sx={{ zIndex: theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton color="inherit" edge="start" onClick={() => setDrawerOpen(!drawerOpen)} sx={{ mr: 2 }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontWeight: 700 }}>
            Promemoria Aziendali
          </Typography>
          <Tooltip title={mode === 'light' ? 'Tema scuro' : 'Tema chiaro'}>
            <IconButton color="inherit" onClick={toggleTheme}>
              {mode === 'light' ? <Brightness4 /> : <Brightness7 />}
            </IconButton>
          </Tooltip>
          <IconButton color="inherit" onClick={() => navigate('/notifications')}>
            <Badge badgeContent={unread} color="error">
              <Notifications />
            </Badge>
          </IconButton>
          <IconButton color="inherit" onClick={(e) => setAnchorEl(e.currentTarget)}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.dark', fontSize: 14 }}>
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </Avatar>
          </IconButton>
          <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={() => setAnchorEl(null)}>
            <MenuItem onClick={() => { navigate('/profile'); setAnchorEl(null); }}>
              <AccountCircle sx={{ mr: 1 }} /> Profilo
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
              <Logout sx={{ mr: 1 }} /> Esci
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Drawer
        variant={isMobile ? 'temporary' : 'persistent'}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
        }}
      >
        {drawerContent}
      </Drawer>

      <Box component="main" sx={{
        flexGrow: 1,
        p: 3,
        mt: 8,
        ml: !isMobile && drawerOpen ? `${DRAWER_WIDTH}px` : 0,
        transition: theme.transitions.create('margin', {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.leavingScreen,
        }),
        minHeight: 'calc(100vh - 64px)',
        bgcolor: 'background.default',
      }}>
        <Outlet />
      </Box>
    </Box>
  );
}

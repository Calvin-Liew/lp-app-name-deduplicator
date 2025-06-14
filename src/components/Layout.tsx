import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Box,
  Divider,
  Switch,
  Tooltip,
  Avatar,
  Badge,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Apps as AppsIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Logout as LogoutIcon,
  Brightness4 as Brightness4Icon,
  Brightness7 as Brightness7Icon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const drawerWidth = 240;

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { text: 'All Apps', icon: <AppsIcon />, path: '/apps' },
  { text: 'Cluster Verification', icon: <PendingIcon />, path: '/unconfirmed' },
  { text: 'Confirmed Apps', icon: <CheckCircleIcon />, path: '/confirmed' },
  { text: 'Admin Upload', icon: <AppsIcon />, path: '/admin/upload' },
];

const Layout: React.FC<{
  children: React.ReactNode;
  mode: 'light' | 'dark';
  toggleDarkMode: () => void;
}> = ({ children, mode, toggleDarkMode }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigation = (path: string) => {
    navigate(path);
    setDrawerOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: 'background.default' }}>
      <AppBar position="fixed" color="default"
        sx={{ 
          zIndex: 1301, 
          backgroundColor: (theme) =>
            theme.palette.mode === 'dark'
              ? `${theme.palette.background.default} !important`
              : theme.palette.primary.main,
          color: (theme) =>
            theme.palette.mode === 'dark'
              ? theme.palette.text.primary
              : '#fff',
          boxShadow: (theme) =>
            theme.palette.mode === 'dark'
              ? '0 2px 8px rgba(0,0,0,0.7)'
              : undefined,
          borderBottom: (theme) =>
            theme.palette.mode === 'dark'
              ? '1px solid #23272f'
              : undefined,
        }}>
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setDrawerOpen(true)}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontWeight: 700 }}>
            LP App Name Deduplicator
          </Typography>
          <Tooltip title={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
            <IconButton color="inherit" onClick={toggleDarkMode} sx={{ mr: 2 }}>
              {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>
          </Tooltip>
          {user && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'secondary.main', width: 32, height: 32 }}>
                {user.name?.[0]?.toUpperCase() || '?'}
              </Avatar>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>{user.name}</Typography>
            </Box>
          )}
          <IconButton color="inherit" onClick={handleLogout} sx={{ ml: 2 }}>
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        variant="temporary"
        sx={{
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            background: 'linear-gradient(135deg, #444492 60%, #6a6ad1 100%)',
            color: '#fff',
          },
        }}
      >
        <Toolbar />
        <Divider />
        <List>
          {menuItems.map((item) => (
            <ListItem
              button
              key={item.text}
              selected={location.pathname === item.path}
              onClick={() => handleNavigation(item.path)}
              sx={{
                borderRadius: 2,
                mb: 1,
                backgroundColor: location.pathname === item.path
                  ? (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.08)'
                  : 'inherit',
                '&:hover': {
                  backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.15)',
                  color: (theme) => theme.palette.mode === 'dark' ? '#e0e0e0' : '#222',
                },
                color: (theme) => theme.palette.mode === 'dark' ? '#e0e0e0' : '#fff',
              }}
            >
              <ListItemIcon sx={{ color: (theme) => theme.palette.mode === 'dark' ? '#e0e0e0' : '#fff' }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItem>
          ))}
        </List>
      </Drawer>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 1, sm: 3 },
          mt: 8,
          minHeight: '100vh',
          backgroundColor: 'background.default',
          transition: 'background 0.3s',
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default Layout; 
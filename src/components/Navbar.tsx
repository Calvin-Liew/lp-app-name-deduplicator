import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  useTheme,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  List as ListIcon,
  CheckCircle as CheckCircleIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const theme = useTheme();

  if (!user) return null;

  const navItems = [
    { path: '/', label: 'Dashboard', icon: <DashboardIcon /> },
    { path: '/apps', label: 'All Apps', icon: <ListIcon /> },
    { path: '/unconfirmed', label: 'Unconfirmed', icon: <CloseIcon /> },
    { path: '/confirmed', label: 'Confirmed', icon: <CheckCircleIcon /> },
  ];

  return (
    <AppBar position="static" color="default" elevation={1}>
      <Toolbar>
        <Typography
          variant="h6"
          component="div"
          sx={{ flexGrow: 1, color: theme.palette.primary.main, fontWeight: 'bold' }}
        >
          App Name Deduplicator
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {navItems.map((item) => (
            <Button
              key={item.path}
              startIcon={item.icon}
              onClick={() => navigate(item.path)}
              color={location.pathname === item.path ? 'primary' : 'inherit'}
              sx={{
                fontWeight: location.pathname === item.path ? 'bold' : 'normal',
                '&:hover': {
                  backgroundColor: 'rgba(107, 122, 255, 0.08)',
                },
              }}
            >
              {item.label}
            </Button>
          ))}
          <Button
            color="inherit"
            onClick={logout}
            sx={{
              ml: 2,
              '&:hover': {
                backgroundColor: 'rgba(255, 107, 0, 0.08)',
              },
            }}
          >
            Logout
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar; 
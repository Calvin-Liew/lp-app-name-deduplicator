import React, { useState, useCallback, useMemo } from 'react';
import {
  Container,
  Box,
  Typography,
  Button,
  Paper,
  List,
  ListItem,
  ListItemText,
  Radio,
  TextField,
  CircularProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Autocomplete,
  Tooltip,
  Card,
  CardContent,
  Chip,
  useTheme,
  alpha,
  Menu,
  MenuItem,
  ListItemIcon,
  Popper,
  Grow,
  ClickAwayListener,
  AppBar,
  Toolbar,
  Drawer,
  Divider,
  Badge,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import Fuse from 'fuse.js';
import * as XLSX from 'xlsx';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import DownloadIcon from '@mui/icons-material/Download';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ArrowRightAltIcon from '@mui/icons-material/ArrowRightAlt';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ListAltIcon from '@mui/icons-material/ListAlt';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import AppList from './components/AppList';
import UnconfirmedApps from './components/UnconfirmedApps';
import ConfirmedApps from './components/ConfirmedApps';
import AdminUpload from './components/AdminUpload';
import ClusterVerification from './components/ClusterVerification';
import Layout from './components/Layout';
import { UserStatsProvider } from './contexts/UserStatsContext';
import PrivateRoute from './components/PrivateRoute';
import Navbar from './components/Navbar';
import theme from './theme';

interface AppCluster {
  canonicalName: string;
  variants: string[];
}

const Input = styled('input')({
  display: 'none',
});

const DraggableListItem = styled(ListItem)(({ theme }) => ({
  cursor: 'move',
  borderRadius: theme.shape.borderRadius,
  margin: '4px 0',
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.08),
    transform: 'translateX(4px)',
  },
}));

const ClusterCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  borderRadius: theme.shape.borderRadius * 2,
  boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.1)}`,
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    boxShadow: `0 6px 24px ${alpha(theme.palette.primary.main, 0.15)}`,
  },
}));

const ActionButton = styled(Button)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius * 2,
  padding: '8px 24px',
  textTransform: 'none',
  fontWeight: 600,
  boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`,
  '&:hover': {
    boxShadow: `0 6px 16px ${alpha(theme.palette.primary.main, 0.3)}`,
  },
}));

const StyledPopper = styled(Popper)(({ theme }) => ({
  zIndex: 1300,
  '& .MuiPaper-root': {
    marginTop: theme.spacing(1),
    borderRadius: theme.shape.borderRadius * 2,
    boxShadow: `0 4px 20px ${alpha('#444492', 0.15)}`,
    minWidth: 300,
  },
}));

const drawerWidth = 240;

const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })<{
  open?: boolean;
}>(({ theme, open }) => ({
  flexGrow: 1,
  padding: theme.spacing(3),
  transition: theme.transitions.create('margin', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  marginLeft: `-${drawerWidth}px`,
  ...(open && {
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
    marginLeft: 0,
  }),
}));

const AppBarStyled = styled(AppBar)(({ theme }) => ({
  backgroundColor: '#444492',
  boxShadow: `0 4px 20px ${alpha('#444492', 0.15)}`,
}));

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
  justifyContent: 'flex-end',
}));

const allowedAdminEmails = ['calvin.liew@sanofi.com', 'yuyou.wu@sanofi.com'];

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const normalizedEmail = user?.email?.trim().toLowerCase();
  const isAdmin = normalizedEmail && allowedAdminEmails.includes(normalizedEmail);
  if (!user || !isAdmin) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h4" color="error">Access Denied</Typography>
        <Typography>You do not have permission to view this page.</Typography>
        {user && (
          <Typography variant="body2" sx={{ mt: 2 }}>
            Your email: <b>{user.email}</b>
          </Typography>
        )}
      </Box>
    );
  }
  return <>{children}</>;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <UserStatsProvider>
          <Router>
            <Navbar />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/"
                element={
                  <PrivateRoute>
                    <Dashboard />
                  </PrivateRoute>
                }
              />
              <Route
                path="/unconfirmed"
                element={
                  <PrivateRoute>
                    <ClusterVerification />
                  </PrivateRoute>
                }
              />
              <Route
                path="/confirmed"
                element={
                  <PrivateRoute>
                    <AppList type="confirmed" />
                  </PrivateRoute>
                }
              />
              <Route
                path="/apps"
                element={
                  <PrivateRoute>
                    <AppList type="all" />
                  </PrivateRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </UserStatsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App; 
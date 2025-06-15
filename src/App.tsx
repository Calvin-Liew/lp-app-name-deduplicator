import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import AppList from './components/AppList';
import ClusterVerification from './components/ClusterVerification';
import AdminUpload from './components/AdminUpload';
import { UserStatsProvider } from './contexts/UserStatsContext';
import PrivateRoute from './components/PrivateRoute';
import Navbar from './components/Navbar';
import theme from './theme';
import { useAuth } from './contexts/AuthContext';
import { Box } from '@mui/material';

const App: React.FC = () => {
  const { user } = useAuth();

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <UserStatsProvider>
        <Router>
          <Navbar />
          <Box sx={{ p: 3, mt: 8 }}>
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
                path="/apps"
                element={
                  <PrivateRoute>
                    <AppList type="all" />
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
                path="/admin"
                element={
                  <PrivateRoute>
                    {user?.role === 'admin' ? (
                      <AdminUpload />
                    ) : (
                      <Navigate to="/" replace />
                    )}
                  </PrivateRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Box>
        </Router>
      </UserStatsProvider>
    </ThemeProvider>
  );
};

export default App; 
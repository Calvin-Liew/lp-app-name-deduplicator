import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Container,
  Alert,
  Tabs,
  Tab,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import config from '../config';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`auth-tabpanel-${index}`}
      aria-labelledby={`auth-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const Login: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setError('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError('Invalid credentials');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await axios.post(`${config.apiUrl}/api/users/register`, {
        name,
        email,
        password,
      });
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Paper
          elevation={6}
          sx={{
            width: '100%',
            textAlign: 'center',
            borderRadius: 3,
            p: { xs: 2, sm: 4 },
            boxShadow: '0 8px 32px rgba(68,68,146,0.15)',
          }}
        >
          <Typography variant="h4" component="h1" gutterBottom sx={{ pt: 3, fontWeight: 700 }}>
            License Patrol Matcha
          </Typography>

          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            centered
            sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
          >
            <Tab label="Login" />
            <Tab label="Register" />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            <form onSubmit={handleLogin}>
              <TextField
                fullWidth
                label="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                margin="normal"
                required
                variant="outlined"
              />
              <TextField
                fullWidth
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                margin="normal"
                required
                variant="outlined"
              />
              {error && (
                <Typography color="error" sx={{ mt: 2 }}>
                  {error}
                </Typography>
              )}
              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                sx={{ mt: 3, borderRadius: 2, fontWeight: 600 }}
              >
                Login
              </Button>
            </form>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <form onSubmit={handleRegister}>
              <TextField
                fullWidth
                label="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                margin="normal"
                required
                variant="outlined"
              />
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                margin="normal"
                required
                variant="outlined"
              />
              <TextField
                fullWidth
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                margin="normal"
                required
                variant="outlined"
              />
              {error && (
                <Typography color="error" sx={{ mt: 2 }}>
                  {error}
                </Typography>
              )}
              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                sx={{ mt: 3, borderRadius: 2, fontWeight: 600 }}
              >
                Register
              </Button>
            </form>
          </TabPanel>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login; 
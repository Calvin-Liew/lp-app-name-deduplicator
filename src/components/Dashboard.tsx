import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Card,
  CardContent,
  Grid,
  Badge,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  LinearProgress,
  Tooltip,
  Chip,
  Stack,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Apps as AppsIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Logout as LogoutIcon,
  LocalFireDepartment as FireIcon,
  EmojiEvents as TrophyIcon,
  Star as StarIcon,
  Bolt as BoltIcon,
  TrendingUp as TrendingUpIcon,
  Groups as GroupsIcon,
  Speed as SpeedIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { useUserStats } from '../contexts/UserStatsContext';
import config from '../config';

interface Stats {
  totalApps: number;
  unconfirmedApps: number;
  confirmedApps: number;
  pendingReviews: number;
  streak?: number;
  xp?: number;
  level?: number;
  achievements?: Achievement[];
  teamStats: TeamStats;
  personalConfirmedApps: number;
}

interface TeamStats {
  totalConfirmed: number;
  totalUsers: number;
  averageConfirmations: number;
  completionRate: number;
  teamAchievements: Achievement[];
  recentActivity: any[];
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress: number;
  total: number;
}

const Dashboard: React.FC = () => {
  const { stats, loading, refreshStats } = useUserStats();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { user, logout, token } = useAuth();
  const navigate = useNavigate();
  const [leaderboard, setLeaderboard] = useState<{ name: string; email: string; count: number; userId: string }[]>([]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await axios.get(`${config.apiUrl}/api/leaderboard`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setLeaderboard(response.data);
      } catch (error) {
        setLeaderboard([]);
      }
    };
    if (token) {
      fetchLeaderboard();
    }
  }, [token]);

  // Auto-refresh stats on mount and when window regains focus
  useEffect(() => {
    refreshStats();
    const handleFocus = () => refreshStats();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refreshStats]);

  const handleNavigation = (path: string) => {
    navigate(path);
    setDrawerOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    { text: 'All Apps', icon: <AppsIcon />, path: '/apps' },
    {
      text: 'Cluster Verification',
      icon: (
        <Badge badgeContent={stats.unconfirmedApps} color="error">
          <PendingIcon />
        </Badge>
      ),
      path: '/unconfirmed',
    },
    {
      text: 'Confirmed Apps',
      icon: <CheckCircleIcon />,
      path: '/confirmed',
    },
  ];

  const calculateLevelProgress = () => {
    if (!stats.level || !stats.xp) return 0;
    const xpForNextLevel = stats.level * 1000;
    return Math.min((stats.xp / xpForNextLevel) * 100, 100);
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed">
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setDrawerOpen(true)}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            LP App Name Deduplicator
          </Typography>
          <Typography variant="body1" sx={{ mr: 2 }}>
            {user?.name}
          </Typography>
          <IconButton color="inherit" onClick={handleLogout}>
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        <Box sx={{ width: 250 }}>
          <List>
            {menuItems.map((item) => (
              <ListItem
                button
                key={item.text}
                onClick={() => handleNavigation(item.path)}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          mt: 8,
          backgroundColor: 'background.default',
          minHeight: '100vh',
        }}
      >
        <Typography variant="h4" gutterBottom>
          Dashboard
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={4}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 3
                }
              }}
              onClick={() => navigate('/apps')}
            >
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Apps
                </Typography>
                <Typography variant="h4">{stats.totalApps || 0}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 3
                }
              }}
              onClick={() => navigate('/unconfirmed')}
            >
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Unconfirmed Apps
                </Typography>
                <Typography variant="h4">{stats.unconfirmedApps || 0}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 3
                }
              }}
              onClick={() => navigate('/confirmed')}
            >
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Confirmed Apps
                </Typography>
                <Typography variant="h4">{stats.confirmedApps || 0}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Your Progress
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body1">
                    Level {stats.level || 1} • {stats.xp || 0} XP
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={calculateLevelProgress()} 
                    sx={{ mt: 1 }}
                  />
                </Box>
                <Typography variant="body1">
                  Confirmation Streak: {stats.streak || 0}
                </Typography>
                <Typography variant="body1">
                  Confirmed by You: {stats.personalConfirmedApps || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Team Stats
                </Typography>
                <Typography variant="body1">
                  Team Size: {stats.teamStats?.teamSize || 0}
                </Typography>
                <Typography variant="body1">
                  Total Confirmed: {stats.teamStats?.totalConfirmed || 0}
                </Typography>
                <Typography variant="body1">
                  Total Unconfirmed: {stats.teamStats?.totalUnconfirmed || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {stats.achievements && stats.achievements.length > 0 && (
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Achievements
              </Typography>
              <Grid container spacing={2}>
                {stats.achievements.map((achievement: any) => (
                  <Grid item xs={12} sm={6} md={4} key={achievement.id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle1">
                          {achievement.name}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Unlocked: {new Date(achievement.unlockedAt).toLocaleDateString()}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        )}

        {/* Leaderboard Card */}
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom color="text.primary" sx={{ fontWeight: 700 }}>
              Leaderboard
            </Typography>
            <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>#</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>User</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Confirmed Apps</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Array.isArray(leaderboard) && leaderboard.map((row, idx) => {
                    let rankStyle = {};
                    let rankIcon = null;
                    if (idx === 0) {
                      rankStyle = { color: '#FFD700', fontWeight: 'bold', fontSize: 32 };
                      rankIcon = '🥇';
                    } else if (idx === 1) {
                      rankStyle = { color: '#C0C0C0', fontWeight: 'bold', fontSize: 28 };
                      rankIcon = '🥈';
                    } else if (idx === 2) {
                      rankStyle = { color: '#CD7F32', fontWeight: 'bold', fontSize: 24 };
                      rankIcon = '🥉';
                    } else {
                      rankStyle = { color: '#888', fontWeight: 'bold', fontSize: 20 };
                    }
                    return (
                      <TableRow key={row.userId}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <span style={rankStyle}>{rankIcon || idx + 1}</span>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar sx={{ width: 28, height: 28, bgcolor: 'primary.main' }}>{row.name[0]}</Avatar>
                            <Typography variant="body2" color="text.primary">{row.name}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.primary">{row.count}</Typography>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {(!Array.isArray(leaderboard) || leaderboard.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={3} align="center">
                        <Typography variant="body2" color="text.secondary">No confirmed apps yet.</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default Dashboard; 
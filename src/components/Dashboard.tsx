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
  Whatshot as FireIconAlt,
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
    const currentLevel = stats.level || 1;
    const xpForNextLevel = currentLevel * 100;
    const currentXp = stats.xp || 0;
    const xpInCurrentLevel = currentXp % 100;
    return (xpInCurrentLevel / 100) * 100;
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
            License Patrol Matcha
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

        <Box sx={{ p: 3, bgcolor: 'background.default' }}>
          {/* User Progress Section */}
          <Card sx={{ 
            mb: 3, 
            background: 'linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)', 
            color: 'white',
            boxShadow: '0 4px 20px rgba(46, 125, 50, 0.2)'
          }}>
            <CardContent>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Avatar 
                      sx={{ 
                        width: 64, 
                        height: 64, 
                        bgcolor: '#4CAF50',
                        border: '3px solid white',
                        boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)'
                      }}
                    >
                      {user?.name?.[0]?.toUpperCase()}
                    </Avatar>
                    <Box>
                      <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                        {user?.name}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        Level {stats.level || 1} • {stats.xp || 0} XP
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <Chip
                      icon={<FireIcon sx={{ color: 'white', fontSize: 20 }} />}
                      label={`${stats.streak} Day Streak`}
                      sx={{
                        bgcolor: 'rgba(255, 255, 255, 0.2)',
                        color: 'white',
                        '& .MuiChip-icon': {
                          color: 'white'
                        }
                      }}
                    />
                    <Chip
                      icon={<CheckCircleIcon sx={{ color: 'white', fontSize: 20 }} />}
                      label={`${stats.personalConfirmedApps || 0} Confirmed by You`}
                      sx={{
                        bgcolor: 'rgba(255, 255, 255, 0.2)',
                        color: 'white',
                        '& .MuiChip-icon': {
                          color: 'white'
                        }
                      }}
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ mb: 1, opacity: 0.9 }}>
                      Progress to Level {stats.level ? stats.level + 1 : 2}
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={calculateLevelProgress()} 
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        bgcolor: 'rgba(255, 255, 255, 0.2)',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: 'white'
                        }
                      }}
                    />
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Stats Grid */}
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={4}>
              <Card sx={{ 
                bgcolor: '#E8F5E9',
                border: '1px solid #C8E6C9',
                '&:hover': {
                  boxShadow: '0 4px 20px rgba(46, 125, 50, 0.1)'
                }
              }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: '#4CAF50', width: 48, height: 48 }}>
                      <AppsIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" color="primary">
                        {stats.totalApps}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Apps
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Card sx={{ 
                bgcolor: '#E8F5E9',
                border: '1px solid #C8E6C9',
                '&:hover': {
                  boxShadow: '0 4px 20px rgba(46, 125, 50, 0.1)'
                }
              }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: '#4CAF50', width: 48, height: 48 }}>
                      <CheckCircleIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" color="primary">
                        {stats.confirmedApps}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Confirmed Apps
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Card sx={{ 
                bgcolor: '#E8F5E9',
                border: '1px solid #C8E6C9',
                '&:hover': {
                  boxShadow: '0 4px 20px rgba(46, 125, 50, 0.1)'
                }
              }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: '#4CAF50', width: 48, height: 48 }}>
                      <PendingIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" color="primary">
                        {stats.unconfirmedApps}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Pending Review
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Team Stats */}
          <Card sx={{ mt: 3, mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <GroupsIcon color="primary" /> Team Stats
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <Typography variant="h4" color="primary">
                      {stats.teamStats?.teamSize || 0}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Team Members
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <Typography variant="h4" color="success.main">
                      {stats.teamStats?.totalConfirmed || 0}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Total Confirmed
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <Typography variant="h4" color="warning.main">
                      {stats.teamStats?.totalUnconfirmed || 0}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Total Unconfirmed
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Achievements Section */}
          {stats.achievements && stats.achievements.length > 0 && (
            <Card sx={{ mt: 3, mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TrophyIcon color="primary" /> Achievements
                </Typography>
                <Grid container spacing={2}>
                  {stats.achievements.map((achievement: any) => (
                    <Grid item xs={12} sm={6} md={4} key={achievement.id}>
                      <Card 
                        sx={{ 
                          bgcolor: 'success.light',
                          color: 'white',
                          transition: 'transform 0.2s',
                          '&:hover': {
                            transform: 'translateY(-4px)'
                          }
                        }}
                      >
                        <CardContent>
                          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                            {achievement.name}
                          </Typography>
                          <Typography variant="body2" sx={{ opacity: 0.9 }}>
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
        </Box>

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
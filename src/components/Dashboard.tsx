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

        <Box sx={{ p: 3, bgcolor: 'background.default' }}>
          {/* User Progress Section */}
          <Card sx={{ 
            mb: 3, 
            background: 'linear-gradient(135deg, #6B7AFF 0%, #8B9AFF 100%)', 
            color: 'white',
            boxShadow: '0 4px 20px rgba(107, 122, 255, 0.2)'
          }}>
            <CardContent>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Avatar 
                      sx={{ 
                        width: 64, 
                        height: 64, 
                        bgcolor: '#8B9AFF',
                        border: '3px solid white',
                        boxShadow: '0 4px 12px rgba(139, 154, 255, 0.3)'
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
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Tooltip title="Current Streak">
                      <Chip
                        icon={<FireIconAlt sx={{ color: '#FF6B00' }} />}
                        label={`${stats.streak || 0} Confirmation Streak`}
                        sx={{ 
                          bgcolor: 'rgba(255,255,255,0.25)', 
                          color: 'white',
                          '& .MuiChip-label': { fontWeight: 600 }
                        }}
                      />
                    </Tooltip>
                    <Tooltip title="Total Confirmations">
                      <Chip
                        icon={<CheckCircleIcon sx={{ color: '#00C853' }} />}
                        label={`${stats.personalConfirmedApps || 0} Confirmed by You`}
                        sx={{ 
                          bgcolor: 'rgba(255,255,255,0.25)', 
                          color: 'white',
                          '& .MuiChip-label': { fontWeight: 600 }
                        }}
                      />
                    </Tooltip>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2" sx={{ mb: 0.5, opacity: 0.9 }}>
                      Progress to Level {(stats.level || 1) + 1}
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={calculateLevelProgress()} 
                      sx={{ 
                        height: 10, 
                        borderRadius: 5,
                        bgcolor: 'rgba(255,255,255,0.25)',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: 'white',
                          boxShadow: '0 0 10px rgba(255,255,255,0.5)'
                        }
                      }} 
                    />
                    <Typography variant="caption" sx={{ mt: 0.5, display: 'block', opacity: 0.9 }}>
                      {Math.round(calculateLevelProgress())}% Complete
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Stats Cards */}
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
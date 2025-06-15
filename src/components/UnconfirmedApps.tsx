import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Chip,
  Grid,
} from '@mui/material';
import {
  Check as CheckIcon,
  Close as CloseIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import config from '../config';

interface Cluster {
  _id: string;
  name: string;
  canonicalName: string;
  description?: string;
  status?: string;
  createdBy?: string;
}

interface App {
  _id: string;
  name: string;
  canonicalName?: string;
  cluster?: Cluster;
  status: string;
  confirmed: boolean;
  addedBy?: string;
  confirmedBy?: string;
  createdAt: string;
  updatedAt: string;
}

const UnconfirmedApps: React.FC = () => {
  const [apps, setApps] = useState<App[]>([]);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [clusterFilter, setClusterFilter] = useState<string>('');
  const [selectedApp, setSelectedApp] = useState<App | null>(null);
  const [selectedCluster, setSelectedCluster] = useState<Cluster | null>(null);
  const [canonicalName, setCanonicalName] = useState('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    fetchApps();
    fetchClusters();
    const interval = setInterval(() => {
      fetchApps();
    }, 10000); // auto-refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchApps = async () => {
    try {
      const response = await axios.get(`${config.apiUrl}/api/apps/unconfirmed`);
      setApps(response.data);
    } catch (error) {
      console.error('Error fetching apps:', error);
    }
  };

  const fetchClusters = async () => {
    try {
      const response = await axios.get(`${config.apiUrl}/api/clusters`);
      setClusters(response.data);
    } catch (error) {
      console.error('Error fetching clusters:', error);
    }
  };

  const handleConfirm = async (appId: string) => {
    try {
      await axios.patch(`${config.apiUrl}/api/apps/${appId}/confirm`);
      await fetchApps();
    } catch (error) {
      console.error('Error confirming app:', error);
    }
  };

  const handleReject = async (appId: string) => {
    try {
      await axios.delete(`${config.apiUrl}/api/apps/${appId}`);
      await fetchApps();
    } catch (error) {
      console.error('Error rejecting app:', error);
    }
  };

  const handleUpdate = async () => {
    if (!selectedApp || !selectedCluster) return;
    try {
      await axios.patch(`${config.apiUrl}/api/apps/${selectedApp._id}`, {
        canonicalName,
        cluster: selectedCluster._id,
      });
      setEditDialogOpen(false);
      await fetchApps();
    } catch (error) {
      console.error('Error updating app:', error);
    }
  };

  const filteredApps = apps.filter(app => {
    const matchesSearch = app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.canonicalName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.cluster?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCluster = !clusterFilter || app.cluster?._id === clusterFilter;
    return matchesSearch && matchesCluster;
  });

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom color="text.primary">
        Unconfirmed Apps
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Filter by Cluster</InputLabel>
            <Select
              value={clusterFilter}
              label="Filter by Cluster"
              onChange={(e) => setClusterFilter(e.target.value)}
            >
              <MenuItem value="">All Clusters</MenuItem>
              {clusters.map((cluster) => (
                <MenuItem key={cluster._id} value={cluster._id}>
                  {cluster.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      <Paper sx={{ bgcolor: 'background.paper', p: 2 }}>
        <List>
          {filteredApps.map((app) => (
            <ListItem
              key={app._id}
              secondaryAction={
                <Box>
                  <IconButton
                    edge="end"
                    aria-label="edit"
                    onClick={() => {
                      setSelectedApp(app);
                      setSelectedCluster(app.cluster || null);
                      setCanonicalName(app.canonicalName || '');
                      setEditDialogOpen(true);
                    }}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    edge="end"
                    aria-label="confirm"
                    onClick={() => handleConfirm(app._id)}
                  >
                    <CheckIcon />
                  </IconButton>
                  <IconButton
                    edge="end"
                    aria-label="reject"
                    onClick={() => handleReject(app._id)}
                  >
                    <CloseIcon />
                  </IconButton>
                </Box>
              }
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                mb: 1,
                bgcolor: 'background.paper',
                '&:hover': {
                  backgroundColor: 'action.hover',
                },
              }}
            >
              <ListItemText
                primary={<Typography color="text.primary">{app.name}</Typography>}
                secondary={
                  <Box>
                    <Chip
                      label={app.cluster?.name}
                      size="small"
                      sx={{ mr: 1 }}
                      color="primary"
                    />
                    <Typography variant="body2" component="span" color="text.secondary">
                      Canonical Name: {app.canonicalName}
                    </Typography>
                    {app.confirmed && app.confirmedBy && (
                      <Typography variant="body2" component="span" color="success.main" sx={{ ml: 1 }}>
                        Confirmed by {
                          user && (
                            (typeof app.confirmedBy === 'string' && app.confirmedBy === user._id) ||
                            (typeof app.confirmedBy === 'object' && app.confirmedBy !== null && typeof (app.confirmedBy as any)._id === 'string' && (app.confirmedBy as any)._id === user._id)
                          )
                            ? 'you'
                            : (typeof app.confirmedBy === 'object' && app.confirmedBy !== null && 'name' in app.confirmedBy)
                              ? (app.confirmedBy as any).name
                              : 'user'
                        }
                      </Typography>
                    )}
                  </Box>
                }
              />
            </ListItem>
          ))}
        </List>
      </Paper>

      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}
        PaperProps={{ sx: { borderRadius: 3, p: 2, minWidth: 400, maxWidth: 480 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: 22 }}>Edit App</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Cluster</InputLabel>
              <Select
                value={selectedCluster?._id || ''}
                label="Cluster"
                onChange={(e) => {
                  const cluster = clusters.find(c => c._id === e.target.value);
                  if (cluster) setSelectedCluster(cluster);
                }}
                sx={{ minWidth: 400, maxWidth: 480 }}
              >
                {clusters.map((cluster) => (
                  <MenuItem key={cluster._id} value={cluster._id}>
                    {cluster.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Canonical Name"
              value={canonicalName}
              onChange={(e) => setCanonicalName(e.target.value)}
              sx={{ mb: 2 }}
              variant="outlined"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ pb: 2, pr: 3 }}>
          <Button onClick={() => setEditDialogOpen(false)} variant="outlined" color="error">Cancel</Button>
          <Button onClick={handleUpdate} variant="contained" color="primary">
            Update
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UnconfirmedApps; 
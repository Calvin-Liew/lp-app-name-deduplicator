import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Autocomplete,
  Chip,
  Popper,
  Card,
  CardContent,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Close as CloseIcon,
  Edit as EditIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useUserStats } from '../contexts/UserStatsContext';
import config from '../config';

interface AppListProps {
  type?: 'all' | 'confirmed' | 'unconfirmed';
  confirmed?: boolean;
}

interface App {
  _id: string;
  name: string;
  canonicalName: string;
  cluster: {
    _id: string;
    name: string;
    canonicalName: string;
    confirmationRatio: number;
  } | null;
  confirmed: boolean;
  createdBy: {
    name: string;
  };
  confirmedBy?: {
    name: string;
  };
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

interface Cluster {
  _id: string;
  name: string;
  canonicalName: string;
  confirmationRatio: number;
}

const AppList: React.FC<AppListProps> = ({ type = 'all', confirmed }) => {
  const [apps, setApps] = useState<App[]>([]);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedApp, setSelectedApp] = useState<App | null>(null);
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [selectedCluster, setSelectedCluster] = useState<Cluster | null>(null);
  const { token, user } = useAuth();
  const { refreshStats } = useUserStats();

  useEffect(() => {
    if (token) {
      fetchApps();
      fetchClusters();
    }
  }, [token, type, confirmed]);

  const fetchApps = async () => {
    try {
      let url = `${config.apiUrl}/api/apps`;
      if (type === 'confirmed' || confirmed) {
        url = `${config.apiUrl}/api/apps/confirmed`;
      } else if (type === 'unconfirmed') {
        url = `${config.apiUrl}/api/apps/unconfirmed`;
      }
      
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setApps(response.data);
    } catch (error) {
      console.error('Error fetching apps:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClusters = async () => {
    try {
      console.log('Fetching clusters with token:', token);
      const response = await axios.get(`${config.apiUrl}/api/clusters`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      console.log('Clusters response:', response.data);
      setClusters(response.data);
    } catch (error) {
      console.error('Error fetching clusters:', error);
    }
  };

  const handleMoveApp = async () => {
    if (!selectedApp || !selectedCluster) return;

    try {
      await axios.patch(`${config.apiUrl}/api/apps/${selectedApp._id}`, {
        cluster: selectedCluster._id,
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      fetchApps();
      setMoveDialogOpen(false);
      setSelectedApp(null);
      setSelectedCluster(null);
    } catch (error) {
      console.error('Error moving app:', error);
    }
  };

  const handleConfirmApp = async (appId: string) => {
    try {
      const response = await axios.patch(
        `${config.apiUrl}/api/apps/${appId}/confirm`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      const { cluster, user } = response.data;
      fetchApps();
      refreshStats();
    } catch (error) {
      console.error('Error confirming app:', error);
    }
  };

  const filteredApps = apps.filter(app =>
    app.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <Box sx={{ p: 3 }}><Typography>Loading...</Typography></Box>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 2, mb: 2, bgcolor: 'background.paper' }}>
        <Typography variant="h6" gutterBottom color="text.primary">
          {type === 'confirmed' || confirmed ? 'Confirmed Apps' : 
           type === 'unconfirmed' ? 'Unconfirmed Apps' : 'All Apps'}
        </Typography>
        <TextField
          fullWidth
          label="Search Apps"
          variant="outlined"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ mb: 2 }}
        />
        <List>
          {filteredApps.map((app) => (
            <Card key={app._id} sx={{ mb: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h6">{app.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Cluster: {app.cluster?.name || 'Unassigned'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Added by: {app.createdBy?.name} on {new Date(app.createdAt).toLocaleDateString()}
                    </Typography>
                    {app.confirmedBy && (
                      <Typography variant="body2" color="success.main">
                        Confirmed by: {app.confirmedBy.name}
                      </Typography>
                    )}
                  </Box>
                  <Box>
                    {!app.confirmed && (
                      <IconButton
                        color="primary"
                        onClick={() => handleConfirmApp(app._id)}
                        title="Confirm App"
                      >
                        <CheckCircleIcon />
                      </IconButton>
                    )}
                    {app.confirmed && (
                      <Chip
                        icon={<CheckCircleIcon />}
                        label="Confirmed"
                        color="success"
                        sx={{ ml: 1 }}
                      />
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </List>
      </Paper>

      <Dialog open={moveDialogOpen} onClose={() => setMoveDialogOpen(false)}
        PaperProps={{ sx: { borderRadius: 3, p: 2, minWidth: 400, maxWidth: 480 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: 22 }}>Move App to Cluster</DialogTitle>
        <DialogContent>
          <Autocomplete
            options={clusters}
            getOptionLabel={(option) => `${option.name} (${(option.confirmationRatio * 100).toFixed(0)}% Confirmed)`}
            value={selectedCluster}
            onChange={(_, newValue) => setSelectedCluster(newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Select Cluster"
                variant="outlined"
                fullWidth
                sx={{ mt: 2 }}
              />
            )}
            renderOption={(props, option) => (
              <li {...props}>
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <Box sx={{ flexGrow: 1 }}>{option.name}</Box>
                  <Chip
                    label={`${(option.confirmationRatio * 100).toFixed(0)}% Confirmed`}
                    size="small"
                    color="primary"
                    sx={{ ml: 2, fontWeight: 'bold', fontSize: 16 }}
                  />
                </Box>
              </li>
            )}
            PopperComponent={(props) => (
              <Popper {...props} style={{ minWidth: 400, width: 480 }} placement="bottom-start" />
            )}
          />
        </DialogContent>
        <DialogActions sx={{ pb: 2, pr: 3 }}>
          <Button onClick={() => setMoveDialogOpen(false)} variant="outlined" color="error">Cancel</Button>
          <Button onClick={handleMoveApp} variant="contained" color="primary">
            Move
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AppList; 
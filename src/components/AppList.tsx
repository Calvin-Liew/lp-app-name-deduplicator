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
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import config from '../config';

interface App {
  _id: string;
  name: string;
  canonicalName: string;
  cluster: {
    _id: string;
    name: string;
    canonicalName: string;
    confirmationRatio: number;
  };
  confirmed: boolean;
  confirmedBy?: string;
  createdAt: string;
  updatedAt: string;
}

interface Cluster {
  _id: string;
  name: string;
  canonicalName: string;
  confirmationRatio: number;
}

interface AppListProps {
  type: 'all' | 'confirmed' | 'unconfirmed';
}

const AppList: React.FC<AppListProps> = ({ type }) => {
  const [apps, setApps] = useState<App[]>([]);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedApp, setSelectedApp] = useState<App | null>(null);
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [selectedCluster, setSelectedCluster] = useState<Cluster | null>(null);
  const { token } = useAuth();

  useEffect(() => {
    if (token) {
      fetchApps();
      fetchClusters();
    }
  }, [type, token]);

  const fetchApps = async () => {
    try {
      let url = `${config.apiUrl}/api/apps`;
      if (type === 'confirmed') {
        url += '?confirmed=true';
      } else if (type === 'unconfirmed') {
        url += '?confirmed=false';
      }
      console.log('Fetching apps with URL:', url);
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      console.log('Apps response:', response.data);
      setApps(response.data);
    } catch (error) {
      console.error('Error fetching apps:', error);
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
      await axios.patch(`${config.apiUrl}/api/apps/${appId}/confirm`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      fetchApps();
    } catch (error) {
      console.error('Error confirming app:', error);
    }
  };

  const filteredApps = apps.filter((app) =>
    app.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 2, mb: 2, bgcolor: 'background.paper' }}>
        <Typography variant="h6" gutterBottom color="text.primary">
          {type === 'confirmed' ? 'Confirmed Apps' : type === 'unconfirmed' ? 'Unconfirmed Apps' : 'All Apps'}
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
            <ListItem
              key={app._id}
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
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                      label={app.cluster?.name || 'No Cluster'}
                      size="small"
                      color={app.cluster ? 'primary' : 'default'}
                    />
                    {app.confirmed ? (
                      <CheckCircleIcon color="success" fontSize="small" />
                    ) : (
                      <PendingIcon color="warning" fontSize="small" />
                    )}
                  </Box>
                }
              />
              {!app.confirmed && (
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    onClick={() => handleConfirmApp(app._id)}
                    sx={{ mr: 1 }}
                  >
                    <CheckCircleIcon color="primary" />
                  </IconButton>
                </ListItemSecondaryAction>
              )}
              <ListItemSecondaryAction>
                <IconButton
                  edge="end"
                  onClick={() => {
                    setSelectedApp(app);
                    setMoveDialogOpen(true);
                  }}
                >
                  <MoreVertIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
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
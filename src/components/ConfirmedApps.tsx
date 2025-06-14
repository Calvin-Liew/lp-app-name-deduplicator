import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  TextField,
  Chip,
  Grid,
} from '@mui/material';
import axios from 'axios';

interface App {
  _id: string;
  name: string;
  canonicalName: string;
  cluster: {
    _id: string;
    name: string;
  };
  confirmedBy: {
    name: string;
  };
  confirmedAt: string;
}

const ConfirmedApps: React.FC = () => {
  const [apps, setApps] = useState<App[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [clusterFilter, setClusterFilter] = useState('');

  useEffect(() => {
    fetchConfirmedApps();
    const interval = setInterval(() => {
      fetchConfirmedApps();
    }, 10000); // auto-refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchConfirmedApps = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/apps/confirmed');
      setApps(response.data);
    } catch (error) {
      console.error('Error fetching confirmed apps:', error);
    }
  };

  const filteredApps = apps.filter((app) => {
    const matchesSearch = app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.canonicalName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCluster = !clusterFilter || app.cluster?.name === clusterFilter;
    return matchesSearch && matchesCluster;
  });

  const clusters = Array.from(new Set(apps.map(app => app.cluster?.name).filter(Boolean)));

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 2, mb: 2, bgcolor: 'background.paper' }}>
        <Typography variant="h6" gutterBottom color="text.primary">
          Confirmed Apps
        </Typography>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Search Apps"
              variant="outlined"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              select
              label="Filter by Cluster"
              variant="outlined"
              value={clusterFilter}
              onChange={(e) => setClusterFilter(e.target.value)}
              SelectProps={{
                native: true,
              }}
            >
              <option value="">All Clusters</option>
              {clusters.map((cluster) => (
                <option key={cluster} value={cluster}>
                  {cluster}
                </option>
              ))}
            </TextField>
          </Grid>
        </Grid>
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
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="subtitle1" color="text.primary">{app.name}</Typography>
                    <Chip
                      label={app.cluster?.name || 'No Cluster'}
                      size="small"
                      color="primary"
                    />
                  </Box>
                }
                secondary={
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Canonical Name: {app.canonicalName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Confirmed by: {app.confirmedBy.name} on{' '}
                      {new Date(app.confirmedAt).toLocaleDateString()}
                    </Typography>
                  </Box>
                }
              />
            </ListItem>
          ))}
        </List>
      </Paper>
    </Box>
  );
};

export default ConfirmedApps; 
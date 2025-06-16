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
  IconButton,
  Chip,
  Grid,
  Card,
  CardContent,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Checkbox,
  Tooltip,
  Autocomplete,
  ListSubheader,
  Popper,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Close as CloseIcon,
  Edit as EditIcon,
  Info as InfoIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  SwapHoriz as SwapHorizIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useUserStats } from '../contexts/UserStatsContext';
import config from '../config';

interface App {
  _id: string;
  name: string;
  canonicalName: string;
  cluster: {
    _id: string;
    name: string;
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
  canonicalName?: string;
  confirmationRatio: number;
}

const ClusterVerification: React.FC = () => {
  const [apps, setApps] = useState<App[]>([]);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [loadingApps, setLoadingApps] = useState(true);
  const [loadingClusters, setLoadingClusters] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCluster, setSelectedCluster] = useState<Cluster | null>(null);
  const [selectedApp, setSelectedApp] = useState<App | null>(null);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [note, setNote] = useState('');
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [moveTargetApp, setMoveTargetApp] = useState<App | null>(null);
  const [moveTargetClusterId, setMoveTargetClusterId] = useState<string>('');
  const [selectedApps, setSelectedApps] = useState<Set<string>>(new Set());
  const { token, user } = useAuth();
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState('');
  const { refreshStats } = useUserStats();

  useEffect(() => {
    if (token) {
      setLoadingApps(true);
      setLoadingClusters(true);
      fetchApps();
      fetchClusters();
    }
  }, [token]);

  const fetchApps = async () => {
    try {
      // Fetch all apps in the cluster, both confirmed and unconfirmed
      const response = await axios.get(`${config.apiUrl}/api/apps`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setApps(response.data);
    } catch (error) {
      console.error('Error fetching apps:', error);
    } finally {
      setLoadingApps(false);
    }
  };

  const fetchClusters = async () => {
    try {
      const response = await axios.get(`${config.apiUrl}/api/clusters`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      // Sort clusters by confirmationRatio (descending)
      const sortedClusters = response.data.sort((a: Cluster, b: Cluster) => b.confirmationRatio - a.confirmationRatio);
      setClusters(sortedClusters);
    } catch (error) {
      console.error('Error fetching clusters:', error);
    } finally {
      setLoadingClusters(false);
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
      setSnackbarMsg(
        `App confirmed in Cluster: ${cluster?.name || 'Unknown'}! +50 XP (Level ${user?.level})`
      );
      setSnackbarOpen(true);
      fetchApps();
      fetchClusters();
      refreshStats();
    } catch (error) {
      setSnackbarMsg('Error confirming app');
      setSnackbarOpen(true);
      console.error('Error confirming app:', error);
    }
  };

  const handleRemoveFromCluster = async (appId: string) => {
    try {
      await axios.patch(
        `${config.apiUrl}/api/apps/${appId}`,
        { cluster: null },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      fetchApps();
    } catch (error) {
      console.error('Error removing app from cluster:', error);
    }
  };

  const handleSetCanonical = async (appId: string) => {
    try {
      const app = apps.find(a => a._id === appId);
      if (!app) return;

      await axios.patch(
        `${config.apiUrl}/api/clusters/${app.cluster?._id}`,
        { canonicalName: app.name },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      fetchClusters();
    } catch (error) {
      console.error('Error setting canonical name:', error);
    }
  };

  const handleAddNote = async () => {
    if (!selectedApp) return;
    try {
      await axios.patch(
        `${config.apiUrl}/api/apps/${selectedApp._id}`,
        { notes: note },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      setNoteDialogOpen(false);
      setNote('');
      fetchApps();
    } catch (error) {
      console.error('Error adding note:', error);
    }
  };

  const handleMoveApp = async () => {
    if (!moveTargetApp || !moveTargetClusterId) return;
    try {
      await axios.patch(
        `${config.apiUrl}/api/apps/${moveTargetApp._id}`,
        { cluster: moveTargetClusterId },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      setMoveDialogOpen(false);
      setMoveTargetApp(null);
      setMoveTargetClusterId('');
      fetchApps();
    } catch (error) {
      console.error('Error moving app:', error);
    }
  };

  const handleSelectApp = (appId: string) => {
    setSelectedApps(prev => {
      const newSet = new Set(prev);
      if (newSet.has(appId)) {
        newSet.delete(appId);
      } else {
        newSet.add(appId);
      }
      return newSet;
    });
  };

  const handleSelectAllInCluster = (clusterId: string) => {
    const clusterApps = apps.filter(app => app.cluster?._id === clusterId && !app.confirmed);
    const allSelected = clusterApps.every(app => selectedApps.has(app._id));
    
    setSelectedApps(prev => {
      const newSet = new Set(prev);
      clusterApps.forEach(app => {
        if (allSelected) {
          newSet.delete(app._id);
        } else {
          newSet.add(app._id);
        }
      });
      return newSet;
    });
  };

  const handleBulkConfirm = async () => {
    try {
      const confirmPromises = Array.from(selectedApps).map(appId =>
        axios.patch(
          `${config.apiUrl}/api/apps/${appId}/confirm`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        )
      );

      await Promise.all(confirmPromises);
      setSnackbarMsg(`Successfully confirmed ${selectedApps.size} apps!`);
      setSnackbarOpen(true);
      setSelectedApps(new Set());
      fetchApps();
      fetchClusters();
      refreshStats();
    } catch (error) {
      console.error('Error confirming apps:', error);
      setSnackbarMsg('Error confirming apps');
      setSnackbarOpen(true);
    }
  };

  const filteredApps = apps.filter(app => {
    const matchesSearch = app.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCluster = !selectedCluster || app.cluster?._id === selectedCluster._id;
    return matchesSearch && matchesCluster;
  });

  const appsByCluster = filteredApps.reduce((acc, app) => {
    const clusterId = app.cluster?._id || 'unassigned';
    if (!acc[clusterId]) {
      acc[clusterId] = [];
    }
    acc[clusterId].push(app);
    return acc;
  }, {} as Record<string, App[]>);

  // Filter clusters to only those with unconfirmed apps
  const clustersWithUnconfirmedApps = clusters.filter(cluster =>
    apps.some(app => app.cluster?._id === cluster._id)
  );

  console.log('Rendering clusters:', clusters);
  console.log('appsByCluster:', appsByCluster);

  if (loadingApps || loadingClusters) {
    return <Box sx={{ p: 3 }}><Typography>Loading...</Typography></Box>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Cluster Verification
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Search Apps"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <Autocomplete
            options={clusters.filter((cluster): cluster is Cluster => !!cluster && typeof cluster._id === 'string')}
            getOptionLabel={(cluster) => `${cluster.name || 'No Cluster'} (${(cluster.confirmationRatio * 100).toFixed(0)}% confirmed)`}
            value={selectedCluster}
            onChange={(_, newValue) => setSelectedCluster(newValue)}
            renderInput={(params) => <TextField {...params} label="Filter by Cluster" />}
            renderOption={(props, cluster) => (
              <li {...props}>
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <Box sx={{ flexGrow: 1 }}>{cluster.name || 'No Cluster'}</Box>
                  <Chip
                    label={`${(cluster.confirmationRatio * 100).toFixed(0)}% Confirmed`}
                    size="small"
                    color="primary"
                    sx={{ ml: 2, fontWeight: 'bold', fontSize: 16 }}
                  />
                </Box>
              </li>
            )}
            PopperComponent={(props) => (
              <Popper {...props} style={{ minWidth: 350, width: 400 }} placement="bottom-start" />
            )}
          />
        </Grid>
      </Grid>

      {selectedApps.size > 0 && (
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleBulkConfirm}
            startIcon={<CheckCircleIcon />}
          >
            Confirm Selected ({selectedApps.size})
          </Button>
        </Box>
      )}

      {Object.entries(appsByCluster).map(([clusterId, clusterApps]) => {
        let cluster = clusters.find(c => c && c._id === clusterId);
        if (!cluster) {
          cluster = { _id: 'unassigned', name: 'Unassigned', canonicalName: '', confirmationRatio: 0 };
        }
        const displayName = cluster.name || 'Unassigned';
        const displayCanonical = cluster.canonicalName || '';

        // Separate confirmed and unconfirmed apps
        const confirmedApps = clusterApps.filter(app => app.confirmed);
        const unconfirmedApps = clusterApps.filter(app => !app.confirmed);

        return (
          <Card key={clusterId} sx={{ mb: 3, bgcolor: 'background.paper' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" color="text.primary">
                  {displayName}
                  {displayCanonical && (
                    <Chip
                      label={`Canonical: ${displayCanonical}`}
                      size="small"
                      color="primary"
                      sx={{ ml: 2 }}
                    />
                  )}
                  <Chip
                    label={`${(cluster.confirmationRatio * 100).toFixed(0)}% Confirmed`}
                    size="small"
                    color="secondary"
                    sx={{ ml: 2 }}
                  />
                </Typography>
                {unconfirmedApps.length > 0 && (
                  <Button
                    size="small"
                    onClick={() => handleSelectAllInCluster(clusterId)}
                    sx={{ ml: 'auto' }}
                  >
                    {unconfirmedApps.every(app => selectedApps.has(app._id)) ? 'Deselect All' : 'Select All'}
                  </Button>
                )}
              </Box>
              <List>
                {confirmedApps.length > 0 && (
                  <>
                    <ListSubheader component="div" disableSticky sx={{ mt: 2, mb: 1, color: 'text.primary', bgcolor: 'background.paper' }}>Confirmed Apps</ListSubheader>
                    {confirmedApps.map((app) => (
                      <ListItem
                        key={app._id}
                        sx={{
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 1,
                          mb: 1,
                          alignItems: 'flex-start',
                          bgcolor: 'background.paper',
                          '&:hover': {
                            backgroundColor: 'action.hover',
                          },
                        }}
                      >
                        <Box sx={{ flex: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle1" component="span" color="text.primary">{app.name}</Typography>
                            {app.confirmed && (
                              <Chip
                                label="Confirmed"
                                size="small"
                                color="success"
                                sx={{ ml: 1 }}
                              />
                            )}
                            {app.name === displayCanonical && !!displayCanonical && (
                              <StarIcon color="primary" />
                            )}
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
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="body2" color="text.secondary" component="span">
                              Added by: {app.createdBy && app.createdBy.name ? app.createdBy.name : 'Unknown'} on{' '}
                              {new Date(app.createdAt).toLocaleDateString()}
                            </Typography>
                            {app.notes && (
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }} component="span">
                                Note: {app.notes}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                        <Box>
                          <Tooltip title="Set as canonical name">
                            <span>
                              <IconButton
                                onClick={() => handleSetCanonical(app._id)}
                                disabled={!!displayCanonical && app.name === displayCanonical}
                              >
                                {app.name === displayCanonical && !!displayCanonical ? (
                                  <StarIcon color="primary" />
                                ) : (
                                  <StarBorderIcon />
                                )}
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip title="Add note">
                            <IconButton
                              onClick={() => {
                                setSelectedApp(app);
                                setNoteDialogOpen(true);
                              }}
                            >
                              <InfoIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Confirm app">
                            <IconButton onClick={() => handleConfirmApp(app._id)}>
                              <CheckCircleIcon color="primary" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Move to different cluster">
                            <IconButton
                              onClick={() => {
                                setMoveTargetApp(app);
                                setMoveTargetClusterId('');
                                setMoveDialogOpen(true);
                              }}
                            >
                              <SwapHorizIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </ListItem>
                    ))}
                  </>
                )}
                {unconfirmedApps.length > 0 && (
                  <>
                    <ListSubheader component="div" disableSticky sx={{ mt: 2, mb: 1, color: 'text.primary', bgcolor: 'background.paper' }}>Unconfirmed Apps</ListSubheader>
                    {unconfirmedApps.map((app) => (
                      <ListItem
                        key={app._id}
                        sx={{
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 1,
                          mb: 1,
                          alignItems: 'flex-start',
                          bgcolor: 'background.paper',
                          '&:hover': {
                            backgroundColor: 'action.hover',
                          },
                        }}
                      >
                        <Checkbox
                          checked={selectedApps.has(app._id)}
                          onChange={() => handleSelectApp(app._id)}
                          sx={{ mr: 1 }}
                        />
                        <Box sx={{ flex: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle1" component="span" color="text.primary">{app.name}</Typography>
                            {app.confirmed && (
                              <Chip
                                label="Confirmed"
                                size="small"
                                color="success"
                                sx={{ ml: 1 }}
                              />
                            )}
                            {app.name === displayCanonical && !!displayCanonical && (
                              <StarIcon color="primary" />
                            )}
                          </Box>
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="body2" color="text.secondary" component="span">
                              Added by: {app.createdBy && app.createdBy.name ? app.createdBy.name : 'Unknown'} on{' '}
                              {new Date(app.createdAt).toLocaleDateString()}
                            </Typography>
                            {app.notes && (
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }} component="span">
                                Note: {app.notes}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                        <Box>
                          <Tooltip title="Set as canonical name">
                            <span>
                              <IconButton
                                onClick={() => handleSetCanonical(app._id)}
                                disabled={!!displayCanonical && app.name === displayCanonical}
                              >
                                {app.name === displayCanonical && !!displayCanonical ? (
                                  <StarIcon color="primary" />
                                ) : (
                                  <StarBorderIcon />
                                )}
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip title="Add note">
                            <IconButton
                              onClick={() => {
                                setSelectedApp(app);
                                setNoteDialogOpen(true);
                              }}
                            >
                              <InfoIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Confirm app">
                            <IconButton onClick={() => handleConfirmApp(app._id)}>
                              <CheckCircleIcon color="primary" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Move to different cluster">
                            <IconButton
                              onClick={() => {
                                setMoveTargetApp(app);
                                setMoveTargetClusterId('');
                                setMoveDialogOpen(true);
                              }}
                            >
                              <SwapHorizIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </ListItem>
                    ))}
                  </>
                )}
              </List>
            </CardContent>
          </Card>
        );
      })}

      <Dialog open={noteDialogOpen} onClose={() => setNoteDialogOpen(false)}
        PaperProps={{ sx: { borderRadius: 3, p: 2, minWidth: 400, maxWidth: 480 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: 22 }}>Add Note</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            sx={{ mt: 2 }}
            variant="outlined"
          />
        </DialogContent>
        <DialogActions sx={{ pb: 2, pr: 3 }}>
          <Button onClick={() => setNoteDialogOpen(false)} variant="outlined" color="secondary">Cancel</Button>
          <Button onClick={handleAddNote} variant="contained" color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={moveDialogOpen} onClose={() => setMoveDialogOpen(false)}
        PaperProps={{ sx: { borderRadius: 3, p: 2, minWidth: 400, maxWidth: 480 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: 22 }}>Move App to Different Cluster</DialogTitle>
        <DialogContent>
          <Autocomplete
            options={clusters.filter(c => moveTargetApp && c._id !== moveTargetApp.cluster?._id)}
            getOptionLabel={option => `${option.name} (${(option.confirmationRatio * 100).toFixed(0)}% Confirmed)`}
            value={clusters.find(c => c._id === moveTargetClusterId) || null}
            onChange={(_, newValue) => setMoveTargetClusterId(newValue ? newValue._id : '')}
            renderInput={params => (
              <TextField {...params} label="Select Cluster" fullWidth sx={{ mt: 2 }} variant="outlined" />
            )}
            isOptionEqualToValue={(option, value) => option._id === value._id}
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
          <Button onClick={() => setMoveDialogOpen(false)} variant="outlined" color="secondary">Cancel</Button>
          <Button
            onClick={handleMoveApp}
            variant="contained"
            color="primary"
            disabled={!moveTargetClusterId}
          >
            Move
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity="success" sx={{ width: '100%' }}>
          {snackbarMsg}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ClusterVerification; 
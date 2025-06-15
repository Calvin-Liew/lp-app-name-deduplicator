import React, { useState } from 'react';
import { Box, Button, Typography, Paper, Alert } from '@mui/material';
import axios from 'axios';
import * as XLSX from 'xlsx';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DownloadIcon from '@mui/icons-material/Download';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import config from '../config';

const AdminUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setSuccess('');
      setError('');
    }
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
      setSuccess('');
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setSuccess('');
    setError('');
    const formData = new FormData();
    formData.append('file', file);
    try {
      await axios.post(`${config.apiUrl}/api/admin/upload-csv`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSuccess('CSV uploaded and ingested successfully!');
      setFile(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await axios.get(`${config.apiUrl}/api/admin/export-clusters`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = response.data;
      // Format for Excel: [{ Cluster: '...', 'App Names': 'a, b, c' }, ...]
      const rows = data.map((row: { cluster: string; apps: string[] }) => ({
        'Cluster': row.cluster,
        'App Names': row.apps.join(', ')
      }));
      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Clusters');
      XLSX.writeFile(workbook, 'clusters_export.xlsx');
    } catch (err: any) {
      console.error('Export error:', err);
      setError(err.response?.data?.error || 'Export failed');
    }
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 4 }, maxWidth: 700, mx: 'auto' }}>
      <Paper sx={{ p: { xs: 2, sm: 4 }, borderRadius: 4, boxShadow: 6 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, mb: 3, textAlign: 'center' }}>
          Admin Panel
        </Typography>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Upload App Names CSV
          </Typography>
          <Box
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            sx={{
              border: dragActive ? '2px dashed #1976d2' : '2px dashed #bdbdbd',
              borderRadius: 2,
              p: 3,
              mb: 2,
              textAlign: 'center',
              background: dragActive ? 'rgba(33,150,243,0.05)' : 'background.paper',
              transition: 'border 0.2s, background 0.2s',
              cursor: 'pointer',
            }}
            onClick={() => document.getElementById('admin-upload-input')?.click()}
          >
            <CloudUploadIcon sx={{ fontSize: 40, color: dragActive ? 'primary.main' : 'action.active', mb: 1 }} />
            <Typography variant="body1" color="text.secondary">
              Drag & drop a CSV file here, or <span style={{ color: '#1976d2', textDecoration: 'underline' }}>browse</span>
            </Typography>
            {file && (
              <Typography variant="body2" sx={{ mt: 1, color: 'primary.main', fontWeight: 500 }}>
                Selected: {file.name}
              </Typography>
            )}
            <input
              id="admin-upload-input"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </Box>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: { xs: 'center', sm: 'flex-start' } }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleUpload}
              disabled={!file || loading}
              startIcon={<CloudUploadIcon />}
              sx={{ minWidth: 140 }}
            >
              {loading ? 'Uploading...' : 'Upload'}
            </Button>
            <Button
              variant="contained"
              color="secondary"
              onClick={handleExport}
              startIcon={<DownloadIcon />}
              sx={{ minWidth: 180 }}
            >
              Export Clusters
            </Button>
          </Box>
          {success && (
            <Alert icon={<CheckCircleIcon fontSize="inherit" />} severity="success" sx={{ mt: 3, fontSize: 16, alignItems: 'center' }}>{success}</Alert>
          )}
          {error && (
            <Alert icon={<ErrorIcon fontSize="inherit" />} severity="error" sx={{ mt: 3, fontSize: 16, alignItems: 'center' }}>{error}</Alert>
          )}
        </Box>
        <Box sx={{ mt: 4, pt: 2, borderTop: '1px solid #eee' }}>
          <Typography variant="body2" color="text.secondary" align="center">
            Only clusters that are 100% confirmed will be included in the export.
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default AdminUpload; 
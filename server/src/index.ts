import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import morgan from 'morgan';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { auth } from './middleware/auth';
import userRoutes from './routes/users';
import appRoutes from './routes/apps';
import clusterRoutes from './routes/clusters';
import adminRoutes from './routes/admin';
import { AppName } from './models/AppName';
import { Cluster } from './models/Cluster';
import { User } from './models/User';
import { Request } from 'express';

// Load environment variables (only for local development)
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

// Debug logging (without sensitive data)
console.log('Environment:', process.env.NODE_ENV);
console.log('Port:', process.env.PORT);
console.log('MongoDB URI:', process.env.MONGODB_URI ? 'Set' : 'Not set');
console.log('Railway Project:', process.env.RAILWAY_PROJECT_NAME);
console.log('Railway Service:', process.env.RAILWAY_SERVICE_NAME);

// Debug all environment variables (excluding sensitive data)
console.log('Available environment variables:', Object.keys(process.env).filter(key => 
  !key.toLowerCase().includes('key') && 
  !key.toLowerCase().includes('secret') && 
  !key.toLowerCase().includes('password') &&
  !key.toLowerCase().includes('uri')
));

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use(helmet());

// Test endpoint - must be before any auth middleware
app.get('/api/test', (req, res) => {
  console.log('Test endpoint hit');
  res.status(200).json({ 
    status: 'ok', 
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
    mongoStatus: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Routes
app.use('/api/users', userRoutes);
app.use('/api/apps', auth, appRoutes);
app.use('/api/clusters', auth, clusterRoutes);
app.use('/api/admin', auth, adminRoutes);

// Start server first
console.log('Starting server...');
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log('Test endpoint available at /api/test');
});

// Then connect to MongoDB
console.log('Attempting to connect to MongoDB...');
if (!process.env.MONGODB_URI) {
  console.error('MONGODB_URI environment variable is not set!');
  // Don't exit, just log the error and continue
} else {
  const mongoUri = process.env.MONGODB_URI;
  // Log connection attempt (hiding credentials)
  console.log('Using MongoDB URI:', mongoUri.replace(/\/\/[^:]+:[^@]+@/, '//<credentials>@'));

  mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  })
    .then(() => {
      console.log('Connected to MongoDB successfully');
    })
    .catch((error) => {
      console.error('MongoDB connection error:', error);
      console.error('Connection details:', {
        uri: mongoUri.replace(/\/\/[^:]+:[^@]+@/, '//<credentials>@'),
        error: error.message,
        code: error.code,
        name: error.name
      });
      // Don't exit the process, just log the error
    });
}

// Handle process termination
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Closing server...');
  server.close(() => {
    console.log('Server closed');
    mongoose.connection.close().then(() => {
      console.log('MongoDB connection closed');
      process.exit(0);
    });
  });
});

interface AuthRequest extends Request {
  user?: {
    id: string;
  };
} 
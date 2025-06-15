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

// Load environment variables
dotenv.config();

const app = express();
✕ [stage-0  8/10] RUN --mount=type=cache,id=s/603c105e-6a78-4ca9-b748-c2c3553e9f43-node_modules/cache,target=/app/node_modules/.cache npm install && npm run build 
process "/bin/bash -ol pipefail -c npm install && npm run build" did not complete successfully: exit code: 1
 

Dockerfile:24

-------------------

22 |     # build phase

23 |     COPY . /app/.

24 | >>> RUN --mount=type=cache,id=s/603c105e-6a78-4ca9-b748-c2c3553e9f43-node_modules/cache,target=/app/node_modules/.cache npm install && npm run build

25 |

26 |

-------------------

ERROR: failed to solve: process "/bin/bash -ol pipefail -c npm install && npm run build" did not complete successfully: exit code: 1

Error: Docker build failedconst PORT = process.env.PORT || 3001;

// Log environment variables (without sensitive data)
console.log('Environment:', process.env.NODE_ENV);
console.log('Port:', PORT);
console.log('MongoDB URI:', process.env.MONGODB_URI ? 'Set' : 'Not set');

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use(helmet());

// Basic test endpoint - must be before any auth middleware
app.get('/api/test', (req, res) => {
  console.log('Test endpoint hit');
  res.status(200).json({ 
    status: 'ok', 
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV
  });
});

// Routes
app.use('/api/users', userRoutes);
app.use('/api/apps', auth, appRoutes);
app.use('/api/clusters', auth, clusterRoutes);
app.use('/api/admin', auth, adminRoutes);

// Stats endpoint for dashboard
app.get('/api/stats', auth, async (req: AuthRequest, res) => {
  try {
    console.log('Fetching stats for user:', req.user?.id);
    const totalApps = await AppName.countDocuments();
    const confirmedApps = await AppName.countDocuments({ confirmed: true });
    const unconfirmedApps = await AppName.countDocuments({ confirmed: false });
    const totalClusters = await Cluster.countDocuments();
    
    // Get user's streak
    const user = await User.findById(req.user?.id);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastActivity = user?.lastActivity ? new Date(user.lastActivity) : null;
    const streak = lastActivity && lastActivity >= today ? (user?.streak || 0) : 0;

    // Calculate XP and level
    const xp = user?.xp || 0;
    const level = Math.floor(Math.sqrt(xp / 100)) + 1;

    console.log('Stats endpoint user:', req.user?.id, 'xp:', xp, 'level:', level, 'streak:', streak);

    // Get team statistics
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ lastActivity: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } });
    const averageConfirmations = totalUsers > 0 ? confirmedApps / totalUsers : 0;
    const completionRate = totalApps > 0 ? confirmedApps / totalApps : 0;

    // Get recent activity
    const recentActivity = await AppName.find({ confirmed: true })
      .sort({ updatedAt: -1 })
      .limit(10)
      .populate('confirmedBy', 'name')
      .then(apps => apps.map(app => ({
        userId: app.confirmedBy?._id || '',
        userName: (app.confirmedBy as any)?.name || 'Unknown User',
        action: 'confirmed',
        timestamp: app.updatedAt,
        details: `"${app.name}"`
      })));

    // Team achievements
    const teamAchievements = [
      {
        id: 'first_100',
        name: 'First 100',
        description: 'Team confirms 100 app names',
        icon: '🎯',
        unlocked: confirmedApps >= 100,
        progress: confirmedApps,
        total: 100,
        unlockedAt: confirmedApps >= 100 ? new Date().toISOString() : undefined,
        unlockedBy: confirmedApps >= 100 ? 'Team' : undefined
      },
      {
        id: 'halfway_there',
        name: 'Halfway There',
        description: 'Team confirms 50% of all apps',
        icon: '🏆',
        unlocked: completionRate >= 0.5,
        progress: Math.round(completionRate * 100),
        total: 50,
        unlockedAt: completionRate >= 0.5 ? new Date().toISOString() : undefined,
        unlockedBy: completionRate >= 0.5 ? 'Team' : undefined
      },
      {
        id: 'team_effort',
        name: 'Team Effort',
        description: '10 team members contribute',
        icon: '👥',
        unlocked: activeUsers >= 10,
        progress: activeUsers,
        total: 10,
        unlockedAt: activeUsers >= 10 ? new Date().toISOString() : undefined,
        unlockedBy: activeUsers >= 10 ? 'Team' : undefined
      },
      {
        id: 'cluster_masters',
        name: 'Cluster Masters',
        description: 'Complete 20 clusters',
        icon: '🔍',
        unlocked: totalClusters >= 20,
        progress: totalClusters,
        total: 20,
        unlockedAt: totalClusters >= 20 ? new Date().toISOString() : undefined,
        unlockedBy: totalClusters >= 20 ? 'Team' : undefined
      },
      {
        id: 'speed_demons',
        name: 'Speed Demons',
        description: 'Confirm 50 apps in one day',
        icon: '⚡',
        unlocked: false, // This would need to be calculated based on daily activity
        progress: 0,
        total: 50,
        unlockedAt: undefined,
        unlockedBy: undefined
      },
      {
        id: 'perfection',
        name: 'Perfection',
        description: 'Complete all app confirmations',
        icon: '🌟',
        unlocked: unconfirmedApps === 0,
        progress: confirmedApps,
        total: totalApps,
        unlockedAt: unconfirmedApps === 0 ? new Date().toISOString() : undefined,
        unlockedBy: unconfirmedApps === 0 ? 'Team' : undefined
      }
    ];
    
    // Count of apps confirmed by the current user
    const personalConfirmedApps = await AppName.countDocuments({ confirmed: true, confirmedBy: req.user?.id });

    const stats = {
      totalApps,
      confirmedApps,
      unconfirmedApps,
      totalClusters,
      pendingReviews: unconfirmedApps,
      streak,
      xp,
      level,
      personalConfirmedApps,
      teamStats: {
        totalConfirmed: confirmedApps,
        totalUsers,
        activeUsers,
        averageConfirmations,
        completionRate,
        teamAchievements,
        recentActivity
      }
    };
    console.log('Stats:', stats);
    res.json(stats);
  } catch (e) {
    console.error('Error fetching stats:', e);
    res.status(500).send(e);
  }
});

interface AuthRequest extends Request {
  user?: {
    id: string;
  };
}

// Leaderboard endpoint
app.get('/api/leaderboard', auth, async (req, res) => {
  try {
    const leaderboard = await AppName.aggregate([
      { $match: { confirmed: true, confirmedBy: { $ne: null } } },
      { $group: { _id: '$confirmedBy', count: { $sum: 1 } } },
      { $match: { count: { $gt: 0 } } },
      { $sort: { count: -1 } },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      { $project: { _id: 0, userId: '$user._id', name: '$user.name', email: '$user.email', count: 1 } },
    ]);
    res.json(leaderboard);
  } catch (e) {
    res.status(500).send(e);
  }
});

// Update user activity and award XP
app.post('/api/apps/:id/confirm', auth, async (req: AuthRequest, res) => {
  try {
    let app = await AppName.findById(req.params.id).populate('cluster', 'name');
    if (!app) {
      return res.status(404).send('App not found');
    }

    app.confirmed = true;
    if (req.user?.id) {
      app.confirmedBy = new mongoose.Types.ObjectId(req.user.id);
    }
    await app.save();
    // Re-populate after save in case cluster was not populated before
    app = await AppName.findById(app._id).populate('cluster', 'name');

    // Update user's streak and XP
    const user = await User.findById(req.user?.id);
    let xp = 0, level = 1, streak = 0;
    if (user) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const lastActivity = user.lastActivity ? new Date(user.lastActivity) : null;
      // Update streak
      if (!lastActivity || lastActivity < today) {
        user.streak = 1;
      } else {
        user.streak = (user.streak || 0) + 1;
      }
      // Award XP
      user.xp = (user.xp || 0) + 100; // Base XP for confirmation
      user.lastActivity = new Date();
      await user.save();
      xp = user.xp;
      level = Math.floor(Math.sqrt(xp / 100)) + 1;
      streak = user.streak || 0;
      console.log('Confirmed app for user:', user._id, 'xp:', xp, 'level:', level, 'streak:', streak);
    } else {
      console.log('No user found for confirmation:', req.user?.id);
    }

    let clusterInfo = null;
    if (app && app.cluster && typeof app.cluster === 'object' && 'name' in app.cluster) {
      clusterInfo = { id: app.cluster._id, name: app.cluster.name };
    }

    res.json({
      app,
      user: { xp, level, streak },
      cluster: clusterInfo
    });
  } catch (e) {
    res.status(500).send(e);
  }
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server first
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Then connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/app-deduplicator')
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    // Don't exit the process, just log the error
  });

// Handle process termination
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Closing server...');
  server.close(() => {
    console.log('Server closed');
    mongoose.connection.close(() => {
      console.log('MongoDB connection closed');
      process.exit(0);
    });
  });
}); 
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Add debug logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/app-dedupe', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('Connected to MongoDB');
  console.log('MongoDB URI:', process.env.MONGODB_URI);
}).catch((error) => {
  console.error('MongoDB connection error:', error);
});

// Models
const User = require('./models/User');
const AppName = require('./models/AppName');
const Cluster = require('./models/Cluster');

// Authentication middleware
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization').replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findOne({ _id: decoded._id });
    if (!user) throw new Error();
    req.user = user;
    next();
  } catch (e) {
    res.status(401).send({ error: 'Please authenticate.' });
  }
};

// Routes
app.post('/api/users/register', async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    const token = await user.generateAuthToken();
    res.status(201).send({ user, token });
  } catch (e) {
    res.status(400).send(e);
  }
});

app.post('/api/users/login', async (req, res) => {
  try {
    const user = await User.findByCredentials(req.body.email, req.body.password);
    const token = await user.generateAuthToken();
    res.send({ user, token });
  } catch (e) {
    res.status(400).send({ error: 'Invalid login credentials' });
  }
});

// User Routes
app.get('/api/users/me', auth, async (req, res) => {
  try {
    res.send(req.user);
  } catch (e) {
    res.status(500).send(e);
  }
});

// App Name Routes
app.get('/api/apps', auth, async (req, res) => {
  try {
    const { confirmed } = req.query;
    console.log('Fetching apps with query:', { confirmed });
    const query = confirmed !== undefined ? { confirmed: confirmed === 'true' } : {};
    const apps = await AppName.find(query).populate('cluster', 'name canonicalName');
    console.log(`Found ${apps.length} apps`);
    res.send(apps);
  } catch (e) {
    console.error('Error fetching apps:', e);
    res.status(500).send(e);
  }
});

app.post('/api/apps', auth, async (req, res) => {
  try {
    const appName = new AppName({
      ...req.body,
      addedBy: req.user._id,
    });
    await appName.save();
    res.status(201).send(appName);
  } catch (e) {
    res.status(400).send(e);
  }
});

app.patch('/api/apps/:id/confirm', auth, async (req, res) => {
  try {
    const appName = await AppName.findById(req.params.id);
    appName.confirmed = true;
    appName.confirmedBy = req.user._id;
    await appName.save();
    res.send(appName);
  } catch (e) {
    res.status(400).send(e);
  }
});

// Stats endpoint for dashboard
app.get('/api/stats', auth, async (req, res) => {
  try {
    console.log('Fetching stats...');
    const totalApps = await AppName.countDocuments();
    const confirmedApps = await AppName.countDocuments({ confirmed: true });
    const unconfirmedApps = await AppName.countDocuments({ confirmed: false });
    const totalClusters = await Cluster.countDocuments();
    
    const stats = {
      totalApps,
      confirmedApps,
      unconfirmedApps,
      totalClusters,
      pendingReviews: unconfirmedApps
    };
    console.log('Stats:', stats);
    res.json(stats);
  } catch (e) {
    console.error('Error fetching stats:', e);
    res.status(500).send(e);
  }
});

// Cluster Routes
app.get('/api/clusters', auth, async (req, res) => {
  try {
    const clusters = await Cluster.find({});
    res.send(clusters);
  } catch (e) {
    res.status(500).send(e);
  }
});

app.post('/api/clusters', auth, async (req, res) => {
  try {
    const cluster = new Cluster({
      ...req.body,
      createdBy: req.user._id,
    });
    await cluster.save();
    res.status(201).send(cluster);
  } catch (e) {
    res.status(400).send(e);
  }
});

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
    // For debugging: also return all confirmed apps with their confirmedBy field
    const confirmedApps = await AppName.find({ confirmed: true }).select('name confirmedBy');
    res.json({ leaderboard, confirmedApps });
  } catch (e) {
    res.status(500).send(e);
  }
});

// Add a test route to confirm the correct backend is running
app.get('/api/test', (req, res) => {
  res.send('Test route is working');
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 
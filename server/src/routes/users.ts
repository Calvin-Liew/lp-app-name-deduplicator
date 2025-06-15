import express from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { auth } from '../middleware/auth';
import { AppName } from '../models/AppName';

const router = express.Router();

// Register user
router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),
  ],
  async (req: express.Request, res: express.Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, email, password } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: 'User already exists' });
      }

      // Create new user with admin role for specific email addresses
      const user = new User({
        name,
        email,
        password,
        role: (email === 'calvin.liew@sanofi.com' || email === 'yuyou.wu@sanofi.com') ? 'admin' : 'user'
      });

      await user.save();

      // Generate token
      const token = await user.generateAuthToken();

      res.status(201).json({ user, token });
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// Login user
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req: express.Request, res: express.Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      // Find user by email
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ error: 'Invalid credentials' });
      }

      // Check password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ error: 'Invalid credentials' });
      }

      // Set admin role for specific email addresses
      if (email === 'calvin.liew@sanofi.com' || email === 'yuyou.wu@sanofi.com') {
        user.role = 'admin';
        await user.save();
      }

      // Generate token
      const token = await user.generateAuthToken();

      res.json({ user, token });
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// Get current user
router.get('/me', auth, async (req: express.Request, res: express.Response) => {
  try {
    const user = (req as any).user;
    // Ensure admin role for specific emails
    if (user.email === 'calvin.liew@sanofi.com' || user.email === 'yuyou.wu@sanofi.com') {
      user.role = 'admin';
      await user.save();
    }
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Logout user
router.post('/logout', auth, async (req: express.Request, res: express.Response) => {
  try {
    const user = (req as any).user;
    user.tokens = user.tokens.filter((token: any) => token.token !== (req as any).token);
    await user.save();
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Test endpoint for user stats
router.get('/test-stats', auth, async (req: express.Request, res: express.Response) => {
  try {
    const user = (req as any).user;
    console.log('Testing user stats for:', user._id);

    // Get user's confirmed apps
    const confirmedApps = await AppName.find({ confirmedBy: user._id });
    console.log('Confirmed apps:', confirmedApps.length);

    // Get user's streak
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const streakApps = await AppName.find({
      confirmedBy: user._id,
      updatedAt: { $gte: today }
    });
    console.log('Today\'s confirmations:', streakApps.length);

    // Get leaderboard data
    const leaderboard = await AppName.aggregate([
      { $match: { confirmed: true } },
      { $group: { _id: '$confirmedBy', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' }
    ]);
    console.log('Leaderboard data:', leaderboard);

    res.json({
      user: {
        id: user._id,
        name: user.name,
        xp: user.xp,
        level: user.level,
        streak: user.streak
      },
      stats: {
        totalConfirmed: confirmedApps.length,
        todayConfirmed: streakApps.length,
        confirmedApps: confirmedApps.map(app => ({
          id: app._id,
          name: app.name,
          confirmedAt: app.updatedAt
        }))
      },
      leaderboard: leaderboard.map(entry => ({
        userId: entry._id,
        name: entry.user.name,
        count: entry.count
      }))
    });
  } catch (error) {
    console.error('Error in test-stats:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user stats
router.get('/stats', auth, async (req: express.Request, res: express.Response) => {
  try {
    const user = (req as any).user;
    console.log('Fetching stats for user:', user._id);

    // Get total apps count
    const totalApps = await AppName.countDocuments();
    console.log('Total apps:', totalApps);

    // Get unconfirmed apps count
    const unconfirmedApps = await AppName.countDocuments({ confirmed: false });
    console.log('Unconfirmed apps:', unconfirmedApps);

    // Get confirmed apps count
    const confirmedApps = await AppName.countDocuments({ confirmed: true });
    console.log('Confirmed apps:', confirmedApps);

    // Get user's confirmed apps count
    const personalConfirmedApps = await AppName.countDocuments({ confirmedBy: user._id });
    console.log('Personal confirmed apps:', personalConfirmedApps);

    // Get user's streak
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const streakApps = await AppName.countDocuments({
      confirmedBy: user._id,
      updatedAt: { $gte: today }
    });
    console.log('Today\'s confirmations:', streakApps);

    // Get user's achievements
    const achievements = user.achievements || [];

    res.json({
      xp: user.xp || 0,
      level: user.level || 1,
      streak: user.streak || 0,
      confirmedApps: confirmedApps,
      totalApps: totalApps,
      unconfirmedApps: unconfirmedApps,
      personalConfirmedApps: personalConfirmedApps,
      achievements: achievements,
      teamStats: {
        totalConfirmed: confirmedApps,
        totalUnconfirmed: unconfirmedApps,
        teamSize: await User.countDocuments()
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router; 
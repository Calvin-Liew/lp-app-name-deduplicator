import express from 'express';
import { body, validationResult } from 'express-validator';
import { AppName } from '../models/AppName';
import { Cluster } from '../models/Cluster';
import { User } from '../models/User';

const router = express.Router();

// Get all apps
router.get('/', async (req: express.Request, res: express.Response) => {
  try {
    const { confirmed } = req.query;
    console.log('Raw confirmed query:', confirmed);
    
    let query: any = {};
    if (confirmed !== undefined && confirmed !== 'undefined') {
      query.confirmed = confirmed === 'true';
    }
    
    console.log('Fetching apps with query:', query);
    
    const apps = await AppName.find(query)
      .populate('cluster', 'name')
      .populate('createdBy', 'name')
      .populate('confirmedBy', 'name');
    
    console.log(`Found ${apps.length} apps`);
    res.json(apps);
  } catch (error) {
    console.error('Error fetching apps:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get unconfirmed apps
router.get('/unconfirmed', async (req: express.Request, res: express.Response) => {
  try {
    const apps = await AppName.find({ confirmed: false })
      .populate('cluster', 'name')
      .populate('createdBy', 'name');
    res.json(apps);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get confirmed apps
router.get('/confirmed', async (req: express.Request, res: express.Response) => {
  try {
    const apps = await AppName.find({ confirmed: true })
      .populate('cluster', 'name')
      .populate('createdBy', 'name')
      .populate('confirmedBy', 'name');
    res.json(apps);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create new app
router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('cluster').optional().isMongoId().withMessage('Invalid cluster ID'),
  ],
  async (req: express.Request, res: express.Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, cluster, canonicalName } = req.body;
      const user = (req as any).user;

      const app = new AppName({
        name,
        cluster,
        canonicalName,
        addedBy: user._id,
      });

      await app.save();
      res.status(201).json(app);
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// Update app
router.patch(
  '/:id',
  [
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('cluster').optional().isMongoId().withMessage('Invalid cluster ID'),
    body('notes').optional().trim(),
  ],
  async (req: express.Request, res: express.Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const updates = Object.keys(req.body);
      const allowedUpdates = ['name', 'cluster', 'notes'];
      const isValidOperation = updates.every((update) =>
        allowedUpdates.includes(update)
      );

      if (!isValidOperation) {
        return res.status(400).json({ error: 'Invalid updates' });
      }

      const app = await AppName.findById(req.params.id);
      if (!app) {
        return res.status(404).json({ error: 'App not found' });
      }

      updates.forEach((update) => {
        (app as any)[update] = req.body[update];
      });

      await app.save();
      res.json(app);
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// Confirm app
router.patch('/:id/confirm', async (req: express.Request, res: express.Response) => {
  try {
    console.log('Confirming app:', req.params.id);
    console.log('User:', (req as any).user);

    const app = await AppName.findById(req.params.id);
    if (!app) {
      console.log('App not found:', req.params.id);
      return res.status(404).json({ error: 'App not found' });
    }

    const user = await User.findById((req as any).user._id);
    if (!user) {
      console.log('User not found:', (req as any).user._id);
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('Current app state:', {
      id: app._id,
      name: app.name,
      confirmed: app.confirmed,
      confirmedBy: app.confirmedBy
    });

    // Update app
    app.confirmed = true;
    app.confirmedBy = user._id;
    await app.save();

    // Update user stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if user has confirmed any apps today
    const todayConfirmations = await AppName.countDocuments({
      confirmedBy: user._id,
      updatedAt: { $gte: today }
    });

    // Award XP (50 XP per confirmation)
    user.xp += 50;

    // Update streak
    if (todayConfirmations === 1) {
      // First confirmation of the day
      user.streak += 1;
      // Bonus XP for maintaining streak
      if (user.streak > 1) {
        user.xp += user.streak * 10; // Bonus XP based on streak
      }
    }

    // Update daily confirmations
    user.dailyConfirmations = todayConfirmations;
    user.lastDailyReset = today;

    await user.save();

    console.log('App confirmed successfully:', {
      id: app._id,
      name: app.name,
      confirmed: app.confirmed,
      confirmedBy: app.confirmedBy
    });

    console.log('Updated user stats:', {
      id: user._id,
      xp: user.xp,
      level: user.level,
      streak: user.streak
    });

    // Populate the app with cluster and user information before sending response
    const populatedApp = await AppName.findById(app._id)
      .populate('cluster', 'name')
      .populate('confirmedBy', 'name');

    res.json({
      app: populatedApp,
      cluster: populatedApp?.cluster,
      user: {
        _id: user._id,
        name: user.name,
        xp: user.xp,
        level: user.level,
        streak: user.streak
      }
    });
  } catch (error) {
    console.error('Error confirming app:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Confirm app (POST)
router.post('/:id/confirm', async (req: express.Request, res: express.Response) => {
  try {
    console.log('Confirming app (POST):', req.params.id);
    console.log('User:', (req as any).user);

    const app = await AppName.findById(req.params.id);
    if (!app) {
      console.log('App not found:', req.params.id);
      return res.status(404).json({ error: 'App not found' });
    }

    const user = await User.findById((req as any).user._id);
    if (!user) {
      console.log('User not found:', (req as any).user._id);
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('Current app state:', {
      id: app._id,
      name: app.name,
      confirmed: app.confirmed,
      confirmedBy: app.confirmedBy
    });

    // Update app
    app.confirmed = true;
    app.confirmedBy = user._id;
    await app.save();

    // Update user stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if user has confirmed any apps today
    const todayConfirmations = await AppName.countDocuments({
      confirmedBy: user._id,
      updatedAt: { $gte: today }
    });

    // Award XP (50 XP per confirmation)
    user.xp += 50;

    // Update streak
    if (todayConfirmations === 1) {
      // First confirmation of the day
      user.streak += 1;
      // Bonus XP for maintaining streak
      if (user.streak > 1) {
        user.xp += user.streak * 10; // Bonus XP based on streak
      }
    }

    // Update daily confirmations
    user.dailyConfirmations = todayConfirmations;
    user.lastDailyReset = today;

    await user.save();

    console.log('App confirmed successfully:', {
      id: app._id,
      name: app.name,
      confirmed: app.confirmed,
      confirmedBy: app.confirmedBy
    });

    console.log('Updated user stats:', {
      id: user._id,
      xp: user.xp,
      level: user.level,
      streak: user.streak
    });

    // Populate the app with cluster and user information before sending response
    const populatedApp = await AppName.findById(app._id)
      .populate('cluster', 'name')
      .populate('confirmedBy', 'name');

    res.json({
      app: populatedApp,
      cluster: populatedApp?.cluster,
      user: {
        _id: user._id,
        name: user.name,
        xp: user.xp,
        level: user.level,
        streak: user.streak
      }
    });
  } catch (error) {
    console.error('Error confirming app:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router; 
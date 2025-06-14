import express from 'express';
import { body, validationResult } from 'express-validator';
import { AppName } from '../models/AppName';
import { Cluster } from '../models/Cluster';

const router = express.Router();

// Get all apps
router.get('/', async (req: express.Request, res: express.Response) => {
  try {
    const { confirmed } = req.query;
    console.log('Fetching apps with query:', { confirmed });
    
    const query = confirmed !== undefined ? { confirmed: confirmed === 'true' } : {};
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
    const app = await AppName.findById(req.params.id);
    if (!app) {
      return res.status(404).json({ error: 'App not found' });
    }

    const user = (req as any).user;
    app.confirmed = true;
    app.confirmedBy = user._id;
    // app.status = 'confirmed'; // Removed because 'status' does not exist on AppName

    await app.save();
    res.json(app);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router; 
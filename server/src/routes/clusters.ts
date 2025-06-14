import express from 'express';
import { body, validationResult } from 'express-validator';
import { Cluster } from '../models/Cluster';
import { AppName } from '../models/AppName';

const router = express.Router();

// Get all clusters
router.get('/', async (req: express.Request, res: express.Response) => {
  try {
    // Aggregate clusters with confirmation stats
    const clusters = await Cluster.aggregate([
      {
        $lookup: {
          from: 'appnames',
          localField: '_id',
          foreignField: 'cluster',
          as: 'apps',
        },
      },
      {
        $addFields: {
          totalApps: { $size: '$apps' },
          confirmedApps: {
            $size: {
              $filter: {
                input: '$apps',
                as: 'app',
                cond: { $eq: ['$$app.confirmed', true] },
              },
            },
          },
        },
      },
      {
        $addFields: {
          confirmationRatio: {
            $cond: [
              { $eq: ['$totalApps', 0] },
              0,
              { $divide: ['$confirmedApps', '$totalApps'] },
            ],
          },
        },
      },
      { $sort: { confirmationRatio: -1, name: 1 } },
    ]);

    // Optionally, populate createdBy (manual population since aggregate doesn't support populate)
    // You can do a separate query if needed, or leave as is for now.

    res.json(clusters);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create new cluster
router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('canonicalName').trim().notEmpty().withMessage('Canonical name is required'),
  ],
  async (req: express.Request, res: express.Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, canonicalName, description } = req.body;
      const user = (req as any).user;

      const cluster = new Cluster({
        name,
        canonicalName,
        description,
        createdBy: user._id,
      });

      await cluster.save();
      res.status(201).json(cluster);
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// Update cluster
router.patch(
  '/:id',
  [
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('canonicalName')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Canonical name cannot be empty'),
  ],
  async (req: express.Request, res: express.Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const updates = Object.keys(req.body);
      const allowedUpdates = ['name', 'canonicalName', 'description', 'status'];
      const isValidOperation = updates.every((update) =>
        allowedUpdates.includes(update)
      );

      if (!isValidOperation) {
        return res.status(400).json({ error: 'Invalid updates' });
      }

      const cluster = await Cluster.findById(req.params.id);
      if (!cluster) {
        return res.status(404).json({ error: 'Cluster not found' });
      }

      updates.forEach((update) => {
        (cluster as any)[update] = req.body[update];
      });

      await cluster.save();
      res.json(cluster);
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// Get cluster stats
router.get('/:id/stats', async (req: express.Request, res: express.Response) => {
  try {
    const cluster = await Cluster.findById(req.params.id);
    if (!cluster) {
      return res.status(404).json({ error: 'Cluster not found' });
    }

    const totalApps = await AppName.countDocuments({ cluster: cluster._id });
    const confirmedApps = await AppName.countDocuments({
      cluster: cluster._id,
      confirmed: true,
    });
    const unconfirmedApps = await AppName.countDocuments({
      cluster: cluster._id,
      confirmed: false,
    });

    res.json({
      totalApps,
      confirmedApps,
      unconfirmedApps,
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router; 
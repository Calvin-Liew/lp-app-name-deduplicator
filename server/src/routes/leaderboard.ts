import express from 'express';
import { AppName } from '../models/AppName';
import { auth } from '../middleware/auth';

const router = express.Router();

// Leaderboard endpoint
router.get('/', auth, async (req, res) => {
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
    console.error('Error fetching leaderboard:', e);
    res.status(500).send(e);
  }
});

export default router; 
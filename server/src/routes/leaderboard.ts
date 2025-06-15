import express from 'express';
import { AppName } from '../models/AppName';
import { User } from '../models/User';

const router = express.Router();

// Get leaderboard
router.get('/', async (req: express.Request, res: express.Response) => {
  try {
    console.log('Fetching leaderboard data...');
    
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

    const formattedLeaderboard = leaderboard.map(entry => ({
      userId: entry._id,
      name: entry.user.name,
      count: entry.count,
      xp: entry.user.xp || 0,
      level: entry.user.level || 1
    }));

    res.json(formattedLeaderboard);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router; 
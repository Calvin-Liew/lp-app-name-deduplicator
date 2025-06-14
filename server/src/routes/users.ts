import express from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { auth } from '../middleware/auth';

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

      // Create new user
      const user = new User({
        name,
        email,
        password,
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
    res.json((req as any).user);
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

export default router; 
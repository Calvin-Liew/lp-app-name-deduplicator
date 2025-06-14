import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';

const router = express.Router();

router.post('/login', async (req: express.Request, res: express.Response) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt:', { email, password });
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Password mismatch for user:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '1d' });
    res.json({ token, user: { id: user._id, email: user.email, role: user.role } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router; 
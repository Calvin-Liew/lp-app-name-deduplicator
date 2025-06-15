import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: string;
  tokens: { token: string }[];
  generateAuthToken(): Promise<string>;
  xp: number;
  level: number;
  streak: number;
  lastActivity: Date | null;
  achievements: { id: string; unlockedAt: Date }[];
  dailyConfirmations: number;
  lastDailyReset: Date | null;
  calculateLevel(): number;
}

const userSchema = new Schema<IUser>({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  xp: {
    type: Number,
    default: 0,
  },
  level: {
    type: Number,
    default: 1,
  },
  streak: {
    type: Number,
    default: 0,
  },
  lastActivity: {
    type: Date,
    default: null,
  },
  achievements: [{
    id: String,
    unlockedAt: Date,
  }],
  dailyConfirmations: {
    type: Number,
    default: 0,
  },
  lastDailyReset: {
    type: Date,
    default: null,
  },
  tokens: [{
    token: {
      type: String,
      required: true,
    },
  }],
}, {
  timestamps: true,
});

userSchema.pre('save', async function(next) {
  const user = this;
  if (user.isModified('password')) {
    user.password = await bcrypt.hash(user.password, 8);
  }
  if (user.isModified('xp')) {
    user.level = user.calculateLevel();
  }
  if (this.isModified('dailyConfirmations')) {
    const now = new Date();
    if (!this.lastDailyReset || this.lastDailyReset.getDate() !== now.getDate()) {
      this.dailyConfirmations = 0;
      this.lastDailyReset = now;
    }
  }
  next();
});

userSchema.methods.generateAuthToken = async function() {
  const user = this;
  const token = jwt.sign(
    { _id: user._id.toString() },
    process.env.JWT_SECRET || 'your-secret-key'
  );
  user.tokens = user.tokens.concat({ token });
  await user.save();
  return token;
};

userSchema.methods.comparePassword = async function(candidatePassword: string) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.calculateLevel = function() {
  const xp = this.xp;
  let level = 1;
  let xpNeeded = 0;
  
  while (xp >= xpNeeded) {
    level++;
    xpNeeded += level * 100;
  }
  
  return level - 1;
};

export const User = mongoose.model<IUser>('User', userSchema); 
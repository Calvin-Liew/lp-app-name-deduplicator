import mongoose, { Document, Schema } from 'mongoose';

export interface IAppName extends Document {
  name: string;
  canonicalName: string;
  cluster: mongoose.Types.ObjectId;
  confirmed: boolean;
  confirmedBy?: mongoose.Types.ObjectId;
  confirmedAt?: Date;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  notes: string;
}

const appNameSchema = new Schema<IAppName>({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  canonicalName: {
    type: String,
    required: true,
    trim: true,
  },
  cluster: {
    type: Schema.Types.ObjectId,
    ref: 'Cluster',
    required: true,
  },
  confirmed: {
    type: Boolean,
    default: false,
  },
  confirmedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  confirmedAt: {
    type: Date,
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  notes: {
    type: String,
    trim: true,
  },
}, {
  timestamps: true,
});

export const AppName = mongoose.model<IAppName>('AppName', appNameSchema); 
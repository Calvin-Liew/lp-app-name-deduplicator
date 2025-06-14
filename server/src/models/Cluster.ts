import mongoose, { Document, Schema } from 'mongoose';

export interface ICluster extends Document {
  name: string;
  canonicalName: string;
  description?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const clusterSchema = new Schema<ICluster>({
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
  description: {
    type: String,
    trim: true,
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

export const Cluster = mongoose.model<ICluster>('Cluster', clusterSchema); 
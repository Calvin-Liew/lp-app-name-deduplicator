const mongoose = require('mongoose');

const clusterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  canonicalName: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'archived'],
    default: 'active'
  },
  metadata: {
    type: Map,
    of: String
  }
}, {
  timestamps: true
});

// Index for faster searches
clusterSchema.index({ name: 'text', canonicalName: 'text' });

const Cluster = mongoose.model('Cluster', clusterSchema);
module.exports = Cluster; 
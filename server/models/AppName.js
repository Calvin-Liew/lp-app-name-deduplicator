const mongoose = require('mongoose');

const appNameSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  canonicalName: {
    type: String,
    trim: true
  },
  cluster: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cluster'
  },
  confirmed: {
    type: Boolean,
    default: false
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  confirmedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'rejected'],
    default: 'pending'
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Index for faster searches
appNameSchema.index({ name: 'text', canonicalName: 'text' });

const AppName = mongoose.model('AppName', appNameSchema);
module.exports = AppName; 
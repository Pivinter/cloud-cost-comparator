const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  parameters: {
    cpu: { type: Number, required: true },
    ram: { type: Number, required: true },
    storage: { type: Number, required: true },
    duration: { type: Number, required: true },
    region: { type: String, required: true }
  },
  results: [
    {
      provider: String,
      cost: Number,
      breakdown: {
        compute: Number,
        storage: Number
      },
      vmType: String
    }
  ],
  recommendation: {
    provider: String,
    reason: String,
    score: Number
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Індекс для швидкого пошуку звітів користувача
reportSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Report', reportSchema);

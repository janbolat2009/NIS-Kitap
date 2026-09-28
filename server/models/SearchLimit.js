import mongoose from 'mongoose';

const searchLimitSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
  userId: { type: String, default: '' },
  count: { type: Number, default: 0, min: 0 },
  cycleStartedAt: { type: Date, default: Date.now },
  resetAt: { type: Date, required: true },
  lastSearchAt: { type: Date, default: Date.now },
  searchHistory: [
    {
      query: { type: String, default: '' },
      timestamp: { type: Date, default: Date.now },
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.SearchLimit || mongoose.model('SearchLimit', searchLimitSchema);

import mongoose from 'mongoose';

const bookSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  author: { type: String, required: true, trim: true },
  language: { 
    type: String, 
    required: true, 
    enum: ['English', 'Русский', 'Қазақ'],
    default: 'English' 
  },
  genre: { 
    type: [String], 
    default: ['Приключения'] 
  },
  description: { type: String, default: '', trim: true },
  year: { type: String, default: '' },
  copies: { type: Number, default: 1, min: 0 },
  cover_image: { type: String, default: '' },
  status: { type: String, default: 'available', enum: ['available', 'borrowed', 'reserved', 'unavailable'] },
  isbn: { type: String, default: '' },
  embedding: { type: [Number], default: [] },
  createdAt: { type: Date, default: Date.now }
});

// Indexes for fast search and duplicate prevention
bookSchema.index({ title: 1, author: 1, year: 1 });
bookSchema.index({ language: 1, genre: 1 });

export default mongoose.models.Book || mongoose.model('Book', bookSchema);

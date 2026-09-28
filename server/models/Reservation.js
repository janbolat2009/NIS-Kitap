import mongoose from 'mongoose';

const reservationSchema = new mongoose.Schema({
  reservationId: { type: String, required: true, unique: true },
  bookId: { type: String },
  title: { type: String, required: true },
  author: { type: String, required: true },
  genre: { type: String, default: '' },
  isbn: { type: String, default: '' },
  language: { type: String, default: '' },
  year: { type: String, default: '' },
  copies: { type: Number, default: 1 },
  userName: { type: String, required: true },
  userEmail: { type: String, required: true },
  userId: { type: String, default: '' },
  reservedAt: { type: Date, default: Date.now },
  dueDate: { type: Date, required: true },
  status: { type: String, default: 'active', enum: ['active', 'returned', 'cancelled'] },
  emailSent: { type: Boolean, default: false },
  notifiedRecipients: [{ type: String }],
  emailError: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Reservation || mongoose.model('Reservation', reservationSchema);

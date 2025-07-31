const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const authRoutes = require('./routes/auth');

const app = express();

app.use(cors({
  origin: 'http://localhost:5173',
}));
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/booksdb')
  .then(() => console.log('Подключено к MongoDB'))
  .catch(err => console.error('Ошибка подключения к MongoDB:', err));

const bookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
  genre: { type: String, required: true },
  copies: { type: Number, required: true },
  year: { type: String, required: true },
  description: { type: String, required: true },
  language: { type: String, required: true }
});
const Book = mongoose.model('Book', bookSchema);

app.get('/api/books', async (req, res) => {
  try {
    const books = await Book.find();
    res.status(200).json(books);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка при получении книг: ' + err.message });
  }
});

app.post('/books', async (req, res) => {
  try {
    const books = await Book.insertMany(req.body);
    res.status(201).json(books);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка при добавлении книг: ' + err.message });
  }
});

app.get('/books/:id', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ error: 'Книга не найдена' });
    res.status(200).json(book);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка при получении книги: ' + err.message });
  }
});

app.get('/books/genre/:genre', async (req, res) => {
  try {
    const books = await Book.find({ genre: req.params.genre });
    res.status(200).json(books);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка при получении книг по жанру: ' + err.message });
  }
});

app.get('/books/search', async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) return res.status(400).json({ error: 'Требуется параметр поиска (q)' });
    const books = await Book.find({
      $or: [{ title: { $regex: query, $options: 'i' } }, { author: { $regex: query, $options: 'i' } }],
    });
    res.status(200).json(books);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка при поиске книг: ' + err.message });
  }
});

app.put('/books/:id', async (req, res) => {
  try {
    const book = await Book.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!book) return res.status(404).json({ error: 'Книга не найдена' });
    res.status(200).json(book);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка при обновлении книги: ' + err.message });
  }
});

app.delete('/books/:id', async (req, res) => {
  try {
    const book = await Book.findByIdAndDelete(req.params.id);
    if (!book) return res.status(404).json({ error: 'Книга не найдена' });
    res.status(200).json({ message: 'Книга успешно удалена' });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка при удалении книги: ' + err.message });
  }
});

app.use('/auth', authRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Сервер запущен на http://localhost:${PORT}`));
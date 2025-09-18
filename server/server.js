import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { OpenAI } from 'openai';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import openaiRouter from './routes/openai.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = resolve(__dirname, '../.env');
console.log('Попытка загрузки .env из:', envPath);
dotenv.config({ path: envPath });

const app = express();
const port = process.env.PORT || 3001;

const corsOptions = {
  origin: ['http://localhost:5173', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json({ limit: '50mb' }));

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI не найден в переменных окружения');
    }
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Подключено к MongoDB');
  } catch (err) {
    console.error('❌ Ошибка подключения к MongoDB:', err.message);
    process.exit(1);
  }
};
connectDB();

const bookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
  genre: [{ type: String }],
  description: { type: String, required: true },
  year: { type: String, required: true },
  copies: { type: Number, required: true },
  language: { type: String, required: true },
  embedding: [Number],
});
const Book = mongoose.model('Book', bookSchema);
export { Book };

let openai = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  console.log('✅ OpenAI API ключ загружен');
} else {
  console.warn('⚠️ OPENAI_API_KEY не найден в .env файле!');
}

function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dotProduct / (magnitudeA * magnitudeB) || 0;
}

app.use('/api/openai', openaiRouter);

app.get('/', (req, res) => {
  res.json({
    message: '🚀 NIS Kitap Server работает!',
    status: 'OK',
    timestamp: new Date().toISOString(),
    endpoints: [
      'GET /api/books',
      'POST /api/books',
      'GET /api/books/:id',
      'PUT /api/books/:id',
      'DELETE /api/books/:id',
      'GET /api/books/genre/:genre',
      'GET /api/books/search',
      'POST /api/openai/search',
      'GET /api/openai/test',
    ],
  });
});

app.get('/api/books', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'База данных недоступна' });
    }
    const books = await Book.find({}).lean();
    console.log(`📖 GET /api/books - возвращено: ${books.length} книг`);
    res.json(books);
  } catch (error) {
    console.error('❌ Ошибка получения книг:', error);
    res.status(500).json({ error: 'Ошибка сервера при получении книг' });
  }
});

app.post('/api/books', async (req, res) => {
  try {
    const books = await Book.insertMany(req.body);
    console.log(`📖 POST /api/books - добавлено: ${books.length} книг`);
    res.status(201).json(books);
  } catch (error) {
    console.error('❌ Ошибка при добавлении книг:', error);
    res.status(500).json({ error: 'Ошибка сервера при добавлении книг' });
  }
});

app.get('/api/books/:id', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id).lean();
    if (!book) return res.status(404).json({ error: 'Книга не найдена' });
    console.log(`📖 GET /api/books/:id - найдена книга: ${book.title}`);
    res.json(book);
  } catch (error) {
    console.error('❌ Ошибка получения книги:', error);
    res.status(500).json({ error: 'Ошибка сервера при получении книги' });
  }
});

app.get('/api/books/genre/:genre', async (req, res) => {
  try {
    const books = await Book.find({ genre: req.params.genre }).lean();
    console.log(`📖 GET /api/books/genre/${req.params.genre} - найдено: ${books.length} книг`);
    res.json(books);
  } catch (error) {
    console.error('❌ Ошибка получения книг по жанру:', error);
    res.status(500).json({ error: 'Ошибка сервера при получении книг по жанру' });
  }
});

app.get('/api/books/search', async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) return res.status(400).json({ error: 'Требуется параметр поиска (q)' });
    const books = await Book.find({
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { author: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
      ],
    }).lean();
    console.log(`📖 GET /api/books/search?q=${query} - найдено: ${books.length} книг`);
    res.json(books);
  } catch (error) {
    console.error('❌ Ошибка при поиске книг:', error);
    res.status(500).json({ error: 'Ошибка сервера при поиске книг' });
  }
});

app.put('/api/books/:id', async (req, res) => {
  try {
    const book = await Book.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).lean();
    if (!book) return res.status(404).json({ error: 'Книга не найдена' });
    console.log(`📖 PUT /api/books/:id - обновлена книга: ${book.title}`);
    res.json(book);
  } catch (error) {
    console.error('❌ Ошибка при обновлении книги:', error);
    res.status(500).json({ error: 'Ошибка сервера при обновлении книги' });
  }
});

app.delete('/api/books/:id', async (req, res) => {
  try {
    const book = await Book.findByIdAndDelete(req.params.id).lean();
    if (!book) return res.status(404).json({ error: 'Книга не найдена' });
    console.log(`📖 DELETE /api/books/:id - удалена книга: ${book.title}`);
    res.status(200).json({ message: 'Книга успешно удалена' });
  } catch (error) {
    console.error('❌ Ошибка при удалении книги:', error);
    res.status(500).json({ error: 'Ошибка сервера при удалении книги' });
  }
});

app.use('*', (req, res) => {
  res.status(404).json({
    error: `Маршрут ${req.originalUrl} не найден`,
    available: [
      'GET /',
      'GET /api/books',
      'POST /api/books',
      'GET /api/books/:id',
      'PUT /api/books/:id',
      'DELETE /api/books/:id',
      'GET /api/books/genre/:genre',
      'GET /api/books/search',
      'POST /api/openai/search',
      'GET /api/openai/test',
    ],
  });
});

app.use((error, req, res, next) => {
  console.error('💥 Глобальная ошибка:', error);
  res.status(500).json({ error: 'Внутренняя ошибка сервера' });
});

const server = app.listen(port, () => {
  console.log(`🚀 Сервер NIS Kitap запущен на http://localhost:${port}`);
  console.log(`📚 API доступен по адресу: http://localhost:${port}/api`);
  console.log(`🤖 OpenAI тест: http://localhost:${port}/api/openai/test`);
  console.log(`🔍 Поиск фронтенда: http://localhost:${port}/api/openai/search`);
  console.log(`📊 MongoDB: ${mongoose.connection.readyState === 1 ? 'подключен' : 'отключен'}`);
  console.log(`🔑 OpenAI API: ${openai ? 'настроен' : 'не настроен'}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Порт ${port} занят. Попробуйте другой порт.`);
    process.exit(1);
  } else {
    console.error('❌ Ошибка сервера:', err);
  }
});

process.on('uncaughtException', (err) => {
  console.error('💥 Неперехваченная ошибка:', err);
  server.close(() => process.exit(1));
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Неперехваченное отклонение промиса:', reason);
});
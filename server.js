import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { OpenAI } from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(cors({
  origin: ['http://localhost:8080', 'http://localhost:3000'],
  credentials: true
}));

// Логирование запросов
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Подключение к MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('✅ Подключено к MongoDB');
}).catch(err => {
  console.error('❌ Ошибка подключения к MongoDB:', err);
});

// Схема книги
const bookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
  genre: { type: String, default: 'Не указано' },
  description: { type: String, default: '' },
  embedding: [Number],
  createdAt: { type: Date, default: Date.now }
});

const Book = mongoose.model('Book', bookSchema);

// Инициализация OpenAI
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

// Проверка API ключа
if (!process.env.OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY не найден в .env файле!');
} else {
  console.log('✅ OpenAI API ключ загружен');
}

// Функция косинусного сходства
function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  
  return dotProduct / (magnitudeA * magnitudeB) || 0;
}

// Функция добавления эмбеддингов
async function addEmbeddingsToBooks() {
  try {
    const books = await Book.find({});
    console.log(`📚 Найдено книг для добавления эмбеддингов: ${books.length}`);
    
    let processed = 0;
    for (const book of books) {
      if (!book.embedding || book.embedding.length === 0) {
        const text = `${book.title} ${book.author} ${book.genre} ${book.description || ''}`;
        console.log(`🔄 Генерирую эмбеддинг для: ${book.title}`);
        
        try {
          const response = await openai.embeddings.create({
            model: 'text-embedding-3-small',
            input: text,
            dimensions: 256,
          });
          
          book.embedding = response.data[0].embedding;
          await book.save();
          processed++;
          console.log(`✅ Эмбеддинг добавлен для: ${book.title}`);
          
          // Небольшая задержка между запросами
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.error(`❌ Ошибка создания эмбеддинга для "${book.title}":`, error.message);
        }
      }
    }
    console.log(`🎉 Обработано книг: ${processed}`);
  } catch (error) {
    console.error('❌ Ошибка добавления эмбеддингов:', error);
  }
}

// Запуск добавления эмбеддингов при старте сервера
addEmbeddingsToBooks();

// API Routes

// Главная страница
app.get('/', (req, res) => {
  res.json({ 
    message: 'NIS Kitap Server работает!', 
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

// Получение всех книг
app.get('/api/books', async (req, res) => {
  try {
    const books = await Book.find({}, 'title author genre description').lean();
    console.log(`📖 GET /api/books - возвращено: ${books.length} книг`);
    res.json(books);
  } catch (error) {
    console.error('❌ Ошибка получения книг:', error);
    res.status(500).json({ error: 'Ошибка сервера при получении книг' });
  }
});

// Поиск по эмбеддингам (новый endpoint)
app.post('/api/search', async (req, res) => {
  const query = req.body.query ? req.body.query.trim() : '';
  console.log('🔍 Поиск по эмбеддингам:', query);
  
  if (!query) {
    return res.status(400).json({ error: 'Запрос обязателен' });
  }

  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: query,
      dimensions: 256,
    });
    
    const queryEmbedding = response.data[0].embedding;
    const books = await Book.find({}, 'title author genre description embedding').lean();
    
    const results = books
      .filter(book => book.embedding && book.embedding.length > 0)
      .map(book => ({
        ...book,
        score: cosineSimilarity(queryEmbedding, book.embedding),
      }))
      .filter(result => result.score > 0.3)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    console.log(`📊 Найдено результатов: ${results.length}`);
    res.json(results);
  } catch (error) {
    console.error('❌ Ошибка поиска:', error);
    res.status(500).json({ error: 'Ошибка при выполнении поиска' });
  }
});

// OpenAI роуты для совместимости с фронтендом
app.get('/api/openai/test', (req, res) => {
  res.json({ 
    message: 'OpenAI route is working!', 
    timestamp: new Date().toISOString(),
    hasApiKey: !!process.env.OPENAI_API_KEY,
    mongoConnected: mongoose.connection.readyState === 1
  });
});

// Основной роут для фронтенда (совместим с вашим App.vue)
app.post('/api/openai/search', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { prompt } = req.body;
    
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return res.status(400).json({ 
        error: 'Поле "prompt" обязательно и должно содержать текст' 
      });
    }

    console.log('🤖 OpenAI поиск через GPT:', prompt.trim());

    // Вариант 1: Поиск через эмбеддинги (более точный)
    if (await Book.countDocuments({ embedding: { $exists: true, $ne: [] } }) > 0) {
      console.log('📊 Используем поиск по эмбеддингам');
      
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: prompt.trim(),
        dimensions: 256,
      });
      
      const queryEmbedding = response.data[0].embedding;
      const books = await Book.find({}, 'title author genre description embedding').lean();
      
      const results = books
        .filter(book => book.embedding && book.embedding.length > 0)
        .map(book => ({
          title: book.title,
          author: book.author,
          genre: book.genre || 'Не указано',
          description: book.description || 'Описание отсутствует',
          score: cosineSimilarity(queryEmbedding, book.embedding),
        }))
        .filter(result => result.score > 0.2)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

      if (results.length > 0) {
        const responseTime = Date.now() - startTime;
        console.log(`✅ Найдено через эмбеддинги: ${results.length} книг за ${responseTime}ms`);
        return res.json({ books: results, method: 'embeddings', responseTime });
      }
    }

    // Вариант 2: Генерация через GPT (fallback)
    console.log('🤖 Используем генерацию через GPT');
    
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'Ты - библиотечный помощник. Рекомендуй существующие книги в строгом JSON формате.'
        },
        {
          role: 'user',
          content: `Рекомендуй 3-5 реальных книг по запросу: "${prompt.trim()}". 
          Ответь строго в формате JSON массива:
          [{"title": "название книги", "author": "автор", "genre": "жанр", "description": "краткое описание"}]`
        }
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const text = response.choices[0].message.content.trim();
    let books;

    try {
      const cleanedText = text
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .replace(/^[^[\{]*/, '')
        .replace(/[^}\]]*$/, '')
        .trim();
      
      books = JSON.parse(cleanedText);
      
      if (!Array.isArray(books)) {
        throw new Error('Ответ не является массивом');
      }

      books = books.filter(book => 
        book && book.title && book.author
      ).map(book => ({
        title: String(book.title).trim(),
        author: String(book.author).trim(),
        genre: book.genre ? String(book.genre).trim() : 'Не указано',
        description: book.description ? String(book.description).trim() : 'Описание отсутствует'
      }));

    } catch (parseError) {
      console.error('❌ Ошибка парсинга GPT ответа:', parseError.message);
      books = [{
        title: "Поиск не дал результатов",
        author: "Система",
        genre: "Информация",
        description: "Попробуйте переформулировать запрос"
      }];
    }

    const responseTime = Date.now() - startTime;
    console.log(`✅ GPT поиск завершен за ${responseTime}ms`);
    
    res.json({ 
      books, 
      method: 'gpt-generation',
      responseTime,
      query: prompt.trim()
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error('❌ Ошибка OpenAI поиска:', error.message);

    let userError = 'Ошибка при поиске книг';
    let statusCode = 500;

    if (error.response?.status === 401) {
      userError = 'Проблема с API ключом OpenAI';
      statusCode = 401;
    } else if (error.response?.status === 429) {
      userError = 'Превышен лимит запросов OpenAI';
      statusCode = 429;
    }

    res.status(statusCode).json({ 
      error: userError,
      responseTime
    });
  }
});

// Добавление новой книги
app.post('/api/books', async (req, res) => {
  try {
    const { title, author, genre, description } = req.body;
    
    if (!title || !author) {
      return res.status(400).json({ error: 'Название и автор обязательны' });
    }

    const book = new Book({
      title: title.trim(),
      author: author.trim(),
      genre: genre ? genre.trim() : 'Не указано',
      description: description ? description.trim() : ''
    });

    await book.save();
    
    // Генерируем эмбеддинг для новой книги
    try {
      const text = `${book.title} ${book.author} ${book.genre} ${book.description}`;
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
        dimensions: 256,
      });
      
      book.embedding = response.data[0].embedding;
      await book.save();
      console.log(`✅ Добавлена книга с эмбеддингом: ${book.title}`);
    } catch (embError) {
      console.error('❌ Ошибка создания эмбеддинга для новой книги:', embError.message);
    }

    res.status(201).json(book);
  } catch (error) {
    console.error('❌ Ошибка добавления книги:', error);
    res.status(500).json({ error: 'Ошибка при добавлении книги' });
  }
});

// Обработка несуществующих роутов
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Роут не найден',
    available: [
      'GET /',
      'GET /api/books',
      'POST /api/books',
      'POST /api/search',
      'GET /api/openai/test',
      'POST /api/openai/search'
    ]
  });
});

// Глобальная обработка ошибок
app.use((error, req, res, next) => {
  console.error('💥 Глобальная ошибка:', error);
  res.status(500).json({ error: 'Внутренняя ошибка сервера' });
});

// Запуск сервера
app.listen(port, () => {
  console.log(`🚀 Сервер NIS Kitap запущен на http://localhost:${port}`);
  console.log(`📚 API доступен по адресу: http://localhost:${port}/api`);
  console.log(`🤖 OpenAI тест: http://localhost:${port}/api/openai/test`);
});
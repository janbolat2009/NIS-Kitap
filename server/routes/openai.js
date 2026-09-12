import express from 'express';
import { OpenAI } from 'openai';
import { Book } from '../server.js';
import 'dotenv/config';

const router = express.Router();
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dotProduct / (magnitudeA * magnitudeB) || 0;
}

router.get('/test', (req, res) => {
  res.json({
    message: 'OpenAI route is working!',
    timestamp: new Date().toISOString(),
    hasApiKey: !!process.env.OPENAI_API_KEY,
    mongoConnected: mongoose.connection.readyState === 1,
  });
});

router.post('/search', async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Поле "prompt" обязательно' });
  }

  try {
    console.log('➡️ Ищем книги в MongoDB...');
    console.log('Prompt:', prompt);

    const stopWords = ['хочу', 'книги', 'книга', 'про', 'о', 'на', 'в', 'и', 'а', 'по'];
    const keywords = prompt.toLowerCase().split(/\s+/).filter(word => word.length > 2 && !stopWords.includes(word));
    console.log('Ключевые слова:', keywords);

    const query = {
      $and: keywords.map(keyword => ({
        $or: [
          { title: { $regex: keyword, $options: 'i' } },
          { author: { $regex: keyword, $options: 'i' } },
          { description: { $regex: keyword, $options: 'i' } },
          { genre: { $regex: keyword, $options: 'i' } },
        ],
      })),
    };

    let books = keywords.length > 0 ? await Book.find(query).lean().limit(10) : [];
    console.log(`📚 Найдено книг по ключевым словам: ${books.length}`);

    if (books.length === 0 && openai) {
      const response = await openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: prompt,
      });
      const promptEmbedding = response.data[0].embedding;

      books = await Book.find({ embedding: { $exists: true, $ne: [] } }).lean();
      books = books
        .map(book => ({
          ...book,
          similarity: cosineSimilarity(promptEmbedding, book.embedding),
        }))
        .filter(book => book.similarity > 0.8)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 10);
    } else if (books.length > 0) {
      books = books
        .map(book => {
          let score = 0;

          const titleLower = book.title.toLowerCase();
          const authorLower = book.author.toLowerCase();
          const descLower = book.description.toLowerCase();
          const genreLower = book.genre.join(' ').toLowerCase();

          if (titleLower.includes(prompt.toLowerCase())) score += 3.0;
          if (descLower.includes(prompt.toLowerCase())) score += 2.0;
          if (genreLower.includes(prompt.toLowerCase())) score += 1.5;
          if (authorLower.includes(prompt.toLowerCase())) score += 1.0;

          keywords.forEach(keyword => {
            if (titleLower.includes(keyword)) score += 1.0;
            if (descLower.includes(keyword)) score += 0.7;
            if (genreLower.includes(keyword)) score += 0.5;
            if (authorLower.includes(keyword)) score += 0.3;
          });

          return {
            ...book,
            similarity: score,
          };
        })
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 10);
    }

    console.log(`📚 Найдено книг: ${books.length}`, books);

    if (books.length === 0) {
      return res.status(200).json({ books: [], message: 'Книги по вашему запросу не найдены' });
    }

    res.json({ books });
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    res.status(500).json({ error: 'Ошибка сервера при поиске книг' });
  }
});

export default router;
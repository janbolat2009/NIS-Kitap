import mongoose from 'mongoose';
import { OpenAI } from 'openai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const bookSchema = new mongoose.Schema({
  title: String,
  author: String,
  genre: [String],
  description: String,
  year: String,
  copies: Number,
  language: String,
  embedding: [Number],
});
const Book = mongoose.model('Book', bookSchema);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function addEmbeddings() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/nis-kitap');
    console.log('✅ MongoDB connected');

    const books = await Book.find({}).lean();
    if (books.length === 0) {
      console.log('❌ Нет книг в базе данных');
      return;
    }

    for (const book of books) {
      if (!book.embedding || book.embedding.length === 0) {
        const response = await openai.embeddings.create({
          model: 'text-embedding-ada-002',
          input: `${book.title} ${book.description} ${book.genre.join(' ')}`,
        });
        await Book.findByIdAndUpdate(book._id, { embedding: response.data[0].embedding });
        console.log(`Эмбеддинг добавлен для книги: ${book.title}`);
      } else {
        console.log(`Эмбеддинг уже существует для книги: ${book.title}`);
      }
    }
    console.log('✅ Все эмбеддинги добавлены');
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB disconnected');
  }
}

addEmbeddings();
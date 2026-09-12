import mongoose from 'mongoose';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../.env') });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.resolve(__dirname, 'data');
const filePath = path.join(dataDir, 'books.json');

let books;
try {
  const raw = await readFile(filePath, 'utf-8');
  books = JSON.parse(raw);
} catch (err) {
  console.error('Не удалось прочитать или распарсить books.json:', err);
  process.exit(1);
}

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

mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/nis-kitap')
  .then(async () => {
    console.log('✅ MongoDB connected to nis-kitap');

    await Book.deleteMany({});
    console.log('✅ Коллекция books очищена');

    const normalizedBooks = books.map(book => ({
      ...book,
      genre: Array.isArray(book.genre) ? book.genre : [book.genre || ''],
    }));

    try {
      const inserted = await Book.insertMany(normalizedBooks);
      console.log(`📚 Imported ${inserted.length} books`);
    } catch (err) {
      console.error('❌ Ошибка при вставке данных:', err);
    } finally {
      mongoose.disconnect();
    }
  })
  .catch(err => {
    console.error('❌ Ошибка подключения к MongoDB:', err);
    process.exit(1);
  });
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const dataDir = path.resolve(__dirname, 'data');
const filePath = path.join(dataDir, 'books.json');

let books;
try {
  const raw = fs.readFileSync(filePath, 'utf-8');
  books = JSON.parse(raw);
} catch (err) {
  console.error('Не удалось прочитать или распарсить books.json:', err);
  process.exit(1);
}

const bookSchema = new mongoose.Schema({
  title: String,
  author: String,
  description: String,
  genre: String,
  year: String,
  copies: Number,
  language: String,
});
const Book = mongoose.model('Book', bookSchema);

mongoose.connect('mongodb://127.0.0.1:27017/booksdb', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(async () => {
    console.log('✅ MongoDB connected');

    await Book.deleteMany({});
    const inserted = await Book.insertMany(books);
    console.log(`📚 Imported ${inserted.length} books`);

    mongoose.disconnect();
  })
  .catch(err => {
    console.error('❌ Ошибка при импорте в MongoDB:', err);
    process.exit(1);
  });
const express = require('express');
const router = express.Router();

// Пример данных (замени на подключение к базе)
const books = [
  { _id: 1, title: 'Book 1', author: 'Author 1', genre: 'Фантастика', language: 'Русский' },
  // Добавь свои книги
];

router.get('/', (req, res) => {
  res.json(books);
});

router.get('/genre/:genre', (req, res) => {
  const { genre } = req.params;
  const filteredBooks = books.filter(book => book.genre === genre);
  res.json(filteredBooks);
});

router.get('/language/:language', (req, res) => {
  const { language } = req.params;
  const filteredBooks = books.filter(book => book.language === language);
  res.json(filteredBooks);
});

router.get('/search', (req, res) => {
  const { q } = req.query;
  const filteredBooks = books.filter(book =>
    book.title.toLowerCase().includes(q.toLowerCase()) ||
    book.author.toLowerCase().includes(q.toLowerCase())
  );
  res.json(filteredBooks);
});

module.exports = router;
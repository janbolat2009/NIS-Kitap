const express = require('express');
const router = express.Router();
const axios = require('axios');
require('dotenv').config();

router.post('/search', async (req, res) => {
  const { prompt } = req.body;
  try {
    const response = await axios.post('https://api.openai.com/v1/completions', {
      model: 'text-davinci-003',
      prompt: `Рекомендуй книги по запросу: ${prompt}. Верни в формате JSON: [{"title": "название", "author": "автор", "genre": "жанр"}]`,
      max_tokens: 200,
    }, {
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    });
    const books = JSON.parse(response.data.choices[0].text.trim());
    res.json({ books });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка обработки запроса к OpenAI' });
  }
});

module.exports = router;
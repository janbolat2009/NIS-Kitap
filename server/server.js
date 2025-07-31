const express = require('express');
const bookRoutes = require('./routes/books');
const openaiRoutes = require('./routes/openai');
require('dotenv').config();

const app = express();
app.use(express.json());

app.use('/api/books', bookRoutes);
app.use('/api/openai', openaiRoutes);

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
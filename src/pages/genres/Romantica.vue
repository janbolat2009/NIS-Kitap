<template>
  <div class="fantastica">
    <header class="header">
      <img src="@/img/vector-5.svg" alt="logo" class="logo" />
      <ul class="header-ul">
        <li @click="$router.push('/catalog')" class="back-btn">Назад</li>
      </ul>
    </header>
    <div class="books">
      <h2 class="books-h2">Книги жанра Романтика</h2>
      <div class="books-container">
        <div
          v-for="book in books"
          :key="book._id"
          class="book"
          @click="$router.push(`/book/${book._id}`)"
        >
          <h3 class="title">{{ book.title }}</h3>
          <div class="author-div"><img src="@/img/mdi_user.png" alt=""><p class="author">: {{ book.author }}</p></div>
          <div class="genre-book"><img src="@/img/tabler_books.png" alt=""><p class="genre-p">: {{ book.genre }}</p></div>
          <div class="year-div"><img src="@/img/iwwa_year.png" alt=""><p class="year">: {{ book.year }}</p></div>
          <div class="copia-div"><img src="@/img/dinkie-icons_copies.png" alt=""><p class="copia">: {{ book.copies }}</p></div>
        </div>
      </div>
      <p v-if="books.length === 0" class="text-center text-gray-500 mt-6">
        Книги не найдены. Проверь бэкенд на http://localhost:3000.
      </p>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'Romanrica',
  data() {
    return {
      books: [],
    };
  },
  mounted() {
    this.fetchBooks();
  },
  methods: {
    async fetchBooks() {
      try {
        const response = await axios.get('http://localhost:3000/books/genre/Романтика');
        this.books = response.data;
        console.log('Книги жанра Романтика загружены:', this.books);
      } catch (error) {
        console.error('Ошибка при загрузке книг:', error.message);
        if (error.response) {
          console.error('Ответ сервера:', error.response.data);
        } else if (error.request) {
          console.error('Запрос не отправлен:', error.request);
        }
      }
    },
  },
};
</script>

<style scoped>
.fantastica {
  background-color: #003060;
  min-height: 100vh;
  padding: 20px;
  color: #F6EEE1;
  overflow-x: hidden;
  animation: fadeIn 1s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

header {
  background-color: #003060;
  width: 100%;
  max-width: 1920px;
  position: fixed;
  top: 0px;
  left: 0px;
  right: 0px;
  z-index: 1000;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.3s ease;
}

header:hover {
  box-shadow: 0 5px 15px rgba(246, 238, 225, 0.2);
}

.header-ul {
  list-style: none;
  display: flex;
  align-items: center;
  margin-right: 120px;
}

.back-btn {
  margin: 0 30px;
  cursor: pointer;
  color: #F6EEE1;
  font-size: 18px;
  padding: 10px 20px;
  border: 2px solid #F6EEE1;
  border-radius: 25px;
  transition: all 0.4s ease;
}

.back-btn:hover {
  background-color: #F6EEE1;
  color: #003060;
  transform: rotate(5deg) scale(1.1);
  box-shadow: 0 5px 15px rgba(246, 238, 225, 0.3);
}

.logo {
  margin-left: 120px;
  margin-top: 20px;
  transition: all 0.3s ease;
}

.logo:hover {
  transform: scale(1.05) rotate(-5deg);
}

.books {
  width: 100%;
  display: block;
  position: relative;
  top: 100px;
}

.books-h2 {
  text-align: center;
  color: #F6EEE1;
  font-size: 40px;
  text-shadow: 1px 1px 5px rgba(246, 238, 225, 0.5);
  animation: pulse 1.5s infinite alternate;
}

@keyframes pulse {
  from { transform: scale(1); }
  to { transform: scale(1.02); }
}

.books-container {
  display: flex;
  justify-content: space-around;
  margin: 20px 120px;
  flex-wrap: wrap;
}

.book {
  background-color: rgba(246, 238, 225, 0.9);
  padding: 25px 30px;
  border-radius: 18px;
  margin-bottom: 60px;
  margin: 30px 12px;
  color: #003060;
  height: 230px;
  width: 200px;
  transition: all 800ms ease;
  text-align: center;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
  animation: slideUp 0.8s ease-out;
}

@keyframes slideUp {
  from { transform: translateY(50px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.book:hover {
  transform: scale(1.1) rotate(2deg);
  box-shadow: 0 8px 20px rgba(0, 48, 96, 0.4);
}

.title {
  font-size: clamp(18px, 4vw, 30px);
  margin-bottom: 20px;
  text-align: start;
  position: relative;
  left: -12px;
  color: #003060;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.author-div, .genre-book, .copia-div, .year-div {
  width: 100%;
  display: flex;
}

.author-div img, .genre-book img, .copia-div img, .year-div img {
  width: 24px;
  height: 24px;
  margin-right: 10px;
}

.author, .genre-p, .copia, .year {
  font-size: 18px;
}
</style>
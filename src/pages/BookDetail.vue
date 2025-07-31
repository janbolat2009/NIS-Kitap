<template>
  <div class="book-detail">
    <header class="header">
      <img src="@/img/vector-5.svg" alt="logo" class="logo" />
      <ul class="header-ul">
        <li @click="$router.push('/catalog')" class="back-btn">Назад</li>
      </ul>
    </header>
    <div class="book-container" v-if="book">
      <div class="cover-container">
        <img v-if="book.coverUrl" :src="book.coverUrl" alt="Обложка книги" class="cover-image" />
        <p v-else class="no-cover">Обложка отсутствует</p>
      </div>
      <h1 class="title">{{ book.title }}</h1>
      <div class="detail-row">
        <img src="@/img/mdi_user.png" alt="author"> <p>Автор: {{ book.author }}</p>
      </div>
      <div class="detail-row">
        <img src="@/img/tabler_books.png" alt="genre"> <p>Жанр: {{ book.genre }}</p>
      </div>
      <div class="detail-row">
        <img src="@/img/iwwa_year.png" alt="year"> <p>Год: {{ book.year }}</p>
      </div>
      <div class="detail-row">
        <img src="@/img/dinkie-icons_copies.png" alt="copies"> <p>Копий: {{ book.copies }}</p>
      </div>
      <div class="detail-row">
        <img src="@/img/language-icon.png" alt="language"> <p>Язык: {{ book.language }}</p>
      </div>
      <p class="description">Описание: {{ book.description }}</p>
    </div>
    <p v-else class="text-center text-gray-500 mt-6">Книга не найдена.</p>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'BookDetail',
  data() {
    return {
      book: null,
    };
  },
  mounted() {
    this.fetchBook();
  },
  methods: {
    async fetchBook() {
      try {
        const id = this.$route.params.id; // Предполагаем, что ID передаётся через маршрут
        const response = await axios.get(`http://localhost:3000/books/${id}`);
        this.book = response.data;
        console.log('Книга загружена:', this.book);
      } catch (error) {
        console.error('Ошибка при загрузке книги:', error.message);
      }
    },
  },
};
</script>

<style scoped>
.book-detail {
  background: linear-gradient(135deg, #F6EEE1 0%, #D7C8B8 100%);
  min-height: 100vh;
  padding: 20px;
  color: #003060;
  overflow-x: hidden;
  animation: fadeIn 1s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.header {
  background-color: #F6EEE1;
  width: 100%;
  max-width: 1920px;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-ul {
  list-style: none;
  display: flex;
  align-items: center;
}

.back-btn {
  margin: 0 120px;
  cursor: pointer;
  color: #003060;
  font-size: 18px;
  padding: 10px 20px;
  border: 2px solid #003060;
  border-radius: 25px;
  transition: all 0.4s ease;
}

.back-btn:hover {
  background-color: #003060;
  color: #F6EEE1;
  transform: rotate(5deg) scale(1.1);
  box-shadow: 0 5px 15px rgba(0, 48, 96, 0.3);
}

.logo {
  margin-left: 120px;
  margin-top: 20px;
  transition: all 0.3s ease;
}

.logo:hover {
  transform: scale(1.05) rotate(-5deg);
}

.book-container {
  max-width: 800px;
  margin: 150px auto 0;
  padding: 30px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  animation: slideUp 0.8s ease-out;
}

@keyframes slideUp {
  from { transform: translateY(50px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.cover-container {
  text-align: center;
  margin-bottom: 20px;
}

.cover-image {
  max-width: 300px;
  height: auto;
  border-radius: 15px;
  box-shadow: 0 5px 15px rgba(0, 48, 96, 0.2);
  transition: all 0.5s ease;
}

.cover-image:hover {
  transform: scale(1.05) rotate(2deg);
  box-shadow: 0 8px 20px rgba(0, 48, 96, 0.3);
}

.no-cover {
  font-size: 16px;
  color: #666;
  padding: 10px;
}

.title {
  font-size: 36px;
  margin-bottom: 20px;
  text-align: center;
  color: #003060;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.1);
  animation: pulse 1.5s infinite alternate;
}

@keyframes pulse {
  from { transform: scale(1); }
  to { transform: scale(1.02); }
}

.detail-row {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  padding: 5px 10px;
  background: rgba(246, 238, 225, 0.5);
  border-radius: 10px;
  transition: all 0.3s ease;
}

.detail-row:hover {
  transform: translateX(10px);
  background: rgba(246, 238, 225, 0.8);
}

.detail-row img {
  width: 24px;
  height: 24px;
  margin-right: 10px;
  filter: brightness(0.9);
  transition: all 0.3s ease;
}

.detail-row img:hover {
  filter: brightness(1.2) drop-shadow(0 0 5px #003060);
}

.detail-row p {
  font-size: 18px;
  color: #003060;
}

.description {
  font-size: 16px;
  line-height: 1.6;
  margin-top: 20px;
  padding: 15px;
  background: linear-gradient(90deg, #F6EEE1, #E0D1C1);
  border-radius: 15px;
  box-shadow: inset 0 2px 5px rgba(0, 0, 0, 0.1);
  animation: fadeInText 1s ease-in-out;
}

@keyframes fadeInText {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
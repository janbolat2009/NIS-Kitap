<template>
  <div class="book-detail">
    <header class="header">
      <img src="@/img/vector-5.svg" alt="logo" class="logo" @click="$router.push('/')"/>
      <h4 @click="this.$router.push('/catalog')" class="back-btn">Назад</h4>
    </header>

    <div class="book-container" v-if="book">
      <div class="cover-container">
        <img v-if="book.coverUrl" :src="book.coverUrl" alt="Обложка книги" class="cover-image" />
        <p v-else class="no-cover">Обложка отсутствует</p>
      </div>

      <h1 class="title">{{ book.title }}</h1>

      <div class="detail-row" v-for="key in dynamicBookDetails" :key="key">
  <img :src="getIcon(key)" :alt="key" class="detail-icon" />
  <p v-if="book[key]">
    {{ key === 'copies' ? `${key}: ${book[key]} коп.` :
       key === 'genre' ? `Жанр: ${book[key].join(', ')}` :
       `${key[0].toUpperCase() + key.slice(1)}: ${book[key]}` }}
  </p>
</div>

      <p class="description" v-if="book.description">
        Описание: {{ book.description }}
      </p>

      <button class="reserve-btn" @click="reserveBook">Забронировать</button>
    </div>

    <p v-else class="text-center text-gray-500 mt-6">Книга не найдена.</p>
  </div>
</template>

<script>
import axios from 'axios';

import authorIcon from '@/img/mdi_user.png';
import genreIcon from '@/img/tabler_books.png';
import yearIcon from '@/img/iwwa_year.png';
import copiesIcon from '@/img/dinkie-icons_copies.png';
import languageIcon from '@/img/language-icon.png';

export default {
  name: 'BookDetail',
  data() {
    return {
      book: null,
      bookDetails: ['author', 'genre', 'year', 'copies', 'language'],
    };
  },
  computed: {
    dynamicBookDetails() {
      return this.bookDetails.filter(key => key in this.book && this.book[key] !== undefined && this.book[key] !== null);
    },
  },
  mounted() {
    this.fetchBook();
  },
  methods: {
    async fetchBook() {
      try {
        const title = decodeURIComponent(this.$route.params.title);
        console.log('Ищем книгу по названию:', title);

        const response = await axios.get('http://localhost:3000/api/books');
        const books = response.data;

        this.book = books.find(b => b.title === title) || null;

        if (!this.book) {
          console.error('Книга не найдена в базе:', title);
        } else {
          console.log('Книга загружена:', this.book);
        }
      } catch (error) {
        console.error('Ошибка при загрузке книги:', error.message);
        this.book = null;
      }
    },
    reserveBook() {
      alert(`Книга "${this.book.title}" забронирована!`);
    },
    getIcon(key) {
      const icons = {
        author: authorIcon,
        genre: genreIcon,
        year: yearIcon,
        copies: copiesIcon,
        language: languageIcon,
      };
      return icons[key] || ''; 
    },
  },
};
</script>

<style scoped>
.book-detail {
  background: linear-gradient(135deg, #F6EEE1 0%, #D7C8B8 100%);
  min-height: 100vh;
  padding: 0; 
  color: #003060;
  overflow-x: hidden;
  animation: fadeIn 1s ease-in-out;
  width: 100%; 
  max-width: 100%; 
  box-sizing: border-box;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(2%); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes pulse {
  from { transform: scale(1); }
  to { transform: scale(1.02); }
}

@keyframes slideUp {
  from { transform: translateY(5%); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@keyframes fadeInText {
  from { opacity: 0; }
  to { opacity: 1; }
}

.header {
  background-color: #F6EEE1;
  width: 100%; 
  max-width: 1920px; 
  position: sticky;
  top: 0;
  z-index: 1000;
  padding: 2% 4%; 
  display: flex;
  justify-content: space-between; 
  align-items: center;
  box-shadow: 0 0.2vh 1vh rgba(0, 48, 96, 0.1);
  margin: 0 auto; 
  box-sizing: border-box; 
}

.logo {
  margin-left: 0;
  height: 10vh; 
  width: auto;
  min-width: 60px;
  transition: all 0.3s ease;
  cursor: pointer;
}

.logo:hover {
  transform: scale(1.05) rotate(-5deg);
}

.back-btn {
  margin: 0 1%; 
  cursor: pointer;
  color: #003060;
  font-size: 18px;; 
  padding: 10px 15px; 
  border-radius: 1.5rem; 
  transition: all 800ms ease;
}

.back-btn:hover {
  transform: scale(1.05); 
  box-shadow: 0 0.5vh 1.5vh rgba(0, 48, 96, 0.3);
}

.book-container {
  max-width: 50%;
  margin: 8vh auto 0;
  padding: 3%;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 2%;
  box-shadow: 0 1vh 3vh rgba(0, 0, 0, 0.2);
  animation: slideUp 0.8s ease-out;
}

.cover-container {
  text-align: center;
  margin-bottom: 3%;
}

.cover-image {
  max-width: 60%;
  height: auto;
  border-radius: 1.5%;
  box-shadow: 0 0.5vh 1.5vh rgba(0, 48, 96, 0.2);
  transition: all 0.5s ease;
}

.cover-image:hover {
  transform: scale(1.05) rotate(2deg);
  box-shadow: 0 0.8vh 2vh rgba(0, 48, 96, 0.3);
}

.no-cover {
  font-size: 1rem;
  color: #666;
  padding: 2%;
}

.title {
  font-size: 2.5rem;
  margin-bottom: 3%;
  text-align: center;
  color: #003060;
  text-shadow: 0.1rem 0.1rem 0.3rem rgba(0, 0, 0, 0.1);
  animation: pulse 1.5s infinite alternate;
  line-height: 1.2;
}

.detail-row {
  display: flex;
  align-items: center;
  margin-bottom: 2%;
  padding: 1% 2%;
  background: rgba(246, 238, 225, 0.5);
  border-radius: 1rem;
  transition: all 0.3s ease;
}

.detail-row:hover {
  transform: translateX(2%);
  background: rgba(246, 238, 225, 0.8);
}

.detail-row img {
  width: 2%;
  min-width: 1.5rem;
  height: auto;
  margin-right: 2%;
  filter: brightness(0.9);
  transition: all 0.3s ease;
}

.detail-row img:hover {
  filter: brightness(1.2) drop-shadow(0 0 0.5rem #003060);
}

.detail-row p {
  font-size: 1.2rem;
  color: #003060;
  margin: 0;
  word-wrap: break-word;
}

.description {
  font-size: 1rem;
  line-height: 1.6;
  margin-top: 3%;
  padding: 2.5%;
  background: linear-gradient(90deg, #F6EEE1, #E0D1C1);
  border-radius: 1.5rem;
  box-shadow: inset 0 0.2vh 0.5vh rgba(0, 0, 0, 0.1);
  animation: fadeInText 1s ease-in-out;
}

.reserve-btn {
  display: block;
  margin: 3% auto;
  padding: 1.5% 4%;
  background-color: #003060;
  color: #F6EEE1;
  border: none;
  border-radius: 2rem;
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.4s ease;
  min-width: 40%;
}

.reserve-btn:hover {
  transform: scale(1.1);
  background-color: #F6EEE1;
  color: #003060;
  border: 0.15rem solid #003060;
  box-shadow: 0 0.5vh 1.5vh rgba(0, 48, 96, 0.3);
}

.text-center {
  text-align: center;
  margin-top: 10vh;
  font-size: 1.2rem;
}
@media (min-width: 769px) {
  .header {
    padding: 2% 4%;
  }

  .logo {
    height: 10vh;
    min-width: 60px;
  }

  .back-btn {
    font-size: 1.2rem;
    padding: 10px 20px;
    min-width: 90px; 
  }
}
@media (max-width: 768px) {
  .book-detail {
    padding: 3%;
  }

  .header {
    padding: 3% 4%;
  }

  .logo {
    height: 3vh;
    min-height: 2rem;
  }

  .back-btn {
    margin: 0 2%;
    font-size: 1rem;
    padding: 2% 4%;
    min-width: 80px;
  }

  .back-btn:hover {
    transform: scale(1.05);
  }

  .book-container {
    max-width: 95%;
    margin-top: 5vh;
    padding: 5%;
    border-radius: 3%;
  }

  .cover-image {
    max-width: 80%;
    border-radius: 2%;
  }

  .cover-image:hover {
    transform: scale(1.02);
  }

  .title {
    font-size: 1.8rem;
    margin-bottom: 4%;
    line-height: 1.3;
  }

  .detail-row {
    margin-bottom: 3%;
    padding: 3% 4%;
    border-radius: 1.5rem;
    flex-wrap: wrap;
  }

  .detail-row:hover {
    transform: translateX(1%);
  }

  .detail-row img {
    width: 4%;
    min-width: 1.2rem;
    margin-right: 4%;
  }

  .detail-row p {
    font-size: 1rem;
    flex: 1;
    min-width: 80%;
  }

  .description {
    font-size: 0.9rem;
    margin-top: 4%;
    padding: 4%;
    border-radius: 2rem;
    line-height: 1.5;
  }

  .reserve-btn {
    font-size: 1rem;
    padding: 3% 6%;
    margin: 5% auto;
    min-width: 60%;
    border-radius: 2.5rem;
  }

  .reserve-btn:hover {
    transform: scale(1.02);
  }

  .text-center {
    margin-top: 8vh;
    font-size: 1rem;
    padding: 0 5%;
  }
}

@media (max-width: 480px) {
  .header {
    padding: 4% 3%;
  }

  .back-btn {
    font-size: 0.9rem;
    padding: 4% 6%;
  }

  .logo {
    height: 2.5vh;
    min-height: 1.8rem;
  }

  .book-container {
    margin-top: 4vh;
    padding: 6%;
  }

  .title {
    font-size: 1.5rem;
  }

  .detail-row {
    padding: 4% 3%;
  }

  .detail-row img {
    width: 6%;
    min-width: 1rem;
    margin-right: 5%;
  }

  .detail-row p {
    font-size: 0.9rem;
  }

  .description {
    font-size: 0.85rem;
    padding: 5%;
  }

  .reserve-btn {
    font-size: 0.95rem;
    padding: 4% 8%;
    min-width: 70%;
  }
}
</style>
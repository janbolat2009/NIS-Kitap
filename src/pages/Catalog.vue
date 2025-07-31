<template>
  <div class="catalog">
    <header class="header">
      <img src="@/img/Logotype.svg" alt="logo" class="logo" @click="this.$router.push('/')" />
      <ul class="header-ul">
        <li @click="$router.push('/')">Главная</li>
        <li class="main" @click="$router.push('/catalog')">Каталог</li>
        <li>О нас</li>
        <li v-if="!isLoggedIn">
          <button class="register-btn" @click="showRegister = true">Регистрация</button>
        </li>
        <li v-else class="profile-icon">
          <img src="@/img/mdi_user.png" alt="profile" @click="showProfile = true" />
        </li>
      </ul>
    </header>

    <div v-if="showRegister" class="modal-backdrop">
      <div class="modal-content">
        <button class="close-btn" @click="showRegister = false">×</button>
        <Register @registered="onRegistered" />
      </div>
    </div>

    <div v-if="showProfile" class="modal-backdrop">
      <div class="modal-content">
        <button class="close-btn" @click="showProfile = false">×</button>
        <Profile :email="userEmail" @back="showProfile = false" />
      </div>
    </div>

    <div class="genre-main">
      <h2>Жанры книг</h2>
      <div class="genre">
        <div class="genre-div" @click="this.$router.push('/fantastica')">
          <img src="@/img/Fantastic.png" alt="" class="Fantastic">
          <p>Фантастика</p>
        </div>
        <div class="genre-div" @click="this.$router.push('/fantasy')">
          <img src="@/img/mdi_fantasy.png" alt="" class="Fantasy">
          <p>Фэнтези</p>
        </div>
        <div class="genre-div" @click="this.$router.push('/detective')">
          <img src="@/img/ph_detective-fill.png" alt="" class="Detective">
          <p>Детектив</p>
        </div>
        <div class="genre-div" @click="this.$router.push('/adventure')">
          <img src="@/img/icons8_adventures.png" alt="" class="Adventure">
          <p>Приключения</p>
        </div>
        <div class="genre-div" @click="this.$router.push('/biography')">
          <img src="@/img/mdi_biography.png" alt="" class="Biography">
          <p>Биография</p>
        </div>
        <div class="genre-div" @click="this.$router.push('/romantica')">
          <img src="@/img/devicon-plain_love2d.png" alt="" class="Romantico">
          <p>Романтика</p>
        </div>
        <div class="genre-div" @click="this.$router.push('/poetry')">
          <img src="@/img/streamline-ultimate_playlist-songs-bold.png" alt="" class="poetry">
          <p>Поэзия</p>
        </div>
      </div>
    </div>

    <div class="lingua">
      <h2>Языки книг</h2>
      <div class="lingua-div">
        <img src="@/img/Group 20.png" alt="" class="lingua-img" @click="this.$router.push('/kazakh')">
        <img src="@/img/Group 21.png" alt="" class="lingua-img" @click="this.$router.push('/russian')">
        <img src="@/img/Group 22.png" alt="" class="lingua-img" @click="this.$router.push('/english')">
      </div>
    </div>

    <div class="search-bar">
      <div class="search-container" :class="{ 'active': searchQuery }">
        <button class="filter-btn" @click="toggleFilters">
          <img src="@/img/filter-icon.png" alt="Filter" />
        </button>
        <button class="sort-btn" @click="toggleSort">
          <img src="@/img/sort-icon.png" alt="Sort" />
        </button>
        <input
          v-model="searchQuery"
          @input="searchBooks"
          type="text"
          placeholder="Например: 451 градус по Фаренейту"
          class="AI-input"
        />
        <div class="divider"></div>
        <button class="search-btn" @click="searchBooks">
          <img src="@/img/material-symbols_search-rounded.png" alt="">
        </button>
      </div>
      <div v-if="showFilters" class="filter-panel">
        <button @click="filterByGenre">Фильтр по жанрам</button>
        <button @click="filterByLanguage">Фильтр по языкам</button>
      </div>
    </div>

    <div class="books">
      <h2 class="books-h2">Книги</h2>
      <div class="books-container">
        <div
          v-for="book in books"
          :key="book._id"
          class="book" @click="$router.push(`/book/${book._id}`)"
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
import Register from '../components/Register.vue';
import Profile from '../components/Profile.vue';

export default {
  name: 'Catalog',
  components: {
    Register,
    Profile,
  },
  data() {
    return {
      showRegister: false,
      showProfile: false,
      isLoggedIn: false,
      userEmail: '',
      books: [],
      searchQuery: '',
      genres: [
        'Фантастика', 'Фэнтези', 'Биография', 'Романтика', 'Детектив', 'Приключения',
      ],
      languages: ['Русский', 'Казахский', 'Английский'],
      showLanguages: false,
      showFilters: false,
    };
  },
  methods: {
    toggleRegisterModal() {
      this.showRegister = !this.showRegister;
    },
    onRegistered(payload) {
      this.userEmail = payload.email;
      localStorage.setItem('isLoggedIn', 'true');
      this.isLoggedIn = true;
      this.showRegister = false;
      this.showProfile = true;
    },
    openProfile() {
      this.showProfile = true;
    },
    closeProfile() {
      this.showProfile = false;
    },
    async fetchBooks() {
      try {
        const response = await axios.get('http://localhost:3000/api/books'); // Исправлено на /api/books
        this.books = response.data;
        console.log('Книги загружены:', this.books);
      } catch (error) {
        console.error('Ошибка при загрузке книг:', error.message);
        if (error.response) {
          console.error('Ответ сервера:', error.response.data);
        } else if (error.request) {
          console.error('Запрос не отправлен:', error.request);
        }
      }
    },
    async fetchBooksByGenre(genre) {
      try {
        if (genre) {
          const response = await axios.get(`http://localhost:3000/api/books/genre/${genre}`);
          this.books = response.data;
          console.log('Книги по жанру загружены:', this.books);
        } else {
          this.fetchBooks();
        }
      } catch (error) {
        console.error('Ошибка при фильтрации по жанру:', error.message);
        if (error.response) {
          console.error('Ответ сервера:', error.response.data);
        } else if (error.request) {
          console.error('Запрос не отправлен:', error.request);
        }
      }
    },
    async fetchBooksByLanguage(language) {
      try {
        if (language) {
          const response = await axios.get(`http://localhost:3000/api/books/language/${language}`);
          this.books = response.data;
          console.log('Книги по языку загружены:', this.books);
        } else {
          this.fetchBooks();
        }
      } catch (error) {
        console.error('Ошибка при фильтрации по языку:', error.message);
        if (error.response) {
          console.error('Ответ сервера:', error.response.data);
        } else if (error.request) {
          console.error('Запрос не отправлен:', error.request);
        }
      }
    },
    async searchBooks() {
      try {
        if (this.searchQuery) {
          const response = await axios.get(`http://localhost:3000/api/books/search?q=${encodeURIComponent(this.searchQuery)}`);
          this.books = response.data;
          console.log('Книги по поиску загружены:', this.books);
        } else {
          this.fetchBooks();
        }
      } catch (error) {
        console.error('Ошибка при поиске:', error.message);
        if (error.response) {
          console.error('Ответ сервера:', error.response.data);
        } else if (error.request) {
          console.error('Запрос не отправлен:', error.request);
        }
      }
    },
    toggleLanguages() {
      this.showLanguages = !this.showLanguages;
    },
    toggleFilters() {
      this.showFilters = !this.showFilters;
    },
    toggleSort() {
      this.books.sort((a, b) => a.title.localeCompare(b.title));
    },
    filterByGenre() {
      this.$router.push('/genres');
    },
    filterByLanguage() {
      this.$router.push('/languages');
    },
  },
  mounted() {
    this.isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    this.fetchBooks();
  },
};
</script>

<style>
.catalog {
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

.author-div, .genre-book, .copia-div, .year-div {
  width: 100%;
  display: flex;
}

.books {
  width: 100%;
  display: block;
  position: relative;
  top: 140px;
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

.AI-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 16px;
  color: #F6EEE1;
  padding: 10px 25px;
  transition: all 0.3s ease;
}

.AI-input:focus {
  transform: scale(1.02);
  box-shadow: 0 0 10px rgba(246, 238, 225, 0.3);
}

.divider {
  width: 2px;
  height: 24px;
  background-color: #F6EEE1;
  margin: 0 15px;
  position: relative;
  left: -6px;
  transition: all 0.3s ease;
}

.search-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  position: relative;
  left: -6px;
  transition: all 0.4s ease;
}

.search-btn img {
  width: 24px;
  height: 24px;
  transition: all 0.3s ease;
  filter: brightness(1.2);
}

.search-btn:hover img {
  transform: rotate(360deg) scale(1.2);
  filter: brightness(1.5) drop-shadow(0 0 5px #F6EEE1);
}

* {
  margin: 0;
  padding: 0;
  font-family: Arial, Helvetica, sans-serif;
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

.genre-main {
  position: relative;
  width: 100%;
  max-width: 1920px;
  text-align: center;
  top: 100px;
  animation: fadeIn 1s ease-in-out;
  position: relative;
  top: 150px;
}

.genre {
  display: flex;
  justify-content: space-between;
  color: #F6EEE1;
  margin: 0 120px;
  transition: opacity 2s ease-in;
}

.genre.visible {
  opacity: 1;
}

.genre-main h2 {
  display: block;
  color: #F6EEE1;
  margin-bottom: 80px;
  font-weight: 600;
  text-shadow: 1px 1px 5px rgba(246, 238, 225, 0.5);
}

.genre-div {
  transition: all 800ms ease;
  cursor: pointer;
  padding: 10px;
  border-radius: 10px;
  background: rgba(246, 238, 225, 0.2);
}

.genre-div:hover {
  transform: scale(1.1) rotate(-5deg);
  background: rgba(246, 238, 225, 0.4);
  box-shadow: 0 5px 15px rgba(246, 238, 225, 0.3);
}

.genre-div p {
  margin-top: 15px;
}

.header-ul {
  list-style: none;
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-right: 120px;
}

.header-ul li {
  margin: 0px 30px;
  cursor: pointer;
  color: #F6EEE1;
  transition: all 800ms ease;
  padding: 5px 10px;
  border-radius: 5px;
}

.header-ul li:hover {
  transform: scale(1.1) rotate(2deg);
  background-color: #F6EEE1;
  color: #003060;
  box-shadow: 0 3px 10px rgba(246, 238, 225, 0.2);
}

.register-btn {
  background-color: #F6EEE1;
  color: #003060;
  padding: 10px 20px;
  border-radius: 6px;
  border: 2px solid #F6EEE1;
  transition: all 0.3s;
}

.register-btn:hover {
  background-color: #003060;
  color: #F6EEE1;
  border: 2px solid #F6EEE1;
  transform: scale(1.05);
}

.lingua {
  position: relative;
  top: 100px;
  width: 100%;
  display: block;
  text-align: center;
  margin-top: 100px;
  margin-bottom: 130px;
  animation: slideUp 0.8s ease-out;
}

.lingua h2 {
  margin-bottom: 80px;
  color: #F6EEE1;
  text-shadow: 1px 1px 5px rgba(246, 238, 225, 0.5);
}

.lingua-div img {
  margin: 0px 20px;
  transition: all 800ms ease;
  cursor: pointer;
  border-radius: 10px;
  padding: 5px;
  background: rgba(246, 238, 225, 0.2);
}

.lingua-div img:hover {
  transform: scale(1.1) rotate(5deg);
  background: rgba(246, 238, 225, 0.4);
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

.search-bar {
  width: 100%;
  display: flex;
  justify-content: center;
  margin-top: 140px;
  padding: 20px;
  position: relative;
  top: 40px;
  animation: fadeIn 1s ease-in-out;
}

.search-container {
  display: flex;
  align-items: center;
  max-width: 600px;
  margin: 0 auto;
  background: rgba(246, 238, 225, 0.9);
  border-radius: 25px;
  padding: 5px;
  transition: all 0.3s;
  box-shadow: 0 2px 10px rgba(246, 238, 225, 0.2);
}

.search-container.active {
  box-shadow: 0 0 20px #F6EEE1;
  transform: scale(1.02);
}

.filter-btn, .sort-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 5px;
  margin: 0 5px;
}

.filter-btn img, .sort-btn img {
  width: 24px;
  height: 24px;
  transition: all 0.3s ease;
  filter: brightness(0.9);
  border-radius: 50%;
  background: rgba(246, 238, 225, 0.2);
}

.filter-btn:hover img {
  transform: scale(1.2) rotate(360deg);
  filter: brightness(1.2) drop-shadow(0 0 8px #F6EEE1);
  background: rgba(246, 238, 225, 0.4);
}

.sort-btn:hover img {
  transform: scale(1.2) rotate(-360deg);
  filter: brightness(1.2) drop-shadow(0 0 8px #F6EEE1);
  background: rgba(246, 238, 225, 0.4);
}

.filter-panel {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(246, 238, 225, 0.9);
  border-radius: 8px;
  padding: 10px;
  margin-top: 5px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}

.filter-panel button {
  display: block;
  width: 100%;
  padding: 5px 10px;
  margin: 5px 0;
  background: transparent;
  border: none;
  color: #003060;
  cursor: pointer;
}

.filter-panel button:hover {
  background: #F6EEE1;
  border-radius: 5px;
}

.main {
  font-weight: 600;
  font-size: 20px;
}

.modal-backdrop {
  position: fixed;
  top: 10px;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  animation: fadeIn 0.5s ease-in-out;
}

.modal-content {
  background: #F6EEE1;
  padding: 30px;
  border-radius: 12px;
  width: 900px;
  height: 600px;
  max-width: 90%;
  position: relative;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.8s ease-out;
}

.close-btn {
  position: absolute;
  top: 48px;
  right: 48px;
  background: transparent;
  font-size: 24px;
  border: none;
  cursor: pointer;
  color: #F6EEE1;
  z-index: 12000;
  transition: all 0.3s ease;
}

.close-btn:hover {
  transform: rotate(90deg) scale(1.2);
  color: #FF6B6B;
}
.books-h2 {
  position: relative;
  top: -50px;
}
</style>
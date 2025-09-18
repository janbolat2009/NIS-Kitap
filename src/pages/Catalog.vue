<template>
  <div class="catalog">
    
    <header class="header">
      <img src="@/img/Logotype.svg" alt="logo" class="logo" @click="$router.push('/')" />

      
      <ul class="header-ul desktop-nav">
        <li @click="$router.push('/')">Главная</li>
        <li class="main" @click="$router.push('/catalog')">Каталог</li>
        <li @click="$router.push('/about-us')">О нас</li>
        <li v-if="!isLoggedIn">
          <button class="register-btn" @click="showRegister = true">Регистрация</button>
        </li>
        <li v-else class="profile-icon">
          <img src="@/img/mdi_user_light.png" alt="profile" @click="showProfile = true" />
        </li>
      </ul>

      
      <div class="mobile-nav-toggle md:hidden">
  <button @click.stop="toggleMenu" class="burger-button">
    <span class="burger-icon">{{ isMenuOpen ? '✕' : '☰' }}</span>
  </button>
  <transition name="slide">
    <ul v-if="isMenuOpen" class="mobile-nav">
      <li @click="$router.push('/'); toggleMenu()">Главная</li>
      <li @click="$router.push('/catalog'); toggleMenu()" class="main">Каталог</li>
      <li @click="$router.push('/about-us'); toggleMenu()">О нас</li>
      <li v-if="!isLoggedIn">
        <button class="register-btn" @click="showRegister = true; toggleMenu()">Регистрация</button>
      </li>
      <li v-else class="profile-icon">
        <img src="@/img/mdi_user_light.png" alt="profile" @click="showProfile = true; toggleMenu()" />
      </li>
    </ul>
  </transition>
</div>
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

    
    <FilterModal
      v-model="showFilterModal"
      :genres="genres"
      :languages="languages"
      @submit="onFilterSubmit"
      @reset="resetFilters"
    />

    
    <div class="genre-main">
      <h2>Жанры книг</h2>
      <div class="genre">
        <div class="genre-div" @click="$router.push('/fantastica')">
          <img src="@/img/Fantastic.png" alt="Фантастика" class="Fantastic" />
          <p>Фантастика</p>
        </div>
        <div class="genre-div" @click="$router.push('/fantasy')">
          <img src="@/img/mdi_fantasy.png" alt="Фэнтези" class="Fantasy" />
          <p>Фэнтези</p>
        </div>
        <div class="genre-div" @click="$router.push('/detective')">
          <img src="@/img/ph_detective-fill.png" alt="Детектив" class="Detective" />
          <p>Детектив</p>
        </div>
        <div class="genre-div" @click="$router.push('/adventure')">
          <img src="@/img/icons8_adventures.png" alt="Приключения" class="Adventure" />
          <p>Приключения</p>
        </div>
        <div class="genre-div" @click="$router.push('/biography')">
          <img src="@/img/mdi_biography.png" alt="Биография" class="Biography" />
          <p>Биография</p>
        </div>
        <div class="genre-div" @click="$router.push('/romantica')">
          <img src="@/img/devicon-plain_love2d.png" alt="Романтика" class="Romantico" />
          <p>Романтика</p>
        </div>
        <div class="genre-div" @click="$router.push('/poetry')">
          <img src="@/img/streamline-ultimate_playlist-songs-bold.png" alt="Поэзия" class="poetry" />
          <p>Поэзия</p>
        </div>
      </div>
    </div>

    
    <div class="lingua">
      <h2>Языки книг</h2>
      <div class="lingua-div">
        <img src="@/img/Group 20.png" alt="Казахский" class="lingua-img" @click="$router.push('/kazakh')" />
        <img src="@/img/Group 21.png" alt="Русский" class="lingua-img" @click="$router.push('/russian')" />
        <img src="@/img/Group 22.png" alt="Английский" class="lingua-img" @click="$router.push('/english')" />
      </div>
    </div>

    
    <div class="search-container">
      <div class="input-with-icon">
        <img
          src="@/img/filter-icon.png"
          alt="Фильтр"
          class="filter-icon-input"
          @click="showFilterModal = true"
        />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Например: 451 градус по Фаренейту"
          class="AI-input"
          @input="searchBooks"
        />
      </div>
      <div class="divider"></div>
      <button class="search-btn" @click="searchBooks">
        <img src="@/img/material-symbols_search-rounded.png" alt="Поиск" />
      </button>
    </div>

    
    <div class="books">
      <h2 class="books-h2">Книги</h2>
      <div class="books-container">
        <div
          v-for="book in filteredBooks"
          :key="book._id"
          class="book"
          @click="$router.push(`/book/${encodeURIComponent(book.title)}`)"
        >
          <h3 class="title">{{ book.title }}</h3>
          <div class="author-div"><img src="@/img/mdi_user.png" alt="Автор" /><p class="author">: {{ book.author }}</p></div>
          <div class="genre-book">
          <img src="@/img/tabler_books.png" alt="Жанр" class="genre-icon"/>
          <p class="genre-text">: {{ book.genre.join(', ') }}</p>
          </div>
          <div class="year-div"><img src="@/img/iwwa_year.png" alt="Год" /><p class="year">: {{ book.year }}</p></div>
          <div class="copia-div"><img src="@/img/dinkie-icons_copies.png" alt="Копии" /><p class="copia">: {{ book.copies }}</p></div>
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
import FilterModal from '@/components/FilterModal.vue';
export default {
  name: 'Catalog',
  components: {
    Register,
    Profile,
    FilterModal
  },
  data() {
    return {
      showRegister: false,
      showProfile: false,
      isLoggedIn: false,
      userEmail: '',
      allBooks: [],
      isMenuOpen: false,
      books: [],
      searchQuery: '',
      showFilters: false,
      activeGenre: '',
      activeLanguage: '',
      genres: [
        'Фантастика', 'Фэнтези', 'Биография', 'Романтика', 'Детектив', 'Приключения', 'Поэзия',
      ],
      languages: ['Русский', 'Казахский', 'Английский'],
      showLanguages: false,
      showFilters: false,
      showFilterModal: false
    };
  },
  computed: {
    filteredBooks() {
    return this.allBooks.filter(book => {
      const matchesGenre = !this.activeGenre || book.genre === this.activeGenre;

      const matchesLanguage = !this.activeLanguage || book.language === this.activeLanguage;

      const query = this.searchQuery.toLowerCase();
      const matchesSearch = !query || 
        book.title.toLowerCase().includes(query) || 
        book.author.toLowerCase().includes(query);

      return matchesGenre && matchesLanguage && matchesSearch;
    });
  }
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
        const response = await axios.get('http://localhost:3000/api/books'); 
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
    toggleMenu(event) {
      if (event) event.stopPropagation();
      this.isMenuOpen = !this.isMenuOpen;
      if (this.isMenuOpen) {
        this.$nextTick(() => {
          document.addEventListener('click', this.closeMenuOnOutsideClick);
        });
      } else {
        document.removeEventListener('click', this.closeMenuOnOutsideClick);
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
    toggleFilter(type, value) {
    if (type === 'genre') {
      this.activeGenre = this.activeGenre === value ? '' : value;
    } else if (type === 'language') {
      this.activeLanguage = this.activeLanguage === value ? '' : value;
    }
  },
   resetFilters() {
    this.activeGenre = '';
    this.activeLanguage = '';
    this.searchQuery = '';
  },
    toggleLanguages() {
      this.showLanguages = !this.showLanguages;
    },
    toggleFilters() {
      this.showFilters = !this.showFilters;
    },
    async fetchAllBooks() {
    try {
      const response = await axios.get('http://localhost:3000/api/books');
      this.allBooks = response.data;
    } catch (error) {
      console.error('Ошибка при загрузке книг:', error);
      this.allBooks = [];
    }
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
    closeMenuOnOutsideClick(event) {
      const menu = document.querySelector('.mobile-nav');
      const button = document.querySelector('.burger-button');
      if (menu && !menu.contains(event.target) && !button.contains(event.target)) {
        this.isLoggedIn.value = false; 
        this.isMenuOpen = false; 
        document.removeEventListener('click', this.closeMenuOnOutsideClick);
      }
    },
onFilterSubmit(filters) {
  this.activeGenre = filters.genre;
  this.activeLanguage = filters.language;
  this.searchBooks(); 
}
  },
  mounted() {
    this.isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    this.fetchBooks();
    this.fetchAllBooks();
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
.search-section {
  display: flex;
  align-items: center;
  max-width: 600px;
  margin: 0 auto 20px;
  border: 2px solid #003060;
  border-radius: 30px;
  overflow: hidden;
  background: white;
}

.AI-input {
  flex: 1;
  padding: 12px 16px;
  border: none;
  outline: none;
  font-size: 16px;
}

.divider {
  width: 1px;
  height: 24px;
  background: #003060;
}

.search-btn {
  background: none;
  border: none;
  padding: 12px;
  cursor: pointer;
}

.search-btn img {
  width: 24px;
  height: 24px;
}
.filter-toggle {
  width: 100%;
  display: flex;
  justify-content: center;
}
.filter-btn {
  font-size: 14px;
  padding: 8px 16px; 
  background: #003060;
  color: #f6eee1;
  border: none;
  border-radius: 20px; 
  cursor: pointer;
  margin-bottom: 10px;
  transition: all 0.3s ease, box-shadow 0.3s ease; 
  box-shadow: 0 2px 6px rgba(0, 48, 96, 0.15); 
  position: relative; 
  overflow: hidden; 
  width: 10%;
}

.filter-btn:hover {
  background: #004a8c; 
  transform: scale(1.05); 
  box-shadow: 0 4px 12px rgba(0, 48, 96, 0.25); 
}

.filter-btn::after {
  content: '';
  position: absolute;
  width: 0;
  height: 0;
  background: rgba(246, 238, 225, 0.3); 
  border-radius: 50%;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  transition: width 0.4s ease, height 0.4s ease;
  z-index: 0; 
}

.filter-btn:hover::after {
  width: 200px; 
  height: 200px;
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

.genre-icon {
  width: 24px;
  height: 24px;
  margin-right: 2vw;
  filter: brightness(0.8);
  flex-shrink: 0; 
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
    margin-left: auto; 
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
  justify-content: center;
  max-width: 600px;
  margin: 0 auto 20px;
  border: 2px solid #003060;
  border-radius: 30px;
  overflow: hidden;
  background: white;
  position: relative;
}

.input-with-icon {
  display: flex;
  align-items: center;
  flex: 1;
  position: relative;
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
.filter-icon-input {
  width: 20px;
  height: 20px;
  margin-left: 12px;
  margin-right: 8px;
  cursor: pointer;
  opacity: 0.7;
  transition: all 0.3s ease;
  z-index: 2;
}

.filter-icon-input:hover {
  opacity: 1;
  transform: scale(1.1);
}
.AI-input {
  flex: 1;
  padding: 12px 16px;
  padding-left: 8px; 
  border: none;
  outline: none;
  font-size: 16px;
  background: transparent;
  z-index: 1;
}

.divider {
  width: 1px;
  height: 24px;
  background: #003060;
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
.search-btn {
  background: none;
  border: none;
  padding: 12px;
  cursor: pointer;
}

.search-btn img {
  width: 24px;
  height: 24px;
  filter: brightness(0.9);
  transition: all 0.3s ease;
}

.search-btn:hover img {
  filter: brightness(1.2);
  transform: rotate(10deg);
}

.filter-panel {
  position: absolute;
  top: 97%;
  left: 25%;
  transform: translateX(-50%);
  background: rgba(246, 238, 225, 0.9);
  border-radius: 8px;
  padding: 10px;
  margin-top: 5px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
  z-index: 2000;
  color:#003060;
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
@media (max-width: 768px) {
    * {
        box-sizing: border-box;
    }
    .desktop-nav {
        display: none;
    }
    .catalog {
        padding: 0;
        width: 100%;
        min-height: 100vh;
        overflow-x: hidden;
    }
    .mobile-nav-toggle {
        display: block;
    }

    .burger-button {
        background: transparent;
        border: none;
        cursor: pointer;
        padding: 2vw;
        z-index: 3000;
        position: relative;
    }

    .burger-icon {
        font-size: 6vw;
        color: #F6EEE1;
        font-weight: bold;
        display: block;
        transition: all 0.3s ease;
    }

    .mobile-nav {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100vh;
        background: #003060;
        padding: 20vw 5vw 10vw 5vw;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-start;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
        z-index: 2500;
        list-style: none;
        margin: 0;
        gap: 6vw;
    }

    .mobile-nav li {
        color: #F6EEE1;
        font-size: 5vw;
        cursor: pointer;
        transition: all 0.3s ease;
        padding: 3vw 6vw;
        border-radius: 2vw;
        text-align: center;
        width: 100% !important;
        max-width: 300px !important;
    }

    .mobile-nav li:hover {
        background-color: #F6EEE1;
        color: #003060;
        transform: scale(1.05);
    }

    .mobile-nav .register-btn {
        background-color: #F6EEE1;
        color: #003060;
        padding: 4vw 8vw;
        font-size: 4vw;
        border-radius: 2vw;
        border: none;
        width: 100%;
        max-width: 250px;
    }

    .mobile-nav .register-btn:hover {
        background-color: #003060;
        color: #F6EEE1;
        border: 2px solid #F6EEE1;
    }

    .slide-enter-active,
    .slide-leave-active {
        transition: transform 0.3s ease;
    }

    .slide-enter-from,
    .slide-leave-to {
        transform: translateY(-100%);
    }

    .slide-enter-to,
    .slide-leave-from {
        transform: translateY(0);
    }



    header {
        width: 100%;
        padding: 4vw;
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 1000;
        display: flex;
        justify-content: space-between;
        align-items: center;
        background-color: #003060;
    }

    .logo {
        width: 15vw;
        max-width: 120px;
        margin: 0;
        transition: transform 0.3s ease;
    }

    .logo:hover {
        transform: scale(1.05);
    }

    .header-ul {
        display: none; 
    }

    .mobile-nav-toggle {
        display: block;
    }

    .burger-button {
        background: transparent;
        border: none;
        font-size: 8vw;
        color: #F6EEE1;
        cursor: pointer;
        padding: 2vw;
    }

    .mobile-nav {
        position: fixed;
        top: 20vw;
        left: 0;
        right: 0;
        background: #003060;
        padding: 5vw;
        display: flex;
        flex-direction: column;
        align-items: center;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
        z-index: 999;
    }

    .mobile-nav li {
        margin: 3vw 0;
        color: #F6EEE1;
        font-size: 4vw;
        cursor: pointer;
        padding: 3vw 5vw;
        width: 100%;
        text-align: center;
        transition: all 0.3s ease;
        border-radius: 2vw;
        list-style: none;
    }

    .mobile-nav li:hover {
        background-color: #F6EEE1;
        color: #003060;
    }

    .mobile-nav .register-btn {
        background-color: #F6EEE1;
        color: #003060;
        padding: 3vw 6vw;
        border-radius: 2vw;
        border: none;
        font-size: 4vw;
        width: auto;
    }

    
    .genre-main {
        width: 100%;
        padding: 5vw;
        margin-top: 25vw;
        position: static;
        top: auto;
        text-align: center;
    }

    .genre-main h2 {
        font-size: 6vw;
        margin-bottom: 8vw;
        font-weight: 600;
        color: #F6EEE1;
    }

    .genre {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 4vw;
        margin: 0;
        justify-items: center;
    }

    .genre-div {
        width: 100%;
        max-width: 35vw;
        text-align: center;
        padding: 4vw;
        border-radius: 3vw;
        background: rgba(246, 238, 225, 0.2);
        transition: all 0.3s ease;
        cursor: pointer;
    }

    .genre-div:hover {
        transform: scale(1.05);
        background: rgba(246, 238, 225, 0.4);
    }

    .genre-div img {
        width: 60%;
        height: auto;
        margin-bottom: 2vw;
    }

    .genre-div p {
        font-size: 3vw;
        margin: 0;
        color: #F6EEE1;
    }
    .genre-div:nth-child(7) {
        grid-column: span 2;
        max-width: 35vw;
        margin: 0 auto;
    }

    .lingua {
        width: 100%;
        padding: 5vw;
        margin: 10vw 0;
        position: static;
        top: auto;
        text-align: center;
    }

    .lingua h2 {
        font-size: 6vw;
        margin-bottom: 8vw;
        color: #F6EEE1;
        font-weight: 600;
    }

    .lingua-div {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 4vw;
        justify-items: center;
        align-items: center;
    }

    .lingua-div img {
        width: 100%;
        max-width: 25vw;
        height: auto;
        margin: 0;
        padding: 2vw;
        border-radius: 2vw;
        background: rgba(246, 238, 225, 0.2);
        transition: all 0.3s ease;
        cursor: pointer;
    }

    .lingua-div img:hover {
        transform: scale(1.05);
        background: rgba(246, 238, 225, 0.4);
    }

    .lingua-div img:last-child {
        grid-column: span 2;
        max-width: 25vw;
    }

    .search-bar {
        width: 100%;
        padding: 5vw;
        margin: 8vw 0;
        position: static;
        top: auto;
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .search-container {
        width: 100%;
        max-width: none;
        display: flex;
        align-items: center;
        background: rgba(246, 238, 225, 0.9);
        border-radius: 3vw;
        padding: 2vw;
        margin: 0;
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
        padding: 2vw;
        margin: 0 1vw;
    }

    .filter-btn img, .sort-btn img {
        width: 6vw;
        height: 6vw;
        transition: all 0.3s ease;
        filter: brightness(0.8);
        border-radius: 50%;
        background: rgba(0, 48, 96, 0.2);
        padding: 1vw;
    }

    .filter-btn:hover img, .sort-btn:hover img {
        transform: scale(1.1);
        filter: brightness(1);
        background: rgba(0, 48, 96, 0.4);
    }

    .AI-input {
        flex: 1;
        border: none;
        outline: none;
        background: transparent;
        font-size: 4vw;
        color: #003060;
        padding: 2vw;
        transition: all 0.3s ease;
    }

    .AI-input::placeholder {
        color: rgba(0, 48, 96, 0.7);
        font-size: 3.5vw;
    }

    .AI-input:focus {
        transform: scale(1.01);
    }

    .divider {
        width: 0.5vw;
        height: 6vw;
        background-color: #003060;
        margin: 0 2vw;
    }

    .search-btn {
        background: transparent;
        border: none;
        cursor: pointer;
        padding: 1vw;
    }

    .search-btn img {
        width: 6vw;
        height: 6vw;
        transition: all 0.3s ease;
        filter: brightness(0.8);
    }

    .search-btn:hover img {
        transform: rotate(360deg) scale(1.1);
        filter: brightness(1);
    }

    .filter-panel {
        position: static;
        transform: none;
        width: 100%;
        background: rgba(246, 238, 225, 0.9);
        border-radius: 2vw;
        padding: 4vw;
        margin-top: 3vw;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }

    .filter-panel button {
        display: block;
        width: 100%;
        padding: 3vw;
        margin: 2vw 0;
        background: transparent;
        border: none;
        color: #003060;
        cursor: pointer;
        font-size: 4vw;
        border-radius: 2vw;
        transition: all 0.3s ease;
    }

    .filter-panel button:hover {
        background: #F6EEE1;
        transform: scale(1.02);
    }

    .books {
        width: 100%;
        padding: 5vw;
        position: static;
        top: auto;
        margin: 5vw 0;
    }

    .books-h2 {
        text-align: center;
        color: #F6EEE1;
        font-size: 6vw;
        margin-bottom: 8vw;
        position: static;
        top: auto;
    }

    .books-container {
        width: 100%;
        padding: 0;
        justify-content: center;
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 4vw;
        margin: 0;
        justify-items: center;
        position: relative;
        left: -1vw;
    }

    .book {
        background-color: rgba(246, 238, 225, 0.9);
        padding: 4vw;
        border-radius: 3vw;
        margin: 0;
        color: #003060;
        width: calc(50%-2vw);
        margin: 0vw;
        max-width: none;
        height: auto;
        min-height: 50vw;
        transition: all 0.3s ease;
        text-align: start;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        cursor: pointer;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
    }

    .book:hover {
        transform: scale(1.03);
        box-shadow: 0 4px 15px rgba(0, 48, 96, 0.2);
    }

    .title {
        font-size: 3.5vw;
        margin-bottom: 3vw;
        text-align: start;
        position: static;
        left: auto;
        color: #003060;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-box-orient: vertical;
        white-space: normal;
        line-height: 1.2;
        font-weight: 600;
    }

    .author-div, .genre-book, .copia-div, .year-div {
        width: 100%;
        display: flex;
        align-items: center;
        margin: 1.5vw 0;
    }

    .author-div img, .genre-book img, .copia-div img, .year-div img {
        width: 4vw;
        height: 4vw;
        margin-right: 2vw;
        filter: brightness(0.8);
    }

    .author, .genre-text, .copia, .year {
        font-size: 3vw;
        margin: 0;
        color: #003060;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        flex: 1;
        text-align: left; 
        padding-left: 0.5vw;
    }

    .text-center {
        text-align: center;
        color: #F6EEE1;
        font-size: 4vw;
        margin: 10vw 0;
        padding: 5vw;
    }

    .modal-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        padding: 5vw;
    }

    .modal-content {
        background: #F6EEE1;
        padding: 6vw;
        border-radius: 3vw;
        width: 100%;
        max-width: 90vw;
        height: auto;
        max-height: 80vh;
        overflow-y: auto;
        position: relative;
        box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
    }

    .close-btn {
        position: absolute;
        top: 3vw;
        right: 3vw;
        background: transparent;
        font-size: 6vw;
        border: none;
        cursor: pointer;
        color: #003060;
        z-index: 12000;
        transition: all 0.3s ease;
    }

    .close-btn:hover {
        transform: rotate(90deg) scale(1.2);
        color: #FF6B6B;
    }

    @media (max-width: 480px) {
        .books-container {
          width: 100%;
          justify-content: space-evenly;
    grid-template-columns: repeat(2, 1fr);
    gap: 4vw;
}

.book {
    max-width: 45vw;
    min-height: 55vw;
}

        .genre {
    grid-template-columns: repeat(2, 1fr);
    gap: 4vw;
}

.genre-div {
    max-width: 42vw;
}



        .lingua-div img:last-child {
            grid-column: span 1;
        }

        .title {
            font-size: 4vw;
        }

        .author, .genre-text, .copia, .year {
            font-size: 3.5vw;
        }

        .search-container {
          width: 70%;
          max-width: 70%;
          margin: 0 auto;
            flex-direction: column;
            gap: 3vw;
            padding: 4vw;
        }

        .AI-input {
            width: 100%;
            text-align: center;
            font-size: 4.5vw;
        }

        .divider {
            width: 80%;
            height: 0.5vw;
            margin: 2vw 0;
        }

        .filter-btn, .sort-btn, .search-btn {
            display: flex;
            align-items: center;
            justify-content: center;
        }
    }

    @keyframes slideInFromBottom {
        from {
            transform: translateY(50px);
            opacity: 0;
        }
        to {
            transform: translateY(0);
            opacity: 1;
        }
    }

    .book {
        animation: slideInFromBottom 0.6s ease-out;
    }

    .book:nth-child(even) {
        animation-delay: 0.1s;
    }

    .book:nth-child(odd) {
        animation-delay: 0.2s;
    }

    .profile-icon {
        display: none;
    }

    .books-h2, .genre-main h2, .lingua h2 {
        text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
    }

    .book, .genre-div, .lingua-div img {
        -webkit-tap-highlight-color: transparent;
        user-select: none;
    }

    .book, .genre-div, .lingua-div img, .search-container {
        will-change: transform;
    }
    .lingua-div {
    grid-template-columns: repeat(3, 1fr);
    gap: 3vw;
    justify-items: center;
    align-items: center;
}

.lingua-div img {
    max-width: 25vw;
    height: 15vw;
    object-fit: contain;
    padding: 2vw;
    background: rgba(246, 238, 225, 0.2);
    border-radius: 2vw;
}
}
</style>
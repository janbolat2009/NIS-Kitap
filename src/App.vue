<template>
  <div class="main-app">
    <header class="header">
      <img src="./img/Logotype.svg" alt="Логотип NIS Kitap" class="logo" @click="$router.push('/')"/>
      <ul class="header-ul desktop-nav">
        <li class="main" @click="$router.push('/')">Главная</li>
        <li @click="$router.push('/catalog')">Каталог</li>
        <li @click="$router.push('/about-us')">О нас</li>
        <li v-if="!isLoggedIn">
          <button class="register-btn" @click="showRegister = true">Регистрация</button>
        </li>
        <li v-else class="profile-icon">
          <img src="./img/mdi_user_light.png" alt="Профиль" @click="showProfile = true" />
        </li>
      </ul>
      <div class="mobile-nav-toggle md:hidden">
        <button @click.stop="toggleMenu" class="burger-button">
          <span class="burger-icon">{{ isMenuOpen ? '✕' : '☰' }}</span>
        </button>
        <transition name="slide">
          <ul v-if="isMenuOpen" class="mobile-nav">
            <li class="main" @click="$router.push('/'); toggleMenu()">Главная</li>
            <li @click="$router.push('/catalog'); toggleMenu()">Каталог</li>
            <li @click="$router.push('/about-us'); toggleMenu()">О нас</li>
            <li v-if="!isLoggedIn">
              <button class="register-btn" @click="showRegister = true; toggleMenu()">Регистрация</button>
            </li>
            <li v-else class="profile-icon">
              <img src="./img/mdi_user_light.png" alt="Профиль" @click="showProfile = true; toggleMenu()" />
            </li>
          </ul>
        </transition>
      </div>
    </header>

    <div v-if="showRegister" class="modal-backdrop" @click="closeModal('showRegister')">
      <div class="modal-content" @click.stop>
        <button class="close-btn" @click="showRegister = false">×</button>
        <Register @registered="onRegistered" @loggedIn="onLoggedIn" />
      </div>
    </div>

<div v-if="showProfile" class="profile-modal-backdrop" @click="closeModal('showProfile')">
  <div class="profile-modal-content" @click.stop>
    <button class="profile-close-btn" @click="showProfile = false">×</button>
    <Profile :email="userEmail" :name="userName" @back="showProfile = false" />
  </div>
</div>

    <div v-if="showSearchResults" class="modal-backdrop" @click="closeModal('showSearchResults')">
      <div class="modal-content" @click.stop>
        <button class="close-btn" @click="showSearchResults = false">×</button>
        <SearchResults :results="searchResults" @book-click="goToBookDetail" />
      </div>
    </div>

    <img src="./img/Ellipse 1.png" alt="Декоративный эллипс" class="Ellipse">
    <div class="welcome-div">
      <div class="welcome">
        <h1>Добро пожаловать в NIS Kitap</h1>
        <h4>Здесь собраны все книги нашей школы в одном удобном цифровом каталоге. Искать книги по жанрам, языкам и интересам стало проще — воспользуйся умным поиском на базе искусственного интеллекта, чтобы быстро найти именно то, что тебе нужно. Забронируй понравившуюся книгу онлайн, следи за сроками возврата и всегда будь в курсе своих задолженностей. Читай и учись с комфортом вместе с NIS Kitap — библиотекой нового поколения!</h4>
        <button class="ai-find" id="ai-find" @click="searchBooks">Найти книгу с ИИ</button>
      </div>
      <img src="./img/publicLibrary.png" alt="Иллюстрация библиотеки" class="publicLibrary">
    </div>

    <div class="AI-books" id="part1">
      <h3 class="AI-text">Введи свои пожелания — жанр, автора, язык или тему — и наш ИИ подберёт книги, идеально подходящие именно тебе.</h3>
      <div class="search-container">
        <input type="text" v-model="searchQuery" placeholder="Например: Хочу книги про катастрофы" class="AI-input">
        <div class="divider"></div>
        <button class="search-btn" @click="searchBooks">
          <img src="./img/material-symbols_search-rounded.png" alt="Поиск">
        </button>
      </div>
      <button class="AI-btn" @click="searchBooks">Найти книгу с ИИ</button>
    </div>

    <img src="./img/line-2.svg" alt="Разделитель" class="line-1">

    <div class="genre-main" id="part2">
      <h2>Жанры книг</h2>
      <div class="genre">
        <div class="genre-div" @click="$router.push('/fantastica')">
          <img src="./img/Fantastic.png" alt="Фантастика" class="Fantastic">
          <p>Фантастика</p>
        </div>
        <div class="genre-div" @click="$router.push('/fantasy')">
          <img src="./img/mdi_fantasy.png" alt="Фэнтези" class="Fantasy">
          <p>Фэнтези</p>
        </div>
        <div class="genre-div" @click="$router.push('/detective')">
          <img src="./img/ph_detective-fill.png" alt="Детектив" class="Detective">
          <p>Детектив</p>
        </div>
        <div class="genre-div" @click="$router.push('/adventure')">
          <img src="./img/icons8_adventures.png" alt="Приключения" class="Adventure">
          <p>Приключения</p>
        </div>
        <div class="genre-div" @click="$router.push('/biography')">
          <img src="./img/mdi_biography.png" alt="Биография" class="Biography">
          <p>Биография</p>
        </div>
        <div class="genre-div" @click="$router.push('/romantica')">
          <img src="./img/devicon-plain_love2d.png" alt="Романтика" class="Romantico">
          <p>Романтика</p>
        </div>
        <div class="genre-div" @click="$router.push('/poetry')">
          <img src="./img/streamline-ultimate_playlist-songs-bold.png" alt="Поэзия" class="poetry">
          <p>Поэзия</p>
        </div>
      </div>
    </div>

    <div class="cream">
      <div class="lingua" id="part3">
        <h2>Языки книг</h2>
        <div class="lingua-div">
          <img src="./img/Group 17.png" alt="Казахский" class="lingua-img" @click="$router.push('/kazakh')">
          <img src="./img/Group 18.png" alt="Русский" @click="$router.push('/russian')">
          <img src="./img/Group 19.png" alt="Английский" @click="$router.push('/english')">
        </div>
      </div>
      <img src="./img/line-3.svg" alt="Разделитель" class="line-3">
      <div class="bestsellers" id="part4">
        <h2>Бестселлеры</h2>
        <div class="best-main">
          <div class="best-div"></div>
          <div class="best-div"></div>
          <div class="best-div"></div>
          <div class="best-div"></div>
          <div class="best-div"></div>
          <div class="best-div"></div>
        </div>
      </div>
    </div>

    <div class="about-us">
      <div class="about-text">
        <h2>О нас</h2>
        <h4>NIS Kitap — это современная онлайн-библиотека для школьников и учителей, созданная учениками для учеников. Наша цель — сделать чтение и поиск информации максимально удобными, интересными и доступными для каждого.</h4>
      </div>
      <img src="./img/illustra 1.png" alt="Иллюстрация о нас" class="about-img">
    </div>

    <img src="./img/Ellipse 12.png" alt="Декоративный эллипс" class="Ellipse-2">

    <footer>
      <div class="footer-left">
        <p @click="$router.push('/catalog')">Главная</p>
        <p><a href="#part1">Найти книгу с ИИ</a></p>
        <p @click="$router.push('/catalog')">Каталог</p>
        <p><a href="#part2">Жанры книг</a></p>
        <p><a href="#part3">Языки книг</a></p>
        <p><a href="#part4">Бестселлеры</a></p>
        <p @click="$router.push('/about-us')">О нас</p>
        <p @click="$router.push('/register')">Регистрация</p>
      </div>
      <div class="footer-right">
        <div class="footer-right-contacts">
          <p>Контакты:</p>
          <div>
            <p>janbolatique.kz@gmail.com</p>
            <img src="./img/ic_baseline-email.png" alt="Email" class="email">
          </div>
          <div>
            <p>+7 700 757 5481</p>
            <img src="./img/ic_baseline-phone.png" alt="Телефон" class="phone">
          </div>
        </div>
        <div class="footer-right-social">
          <p>Социальные сети:</p>
          <div>
            <p>niskitap</p>
            <img src="./img/mdi_instagram.png" alt="Instagram" class="insta">
          </div>
          <div>
            <p>niskitap</p>
            <img src="./img/mingcute_telegram-fill.png" alt="Telegram" class="telegram">
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script>
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import Register from './components/Register.vue';
import Profile from './components/Profile.vue';
import SearchResults from './components/SearchResults.vue';
import axios from 'axios';
import { useRouter } from 'vue-router';
import { ref, onMounted, onUnmounted } from 'vue';

export default {
  name: 'App',
  components: {
    Register,
    Profile,
    SearchResults,
  },
  setup() {
    const router = useRouter();
    const isLoggedIn = ref(!!localStorage.getItem('user'));
    const userEmail = ref('');
    const userName = ref('');
    const showRegister = ref(false);
    const showProfile = ref(false);
    const isMenuOpen = ref(false);
    const showSearchResults = ref(false);
    const searchQuery = ref('');
    const searchResults = ref([]);

    onMounted(() => {
      const auth = getAuth();
      onAuthStateChanged(auth, (user) => {
        if (user) {
          isLoggedIn.value = true;
          userEmail.value = user.email || '';
          userName.value = user.displayName || '';
          localStorage.setItem('user', JSON.stringify({
            email: userEmail.value,
            name: userName.value,
            avatar: '',
          }));
          console.log('Пользователь авторизован:', userEmail.value);
        } else {
          isLoggedIn.value = false;
          userEmail.value = '';
          userName.value = '';
          localStorage.removeItem('user');
          console.log('Пользователь не авторизован');
        }
      });
    });

    const onRegistered = (payload) => {
      console.log('Событие регистрации:', payload);
      if (payload?.email && payload?.name) {
        userEmail.value = payload.email;
        userName.value = payload.name;
        isLoggedIn.value = true;
        showRegister.value = false;
        showProfile.value = true;
      } else {
        console.error('Неверные данные регистрации:', payload);
        isLoggedIn.value = false;
      }
    };

    const onLoggedIn = (payload) => {
      console.log('Событие входа:', payload);
      if (payload?.email && payload?.name) {
        userEmail.value = payload.email;
        userName.value = payload.name;
        isLoggedIn.value = true;
        showRegister.value = false;
      } else {
        console.error('Неверные данные входа:', payload);
        isLoggedIn.value = false;
      }
    };

    const goToBookDetail = (book) => {
      console.log('Переход к книге:', book.title);
      showSearchResults.value = false;
      router.push({ name: 'BookDetail', params: { title: encodeURIComponent(book.title) } });
    };

    const toggleMenu = (event) => {
      if (event) event.stopPropagation();
      isMenuOpen.value = !isMenuOpen.value;
      if (isMenuOpen.value) {
        document.addEventListener('click', closeMenuOnOutsideClick);
      } else {
        document.removeEventListener('click', closeMenuOnOutsideClick);
      }
    };

    const closeMenuOnOutsideClick = (event) => {
      const menu = document.querySelector('.mobile-nav');
      const button = document.querySelector('.burger-button');
      if (menu && !menu.contains(event.target) && button && !button.contains(event.target)) {
        isMenuOpen.value = false;
        document.removeEventListener('click', closeMenuOnOutsideClick);
      }
    };

    const closeModal = (modalRef) => {
      if (modalRef === 'showSearchResults') {
        showSearchResults.value = false;
      } else if (modalRef === 'showRegister') {
        showRegister.value = false;
      } else if (modalRef === 'showProfile') {
        showProfile.value = false;
      }
    };

    const searchBooks = async () => {
      if (!searchQuery.value || searchQuery.value.trim() === '') {
        alert('Пожалуйста, введите запрос для поиска!');
        return;
      }
      console.log('Отправка запроса с:', searchQuery.value);
      try {
        const response = await axios.post('http://localhost:3001/api/openai/search', {
          prompt: searchQuery.value.trim(),
        }, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 30000,
        });
        console.log('Получены данные:', response.data);
        searchResults.value = response.data.books || [];
        showSearchResults.value = true;
        if (searchResults.value.length === 0) {
          alert(response.data.message || 'По вашему запросу книги не найдены.');
        } else {
          console.log('Результаты поиска:', searchResults.value);
        }
      } catch (error) {
        console.error('Ошибка поиска:', error.response ? error.response.data : error.message);
        const message = error.response?.data?.error || 'Ошибка при поиске. Проверьте подключение к серверу.';
        alert(message);
      }
    };

    onUnmounted(() => {
      document.removeEventListener('click', closeMenuOnOutsideClick);
    });

    return {
      router,
      isLoggedIn,
      userEmail,
      userName,
      showRegister,
      showProfile,
      isMenuOpen,
      showSearchResults,
      searchQuery,
      searchResults,
      onRegistered,
      onLoggedIn,
      goToBookDetail,
      toggleMenu,
      closeModal,
      searchBooks,
    };
  },
};
</script>

<style scoped>
a {
    text-decoration: none;
    color:#F6EEE1;
}
* {
    margin: 0;
    padding: 0;
    font-family: Arial, Helvetica, sans-serif;
    box-sizing: border-box;
}
.main-app {
    background-color: #003060;
    max-width: 1920px;
    margin: 0 auto;
    min-height: 100vh;
    overflow-x: hidden;
    width: 100%;
}
body {
    background-color: #003060;
    width: 100%;
    max-width: 100vw;
    overflow-x: hidden;
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
    animation: fadeIn 1s ease-in-out;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(-20px); }
    to { opacity: 1; transform: translateY(0); }
}
.header-ul {
    list-style: none;
    display: flex;
    flex-direction: row;
    align-items: center;
    margin-left: auto; 
    margin-right: 120px; 
}

.mobile-nav{
    display: none;
}
.mobile-nav-toggle{
    display: none;
}
.header-ul li {
    margin: 0 30px; 
    cursor: pointer;
    color: #F6EEE1;
    transition: all 800ms ease;
    padding: 5px 10px;
    border-radius: 5px;
}
.profile-icon:hover {
    transform: scale(1.09);
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
  transition: all 0.3s ease;
  display: inline-block; 
}

.register-btn:hover {
  background-color: #003060;
  color: #F6EEE1;
  transform: scale(1.05);
}

.Ellipse {
    width: 100%;
    max-width: 1920px;
    height: auto;
    animation: slideUp 0.8s ease-out;
}

@keyframes slideUp {
    from { transform: translateY(50px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
}

.logo {
    margin-left: 120px;
    margin-top: 20px;
    transition: all 0.3s ease;
}

.logo:hover {
    transform: scale(1.05) rotate(-5deg);
}

.welcome {
    position: absolute;
    left: 120px;
    top: 220px;
    color: #003060;
    width: 45%;
    animation: fadeIn 1s ease-in-out;
}

.welcome button {
    background-color: #003060;
    color: #F6EEE1;
    padding: 10px 20px;
    border-radius: 8px;
    border: none;
    margin: 25px 0px;
    transition: all 800ms ease;
}

.welcome button:hover {
    transform: scale(1.09);
    background-color: #F6EEE1;
    color: #003060;
    border: #003060;
    border: 2px solid;
}

.profile-modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 48, 96, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  animation: fadeIn 0.5s ease-in-out;
}

.profile-modal-content {
  background: rgba(246, 238, 225, 0.95);
  padding: 30px;
  border-radius: 20px;
  width: 90%;
  max-width: 500px; 
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 15px 40px rgba(0, 48, 96, 0.4);
  animation: slideUp 0.6s ease-out;
}

.profile-close-btn {
  position: absolute;
  top: 15px;
  right: 15px;
  background: rgba(0, 48, 96, 0.3);
  font-size: 28px;
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  color: #003060;
  transition: all 0.3s ease;
}

.profile-close-btn:hover {
  background: rgba(0, 48, 96, 0.5);
  transform: scale(1.1);
}

@media (max-width: 768px) {
  .profile-modal-content {
    padding: 20px;
    border-radius: 15px;
    max-width: 95%;
    margin: 10px;
  }

  .profile-close-btn {
    top: 10px;
    right: 10px;
    width: 36px;
    height: 36px;
    font-size: 24px;
  }
}

.welcome h1 {
    margin-bottom: 20px;
    font-weight: 800;
    text-shadow: 1px 1px 5px rgba(246, 238, 225, 0.5);
}

.welcome h4 {
    font-weight: 500;
    line-height: 1.6;
}

.publicLibrary {
    position: absolute;
    right: 120px;
    top: 110px;
    animation: slideUp 0.8s ease-out;
}

.AI-books {
    position: relative;
    top: 95px;
    margin: 0 auto;         
    width: 40%;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    color: #F6EEE1;
    text-align: center;
    animation: fadeIn 1s ease-in-out;
}

.AI-text {
    margin-bottom: 40px;
    font-weight: 600;
    text-shadow: 1px 1px 5px rgba(246, 238, 225, 0.5);
}

.AI-input {
    flex: 1;
    border: none;
    outline: none;
    background: transparent;
    font-size: 16px;
    color: #F6EEE1;
    transition: all 0.3s ease;
}

.AI-input:focus {
    transform: scale(1.02);
    box-shadow: 0 0 10px rgba(246, 238, 225, 0.3);
}

.search-container {
    display: flex;
    align-items: center;
    background-color: rgba(246, 238, 225, 0.9);
    border-radius: 8px;
    padding: 10px 20px;
    width: 100%;
    max-width: 700px;
    margin: 0 auto;
    margin-bottom: 45px;
    transition: all 0.3s;
}

.search-container:hover {
    transform: scale(1.02);
    box-shadow: 0 0 15px rgba(246, 238, 225, 0.4);
}

.divider {
    width: 2px;
    height: 24px;
    background-color: #F6EEE1;
    margin: 0 15px;
}

.search-btn {
    background: transparent;
    border: none;
    cursor: pointer;
    transition: all 0.4s ease;
}

.search-btn img {
    width: 24px;
    height: 24px;
    transition: all 0.3s ease;
    filter: brightness(0.9);
}

.search-btn:hover img {
    transform: rotate(360deg) scale(1.2);
    filter: brightness(1.2) drop-shadow(0 0 5px #F6EEE1);
}

.AI-btn {
    padding: 10px 20px;
    background-color: rgba(246, 238, 225, 0.9);
    color: #003060;
    border: none;
    border-radius: 8px;
    transition: all 800ms ease;
}

.AI-btn:hover {
    transform: scale(1.09);
    background-color: #F6EEE1;
    color: #003060;
}

.line-1 {
    position: absolute;
    top: 1134px;
    width: 100%;
    max-width: 1920px;
    animation: fadeIn 1s ease-in-out;
}

.genre-main {
    position: absolute;
    top: 1234px;
    width: 100%;
    max-width: 1920px;
    text-align: center;
    animation: slideUp 0.8s ease-out;
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

.cream {
    position: absolute;
    top: 1651px;
    background-color: #F6EEE1;
    width: 100%;
    max-width: 1920px;
    animation: slideUp 0.8s ease-out;
}

.lingua {
    width: 100%;
    display: block;
    text-align: center;
    margin-top: 100px;
    margin-bottom: 130px;
    position: relative;
    top: -20px;
}

.lingua h2 {
    margin-bottom: 80px;
    color: #003060;
}

.lingua-div img {
    margin: 0px 20px;
    transition: all 800ms ease;
    cursor: pointer;
    border-radius: 10px;
    padding: 5px;
    background: rgba(0, 48, 96, 0.2);
}

.lingua-div img:hover {
    transform: scale(1.1) rotate(5deg);
    background: rgba(0, 48, 96, 0.4);
    box-shadow: 0 5px 15px rgba(246, 238, 225, 0.3);
}

.line-3 {
    width: 100%;
    max-width: 1920px;
    animation: fadeIn 1s ease-in-out;
}

.bestsellers {
    margin-top: 100px;
    color: #003060;
    margin-bottom: 130px;
}

.bestsellers h2 {
    font-weight: 600;
    text-align: center;
    margin-bottom: 80px;
}

.best-main {
    width: 100%;
    justify-content: space-around;
    display: flex;
    flex-direction: row;
}

.best-div {
    width: 180px;
    height: 250px;
    background-color: gray;
    margin: 0 24px;
    border-radius: 8px;
    transition: all 800ms ease;
}

.best-div:hover {
    transform: scale(1.09);
}

.about-us {
    position: absolute;
    top: 2760px;
    width: 100%;
    max-width: 1920px;
    display: flex;
    justify-content: space-between;
    background-color: #003060;
    color: #F6EEE1;
    align-items: center;
    animation: fadeIn 1s ease-in-out;
}

.about-text {
    width: 30%;
    height: auto;
    margin-left: 120px;
    margin-top: 100px;
    margin-bottom: 115px;
}

.about-text h2 {
    font-weight: 600;
    margin-bottom: 15px;
    font-size: 40px;
}

.about-text h4 {
    font-weight: 500;
    font-size: 24px;
}

.about-img {
    margin-right: 120px;
    margin-top: 46px;
    width: 393px;
    height: auto;
    position: relative;
    top: -50px;
    animation: slideUp 0.8s ease-out;
}

.Ellipse-2 {
    width: 100%;
    max-width: 1920px;
    background-color: #003060;
    z-index: 1;
    position: absolute;
    top: 3202px;
    animation: fadeIn 1s ease-in-out;
}

footer {
    position: absolute;
    top: 3350px;
    width: 100%;
    max-width: 1920px;
    background-color: #003060;
    color: #F6EEE1;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    z-index: 1000;
    align-items: center;
    animation: slideUp 0.8s ease-out;
}

.footer-left {
    margin-left: 120px;
}

.footer-left p {
    margin: 10px 0px;
}

.footer-right {
    margin-right: 120px;
    text-align: end;
    justify-content: end;
}

.footer-right-contacts {
    margin-bottom: 35px;
}

.footer-right-contacts div {
    display: flex;
    flex-direction: row;
    margin-top: 11px;
    justify-content: end;
}

.footer-right-social div {
    display: flex;
    flex-direction: row;
    margin-top: 11px;
    justify-content: end;
}

.footer-right-contacts div p, .footer-right-social div p {
    margin-right: 4px;
}

.main {
    font-weight: 600;
    font-size: 20px;
}

.header-ul li {
    transition: all 800ms ease;
}

.header-ul li:hover {
    transform: scale(1.1) rotate(2deg);
    background-color: #F6EEE1;
    color: #003060;
    box-shadow: 0 3px 10px rgba(246, 238, 225, 0.2);
}

.AI-btn {
    transition: all 800ms ease;
}

.AI-btn:hover {
    transform: scale(1.09);
    background-color: #F6EEE1;
    color: #003060;
}

.ai-find {
    transition: all 800ms ease;
}

.ai-find:hover {
    transform: scale(1.09);
    background-color: #003060;
    color: #F6EEE1;
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
  animation: fadeIn 0.5s ease-in-out;
}

.modal-content {
  background: #F6EEE1;
  padding: 30px;
  border-radius: 12px;
  width: 900px;
  max-width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.8s ease-out;
}

.close-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  background: transparent;
  font-size: 24px;
  border: none;
  cursor: pointer;
  color: #003060;
  transition: all 0.3s ease;
}

.close-btn:hover {
  transform: rotate(90deg) scale(1.2);
  color: #FF6B6B;
}

.book-item {
  background-color: #fff;
  padding: 15px;
  margin-bottom: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
}

.book-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}

.book-item h3 {
  color: #003060;
  margin-bottom: 10px;
  font-size: 1.2em;
}

.book-item p {
  color: #666;
  margin: 5px 0;
  font-size: 0.9em;
}

@media (max-width: 768px) {
    * {
        box-sizing: border-box;
    }
     .mobile-nav-toggle {
        display: block;
    }
    .desktop-nav {
        display: none;
    }

    .main-app {
        width: 100%;
        min-height: 100vh;
        position: relative;
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

    .Ellipse {
        width: 100%;
        height: 360px;
        margin-top: 20vw;
        display: block;
        object-fit: cover;
    }

    .welcome-div {
        width: 100%;
        padding: 5vw;
        margin-top: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        position: relative;
        top: -60px;
    }

    .welcome {
        width: 100%;
        position: static;
        color: #003060;
        margin-bottom: -15vw;
        order: 2;
    }

    .welcome h1 {
        font-size: 6vw;
        margin-bottom: 4vw;
        font-weight: 800;
        line-height: 1.2;
        position: relative;
        top: -250px; 
    }

    .welcome h4 {
        font-size: 2.5vw;
        line-height: 1.4;
        font-weight: 500;
        margin-bottom: 6vw;
        position: relative;
        top: -250px; 
    }

    .welcome .ai-find {
        padding: 3vw 6vw;
        font-size: 3vw;
        border-radius: 2vw;
        margin: 0;
        position: relative;
        top: -265px; 
    }

    .publicLibrary {
        display: none;
    }

    .AI-books {
        width: 90%;
        margin: -15vw auto 5vw auto; 
        padding: 5vw;
        position: static;
        top: auto;
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .AI-text {
        font-size: 4vw;
        margin-bottom: 6vw;
        font-weight: 600;
        line-height: 1.3;
    }

    .search-container {
        width: 100%;
        max-width: none;
        padding: 3vw 4vw;
        margin-bottom: 6vw;
        display: flex;
        align-items: center;
        background-color: rgba(246, 238, 225, 0.9);
        border-radius: 2vw;
    }

    .AI-input {
        flex: 1;
        font-size: 4vw;
        color: #003060;
        background: transparent;
        border: none;
        outline: none;
    }

    .AI-input::placeholder {
        color: rgba(0, 48, 96, 0.7);
        font-size: 3.5vw;
    }

    .divider {
        width: 0.5vw;
        height: 6vw;
        background-color: #003060;
        margin: 0 3vw;
    }

    .search-btn img {
        width: 6vw;
        height: 6vw;
    }

    .AI-btn {
        padding: 3vw 6vw;
        font-size: 4vw;
        border-radius: 2vw;
        margin: 0;
    }

    .line-1 {
        width: 100%;
        margin: 10vw 0 8vw 0; 
        position: static;
        top: auto;
    }

    .genre-main {
        width: 100%;
        padding: 0 5vw;
        position: static;
        top: auto;
        margin: 8vw 0; 
    }

    .genre-main h2 {
        font-size: 6vw;
        margin-bottom: 8vw;
        font-weight: 600;
    }

    .genre {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 6vw;
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
        font-size: 3.5vw;
        margin: 0;
        color: #F6EEE1;
    }

    .genre-div:nth-child(7) {
        grid-column: span 2;
        max-width: 35vw;
        margin: 0 auto;
    }

    .cream {
        width: 100%;
        background-color: #F6EEE1;
        padding: 10vw 5vw;
        position: static;
        top: auto;
        margin: 10vw 0 0 0;
    }

    .lingua {
        width: 100%;
        margin: 0;
        text-align: center;
    }

    .lingua h2 {
        font-size: 6vw;
        margin-bottom: 8vw;
        color: #003060;
        font-weight: 600;
    }

    .lingua-div {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 6vw;
        align-items: center;
    }

    .lingua-div img {
        width: 70vw; 
        height: 25vw; 
        object-fit: contain; 
        margin: 0;
        padding: 2vw;
        border-radius: 3vw;
        background: rgba(0, 48, 96, 0.2);
        transition: all 0.3s ease;
    }
     .lingua-div img:nth-child(3) {
      width: 35vw;
      height: 25vw;
      grid-column: span 2;
        max-width: 35vw;
        margin: 0 auto;
     }



    .lingua-div img:hover {
        transform: scale(1.05);
        background: rgba(0, 48, 96, 0.4);
    }

    .line-3 {
        width: 100%;
        margin: 8vw 0;
    }

    .bestsellers {
        margin: 8vw 0;
        padding: 0 5vw;
    }

    .bestsellers h2 {
        font-size: 6vw;
        margin-bottom: 8vw;
        color: #003060;
        font-weight: 600;
    }

    .best-main {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 4vw;
        justify-items: center;
    }

    .best-div {
        width: 100%;
        max-width: 35vw;
        height: 45vw;
        background-color: #ccc;
        border-radius: 2vw;
        transition: all 0.3s ease;
    }

    .best-div:hover {
        transform: scale(1.05);
    }

    .about-us {
        width: 100%;
        padding: 10vw 5vw;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        background-color: #003060;
        color: #F6EEE1;
        position: static;
        top: auto;
        margin: 15vw 0 0 0;
    }

    .about-text {
        width: 100%;
        margin: 0 0 6vw 0;
        order: 2;
    }

    .about-text h2 {
        font-size: 6vw;
        margin-bottom: 4vw;
        font-weight: 600;
    }

    .about-text h4 {
        font-size: 4vw;
        line-height: 1.4;
        font-weight: 500;
    }

    .about-img {
        width: 60%;
        max-width: 300px;
        height: auto;
        margin: 0;
        order: 1;
        position: static;
        top: auto;
    }

    .Ellipse-2 {
        width: 100%;
        margin: 5vw 0 0 0;
        position: static;
        top: auto;
    }

    footer {
        width: 100%;
        padding: 8vw 5vw;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        background-color: #003060;
        color: #F6EEE1;
        position: static;
        top: auto;
        margin: 0;
    }

    .footer-left {
        margin: 0 0 6vw 0;
        width: 100%;
    }

    .footer-left p {
        font-size: 4vw;
        margin: 2vw 0;
        cursor: pointer;
        transition: color 0.3s ease;
    }

    .footer-left p:hover {
        color: #F6EEE1;
        opacity: 0.8;
    }

    .footer-right {
        width: 100%;
        margin: 0;
        text-align: center;
    }

    .footer-right-contacts {
        margin-bottom: 6vw;
    }

    .footer-right-contacts p:first-child,
    .footer-right-social p:first-child {
        font-size: 4.5vw;
        font-weight: 600;
        margin-bottom: 3vw;
    }

    .footer-right-contacts div,
    .footer-right-social div {
        display: flex;
        justify-content: center;
        align-items: center;
        margin: 2vw 0;
    }

    .footer-right-contacts div p,
    .footer-right-social div p {
        font-size: 3.5vw;
        margin-right: 2vw;
    }

    .footer-right-contacts img,
    .footer-right-social img {
        width: 5vw;
        height: 5vw;
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
        transition: all 0.3s ease;
    }

    .close-btn:hover {
        transform: rotate(90deg) scale(1.2);
        color: #FF6B6B;
    }

    .book-item {
        background-color: #fff;
        padding: 4vw;
        margin-bottom: 3vw;
        border-radius: 2vw;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        cursor: pointer;
        transition: all 0.3s ease;
    }

    .book-item:hover {
        transform: translateY(-1vw);
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
    }

    .book-item h3 {
        color: #003060;
        margin-bottom: 2vw;
        font-size: 4.5vw;
        line-height: 1.2;
    }

    .book-item p {
        color: #666;
        margin: 1vw 0;
        font-size: 3.5vw;
        line-height: 1.3;
    }
}
</style>
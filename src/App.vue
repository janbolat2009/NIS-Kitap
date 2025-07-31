<template>
  <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NIS Kitap</title>
    <link rel="stylesheet" href="./css/main.css">
</head>
<body>
    <div class="main-app">
    <header class="header">
      <img src="./img/Logotype.svg" alt="logo" class="logo" @click="this.$router.push('/')"/>
      <!-- Десктопное меню -->
      <ul class="header-ul desktop-nav">
        <li class="main" @click="$router.push('/')">Главная</li>
        <li @click="$router.push('/catalog')">Каталог</li>
        <li>О нас</li>
        <li v-if="!isLoggedIn">
          <button class="register-btn" @click="showRegister = true">Регистрация</button>
        </li>
        <li v-else class="profile-icon">
          <img src="./img/mdi_user.png" alt="profile" @click="showProfile = true" />
        </li>
      </ul>
      <!-- Мобильное бургер-меню -->
      <div class="mobile-nav-toggle md:hidden">
        <button @click="toggleMenu" class="burger-button">
          <span class="burger-icon">{{ isMenuOpen ? '✕' : '☰' }}</span>
        </button>
        <transition name="slide">
          <ul v-if="isMenuOpen" class="mobile-nav">
            <li class="main" @click="$router.push('/'); toggleMenu()">Главная</li>
            <li @click="$router.push('/catalog'); toggleMenu()">Каталог</li>
            <li @click="toggleMenu()">О нас</li>
            <li v-if="!isLoggedIn">
              <button class="register-btn" @click="showRegister = true; toggleMenu()">Регистрация</button>
            </li>
            <li v-else class="profile-icon">
              <img src="./img/mdi_user.png" alt="profile" @click="showProfile = true; toggleMenu()" />
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
    <div class="ellipse-div">
    <img src="./img/Ellipse 1.png" alt="" class="Ellipse">
    </div>
    <div class="welcome-div">
        <div class="welcome">
            <h1>Добро пожаловать в NIS Kitap</h1>
            <h4>Здесь собраны все книги нашей школы в одном удобном цифровом каталоге. Искать книги по жанрам, языкам и интересам стало проще — воспользуйся умным поиском на базе искусственного интеллекта, чтобы быстро найти именно то, что тебе нужно.Забронируй понравившуюся книгу онлайн, следи за сроками возврата и всегда будь в курсе своих задолженностей. Читай и учись с комфортом вместе с NIS Kitap — библиотекой нового поколения!</h4>
            <button class="ai-find">Найти книгу с ИИ</button>
        </div>
        <div class="public-div">
        <img src="./img/publicLibrary.png" alt="" class="publicLibrary">
        </div>
    </div>
    <div class="AI-books">
        <h3 class="AI-text">Введи свои пожелания — жанр, автора, язык или тему — и наш ИИ подберёт книги, идеально подходящие именно тебе.</h3>
        <div class="search-container">
        <input type="text" placeholder="Например: Хочу книги про катастрофы" class="AI-input">
        <div class="divider"></div>
        <button class="search-btn">
            <img src="./img/material-symbols_search-rounded.png" alt="">
        </button>
        </div>
        <button class="AI-btn">Найти книгу с ИИ</button>
    </div>
    <img src="./img/line-2.svg" alt="" class="line-1">
    <div class="genre-main">
    <h2>Жанры книг</h2>
    <div class="genre">
        <div class="genre-div">
            <img src="./img/Fantastic.png" alt="" class="Fantastic" @click="this.$router.push('/fantastica')">
            <p>Фантастика</p>
        </div>
        <div class="genre-div">
            <img src="./img/mdi_fantasy.png" alt="" class="Fantasy" @click="this.$router.push('/fantasy')">
            <p>Фэнтези</p>
        </div>
        <div class="genre-div">
            <img src="./img/ph_detective-fill.png" alt="" class="Detective" @click="this.$router.push('/detective')">
            <p>Детектив</p>
        </div>
         <div class="genre-div">
            <img src="./img/icons8_adventures.png" alt="" class="Adventure" @click="this.$router.push('/adventure')">
            <p>Приключения</p>
        </div>
         <div class="genre-div">
            <img src="./img/mdi_biography.png" alt="" class="Biography" @click="this.$router.push('/biography')">
            <p>Биография</p>
        </div>
         <div class="genre-div">
            <img src="./img/devicon-plain_love2d.png" alt="" class="Romantico" @click="this.$router.push('/romantica')">
            <p>Романтика</p>
        </div>
         <div class="genre-div">
            <img src="./img/streamline-ultimate_playlist-songs-bold.png" alt="" class="poetry" @click="this.$router.push('/poetry')">
            <p>Поэзия</p>
        </div>
    </div>
    </div>
    <div class="cream">
        <div class="lingua">
        <h2>Языки книг</h2>
        <div class="lingua-div">
            <img src="./img/Group 17.png" alt="" class="lingua-img" @click="this.$router.push('/kazakh')">
            <img src="./img/Group 18.png" alt="" @click="this.$router.push('/russian')">
            <img src="./img/Group 19.png" alt="" @click="this.$router.push('/english')">
        </div>
        </div>
        <img src="./img/line-3.svg" alt="" class="line-3">
        <div class="bestsellers">
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
        <img src="./img/illustra 1.png" alt="" class="about-img">
    </div>
    <img src="./img/Ellipse 12.png" alt="" class="Ellipse-2">
    <footer>
        <div class="footer-left">
            <p>Главная</p>
            <p>Найти книгу с ИИ</p>
            <p>Каталог</p>
            <p>Жанры книг</p>
            <p>Языки книг</p>
            <p>Бестселлеры</p>
            <p>О нас</p>
            <p>Регистрация</p>
        </div>
        <div class="footer-right">
            <div class="footer-right-contacts">
                <p>Контакты:</p>
                <div>
                 <p>janbolatique.kz@gmail.com</p>
                 <img src="./img/ic_baseline-email.png" alt="" class="email">
                </div>
                <div>
                 <p>+7 700 757 5481</p>
                 <img src="./img/ic_baseline-phone.png" alt="" class="phone">
                </div>
            </div>
            <div class="footer-right-social">
                <p>Социальные сети:</p>
                <div>
                    <p>niskitap</p>
                    <img src="./img/mdi_instagram.png" alt="" class="insta">
                </div>
                <div>
                    <p>niskitap</p>
                    <img src="./img/mingcute_telegram-fill.png" alt="" class="telegram">
                </div>
            </div>
        </div>
    </footer>
    </div>
</body>
</html>
</template>

<script>
import Register from './components/Register.vue'
import Profile from './components/Profile.vue'
import Catalog from './pages/Catalog.vue'
export default {
    components: {
        Register, Profile, Catalog
    },
    data() {
        return {
            showRegister: false,
            showProfile: false,
            isLoggedIn: false,
            userEmail: '',
            isMenuOpen: false
        }
    },
    methods: {
        toggleRegisterModal() {
            this.showRegister = !this.showRegister
        },
        onRegistered(payload) {
            this.userEmail = payload.email
            localStorage.setItem('isLoggedIn', 'true')
            this.isLoggedIn = true
            this.showRegister = false
            this.showProfile = true   
        },
        openProfile() {
            this.showProfile = true
        },
        closeProfile() {
            this.showProfile = false
        },
        toggleMenu() {
            this.isMenuOpen = !this.isMenuOpen
        }
    }
}
</script>

<style scoped>
* {
    margin: 0;
    padding: 0;
    font-family: Arial, Helvetica, sans-serif;
}
.main-app {
    background-color: #003060;
    max-width: 1920px;
    margin: 0 auto;
    min-height: 100vh;
}
body {
    background-color: #003060;
    width: 100%;
    max-width: 1920px;
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
    margin-left: auto; /* Выравнивание по правому краю */
    margin-right: 120px; /* Уменьшенный отступ от правого края */
}

.header-ul li {
    margin: 0 30px; /* Уменьшенный отступ между элементами для компактности */
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

@media (max-width: 768px) {
    /* Скрываем десктопное меню */
    .desktop-nav {
        display: none;
    }

    /* Стили для бургер-меню */
    .mobile-nav-toggle {
        margin-right: 3%;
    }

    .burger-button {
        background: transparent;
        border: none;
        font-size: 32px;
        color: #F6EEE1;
        cursor: pointer;
        padding: 12px;
    }

    .burger-icon {
        display: block;
    }

    .mobile-nav {
        position: fixed;
        top: 100px;
        left: 0;
        right: 0;
        background: #003060;
        padding: 20px;
        display: flex;
        flex-direction: column;
        align-items: center;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
        z-index: 999;
    }

    .mobile-nav li {
        margin: 15px 0;
        color: #F6EEE1;
        font-size: 18px;
        cursor: pointer;
        padding: 10px 20px;
        width: 100%;
        text-align: center;
        transition: all 0.3s ease;
    }

    .mobile-nav li:hover {
        background-color: #F6EEE1;
        color: #003060;
        border-radius: 5px;
    }

    .mobile-nav .register-btn {
        width: auto;
        margin: 0 auto;
    }

    .mobile-nav .profile-icon img {
        width: 24px;
        height: 24px;
    }

    /* Анимация для бургер-меню */
    .slide-enter-active,
    .slide-leave-active {
        transition: transform 0.3s ease;
    }
    .slide-enter-from,
    .slide-leave-to {
        transform: translateY(-100%);
    }

    /* Остальные мобильные стили */
    body {
        background-color: #003060;
        width: 100%;
        margin: 0;
    }
    header {
        width: 100%;
        height: 12%;
        padding: 2%;
        display: flex;
        justify-content: space-between;
        align-items: center;
        box-sizing: border-box;
    }
    .logo {
        margin-left: 3%;
        margin-top: 1%;
        width: 15%;
        transition: all 800ms ease;
    }
    .logo:hover {
        transform: scale(1.09);
    }
    .welcome-div {
        width: 100%;
        display: flex;
        flex-direction: column;
        margin-top: 20%; /* Увеличено расстояние */
    }
    .welcome {
        width: 80%; /* Увеличена ширина для лучшей читаемости */
        position: absolute;
        top: 100px; /* Поднято выше (было 180px) */
        left: 5%;
        margin: 0 5%;
        text-align: start;
    }
    .welcome h1 {
        font-size: 18px;
        margin-bottom: 3%; /* Увеличен отступ для читаемости */
        font-weight: 800;
    }
    .welcome h4 {
        font-size: 12px;
        line-height: 1.4;
        font-weight: 500;
        width: 90%;
        margin-bottom: 3%; /* Добавлен отступ под текст */
    }
    .welcome button {
        padding: 1.5% 3%; /* Уменьшено для компактности */
        font-size: 2.5vw;
        margin-top: 2%; /* Поднято выше */
    }
    .publicLibrary {
        width: 40%;
        margin: 5% auto;
        position: absolute;
        right: 1%;
    }
    .Ellipse {
        position: relative;
        top: 100px;
        width: 100% !important;
        height: auto;
        max-width: none;
        object-fit: fill;
        display: block;
    }
    .AI-books {
        width: 100%;
        max-width: none;
        margin: 15% auto; /* Увеличено расстояние сверху */
        padding: 0 5%;
        text-align: center;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        position: relative;
        left: 0;
        right: 0;
    }
    .AI-text {
        font-size: 3vw;
        margin-bottom: 5%;
        font-weight: 600;
    }
    .search-container {
        width: 100%;
        max-width: 90%;
        padding: 2% 3%;
        display: flex;
        align-items: center;
        margin: 0 auto;
    }
    .AI-input {
        width: 80%;
        font-size: 18px;
        flex: 1;
    }
    .AI-btn {
        padding: 2% 4%;
        font-size: 2.5vw;
        margin-top: 3%;
    }
    .line-1 {
        width: 100% !important;
        max-width: none;
        margin-top: 15%; /* Увеличено расстояние */
        object-fit: fill;
        display: block;
        position: relative;
    }
    .genre-main {
        width: 100%;
        margin: 15% 0; /* Увеличено расстояние */
        padding: 0 5%;
        text-align: center;
    }
    .genre-main h2 {
        font-size: 5vw;
        margin-bottom: 5%;
    }
    .genre {
        width: 100%;
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 5%;
        justify-items: center;
    }
    .genre-div {
        width: 100%;
        max-width: 150px;
        text-align: center;
    }
    .genre-div img {
        width: 50%;
        margin: 0 auto;
    }
    .genre-div p {
        font-size: 3vw;
        margin-top: 10px;
    }
    .cream {
        width: 100% !important;
        max-width: none;
        margin-top: 15%; /* Увеличено расстояние */
        position: relative;
        box-sizing: border-box;
    }
    .lingua {
        width: 100%;
        margin: 5% 0;
        padding: 0 5%;
        text-align: center;
    }
    .lingua h2 {
        font-size: 5vw;
        margin-bottom: 5%;
    }
    .lingua-div {
        width: 100%;
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 5%;
        justify-items: center;
        align-items: center;
    }
    .lingua-div img {
        width: 100%;
        max-width: 120px;
        height: auto;
        display: block;
        margin: 2% auto;
    }
    .lingua-div img:last-child:nth-child(odd) {
        grid-column: span 2;
    }
    .line-3 {
        width: 100% !important;
        max-width: none;
        margin-top: 15%; /* Увеличено расстояние */
        object-fit: fill;
        display: block;
        position: relative;
    }
    .bestsellers {
        width: 100%;
        margin: 15% 0; /* Увеличено расстояние */
        padding: 0 5%;
        text-align: center;
    }
    .bestsellers h2 {
        font-size: 5vw;
        margin-bottom: 5%;
    }
    .best-main {
        width: 100%;
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 5%;
        justify-items: center;
    }
    .best-div {
        width: 100%;
        max-width: 150px;
        height: 200px;
        background-color: gray;
        border-radius: 8px;
    }
    .about-us {
        width: 100%;
        margin: 15% 0; /* Увеличено расстояние */
        padding: 0 5%;
        flex-direction: column;
        text-align: center;
    }
    .about-text {
        width: 100%;
        margin-bottom: 5%;
    }
    .about-text h2 {
        font-size: 5vw;
        margin-bottom: 2%;
    }
    .about-text h4 {
        font-size: 2.5vw;
        line-height: 1.4;
    }
    .about-img {
        width: 40%;
        margin: 0 auto;
    }
    .Ellipse-2 {
        width: 100% !important;
        max-width: none;
        margin-top: 15%; /* Увеличено расстояние */
        object-fit: fill;
        display: block;
        position: relative;
    }
    footer {
        width: 100%;
        margin: 15% 0; /* Увеличено расстояние */
        padding: 0 5%;
        flex-direction: column;
        text-align: center;
    }
    .footer-left {
        margin-bottom: 5%;
    }
    .footer-left p {
        font-size: 2.5vw;
        margin: 1% 0;
    }
    .footer-right {
        width: 100%;
        text-align: center;
    }
    .footer-right-contacts p, .footer-right-social p {
        font-size: 2.5vw;
    }
    .footer-right-contacts div, .footer-right-social div {
        justify-content: center;
        margin: 1% 0;
    }
    .modal-backdrop {
        top: 0;
    }
    .modal-content {
        width: 90%;
        height: 60vw;
        padding: 3%;
    }
    .close-btn {
        top: 3%;
        right: 3%;
    }
}
</style>
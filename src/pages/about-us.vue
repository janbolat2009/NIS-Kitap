<template>
  <div class="about-us-page">
    <!-- Хэдер, аналогичный Catalog.vue -->
    <header class="header">
      <img src="@/img/Logotype.svg" alt="logo" class="logo" @click="router.push('/')" />
      <ul class="header-ul desktop-nav">
        <li @click="router.push('/')">Главная</li>
        <li  @click="router.push('/catalog')">Каталог</li>
        <li @click="router.push('/about-us')" class="main">О нас</li>
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
      <li @click="$router.push('/catalog'); toggleMenu()">Каталог</li>
      <li @click="$router.push('/about-us'); toggleMenu()" class="main">О нас</li>
      <li v-if="isLoggedIn">
        <button class="register-btn" @click="showRegister = true; toggleMenu()">Регистрация</button>
      </li>
      <li v-else class="profile-icon">
        <img src="./img/mdi_user_light.png" alt="profile" @click="showProfile = true; toggleMenu()" />
      </li>
    </ul>
  </transition>
</div>

    </header>

    <!-- Модальные окна -->
    <div v-if="showRegister" class="modal-backdrop">
      <div class="modal-content">
        <button class="close-btn" @click="showRegister = false">×</button>
        <Register @registered="onRegistered" />
      </div>
    </div>

    <div v-if="showProfile" class="modal-backdrop">
      <div class="modal-content">
        <button class="close-btn" @click="showProfile = false">×</button>
        <Profile :email="userEmail" :name="userName" @back="showProfile = false" />
      </div>
    </div>

    <!-- Контент страницы -->
    <div class="header-overlay">
      <h1 class="page-title">О нас</h1>
    </div>
    <div class="content-container">
      <div class="image-section">
        <img src="@/img/publicLibrary.png" alt="Public Library" class="library-image" />
      </div>
      <div class="text-section">
        <h2 class="section-title">Почему мы?</h2>
        <p class="about-text">
          NIS Kitap — это современная онлайн-библиотека, созданная для учеников и учителей нашей школы. Мы стремимся предоставить доступ к тысячам книг, от классики до современных бестселлеров, на казахском, русском и английском языках. Наша миссия — вдохновлять на чтение, поддерживать образование и создавать сообщество любителей книг.
        </p>
        <p class="about-text">
          Мы предлагаем удобный интерфейс, персонализированные рекомендации с помощью ИИ и возможность делиться впечатлениями. Наша команда работает, чтобы каждый мог найти свою идеальную книгу и углубить свои знания. Выберите NIS Kitap — ваш путь к миру знаний начинается здесь!
        </p>
        <button class="explore-btn" @click="router.push('/catalog')">Исследовать каталог</button>
      </div>
    </div>
  </div>
</template>

<script>
import { useRouter } from 'vue-router';
import { getAuth, onAuthStateChanged } from 'firebase/auth'; // Импортируем для mounted
import Register from '@/components/Register.vue';
import Profile from '@/components/Profile.vue';

export default {
  components: {
    Register,
    Profile,
  },
  name: 'AboutUs', // Исправлено на строку
  data() {
    return {
      showRegister: false,
      showProfile: false,
      isLoggedIn: false,
      userEmail: '',
      userName: '',
      isMenuOpen: false
    };
  },
  setup() {
    const router = useRouter();
    return { router };
  },
  mounted() {
    const auth = getAuth();
    onAuthStateChanged(auth, (user) => {
      this.isLoggedIn = !!user;
      if (user) {
        this.userEmail = user.email;
        this.userName = user.displayName || '';
      }
    });
  },
  methods: {
    onRegistered(payload) {
      this.userEmail = payload.email;
      this.userName = payload.name;
      this.isLoggedIn = true;
      this.showRegister = false;
      this.showProfile = true;
    },
    toggleMenu(event) {
    if (event) {
        event.stopPropagation();
    }
    this.isMenuOpen = !this.isMenuOpen;
    
    // Предотвращаем закрытие при клике внутри меню
    if (this.isMenuOpen) {
        this.$nextTick(() => {
            document.addEventListener('click', this.closeMenuOnOutsideClick);
        });
    } else {
        document.removeEventListener('click', this.closeMenuOnOutsideClick);
    }
},
closeMenuOnOutsideClick(event) {
    const menu = document.querySelector('.mobile-nav');
    const button = document.querySelector('.burger-button');
    
    if (menu && !menu.contains(event.target) && !button.contains(event.target)) {
        this.isMenuOpen = false;
        document.removeEventListener('click', this.closeMenuOnOutsideClick);
    }
}
  },
};
</script>

<style scoped>
/* Стили остаются без изменений */
.about-us-page {
  background: linear-gradient(135deg, #003060, #0056b3);
  min-height: 100vh;
  padding: 50px 20px;
  color: #f6eee1;
  overflow-x: hidden;
  position: relative;
}

.header {
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

.header:hover {
  box-shadow: 0 5px 15px rgba(246, 238, 225, 0.2);
}

.logo {
  margin-left: 120px;
  margin-top: 20px;
  transition: all 0.3s ease;
}

.logo:hover {
  transform: scale(1.05) rotate(-5deg);
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
  color: #f6eee1;
  transition: all 800ms ease;
  padding: 5px 10px;
  border-radius: 5px;
}

.header-ul li:hover {
  transform: scale(1.1) rotate(2deg);
  background-color: #f6eee1;
  color: #003060;
  box-shadow: 0 3px 10px rgba(246, 238, 225, 0.2);
}

.register-btn {
  background-color: #f6eee1;
  color: #003060;
  padding: 10px 20px;
  border-radius: 6px;
  border: 2px solid #f6eee1;
  transition: all 0.3s;
}
.header-overlay {
  background-color: #f6eee1;
  color:#003060;
}
.register-btn:hover {
  background-color: #003060;
  color: #f6eee1;
  border: 2px solid #f6eee1;
  transform: scale(1.05);
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
  background: #f6eee1;
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
  color: #f6eee1;
  z-index: 12000;
  transition: all 0.3s ease;
}

.close-btn:hover {
  transform: rotate(90deg) scale(1.2);
  color: #ff6b6b;
}

.header-overlay {
  position: absolute;
  top: 100px;
  left: 0;
  width: 100%;
  height: 200px;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
}

.page-title {
  font-size: 48px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 2px;
  color: #f6eee1;
  text-shadow: 3px 3px 6px rgba(0, 0, 0, 0.6);
  animation: fadeInDown 1s ease-out;
}

.content-container {
  max-width: 1200px;
  margin: 300px auto 0;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 40px;
  position: relative;
  z-index: 2;
}

.image-section {
  flex: 1;
  min-width: 300px;
  animation: slideInLeft 1s ease-out;
}

.library-image {
  width: 100%;
  max-width: 500px;
  height: auto;
  border-radius: 15px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
  transition: transform 0.5s ease, box-shadow 0.5s ease;
}

.library-image:hover {
  transform: scale(1.05);
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.6);
}

.text-section {
  flex: 1;
  min-width: 300px;
  background: rgba(246, 238, 225, 0.1);
  padding: 30px;
  border-radius: 15px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
  animation: slideInRight 1s ease-out;
}

.section-title {
  font-size: 32px;
  margin-bottom: 20px;
  color: #f6eee1;
  text-transform: uppercase;
  border-bottom: 2px solid #f6eee1;
  padding-bottom: 10px;
}

.about-text {
  font-size: 18px;
  line-height: 1.6;
  margin-bottom: 20px;
  color: #f6eee1;
  opacity: 0.9;
  transition: opacity 0.3s ease;
}

.about-text:hover {
  opacity: 1;
}

.explore-btn {
  padding: 12px 30px;
  background: linear-gradient(90deg, #003060, #0056b3);
  color: #f6eee1;
  border: none;
  border-radius: 25px;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  transition: transform 0.3s ease, background 0.3s ease;
}

.explore-btn:hover {
  transform: translateY(-3px);
  background: linear-gradient(90deg, #f6eee1, #d1c4b0);
  color: #003060;
}

/* Анимации */
@keyframes fadeInDown {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slideInLeft {
  from { opacity: 0; transform: translateX(-100px); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes slideInRight {
  from { opacity: 0; transform: translateX(100px); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slideUp {
  from { transform: translateY(50px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

/* Адаптивность */
@media (max-width: 800px) {
  .content-container {
    flex-direction: column;
    text-align: center;
  }
.desktop-nav {
        display: none;
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
  right: 2vw;
}

.burger-icon {
  font-size: 6vw;
  color: #F6EEE1; /* Убедитесь, что цвет виден на фоне #003060 */
  font-weight: bold;
  display: block;
  transition: all 0.3s ease;
}

.close-icon {
  color: #F6EEE1 !important; /* Гарантируем видимость крестика */
  font-size: 7vw; /* Немного увеличиваем, чтобы крестик был заметнее */
  text-shadow: 0 0 5px #000; /* Добавляем тень для контраста */
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
  z-index: 255500;
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


  .library-image {
    max-width: 100%;
  }

  .text-section {
    padding: 20px;
  }

  .page-title {
    font-size: 36px;
  }

  .section-title {
    font-size: 28px;
  }

  .about-text {
    font-size: 16px;
  }

  .header-ul {
    flex-direction: column;
    margin-right: 0;
  }

  .header-ul li {
    margin: 10px 0;
  }

  .logo {
    margin-left: 20px;
    width: 15vw;
    position: relative;
    bottom: 2vh;
  }
}
</style>
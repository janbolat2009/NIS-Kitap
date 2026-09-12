<template>
  <div class="apple-main-app">
    <!-- Apple Floating Navbar -->
    <AppleNavbar 
      :is-logged-in="isLoggedIn"
      :user-name="userName"
      :user-avatar="userAvatar"
      @open-register="showRegister = true"
      @open-profile="showProfile = true"
      @open-search="focusSearchInput"
    />

    <!-- Main Page Content -->
    <main class="page-content">
      <!-- Ambient Background Glows -->
      <div class="ambient-glow glow-blue"></div>
      <div class="ambient-glow glow-indigo"></div>

      <!-- Hero Section -->
      <section class="hero-section">
        <div class="hero-container">
          <div class="hero-text-content">
            <div class="hero-tag">
              <span class="pulse-dot"></span>
              <span>Интеллектуальная библиотека NIS</span>
            </div>
            <h1 class="hero-headline">
              Открывай знания. <br />
              <span class="gradient-headline">Читай с удовольствием.</span>
            </h1>
            <p class="hero-subheadline">
              Все книги школы в одном цифровом пространстве. Умный поиск с искусственным интеллектом, мгновенное онлайн-бронирование и персональные рекомендации.
            </p>
            <div class="hero-cta-group">
              <a href="#ai-search-section" class="apple-btn-primary">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path>
                </svg>
                <span>Найти книгу с ИИ</span>
              </a>
              <router-link to="/catalog" class="apple-btn-secondary">
                <span>Каталог книг</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </router-link>
            </div>
          </div>

          <div class="hero-visual">
            <div class="visual-glass-card">
              <img src="@/img/publicLibrary.png" alt="NIS Kitap Library" class="hero-library-art" />
              <div class="glass-reflection"></div>
              <div class="floating-chip chip-books">
                <span class="chip-icon">📖</span>
                <div>
                  <strong>2 000+</strong>
                  <small>Книг в каталоге</small>
                </div>
              </div>
              <div class="floating-chip chip-ai">
                <span class="chip-icon">✨</span>
                <div>
                  <strong>AI Search</strong>
                  <small>Умный подбор</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- AI Search Section -->
      <section class="ai-search-section" id="ai-search-section">
        <div class="section-container">
          <div class="section-badge-header">
            <div class="section-mini-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
              <span>Интеллектуальный помощник</span>
            </div>
            <h2 class="section-title">Умный поиск по смыслу</h2>
            <p class="section-subtitle">
              Опишите своими словами тему, эмоцию или сюжет, и наш ИИ найдет наиболее подходящие книги
            </p>
          </div>

          <!-- Glass Search Box -->
          <div class="ai-search-box glass-panel">
            <div class="search-input-wrapper">
              <svg class="search-icon-svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input 
                ref="searchInput"
                v-model="searchQuery" 
                type="text" 
                placeholder="Например: хочу захватывающую книгу про космические путешествия или антиутопию" 
                class="ai-search-input"
                @keyup.enter="handleAiSearch"
              />
              <button 
                v-if="searchQuery" 
                class="clear-input-btn" 
                @click="searchQuery = ''"
                title="Очистить"
              >
                ✕
              </button>
            </div>
            <button class="ai-submit-btn" :disabled="isSearching" @click="handleAiSearch">
              <span v-if="isSearching" class="btn-spinner"></span>
              <span v-else>Найти с ИИ</span>
            </button>
          </div>

          <!-- Suggestion Chips -->
          <div class="suggestion-chips-row">
            <span class="chips-label">Быстрые идеи:</span>
            <button 
              v-for="prompt in suggestionPrompts" 
              :key="prompt"
              class="prompt-chip"
              @click="applyPrompt(prompt)"
            >
              {{ prompt }}
            </button>
          </div>
        </div>
      </section>

      <!-- Genres Section -->
      <section class="genres-section" id="genres-section">
        <div class="section-container">
          <div class="section-header-flex">
            <div>
              <h2 class="section-title">Жанры книг</h2>
              <p class="section-subtitle">Выберите интересующее направление для изучения коллекции</p>
            </div>
            <router-link to="/catalog" class="view-all-link">
              <span>Все в каталоге</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </router-link>
          </div>

          <div class="genres-grid">
            <div 
              v-for="genre in genreCards" 
              :key="genre.name"
              class="genre-apple-card"
              :style="{ '--card-accent': genre.accent }"
              @click="$router.push(genre.route)"
            >
              <div class="genre-icon-box">
                <img :src="genre.icon" :alt="genre.name" class="genre-icon-img" />
              </div>
              <div class="genre-info">
                <h3 class="genre-title">{{ genre.name }}</h3>
                <p class="genre-desc">{{ genre.desc }}</p>
              </div>
              <div class="genre-arrow">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Languages Section -->
      <section class="languages-section" id="languages-section">
        <div class="section-container">
          <div class="section-header-flex">
            <div>
              <h2 class="section-title">Языковые отделения</h2>
              <p class="section-subtitle">Литература на трех основных языках нашей школы</p>
            </div>
          </div>

          <div class="languages-grid">
            <!-- Kazakh -->
            <div class="lang-apple-card" @click="$router.push('/kazakh')">
              <div class="lang-card-bg kz-bg"></div>
              <div class="lang-content">
                <div class="lang-flag-pill">🇰🇿 Қазақстан</div>
                <h3 class="lang-title">Қазақ тілі</h3>
                <p class="lang-desc">Классикалық қазақ әдебиеті, тарихи романдар мен заманауи шығармалар</p>
                <div class="lang-action">
                  <span>Кітаптарды қарау</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </div>
              </div>
            </div>

            <!-- Russian -->
            <div class="lang-apple-card" @click="$router.push('/russian')">
              <div class="lang-card-bg ru-bg"></div>
              <div class="lang-content">
                <div class="lang-flag-pill">🇷🇺 Классика и современность</div>
                <h3 class="lang-title">Русский язык</h3>
                <p class="lang-desc">Мировая художественная классика, научная фантастика и публицистика</p>
                <div class="lang-action">
                  <span>Смотреть книги</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </div>
              </div>
            </div>

            <!-- English -->
            <div class="lang-apple-card" @click="$router.push('/english')">
              <div class="lang-card-bg en-bg"></div>
              <div class="lang-content">
                <div class="lang-flag-pill">🇬🇧 World Literature</div>
                <h3 class="lang-title">English Books</h3>
                <p class="lang-desc">Original editions, bestselling fiction, academic and IELTS resources</p>
                <div class="lang-action">
                  <span>Explore books</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Bestsellers Spotlight Section -->
      <section class="bestsellers-section" id="bestsellers-section">
        <div class="section-container">
          <div class="section-header-flex">
            <div>
              <div class="section-mini-badge">
                <span>🔥 Популярное среди учеников</span>
              </div>
              <h2 class="section-title">Бестселлеры библиотеки</h2>
              <p class="section-subtitle">Книги, которые читают прямо сейчас</p>
            </div>
            <router-link to="/catalog" class="view-all-link">
              <span>Смотреть все</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </router-link>
          </div>

          <div v-if="loadingBestsellers" class="bestsellers-loading">
            <div v-for="n in 4" :key="n" class="skeleton-card glass-panel"></div>
          </div>

          <div v-else class="bestsellers-grid">
            <BookCard 
              v-for="book in bestsellers" 
              :key="book._id" 
              :book="book" 
              @select="goToBookDetail"
            />
          </div>
        </div>
      </section>

      <!-- About Us Teaser Section -->
      <section class="about-teaser-section">
        <div class="section-container">
          <div class="about-glass-box glass-panel">
            <div class="about-text-side">
              <span class="about-badge">О проекте NIS Kitap</span>
              <h2 class="about-title">Создано учениками для учеников</h2>
              <p class="about-description">
                NIS Kitap — это не просто каталог, а экосистема удобного чтения. Мы объединили тысячи томов школьной библиотеки в современном цифровом интерфейсе, чтобы поиск нужной литературы занимал считанные секунды.
              </p>
              <div class="about-stats-row">
                <div class="stat-item">
                  <strong>2 000+</strong>
                  <span>Школьных книг</span>
                </div>
                <div class="stat-item">
                  <strong>7</strong>
                  <span>Жанровых секций</span>
                </div>
                <div class="stat-item">
                  <strong>3</strong>
                  <span>Языка обучения</span>
                </div>
              </div>
              <router-link to="/about-us" class="apple-btn-secondary about-cta">
                <span>Узнать больше о нас</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </router-link>
            </div>
            <div class="about-visual-side">
              <img src="@/img/illustra 1.png" alt="About NIS Kitap" class="about-teaser-img" />
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- Modals -->
    <!-- Register / Login Modal -->
    <div v-if="showRegister" class="apple-modal-overlay" @click="showRegister = false">
      <div class="modal-wrapper" @click.stop>
        <button class="modal-close-icon" @click="showRegister = false">✕</button>
        <Register @registered="onRegistered" @loggedIn="onLoggedIn" />
      </div>
    </div>

    <!-- User Profile Modal -->
    <div v-if="showProfile" class="apple-modal-overlay" @click="showProfile = false">
      <div class="modal-wrapper" @click.stop>
        <Profile 
          :email="userEmail" 
          :name="userName" 
          @back="showProfile = false" 
          @updated="onProfileUpdated"
          @loggedOut="onLoggedOut"
        />
      </div>
    </div>

    <!-- AI Search Results Modal -->
    <div v-if="showSearchResults" class="apple-modal-overlay" @click="showSearchResults = false">
      <div class="modal-wrapper" @click.stop>
        <button class="modal-close-icon" @click="showSearchResults = false">✕</button>
        <SearchResults :results="searchResults" @book-click="goToBookDetail" />
      </div>
    </div>

    <!-- Apple Footer -->
    <AppleFooter />
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import AppleNavbar from '@/components/AppleNavbar.vue';
import AppleFooter from '@/components/AppleFooter.vue';
import BookCard from '@/components/BookCard.vue';
import Register from '@/components/Register.vue';
import Profile from '@/components/Profile.vue';
import SearchResults from '@/components/SearchResults.vue';
import { getBooks, searchAi } from '@/services/bookService';

// Images
import fantasticIcon from '@/img/Fantastic.png';
import fantasyIcon from '@/img/mdi_fantasy.png';
import detectiveIcon from '@/img/ph_detective-fill.png';
import adventureIcon from '@/img/icons8_adventures.png';
import biographyIcon from '@/img/mdi_biography.png';
import romanticaIcon from '@/img/devicon-plain_love2d.png';
import poetryIcon from '@/img/streamline-ultimate_playlist-songs-bold.png';

export default {
  name: 'App',
  components: {
    AppleNavbar,
    AppleFooter,
    BookCard,
    Register,
    Profile,
    SearchResults,
  },
  setup() {
    const router = useRouter();
    const isLoggedIn = ref(false);
    const userEmail = ref('');
    const userName = ref('');
    const userAvatar = ref('');

    const showRegister = ref(false);
    const showProfile = ref(false);
    const showSearchResults = ref(false);

    const searchQuery = ref('');
    const isSearching = ref(false);
    const searchResults = ref([]);
    const searchInput = ref(null);

    const bestsellers = ref([]);
    const loadingBestsellers = ref(true);

    const suggestionPrompts = [
      'Антиутопия и цензура',
      'Космическая фантастика',
      'Қазақ тарихы',
      'Психология и саморазвитие',
      'Шерлок Холмс и детективы',
    ];

    const genreCards = [
      { name: 'Фантастика', desc: 'Будущее, технологии и космос', route: '/fantastica', icon: fantasticIcon, accent: '#38BDF8' },
      { name: 'Фэнтези', desc: 'Магия, миры и древние мифы', route: '/fantasy', icon: fantasyIcon, accent: '#818CF8' },
      { name: 'Детектив', desc: 'Загадки, расследования и логика', route: '/detective', icon: detectiveIcon, accent: '#F59E0B' },
      { name: 'Приключения', desc: 'Путешествия и опасные экспедиции', route: '/adventure', icon: adventureIcon, accent: '#10B981' },
      { name: 'Биография', desc: 'Истории великих личностей', route: '/biography', icon: biographyIcon, accent: '#EC4899' },
      { name: 'Романтика', desc: 'Чувства, переживания и судьбы', route: '/romantica', icon: romanticaIcon, accent: '#F43F5E' },
      { name: 'Поэзия', desc: 'Стихи и поэтические сборники', route: '/poetry', icon: poetryIcon, accent: '#6366F1' },
    ];

    onMounted(async () => {
      // 1. Проверка авторизации из localStorage
      const localUser = localStorage.getItem('user');
      if (localUser) {
        try {
          const parsed = JSON.parse(localUser);
          isLoggedIn.value = true;
          userEmail.value = parsed.email || '';
          userName.value = parsed.name || '';
          userAvatar.value = parsed.avatar || '';
        } catch {
          // ignore
        }
      }

      // 2. Firebase auth listener
      try {
        const auth = getAuth();
        onAuthStateChanged(auth, (user) => {
          if (user) {
            isLoggedIn.value = true;
            userEmail.value = user.email || '';
            userName.value = user.displayName || userName.value || user.email.split('@')[0];
            localStorage.setItem('user', JSON.stringify({
              email: userEmail.value,
              name: userName.value,
              avatar: userAvatar.value,
            }));
            localStorage.setItem('isLoggedIn', 'true');
          }
        });
      } catch (err) {
        console.warn('Firebase init:', err);
      }

      // 3. Загрузка бестселлеров через bookService
      try {
        const all = await getBooks();
        if (all && all.length > 0) {
          // Выбираем интересные книги с высоким рейтингом / копиями для витрины
          bestsellers.value = all.slice(0, 8);
        }
      } catch (err) {
        console.error('Ошибка загрузки бестселлеров:', err);
      } finally {
        loadingBestsellers.value = false;
      }
    });

    const focusSearchInput = () => {
      const el = document.getElementById('ai-search-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        setTimeout(() => {
          searchInput.value?.focus();
        }, 500);
      }
    };

    const applyPrompt = (promptText) => {
      searchQuery.value = promptText;
      handleAiSearch();
    };

    const handleAiSearch = async () => {
      if (!searchQuery.value || !searchQuery.value.trim()) {
        focusSearchInput();
        return;
      }

      isSearching.value = true;
      try {
        const results = await searchAi(searchQuery.value);
        searchResults.value = results;
        showSearchResults.value = true;
      } catch (err) {
        console.error('Ошибка поиска ИИ:', err);
      } finally {
        isSearching.value = false;
      }
    };

    const goToBookDetail = (book) => {
      showSearchResults.value = false;
      router.push(`/book/${encodeURIComponent(book.title)}`);
    };

    const onRegistered = (payload) => {
      userEmail.value = payload.email;
      userName.value = payload.name;
      isLoggedIn.value = true;
      showRegister.value = false;
      showProfile.value = true;
      localStorage.setItem('user', JSON.stringify({ email: payload.email, name: payload.name, avatar: '' }));
      localStorage.setItem('isLoggedIn', 'true');
    };

    const onLoggedIn = (payload) => {
      userEmail.value = payload.email;
      userName.value = payload.name;
      isLoggedIn.value = true;
      showRegister.value = false;
      localStorage.setItem('user', JSON.stringify({ email: payload.email, name: payload.name, avatar: '' }));
      localStorage.setItem('isLoggedIn', 'true');
    };

    const onProfileUpdated = (data) => {
      if (data.name) userName.value = data.name;
      if (data.avatar) userAvatar.value = data.avatar;
    };

    const onLoggedOut = () => {
      isLoggedIn.value = false;
      userEmail.value = '';
      userName.value = '';
      userAvatar.value = '';
    };

    return {
      isLoggedIn,
      userEmail,
      userName,
      userAvatar,
      showRegister,
      showProfile,
      showSearchResults,
      searchQuery,
      isSearching,
      searchResults,
      searchInput,
      bestsellers,
      loadingBestsellers,
      suggestionPrompts,
      genreCards,
      focusSearchInput,
      applyPrompt,
      handleAiSearch,
      goToBookDetail,
      onRegistered,
      onLoggedIn,
      onProfileUpdated,
      onLoggedOut,
    };
  },
};
</script>

<style scoped>
.apple-main-app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow-x: hidden;
}

.page-content {
  flex: 1;
  padding-top: 80px;
  position: relative;
}

/* Ambient Glows */
.ambient-glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(120px);
  pointer-events: none;
  z-index: 0;
  opacity: 0.35;
}
.glow-blue {
  top: 40px;
  left: 20%;
  width: 500px;
  height: 500px;
  background: #0071E3;
}
.glow-indigo {
  top: 600px;
  right: 15%;
  width: 600px;
  height: 600px;
  background: #6366F1;
}

.section-container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 24px;
  position: relative;
  z-index: 1;
}

/* Hero Section */
.hero-section {
  padding: 60px 0 80px;
  position: relative;
  z-index: 1;
}

.hero-container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 24px;
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  align-items: center;
  gap: 50px;
}

.hero-tag {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  border-radius: 9999px;
  background: rgba(0, 113, 227, 0.14);
  border: 1px solid rgba(56, 189, 248, 0.3);
  color: #38BDF8;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 20px;
}
.pulse-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #38BDF8;
  box-shadow: 0 0 8px #38BDF8;
  animation: pulse 2s infinite;
}
@keyframes pulse {
  0% { transform: scale(0.95); opacity: 0.7; }
  50% { transform: scale(1.2); opacity: 1; }
  100% { transform: scale(0.95); opacity: 0.7; }
}

.hero-headline {
  font-size: 52px;
  font-weight: 800;
  line-height: 1.12;
  letter-spacing: -0.03em;
  margin: 0 0 20px;
  color: #FFFFFF;
}

.gradient-headline {
  background: linear-gradient(135deg, #FFFFFF 20%, #38BDF8 65%, #818CF8 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.hero-subheadline {
  font-size: 18px;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.7);
  margin: 0 0 32px;
  max-width: 540px;
}

.hero-cta-group {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

/* Hero Visual */
.hero-visual {
  display: flex;
  justify-content: center;
}

.visual-glass-card {
  position: relative;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 32px;
  padding: 30px;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.5);
  max-width: 480px;
  width: 100%;
}

.hero-library-art {
  width: 100%;
  height: auto;
  border-radius: 20px;
  display: block;
  filter: drop-shadow(0 10px 25px rgba(0, 0, 0, 0.4));
  transition: transform 0.5s ease;
}
.visual-glass-card:hover .hero-library-art {
  transform: scale(1.02);
}

.floating-chip {
  position: absolute;
  background: rgba(14, 22, 38, 0.9);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 16px;
  padding: 10px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.4);
  animation: float 4s ease-in-out infinite alternate;
}
.chip-books {
  top: -16px;
  left: -20px;
}
.chip-ai {
  bottom: -16px;
  right: -20px;
  animation-delay: 2s;
}
@keyframes float {
  from { transform: translateY(0px); }
  to { transform: translateY(-8px); }
}
.chip-icon {
  font-size: 22px;
}
.floating-chip strong {
  display: block;
  font-size: 15px;
  color: #FFFFFF;
}
.floating-chip small {
  font-size: 11.5px;
  color: rgba(255, 255, 255, 0.6);
}

/* Section Header Shared */
.section-badge-header {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 32px;
}

.section-mini-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: 9999px;
  background: rgba(0, 113, 227, 0.12);
  border: 1px solid rgba(56, 189, 248, 0.3);
  color: #38BDF8;
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 12px;
}

.section-title {
  font-size: 34px;
  font-weight: 700;
  letter-spacing: -0.02em;
  margin: 0 0 10px;
  color: #FFFFFF;
}

.section-subtitle {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.65);
  margin: 0;
  max-width: 600px;
  line-height: 1.5;
}

.section-header-flex {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 36px;
  flex-wrap: wrap;
  gap: 16px;
}

.view-all-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #38BDF8;
  text-decoration: none;
  font-size: 14.5px;
  font-weight: 600;
  padding: 6px 14px;
  background: rgba(0, 113, 227, 0.12);
  border: 1px solid rgba(56, 189, 248, 0.25);
  border-radius: 9999px;
  transition: all 0.25s ease;
}
.view-all-link:hover {
  background: rgba(0, 113, 227, 0.22);
  border-color: rgba(56, 189, 248, 0.5);
  transform: translateX(3px);
}

/* AI Search Box */
.ai-search-section {
  padding: 60px 0;
}

.ai-search-box {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 10px 8px 18px;
  max-width: 860px;
  margin: 0 auto 20px;
  border-radius: 9999px;
  background: rgba(14, 24, 44, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.16);
  box-shadow: 0 16px 36px rgba(0, 0, 0, 0.4), 0 0 30px rgba(0, 113, 227, 0.2);
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}
.ai-search-box:focus-within {
  border-color: #38BDF8;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.5), 0 0 35px rgba(56, 189, 248, 0.35);
}

.search-input-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.search-icon-svg {
  stroke: #38BDF8;
  flex-shrink: 0;
}

.ai-search-input {
  width: 100%;
  background: transparent;
  border: none;
  color: #FFFFFF;
  font-family: inherit;
  font-size: 16px;
  outline: none;
}
.ai-search-input::placeholder {
  color: rgba(255, 255, 255, 0.45);
}

.clear-input-btn {
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  font-size: 14px;
  padding: 4px 8px;
}
.clear-input-btn:hover {
  color: #FFFFFF;
}

.ai-submit-btn {
  background: linear-gradient(135deg, #0071E3 0%, #0056B3 100%);
  color: #FFFFFF;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 9999px;
  padding: 12px 26px;
  font-family: inherit;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.25s ease;
  box-shadow: 0 4px 14px rgba(0, 113, 227, 0.4);
}
.ai-submit-btn:hover:not(:disabled) {
  transform: scale(1.02);
  box-shadow: 0 6px 20px rgba(0, 113, 227, 0.6);
}

.btn-spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #FFFFFF;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

.suggestion-chips-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;
}

.chips-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
}

.prompt-chip {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.8);
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  padding: 6px 14px;
  border-radius: 9999px;
  cursor: pointer;
  transition: all 0.2s ease;
}
.prompt-chip:hover {
  background: rgba(0, 113, 227, 0.2);
  border-color: rgba(56, 189, 248, 0.4);
  color: #FFFFFF;
  transform: translateY(-1px);
}

/* Genres Grid */
.genres-section {
  padding: 70px 0;
}

.genres-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.genre-apple-card {
  position: relative;
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.09);
  border-radius: 20px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.genre-apple-card:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: var(--card-accent);
  transform: translateY(-4px);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.35);
}

.genre-icon-box {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.genre-icon-img {
  width: 28px;
  height: 28px;
  object-fit: contain;
}

.genre-info {
  flex: 1;
}

.genre-title {
  margin: 0 0 4px;
  font-size: 16.5px;
  font-weight: 600;
  color: #FFFFFF;
}

.genre-desc {
  margin: 0;
  font-size: 12.5px;
  color: rgba(255, 255, 255, 0.55);
  line-height: 1.4;
}

.genre-arrow {
  color: rgba(255, 255, 255, 0.3);
  transition: transform 0.2s ease, color 0.2s ease;
}
.genre-apple-card:hover .genre-arrow {
  color: var(--card-accent);
  transform: translateX(3px);
}

/* Languages Section */
.languages-section {
  padding: 50px 0 70px;
}

.languages-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 24px;
}

.lang-apple-card {
  position: relative;
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  padding: 30px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}
.lang-apple-card:hover {
  transform: translateY(-5px);
  border-color: rgba(56, 189, 248, 0.4);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
}

.lang-card-bg {
  position: absolute;
  inset: 0;
  opacity: 0.12;
  transition: opacity 0.35s ease;
}
.lang-apple-card:hover .lang-card-bg {
  opacity: 0.2;
}

.kz-bg {
  background: radial-gradient(circle at bottom right, #00AFCA, transparent 70%);
}
.ru-bg {
  background: radial-gradient(circle at bottom right, #3B82F6, transparent 70%);
}
.en-bg {
  background: radial-gradient(circle at bottom right, #8B5CF6, transparent 70%);
}

.lang-content {
  position: relative;
  z-index: 1;
}

.lang-flag-pill {
  font-size: 12px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.85);
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.14);
  padding: 4px 10px;
  border-radius: 9999px;
  width: fit-content;
  margin-bottom: 16px;
}

.lang-title {
  margin: 0 0 8px;
  font-size: 24px;
  font-weight: 700;
  color: #FFFFFF;
}

.lang-desc {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.65);
  line-height: 1.5;
  margin: 0 0 24px;
}

.lang-action {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #38BDF8;
  font-size: 14px;
  font-weight: 600;
}
.lang-apple-card:hover .lang-action svg {
  transform: translateX(4px);
}
.lang-action svg {
  transition: transform 0.2s ease;
}

/* Bestsellers */
.bestsellers-section {
  padding: 60px 0;
}

.bestsellers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 24px;
}

.bestsellers-loading {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 24px;
}

.skeleton-card {
  height: 340px;
  border-radius: 20px;
  animation: pulse-skeleton 1.5s infinite ease-in-out;
}
@keyframes pulse-skeleton {
  0% { opacity: 0.3; }
  50% { opacity: 0.6; }
  100% { opacity: 0.3; }
}

/* About Teaser */
.about-teaser-section {
  padding: 60px 0 100px;
}

.about-glass-box {
  display: grid;
  grid-template-columns: 1.3fr 1fr;
  align-items: center;
  gap: 40px;
  padding: 48px;
  border-radius: 32px;
}

.about-badge {
  font-size: 12.5px;
  font-weight: 600;
  color: #38BDF8;
  background: rgba(0, 113, 227, 0.15);
  border: 1px solid rgba(56, 189, 248, 0.3);
  padding: 4px 12px;
  border-radius: 9999px;
  display: inline-block;
  margin-bottom: 16px;
}

.about-title {
  margin: 0 0 14px;
  font-size: 32px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: #FFFFFF;
}

.about-description {
  font-size: 16px;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.7);
  margin: 0 0 28px;
}

.about-stats-row {
  display: flex;
  gap: 32px;
  margin-bottom: 32px;
  flex-wrap: wrap;
}

.stat-item strong {
  display: block;
  font-size: 26px;
  font-weight: 800;
  color: #FFFFFF;
}
.stat-item span {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.55);
}

.about-visual-side {
  display: flex;
  justify-content: center;
}
.about-teaser-img {
  max-width: 100%;
  height: auto;
  filter: drop-shadow(0 15px 30px rgba(0, 0, 0, 0.4));
}

/* Apple Modal Overlays */
.apple-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.modal-wrapper {
  position: relative;
  max-width: 100%;
}

.modal-close-icon {
  position: absolute;
  top: 14px;
  right: 14px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.14);
  color: rgba(255, 255, 255, 0.7);
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  z-index: 10;
  transition: all 0.2s ease;
}
.modal-close-icon:hover {
  background: rgba(255, 255, 255, 0.18);
  color: #FFFFFF;
}

/* Responsive */
@media (max-width: 960px) {
  .hero-container {
    grid-template-columns: 1fr;
    text-align: center;
  }
  .hero-headline {
    font-size: 38px;
  }
  .hero-subheadline {
    margin: 0 auto 28px;
  }
  .hero-cta-group {
    justify-content: center;
  }
  .about-glass-box {
    grid-template-columns: 1fr;
    padding: 32px 24px;
  }
}

@media (max-width: 600px) {
  .hero-headline {
    font-size: 32px;
  }
  .ai-search-box {
    border-radius: 20px;
    flex-direction: column;
    padding: 12px;
  }
  .ai-submit-btn {
    width: 100%;
  }
  .chip-books, .chip-ai {
    display: none;
  }
}
</style>
<template>
  <div class="apple-lang-view">

    <main class="lang-main-content">
      <div class="lang-container">
        <!-- Breadcrumbs & Nav -->
        <div class="top-nav-bar">
          <button class="back-btn" @click="handleBack">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
            <span>{{ t('bookDetail.backToCatalog') }}</span>
          </button>
          <div class="breadcrumbs">
            <router-link to="/">{{ t('nav.home') }}</router-link>
            <span>/</span>
            <router-link to="/catalog">{{ t('nav.catalog') }}</router-link>
            <span>/</span>
            <span class="active-crumb">{{ languageDisplayName }}</span>
          </div>
        </div>

        <!-- Language Hero -->
        <div class="lang-hero glass-panel">
          <div class="lang-hero-left">
            <div class="lang-flag-box">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="2" y1="12" x2="22" y2="12"></line>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
              </svg>
            </div>
            <div>
              <div class="lang-badge">{{ t('languages.title') }}</div>
              <h1 class="lang-heading">{{ languageDisplayName }}</h1>
              <p class="lang-description">{{ languageDesc }}</p>
            </div>
          </div>

          <div class="lang-stats-pill">
            <span>{{ t('catalog.foundCount') }}</span>
            <strong>{{ filteredBooks.length }}</strong>
          </div>
        </div>

        <!-- Toolbar: Search & Genre filter -->
        <div class="lang-toolbar glass-panel">
          <div class="search-box">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" style="color: var(--accent-text)" stroke-width="2.2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input 
              v-model="searchQuery" 
              type="text" 
              :placeholder="t('catalog.searchPlaceholder')" 
              class="lang-search-input"
            />
            <button v-if="searchQuery" class="clear-search" @click="searchQuery = ''">✕</button>
          </div>

          <div class="filters-group">
            <select v-model="selectedGenre" class="apple-select">
              <option value="">{{ t('filterModal.genresSection') }}</option>
              <option v-for="g in availableGenres" :key="g" :value="g">{{ g }}</option>
            </select>

            <select v-model="sortBy" class="apple-select">
              <option value="default">{{ t('catalog.sortDefault') }}</option>
              <option value="title">{{ t('catalog.sortTitle') }}</option>
              <option value="year-desc">{{ t('catalog.sortYearDesc') }}</option>
              <option value="copies-desc">{{ t('catalog.sortCopiesDesc') }}</option>
            </select>
          </div>
        </div>

        <!-- Books Grid -->
        <div v-if="loading" class="books-grid">
          <div v-for="n in 8" :key="n" class="skeleton-card glass-panel"></div>
        </div>

        <div v-else-if="filteredBooks.length === 0" class="empty-state glass-panel">
          <h3>{{ t('catalog.emptyTitle') }}</h3>
          <p>{{ t('catalog.emptyDesc') }}</p>
          <button class="apple-btn-primary" @click="resetFilters">{{ t('catalog.resetAll') }}</button>
        </div>

        <div v-else class="books-grid-wrapper">
          <div class="books-grid">
            <BookCard 
              v-for="book in filteredBooks" 
              :key="book._id" 
              :book="book" 
            />
          </div>
        </div>
      </div>
    </main>

    <!-- Modals -->


  </div>
</template>

<script>
import { watch as watchShell } from 'vue';
import { openLogin } from '@/stores/ui';
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import BookCard from '@/components/BookCard.vue';
import { getBooksByLanguage, matchGenre } from '@/services/bookService';
import { t } from '@/i18n';
import { bindSessionRefs } from '@/stores/session';

export default {
  name: 'LanguageBookView',
  components: {
    BookCard,
  },
  props: {
    languageTitle: {
      type: String,
      required: true,
    },
    languageDisplayName: {
      type: String,
      required: true,
    },
    languageDesc: {
      type: String,
      default: '',
    },
    flagEmoji: {
      type: String,
      default: '',
    },
  },
  setup(props) {
    const router = useRouter();
    const books = ref([]);
    const loading = ref(true);
    const searchQuery = ref('');
    const selectedGenre = ref('');
    const sortBy = ref('default');

    const isLoggedIn = ref(false);
    const userEmail = ref('');
    const userName = ref('');
    const userAvatar = ref('');
    const showRegister = ref(false);
    watchShell(showRegister, (v) => { if (v) { openLogin(); showRegister.value = false; } });
    const showProfile = ref(false);

    // Auth state comes only from Firebase (src/stores/session.js).
    bindSessionRefs({ isLoggedIn, userEmail, userName, userAvatar });

    onMounted(async () => {

      try {
        books.value = await getBooksByLanguage(props.languageTitle);
      } catch (err) {
        console.error('Ошибка загрузки книг по языку:', err);
      } finally {
        loading.value = false;
      }
    });

    const availableGenres = computed(() => {
      const set = new Set();
      books.value.forEach((b) => {
        if (Array.isArray(b.genre)) {
          b.genre.forEach((g) => set.add(g));
        } else if (b.genre) {
          set.add(b.genre);
        }
      });
      return Array.from(set).sort();
    });

    const filteredBooks = computed(() => {
      let list = books.value;

      if (selectedGenre.value) {
        list = list.filter((b) => matchGenre(b.genre, selectedGenre.value));
      }

      if (searchQuery.value.trim()) {
        const q = searchQuery.value.toLowerCase().trim();
        list = list.filter((b) => {
          return (b.title || '').toLowerCase().includes(q) || (b.author || '').toLowerCase().includes(q);
        });
      }

      if (sortBy.value === 'title') {
        list = [...list].sort((a, b) => (a.title || '').localeCompare(b.title || '', 'ru'));
      } else if (sortBy.value === 'year-desc') {
        list = [...list].sort((a, b) => Number(b.year || 0) - Number(a.year || 0));
      } else if (sortBy.value === 'copies-desc') {
        list = [...list].sort((a, b) => Number(b.copies || 0) - Number(a.copies || 0));
      }

      return list;
    });

    const resetFilters = () => {
      searchQuery.value = '';
      selectedGenre.value = '';
    };

    const handleBack = () => {
      if (window.history.length > 1) {
        router.back();
      } else {
        router.push('/');
      }
    };

    const onRegistered = (payload) => {
      userEmail.value = payload.email;
      userName.value = payload.name;
      userAvatar.value = payload.avatar || '';
      isLoggedIn.value = true;
      showRegister.value = false;
      showProfile.value = true;
      localStorage.setItem('user', JSON.stringify({ email: payload.email, name: payload.name, avatar: userAvatar.value }));
      localStorage.setItem('isLoggedIn', 'true');
    };

    const onLoggedIn = (payload) => {
      userEmail.value = payload.email;
      userName.value = payload.name;
      userAvatar.value = payload.avatar || '';
      isLoggedIn.value = true;
      showRegister.value = false;
      localStorage.setItem('user', JSON.stringify({ email: payload.email, name: payload.name, avatar: userAvatar.value }));
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
      books,
      loading,
      searchQuery,
      selectedGenre,
      sortBy,
      availableGenres,
      filteredBooks,
      isLoggedIn,
      userEmail,
      userName,
      userAvatar,
      showRegister,
      showProfile,
      resetFilters,
      handleBack,
      onRegistered,
      onLoggedIn,
      onProfileUpdated,
      onLoggedOut,
      t,
    };
  },
};
</script>

<style scoped>
.apple-lang-view {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.lang-main-content {
  flex: 1;
  padding: 100px 0 80px;
}

.lang-container {
  max-width: 1320px;
  margin: 0 auto;
  padding: 0 24px;
}

.top-nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 12px;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--surface-2);
  border: 1px solid var(--line);
  color: var(--text-1);
  padding: 8px 16px;
  border-radius: 9999px;
  font-family: inherit;
  font-size: 13.5px;
  cursor: pointer;
  transition-property: background-color, border-color, color, box-shadow, transform, opacity; transition-duration: 0.2s; transition-timing-function: ease;
}
.back-btn:hover {
  background: var(--surface-3);
}

.breadcrumbs {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--text-2);
}
.breadcrumbs a {
  color: var(--accent-text);
  text-decoration: none;
}
.active-crumb {
  color: var(--text-1);
}

/* Hero */
.lang-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32px;
  border-radius: 28px;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 20px;
}

.lang-hero-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.lang-flag-box {
  width: 68px;
  height: 68px;
  border-radius: 20px;
  background: var(--surface-2);
  border: 1px solid var(--line);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 34px;
  flex-shrink: 0;
  box-shadow: var(--shadow-2);
}

.lang-badge {
  font-size: 11.5px;
  font-weight: 600;
  color: var(--accent-text);
  background: var(--accent-soft);
  border: 1px solid var(--accent-soft);
  padding: 3px 10px;
  border-radius: 9999px;
  width: fit-content;
  margin-bottom: 6px;
}

.lang-heading {
  margin: 0 0 6px;
  font-size: 32px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--text-1);
}

.lang-description {
  margin: 0;
  font-size: 15px;
  color: var(--text-2);
}

.lang-stats-pill {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: var(--surface-2);
  border: 1px solid var(--line);
  padding: 12px 20px;
  border-radius: 16px;
}
.lang-stats-pill span {
  font-size: 12px;
  color: var(--text-2);
}
.lang-stats-pill strong {
  font-size: 24px;
  color: var(--accent-text);
}

/* Toolbar */
.lang-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 18px;
  border-radius: 18px;
  margin-bottom: 28px;
  gap: 16px;
  flex-wrap: wrap;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 260px;
}

.lang-search-input {
  width: 100%;
  background: transparent;
  border: none;
  color: var(--text-1);
  font-family: inherit;
  font-size: 14.5px;
  outline: none;
}
.lang-search-input::placeholder {
  color: var(--text-3);
}

.clear-search {
  background: transparent;
  border: none;
  color: var(--text-2);
  cursor: pointer;
}

.filters-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.apple-select {
  background: var(--surface-2);
  border: 1px solid var(--line);
  color: var(--text-1);
  padding: 8px 14px;
  border-radius: 12px;
  font-family: inherit;
  font-size: 13.5px;
  outline: none;
  cursor: pointer;
}
.apple-select option {
  background: var(--surface);
  color: var(--text-1);
}

/* Grid */
.books-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 24px;
}

.skeleton-card {
  height: 340px;
  border-radius: 20px;
  animation: pulse 1.5s infinite ease-in-out;
}
@keyframes pulse {
  0% { opacity: 0.3; }
  50% { opacity: 0.6; }
  100% { opacity: 0.3; }
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  border-radius: 24px;
}
.empty-icon {
  font-size: 44px;
  margin-bottom: 12px;
}
.empty-state h3 {
  margin: 0 0 8px;
  color: var(--text-1);
}
.empty-state p {
  color: var(--text-2);
  margin: 0 0 18px;
}

/* Modal */
.apple-modal-overlay {
  position: fixed;
  inset: 0;
  background: var(--surface);


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
  background: var(--surface-2);
  border: 1px solid var(--line);
  color: var(--text-2);
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  z-index: 10;
}
</style>

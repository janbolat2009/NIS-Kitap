<template>
  <div class="apple-catalog-page">
    <!-- Navbar -->
    <AppleNavbar 
      :is-logged-in="isLoggedIn"
      :user-name="userName"
      :user-avatar="userAvatar"
      @open-register="showRegister = true"
      @open-profile="showProfile = true"
      @open-search="focusSearch"
    />

    <!-- Main Content -->
    <main class="catalog-main">
      <div class="catalog-container">
        <!-- Page Header -->
        <div class="catalog-header">
          <div class="header-breadcrumbs">
            <router-link to="/">Главная</router-link>
            <span>/</span>
            <span class="current">Каталог</span>
          </div>
          <h1 class="catalog-title">Каталог школьных книг</h1>
          <p class="catalog-subtitle">
            Исследуйте полную коллекцию школьной библиотеки NIS. Фильтруйте по жанрам, языкам и находите нужные издания.
          </p>
        </div>

        <!-- Search & Filter Bar -->
        <div class="filter-toolbar glass-panel">
          <!-- Live Search Input -->
          <div class="search-input-field">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input 
              ref="catalogSearchInput"
              v-model="searchQuery" 
              type="text" 
              placeholder="Поиск по названию, автору или жанру..." 
              class="catalog-search"
            />
            <button v-if="searchQuery" class="clear-btn" @click="searchQuery = ''">✕</button>
          </div>

          <!-- Controls Right: Sort & Filter Sheet Button -->
          <div class="toolbar-actions">
            <!-- Sort dropdown -->
            <div class="select-wrapper">
              <select v-model="sortBy" class="apple-select">
                <option value="default">По умолчанию</option>
                <option value="title">По названию (А-Я)</option>
                <option value="year-desc">Сначала новые года</option>
                <option value="copies-desc">По доступным копиям</option>
              </select>
            </div>

            <!-- Filter Modal Button -->
            <button class="filter-sheet-btn" @click="showFilterModal = true">
              <img src="@/img/filter-icon.png" alt="Filter" class="filter-svg" />
              <span>Фильтры</span>
              <span v-if="hasActiveFilters" class="filter-active-dot"></span>
            </button>
          </div>
        </div>

        <!-- Quick Filter Pills Bar -->
        <div class="quick-pills-row">
          <!-- All -->
          <button 
            class="pill-btn" 
            :class="{ active: !activeGenre && !activeLanguage }"
            @click="resetAllFilters"
          >
            Все книги
          </button>

          <!-- Genres -->
          <div class="pills-divider"></div>
          <button 
            v-for="g in genres" 
            :key="g"
            class="pill-btn"
            :class="{ active: activeGenre === g }"
            @click="toggleGenre(g)"
          >
            {{ g }}
          </button>

          <!-- Languages -->
          <div class="pills-divider"></div>
          <button 
            v-for="l in languages" 
            :key="l"
            class="pill-btn lang-pill"
            :class="{ active: activeLanguage === l }"
            @click="toggleLanguage(l)"
          >
            {{ l }}
          </button>
        </div>

        <!-- Active Filters Summary & Count -->
        <div class="catalog-summary-bar">
          <div class="results-count">
            <span>Найдено: <b>{{ filteredBooks.length }}</b> книг</span>
            <span v-if="activeGenre || activeLanguage || searchQuery" class="filter-tag-hint">
              (применены фильтры)
            </span>
          </div>

          <div v-if="hasActiveFilters" class="active-chips">
            <span v-if="activeGenre" class="active-chip" @click="activeGenre = ''">
              Жанр: {{ activeGenre }} ✕
            </span>
            <span v-if="activeLanguage" class="active-chip" @click="activeLanguage = ''">
              Язык: {{ activeLanguage }} ✕
            </span>
            <button class="reset-all-link" @click="resetAllFilters">Сбросить всё</button>
          </div>
        </div>

        <!-- Books Grid -->
        <div v-if="loading" class="books-grid">
          <div v-for="n in 8" :key="n" class="skeleton-book-card glass-panel"></div>
        </div>

        <div v-else-if="filteredBooks.length === 0" class="no-books-state glass-panel">
          <div class="no-books-icon">🔍</div>
          <h3>Ничего не найдено</h3>
          <p>По вашему запросу не нашлось подходящих книг. Попробуйте сбросить фильтры или изменить поисковый запрос.</p>
          <button class="apple-btn-primary" @click="resetAllFilters">Сбросить все фильтры</button>
        </div>

        <div v-else class="books-grid-wrapper">
          <div class="books-grid">
            <BookCard 
              v-for="book in visibleBooks" 
              :key="book._id" 
              :book="book" 
              @select="goToBookDetail"
            />
          </div>

          <!-- Load More Button -->
          <div v-if="visibleBooks.length < filteredBooks.length" class="load-more-row">
            <button class="apple-btn-secondary load-more-btn" @click="loadMore">
              <span>Показать ещё ({{ filteredBooks.length - visibleBooks.length }})</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </main>

    <!-- Modals -->
    <!-- Filter Modal -->
    <FilterModal 
      v-model="showFilterModal"
      :genres="genres"
      :languages="languages"
      :current-genre="activeGenre"
      :current-language="activeLanguage"
      @submit="onFilterSubmit"
      @reset="resetAllFilters"
    />

    <!-- Register Modal -->
    <div v-if="showRegister" class="apple-modal-overlay" @click="showRegister = false">
      <div class="modal-wrapper" @click.stop>
        <button class="modal-close-icon" @click="showRegister = false">✕</button>
        <Register @registered="onRegistered" @loggedIn="onLoggedIn" />
      </div>
    </div>

    <!-- Profile Modal -->
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

    <!-- Footer -->
    <AppleFooter />
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import AppleNavbar from '@/components/AppleNavbar.vue';
import AppleFooter from '@/components/AppleFooter.vue';
import BookCard from '@/components/BookCard.vue';
import FilterModal from '@/components/FilterModal.vue';
import Register from '@/components/Register.vue';
import Profile from '@/components/Profile.vue';
import { getBooks } from '@/services/bookService';

export default {
  name: 'Catalog',
  components: {
    AppleNavbar,
    AppleFooter,
    BookCard,
    FilterModal,
    Register,
    Profile,
  },
  setup() {
    const router = useRouter();
    const route = useRoute();

    const isLoggedIn = ref(false);
    const userEmail = ref('');
    const userName = ref('');
    const userAvatar = ref('');

    const showRegister = ref(false);
    const showProfile = ref(false);
    const showFilterModal = ref(false);

    const allBooks = ref([]);
    const loading = ref(true);

    const searchQuery = ref('');
    const activeGenre = ref('');
    const activeLanguage = ref('');
    const sortBy = ref('default');

    const pageSize = ref(24);
    const currentPage = ref(1);

    const catalogSearchInput = ref(null);

    const genres = ['Фантастика', 'Фэнтези', 'Детектив', 'Приключения', 'Биография', 'Романтика', 'Поэзия'];
    const languages = ['Русский', 'Казахский', 'Английский'];

    onMounted(async () => {
      // 1. Чтение пользователя из localStorage
      const local = localStorage.getItem('user');
      if (local) {
        try {
          const parsed = JSON.parse(local);
          isLoggedIn.value = true;
          userEmail.value = parsed.email || '';
          userName.value = parsed.name || '';
          userAvatar.value = parsed.avatar || '';
        } catch {
          // ignore
        }
      }

      // 2. Чтение query-параметров роутера (например, если пришли с /catalog?genre=Фантастика)
      if (route.query.genre) {
        activeGenre.value = route.query.genre;
      }
      if (route.query.lang) {
        activeLanguage.value = route.query.lang;
      }
      if (route.query.q) {
        searchQuery.value = route.query.q;
      }

      // 3. Загрузка книг через bookService
      try {
        allBooks.value = await getBooks();
      } catch (err) {
        console.error('Ошибка загрузки каталога:', err);
      } finally {
        loading.value = false;
      }
    });

    const hasActiveFilters = computed(() => {
      return !!activeGenre.value || !!activeLanguage.value || !!searchQuery.value.trim();
    });

    const filteredBooks = computed(() => {
      let list = allBooks.value;

      // Filter Genre
      if (activeGenre.value) {
        const targetG = activeGenre.value.toLowerCase();
        list = list.filter((b) => {
          if (Array.isArray(b.genre)) {
            return b.genre.some((g) => g.toLowerCase().includes(targetG));
          }
          return (b.genre || '').toLowerCase().includes(targetG);
        });
      }

      // Filter Language
      if (activeLanguage.value) {
        const targetL = activeLanguage.value.toLowerCase();
        list = list.filter((b) => (b.language || '').toLowerCase().includes(targetL));
      }

      // Filter Search
      if (searchQuery.value.trim()) {
        const q = searchQuery.value.toLowerCase().trim();
        list = list.filter((b) => {
          const t = (b.title || '').toLowerCase();
          const a = (b.author || '').toLowerCase();
          const g = Array.isArray(b.genre) ? b.genre.join(' ').toLowerCase() : (b.genre || '').toLowerCase();
          return t.includes(q) || a.includes(q) || g.includes(q);
        });
      }

      // Sort
      if (sortBy.value === 'title') {
        list = [...list].sort((a, b) => (a.title || '').localeCompare(b.title || '', 'ru'));
      } else if (sortBy.value === 'year-desc') {
        list = [...list].sort((a, b) => Number(b.year || 0) - Number(a.year || 0));
      } else if (sortBy.value === 'copies-desc') {
        list = [...list].sort((a, b) => Number(b.copies || 0) - Number(a.copies || 0));
      }

      return list;
    });

    const visibleBooks = computed(() => {
      return filteredBooks.value.slice(0, currentPage.value * pageSize.value);
    });

    const loadMore = () => {
      currentPage.value += 1;
    };

    const toggleGenre = (g) => {
      activeGenre.value = activeGenre.value === g ? '' : g;
      currentPage.value = 1;
    };

    const toggleLanguage = (l) => {
      activeLanguage.value = activeLanguage.value === l ? '' : l;
      currentPage.value = 1;
    };

    const resetAllFilters = () => {
      activeGenre.value = '';
      activeLanguage.value = '';
      searchQuery.value = '';
      sortBy.value = 'default';
      currentPage.value = 1;
    };

    const onFilterSubmit = (filters) => {
      activeGenre.value = filters.genre || '';
      activeLanguage.value = filters.language || '';
      currentPage.value = 1;
    };

    const focusSearch = () => {
      catalogSearchInput.value?.focus();
    };

    const goToBookDetail = (book) => {
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
      showFilterModal,
      loading,
      genres,
      languages,
      searchQuery,
      activeGenre,
      activeLanguage,
      sortBy,
      catalogSearchInput,
      hasActiveFilters,
      filteredBooks,
      visibleBooks,
      loadMore,
      toggleGenre,
      toggleLanguage,
      resetAllFilters,
      onFilterSubmit,
      focusSearch,
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
.apple-catalog-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.catalog-main {
  flex: 1;
  padding: 100px 0 80px;
}

.catalog-container {
  max-width: 1320px;
  margin: 0 auto;
  padding: 0 24px;
}

/* Header */
.catalog-header {
  margin-bottom: 28px;
}

.header-breadcrumbs {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 12px;
}
.header-breadcrumbs a {
  color: #38BDF8;
  text-decoration: none;
}
.header-breadcrumbs .current {
  color: rgba(255, 255, 255, 0.8);
}

.catalog-title {
  font-size: 38px;
  font-weight: 800;
  letter-spacing: -0.02em;
  margin: 0 0 10px;
  color: #FFFFFF;
}

.catalog-subtitle {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.65);
  margin: 0;
  max-width: 680px;
  line-height: 1.5;
}

/* Filter Toolbar */
.filter-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 18px;
  margin-bottom: 20px;
  border-radius: 20px;
  flex-wrap: wrap;
}

.search-input-field {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 280px;
  color: #38BDF8;
}

.catalog-search {
  width: 100%;
  background: transparent;
  border: none;
  color: #FFFFFF;
  font-family: inherit;
  font-size: 15px;
  outline: none;
}
.catalog-search::placeholder {
  color: rgba(255, 255, 255, 0.45);
}

.clear-btn {
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.5);
  font-size: 14px;
  cursor: pointer;
}
.clear-btn:hover {
  color: #FFFFFF;
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.apple-select {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.14);
  color: #FFFFFF;
  padding: 9px 14px;
  border-radius: 12px;
  font-family: inherit;
  font-size: 13.5px;
  outline: none;
  cursor: pointer;
}
.apple-select option {
  background: #0e1626;
  color: #FFFFFF;
}

.filter-sheet-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #FFFFFF;
  padding: 9px 16px;
  border-radius: 12px;
  font-family: inherit;
  font-size: 13.5px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}
.filter-sheet-btn:hover {
  background: rgba(255, 255, 255, 0.14);
}
.filter-svg {
  width: 14px;
  height: 14px;
  filter: invert(1);
}
.filter-active-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #38BDF8;
  box-shadow: 0 0 6px #38BDF8;
}

/* Quick Pills */
.quick-pills-row {
  display: flex;
  align-items: center;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 12px;
  margin-bottom: 18px;
  scrollbar-width: none;
}
.quick-pills-row::-webkit-scrollbar {
  display: none;
}

.pill-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.7);
  padding: 7px 16px;
  border-radius: 9999px;
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;
}
.pill-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #FFFFFF;
}
.pill-btn.active {
  background: #0071E3;
  border-color: rgba(56, 189, 248, 0.5);
  color: #FFFFFF;
  font-weight: 600;
}

.lang-pill {
  border-style: dashed;
}

.pills-divider {
  width: 1px;
  height: 20px;
  background: rgba(255, 255, 255, 0.14);
  flex-shrink: 0;
  margin: 0 4px;
}

/* Summary Bar */
.catalog-summary-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  font-size: 13.5px;
  color: rgba(255, 255, 255, 0.6);
  flex-wrap: wrap;
  gap: 12px;
}

.results-count b {
  color: #FFFFFF;
}
.filter-tag-hint {
  color: #38BDF8;
  margin-left: 6px;
}

.active-chips {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.active-chip {
  background: rgba(0, 113, 227, 0.15);
  border: 1px solid rgba(56, 189, 248, 0.3);
  color: #38BDF8;
  padding: 3px 10px;
  border-radius: 9999px;
  font-size: 12px;
  cursor: pointer;
}
.active-chip:hover {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.4);
  color: #FCA5A5;
}

.reset-all-link {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  font-size: 12.5px;
  text-decoration: underline;
}
.reset-all-link:hover {
  color: #FFFFFF;
}

/* Grid */
.books-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 24px;
}

.skeleton-book-card {
  height: 360px;
  border-radius: 20px;
  animation: pulse-skeleton 1.5s infinite ease-in-out;
}

.no-books-state {
  text-align: center;
  padding: 60px 20px;
  border-radius: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.no-books-icon {
  font-size: 48px;
}
.no-books-state h3 {
  margin: 0;
  font-size: 22px;
  color: #FFFFFF;
}
.no-books-state p {
  color: rgba(255, 255, 255, 0.6);
  max-width: 440px;
  margin: 0 0 12px;
}

/* Load more */
.load-more-row {
  display: flex;
  justify-content: center;
  margin-top: 48px;
}
.load-more-btn {
  padding: 13px 32px;
  font-size: 15px;
  font-weight: 600;
}

/* Modals */
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

@media (max-width: 768px) {
  .catalog-title {
    font-size: 28px;
  }
  .filter-toolbar {
    flex-direction: column;
    align-items: stretch;
  }
  .toolbar-actions {
    justify-content: space-between;
  }
}
</style>
<template>
  <div class="apple-catalog-page">

    <!-- Main Content -->
    <div class="catalog-main">
      <div class="catalog-container">
        <!-- Page Header -->
        <div class="catalog-header">
          <div class="header-breadcrumbs">
            <router-link to="/">{{ t('nav.home') }}</router-link>
            <span>/</span>
            <span class="current">{{ t('catalog.crumbCatalog') }}</span>
          </div>
          <h1 class="catalog-title">{{ t('catalog.title') }}</h1>
          <p class="catalog-subtitle">
            {{ t('catalog.subtitle') }}
          </p>
        </div>

        <!-- Search & Filter Bar -->
        <div class="filter-toolbar glass-panel">
          <!-- Live Search Input -->
          <div class="search-input-field" role="search">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <label class="visually-hidden" for="catalog-search">{{ t('catalog.searchLabel') }}</label>
            <input
              id="catalog-search"
              ref="catalogSearchInput"
              v-model="searchQuery"
              type="search"
              :placeholder="t('catalog.searchPlaceholder')"
              class="catalog-search"
            />
            <button v-if="searchQuery" type="button" class="clear-btn" :aria-label="t('catalog.clearQuery')" @click="clearSearch">✕</button>
          </div>

          <!-- Controls Right: Sort & Filter Sheet Button -->
          <div class="toolbar-actions">
            <!-- Sort dropdown -->
            <div class="select-wrapper">
              <select v-model="sortBy" class="apple-select" :aria-label="t('catalog.sortLabel')">
                <option value="default">{{ t('catalog.sortDefault') }}</option>
                <option value="title">{{ t('catalog.sortTitle') }}</option>
                <option value="year-desc">{{ t('catalog.sortYearDesc') }}</option>
                <option value="copies-desc">{{ t('catalog.sortCopiesDesc') }}</option>
              </select>
            </div>

            <!-- Filter Modal Button -->
            <button class="filter-sheet-btn" @click="showFilterModal = true">
              <svg class="filter-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4.5 5h15L14 11.5v5l-4 2v-7z" /></svg>
              <span>{{ t('catalog.filtersBtn') }}</span>
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
            {{ t('catalog.allBooksPill') }}
          </button>

          <!-- Genres -->
          <div class="pills-divider"></div>
          <button 
            v-for="g in genreList" 
            :key="g.value"
            class="pill-btn"
            :class="{ active: activeGenre === g.value }"
            @click="toggleGenre(g.value)"
          >
            {{ g.label }}
          </button>

          <!-- Languages -->
          <div class="pills-divider"></div>
          <button 
            v-for="l in languageList" 
            :key="l.value"
            class="pill-btn lang-pill"
            :class="{ active: activeLanguage === l.value }"
            @click="toggleLanguage(l.value)"
          >
            {{ l.label }}
          </button>
        </div>

        <!-- Active Filters Summary & Count -->
        <div class="catalog-summary-bar">
          <div v-if="!loading" class="results-count" role="status">
            <span>{{ t('catalog.foundCount') }} <b>{{ filteredBooks.length }}</b> {{ t('catalog.booksWord') }}</span>
            <span v-if="activeGenre || activeLanguage || searchQuery" class="filter-tag-hint">
              {{ t('catalog.filtersApplied') }}
            </span>
          </div>

          <div v-if="hasActiveFilters" class="active-chips">
            <button v-if="activeGenre" type="button" class="active-chip" @click="activeGenre = ''">
              {{ t('catalog.genreLabel') }} {{ getGenreLabel(activeGenre) }} ✕
            </button>
            <button v-if="activeLanguage" type="button" class="active-chip" @click="activeLanguage = ''">
              {{ t('catalog.langLabel') }} {{ getLanguageLabel(activeLanguage) }} ✕
            </button>
            <button class="reset-all-link" @click="resetAllFilters">{{ t('catalog.resetAll') }}</button>
          </div>
        </div>

        <!-- Books Grid -->
        <div v-if="loading" class="books-grid">
          <div v-for="n in 8" :key="n" class="skeleton-book-card glass-panel"></div>
        </div>

        <div v-else-if="filteredBooks.length === 0" class="no-books-state glass-panel">
          <h3>{{ t('catalog.emptyTitle') }}</h3>
          <p>{{ t(searchQuery.trim() ? 'catalog.emptyQuery' : 'catalog.emptyDesc') }}</p>
          <div class="empty-actions">
            <button v-if="searchQuery.trim()" type="button" class="btn btn-primary" @click="clearSearch">{{ t('catalog.clearQuery') }}</button>
            <button v-if="!searchQuery.trim() || activeGenre || activeLanguage" type="button" class="btn btn-secondary" @click="resetAllFilters">{{ t('catalog.resetAll') }}</button>
          </div>
        </div>

        <div v-else class="books-grid-wrapper">
          <div class="books-grid">
            <BookCard 
              v-for="book in visibleBooks" 
              :key="book._id" 
              :book="book" 
            />
          </div>

          <!-- Load More Button -->
          <div v-if="visibleBooks.length < filteredBooks.length" class="load-more-row">
            <button class="apple-btn-secondary load-more-btn" @click="loadMore">
              <span>{{ t('catalog.loadMore') }} ({{ filteredBooks.length - visibleBooks.length }})</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <!-- Filter Modal -->
    <FilterModal 
      v-model="showFilterModal"
      :genres="genreList"
      :languages="languageList"
      :current-genre="activeGenre"
      :current-language="activeLanguage"
      @submit="onFilterSubmit"
      @reset="resetAllFilters"
    />

    <!-- Register Modal -->

    <!-- Profile Modal -->

    <!-- Footer -->
  </div>
</template>

<script>
import { watch as watchShell } from 'vue';
import { openLogin } from '@/stores/ui';
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import BookCard from '@/components/BookCard.vue';
import FilterModal from '@/components/FilterModal.vue';
import { normalizeBookSearch } from '@/lib/bookSearch';
import { getBooks, matchLanguage, matchGenre, getUniqueGenres } from '@/services/bookService';
import { t } from '@/i18n';
import { bindSessionRefs } from '@/stores/session';

export default {
  name: 'Catalog',
  components: {
    BookCard,
    FilterModal,
  },
  setup() {
    const route = useRoute();
    const router = useRouter();

    const isLoggedIn = ref(false);
    const userEmail = ref('');
    const userName = ref('');
    const userAvatar = ref('');

    const showRegister = ref(false);
    watchShell(showRegister, (v) => { if (v) { openLogin(); showRegister.value = false; } });
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

    const genreList = computed(() => {
      const dynamicGenres = getUniqueGenres(allBooks.value);
      if (!dynamicGenres || dynamicGenres.length === 0) {
        return [
          { value: 'Саморазвитие', label: t('genres.selfDevelopment'), count: 0 },
          { value: 'Приключения', label: t('genres.adventure'), count: 0 },
          { value: 'Фантастика', label: t('genres.fantastica'), count: 0 },
          { value: 'Фэнтези', label: t('genres.fantasy'), count: 0 },
          { value: 'Детектив', label: t('genres.detective'), count: 0 },
          { value: 'Биография', label: t('genres.biography'), count: 0 },
          { value: 'Романтика', label: t('genres.romantica'), count: 0 },
          { value: 'Поэзия', label: t('genres.poetry'), count: 0 },
        ];
      }

      return dynamicGenres.map((g) => {
        let localized = g.label;
        if (g.key && t(`genres.${g.key}`)) {
          const loc = t(`genres.${g.key}`);
          if (loc && !loc.startsWith('genres.')) {
            localized = loc;
          }
        }
        return {
          key: g.key,
          value: g.value,
          label: localized,
          count: g.count,
        };
      });
    });

    const languageList = computed(() => [
      { value: 'Русский', label: t('catalog.langRu') },
      { value: 'Қазақ', label: t('catalog.langKz') },
      { value: 'English', label: t('catalog.langEn') },
    ]);

    const getGenreLabel = (val) => {
      if (!val) return '';
      const found = genreList.value.find((g) => g.value === val);
      return found ? found.label : val;
    };

    const getLanguageLabel = (val) => {
      if (!val) return '';
      const found = languageList.value.find((l) => l.value === val);
      return found ? found.label : val;
    };

    // Auth state comes only from Firebase (src/stores/session.js).
    bindSessionRefs({ isLoggedIn, userEmail, userName, userAvatar });

    onMounted(async () => {

      // 2. Чтение query-параметров роутера
      if (route.query.genre) {
        activeGenre.value = route.query.genre;
      }
      if (route.query.lang) {
        activeLanguage.value = route.query.lang;
      }
      if (typeof route.query.q === 'string') {
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

    watch(
      () => route.query.genre,
      (newGenre) => {
        activeGenre.value = newGenre || '';
        currentPage.value = 1;
      }
    );

    watch(
      () => route.query.lang,
      (newLang) => {
        activeLanguage.value = newLang || '';
        currentPage.value = 1;
      }
    );

    watch(
      () => route.query.q,
      (newQ) => {
        searchQuery.value = typeof newQ === 'string' ? newQ : '';
        currentPage.value = 1;
      }
    );

    watch([searchQuery, sortBy], () => { currentPage.value = 1; });

    const hasActiveFilters = computed(() => {
      return !!activeGenre.value || !!activeLanguage.value || !!searchQuery.value.trim();
    });

    const filteredBooks = computed(() => {
      let list = allBooks.value;

      // Filter Genre with normalized multi-lingual stem matching
      if (activeGenre.value) {
        list = list.filter((b) => matchGenre(b.genre, activeGenre.value));
      }

      // Filter Language with normalized KZ / RU / EN matching
      if (activeLanguage.value) {
        list = list.filter((b) => matchLanguage(b.language, activeLanguage.value));
      }

      // Filter Search
      if (searchQuery.value.trim()) {
        const words = normalizeBookSearch(searchQuery.value).trim().split(/\s+/);
        list = list.filter((b) => {
          const text = normalizeBookSearch([b.title, b.author, ...(Array.isArray(b.genre) ? b.genre : [b.genre])].join(' '));
          return words.every((word) => text.includes(word));
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

    const clearSearch = () => {
      searchQuery.value = '';
      if (route.query.q != null) router.replace({ query: { ...route.query, q: undefined } });
      focusSearch();
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
      isLoggedIn,
      userEmail,
      userName,
      userAvatar,
      showRegister,
      showProfile,
      showFilterModal,
      loading,
      genreList,
      languageList,
      getGenreLabel,
      getLanguageLabel,
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
      clearSearch,
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
.apple-catalog-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.catalog-main {
  flex: 1;
  padding: clamp(25px, 5vw, 65px) 0 80px;
}

.catalog-container {
  max-width: 1320px;
  margin: 0 auto;
  padding: 0 var(--gutter);
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
  color: var(--text-2);
  margin-bottom: 12px;
}
.header-breadcrumbs a {
  color: var(--accent-text);
  text-decoration: none;
}
.header-breadcrumbs .current {
  color: var(--text-2);
}

.catalog-title {
  font-size: 38px;
  font-weight: 800;
  letter-spacing: -0.02em;
  margin: 0 0 10px;
  color: var(--text-1);
}

.catalog-subtitle {
  font-size: 16px;
  color: var(--text-2);
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
}

.search-input-field {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 48px;
  border: 1px solid var(--line-strong);
  border-radius: var(--r-md);
  padding-inline: 12px 5px;
  background: var(--bg-elevated);
  flex: 1;
  min-width: 0;
  color: var(--accent-text);
}
.search-input-field > svg { flex: none; }
.search-input-field:focus-within { border-color: var(--focus); box-shadow: 0 0 0 1px var(--focus); }

.catalog-search {
  width: 100%;
  min-width: 0;
  background: transparent;
  border: none;
  color: var(--text-1);
  font-family: inherit;
  font-size: 15px;
  font-weight: 550;
  outline: none;
}
.catalog-search::-webkit-search-cancel-button { appearance: none; }
.catalog-search::placeholder {
  color: var(--text-3);
}

.clear-btn {
  flex: none;
  width: 38px;
  min-height: 38px;
  border-radius: var(--r-sm);
  background: transparent;
  border: none;
  color: var(--text-2);
  font-size: 14px;
  cursor: pointer;
}
.clear-btn:hover {
  background: var(--accent-soft);
  color: var(--text-1);
}
.empty-actions { display: flex; justify-content: center; flex-wrap: wrap; gap: 8px; }

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.select-wrapper {
  max-width: 220px;
}

.apple-select {
  width: 100%;
  max-width: 220px;
  background: var(--surface-2);
  border: 1px solid var(--line);
  color: var(--text-1);
  padding: 9px 14px;
  border-radius: 12px;
  font-family: inherit;
  font-size: 13.5px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.apple-select option {
  background: var(--surface);
  color: var(--text-1);
}

.filter-sheet-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--surface-2);
  border: 1px solid var(--line);
  color: var(--text-1);
  padding: 9px 16px;
  border-radius: 12px;
  font-family: inherit;
  font-size: 13.5px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;
  flex-shrink: 0;
}
.filter-sheet-btn:hover {
  background: var(--surface-3);
}
.filter-svg {
  flex: none;
  width: 17px;
  height: 17px;
  color: var(--accent-text);
}
.filter-active-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent);
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
  background: var(--surface-2);
  border: 1px solid var(--line);
  color: var(--text-2);
  padding: 7px 16px;
  border-radius: 9999px;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;
}
.pill-btn:hover {
  background: var(--surface-2);
  color: var(--text-1);
}
.pill-btn.active {
  background: var(--button-fill);
  border-color: var(--button-fill);
  color: var(--on-accent);
  font-weight: 600;
}

.lang-pill {
  border-style: dashed;
}

.pills-divider {
  width: 1px;
  height: 20px;
  background: var(--surface-3);
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
  color: var(--text-2);
  flex-wrap: wrap;
  gap: 12px;
}

.results-count b {
  color: var(--text-1);
}
.filter-tag-hint {
  color: var(--accent-text);
  margin-left: 6px;
}

.active-chips {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.active-chip {
  background: var(--accent-soft);
  border: 1px solid var(--accent-soft);
  color: var(--accent-text);
  padding: 3px 10px;
  border-radius: 9999px;
  font-size: 12px;
  cursor: pointer;
}
.active-chip:hover {
  background: var(--danger-soft);
  border-color: rgba(239, 68, 68, 0.4);
  color: #FCA5A5;
}

.reset-all-link {
  background: none;
  border: none;
  color: var(--text-2);
  cursor: pointer;
  font-size: 12.5px;
  text-decoration: underline;
}
.reset-all-link:hover {
  color: var(--text-1);
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
  color: var(--text-1);
}
.no-books-state p {
  color: var(--text-2);
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
  transition: all 0.2s ease;
}
.modal-close-icon:hover {
  background: var(--surface-3);
  color: var(--text-1);
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

<template>
  <div class="apple-search-results">
    <div class="results-header">
      <div class="header-left">
        <div class="header-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38BDF8" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </div>
        <div class="header-text">
          <h3 class="results-title">{{ t('searchResults.title') }}</h3>
          <p class="results-subtitle">
            {{ t('searchResults.foundCount') }} <b>{{ results.length }}</b>
          </p>
        </div>
      </div>

      <!-- Integrated Apple-Styled Close Button -->
      <button 
        type="button"
        class="modal-close-btn" 
        @click="$emit('close')" 
        :title="t('searchResults.closeBtn')"
        :aria-label="t('searchResults.closeBtn')"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>

    <div v-if="results.length" class="results-container">
      <div 
        v-for="(book, index) in results" 
        :key="book._id || index" 
        class="result-item-card"
        @click="$emit('book-click', book)"
      >
        <div class="item-rank-badge">#{{ index + 1 }}</div>

        <!-- Book Mini Cover Mockup -->
        <div class="item-mini-cover" :style="getMiniCoverStyle(book.title)">
          <div class="mini-cover-spine"></div>
          <span class="mini-cover-letter">{{ (book.title || 'B').charAt(0).toUpperCase() }}</span>
        </div>

        <div class="item-info">
          <div class="item-meta-top">
            <span class="item-genre-pill">
              {{ Array.isArray(book.genre) ? book.genre.join(', ') : (book.genre || 'Book') }}
            </span>
            <span class="item-lang-pill">{{ book.language || 'RU' }}</span>
            <span v-if="book.matchScore" class="item-match-pill">
              {{ book.matchScore }}% {{ currentLocale === 'kz' ? 'сәйкестік' : (currentLocale === 'en' ? 'match' : 'совпадение') }}
            </span>
          </div>

          <h4 class="item-title">{{ book.title }}</h4>
          <p class="item-author">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <span>{{ book.author }}</span>
          </p>

          <p v-if="book.description" class="item-desc">
            {{ book.description }}
          </p>

          <!-- AI Insight / Reason -->
          <div v-if="book.aiReason" class="item-ai-insight">
            <svg class="ai-sparkle-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#38BDF8" stroke-width="2.2">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path>
            </svg>
            <span class="ai-reason-text">{{ book.aiReason }}</span>
          </div>
        </div>

        <div class="item-arrow">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </div>
      </div>
    </div>

    <div v-else class="no-results-state">
      <div class="empty-icon-circle">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#38BDF8" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
      </div>
      <p class="no-results-title">{{ t('searchResults.emptyText') }}</p>
      <p class="no-results-subtitle">
        {{ currentLocale === 'kz' ? 'Басқа сөздерді, жанр немесе автор есімін енгізіп көріңіз' : (currentLocale === 'en' ? 'Try searching with different keywords, genre or author name' : 'Попробуйте изменить формулировку, ввести жанр или имя автора') }}
      </p>
    </div>
  </div>
</template>

<script>
import { t, currentLocale } from '@/i18n';

export default {
  name: 'SearchResults',
  props: {
    results: {
      type: Array,
      default: () => [],
    },
  },
  emits: ['book-click', 'close'],
  setup() {
    return {
      t,
      currentLocale,
    };
  },
  mounted() {
    window.addEventListener('keydown', this.handleKeydown);
  },
  beforeUnmount() {
    window.removeEventListener('keydown', this.handleKeydown);
  },
  methods: {
    handleKeydown(e) {
      if (e.key === 'Escape') {
        this.$emit('close');
      }
    },
    getMiniCoverStyle(title) {
      const gradients = [
        'linear-gradient(145deg, #1e3c72 0%, #2a5298 100%)',
        'linear-gradient(145deg, #09203f 0%, #537895 100%)',
        'linear-gradient(145deg, #141e30 0%, #243b55 100%)',
        'linear-gradient(145deg, #134e5e 0%, #71b280 100%)',
        'linear-gradient(145deg, #2c3e50 0%, #3498db 100%)',
        'linear-gradient(145deg, #200122 0%, #6f0000 100%)',
        'linear-gradient(145deg, #3a1c71 0%, #d76d77 100%)',
        'linear-gradient(145deg, #000428 0%, #004e92 100%)',
      ];
      let hash = 0;
      const str = title || 'Book';
      for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
      }
      const index = Math.abs(hash) % gradients.length;
      return { background: gradients[index] };
    },
  },
};
</script>

<style scoped>
.apple-search-results {
  width: 100%;
  max-width: 660px;
  background: var(--surface);


  border: 1px solid var(--line);
  border-radius: 24px;
  padding: 24px 26px;
  box-shadow: var(--shadow-2);
  color: var(--text-1);
  position: relative;
  box-sizing: border-box;
}

.results-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--line);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
  flex: 1;
}

.header-icon {
  width: 44px;
  height: 44px;
  background: var(--accent-soft);
  border: 1px solid var(--accent-soft);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.results-title {
  margin: 0;
  font-size: 19px;
  font-weight: 700;
  color: var(--text-1);
  letter-spacing: -0.3px;
}

.results-subtitle {
  margin: 3px 0 0;
  font-size: 13px;
  color: var(--text-2);
}
.results-subtitle b {
  color: var(--accent-text);
}

/* Polished Close Button */
.modal-close-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  min-width: 36px;
  border-radius: 50%;
  background: var(--surface-2);
  border: 1px solid var(--line);
  color: var(--text-1);
  cursor: pointer;
  outline: none;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  padding: 0;
  flex-shrink: 0;
}

.modal-close-btn:hover {
  background: var(--surface-3);
  border-color: var(--line-strong);
  color: var(--text-1);
  transform: scale(1.06);
}

.modal-close-btn:active {
  transform: scale(0.92);
  background: var(--surface-3);
}

.results-container {
  max-height: 60vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-right: 4px;
}

.results-container::-webkit-scrollbar {
  width: 6px;
}
.results-container::-webkit-scrollbar-track {
  background: transparent;
}
.results-container::-webkit-scrollbar-thumb {
  background: var(--surface-3);
  border-radius: 3px;
}
.results-container::-webkit-scrollbar-thumb:hover {
  background: var(--surface-3);
}

.result-item-card {
  display: flex;
  align-items: center;
  gap: 14px;
  background: var(--surface-2);
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 14px 16px;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.result-item-card:hover {
  background: var(--surface-2);
  border-color: var(--accent-soft);
  transform: translateX(4px);
  box-shadow: var(--shadow-2);
}

.item-rank-badge {
  font-size: 12px;
  font-weight: 700;
  color: var(--accent-text);
  background: var(--accent-soft);
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.item-mini-cover {
  width: 40px;
  height: 54px;
  border-radius: 6px;
  flex-shrink: 0;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-2);
  border: 1px solid var(--line);
  overflow: hidden;
}

.mini-cover-spine {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: var(--surface-3);
}

.mini-cover-letter {
  font-size: 15px;
  font-weight: 800;
  color: var(--text-1);
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
}

.item-info {
  flex: 1;
  min-width: 0;
}

.item-meta-top {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 4px;
}

.item-genre-pill {
  font-size: 11px;
  font-weight: 600;
  color: var(--accent-text);
  background: var(--accent-soft);
  padding: 2px 8px;
  border-radius: 9999px;
}

.item-lang-pill {
  font-size: 10.5px;
  color: var(--text-2);
}

.item-match-pill {
  font-size: 10.5px;
  font-weight: 700;
  color: var(--accent-text);
  background: var(--accent-soft);
  border: 1px solid var(--accent-soft);
  padding: 1px 7px;
  border-radius: 9999px;
  letter-spacing: 0.2px;
}

.item-title {
  margin: 0 0 4px;
  font-size: 15px;
  font-weight: 600;
  color: var(--text-1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-author {
  margin: 0 0 6px;
  font-size: 12.5px;
  color: var(--text-2);
  display: flex;
  align-items: center;
  gap: 5px;
}

.item-ai-insight {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  margin-top: 5px;
  padding: 6px 10px;
  background: var(--accent-soft);
  border: 1px solid var(--accent-soft);
  border-radius: 10px;
  font-size: 12px;
  color: #BAE6FD;
  line-height: 1.35;
}

.ai-sparkle-icon {
  flex-shrink: 0;
  margin-top: 2px;
}

.ai-reason-text {
  flex: 1;
}

.item-desc {
  margin: 0;
  font-size: 12px;
  color: var(--text-2);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.item-arrow {
  color: var(--text-3);
  transition: transform 0.2s ease, color 0.2s ease;
  flex-shrink: 0;
}
.result-item-card:hover .item-arrow {
  color: var(--accent-text);
  transform: translateX(3px);
}

.no-results-state {
  text-align: center;
  padding: 36px 16px;
}

.empty-icon-circle {
  width: 56px;
  height: 56px;
  margin: 0 auto 14px;
  border-radius: 50%;
  background: var(--accent-soft);
  border: 1px solid var(--accent-soft);
  display: flex;
  align-items: center;
  justify-content: center;
}

.no-results-title {
  color: var(--text-1);
  font-size: 15px;
  font-weight: 600;
  margin: 0 0 6px;
}

.no-results-subtitle {
  color: var(--text-2);
  font-size: 13px;
  margin: 0;
  max-width: 420px;
  margin-inline: auto;
  line-height: 1.4;
}

@media (max-width: 640px) {
  .apple-search-results {
    padding: 18px 16px;
    border-radius: 20px;
  }
  .results-header {
    margin-bottom: 14px;
    padding-bottom: 12px;
  }
  .header-icon {
    width: 38px;
    height: 38px;
  }
  .results-title {
    font-size: 17px;
  }
  .modal-close-btn {
    width: 32px;
    height: 32px;
    min-width: 32px;
  }
}
</style>
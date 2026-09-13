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
        <div class="item-info">
          <div class="item-meta-top">
            <span class="item-genre-pill">
              {{ Array.isArray(book.genre) ? book.genre.join(', ') : (book.genre || 'Book') }}
            </span>
            <span class="item-lang-pill">{{ book.language || 'RU' }}</span>
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
        </div>

        <div class="item-arrow">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </div>
      </div>
    </div>

    <div v-else class="no-results-state">
      <p class="no-results-text">{{ t('searchResults.emptyText') }}</p>
    </div>
  </div>
</template>

<script>
import { t } from '@/i18n';

export default {
  name: 'SearchResults',
  props: {
    results: {
      type: Array,
      default: () => [],
    },
  },
  emits: ['book-click', 'close'],
  mounted() {
    window.addEventListener('keydown', this.handleKeydown);
  },
  beforeUnmount() {
    window.removeEventListener('keydown', this.handleKeydown);
  },
  methods: {
    t,
    handleKeydown(e) {
      if (e.key === 'Escape') {
        this.$emit('close');
      }
    },
  },
};
</script>

<style scoped>
.apple-search-results {
  width: 100%;
  max-width: 660px;
  background: rgba(14, 22, 38, 0.96);
  backdrop-filter: blur(28px) saturate(190%);
  -webkit-backdrop-filter: blur(28px) saturate(190%);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 24px;
  padding: 24px 26px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.65);
  color: #FFFFFF;
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
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
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
  border-radius: 12px;
  background: rgba(0, 113, 227, 0.15);
  border: 1px solid rgba(56, 189, 248, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.header-text {
  min-width: 0;
}

.results-title {
  margin: 0 0 4px;
  font-size: 19px;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: #FFFFFF;
}

.results-subtitle {
  margin: 0;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
}
.results-subtitle b {
  color: #38BDF8;
}

/* Apple-style Close Button */
.modal-close-btn {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.14);
  color: rgba(255, 255, 255, 0.75);
  width: 36px;
  height: 36px;
  min-width: 36px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  outline: none;
}

.modal-close-btn:hover {
  background: rgba(255, 255, 255, 0.18);
  border-color: rgba(255, 255, 255, 0.28);
  color: #FFFFFF;
  transform: scale(1.06);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.modal-close-btn:active {
  transform: scale(0.92);
  background: rgba(255, 255, 255, 0.12);
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
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}
.results-container::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.35);
}

.result-item-card {
  display: flex;
  align-items: center;
  gap: 14px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.09);
  border-radius: 16px;
  padding: 14px 16px;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.result-item-card:hover {
  background: rgba(255, 255, 255, 0.09);
  border-color: rgba(56, 189, 248, 0.35);
  transform: translateX(4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25);
}

.item-rank-badge {
  font-size: 12px;
  font-weight: 700;
  color: #38BDF8;
  background: rgba(0, 113, 227, 0.15);
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.item-info {
  flex: 1;
  min-width: 0;
}

.item-meta-top {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.item-genre-pill {
  font-size: 11px;
  font-weight: 600;
  color: #818CF8;
  background: rgba(99, 102, 241, 0.15);
  padding: 2px 8px;
  border-radius: 9999px;
}

.item-lang-pill {
  font-size: 10.5px;
  color: rgba(255, 255, 255, 0.5);
}

.item-title {
  margin: 0 0 4px;
  font-size: 15px;
  font-weight: 600;
  color: #FFFFFF;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-author {
  margin: 0 0 6px;
  font-size: 12.5px;
  color: rgba(255, 255, 255, 0.65);
  display: flex;
  align-items: center;
  gap: 5px;
}

.item-desc {
  margin: 0;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.item-arrow {
  color: rgba(255, 255, 255, 0.4);
  transition: transform 0.2s ease, color 0.2s ease;
  flex-shrink: 0;
}
.result-item-card:hover .item-arrow {
  color: #38BDF8;
  transform: translateX(3px);
}

.no-results-state {
  text-align: center;
  padding: 30px 10px;
}
.no-results-text {
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
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
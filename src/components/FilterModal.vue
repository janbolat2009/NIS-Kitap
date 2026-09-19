<template>
  <div v-if="modelValue" class="apple-modal-backdrop" @click="close">
    <div class="apple-sheet-container" @click.stop>
      <!-- Header -->
      <div class="sheet-header">
        <div class="sheet-handle"></div>
        <div class="sheet-title-row">
          <h3>{{ t('filterModal.title') }}</h3>
          <button class="sheet-close-btn" @click="close">✕</button>
        </div>
      </div>

      <!-- Body -->
      <div class="sheet-body">
        <!-- Genres -->
        <div class="filter-section">
          <div class="section-label">
            <span>{{ t('filterModal.genresSection') }}</span>
            <span v-if="selectedGenre" class="active-badge">{{ selectedGenreLabel }}</span>
          </div>
          <div class="tags-grid">
            <button
              v-for="genre in genres"
              :key="getVal(genre)"
              type="button"
              class="filter-tag-pill"
              :class="{ active: selectedGenre === getVal(genre) }"
              @click="toggleGenre(getVal(genre))"
            >
              {{ getLabel(genre) }}
            </button>
          </div>
        </div>

        <!-- Languages -->
        <div class="filter-section">
          <div class="section-label">
            <span>{{ t('filterModal.languagesSection') }}</span>
            <span v-if="selectedLanguage" class="active-badge">{{ selectedLanguageLabel }}</span>
          </div>
          <div class="tags-grid">
            <button
              v-for="lang in languages"
              :key="getVal(lang)"
              type="button"
              class="filter-tag-pill"
              :class="{ active: selectedLanguage === getVal(lang) }"
              @click="toggleLanguage(getVal(lang))"
            >
              {{ getLabel(lang) }}
            </button>
          </div>
        </div>
      </div>

      <!-- Footer Buttons -->
      <div class="sheet-footer">
        <button type="button" class="btn-reset" @click="resetFilters">
          {{ t('filterModal.resetBtn') }}
        </button>
        <button type="button" class="btn-apply" @click="submitFilters">
          {{ t('filterModal.applyBtn') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { t } from '@/i18n';

export default {
  name: 'FilterModal',
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
    genres: {
      type: Array,
      default: () => ['Саморазвитие', 'Приключения', 'Фантастика', 'Фэнтези', 'Детектив', 'Биография', 'Романтика', 'Поэзия'],
    },
    languages: {
      type: Array,
      default: () => ['Русский', 'Қазақ', 'English'],
    },
    currentGenre: {
      type: String,
      default: '',
    },
    currentLanguage: {
      type: String,
      default: '',
    },
  },
  emits: ['update:modelValue', 'submit', 'reset'],
  data() {
    return {
      selectedGenre: this.currentGenre || '',
      selectedLanguage: this.currentLanguage || '',
    };
  },
  computed: {
    selectedGenreLabel() {
      if (!this.selectedGenre) return '';
      const found = this.genres.find((g) => this.getVal(g) === this.selectedGenre);
      return found ? this.getLabel(found) : this.selectedGenre;
    },
    selectedLanguageLabel() {
      if (!this.selectedLanguage) return '';
      const found = this.languages.find((l) => this.getVal(l) === this.selectedLanguage);
      return found ? this.getLabel(found) : this.selectedLanguage;
    },
  },
  watch: {
    currentGenre(val) {
      this.selectedGenre = val;
    },
    currentLanguage(val) {
      this.selectedLanguage = val;
    },
  },
  methods: {
    t,
    getVal(item) {
      return typeof item === 'object' && item !== null ? item.value : item;
    },
    getLabel(item) {
      return typeof item === 'object' && item !== null ? item.label : item;
    },
    toggleGenre(g) {
      this.selectedGenre = this.selectedGenre === g ? '' : g;
    },
    toggleLanguage(l) {
      this.selectedLanguage = this.selectedLanguage === l ? '' : l;
    },
    close() {
      this.$emit('update:modelValue', false);
    },
    resetFilters() {
      this.selectedGenre = '';
      this.selectedLanguage = '';
      this.$emit('reset');
      this.close();
    },
    submitFilters() {
      this.$emit('submit', {
        genre: this.selectedGenre,
        language: this.selectedLanguage,
      });
      this.close();
    },
  },
};
</script>

<style scoped>
.apple-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  z-index: 1200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.apple-sheet-container {
  width: 100%;
  max-width: 480px;
  background: rgba(14, 22, 38, 0.96);
  backdrop-filter: blur(28px) saturate(190%);
  -webkit-backdrop-filter: blur(28px) saturate(190%);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 24px;
  padding: 24px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);
  color: #FFFFFF;
}

.sheet-header {
  display: flex;
  flex-direction: column;
  margin-bottom: 20px;
}

.sheet-handle {
  width: 36px;
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 9999px;
  margin: 0 auto 12px;
}

.sheet-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.sheet-title-row h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.sheet-close-btn {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.7);
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  transition: all 0.2s ease;
}
.sheet-close-btn:hover {
  background: rgba(255, 255, 255, 0.16);
  color: #FFFFFF;
}

.sheet-body {
  display: flex;
  flex-direction: column;
  gap: 22px;
  margin-bottom: 24px;
}

.filter-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.section-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13.5px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.85);
}

.active-badge {
  font-size: 11px;
  font-weight: 600;
  background: rgba(0, 113, 227, 0.2);
  border: 1px solid rgba(56, 189, 248, 0.35);
  color: #38BDF8;
  padding: 2px 8px;
  border-radius: 9999px;
}

.tags-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.filter-tag-pill {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.75);
  padding: 8px 16px;
  border-radius: 9999px;
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.filter-tag-pill:hover {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.25);
  color: #FFFFFF;
  transform: translateY(-1px);
}

.filter-tag-pill.active {
  background: #0071E3;
  border-color: rgba(56, 189, 248, 0.6);
  color: #FFFFFF;
  font-weight: 600;
  box-shadow: 0 4px 14px rgba(0, 113, 227, 0.4);
}

.sheet-footer {
  display: flex;
  align-items: center;
  gap: 12px;
}

.btn-reset {
  flex: 1;
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.14);
  color: rgba(255, 255, 255, 0.75);
  padding: 12px;
  border-radius: 12px;
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}
.btn-reset:hover {
  background: rgba(255, 255, 255, 0.12);
  color: #FFFFFF;
}

.btn-apply {
  flex: 1.5;
  background: linear-gradient(135deg, #0071E3 0%, #0056B3 100%);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #FFFFFF;
  padding: 12px;
  border-radius: 12px;
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 14px rgba(0, 113, 227, 0.35);
}
.btn-apply:hover {
  box-shadow: 0 6px 20px rgba(0, 113, 227, 0.5);
  transform: translateY(-1px);
}
</style>
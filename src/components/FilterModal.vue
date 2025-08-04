<!-- FilterModal.vue -->
<template>
  <div v-if="isOpen" class="filter-modal-backdrop" @click="close">
    <div class="filter-modal-container" @click.stop>
      <!-- Заголовок -->
      <div class="filter-modal-header">
        <h3>Фильтры</h3>
        <button class="close-btn" @click="close">×</button>
      </div>

      <!-- Тело модального окна -->
      <div class="filter-modal-body">
        <!-- Жанры -->
        <div class="filter-group">
          <h4>Жанры</h4>
          <div class="filter-tags">
            <button
              v-for="genre in genres"
              :key="genre"
              @click="toggleGenre(genre)"
              :class="{ active: selectedGenre === genre }"
              class="filter-tag"
            >
              {{ genre }}
            </button>
          </div>
        </div>

        <!-- Языки -->
        <div class="filter-group">
          <h4>Языки</h4>
          <div class="filter-tags">
            <button
              v-for="lang in languages"
              :key="lang"
              @click="toggleLanguage(lang)"
              :class="{ active: selectedLanguage === lang }"
              class="filter-tag"
            >
              {{ lang }}
            </button>
          </div>
        </div>
      </div>

      <!-- Футер с кнопками -->
      <div class="filter-modal-footer">
        <button class="btn-reset" @click="resetFilters">Сбросить</button>
        <button class="btn-submit" @click="submitFilters">Применить</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'FilterModal',
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
    genres: {
      type: Array,
      default: () => ['Фантастика', 'Фэнтези', 'Детектив', 'Романтика', 'Биография', 'Приключения', 'Поэзия'],
    },
    languages: {
      type: Array,
      default: () => ['Русский', 'Казахский', 'Английский'],
    },
  },
  emits: ['update:modelValue', 'submit', 'reset'],
  data() {
    return {
      selectedGenre: '',
      selectedLanguage: '',
    };
  },
  computed: {
    isOpen: {
      get() {
        return this.modelValue;
      },
      set(value) {
        this.$emit('update:modelValue', value);
      },
    },
  },
  methods: {
    toggleGenre(genre) {
      this.selectedGenre = this.selectedGenre === genre ? '' : genre;
    },
    toggleLanguage(lang) {
      this.selectedLanguage = this.selectedLanguage === lang ? '' : lang;
    },
    submitFilters() {
      this.$emit('submit', {
        genre: this.selectedGenre,
        language: this.selectedLanguage,
      });
      this.isOpen = false;
    },
    resetFilters() {
      this.selectedGenre = '';
      this.selectedLanguage = '';
      this.$emit('reset');
    },
    close() {
      this.isOpen = false;
    },
  },
};
</script>

<style scoped>
.filter-modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle, rgba(0, 48, 96, 0.4) 0%, rgba(0, 0, 0, 0.7) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: fadeIn 0.4s ease-out;
  backdrop-filter: blur(4px);
}

.filter-modal-container {
  width: 90%;
  max-width: 500px;
  background: linear-gradient(135deg, #f6eee1 0%, #e8dcd0 100%);
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3),
              0 0 0 1px rgba(246, 238, 225, 0.4) inset;
  overflow: hidden;
  transform: scale(0.9);
  opacity: 0;
  animation: slideUpAndGrow 0.4s ease-out forwards;
  position: relative;
}

/* Анимация появления */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUpAndGrow {
  0% {
    opacity: 0;
    transform: scale(0.8) translateY(30px);
  }
  70% {
    transform: scale(1.02);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

/* Заголовок */
.filter-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  background: #003060;
  color: #f6eee1;
  font-weight: 600;
  font-size: 1.2em;
  border-bottom: 1px solid rgba(246, 238, 225, 0.2);
}

.close-btn {
  background: transparent;
  border: none;
  font-size: 28px;
  color: #f6eee1;
  cursor: pointer;
  transition: all 0.3s ease;
  line-height: 1;
  position: relative;
  top: -1px;
  left: 1px;
}

.close-btn:hover {
  transform: rotate(90deg) scale(1.1);
  color: #ff6b6b;
}

/* Тело */
.filter-modal-body {
  padding: 24px;
  color: #003060;
}

.filter-group {
  margin-bottom: 24px;
}

.filter-group h4 {
  margin-bottom: 12px;
  font-weight: 600;
  color: #003060;
  font-size: 1.1em;
}

.filter-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.filter-tag {
  padding: 8px 16px;
  background: rgba(0, 48, 96, 0.1);
  border: 1px solid rgba(0, 48, 96, 0.2);
  border-radius: 50px;
  font-size: 0.9em;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  color: #003060;
  white-space: nowrap;
}

.filter-tag:hover {
  background: rgba(0, 48, 96, 0.2);
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(0, 48, 96, 0.1);
}

.filter-tag.active {
  background: #003060;
  color: #f6eee1;
  border-color: #003060;
  transform: scale(1.05);
  box-shadow: 0 5px 15px rgba(0, 48, 96, 0.2);
}

/* Футер */
.filter-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px 24px;
  border-top: 1px solid rgba(0, 48, 96, 0.1);
  background: rgba(246, 238, 225, 0.4);
}

.btn-reset {
  padding: 8px 16px;
  background: transparent;
  border: 1px solid #003060;
  color: #003060;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9em;
  transition: all 0.3s ease;
}

.btn-reset:hover {
  background: rgba(0, 48, 96, 0.1);
  transform: scale(1.02);
}

.btn-submit {
  padding: 8px 20px;
  background: #003060;
  color: #f6eee1;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  box-shadow: 0 4px 12px rgba(0, 48, 96, 0.2);
}

.btn-submit:hover {
  background: #004a8c;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 48, 96, 0.3);
}

.btn-submit:active {
  transform: translateY(0);
}

/* Адаптация под мобильные */
@media (max-width: 480px) {
  .filter-modal-container {
    width: 95%;
    border-radius: 16px;
  }

  .filter-modal-header,
  .filter-modal-body,
  .filter-modal-footer {
    padding: 16px;
  }

  .filter-tag {
    font-size: 0.85em;
    padding: 7px 12px;
  }

  .btn-submit, .btn-reset {
    font-size: 0.85em;
    padding: 7px 14px;
  }
}
</style>
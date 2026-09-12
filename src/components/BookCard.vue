<template>
  <div class="apple-book-card" @click="handleClick">
    <!-- Top Cover Mockup / Artwork -->
    <div class="card-cover-wrapper">
      <div class="card-cover-art" :style="coverGradientStyle">
        <div class="book-spine"></div>
        <div class="cover-content">
          <div class="cover-nis-badge">NIS KITAP</div>
          <h4 class="cover-title">{{ book.title }}</h4>
          <p class="cover-author">{{ book.author }}</p>
        </div>
        <div class="cover-footer">
          <span class="cover-lang">{{ book.language || 'RU' }}</span>
          <span class="cover-year">{{ book.year }}</span>
        </div>
      </div>

      <!-- Floating Availability Badge -->
      <div class="availability-badge" :class="book.copies > 0 ? 'available' : 'unavailable'">
        <span class="status-dot"></span>
        <span>{{ book.copies > 0 ? `${book.copies} ${t('bookCard.available')}` : t('bookCard.busy') }}</span>
      </div>
    </div>

    <!-- Card Body Information -->
    <div class="card-body">
      <!-- Genre Pills -->
      <div class="genre-pills">
        <span v-for="genre in displayGenres" :key="genre" class="genre-pill">
          {{ genre }}
        </span>
      </div>

      <!-- Book Title -->
      <h3 class="book-title" :title="book.title">
        {{ book.title }}
      </h3>

      <!-- Author -->
      <div class="book-author">
        <svg class="author-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
        <span>{{ book.author }}</span>
      </div>

      <!-- Footer Info -->
      <div class="card-meta-row">
        <span class="meta-tag language-tag">{{ book.language }}</span>
        <span class="meta-tag year-tag">{{ book.year }} {{ t('bookCard.yearSuffix') }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import { t } from '@/i18n';

export default {
  name: 'BookCard',
  props: {
    book: {
      type: Object,
      required: true,
    },
  },
  emits: ['select'],
  computed: {
    displayGenres() {
      if (Array.isArray(this.book.genre)) {
        return this.book.genre.slice(0, 2);
      }
      if (typeof this.book.genre === 'string') {
        return [this.book.genre];
      }
      return [t('common.book') || 'Книга'];
    },
    coverGradientStyle() {
      // Генерация элегантного градиента на основе названия книги для эстетичного Apple-вида
      const title = this.book.title || 'Book';
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
      for (let i = 0; i < title.length; i++) {
        hash = title.charCodeAt(i) + ((hash << 5) - hash);
      }
      const index = Math.abs(hash) % gradients.length;
      return { background: gradients[index] };
    },
  },
  methods: {
    t,
    handleClick() {
      this.$emit('select', this.book);
      if (this.book.title) {
        this.$router.push(`/book/${encodeURIComponent(this.book.title)}`);
      }
    },
  },
};
</script>

<style scoped>
.apple-book-card {
  position: relative;
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(18px) saturate(180%);
  -webkit-backdrop-filter: blur(18px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  overflow: hidden;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.apple-book-card:hover {
  transform: translateY(-6px) scale(1.01);
  background: rgba(255, 255, 255, 0.07);
  border-color: rgba(56, 189, 248, 0.35);
  box-shadow: 0 16px 36px rgba(0, 0, 0, 0.4), 0 0 24px rgba(0, 113, 227, 0.2);
}

.apple-book-card:active {
  transform: scale(0.98);
}

/* Cover Wrapper */
.card-cover-wrapper {
  position: relative;
  padding: 16px;
  background: rgba(0, 0, 0, 0.25);
  display: flex;
  justify-content: center;
  align-items: center;
}

.card-cover-art {
  width: 100%;
  height: 180px;
  border-radius: 12px;
  position: relative;
  box-shadow: 
    -4px 4px 14px rgba(0, 0, 0, 0.5),
    inset -1px 0 2px rgba(255, 255, 255, 0.2);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 16px;
  overflow: hidden;
  transition: transform 0.35s ease;
}

.apple-book-card:hover .card-cover-art {
  transform: scale(1.03) rotate(-1deg);
}

.book-spine {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  width: 8px;
  background: linear-gradient(to right, rgba(255, 255, 255, 0.25), rgba(0, 0, 0, 0.3));
  box-shadow: 1px 0 2px rgba(0, 0, 0, 0.4);
}

.cover-content {
  position: relative;
  z-index: 1;
}

.cover-nis-badge {
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.12em;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 6px;
}

.cover-title {
  margin: 0 0 4px;
  font-size: 14.5px;
  font-weight: 700;
  line-height: 1.25;
  color: #FFFFFF;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);
}

.cover-author {
  margin: 0;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.85);
  font-weight: 500;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.cover-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 600;
}

/* Availability Badge */
.availability-badge {
  position: absolute;
  top: 24px;
  right: 24px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 600;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  z-index: 2;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.availability-badge.available {
  background: rgba(16, 185, 129, 0.25);
  border: 1px solid rgba(16, 185, 129, 0.45);
  color: #34D399;
}
.availability-badge.available .status-dot {
  background: #10B981;
  box-shadow: 0 0 6px #10B981;
}

.availability-badge.unavailable {
  background: rgba(239, 68, 68, 0.25);
  border: 1px solid rgba(239, 68, 68, 0.45);
  color: #F87171;
}
.availability-badge.unavailable .status-dot {
  background: #EF4444;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

/* Card Body */
.card-body {
  padding: 16px;
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 8px;
}

.genre-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.genre-pill {
  font-size: 11px;
  font-weight: 500;
  color: #38BDF8;
  background: rgba(0, 113, 227, 0.12);
  border: 1px solid rgba(56, 189, 248, 0.25);
  padding: 2px 8px;
  border-radius: 9999px;
}

.book-title {
  margin: 2px 0 0;
  font-size: 15.5px;
  font-weight: 600;
  color: #FFFFFF;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  transition: color 0.2s ease;
}

.apple-book-card:hover .book-title {
  color: #38BDF8;
}

.book-author {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.65);
}
.author-icon {
  stroke: rgba(255, 255, 255, 0.5);
}

.card-meta-row {
  margin-top: auto;
  padding-top: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.meta-tag {
  font-size: 11.5px;
  color: rgba(255, 255, 255, 0.45);
}
.language-tag {
  font-weight: 500;
  color: rgba(255, 255, 255, 0.6);
}
</style>

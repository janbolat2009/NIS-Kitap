<template>
  <router-link
    class="apple-book-card"
    :to="{ name: 'BookDetail', params: { title: book.title } }"
    :aria-label="book.author ? `${book.title} — ${book.author}` : book.title"
    @click="$emit('select', book)"
  >
    <BookCover :book="book" />
    <div class="card-body">
      <span class="availability-badge badge" :class="book.copies > 0 ? 'badge-success' : 'badge-danger'">
        <span class="dot" aria-hidden="true" />
        {{ book.copies > 0 ? `${book.copies} ${t('bookCard.available')}` : t('bookCard.busy') }}
      </span>
      <h3 class="book-title" :title="book.title">{{ book.title }}</h3>
      <p v-if="book.author" class="book-author">{{ book.author }}</p>
      <div v-if="genres.length" class="genre-pills">
        <span v-for="genre in genres" :key="genre" class="badge badge-info">{{ genre }}</span>
      </div>
      <div class="card-meta-row">
        <span>{{ book.language }}</span>
        <span v-if="book.year">{{ book.year }} {{ t('bookCard.yearSuffix') }}</span>
      </div>
    </div>
  </router-link>
</template>

<script setup>
import { computed } from 'vue';
import BookCover from '@/components/BookCover.vue';
import { t } from '@/i18n';

const props = defineProps({ book: { type: Object, required: true } });
defineEmits(['select']);
const genres = computed(() => {
  const genre = props.book.genre;
  return Array.isArray(genre) ? genre.slice(0, 2) : typeof genre === 'string' && genre ? [genre] : [];
});
</script>

<style scoped>
.apple-book-card {
  position: relative;
  isolation: isolate;
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: 1px;
  border-radius: var(--r-lg);
  color: var(--text-1);
  text-decoration: none;
}
.apple-book-card::before {
  position: absolute;
  inset: 0;
  z-index: -1;
  content: '';
  pointer-events: none;
  border: 1px solid var(--line);
  border-radius: inherit;
  background: var(--surface);
  transition: border-color var(--dur-2) ease, box-shadow 240ms ease, transform 240ms var(--ease-out), background-color var(--dur-1) ease;
}
.apple-book-card > .jacket { border-radius: calc(var(--r-lg) - 1px) calc(var(--r-lg) - 1px) 0 0; }
.apple-book-card:focus-visible { border-radius: var(--r-lg); }
.apple-book-card:focus-visible::before { border-color: var(--focus); }
.apple-book-card:active::before { background: var(--accent-soft); }
@media (hover: hover) {
  .apple-book-card:hover::before {
    border-color: color-mix(in srgb, var(--accent-text) 30%, var(--line));
    box-shadow: 0 10px 24px -12px color-mix(in srgb, var(--accent-text) 58%, transparent);
  }
}
@media (hover: hover) and (prefers-reduced-motion: no-preference) {
  .apple-book-card:hover:not(:active)::before { transform: scale(1.012); }
}
.card-body { display: flex; flex: 1; flex-direction: column; gap: 7px; padding: clamp(10px, 1.45vw, 16px); }
.availability-badge { align-self: flex-start; font-size: 0.69rem; }
.book-title { font-size: 1.04rem; font-weight: 760; overflow-wrap: anywhere; }
.book-author { color: var(--text-2); font-size: var(--fs-sm); overflow-wrap: anywhere; }
.genre-pills { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 3px; }
.genre-pills .badge { font-size: 0.69rem; white-space: normal; overflow-wrap: anywhere; }
.card-meta-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 4px 8px;
  margin-top: auto;
  padding-top: 9px;
  border-top: 1px solid var(--line);
  color: var(--text-3);
  font-size: var(--fs-xs);
}
</style>

<template>
  <div class="home">
    <section class="hero container">
      <div class="hero-panel">
        <div class="hero-text rise-in">
          <h1 class="hero-title">{{ t('home.title') }}</h1>
          <p class="hero-lead">{{ t('home.lead') }}</p>
          <div class="hero-cta">
            <router-link to="/catalog" class="btn btn-primary btn-lg">
              {{ t('home.ctaCatalog') }} <span class="arrow" aria-hidden="true" />
            </router-link>
            <a href="#genres-section" class="btn btn-secondary btn-lg">
              {{ t('home.genres') }} <span class="arrow arrow-down" aria-hidden="true" />
            </a>
          </div>
        </div>
        <OpeningBook />
      </div>
      <div class="hero-index">
        <dl class="hero-stats">
          <div v-if="stats"><dt class="tabular">{{ fmt(stats.books) }}</dt><dd>{{ t('home.statBooks') }}</dd></div>
          <div v-if="stats"><dt class="tabular">{{ fmt(stats.copies) }}</dt><dd>{{ t('home.statCopies') }}</dd></div>
        </dl>
        <router-link to="/100-kitap" class="hero-project">
          {{ t('home.ctaHundred') }} <span class="arrow" aria-hidden="true" />
        </router-link>
      </div>
    </section>

    <section id="ai-search-section" class="section-space container" aria-labelledby="ai-search-title">
      <div class="search">
        <div class="search-head">
          <h2 id="ai-search-title">{{ t('home.searchTitle') }}</h2>
          <p class="muted">{{ t('home.searchLead') }}</p>
        </div>
        <form class="search-box" role="search" :aria-busy="searching" @submit.prevent="runSearch">
          <label class="visually-hidden" for="ai-q">{{ t('home.searchTitle') }}</label>
          <input id="ai-q" v-model="q" class="input search-input" maxlength="300" :placeholder="t('aiSearch.placeholder')" />
          <button class="btn btn-primary gemini-submit" type="submit" :disabled="searching || !q.trim()" :aria-label="searching ? t('common.loading') : undefined">
            <span v-if="searching" class="spinner" aria-hidden="true" /><span v-else>{{ t('aiSearch.submit') }}</span>
          </button>
        </form>
        <div class="chip-row ideas">
          <button v-for="c in chips" :key="c" type="button" class="chip" :disabled="searching" @click="q = c; runSearch()">{{ c }}</button>
        </div>
        <p class="quota muted">
          <template v-if="!session.uid">{{ t('aiSearch.guestLimitNotice') }} · <button type="button" class="link" @click="openLogin()">{{ t('nav.signIn') }}</button></template>
          <template v-else>{{ t('aiSearch.quotaRemaining', { count: remaining }) }}</template>
        </p>
      </div>
      <div v-if="searchError || results.length || (searched && !searching)" class="search-feedback">
        <p v-if="searchError" class="notice notice-warning" role="alert">{{ searchError }}</p>
        <ol v-if="results.length" class="results rise-in">
          <li v-for="b in results" :key="b.title + b.author">
            <router-link :to="`/book/${encodeURIComponent(b.title)}`" class="result">
              <span class="result-cover" :style="{ background: coverColor(b.title) }">{{ initial(b.title) }}</span>
              <span class="result-body">
                <strong>{{ b.title }}</strong>
                <span class="muted">{{ b.author }}</span>
                <span v-if="b.aiReason" class="reason">{{ b.aiReason }}</span>
              </span>
            </router-link>
          </li>
        </ol>
        <p v-else-if="searched && !searching" class="muted">{{ t('catalog.noResults') }}</p>
      </div>
    </section>

    <section class="section-space container">
      <div class="hundred-card">
        <div class="hundred-text">
          <h2>{{ t('hundred.title') }}</h2>
          <p>{{ t('hundred.lead') }}</p>
          <router-link to="/100-kitap" class="btn btn-secondary">
            {{ t('hundred.viewAll') }} <span class="arrow" aria-hidden="true" />
          </router-link>
        </div>
        <ul v-if="hundredPreview.length" class="book-display">
          <li v-for="b in hundredPreview" :key="b.id" :class="`book-${b.section}`">
            <router-link :to="`/book/${encodeURIComponent(b.catalogTitle)}`" class="feature-book" :title="`${b.title} — ${b.author}`">
              <span class="feature-cover">
                <span class="feature-title" :lang="bookLanguages[b.section]">{{ b.title }}</span>
                <span class="feature-author">{{ b.author }}</span>
              </span>
            </router-link>
          </li>
        </ul>
      </div>
    </section>

    <section id="genres-section" class="section-space container" aria-labelledby="genres-title">
      <div class="section-head">
        <div>
          <h2 id="genres-title">{{ t('genres.title') }}</h2>
          <p class="muted">{{ t('genres.subtitle') }}</p>
        </div>
        <router-link to="/catalog" class="btn btn-secondary">
          {{ t('genres.viewAll') }} <span class="arrow" aria-hidden="true" />
        </router-link>
      </div>
      <ul class="genre-list">
        <li v-for="g in genres" :key="g.route">
          <router-link :to="g.route" class="genre" :style="{ '--genre-accent': g.accent }">
            <span class="genre-icon" aria-hidden="true"><GenreIcon :genre-key="g.key" color="currentColor" :size="25" /></span>
            <span class="genre-copy">
              <strong>{{ genreLabel(g) }}</strong>
              <span>{{ genreDescription(g) }}</span>
            </span>
            <span class="arrow" aria-hidden="true" />
          </router-link>
        </li>
      </ul>
    </section>

    <section class="section-space container">
      <h2 class="section-title">{{ t('home.languages') }}</h2>
      <LanguageLinks />
    </section>

    <section id="how-to" class="section-space container">
      <h2 class="section-title">{{ t('home.stepsTitle') }}</h2>
      <ol class="steps">
        <li v-for="(s, i) in steps" :key="i" class="step">
          <span class="step-n" aria-hidden="true">{{ i + 1 }}</span>
          <h3>{{ s.t }}</h3>
          <p>{{ s.d }}</p>
        </li>
      </ol>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, shallowRef } from 'vue';
import GenreIcon from '@/components/GenreIcon.vue';
import LanguageLinks from '@/components/LanguageLinks.vue';
import OpeningBook from '@/components/OpeningBook.vue';
import { t, currentLocale } from '@/i18n';
import { session } from '@/stores/session';
import { openLogin } from '@/stores/ui';
import { CANONICAL_GENRE_MAP, getBooks, getUniqueGenres, searchAi } from '@/services/bookService';
import { canPerformSearch, formatResetDateTime } from '@/services/geminiLimitService';
import { loadHundredBooks } from '@/services/hundredList';

const locale = currentLocale;
const stats = ref(null);
const catalogGenres = shallowRef([]);
const q = ref('');
const results = ref([]);
const searching = ref(false);
const searched = ref(false);
const searchError = ref('');
const hundredPreview = ref([]);
const tick = ref(0);

const steps = computed(() => t('home.steps'));
const remaining = computed(() => {
  tick.value; // re-evaluate after a search
  return session.email ? canPerformSearch(session.email).remaining ?? 3 : 3;
});
const chips = computed(() => ({
  ru: ['Антиутопия', 'Книги о космосе', 'Қазақ тарихы', 'Детективы', 'Про дружбу и взросление'],
  kz: ['Антиутопия', 'Ғарыш туралы', 'Қазақ тарихы', 'Детектив', 'Достық туралы'],
  en: ['Dystopia', 'Space stories', 'Kazakh history', 'Detective stories', 'Growing up'],
}[locale.value] || []));

const bookLanguages = { kazakh: 'kk', russian: 'ru', foreign: 'en' };
const canonicalGenres = Object.values(CANONICAL_GENRE_MAP);
const genres = computed(() => {
  const active = new Set(catalogGenres.value.map((g) => g.key));
  return [...catalogGenres.value, ...canonicalGenres.filter((g) => !active.has(g.key))];
});
const genreLabel = (g) => {
  const meta = CANONICAL_GENRE_MAP[g.key];
  return meta ? t(meta.i18nKey) : g.label;
};
const genreDescription = (g) => {
  const meta = CANONICAL_GENRE_MAP[g.key];
  return meta ? t(`${meta.i18nKey}Desc`) : `${fmt(g.count)} ${t('common.books')}`;
};

const numberFormat = computed(() => new Intl.NumberFormat(locale.value === 'kz' ? 'kk-KZ' : locale.value));
const fmt = (n) => numberFormat.value.format(n);
const initial = (s) => String(s || '?').trim().charAt(0).toUpperCase();
function coverColor(title) {
  let h = 0;
  for (const ch of String(title)) h = (h * 31 + ch.charCodeAt(0)) % 5;
  return `var(--cover-${h + 1})`;
}

async function runSearch() {
  if (searching.value || !q.value.trim()) return;
  searchError.value = '';
  if (!session.uid) {
    openLogin('login');
    return;
  }
  searching.value = true;
  searched.value = true;
  try {
    results.value = (await searchAi(q.value.trim(), session.email)).slice(0, 12);
  } catch (err) {
    results.value = [];
    if (err.unauthorized) openLogin('login');
    else if (err.limitReached) searchError.value = `${t('aiSearch.limitDepletedShort')} ${formatResetDateTime(err.resetAt, locale.value)}`;
    else searchError.value = t('common.errorDesc');
  } finally {
    searching.value = false;
    tick.value += 1;
  }
}

onMounted(() => {
  getBooks().then((books) => {
    if (!books.length) return;
    stats.value = { books: books.length, copies: books.reduce((s, b) => s + (Number(b.copies) || 0), 0) };
    catalogGenres.value = getUniqueGenres(books);
  }).catch(() => {
    catalogGenres.value = [];
  });

  loadHundredBooks().then(({ books }) => {
    hundredPreview.value = Object.keys(bookLanguages).map((section) => books.find((b) =>
      b.section === section && b.catalogTitle && b.catalogVisible !== false && b.isActive !== false,
    )).filter(Boolean);
  }).catch(() => {
    hundredPreview.value = [];
  });
});
</script>

<style scoped>
.home { padding-bottom: clamp(44px, 7vw, 88px); }
.hero { padding-top: clamp(18px, 4.2vw, 60px); }
.section-space { margin-top: clamp(38px, 6vw, 76px); }

.hero-panel {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr);
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--r-lg);
  overflow: hidden;
}
.hero-text { align-self: center; padding: clamp(24px, 3.3vw, 48px); }
.hero-title {
  max-width: 21ch;
  color: var(--text-1);
  font-size: clamp(2rem, 1.1rem + 2.65vw, 3.4rem);
  font-weight: 790;
  letter-spacing: -0.035em;
  line-height: 1.06;
  text-wrap: balance;
}
.hero-lead { margin-top: 20px; color: var(--text-2); max-width: 48ch; }
.hero-cta { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 26px; }
.hero-cta .btn { padding-inline: 16px; }
.hero-index {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  min-height: 61px;
  padding: 8px 0;
  border-bottom: 1px solid var(--line);
}
.hero-stats { display: flex; gap: 8px 25px; flex-wrap: wrap; margin: 0; }
.hero-stats div { display: flex; align-items: baseline; gap: 6px; }
.hero-stats dt { font-family: var(--font-heading); font-size: var(--fs-lg); font-weight: 650; }
.hero-stats dd { margin: 0; color: var(--text-2); font-size: var(--fs-sm); }
.hero-project {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  padding: 8px 4px;
  flex: none;
  color: var(--accent-text);
  font-size: var(--fs-sm);
  font-weight: 650;
  text-decoration: none;
}
.hero-project:hover { text-decoration: underline; }

.arrow {
  display: inline-block;
  position: relative;
  flex: none;
  width: 16px;
  height: 16px;
  transition: translate var(--dur-2) var(--ease-out), opacity var(--dur-1) ease;
}
.arrow::before, .arrow::after { content: ''; position: absolute; }
.arrow::before { inset: 7px 3px auto 1px; border-top: 1.5px solid currentColor; }
.arrow::after {
  inset: 4px 3px auto auto;
  width: 7px;
  height: 7px;
  border-top: 1.5px solid currentColor;
  border-right: 1.5px solid currentColor;
  transform: rotate(45deg);
}
.arrow-down { rotate: 90deg; }

.search {
  padding: clamp(22px, 3.3vw, 48px);
  border: 1px solid var(--line);
  border-radius: var(--r-lg);
  background: var(--bg-elevated);
  transition: border-color var(--dur-2) ease;
}
.search:focus-within { border-color: var(--focus); }
.search-feedback { padding: 16px 0 0; }
.search-head { margin-bottom: 17px; }
.section-head h2, .section-space > h2 { font-size: var(--fs-2xl); }
.search-head h2 { font-size: clamp(1.45rem, 1rem + 1.55vw, 1.95rem); }
.search-head p, .section-head p { margin: 6px 0 0; }
.search-box { display: flex; gap: 10px; }
.search-input { flex: 1; min-width: 0; min-height: 52px; font-size: 1rem; }
.search-box .btn { min-height: 52px; }
.gemini-submit { border-radius: var(--r-pill); }
.gemini-submit:is(:hover, :focus-visible):not(:disabled, :active) { box-shadow: 0 5px 16px color-mix(in srgb, var(--accent) 37%, transparent); }
.ideas .chip:disabled { opacity: 0.55; cursor: wait; }
.ideas { margin-top: 12px; flex-wrap: wrap; overflow: visible; }
.quota { margin-top: 10px; font-size: var(--fs-sm); }
.link { background: none; border: none; padding: 0; color: var(--accent-text); font-weight: 600; cursor: pointer; }
.link:hover { text-decoration: underline; }
.results {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr));
  gap: 12px;
}
.result {
  display: flex;
  gap: 14px;
  padding: 14px;
  border: 1px solid var(--line);
  border-radius: var(--r-md);
  background: var(--surface);
  text-decoration: none;
  color: var(--text-1);
  height: 100%;
  transition: border-color var(--dur-1) ease, background-color var(--dur-1) ease;
}
.result:hover, .result:focus-visible { border-color: var(--focus); }
.result:active { background: var(--accent-soft); }
.result-cover {
  flex: none;
  width: 46px;
  height: 64px;
  border-radius: 3px 6px 6px 3px;
  display: grid;
  place-items: center;
  color: #fff;
  font: 1.2rem var(--font-heading);
}
.result-body { display: flex; flex-direction: column; gap: 2px; min-width: 0; font-size: var(--fs-sm); }
.result-body strong { font-size: var(--fs-md); overflow-wrap: anywhere; }
.reason { color: var(--text-2); margin-top: 4px; }

.hundred-card {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: clamp(24px, 5vw, 64px);
  align-items: center;
  padding: clamp(22px, 4.4vw, 50px);
  border-radius: var(--r-lg);
  background: #152a3e;
  color: #f7f0e2;
}
.hundred-text h2 { color: inherit; font-size: var(--fs-3xl); margin-bottom: 10px; }
.hundred-text p { color: #d8e1ea; margin-bottom: 20px; max-width: 49ch; }
.hundred-text .btn { white-space: normal; text-align: start; line-height: 1.2; padding-block: 8px; }
.hundred-text .btn:focus-visible, .feature-book:focus-visible { outline-color: #f0ba65; }
.book-display {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(0, 1fr);
  align-items: end;
  gap: clamp(8px, 1.5vw, 17px);
  list-style: none;
  margin: 0;
  padding: 0 0 9px;
  border-bottom: 1px solid #93a9bb;
}
.book-kazakh { --jacket: #24534f; --jacket-detail: #a9d9c7; }
.book-russian { --jacket: #70392e; --jacket-detail: #fac5a4; }
.book-foreign { --jacket: #624720; --jacket-detail: #f5d99a; }
.feature-book { display: block; color: #fff7e8; text-decoration: none; border-radius: 4px 9px 9px 4px; }
.feature-cover {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: clamp(8.4rem, 16vw, 13.5rem);
  gap: 8px;
  padding: clamp(8px, 1.4vw, 19px);
  border-radius: inherit;
  border: 1px solid color-mix(in srgb, var(--jacket-detail) 55%, var(--jacket));
  background: linear-gradient(90deg, #0005 3px, transparent 7px), var(--jacket);
  box-shadow: 0 4px 12px #0005;
  transition: translate var(--dur-2) var(--ease-out), box-shadow var(--dur-2) ease;
}
.feature-cover::before {
  content: '';
  width: 20px;
  border-top: 1px solid var(--jacket-detail);
}
.feature-title {
  font: 650 clamp(0.85rem, 1.35vw, 1.28rem)/1.15 var(--font-heading);
  overflow-wrap: anywhere;
  hyphens: auto;
}
.feature-author { color: var(--jacket-detail); font-size: var(--fs-xs); overflow-wrap: anywhere; }

.section-head {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}
.genre-list { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 13px; margin: 0; padding: 0; list-style: none; }
.genre {
  --genre-ink: color-mix(in srgb, var(--genre-accent) 53%, var(--text-1));
  --genre-tint: color-mix(in srgb, var(--genre-accent) 14%, var(--surface));
  min-height: 94px;
  display: flex;
  align-items: center;
  min-width: 0;
  height: 100%;
  gap: 13px;
  padding: 15px;
  border: 1px solid var(--line);
  border-radius: var(--r-md);
  background: var(--surface);
  color: var(--text-1);
  text-decoration: none;
  transition: border-color var(--dur-2) ease, background-color var(--dur-2) ease, box-shadow var(--dur-2) ease;
}
.genre-icon {
  display: grid;
  place-items: center;
  flex: none;
  width: 48px;
  height: 48px;
  border-radius: var(--r-md);
  transition: transform var(--dur-2) var(--ease-out);
}
.genre-icon { color: var(--genre-ink); background: var(--genre-tint); }
.genre-copy { display: grid; flex: 1; min-width: 0; gap: 3px; }
.genre-copy strong { font-weight: 650; line-height: 1.25; overflow-wrap: anywhere; }
.genre-copy > span { color: var(--text-2); font-size: var(--fs-xs); line-height: 1.4; overflow-wrap: anywhere; }
.genre .arrow { color: var(--genre-ink); }
.genre:is(:hover, :focus-visible) {
  border-color: var(--genre-ink);
  background: color-mix(in srgb, var(--genre-tint) 65%, var(--surface));
}
.genre:active { background: var(--genre-tint); box-shadow: inset 0 2px 4px #0002; }

.steps { list-style: none; padding: 0; margin: 0; display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.step { padding: 14px 0 6px; border-top: 1px solid var(--line-strong); }
.step-n { font-family: var(--font-heading); font-size: 1.45rem; color: var(--warm); }
.step h3 { font-size: var(--fs-md); margin: 5px 0; }
.step p { color: var(--text-2); font-size: var(--fs-sm); }

@media (prefers-reduced-motion: no-preference) {
  .home :is(.btn, .hero-project, .genre):focus-visible .arrow { translate: 3px 0; }
  .hero-cta .btn:focus-visible .arrow-down { translate: 0 3px; }
  .feature-book:focus-visible .feature-cover { translate: 0 -5px; }
  .genre:active .genre-icon { transform: scale(0.91); }
  .feature-book:active .feature-cover { translate: 0 2px; }
}

@media (hover: hover) and (prefers-reduced-motion: no-preference) {
  .home :is(.btn, .hero-project, .genre):hover .arrow { translate: 3px 0; }
  .hero-cta .btn:hover .arrow-down { translate: 0 3px; }
  .genre:hover:not(:active) .genre-icon { transform: rotate(-7deg) scale(1.08); }
  .feature-book:hover:not(:active) .feature-cover { translate: 0 -5px; box-shadow: 0 9px 17px #0006; }
}

@media (min-width: 700px) {
  .hundred-text:only-child { grid-column: 1 / -1; }
}
@media (max-width: 960px) {
  .genre-list { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .steps { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 699px) {
  .hero-panel, .hundred-card { grid-template-columns: minmax(0, 1fr); }
  .hero-text { padding: 22px; }
  .hero-title { text-wrap: wrap; }
  .hero-lead { margin-top: 14px; }
  .hero-cta { margin-top: 19px; }
  .hero-cta .btn { min-height: 45px; font-size: var(--fs-sm); }
  .hero-stats { gap: 2px 12px; }
  .hero-stats dd { font-size: var(--fs-xs); }
  .feature-cover { padding: 12px 10px; }
}
@media (max-width: 550px) {
  .search-box { flex-direction: column; }
  .steps { grid-template-columns: minmax(0, 1fr); gap: 8px; }
  .step { display: grid; grid-template-columns: 32px 1fr; column-gap: 9px; }
  .step .step-n { grid-row: span 2; }
  .genre-list { grid-template-columns: minmax(0, 1fr); }
  .genre { min-height: 80px; }
}
</style>

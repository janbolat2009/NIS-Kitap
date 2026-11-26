<template>
  <div class="home">
    <section class="hero container">
      <div class="hero-text rise-in">
        <span class="eyebrow">{{ t('home.kicker') }}</span>
        <h1 class="hero-title">{{ t('home.title') }}</h1>
        <p class="hero-lead">{{ t('home.lead') }}</p>
        <div class="hero-cta">
          <router-link to="/catalog" class="btn btn-primary btn-lg">{{ t('home.ctaCatalog') }}</router-link>
          <router-link to="/100-kitap" class="btn btn-secondary btn-lg">{{ t('home.ctaHundred') }}</router-link>
        </div>
        <dl class="hero-stats">
          <div><dt class="tabular">{{ fmt(stats.books) }}</dt><dd>{{ t('home.statBooks') }}</dd></div>
          <div><dt class="tabular">{{ fmt(stats.copies) }}</dt><dd>{{ t('home.statCopies') }}</dd></div>
          <div><dt class="tabular">100</dt><dd>{{ t('home.statHundred') }}</dd></div>
        </dl>
      </div>
      <div class="hero-book" aria-hidden="true">
        <div class="book">
          <div class="book-back" />
          <div class="book-page pg3"><span /><span /><span /><span /></div>
          <div class="book-page pg2"><span /><span /><span /></div>
          <div class="book-page pg1"><span /><span /><span /><span /><span /></div>
          <div class="book-cover"><span class="cover-title">NIS Kitap</span><span class="cover-line" /></div>
        </div>
        <div class="shelf" />
      </div>
    </section>

    <section id="ai-search-section" class="search container">
      <div class="search-head">
        <h2 class="section-title">{{ t('home.searchTitle') }}</h2>
        <p class="muted">{{ t('home.searchLead') }}</p>
      </div>
      <form class="search-box" role="search" @submit.prevent="runSearch">
        <label class="visually-hidden" for="ai-q">{{ t('home.searchTitle') }}</label>
        <input id="ai-q" ref="input" v-model="q" class="input search-input" maxlength="300" :placeholder="t('aiSearch.placeholder')" />
        <button class="btn btn-primary" type="submit" :disabled="searching || !q.trim()">
          <span v-if="searching" class="spinner" /><span v-else>{{ t('aiSearch.submit') }}</span>
        </button>
      </form>
      <div class="chip-row ideas">
        <button v-for="c in chips" :key="c" type="button" class="chip" @click="q = c; runSearch()">{{ c }}</button>
      </div>
      <p class="quota muted">
        <template v-if="!session.uid">{{ t('aiSearch.guestLimitNotice') }} · <button type="button" class="link" @click="openLogin()">{{ t('nav.signIn') }}</button></template>
        <template v-else>{{ t('aiSearch.quotaRemaining', { count: remaining }) }}</template>
      </p>
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
      <p v-else-if="searched && !searching && !searchError" class="muted">{{ t('catalog.noResults') }}</p>
    </section>

    <section id="how-to" class="how container" v-reveal>
      <h2 class="section-title">{{ t('home.stepsTitle') }}</h2>
      <ol class="steps">
        <li v-for="(s, i) in steps" :key="i" class="step">
          <span class="step-n">{{ i + 1 }}</span>
          <h3>{{ s.t }}</h3>
          <p>{{ s.d }}</p>
        </li>
      </ol>
    </section>

    <section class="hundred container" v-reveal>
      <div class="hundred-card">
        <div class="hundred-text">
          <span class="eyebrow">{{ t('nav.hundred') }}</span>
          <h2>{{ t('hundred.title') }}</h2>
          <p>{{ t('hundred.lead') }}</p>
          <router-link to="/100-kitap" class="btn btn-primary">{{ t('home.ctaHundred') }}</router-link>
        </div>
        <ul class="spines" aria-label="100 кітап">
          <li v-for="(b, i) in hundredPreview" :key="b.id" :style="{ '--h': `${150 + ((i * 37) % 60)}px`, '--c': `var(--cover-${(i % 5) + 1})` }">
            <router-link :to="b.catalogTitle ? `/book/${encodeURIComponent(b.catalogTitle)}` : '/100-kitap'" class="spine" :title="`${b.title} — ${b.author}`">
              <span>{{ b.title }}</span>
            </router-link>
          </li>
        </ul>
      </div>
    </section>

    <section class="browse container" v-reveal>
      <div class="browse-col">
        <h2 class="section-title">{{ t('home.genres') }}</h2>
        <div class="genre-list">
          <router-link v-for="g in genres" :key="g.to" :to="g.to" class="genre">{{ g.label[locale] || g.label.ru }}</router-link>
        </div>
      </div>
      <div class="browse-col">
        <h2 class="section-title">{{ t('home.languages') }}</h2>
        <div class="lang-list">
          <router-link to="/kazakh" class="lang-card"><span class="lang-code">KZ</span>{{ t('home.lang.kz') }}</router-link>
          <router-link to="/russian" class="lang-card"><span class="lang-code">RU</span>{{ t('home.lang.ru') }}</router-link>
          <router-link to="/english" class="lang-card"><span class="lang-code">EN</span>{{ t('home.lang.en') }}</router-link>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { t, currentLocale } from '@/i18n';
import { session } from '@/stores/session';
import { openLogin } from '@/stores/ui';
import { getBooks, searchAi } from '@/services/bookService';
import { canPerformSearch, formatResetDateTime } from '@/services/geminiLimitService';
import { loadHundredBooks } from '@/services/library';

const locale = currentLocale;
const stats = ref({ books: 0, copies: 0 });
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

const genres = [
  { to: '/fantastica', label: { ru: 'Фантастика', kz: 'Фантастика', en: 'Science fiction' } },
  { to: '/fantasy', label: { ru: 'Фэнтези', kz: 'Фэнтези', en: 'Fantasy' } },
  { to: '/detective', label: { ru: 'Детективы', kz: 'Детектив', en: 'Detective' } },
  { to: '/adventure', label: { ru: 'Приключения', kz: 'Шытырман оқиға', en: 'Adventure' } },
  { to: '/biography', label: { ru: 'Биографии', kz: 'Өмірбаян', en: 'Biography' } },
  { to: '/romantica', label: { ru: 'Романтика', kz: 'Романтика', en: 'Romance' } },
  { to: '/poetry', label: { ru: 'Поэзия', kz: 'Поэзия', en: 'Poetry' } },
  { to: '/catalog', label: { ru: 'Весь каталог', kz: 'Бүкіл каталог', en: 'Whole catalog' } },
];

const fmt = (n) => (n ? new Intl.NumberFormat('ru-RU').format(n) : '—');
const initial = (s) => String(s || '?').trim().charAt(0).toUpperCase();
function coverColor(title) {
  let h = 0;
  for (const ch of String(title)) h = (h * 31 + ch.charCodeAt(0)) % 5;
  return `var(--cover-${h + 1})`;
}

async function runSearch() {
  if (!q.value.trim()) return;
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

onMounted(async () => {
  try {
    const books = await getBooks();
    stats.value = { books: books.length, copies: books.reduce((s, b) => s + (Number(b.copies) || 0), 0) };
  } catch {
    // stats are decoration
  }
  try {
    const data = await loadHundredBooks();
    hundredPreview.value = data.books.filter((b) => b.catalogBookId).slice(0, 14);
  } catch {
    hundredPreview.value = [];
  }
});
</script>

<style scoped>
.home { padding-bottom: 72px; }

/* hero */
.hero { display: grid; grid-template-columns: 1.15fr 0.85fr; gap: 48px; align-items: center; padding-top: clamp(28px, 6vw, 72px); padding-bottom: 40px; }
.hero-title { font-size: var(--fs-3xl); line-height: 1.08; letter-spacing: -0.02em; margin-bottom: 18px; max-width: 14ch; }
.hero-lead { font-size: var(--fs-lg); color: var(--text-2); max-width: 56ch; }
.hero-cta { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 28px; }
.hero-stats { display: flex; gap: 32px; flex-wrap: wrap; margin: 36px 0 0; padding-top: 20px; border-top: 1px solid var(--line); }
.hero-stats dt { font-family: var(--font-serif); font-size: 1.6rem; font-weight: 600; }
.hero-stats dd { margin: 0; font-size: var(--fs-sm); color: var(--text-3); }

/* opening book */
.hero-book { position: relative; height: 340px; display: grid; place-items: center; perspective: 1400px; }
.book { position: relative; width: 210px; height: 280px; transform-style: preserve-3d; transform: rotateX(8deg) rotateY(-18deg); animation: book-settle 1.4s var(--ease-out) 0.1s both; }
.book-back, .book-page, .book-cover { position: absolute; inset: 0; border-radius: 3px 10px 10px 3px; transform-origin: left center; }
.book-back { background: var(--brand); box-shadow: var(--shadow-3); }
.book-page { inset: 6px 6px 6px 0; background: var(--surface); border: 1px solid var(--line); padding: 30px 22px; display: flex; flex-direction: column; gap: 10px; }
.book-page span { display: block; height: 6px; border-radius: 3px; background: var(--surface-3); }
.book-page span:nth-child(2n) { width: 80%; }
.book-page span:last-child { width: 55%; }
.pg1 { animation: page-open 1.6s var(--ease-out) 0.9s both; }
.pg2 { animation: page-open 1.6s var(--ease-out) 1.05s both; --open: -150deg; }
.pg3 { --open: -8deg; animation: page-open 1.6s var(--ease-out) 1.2s both; }
.book-cover { background: linear-gradient(135deg, #0b3a70, #003060 60%); color: #f6eee1; padding: 28px 22px; display: flex; flex-direction: column; justify-content: flex-end; gap: 10px; animation: cover-open 1.6s var(--ease-out) 0.6s both; backface-visibility: hidden; }
.cover-title { font-family: var(--font-serif); font-size: 1.5rem; font-weight: 600; }
.cover-line { width: 40px; height: 2px; background: #c9a45c; }
.shelf { position: absolute; bottom: 14px; width: 70%; height: 10px; border-radius: 50%; background: radial-gradient(closest-side, rgba(0, 0, 0, 0.18), transparent); }
@keyframes cover-open { from { transform: rotateY(0deg); } to { transform: rotateY(-158deg); } }
@keyframes page-open { from { transform: rotateY(0deg); } to { transform: rotateY(var(--open, -160deg)); } }
@keyframes book-settle { from { transform: rotateX(14deg) rotateY(-28deg) translateY(10px); opacity: 0; } to { transform: rotateX(8deg) rotateY(-18deg); opacity: 1; } }

/* search */
.search { margin-top: 32px; }
.search-head { margin-bottom: 14px; }
.search-box { display: flex; gap: 10px; }
.search-input { flex: 1; min-height: 52px; font-size: 1rem; }
.search-box .btn { min-height: 52px; }
.ideas { margin-top: 12px; }
.quota { margin-top: 10px; font-size: var(--fs-sm); }
.link { background: none; border: none; padding: 0; color: var(--accent-text); font-weight: 600; cursor: pointer; }
.results { list-style: none; padding: 0; margin: 20px 0 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px; }
.result { display: flex; gap: 14px; padding: 14px; border: 1px solid var(--line); border-radius: var(--r-lg); background: var(--surface); text-decoration: none; color: var(--text-1); height: 100%; transition: border-color var(--dur-1) ease, transform var(--dur-2) var(--ease-out); }
.result:hover { border-color: var(--line-strong); transform: translateY(-2px); }
.result-cover { flex: none; width: 46px; height: 64px; border-radius: 3px 6px 6px 3px; display: grid; place-items: center; color: #fff; font-family: var(--font-serif); font-size: 1.2rem; }
.result-body { display: flex; flex-direction: column; gap: 2px; min-width: 0; font-size: var(--fs-sm); }
.result-body strong { font-size: var(--fs-md); overflow-wrap: anywhere; }
.reason { color: var(--text-2); margin-top: 4px; }

/* steps */
.how { margin-top: 72px; }
.steps { list-style: none; padding: 0; margin: 0; display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.step { padding: 20px; border-top: 2px solid var(--text-1); }
.step-n { font-family: var(--font-serif); font-size: 1.4rem; color: var(--text-3); }
.step h3 { font-size: var(--fs-lg); margin: 6px 0; }
.step p { color: var(--text-2); font-size: var(--fs-sm); }

/* 100 kitap */
.hundred { margin-top: 72px; }
.hundred-card { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; align-items: end; padding: clamp(24px, 4vw, 40px); border-radius: var(--r-xl); background: var(--surface-2); overflow: hidden; }
.hundred-text h2 { font-size: var(--fs-2xl); margin-bottom: 12px; }
.hundred-text p { color: var(--text-2); margin-bottom: 20px; }
.spines { list-style: none; margin: 0; padding: 0; display: flex; align-items: flex-end; gap: 4px; height: 220px; overflow: hidden; border-bottom: 6px solid var(--line-strong); }
.spines li { flex: none; }
.spine { display: flex; align-items: center; justify-content: center; width: 34px; height: var(--h); background: var(--c); color: #fff; border-radius: 3px 3px 0 0; text-decoration: none; writing-mode: vertical-rl; transform: rotate(180deg); padding: 10px 0; font-size: 12px; font-weight: 600; overflow: hidden; white-space: nowrap; transition: transform var(--dur-2) var(--ease-out); }
.spine span { overflow: hidden; text-overflow: ellipsis; max-height: 100%; }
.spine:hover { transform: rotate(180deg) translateY(10px); }

/* browse */
.browse { margin-top: 72px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
.genre-list { display: flex; flex-wrap: wrap; gap: 8px; }
.genre { padding: 10px 16px; border-radius: var(--r-pill); border: 1px solid var(--line-strong); color: var(--text-1); text-decoration: none; font-weight: 550; font-size: var(--fs-sm); }
.genre:hover { background: var(--surface-2); }
.lang-list { display: grid; gap: 10px; }
.lang-card { display: flex; align-items: center; gap: 14px; padding: 14px 16px; border: 1px solid var(--line); border-radius: var(--r-lg); background: var(--surface); color: var(--text-1); text-decoration: none; font-weight: 600; }
.lang-card:hover { border-color: var(--line-strong); }
.lang-code { width: 40px; height: 40px; border-radius: var(--r-sm); display: grid; place-items: center; background: var(--accent-soft); color: var(--accent-text); font-size: 13px; font-weight: 750; }

@media (max-width: 900px) {
  .hero { grid-template-columns: 1fr; gap: 8px; }
  .hero-book { height: 240px; order: -1; }
  .book { width: 150px; height: 200px; }
  .steps { grid-template-columns: 1fr 1fr; }
  .hundred-card, .browse { grid-template-columns: 1fr; }
  .spines { height: 180px; }
}
@media (max-width: 520px) {
  .search-box { flex-direction: column; }
  .steps { grid-template-columns: 1fr; }
  .hero-stats { gap: 20px; }
}
@media (prefers-reduced-motion: reduce) {
  .book-cover { transform: rotateY(-158deg); }
  .pg1 { transform: rotateY(-160deg); }
  .pg2 { transform: rotateY(-150deg); }
}
</style>

<template>
  <div class="page container about-page">
    <header class="about-head">
      <div class="page-head">
        <h1 class="page-title">{{ t('aboutPage.title') }}</h1>
        <p class="page-lead">{{ t('aboutPage.lead') }}</p>
      </div>
      <div class="about-overview">
        <section class="mission" aria-labelledby="mission-title">
          <div class="mission-copy">
            <h2 id="mission-title" class="section-title">{{ t('aboutPage.missionTitle') }}</h2>
            <p>{{ t('aboutPage.missionP1') }}</p>
            <router-link to="/catalog" class="btn btn-primary">{{ t('aboutPage.exploreBtn') }}</router-link>
          </div>
          <div v-reveal class="shelf-scene" aria-hidden="true">
            <div class="shelf">
              <span class="shelf-book volume-teal" />
              <span class="shelf-book volume-blue" />
              <span class="shelf-book volume-gold shelf-selected" />
              <span class="shelf-book volume-plum" />
              <span class="shelf-book volume-brown" />
              <span class="shelf-book volume-green" />
            </div>
          </div>
        </section>
        <section class="why" aria-labelledby="why-title">
          <h2 id="why-title" class="section-title">{{ t('aboutPage.whyTitle') }}</h2>
          <ul class="value-list">
            <li v-for="key in values" :key="key">
              <h3>{{ t(`aboutPage.${key}Title`) }}</h3>
              <p>{{ t(`aboutPage.${key}Desc`) }}</p>
            </li>
          </ul>
        </section>
      </div>
    </header>

    <section class="about-section" aria-labelledby="language-title">
      <h2 id="language-title" class="section-title">{{ t('home.languages') }}</h2>
      <LanguageLinks />
    </section>

    <dl v-if="stats" class="about-stats">
      <div><dt>{{ t('home.statBooks') }}</dt><dd class="tabular">{{ format(stats.books) }}</dd></div>
      <div><dt>{{ t('aboutTeaser.statGenres') }}</dt><dd class="tabular">{{ format(stats.genres) }}</dd></div>
      <div><dt>{{ t('aboutTeaser.statLanguages') }}</dt><dd class="tabular">3</dd></div>
    </dl>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import LanguageLinks from '@/components/LanguageLinks.vue';
import { t, currentLocale } from '@/i18n';
import { getBooks, getUniqueGenres } from '@/services/bookService';

const values = ['valAi', 'valBooking', 'valTrilingual', 'valApple'];
const stats = ref(null);
const numberFormat = computed(() => new Intl.NumberFormat(currentLocale.value === 'kz' ? 'kk-KZ' : currentLocale.value));
const format = (number) => numberFormat.value.format(number);

onMounted(async () => {
  try {
    const books = await getBooks();
    if (books.length) stats.value = { books: books.length, genres: getUniqueGenres(books).length };
  } catch {
    stats.value = null;
  }
});
</script>

<style scoped>
.about-page { --section-gap: clamp(28px, 4.4vw, 54px); }
.about-head .page-head { display: block; }
.about-overview { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: clamp(20px, 3.6vw, 46px); align-items: start; }
.mission {
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: var(--r-lg);
  background: var(--surface);
}
.mission-copy { padding: clamp(18px, 2.8vw, 32px); }
.mission-copy p { max-width: 52ch; color: var(--text-2); }
.mission-copy .btn { margin-top: 19px; }
.shelf-scene {
  display: grid;
  place-items: center;
  overflow: hidden;
  min-height: 202px;
  padding: 30px 16px 16px;
  background: color-mix(in srgb, var(--accent-soft) 58%, var(--surface));
}
.shelf {
  display: flex;
  align-items: end;
  justify-content: center;
  gap: clamp(3px, 1vw, 9px);
  width: min(90%, 310px);
  padding: 0 7%;
  border-bottom: 6px solid color-mix(in srgb, var(--text-2) 57%, var(--accent-soft));
}
.shelf-book {
  position: relative;
  width: var(--width);
  height: var(--height);
  flex: 0 1 var(--width);
  border-radius: 5px 5px 2px 2px;
  background: linear-gradient(90deg, #ffffff28, transparent 21% 72%, #07152355), var(--binding);
  box-shadow: 3px 4px 8px #07152326;
}
.shelf-book::before, .shelf-book::after {
  position: absolute;
  content: '';
  inset: 12% 19% auto;
  height: 7px;
  border-block: 1px solid #fff8;
}
.shelf-book::after { inset: auto 19% 13%; }
.volume-teal { --width: 31px; --height: 109px; --binding: #29564d; }
.volume-blue { --width: 36px; --height: 136px; --binding: #24486c; }
.volume-gold { --width: 39px; --height: 142px; --binding: #9b6928; }
.volume-plum { --width: 31px; --height: 112px; --binding: #60456c; }
.volume-brown { --width: 29px; --height: 126px; --binding: #854839; }
.volume-green { --width: 26px; --height: 101px; --binding: #4d6244; }
.shelf-selected { transform: translateY(-23px) rotate(-6deg); z-index: 1; }
@media (prefers-reduced-motion: no-preference) {
  .shelf-scene.is-revealed .shelf-selected { animation: select-book 1.65s ease-in-out 240ms both; }
  @keyframes select-book {
    from { transform: translateY(0) rotate(0); }
    to { transform: translateY(-23px) rotate(-6deg); }
  }
}
.about-section, .about-stats { margin-top: var(--section-gap); }
.why { padding-top: clamp(5px, 1.8vw, 21px); }
.value-list { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px 26px; list-style: none; margin: 0; padding: 0; }
.value-list li { border-top: 1px solid var(--line-strong); padding: 13px 0 8px; }
.value-list h3 { font-size: var(--fs-md); font-weight: 750; }
.value-list p { margin-top: 6px; color: var(--text-2); font-size: var(--fs-sm); max-width: 47ch; }
.about-stats { display: flex; flex-wrap: wrap; gap: 15px 36px; padding: 15px 0 0; border-top: 1px solid var(--line); }
.about-stats div { display: flex; align-items: baseline; column-gap: 9px; }
.about-stats dt { order: 1; color: var(--text-2); font-size: var(--fs-sm); }
.about-stats dd { margin: 0; font-weight: 750; }
@media (max-width: 780px) {
  .about-overview { grid-template-columns: minmax(0, 1fr); }
}
@media (max-width: 480px) { .value-list { grid-template-columns: minmax(0, 1fr); } }
</style>

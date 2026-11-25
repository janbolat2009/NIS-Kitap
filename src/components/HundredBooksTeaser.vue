<template>
  <section class="hundred-teaser" id="hundred-kitap-section" aria-labelledby="hundred-teaser-title">
    <div class="section-wrap">
      <div class="teaser-box" v-reveal>
        <div class="teaser-text">
          <span class="kp-eyebrow">{{ t('hundred.tag') }}</span>
          <h2 id="hundred-teaser-title" class="teaser-title">{{ t('hundred.title') }}</h2>
          <p class="teaser-full">{{ t('hundred.fullTitle') }}</p>
          <p class="teaser-lead">{{ t('hundred.lead') }}</p>

          <ul class="teaser-counts">
            <li><strong>60</strong><span>{{ t('sections.kazakh') }}</span></li>
            <li><strong>20</strong><span>{{ t('sections.russian') }}</span></li>
            <li><strong>20</strong><span>{{ t('sections.foreign') }}</span></li>
          </ul>

          <div class="teaser-actions">
            <router-link to="/100-kitap" class="apple-btn-primary">{{ t('hundred.viewAll') }}</router-link>
            <router-link v-if="session.uid" to="/me" class="apple-btn-secondary">{{ t('hundred.myProgress') }}</router-link>
          </div>
        </div>

        <div class="teaser-side">
          <div class="teaser-progress">
            <ProgressRing :value="confirmed" :max="100" :size="112" :stroke="9" :label="t('hundred.progressOf', { count: confirmed })" />
            <div>
              <strong>{{ session.uid ? t('hundred.progressOf', { count: confirmed }) : t('hundred.progressGuest') }}</strong>
              <p>{{ t('hundred.confirmedNote') }}</p>
            </div>
          </div>

          <ul v-if="samples.length" class="teaser-books kp-stagger">
            <li v-for="b in samples" :key="b.id">
              <router-link :to="{ path: '/100-kitap', query: { q: b.title } }" class="teaser-book">
                <span class="teaser-book-num">{{ b.order }}</span>
                <span class="teaser-book-text">
                  <strong>{{ b.title }}</strong>
                  <small>{{ b.author }} · {{ t('hundred.gradeN', { grade: b.grade }) }}</small>
                </span>
              </router-link>
            </li>
          </ul>
          <div v-else class="teaser-books">
            <div v-for="n in 4" :key="n" class="kp-skeleton" style="height: 54px"></div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import ProgressRing from '@/components/ProgressRing.vue';
import { session } from '@/stores/session';
import { t } from '@/i18n';
import { loadHundredBooks, hundredEntryToBook, getMyProgress } from '@/services/progressService';

// A small, fixed selection across all three sections and grades of the list.
const SAMPLE_IDS = ['h100_032', 'h100_074', 'h100_090', 'h100_044', 'h100_082', 'h100_061'];

const samples = ref([]);
const confirmed = ref(0);
let entries = [];

async function loadProgress() {
  if (!session.uid || !entries.length) {
    confirmed.value = 0;
    return;
  }
  try {
    const map = await getMyProgress();
    confirmed.value = entries.filter((e) => map.get(hundredEntryToBook(e).bookId)?.verificationStatus === 'confirmed').length;
  } catch {
    confirmed.value = 0;
  }
}

onMounted(async () => {
  try {
    const data = await loadHundredBooks();
    entries = data.books;
    samples.value = SAMPLE_IDS.map((id) => entries.find((b) => b.id === id)).filter(Boolean);
    loadProgress();
  } catch {
    samples.value = [];
  }
});
watch(() => session.uid, loadProgress);
</script>

<style scoped>
.hundred-teaser { padding: 40px 0 72px; position: relative; z-index: 1; }
.section-wrap { max-width: 1280px; margin: 0 auto; padding: 0 24px; }
.teaser-box {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
  gap: 36px;
  padding: 36px;
  border-radius: var(--apple-radius-xl);
  border: 1px solid var(--apple-glass-border);
  background:
    radial-gradient(ellipse 60% 80% at 100% 0%, rgba(246, 238, 225, 0.07), transparent 70%),
    var(--apple-glass-card);
}
.teaser-title { margin: 0 0 6px; font-size: clamp(32px, 4vw, 44px); font-weight: 800; letter-spacing: -0.02em; }
.teaser-full { margin: 0 0 12px; font-size: 17px; font-weight: 600; color: var(--apple-cream); line-height: 1.35; }
.teaser-lead { margin: 0 0 20px; font-size: 15px; line-height: 1.6; color: var(--apple-text-secondary); max-width: 560px; }
.teaser-counts { list-style: none; margin: 0 0 24px; padding: 0; display: flex; gap: 24px; flex-wrap: wrap; }
.teaser-counts li { display: flex; flex-direction: column; }
.teaser-counts strong { font-size: 28px; font-weight: 700; letter-spacing: -0.02em; }
.teaser-counts span { font-size: 13px; color: var(--apple-text-muted); }
.teaser-actions { display: flex; gap: 12px; flex-wrap: wrap; }

.teaser-side { display: flex; flex-direction: column; gap: 18px; min-width: 0; }
.teaser-progress {
  display: flex;
  gap: 18px;
  align-items: center;
  padding: 16px;
  border-radius: var(--apple-radius-lg);
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
}
.teaser-progress strong { font-size: 16px; }
.teaser-progress p { margin: 6px 0 0; font-size: 13px; color: var(--apple-text-muted); line-height: 1.45; }

.teaser-books { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.teaser-book {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 10px 12px;
  border-radius: var(--apple-radius-md);
  border: 1px solid rgba(255, 255, 255, 0.07);
  background: rgba(255, 255, 255, 0.025);
  color: inherit;
  text-decoration: none;
  transition: border-color 0.25s, background 0.25s, transform 0.25s var(--apple-spring);
  min-width: 0;
}
.teaser-book:hover { border-color: var(--apple-glass-border-hover); background: rgba(255, 255, 255, 0.06); transform: translateY(-2px); }
.teaser-book-num {
  flex: 0 0 34px;
  height: 34px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  font-weight: 700;
  font-size: 13px;
  color: #0b1424;
  background: var(--apple-cream);
}
.teaser-book-text { display: flex; flex-direction: column; min-width: 0; }
.teaser-book-text strong { font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.teaser-book-text small { font-size: 12px; color: var(--apple-text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

@media (max-width: 960px) {
  .teaser-box { grid-template-columns: 1fr; padding: 28px; }
}
@media (max-width: 640px) {
  .section-wrap { padding: 0 16px; }
  .teaser-box { padding: 22px 18px; gap: 24px; }
  .teaser-books { grid-template-columns: 1fr; }
  .teaser-actions > * { flex: 1 1 100%; }
}
</style>

<template>
  <PageShell>
    <div class="cert-page">
      <div class="kp-head kp-no-print">
        <div>
          <h1 class="kp-title">{{ t('cert.verifyTitle') }}</h1>
          <p class="kp-subtitle">{{ number }}</p>
        </div>
        <button v-if="cert" class="kp-btn primary" @click="printCert">{{ t('common.print') }}</button>
      </div>

      <div v-if="loading" class="kp-skeleton" style="height: 420px"></div>
      <div v-else-if="!cert" class="kp-state" role="alert">
        <h3>{{ t('cert.notFound') }}</h3>
        <p>{{ number }}</p>
      </div>
      <template v-else>
        <p class="cert-status kp-no-print" :class="cert.status === 'valid' ? 'ok' : 'bad'" role="status">
          {{ cert.status === 'valid' && !isExpired ? t('cert.valid') : t('cert.expired') }}
        </p>

        <article class="certificate" aria-labelledby="cert-title">
          <div class="cert-border">
            <header class="cert-header">
              <img src="@/img/Logotype.svg" alt="NIS Kitap" class="cert-logo" />
              <span class="cert-school">NIS Kitap · Nazarbayev Intellectual Schools</span>
            </header>
            <h2 id="cert-title" class="cert-title">{{ t('cert.title') }}</h2>
            <p class="cert-kind">{{ t(`rewards.types.${cert.type}`) }}</p>
            <p class="cert-small">{{ t('cert.awardedTo') }}</p>
            <p class="cert-name">{{ (cert.recipientShort || cert.recipientName) }}<span v-if="cert.className">, {{ cert.className }}</span></p>
            <p class="cert-small">{{ t('cert.forText') }}</p>
            <p class="cert-reason">{{ cert.title }}</p>
            <p v-if="cert.reason && cert.reason !== cert.title" class="cert-reason-small">{{ cert.reason }}</p>
            <p v-if="cert.nominal" class="cert-nominal">{{ t('cert.nominal') }}: {{ cert.nominal }}</p>

            <footer class="cert-footer">
              <dl class="cert-meta">
                <div><dt>{{ t('cert.number') }}</dt><dd>{{ cert.number }}</dd></div>
                <div><dt>{{ t('cert.issued') }}</dt><dd>{{ formatDate(cert.issuedAt) }}</dd></div>
                <div v-if="cert.validUntil"><dt>{{ t('cert.validUntil') }}</dt><dd>{{ formatDate(cert.validUntil) }}</dd></div>
              </dl>
              <div class="cert-signs">
                <div><span class="cert-line"></span><small>{{ t('cert.signLibrarian') }}<template v-if="cert.issuedByName"> · {{ cert.issuedByName }}</template></small></div>
                <div><span class="cert-line"></span><small>{{ t('cert.signAdmin') }}<template v-if="cert.approvedByName"> · {{ cert.approvedByName }}</template></small></div>
              </div>
              <figure class="cert-qr">
                <div v-html="qrSvg" aria-hidden="true"></div>
                <figcaption>{{ t('cert.scan') }}</figcaption>
              </figure>
            </footer>
          </div>
        </article>
      </template>
    </div>
  </PageShell>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import QRCode from 'qrcode';
import PageShell from '@/components/PageShell.vue';
import { t, currentLocale } from '@/i18n';
import { getCertificate } from '@/services/library';

const route = useRoute();
const number = computed(() => String(route.params.number || '').toUpperCase());
const cert = ref(null);
const loading = ref(true);
const qrSvg = ref('');

const isExpired = computed(() => cert.value?.validUntil && new Date(cert.value.validUntil) < new Date());

function formatDate(value) {
  if (!value) return '—';
  const loc = currentLocale.value === 'kz' ? 'kk-KZ' : currentLocale.value === 'en' ? 'en-GB' : 'ru-RU';
  return new Date(value).toLocaleDateString(loc, { day: 'numeric', month: 'long', year: 'numeric' });
}

async function load() {
  loading.value = true;
  try {
    cert.value = await getCertificate(number.value);
    if (cert.value) {
      const url = `${window.location.origin}/certificate/${cert.value.number}`;
      qrSvg.value = await QRCode.toString(url, { type: 'svg', margin: 0, color: { dark: '#0b1424', light: '#00000000' } });
    }
  } catch {
    cert.value = null;
  } finally {
    loading.value = false;
  }
}

function printCert() {
  window.print();
}

watch(number, load, { immediate: true });
</script>

<style scoped>
.cert-page { max-width: 900px; margin: 0 auto; }
.cert-status { display: inline-block; margin: 0 0 16px; padding: 6px 14px; border-radius: var(--apple-radius-pill); font-weight: 600; font-size: 14px; }
.cert-status.ok { background: var(--success-soft); color: var(--success); border: 1px solid rgba(16, 185, 129, 0.4); }
.cert-status.bad { background: var(--danger-soft); color: #FDA4AF; border: 1px solid rgba(244, 63, 94, 0.4); }

.certificate {
  background: var(--surface);
  color: var(--text-1);
  border-radius: var(--apple-radius-lg);
  padding: 18px;
  box-shadow: var(--apple-shadow-lg);
  animation: kp-rise 0.5s var(--apple-spring) both;
}
.cert-border {
  border: 1.5px solid #003060;
  border-radius: 14px;
  padding: 40px 44px 28px;
  text-align: center;
  position: relative;
}
.cert-header { display: flex; flex-direction: column; align-items: center; gap: 8px; margin-bottom: 18px; }
.cert-logo { height: 46px; filter: invert(13%) sepia(53%) saturate(2250%) hue-rotate(196deg) brightness(92%); }
.cert-school { font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: #48576b; }
.cert-title { margin: 0; font-size: clamp(30px, 5vw, 44px); font-weight: 800; letter-spacing: 0.02em; color: #003060; text-transform: uppercase; }
.cert-kind { margin: 4px 0 22px; font-size: 15px; color: #48576b; }
.cert-small { margin: 0; font-size: 14px; color: #48576b; }
.cert-name { margin: 6px 0 14px; font-size: clamp(24px, 4vw, 32px); font-weight: 700; overflow-wrap: anywhere; }
.cert-reason { margin: 6px 0 4px; font-size: 18px; font-weight: 600; overflow-wrap: anywhere; }
.cert-reason-small { margin: 0 auto; max-width: 560px; font-size: 14px; color: #48576b; line-height: 1.5; }
.cert-nominal { margin: 12px 0 0; font-weight: 600; }
.cert-footer {
  margin-top: 30px;
  display: grid;
  grid-template-columns: 1fr 1.2fr auto;
  gap: 20px;
  align-items: end;
  text-align: left;
}
.cert-meta { margin: 0; display: grid; gap: 6px; font-size: 13px; }
.cert-meta div { display: flex; gap: 6px; }
.cert-meta dt { color: #48576b; }
.cert-meta dd { margin: 0; font-weight: 600; }
.cert-signs { display: grid; gap: 16px; }
.cert-signs div { display: flex; flex-direction: column; gap: 4px; }
.cert-line { display: block; height: 1px; background: var(--surface); opacity: 0.5; width: 100%; }
.cert-signs small { font-size: 12px; color: #48576b; }
.cert-qr { margin: 0; width: 104px; text-align: center; }
.cert-qr div :deep(svg) { width: 96px; height: 96px; }
.cert-qr figcaption { font-size: 10px; color: #48576b; line-height: 1.3; margin-top: 4px; }

@media (max-width: 640px) {
  .cert-border { padding: 28px 18px 22px; }
  .cert-footer { grid-template-columns: 1fr; text-align: center; justify-items: center; }
  .cert-meta div { justify-content: center; }
  .cert-signs { width: 100%; }
}
@media print {
  .certificate { box-shadow: none; padding: 0; animation: none; }
  .cert-page { max-width: none; }
}
</style>

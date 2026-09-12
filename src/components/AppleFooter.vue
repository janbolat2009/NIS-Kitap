<template>
  <footer class="apple-footer">
    <div class="footer-container">
      <div class="footer-top">
        <!-- Col 1: Brand & Mission -->
        <div class="footer-brand-col">
          <div class="brand-row" @click="$router.push('/')">
            <img src="@/img/Logotype.svg" alt="NIS Kitap" class="footer-logo" />
            <span class="footer-brand-name">NIS Kitap</span>
          </div>
          <p class="brand-tagline">
            {{ t('footer.tagline') }}
          </p>
          <div class="school-pill">
            <span class="dot"></span>
            <span>{{ t('footer.schoolName') }}</span>
          </div>
        </div>

        <!-- Col 2: Navigation -->
        <div class="footer-links-col">
          <h4 class="col-title">{{ t('footer.navCol') }}</h4>
          <ul class="col-list">
            <li><router-link to="/">{{ t('nav.home') }}</router-link></li>
            <li><router-link to="/catalog">{{ t('nav.catalog') }}</router-link></li>
            <li><router-link to="/about-us">{{ t('nav.about') }}</router-link></li>
            <li><a href="#ai-search-section">{{ t('nav.searchAi') }}</a></li>
          </ul>
        </div>

        <!-- Col 3: Genres -->
        <div class="footer-links-col">
          <h4 class="col-title">{{ t('footer.genresCol') }}</h4>
          <ul class="col-list">
            <li><router-link to="/fantastica">{{ t('genres.fantastica') }}</router-link></li>
            <li><router-link to="/fantasy">{{ t('genres.fantasy') }}</router-link></li>
            <li><router-link to="/detective">{{ t('genres.detective') }}</router-link></li>
            <li><router-link to="/adventure">{{ t('genres.adventure') }}</router-link></li>
            <li><router-link to="/biography">{{ t('genres.biography') }}</router-link></li>
            <li><router-link to="/romantica">{{ t('genres.romantica') }}</router-link></li>
            <li><router-link to="/poetry">{{ t('genres.poetry') }}</router-link></li>
          </ul>
        </div>

        <!-- Col 4: Languages & Contacts -->
        <div class="footer-links-col">
          <h4 class="col-title">{{ t('footer.langCol') }}</h4>
          <ul class="col-list">
            <li><router-link to="/kazakh">{{ t('footer.kzLink') }}</router-link></li>
            <li><router-link to="/russian">{{ t('footer.ruLink') }}</router-link></li>
            <li><router-link to="/english">{{ t('footer.enLink') }}</router-link></li>
          </ul>

          <div class="contacts-box">
            <a href="mailto:janbolatique.kz@gmail.com" class="contact-link">
              <img src="@/img/ic_baseline-email.png" alt="Email" class="contact-icon" />
              <span>janbolatique.kz@gmail.com</span>
            </a>
            <a href="tel:+77007575481" class="contact-link">
              <img src="@/img/ic_baseline-phone.png" alt="Phone" class="contact-icon" />
              <span>+7 700 757 5481</span>
            </a>
          </div>

          <div class="social-row">
            <a href="https://instagram.com" target="_blank" rel="noopener" class="social-btn" title="Instagram">
              <img src="@/img/mdi_instagram.png" alt="Instagram" />
            </a>
            <a href="https://t.me" target="_blank" rel="noopener" class="social-btn" title="Telegram">
              <img src="@/img/mingcute_telegram-fill.png" alt="Telegram" />
            </a>
          </div>
        </div>
      </div>

      <div class="footer-divider"></div>

      <div class="footer-bottom">
        <p class="copyright">
          © {{ currentYear }} NIS Kitap. {{ t('footer.rights') }}
        </p>
        <div class="footer-badges">
          <span class="tech-badge">Vue 3 + Vite</span>
          <span class="tech-badge">Glassmorphism</span>
          <span class="tech-badge">Gemini AI</span>
          <span class="tech-badge">KZ • RU • EN</span>
        </div>
      </div>
    </div>
  </footer>
</template>

<script>
import { t } from '@/i18n';

export default {
  name: 'AppleFooter',
  setup() {
    return { t };
  },
  data() {
    return {
      currentYear: new Date().getFullYear(),
    };
  },
};
</script>

<style scoped>
.apple-footer {
  margin-top: auto;
  position: relative;
  background: rgba(4, 8, 16, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding: 60px 24px 32px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
}

.footer-container {
  max-width: 1280px;
  margin: 0 auto;
}

.footer-top {
  display: grid;
  grid-template-columns: 1.6fr 1fr 1fr 1.3fr;
  gap: 40px;
  margin-bottom: 40px;
}

/* Brand col */
.footer-brand-col {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.brand-row {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.footer-logo {
  height: 34px;
  width: auto;
}

.footer-brand-name {
  font-size: 19px;
  font-weight: 700;
  color: #FFFFFF;
  letter-spacing: -0.01em;
}

.brand-tagline {
  font-size: 13.5px;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
  max-width: 320px;
}

.school-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 9999px;
  background: rgba(0, 113, 227, 0.12);
  border: 1px solid rgba(56, 189, 248, 0.25);
  color: #38BDF8;
  font-size: 12px;
  font-weight: 500;
  width: fit-content;
}
.school-pill .dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #38BDF8;
  box-shadow: 0 0 6px #38BDF8;
}

/* Link cols */
.footer-links-col {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.col-title {
  font-size: 14px;
  font-weight: 600;
  color: #FFFFFF;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  margin: 0 0 4px;
}

.col-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.col-list a {
  color: rgba(255, 255, 255, 0.62);
  text-decoration: none;
  font-size: 13.5px;
  transition: all 0.2s ease;
}
.col-list a:hover {
  color: #38BDF8;
  transform: translateX(2px);
}

/* Contacts & Social */
.contacts-box {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 10px;
}

.contact-link {
  display: flex;
  align-items: center;
  gap: 8px;
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  font-size: 13px;
  transition: color 0.2s ease;
}
.contact-link:hover {
  color: #38BDF8;
}
.contact-icon {
  width: 16px;
  height: 16px;
  opacity: 0.8;
  filter: invert(1);
}

.social-row {
  display: flex;
  gap: 10px;
  margin-top: 8px;
}

.social-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.25s ease;
}
.social-btn:hover {
  background: rgba(0, 113, 227, 0.3);
  border-color: rgba(56, 189, 248, 0.5);
  transform: translateY(-2px);
}
.social-btn img {
  width: 18px;
  height: 18px;
  opacity: 0.9;
  filter: invert(1);
}

/* Bottom */
.footer-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.08);
  margin-bottom: 24px;
}

.footer-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
  font-size: 13px;
}

.copyright {
  margin: 0;
  color: rgba(255, 255, 255, 0.5);
}

.footer-badges {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tech-badge {
  font-size: 11px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 3px 8px;
  border-radius: 6px;
  color: rgba(255, 255, 255, 0.6);
}

@media (max-width: 960px) {
  .footer-top {
    grid-template-columns: 1fr 1fr;
    gap: 32px;
  }
}

@media (max-width: 600px) {
  .footer-top {
    grid-template-columns: 1fr;
    gap: 28px;
  }
  .apple-footer {
    padding: 40px 20px 24px;
  }
  .footer-bottom {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>

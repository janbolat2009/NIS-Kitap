<template>
  <header class="apple-navbar" :class="{ 'scrolled': isScrolled, 'menu-open': isMenuOpen }">
    <div class="navbar-container">
      <!-- Logo -->
      <div class="navbar-brand" @click="handleLogoClick">
        <img src="@/img/Logotype.svg" alt="NIS Kitap Logo" class="brand-logo" />
        <div class="brand-badge">{{ t('nav.badge') }}</div>
      </div>

      <!-- Desktop Navigation Links -->
      <nav class="desktop-nav">
        <router-link to="/" class="nav-link" active-class="active" exact>{{ t('nav.home') }}</router-link>
        <router-link to="/catalog" class="nav-link" active-class="active">{{ t('nav.catalog') }}</router-link>
        <router-link to="/about-us" class="nav-link" active-class="active">{{ t('nav.about') }}</router-link>
      </nav>

      <!-- Desktop Actions (Hidden on Mobile) -->
      <div class="navbar-actions desktop-actions">
        <!-- Trilingual Switcher (Apple Segmented Pill) -->
        <div class="lang-switcher">
          <button 
            v-for="l in availableLocales" 
            :key="l.code"
            class="lang-btn"
            :class="{ active: currentLocale === l.code }"
            :title="l.name"
            @click="switchLang(l.code)"
          >
            <span class="lang-flag">{{ l.flag }}</span>
            <span class="lang-code">{{ l.label }}</span>
          </button>
        </div>

        <!-- Quick Search Button -->
        <button class="nav-search-btn" @click="$emit('open-search')" :title="t('nav.search')">
          <svg class="search-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <span class="search-text">{{ t('nav.search') }}</span>
          <kbd class="kbd-shortcut">⌘K</kbd>
        </button>

        <!-- Auth / Profile -->
        <div v-if="!isLoggedIn" class="auth-btn-wrapper">
          <button class="nav-register-btn" @click="$emit('open-register')">
            <span>{{ t('nav.login') }}</span>
          </button>
        </div>

        <div v-else class="profile-pill" @click="$emit('open-profile')" :title="t('nav.profile')">
          <div class="profile-avatar-mini">
            <span v-if="!userAvatar">{{ userInitials }}</span>
            <img v-else :src="userAvatar" alt="Avatar" />
          </div>
          <span class="profile-name-mini">{{ userName || t('nav.profile') }}</span>
        </div>
      </div>

      <!-- Mobile Top Bar Controls (Clean & Compact: Search + Burger) -->
      <div class="mobile-top-controls">
        <button class="mobile-icon-btn" @click="$emit('open-search')" :aria-label="t('nav.search')">
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </button>

        <button 
          class="burger-btn" 
          :class="{ 'is-active': isMenuOpen }"
          @click="toggleMobileMenu" 
          :aria-label="isMenuOpen ? 'Close menu' : 'Open menu'"
        >
          <span class="burger-bar top"></span>
          <span class="burger-bar bottom"></span>
        </button>
      </div>
    </div>

    <!-- Apple-style Mobile Dropdown Sheet & Backdrop -->
    <transition name="apple-fade">
      <div v-if="isMenuOpen" class="mobile-backdrop" @click="closeMobileMenu"></div>
    </transition>

    <transition name="apple-slide">
      <div v-if="isMenuOpen" class="mobile-menu-drawer">
        <div class="mobile-menu-inner">
          
          <!-- User Profile or Sign-in Card -->
          <div class="menu-section user-section">
            <div v-if="isLoggedIn" class="mobile-user-card" @click="$emit('open-profile'); closeMobileMenu()">
              <div class="user-card-avatar">
                <span v-if="!userAvatar">{{ userInitials }}</span>
                <img v-else :src="userAvatar" alt="Avatar" />
              </div>
              <div class="user-card-info">
                <span class="user-card-name">{{ userName || t('nav.reader') }}</span>
                <span class="user-card-status">{{ t('nav.myProfile') }} &rarr;</span>
              </div>
            </div>

            <button v-else class="mobile-login-full-btn" @click="$emit('open-register'); closeMobileMenu()">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                <polyline points="10 17 15 12 10 7"></polyline>
                <line x1="15" y1="12" x2="3" y2="12"></line>
              </svg>
              <span>{{ t('nav.openAccount') }}</span>
            </button>
          </div>

          <!-- Language Selector Segmented Control -->
          <div class="menu-section">
            <div class="section-label">{{ currentLocale === 'kz' ? 'Тілді таңдау' : (currentLocale === 'en' ? 'Select Language' : 'Язык интерфейса') }}</div>
            <div class="mobile-lang-segmented">
              <button 
                v-for="l in availableLocales" 
                :key="l.code"
                class="mobile-lang-btn"
                :class="{ active: currentLocale === l.code }"
                @click="switchLang(l.code)"
              >
                <span class="lang-flag">{{ l.flag }}</span>
                <span class="lang-text">{{ l.name }}</span>
              </button>
            </div>
          </div>

          <!-- Navigation Links -->
          <div class="menu-section">
            <div class="section-label">{{ currentLocale === 'kz' ? 'Бөлімдер' : (currentLocale === 'en' ? 'Navigation' : 'Разделы') }}</div>
            <div class="mobile-nav-list">
              <router-link to="/" class="mobile-nav-link" @click="closeMobileMenu">
                <div class="link-left">
                  <span class="link-icon">🏠</span>
                  <span class="link-title">{{ t('nav.home') }}</span>
                </div>
                <span class="link-arrow">&rsaquo;</span>
              </router-link>

              <router-link to="/catalog" class="mobile-nav-link" @click="closeMobileMenu">
                <div class="link-left">
                  <span class="link-icon">📚</span>
                  <span class="link-title">{{ t('nav.catalog') }}</span>
                </div>
                <span class="link-arrow">&rsaquo;</span>
              </router-link>

              <router-link to="/about-us" class="mobile-nav-link" @click="closeMobileMenu">
                <div class="link-left">
                  <span class="link-icon">✨</span>
                  <span class="link-title">{{ t('nav.about') }}</span>
                </div>
                <span class="link-arrow">&rsaquo;</span>
              </router-link>
            </div>
          </div>

          <!-- AI Search Quick Button -->
          <div class="menu-section">
            <button class="mobile-ai-search-card" @click="$emit('open-search'); closeMobileMenu()">
              <div class="ai-sparkle-badge">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path>
                </svg>
              </div>
              <div class="ai-card-content">
                <span class="ai-card-title">{{ t('nav.searchAi') }}</span>
                <span class="ai-card-sub">Gemini 2.5 Flash</span>
              </div>
              <span class="ai-card-cta">&rarr;</span>
            </button>
          </div>

        </div>
      </div>
    </transition>
  </header>
</template>

<script>
import { currentLocale, setLocale, t } from '@/i18n';

export default {
  name: 'AppleNavbar',
  props: {
    isLoggedIn: {
      type: Boolean,
      default: false,
    },
    userName: {
      type: String,
      default: '',
    },
    userAvatar: {
      type: String,
      default: '',
    },
  },
  emits: ['open-register', 'open-profile', 'open-search'],
  setup() {
    return {
      currentLocale,
      t,
    };
  },
  data() {
    return {
      isScrolled: false,
      isMenuOpen: false,
      availableLocales: [
        { code: 'kz', label: 'KZ', flag: '🇰🇿', name: 'Қазақша' },
        { code: 'ru', label: 'RU', flag: '🇷🇺', name: 'Русский' },
        { code: 'en', label: 'EN', flag: '🇬🇧', name: 'English' },
      ],
    };
  },
  computed: {
    userInitials() {
      if (!this.userName) return 'U';
      const parts = this.userName.trim().split(' ');
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return this.userName.slice(0, 2).toUpperCase();
    },
  },
  mounted() {
    window.addEventListener('scroll', this.handleScroll, { passive: true });
    window.addEventListener('keydown', this.handleKeydown);
  },
  beforeUnmount() {
    window.removeEventListener('scroll', this.handleScroll);
    window.removeEventListener('keydown', this.handleKeydown);
  },
  methods: {
    switchLang(code) {
      setLocale(code);
    },
    handleScroll() {
      this.isScrolled = window.scrollY > 15;
    },
    handleKeydown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        this.$emit('open-search');
      }
    },
    handleLogoClick() {
      this.closeMobileMenu();
      this.$router.push('/');
    },
    toggleMobileMenu() {
      this.isMenuOpen = !this.isMenuOpen;
      if (this.isMenuOpen) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    },
    closeMobileMenu() {
      this.isMenuOpen = false;
      document.body.style.overflow = '';
    },
  },
};
</script>

<style scoped>
.apple-navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  padding: 12px 24px;
  background: rgba(6, 11, 20, 0.45);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.apple-navbar.scrolled {
  background: rgba(6, 11, 20, 0.88);
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.45);
  padding: 9px 24px;
}

.navbar-container {
  max-width: 1320px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

/* Brand */
.navbar-brand {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: transform 0.25s ease;
  user-select: none;
}
.navbar-brand:hover {
  transform: scale(1.02);
}
.brand-logo {
  height: 38px;
  width: auto;
  filter: drop-shadow(0 2px 8px rgba(0, 113, 227, 0.4));
}
.brand-badge {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.05em;
  padding: 2px 7px;
  border-radius: 9999px;
  background: linear-gradient(135deg, rgba(0, 113, 227, 0.3), rgba(129, 140, 248, 0.3));
  border: 1px solid rgba(56, 189, 248, 0.4);
  color: #38BDF8;
}

/* Desktop Nav */
.desktop-nav {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.05);
  padding: 4px 6px;
  border-radius: 9999px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.nav-link {
  color: rgba(255, 255, 255, 0.72);
  text-decoration: none;
  font-size: 14.5px;
  font-weight: 500;
  padding: 8px 18px;
  border-radius: 9999px;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.nav-link:hover {
  color: #FFFFFF;
  background: rgba(255, 255, 255, 0.08);
}

.nav-link.active {
  color: #FFFFFF;
  background: rgba(255, 255, 255, 0.16);
  font-weight: 600;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
}

/* Desktop Actions */
.navbar-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* Language Switcher */
.lang-switcher {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 9999px;
  padding: 2px;
  gap: 2px;
}

.lang-btn {
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.65);
  padding: 5px 9px;
  border-radius: 9999px;
  font-family: inherit;
  font-size: 11.5px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.lang-btn:hover {
  color: #FFFFFF;
  background: rgba(255, 255, 255, 0.08);
}

.lang-btn.active {
  background: #0071E3;
  color: #FFFFFF;
  box-shadow: 0 2px 8px rgba(0, 113, 227, 0.4);
}

.lang-flag {
  font-size: 13px;
  line-height: 1;
}

.nav-search-btn {
  display: flex;
  align-items: center;
  gap: 9px;
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.75);
  padding: 8px 14px;
  border-radius: 9999px;
  font-family: inherit;
  font-size: 13.5px;
  cursor: pointer;
  transition: all 0.25s ease;
}
.nav-search-btn:hover {
  background: rgba(255, 255, 255, 0.13);
  border-color: rgba(255, 255, 255, 0.25);
  color: #FFFFFF;
  transform: translateY(-1px);
}
.search-svg {
  stroke: #38BDF8;
}
.kbd-shortcut {
  font-size: 11px;
  font-family: inherit;
  background: rgba(255, 255, 255, 0.12);
  padding: 2px 6px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.6);
}

.nav-register-btn {
  background: linear-gradient(135deg, #0071E3 0%, #0056B3 100%);
  color: #FFFFFF;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 9999px;
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  padding: 8px 20px;
  cursor: pointer;
  transition: all 0.25s ease;
  box-shadow: 0 4px 14px rgba(0, 113, 227, 0.35);
}
.nav-register-btn:hover {
  background: linear-gradient(135deg, #007BF5 0%, #0060C9 100%);
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(0, 113, 227, 0.5);
}
.nav-register-btn:active {
  transform: scale(0.96);
}

/* Profile Pill */
.profile-pill {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 9999px;
  padding: 4px 14px 4px 5px;
  cursor: pointer;
  transition: all 0.25s ease;
}
.profile-pill:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(56, 189, 248, 0.4);
}
.profile-avatar-mini {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: linear-gradient(135deg, #0071E3, #818CF8);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  color: #FFFFFF;
  overflow: hidden;
}
.profile-avatar-mini img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.profile-name-mini {
  font-size: 13.5px;
  font-weight: 500;
  color: #FFFFFF;
  max-width: 110px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Mobile Top Controls */
.mobile-top-controls {
  display: none;
  align-items: center;
  gap: 10px;
}

.mobile-icon-btn {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #38BDF8;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}
.mobile-icon-btn:active {
  transform: scale(0.92);
  background: rgba(255, 255, 255, 0.15);
}

/* Apple Animated Burger Button */
.burger-btn {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  width: 38px;
  height: 38px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 0;
  transition: all 0.25s ease;
}
.burger-btn:active {
  transform: scale(0.92);
}
.burger-bar {
  display: block;
  width: 17px;
  height: 2px;
  background-color: #FFFFFF;
  border-radius: 2px;
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease;
  transform-origin: center;
}
.burger-btn.is-active .burger-bar.top {
  transform: translateY(3.5px) rotate(45deg);
}
.burger-btn.is-active .burger-bar.bottom {
  transform: translateY(-3.5px) rotate(-45deg);
}

/* Mobile Backdrop */
.mobile-backdrop {
  position: fixed;
  top: 62px;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  z-index: 998;
}

/* Mobile Menu Drawer */
.mobile-menu-drawer {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  max-height: calc(100vh - 65px);
  overflow-y: auto;
  background: rgba(8, 14, 26, 0.96);
  backdrop-filter: blur(32px) saturate(190%);
  -webkit-backdrop-filter: blur(32px) saturate(190%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
  z-index: 999;
}

.mobile-menu-inner {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 500px;
  margin: 0 auto;
}

.menu-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.section-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgba(255, 255, 255, 0.45);
  margin-left: 4px;
}

/* Mobile User Card */
.mobile-user-card {
  display: flex;
  align-items: center;
  gap: 14px;
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  padding: 12px 16px;
  cursor: pointer;
  transition: all 0.2s ease;
}
.mobile-user-card:active {
  background: rgba(255, 255, 255, 0.12);
  transform: scale(0.98);
}
.user-card-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg, #0071E3, #818CF8);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  font-weight: 700;
  color: #FFFFFF;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 113, 227, 0.35);
}
.user-card-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.user-card-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.user-card-name {
  font-size: 16px;
  font-weight: 600;
  color: #FFFFFF;
}
.user-card-status {
  font-size: 13px;
  color: #38BDF8;
  font-weight: 500;
}

.mobile-login-full-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background: linear-gradient(135deg, #0071E3 0%, #0056B3 100%);
  color: #FFFFFF;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  padding: 14px 20px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 18px rgba(0, 113, 227, 0.4);
  transition: all 0.2s ease;
}
.mobile-login-full-btn:active {
  transform: scale(0.98);
  box-shadow: 0 2px 10px rgba(0, 113, 227, 0.3);
}

/* Mobile Language Segmented */
.mobile-lang-segmented {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 4px;
  border-radius: 14px;
}
.mobile-lang-btn {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: transparent;
  border: none;
  border-radius: 10px;
  padding: 10px 4px;
  color: rgba(255, 255, 255, 0.7);
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}
.mobile-lang-btn.active {
  background: #0071E3;
  color: #FFFFFF;
  font-weight: 600;
  box-shadow: 0 2px 10px rgba(0, 113, 227, 0.4);
}
.mobile-lang-btn:active {
  transform: scale(0.96);
}

/* Navigation List */
.mobile-nav-list {
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  overflow: hidden;
}
.mobile-nav-link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  color: rgba(255, 255, 255, 0.9);
  text-decoration: none;
  font-size: 15.5px;
  font-weight: 500;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  transition: all 0.2s ease;
}
.mobile-nav-link:last-child {
  border-bottom: none;
}
.mobile-nav-link:active,
.mobile-nav-link.router-link-exact-active {
  background: rgba(0, 113, 227, 0.15);
  color: #38BDF8;
}
.link-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.link-icon {
  font-size: 18px;
}
.link-arrow {
  font-size: 20px;
  color: rgba(255, 255, 255, 0.3);
}

/* AI Search Card in Menu */
.mobile-ai-search-card {
  display: flex;
  align-items: center;
  gap: 12px;
  background: linear-gradient(135deg, rgba(0, 113, 227, 0.15) 0%, rgba(129, 140, 248, 0.15) 100%);
  border: 1px solid rgba(56, 189, 248, 0.35);
  border-radius: 16px;
  padding: 14px 16px;
  cursor: pointer;
  text-align: left;
  transition: all 0.2s ease;
}
.mobile-ai-search-card:active {
  transform: scale(0.98);
  background: linear-gradient(135deg, rgba(0, 113, 227, 0.25) 0%, rgba(129, 140, 248, 0.25) 100%);
}
.ai-sparkle-badge {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  background: linear-gradient(135deg, #0071E3, #818CF8);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #FFFFFF;
  flex-shrink: 0;
}
.ai-card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.ai-card-title {
  font-size: 15px;
  font-weight: 600;
  color: #FFFFFF;
}
.ai-card-sub {
  font-size: 12px;
  color: #38BDF8;
  font-weight: 500;
}
.ai-card-cta {
  font-size: 18px;
  color: #38BDF8;
  font-weight: 600;
}

/* Transitions */
.apple-slide-enter-active,
.apple-slide-leave-active {
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}
.apple-slide-enter-from,
.apple-slide-leave-to {
  opacity: 0;
  transform: translateY(-12px);
}

.apple-fade-enter-active,
.apple-fade-leave-active {
  transition: opacity 0.3s ease;
}
.apple-fade-enter-from,
.apple-fade-leave-to {
  opacity: 0;
}

/* Media Queries */
@media (max-width: 960px) {
  .desktop-nav,
  .desktop-actions {
    display: none !important;
  }
  .mobile-top-controls {
    display: flex;
  }
  .apple-navbar {
    padding: 10px 16px;
  }
  .brand-logo {
    height: 32px;
  }
}
</style>


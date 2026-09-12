<template>
  <header class="apple-navbar" :class="{ 'scrolled': isScrolled }">
    <div class="navbar-container">
      <!-- Logo -->
      <div class="navbar-brand" @click="$router.push('/')">
        <img src="@/img/Logotype.svg" alt="NIS Kitap Logo" class="brand-logo" />
        <div class="brand-badge">{{ t('nav.badge') }}</div>
      </div>

      <!-- Desktop Navigation -->
      <nav class="desktop-nav">
        <router-link to="/" class="nav-link" active-class="active" exact>{{ t('nav.home') }}</router-link>
        <router-link to="/catalog" class="nav-link" active-class="active">{{ t('nav.catalog') }}</router-link>
        <router-link to="/about-us" class="nav-link" active-class="active">{{ t('nav.about') }}</router-link>
      </nav>

      <!-- Right Action Controls -->
      <div class="navbar-actions">
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

        <!-- Mobile Burger Button -->
        <button class="burger-btn" @click="toggleMobileMenu" :aria-label="isMenuOpen ? 'Close menu' : 'Open menu'">
          <div class="burger-lines" :class="{ 'open': isMenuOpen }">
            <span></span>
            <span></span>
          </div>
        </button>
      </div>
    </div>

    <!-- Mobile Slide-Down Sheet -->
    <transition name="apple-sheet">
      <div v-if="isMenuOpen" class="mobile-sheet">
        <div class="mobile-sheet-content">
          <!-- Mobile Language Selector -->
          <div class="mobile-lang-row">
            <button 
              v-for="l in availableLocales" 
              :key="l.code"
              class="mobile-lang-chip"
              :class="{ active: currentLocale === l.code }"
              @click="switchLang(l.code)"
            >
              <span>{{ l.flag }}</span>
              <span>{{ l.name }}</span>
            </button>
          </div>

          <div class="mobile-divider"></div>

          <router-link to="/" class="mobile-nav-item" @click="closeMobileMenu">
            <span class="item-icon">🏠</span>
            <span class="item-title">{{ t('nav.home') }}</span>
          </router-link>
          <router-link to="/catalog" class="mobile-nav-item" @click="closeMobileMenu">
            <span class="item-icon">📚</span>
            <span class="item-title">{{ t('nav.catalog') }}</span>
          </router-link>
          <router-link to="/about-us" class="mobile-nav-item" @click="closeMobileMenu">
            <span class="item-icon">✨</span>
            <span class="item-title">{{ t('nav.about') }}</span>
          </router-link>

          <div class="mobile-divider"></div>

          <div class="mobile-quick-actions">
            <button class="mobile-search-btn" @click="$emit('open-search'); closeMobileMenu()">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <span>{{ t('nav.searchAi') }}</span>
            </button>

            <button v-if="!isLoggedIn" class="mobile-auth-btn" @click="$emit('open-register'); closeMobileMenu()">
              {{ t('nav.openAccount') }}
            </button>
            <button v-else class="mobile-profile-btn" @click="$emit('open-profile'); closeMobileMenu()">
              👤 {{ t('nav.myProfile') }} ({{ userName || t('nav.reader') }})
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
    toggleMobileMenu() {
      this.isMenuOpen = !this.isMenuOpen;
    },
    closeMobileMenu() {
      this.isMenuOpen = false;
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
  background: rgba(6, 11, 20, 0.4);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

.apple-navbar.scrolled {
  background: rgba(6, 11, 20, 0.82);
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

/* Actions */
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

/* Burger Button */
.burger-btn {
  display: none;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  align-items: center;
  justify-content: center;
  padding: 0;
  transition: all 0.25s ease;
}
.burger-btn:hover {
  background: rgba(255, 255, 255, 0.15);
}
.burger-lines {
  width: 18px;
  height: 12px;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.burger-lines span {
  display: block;
  height: 2px;
  width: 100%;
  background: #FFFFFF;
  border-radius: 2px;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.burger-lines.open span:first-child {
  transform: translateY(5px) rotate(45deg);
}
.burger-lines.open span:last-child {
  transform: translateY(-5px) rotate(-45deg);
}

/* Mobile Sheet */
.mobile-sheet {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: rgba(7, 13, 24, 0.94);
  backdrop-filter: blur(28px) saturate(190%);
  -webkit-backdrop-filter: blur(28px) saturate(190%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
  padding: 18px 24px 28px;
}

.mobile-sheet-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.mobile-lang-row {
  display: flex;
  gap: 8px;
  justify-content: center;
  margin-bottom: 4px;
}

.mobile-lang-chip {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #FFFFFF;
  padding: 8px;
  border-radius: 12px;
  font-size: 13px;
  font-family: inherit;
  font-weight: 500;
  cursor: pointer;
}
.mobile-lang-chip.active {
  background: #0071E3;
  border-color: rgba(56, 189, 248, 0.4);
  font-weight: 600;
}

.mobile-nav-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 16px;
  border-radius: 14px;
  color: #FFFFFF;
  text-decoration: none;
  font-size: 16px;
  font-weight: 500;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  transition: all 0.2s ease;
}
.mobile-nav-item:hover, .mobile-nav-item.router-link-exact-active {
  background: rgba(0, 113, 227, 0.15);
  border-color: rgba(56, 189, 248, 0.3);
}
.item-icon {
  font-size: 20px;
}

.mobile-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.08);
  margin: 8px 0;
}

.mobile-quick-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.mobile-search-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #FFFFFF;
  padding: 12px;
  border-radius: 12px;
  font-size: 15px;
  font-family: inherit;
  font-weight: 500;
  cursor: pointer;
}

.mobile-auth-btn {
  background: linear-gradient(135deg, #0071E3 0%, #0056B3 100%);
  color: #FFFFFF;
  border: none;
  padding: 13px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
}

.mobile-profile-btn {
  background: rgba(255, 255, 255, 0.09);
  border: 1px solid rgba(56, 189, 248, 0.3);
  color: #38BDF8;
  padding: 13px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
}

/* Animations */
.apple-sheet-enter-active,
.apple-sheet-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.apple-sheet-enter-from,
.apple-sheet-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Media Queries */
@media (max-width: 960px) {
  .desktop-nav {
    display: none;
  }
  .nav-search-btn .search-text,
  .nav-search-btn .kbd-shortcut {
    display: none;
  }
  .burger-btn {
    display: flex;
  }
  .profile-name-mini {
    display: none;
  }
}
</style>

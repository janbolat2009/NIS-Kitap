<template>
  <div class="apple-about-page">
    <!-- Navbar -->
    <AppleNavbar 
      :is-logged-in="isLoggedIn"
      :user-name="userName"
      :user-avatar="userAvatar"
      @open-register="showRegister = true"
      @open-profile="showProfile = true"
    />

    <main class="about-main">
      <div class="about-container">
        <!-- Hero Header -->
        <div class="about-hero-section">
          <div class="hero-badge">
            <span>{{ t('aboutPage.badge') }}</span>
          </div>
          <h1 class="about-main-title">
            {{ t('aboutPage.titlePart1') }} <br />
            <span class="gradient-text">{{ t('aboutPage.titlePart2') }}</span>
          </h1>
          <p class="about-lead">
            {{ t('aboutPage.lead') }}
          </p>
        </div>

        <!-- Visual Story Card -->
        <div class="story-glass-card glass-panel">
          <div class="story-text">
            <h2 class="story-title">{{ t('aboutPage.missionTitle') }}</h2>
            <p class="story-p">
              {{ t('aboutPage.missionP1') }}
            </p>
            <p class="story-p">
              {{ t('aboutPage.missionP2') }}
            </p>
            <div class="story-actions">
              <router-link to="/catalog" class="apple-btn-primary">
                <span>{{ t('aboutPage.exploreBtn') }}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </router-link>
            </div>
          </div>
          <div class="story-image-side">
            <img src="@/img/publicLibrary.png" alt="Library" class="library-art-img" />
          </div>
        </div>

        <!-- Value Cards Grid -->
        <div class="values-section">
          <h2 class="section-title text-center">{{ t('aboutPage.whyTitle') }}</h2>
          <p class="section-subtitle text-center">
            {{ t('aboutPage.whySubtitle') }}
          </p>

          <div class="values-grid">
            <div class="value-card glass-card">
              <div class="value-icon">🤖</div>
              <h3 class="value-title">{{ t('aboutPage.valAiTitle') }}</h3>
              <p class="value-desc">
                {{ t('aboutPage.valAiDesc') }}
              </p>
            </div>

            <div class="value-card glass-card">
              <div class="value-icon">⚡️</div>
              <h3 class="value-title">{{ t('aboutPage.valBookingTitle') }}</h3>
              <p class="value-desc">
                {{ t('aboutPage.valBookingDesc') }}
              </p>
            </div>

            <div class="value-card glass-card">
              <div class="value-icon">🌍</div>
              <h3 class="value-title">{{ t('aboutPage.valTrilingualTitle') }}</h3>
              <p class="value-desc">
                {{ t('aboutPage.valTrilingualDesc') }}
              </p>
            </div>

            <div class="value-card glass-card">
              <div class="value-icon">📱</div>
              <h3 class="value-title">{{ t('aboutPage.valAppleTitle') }}</h3>
              <p class="value-desc">
                {{ t('aboutPage.valAppleDesc') }}
              </p>
            </div>
          </div>
        </div>

        <!-- Library Stats Bar -->
        <div class="stats-glass-bar glass-panel">
          <div class="stat-cell">
            <span class="stat-number">{{ t('hero.booksCount') }}</span>
            <span class="stat-label">{{ t('hero.inCatalog') }}</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-cell">
            <span class="stat-number">7</span>
            <span class="stat-label">{{ t('aboutTeaser.statGenres') }}</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-cell">
            <span class="stat-number">3</span>
            <span class="stat-label">{{ t('aboutTeaser.statLanguages') }}</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-cell">
            <span class="stat-number">100%</span>
            <span class="stat-label">{{ t('aboutPage.statConvenience') }}</span>
          </div>
        </div>
      </div>
    </main>

    <!-- Modals -->
    <div v-if="showRegister" class="apple-modal-overlay" @click="showRegister = false">
      <div class="modal-wrapper" @click.stop>
        <button class="modal-close-icon" @click="showRegister = false">✕</button>
        <Register @registered="onRegistered" @loggedIn="onLoggedIn" />
      </div>
    </div>

    <div v-if="showProfile" class="apple-modal-overlay" @click="showProfile = false">
      <div class="modal-wrapper" @click.stop>
        <Profile 
          :email="userEmail" 
          :name="userName" 
          @back="showProfile = false" 
          @updated="onProfileUpdated"
          @loggedOut="onLoggedOut"
        />
      </div>
    </div>

    <AppleFooter />
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import AppleNavbar from '@/components/AppleNavbar.vue';
import AppleFooter from '@/components/AppleFooter.vue';
import Register from '@/components/Register.vue';
import Profile from '@/components/Profile.vue';
import { t } from '@/i18n';

export default {
  name: 'AboutUs',
  components: {
    AppleNavbar,
    AppleFooter,
    Register,
    Profile,
  },
  setup() {
    const isLoggedIn = ref(false);
    const userEmail = ref('');
    const userName = ref('');
    const userAvatar = ref('');

    const showRegister = ref(false);
    const showProfile = ref(false);

    onMounted(() => {
      const local = localStorage.getItem('user');
      if (local) {
        try {
          const parsed = JSON.parse(local);
          isLoggedIn.value = true;
          userEmail.value = parsed.email || '';
          userName.value = parsed.name || '';
          userAvatar.value = parsed.avatar || '';
        } catch {}
      }
    });

    const onRegistered = (payload) => {
      userEmail.value = payload.email;
      userName.value = payload.name;
      userAvatar.value = payload.avatar || '';
      isLoggedIn.value = true;
      showRegister.value = false;
      showProfile.value = true;
      localStorage.setItem('user', JSON.stringify({ email: payload.email, name: payload.name, avatar: userAvatar.value }));
      localStorage.setItem('isLoggedIn', 'true');
    };

    const onLoggedIn = (payload) => {
      userEmail.value = payload.email;
      userName.value = payload.name;
      userAvatar.value = payload.avatar || '';
      isLoggedIn.value = true;
      showRegister.value = false;
      localStorage.setItem('user', JSON.stringify({ email: payload.email, name: payload.name, avatar: userAvatar.value }));
      localStorage.setItem('isLoggedIn', 'true');
    };

    const onProfileUpdated = (data) => {
      if (data.name) userName.value = data.name;
      if (data.avatar) userAvatar.value = data.avatar;
    };

    const onLoggedOut = () => {
      isLoggedIn.value = false;
      userEmail.value = '';
      userName.value = '';
      userAvatar.value = '';
    };

    return {
      isLoggedIn,
      userEmail,
      userName,
      userAvatar,
      showRegister,
      showProfile,
      onRegistered,
      onLoggedIn,
      onProfileUpdated,
      onLoggedOut,
      t,
    };
  },
};
</script>

<style scoped>
.apple-about-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.about-main {
  flex: 1;
  padding: 100px 0 90px;
}

.about-container {
  max-width: 1240px;
  margin: 0 auto;
  padding: 0 24px;
}

/* Hero */
.about-hero-section {
  text-align: center;
  max-width: 800px;
  margin: 0 auto 60px;
}

.hero-badge {
  display: inline-flex;
  padding: 5px 14px;
  border-radius: 9999px;
  background: rgba(0, 113, 227, 0.14);
  border: 1px solid rgba(56, 189, 248, 0.3);
  color: #38BDF8;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 20px;
}

.about-main-title {
  font-size: 48px;
  font-weight: 800;
  line-height: 1.15;
  letter-spacing: -0.025em;
  margin: 0 0 20px;
  color: #FFFFFF;
}

.gradient-text {
  background: linear-gradient(135deg, #FFFFFF 20%, #38BDF8 60%, #818CF8 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.about-lead {
  font-size: 18px;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
}

/* Story Card */
.story-glass-card {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  align-items: center;
  gap: 50px;
  padding: 48px;
  border-radius: 32px;
  margin-bottom: 80px;
}

.story-title {
  font-size: 32px;
  font-weight: 700;
  margin: 0 0 18px;
  color: #FFFFFF;
}

.story-p {
  font-size: 16px;
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.75);
  margin: 0 0 16px;
}

.story-actions {
  margin-top: 24px;
}

.story-image-side {
  display: flex;
  justify-content: center;
}
.library-art-img {
  max-width: 100%;
  height: auto;
  border-radius: 20px;
  filter: drop-shadow(0 15px 30px rgba(0, 0, 0, 0.4));
}

/* Values */
.values-section {
  margin-bottom: 80px;
}

.text-center {
  text-align: center;
}

.section-title {
  font-size: 32px;
  font-weight: 700;
  color: #FFFFFF;
  margin: 0 0 10px;
}

.section-subtitle {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.6);
  margin: 0 auto 40px;
  max-width: 600px;
}

.values-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 24px;
}

.value-card {
  padding: 30px 24px;
  border-radius: 22px;
  display: flex;
  flex-direction: column;
}

.value-icon {
  font-size: 36px;
  margin-bottom: 16px;
}

.value-title {
  font-size: 18px;
  font-weight: 700;
  color: #FFFFFF;
  margin: 0 0 10px;
}

.value-desc {
  font-size: 14px;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.65);
  margin: 0;
}

/* Stats */
.stats-glass-bar {
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 32px 24px;
  border-radius: 24px;
  flex-wrap: wrap;
  gap: 20px;
}

.stat-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.stat-number {
  font-size: 36px;
  font-weight: 800;
  color: #38BDF8;
  letter-spacing: -0.02em;
}

.stat-label {
  font-size: 13.5px;
  color: rgba(255, 255, 255, 0.65);
}

.stat-divider {
  width: 1px;
  height: 40px;
  background: rgba(255, 255, 255, 0.12);
}

/* Modals */
.apple-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
.modal-wrapper {
  position: relative;
  max-width: 100%;
}
.modal-close-icon {
  position: absolute;
  top: 14px;
  right: 14px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.14);
  color: rgba(255, 255, 255, 0.7);
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  z-index: 10;
}

@media (max-width: 900px) {
  .story-glass-card {
    grid-template-columns: 1fr;
    padding: 32px 24px;
  }
  .about-main-title {
    font-size: 36px;
  }
  .stat-divider {
    display: none;
  }
}
</style>
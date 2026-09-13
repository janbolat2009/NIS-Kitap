<template>
  <div class="apple-profile-modal">
    <!-- Header -->
    <div class="profile-header">
      <div class="profile-header-main">
        <h2 class="profile-title">{{ t('profile.title') }}</h2>
        <span class="user-role-badge">{{ t('profile.badge') }}</span>
      </div>
      <button class="profile-close-btn" @click="$emit('back')" aria-label="Close">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>

    <!-- Profile Nav Segmented Tabs -->
    <div class="profile-tabs">
      <button 
        class="tab-btn" 
        :class="{ active: currentTab === 'info' }"
        @click="currentTab = 'info'"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
        <span>{{ t('profile.tabProfile') }}</span>
      </button>
      <button 
        class="tab-btn" 
        :class="{ active: currentTab === 'reservations' }"
        @click="currentTab = 'reservations'"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
        </svg>
        <span>{{ t('profile.tabBooks') }}</span>
        <span v-if="reservations.length" class="badge-counter">{{ reservations.length }}</span>
      </button>
    </div>

    <!-- Alert / Toast -->
    <div v-if="statusMsg" class="apple-status-toast" :class="statusType">
      <span>{{ statusMsg }}</span>
    </div>

    <!-- Tab 1: Profile Info -->
    <div v-if="currentTab === 'info'" class="profile-content">
      <!-- Avatar Section -->
      <div class="avatar-section">
        <div class="avatar-circle" @click="triggerFileInput">
          <img v-if="avatarUrl" :src="avatarUrl" alt="Avatar" class="avatar-img" />
          <span v-else class="avatar-initials">{{ initials }}</span>
          <div class="avatar-hover-overlay">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
              <circle cx="12" cy="13" r="4"></circle>
            </svg>
          </div>
        </div>
        <input type="file" ref="fileInput" @change="onAvatarFileChange" accept="image/*" class="hidden-input" />
        <p class="avatar-hint">{{ t('profile.changePhotoHint') }}</p>
      </div>

      <!-- Form Details -->
      <div class="profile-fields">
        <div class="field-item">
          <label>{{ t('profile.nameLabel') }}</label>
          <div class="input-wrapper">
            <input 
              v-model="userName" 
              type="text" 
              class="apple-input" 
              :placeholder="t('auth.namePlaceholder')"
            />
          </div>
        </div>

        <div class="field-item">
          <label>{{ t('profile.emailLabel') }}</label>
          <div class="input-wrapper">
            <input 
              :value="email || t('nav.reader')" 
              type="email" 
              disabled 
              class="apple-input disabled"
            />
          </div>
        </div>

        <div class="field-item">
          <label>{{ t('profile.passLabel') }}</label>
          <div class="input-wrapper">
            <input 
              v-model="newPassword" 
              type="password" 
              :placeholder="t('profile.passPlaceholder')" 
              class="apple-input"
            />
          </div>
        </div>
      </div>

      <div class="profile-actions-row">
        <button class="apple-save-btn" @click="saveProfile">
          {{ t('profile.saveBtn') }}
        </button>
        <button class="apple-logout-btn" @click="logout">
          {{ t('profile.logoutBtn') }}
        </button>
      </div>
    </div>

    <!-- Tab 2: Reservations -->
    <div v-else class="reservations-content">
      <div v-if="reservations.length === 0" class="empty-reservations">
        <div class="empty-svg-wrapper">
          <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
          </svg>
        </div>
        <h3>{{ t('profile.emptyReservationsTitle') }}</h3>
        <p>{{ t('profile.emptyReservationsDesc') }}</p>
        <button class="go-catalog-btn" @click="$router.push('/catalog'); $emit('back')">
          {{ t('profile.goCatalogBtn') }}
        </button>
      </div>

      <div v-else class="reservations-list">
        <div v-for="res in reservations" :key="res.id" class="res-card">
          <div class="res-card-left">
            <div class="res-book-spine"></div>
            <div>
              <h4 class="res-title">{{ res.title }}</h4>
              <p class="res-author">{{ res.author }} • {{ res.genre }}</p>
              <div class="res-date-badge">
                <span>{{ t('profile.dueDateBadge') }} <b>{{ formatDate(res.dueDate) }}</b></span>
              </div>
            </div>
          </div>
          <div class="res-card-right">
            <button class="return-btn" @click="cancelRes(res.id)" :title="t('profile.returnBookBtn')">
              {{ t('profile.returnBookBtn') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { getAuth, updatePassword, updateProfile, signOut } from 'firebase/auth';
import { getUserReservations, cancelReservation } from '@/services/bookService';
import { t, currentLocale } from '@/i18n';

export default {
  name: 'Profile',
  props: {
    email: {
      type: String,
      default: '',
    },
    name: {
      type: String,
      default: '',
    },
  },
  emits: ['back', 'updated', 'loggedOut'],
  data() {
    return {
      currentTab: 'info',
      userName: this.name || '',
      newPassword: '',
      avatarUrl: '',
      statusMsg: '',
      statusType: '',
      reservations: [],
    };
  },
  computed: {
    initials() {
      if (!this.userName) return 'U';
      const parts = this.userName.trim().split(' ');
      if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
      return this.userName.slice(0, 2).toUpperCase();
    },
  },
  watch: {
    name(newVal) {
      if (newVal) this.userName = newVal;
    },
  },
  mounted() {
    this.loadUserData();
    this.refreshReservations();
  },
  methods: {
    t,
    loadUserData() {
      try {
        const auth = getAuth();
        if (auth?.currentUser) {
          if (auth.currentUser.displayName && !this.userName) this.userName = auth.currentUser.displayName;
          if (auth.currentUser.photoURL && !this.avatarUrl) this.avatarUrl = auth.currentUser.photoURL;
        }
      } catch {
        // ignore
      }

      const local = localStorage.getItem('user');
      if (local) {
        try {
          const parsed = JSON.parse(local);
          if (parsed.name && !this.userName) this.userName = parsed.name;
          if (parsed.avatar) this.avatarUrl = parsed.avatar;
        } catch {
          // ignore
        }
      }
    },
    refreshReservations() {
      this.reservations = getUserReservations();
    },
    formatDate(dateStr) {
      if (!dateStr) return '14 d';
      const d = new Date(dateStr);
      const loc = currentLocale.value === 'kz' ? 'kk-KZ' : currentLocale.value === 'en' ? 'en-US' : 'ru-RU';
      return d.toLocaleDateString(loc, { day: 'numeric', month: 'short', year: 'numeric' });
    },
    triggerFileInput() {
      this.$refs.fileInput?.click();
    },
    onAvatarFileChange(e) {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        this.avatarUrl = event.target.result;
        this.saveAvatarLocal(this.avatarUrl);
        this.showToast(t('profile.avatarToast'), 'success');
      };
      reader.readAsDataURL(file);
    },
    saveAvatarLocal(url) {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      user.avatar = url;
      localStorage.setItem('user', JSON.stringify(user));
    },
    async saveProfile() {
      this.statusMsg = '';
      try {
        const auth = getAuth();
        if (auth.currentUser) {
          if (this.userName) {
            await updateProfile(auth.currentUser, { displayName: this.userName });
          }
          if (this.newPassword && this.newPassword.length >= 6) {
            await updatePassword(auth.currentUser, this.newPassword);
          }
        }
      } catch (err) {
        console.warn('Firebase profile update warning:', err.message);
      }

      // Сохранение в localStorage
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      user.name = this.userName;
      localStorage.setItem('user', JSON.stringify(user));

      this.showToast(t('profile.savedToast'), 'success');
      this.$emit('updated', { name: this.userName, avatar: this.avatarUrl });
    },
    cancelRes(id) {
      cancelReservation(id);
      this.refreshReservations();
      this.showToast(t('profile.returnedToast'), 'success');
    },
    async logout() {
      try {
        const auth = getAuth();
        await signOut(auth);
      } catch {
        // ignore
      }
      localStorage.removeItem('user');
      localStorage.removeItem('isLoggedIn');
      this.$emit('loggedOut');
      this.$emit('back');
      window.location.reload();
    },
    showToast(msg, type = 'success') {
      this.statusMsg = msg;
      this.statusType = type;
      setTimeout(() => {
        this.statusMsg = '';
      }, 4000);
    },
  },
};
</script>

<style scoped>
.apple-profile-modal {
  width: 100%;
  max-width: 500px;
  background: rgba(10, 17, 30, 0.96);
  backdrop-filter: blur(32px) saturate(190%);
  -webkit-backdrop-filter: blur(32px) saturate(190%);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 24px;
  padding: 24px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
  color: #FFFFFF;
}

.profile-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
}

.profile-header-main {
  display: flex;
  align-items: center;
  gap: 10px;
}

.profile-title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.user-role-badge {
  font-size: 11px;
  font-weight: 600;
  background: rgba(0, 113, 227, 0.18);
  border: 1px solid rgba(56, 189, 248, 0.35);
  color: #38BDF8;
  padding: 2px 9px;
  border-radius: 9999px;
}

.profile-close-btn {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.7);
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}
.profile-close-btn:hover {
  background: rgba(255, 255, 255, 0.16);
  color: #FFFFFF;
}

/* Tabs */
.profile-tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.09);
  border-radius: 14px;
  padding: 4px;
  margin-bottom: 20px;
}

.tab-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.65);
  padding: 9px 12px;
  border-radius: 10px;
  font-family: inherit;
  font-size: 13.5px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}
.tab-btn.active {
  background: #0071E3;
  color: #FFFFFF;
  font-weight: 600;
  box-shadow: 0 2px 10px rgba(0, 113, 227, 0.4);
}

.badge-counter {
  background: #EF4444;
  color: #FFFFFF;
  font-size: 10.5px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 9999px;
}

/* Toast */
.apple-status-toast {
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 13px;
  margin-bottom: 16px;
}
.apple-status-toast.success {
  background: rgba(16, 185, 129, 0.18);
  border: 1px solid rgba(16, 185, 129, 0.35);
  color: #6EE7B7;
}

/* Avatar */
.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
}

.avatar-circle {
  width: 76px;
  height: 76px;
  border-radius: 50%;
  background: linear-gradient(135deg, #0071E3, #818CF8);
  border: 2px solid rgba(255, 255, 255, 0.18);
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  overflow: hidden;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.35);
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-initials {
  font-size: 26px;
  font-weight: 700;
  color: #FFFFFF;
}

.avatar-hover-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease;
  color: #FFFFFF;
}
.avatar-circle:hover .avatar-hover-overlay {
  opacity: 1;
}

.avatar-hint {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
}
.hidden-input {
  display: none;
}

/* Fields */
.profile-fields {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-bottom: 22px;
}

.field-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  text-align: left;
}

.field-item label {
  font-size: 12px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
  letter-spacing: 0.02em;
}

.apple-input {
  width: 100%;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  padding: 11px 14px;
  font-size: 14px;
  color: #FFFFFF;
  font-family: inherit;
  outline: none;
  transition: all 0.2s ease;
}

.apple-input:focus {
  background: rgba(255, 255, 255, 0.09);
  border-color: #38BDF8;
  box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.15);
}

.apple-input.disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.profile-actions-row {
  display: flex;
  gap: 10px;
}

.apple-save-btn {
  flex: 1;
  background: linear-gradient(135deg, #0071E3 0%, #0056B3 100%);
  color: #FFFFFF;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 12px;
  padding: 12px;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 14px rgba(0, 113, 227, 0.35);
}
.apple-save-btn:hover {
  box-shadow: 0 6px 20px rgba(0, 113, 227, 0.5);
  transform: translateY(-1px);
}

.apple-logout-btn {
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #F87171;
  border-radius: 12px;
  padding: 12px 18px;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s ease;
}
.apple-logout-btn:hover {
  background: rgba(239, 68, 68, 0.22);
}

/* Reservations tab empty state */
.empty-reservations {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 32px 16px;
}
.empty-svg-wrapper {
  width: 64px;
  height: 64px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #38BDF8;
  margin-bottom: 14px;
}
.empty-reservations h3 {
  margin: 0 0 6px;
  font-size: 16.5px;
  font-weight: 600;
  color: #FFFFFF;
}
.empty-reservations p {
  font-size: 13.5px;
  color: rgba(255, 255, 255, 0.55);
  max-width: 310px;
  margin: 0 0 18px;
  line-height: 1.45;
}
.go-catalog-btn {
  background: #0071E3;
  color: #FFFFFF;
  border: none;
  padding: 10px 22px;
  border-radius: 9999px;
  font-size: 13.5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}
.go-catalog-btn:hover {
  background: #007BF5;
  box-shadow: 0 4px 14px rgba(0, 113, 227, 0.4);
}

.reservations-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 360px;
  overflow-y: auto;
  padding-right: 4px;
}

.res-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.09);
  border-radius: 14px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.res-card-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.res-book-spine {
  width: 4px;
  height: 44px;
  border-radius: 2px;
  background: linear-gradient(to bottom, #0071E3, #818CF8);
}

.res-title {
  margin: 0 0 3px;
  font-size: 14px;
  font-weight: 600;
  color: #FFFFFF;
}

.res-author {
  margin: 0 0 3px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.55);
}

.res-date-badge {
  font-size: 11.5px;
  color: #38BDF8;
}

.return-btn {
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.85);
  padding: 7px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;
}
.return-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.35);
  color: #FCA5A5;
}
</style>
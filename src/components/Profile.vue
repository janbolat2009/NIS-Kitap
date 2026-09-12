<template>
  <div class="apple-profile-modal">
    <!-- Header -->
    <div class="profile-header">
      <div class="profile-header-main">
        <h2 class="profile-title">Личный кабинет</h2>
        <span class="user-role-badge">Читатель NIS</span>
      </div>
      <button class="profile-close-btn" @click="$emit('back')">✕</button>
    </div>

    <!-- Profile Nav Tabs -->
    <div class="profile-tabs">
      <button 
        class="tab-btn" 
        :class="{ active: currentTab === 'info' }"
        @click="currentTab = 'info'"
      >
        <span>👤 Мой профиль</span>
      </button>
      <button 
        class="tab-btn" 
        :class="{ active: currentTab === 'reservations' }"
        @click="currentTab = 'reservations'"
      >
        <span>📚 Мои книги</span>
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
        <p class="avatar-hint">Нажмите на фото, чтобы изменить аватар</p>
      </div>

      <!-- Form Details -->
      <div class="profile-fields">
        <div class="field-item">
          <label>Имя и фамилия</label>
          <input 
            v-model="userName" 
            type="text" 
            class="apple-input" 
            placeholder="Введите ваше имя"
          />
        </div>

        <div class="field-item">
          <label>Школьная почта (Email)</label>
          <input 
            :value="email || 'Ученик NIS'" 
            type="email" 
            disabled 
            class="apple-input disabled"
          />
        </div>

        <div class="field-item">
          <label>Сменить пароль</label>
          <input 
            v-model="newPassword" 
            type="password" 
            placeholder="Новый пароль (оставьте пустым, если не меняете)" 
            class="apple-input"
          />
        </div>
      </div>

      <div class="profile-actions-row">
        <button class="apple-save-btn" @click="saveProfile">
          Сохранить изменения
        </button>
        <button class="apple-logout-btn" @click="logout">
          Выйти из аккаунта
        </button>
      </div>
    </div>

    <!-- Tab 2: Reservations -->
    <div v-else class="reservations-content">
      <div v-if="reservations.length === 0" class="empty-reservations">
        <div class="empty-icon">📖</div>
        <h3>У вас пока нет активных бронирований</h3>
        <p>Найдите понравившуюся книгу в каталоге или через поиск с ИИ и нажмите «Забронировать».</p>
        <button class="go-catalog-btn" @click="$router.push('/catalog'); $emit('back')">
          Перейти в каталог
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
                <span>Срок сдачи: <b>{{ formatDate(res.dueDate) }}</b></span>
              </div>
            </div>
          </div>
          <div class="res-card-right">
            <button class="return-btn" @click="cancelRes(res.id)" title="Отметить книгу как сданную">
              Вернуть книгу
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
  mounted() {
    this.loadUserData();
    this.refreshReservations();
  },
  methods: {
    loadUserData() {
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
      if (!dateStr) return '14 дней';
      const d = new Date(dateStr);
      return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
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
        this.showToast('Аватар успешно обновлен!', 'success');
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

      this.showToast('Профиль успешно сохранен!', 'success');
      this.$emit('updated', { name: this.userName, avatar: this.avatarUrl });
    },
    cancelRes(id) {
      cancelReservation(id);
      this.refreshReservations();
      this.showToast('Бронирование книги отменено / сдано в библиотеку', 'success');
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
  max-width: 520px;
  background: rgba(14, 22, 38, 0.96);
  backdrop-filter: blur(28px) saturate(190%);
  -webkit-backdrop-filter: blur(28px) saturate(190%);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 24px;
  padding: 28px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);
  color: #FFFFFF;
}

.profile-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.profile-header-main {
  display: flex;
  align-items: center;
  gap: 10px;
}

.profile-title {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.user-role-badge {
  font-size: 11px;
  font-weight: 600;
  background: rgba(0, 113, 227, 0.2);
  border: 1px solid rgba(56, 189, 248, 0.35);
  color: #38BDF8;
  padding: 2px 8px;
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
  font-size: 14px;
  transition: all 0.2s ease;
}
.profile-close-btn:hover {
  background: rgba(255, 255, 255, 0.16);
  color: #FFFFFF;
}

/* Tabs */
.profile-tabs {
  display: flex;
  gap: 8px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  padding: 4px;
  margin-bottom: 20px;
}

.tab-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  padding: 8px 14px;
  border-radius: 8px;
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
  background: rgba(16, 185, 129, 0.2);
  border: 1px solid rgba(16, 185, 129, 0.4);
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
  border: 2px solid rgba(255, 255, 255, 0.2);
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
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease;
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
  margin-bottom: 24px;
}

.field-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  text-align: left;
}

.field-item label {
  font-size: 12.5px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.75);
}

.apple-input {
  width: 100%;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 12px;
  padding: 10px 14px;
  font-size: 14px;
  color: #FFFFFF;
  font-family: inherit;
  outline: none;
  transition: all 0.25s ease;
}

.apple-input:focus {
  background: rgba(255, 255, 255, 0.1);
  border-color: #38BDF8;
}

.apple-input.disabled {
  opacity: 0.6;
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
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 12px;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s ease;
}
.apple-save-btn:hover {
  box-shadow: 0 4px 16px rgba(0, 113, 227, 0.4);
}

.apple-logout-btn {
  background: rgba(239, 68, 68, 0.15);
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
  background: rgba(239, 68, 68, 0.25);
}

/* Reservations tab */
.empty-reservations {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 30px 10px;
}
.empty-icon {
  font-size: 40px;
  margin-bottom: 12px;
}
.empty-reservations h3 {
  margin: 0 0 6px;
  font-size: 17px;
  color: #FFFFFF;
}
.empty-reservations p {
  font-size: 13.5px;
  color: rgba(255, 255, 255, 0.6);
  max-width: 320px;
  margin: 0 0 16px;
}
.go-catalog-btn {
  background: #0071E3;
  color: #FFFFFF;
  border: none;
  padding: 10px 20px;
  border-radius: 9999px;
  font-size: 13.5px;
  font-weight: 600;
  cursor: pointer;
}

.reservations-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 380px;
  overflow-y: auto;
  padding-right: 4px;
}

.res-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
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
  width: 6px;
  height: 48px;
  border-radius: 3px;
  background: linear-gradient(to bottom, #0071E3, #818CF8);
}

.res-title {
  margin: 0 0 4px;
  font-size: 14px;
  font-weight: 600;
  color: #FFFFFF;
}

.res-author {
  margin: 0 0 4px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
}

.res-date-badge {
  font-size: 11.5px;
  color: #38BDF8;
}

.return-btn {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
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
  border-color: rgba(239, 68, 68, 0.4);
  color: #FCA5A5;
}
</style>
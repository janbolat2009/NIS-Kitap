<template>
  <div class="apple-auth-modal">
    <!-- Header -->
    <div class="auth-header">
      <div class="auth-logo-badge">
        <img src="@/img/Logotype.svg" alt="NIS Kitap" class="auth-logo-img" />
      </div>
      <h2 class="auth-title">{{ activeTab === 'login' ? t('auth.loginTitle') : t('auth.registerTitle') }}</h2>
      <p class="auth-subtitle">
        {{ activeTab === 'login' 
          ? t('auth.loginSubtitle') 
          : t('auth.registerSubtitle') }}
      </p>

      <!-- Apple Segmented Control -->
      <div class="apple-segmented-control">
        <button 
          type="button"
          class="segment-btn" 
          :class="{ active: activeTab === 'login' }"
          @click="activeTab = 'login'"
        >
          {{ t('auth.loginTab') }}
        </button>
        <button 
          type="button"
          class="segment-btn" 
          :class="{ active: activeTab === 'register' }"
          @click="activeTab = 'register'"
        >
          {{ t('auth.registerTab') }}
        </button>
      </div>
    </div>

    <!-- Error Alert -->
    <div v-if="errorMessage" class="apple-alert error-alert">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      <span>{{ errorMessage }}</span>
    </div>

    <!-- Forms -->
    <div class="auth-body">
      <!-- Login Form -->
      <form v-if="activeTab === 'login'" @submit.prevent="handleLogin" class="auth-form">
        <div class="form-group">
          <label class="form-label">{{ t('auth.emailLabel') }}</label>
          <div class="input-container">
            <input 
              v-model="loginEmail" 
              type="email" 
              :placeholder="t('auth.emailPlaceholder')" 
              required
              autocomplete="email"
              class="apple-input"
            />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">{{ t('auth.passwordLabel') }}</label>
          <div class="input-container">
            <input 
              v-model="loginPassword" 
              type="password" 
              placeholder="••••••••" 
              required
              autocomplete="current-password"
              class="apple-input"
            />
          </div>
        </div>

        <button type="submit" class="auth-submit-btn" :disabled="loading">
          <span v-if="loading">{{ t('auth.submittingLogin') }}</span>
          <span v-else>{{ t('auth.loginSubmit') }}</span>
        </button>

        <div class="demo-mode-hint">
          <span>💡 {{ t('auth.demoHint') }}</span>
        </div>
      </form>

      <!-- Register Form -->
      <form v-else @submit.prevent="handleRegister" class="auth-form">
        <div class="form-group">
          <label class="form-label">{{ t('auth.nameLabel') }}</label>
          <div class="input-container">
            <input 
              v-model="name" 
              type="text" 
              :placeholder="t('auth.namePlaceholder')" 
              required
              autocomplete="name"
              class="apple-input"
            />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">{{ t('auth.emailLabel') }}</label>
          <div class="input-container">
            <input 
              v-model="email" 
              type="email" 
              :placeholder="t('auth.emailPlaceholder')" 
              required
              autocomplete="email"
              class="apple-input"
            />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">{{ t('auth.passwordLabel') }}</label>
          <div class="input-container">
            <input 
              v-model="password" 
              type="password" 
              :placeholder="t('auth.passwordMin')" 
              required
              minlength="6"
              autocomplete="new-password"
              class="apple-input"
            />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">{{ t('auth.confirmPasswordLabel') }}</label>
          <div class="input-container">
            <input 
              v-model="confirmPassword" 
              type="password" 
              :placeholder="t('auth.confirmPasswordPlaceholder')" 
              required
              autocomplete="new-password"
              class="apple-input"
            />
          </div>
        </div>

        <button type="submit" class="auth-submit-btn" :disabled="loading">
          <span v-if="loading">{{ t('auth.submittingRegister') }}</span>
          <span v-else>{{ t('auth.registerSubmit') }}</span>
        </button>
      </form>
    </div>
  </div>
</template>

<script>
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { t } from '@/i18n';

export default {
  name: 'Register',
  emits: ['registered', 'loggedIn'],
  data() {
    return {
      activeTab: 'login',
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      loginEmail: '',
      loginPassword: '',
      loading: false,
      errorMessage: '',
    };
  },
  methods: {
    t,
    async handleLogin() {
      this.errorMessage = '';
      this.loading = true;

      try {
        if (auth) {
          const userCred = await signInWithEmailAndPassword(auth, this.loginEmail, this.loginPassword);
          const user = userCred.user;
          const payload = {
            email: user.email,
            name: user.displayName || user.email.split('@')[0],
          };
          this.$emit('loggedIn', payload);
          return;
        }
      } catch (err) {
        console.warn('Firebase login error, falling back to local session:', err.message);
        // Если ошибка Firebase (например, офлайн или неверный пароль), но для демо пользователь вводит данные:
        if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
          this.errorMessage = t('auth.loginError');
          this.loading = false;
          return;
        }
      }

      // Безопасный демо fallback
      const demoName = this.loginEmail.split('@')[0];
      const payload = {
        email: this.loginEmail,
        name: demoName ? demoName.charAt(0).toUpperCase() + demoName.slice(1) : t('nav.reader'),
      };
      this.$emit('loggedIn', payload);
      this.loading = false;
    },

    async handleRegister() {
      this.errorMessage = '';

      if (this.password !== this.confirmPassword) {
        this.errorMessage = t('auth.passMismatch');
        return;
      }

      this.loading = true;

      try {
        if (auth) {
          const userCred = await createUserWithEmailAndPassword(auth, this.email, this.password);
          const user = userCred.user;

          await updateProfile(user, { displayName: this.name });

          if (db) {
            try {
              await setDoc(doc(db, 'users', user.uid), {
                name: this.name,
                email: this.email,
                createdAt: new Date().toISOString(),
              });
            } catch (dbErr) {
              console.warn('Firestore doc creation error:', dbErr);
            }
          }

          const payload = {
            email: user.email,
            name: this.name,
          };
          this.$emit('registered', payload);
          return;
        }
      } catch (err) {
        console.warn('Firebase registration error:', err.message);
        if (err.code === 'auth/email-already-in-use') {
          this.errorMessage = 'Пользователь с такой почтой уже существует. Пожалуйста, войдите.';
          this.loading = false;
          return;
        }
      }

      // Безопасный fallback
      const payload = {
        email: this.email,
        name: this.name || 'Ученик NIS',
      };
      this.$emit('registered', payload);
      this.loading = false;
    },
  },
};
</script>

<style scoped>
.apple-auth-modal {
  width: 100%;
  max-width: 440px;
  background: rgba(14, 22, 38, 0.95);
  backdrop-filter: blur(28px) saturate(190%);
  -webkit-backdrop-filter: blur(28px) saturate(190%);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 24px;
  padding: 32px 28px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);
  color: #FFFFFF;
}

.auth-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin-bottom: 20px;
}

.auth-logo-badge {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 14px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
}

.auth-logo-img {
  height: 32px;
  width: auto;
}

.auth-title {
  margin: 0 0 6px;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.auth-subtitle {
  margin: 0 0 18px;
  font-size: 13.5px;
  color: rgba(255, 255, 255, 0.65);
  line-height: 1.45;
  max-width: 320px;
}

/* Apple Segmented Control */
.apple-segmented-control {
  display: flex;
  width: 100%;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 4px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.segment-btn {
  flex: 1;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.65);
  padding: 8px 16px;
  font-size: 13.5px;
  font-weight: 500;
  font-family: inherit;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.segment-btn.active {
  background: #0071E3;
  color: #FFFFFF;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(0, 113, 227, 0.4);
}

/* Alert */
.apple-alert {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 13px;
  margin-bottom: 16px;
}
.error-alert {
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #FCA5A5;
}

/* Forms */
.auth-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  text-align: left;
}

.form-label {
  font-size: 12.5px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.75);
}

.apple-input {
  width: 100%;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 12px;
  padding: 11px 14px;
  font-size: 14.5px;
  color: #FFFFFF;
  font-family: inherit;
  outline: none;
  transition: all 0.25s ease;
}

.apple-input:focus {
  background: rgba(255, 255, 255, 0.1);
  border-color: #38BDF8;
  box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.25);
}

.apple-input::placeholder {
  color: rgba(255, 255, 255, 0.35);
}

.auth-submit-btn {
  margin-top: 6px;
  background: linear-gradient(135deg, #0071E3 0%, #0056B3 100%);
  color: #FFFFFF;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 13px;
  font-size: 15px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.25s ease;
  box-shadow: 0 4px 14px rgba(0, 113, 227, 0.35);
}

.auth-submit-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #007BF5 0%, #0060C9 100%);
  box-shadow: 0 6px 20px rgba(0, 113, 227, 0.5);
  transform: translateY(-1px);
}

.auth-submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.demo-mode-hint {
  text-align: center;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.45);
  line-height: 1.4;
  margin-top: 4px;
}
.demo-mode-hint b {
  color: #38BDF8;
}
</style>
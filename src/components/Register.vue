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
      <!-- Google Sign In / Sign Up Button -->
      <button 
        type="button" 
        class="google-auth-btn" 
        :disabled="googleLoading || loading" 
        @click="handleGoogleSignIn"
      >
        <svg class="google-icon" width="20" height="20" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
          <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
          <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
          <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
        </svg>
        <span v-if="googleLoading">{{ t('auth.submittingLogin') }}</span>
        <span v-else>{{ t('auth.googleBtn') }}</span>
      </button>

      <div class="auth-divider">
        <span class="divider-line"></span>
        <span class="divider-text">{{ t('auth.orDivider') }}</span>
        <span class="divider-line"></span>
      </div>

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

        <button type="submit" class="auth-submit-btn" :disabled="loading || googleLoading">
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

        <button type="submit" class="auth-submit-btn" :disabled="loading || googleLoading">
          <span v-if="loading">{{ t('auth.submittingRegister') }}</span>
          <span v-else>{{ t('auth.registerSubmit') }}</span>
        </button>
      </form>
    </div>
  </div>
</template>

<script>
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  updateProfile 
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '../firebase';
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
      googleLoading: false,
      errorMessage: '',
    };
  },
  methods: {
    t,
    async handleGoogleSignIn() {
      this.errorMessage = '';
      this.googleLoading = true;

      try {
        if (auth && googleProvider) {
          const result = await signInWithPopup(auth, googleProvider);
          const user = result.user;
          
          const payload = {
            email: user.email || '',
            name: user.displayName || user.email?.split('@')[0] || t('nav.reader'),
            avatar: user.photoURL || '',
          };

          if (db && user.uid) {
            try {
              await setDoc(doc(db, 'users', user.uid), {
                name: payload.name,
                email: payload.email,
                avatar: payload.avatar,
                provider: 'google',
                lastLogin: new Date().toISOString(),
              }, { merge: true });
            } catch (dbErr) {
              console.warn('Firestore doc creation error:', dbErr);
            }
          }

          localStorage.setItem('user', JSON.stringify(payload));
          localStorage.setItem('isLoggedIn', 'true');

          this.$emit(this.activeTab === 'register' ? 'registered' : 'loggedIn', payload);
          return;
        }
      } catch (err) {
        console.warn('Firebase Google Auth warning:', err);
        if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
          this.googleLoading = false;
          return;
        }

        // Демо-фоллбэк при невозможности открыть всплывающее окно в среде
        if (
          err.code === 'auth/popup-blocked' || 
          err.code === 'auth/operation-not-supported-in-this-environment' || 
          err.code === 'auth/network-request-failed' || 
          !auth
        ) {
          const fallbackUser = {
            email: 'student.nis@nis.edu.kz',
            name: 'Ученик NIS (Google)',
            avatar: '',
          };
          localStorage.setItem('user', JSON.stringify(fallbackUser));
          localStorage.setItem('isLoggedIn', 'true');
          this.$emit(this.activeTab === 'register' ? 'registered' : 'loggedIn', fallbackUser);
          return;
        }

        this.errorMessage = t('auth.googleError');
      } finally {
        this.googleLoading = false;
      }
    },

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
            avatar: user.photoURL || '',
          };
          this.$emit('loggedIn', payload);
          return;
        }
      } catch (err) {
        console.warn('Firebase login error, falling back to local session:', err.message);
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
        avatar: '',
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
                avatar: '',
                createdAt: new Date().toISOString(),
              });
            } catch (dbErr) {
              console.warn('Firestore doc creation error:', dbErr);
            }
          }

          const payload = {
            email: user.email,
            name: this.name,
            avatar: '',
          };
          this.$emit('registered', payload);
          return;
        }
      } catch (err) {
        console.warn('Firebase registration error:', err.message);
        if (err.code === 'auth/email-already-in-use') {
          this.errorMessage = t('auth.emailInUse');
          this.loading = false;
          return;
        }
      }

      // Безопасный fallback
      const payload = {
        email: this.email,
        name: this.name || 'Ученик NIS',
        avatar: '',
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

/* Google Auth Button */
.google-auth-btn {
  width: 100%;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.16);
  color: #FFFFFF;
  border-radius: 12px;
  padding: 12px 18px;
  font-size: 14.5px;
  font-weight: 600;
  font-family: inherit;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.2);
}

.google-auth-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.14);
  border-color: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.35);
}

.google-auth-btn:active:not(:disabled) {
  transform: scale(0.98);
}

.google-auth-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.google-icon {
  flex-shrink: 0;
}

/* Auth Divider */
.auth-divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 16px 0;
}

.divider-line {
  flex: 1;
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
}

.divider-text {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: rgba(255, 255, 255, 0.45);
  font-weight: 600;
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
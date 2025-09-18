<template>
  <div class="profile-detail">
    <button class="close-btn" @click="$emit('back')">✕</button>
    <div class="profile-card">
      <h1 class="title">Мой профиль</h1>
      <div class="avatar-section">
        <div class="avatar-wrapper" @click="onAvatarClick">
          <img :src="currentAvatar" class="avatar" alt="Аватар пользователя" />
          <div class="avatar-overlay">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 5v14M5 12h14"></path>
            </svg>
          </div>
        </div>
        <p class="avatar-label">Изменить фото</p>
        <input type="file" ref="avatarInput" @change="onAvatarChange" accept="image/*" class="avatar-input" />
      </div>

      <div class="form-section">
        <div class="form-group">
          <label class="form-label">Имя пользователя</label>
          <div class="input-wrapper">
            <input 
              type="text" 
              v-model="newName" 
              placeholder="Введите ваше имя" 
              @keyup.enter="updateName"
              class="input-field"
            />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Электронная почта</label>
          <div class="input-wrapper disabled">
            <input 
              type="email" 
              :value="email" 
              disabled
              class="input-field"
            />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Новый пароль</label>
          <div class="input-wrapper">
            <input 
              type="password" 
              v-model="password" 
              placeholder="••••••••" 
              class="input-field"
            />
          </div>
        </div>

        <button class="save-btn" @click="updateProfile">
          <span>Сохранить изменения</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { getAuth, updatePassword, updateProfile } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '../firebase';
import defaultAvatar from '@/img/a68eab.jpg'

export default {
  name: 'Profile',
  props: {
    email: { type: String, required: true },
    name: { type: String, required: true },
  },
  data() {
    return {
      password: '',
      avatar: null,
      newName: '',
      avatarUrl: null,
    };
  },
  computed: {
    currentAvatar() {
      return this.avatarUrl || defaultAvatar;
    },
  },
  methods: {
    onAvatarClick() {
      this.$refs.avatarInput.click();
    },
    async onAvatarChange(e) {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = async (evt) => {
          this.avatar = evt.target.result;
          await this.uploadAvatar(file);
        };
        reader.readAsDataURL(file);
      }
    },
    async uploadAvatar(file) {
      const user = auth.currentUser;
      if (user) {
        const storageRef = ref(storage, `avatars/${user.uid}/${Date.now()}_${file.name}`);
        try {
          const response = await fetch(this.avatar);
          const blob = await response.blob();
          await uploadString(storageRef, await blob.text(), 'raw');
          this.avatarUrl = await getDownloadURL(storageRef);
        } catch (error) {
          console.error('Ошибка загрузки аватара:', error.message);
          alert('Ошибка загрузки аватара');
        }
      }
    },
    async updateName() {
      const user = auth.currentUser;
      if (!user || !this.newName.trim()) {
        alert('Введите имя');
        return;
      }
      try {
        await updateProfile(user, { displayName: this.newName });
        await updateDoc(doc(db, 'users', user.uid), { name: this.newName });
        alert('Имя обновлено');
        this.$emit('update:user', { name: this.newName, email: user.email, avatar: this.avatarUrl || '' });
      } catch (error) {
        console.error('Ошибка обновления имени:', error.message);
        alert(error.message);
      }
    },
    async updateProfile() {
      const user = auth.currentUser;
      if (!user) {
        alert('Не авторизован');
        return;
      }
      try {
        const updates = {};
        if (this.password) {
          await updatePassword(user, this.password);
          updates.password = 'обновлён';
        }
        if (this.avatarUrl) {
          await updateProfile(user, { photoURL: this.avatarUrl });
          await updateDoc(doc(db, 'users', user.uid), { avatar: this.avatarUrl });
          updates.avatar = this.avatarUrl;
        }
        alert('Профиль обновлён');
        this.$emit('update:user', { name: user.displayName, email: user.email, avatar: user.photoURL || '' });
      } catch (error) {
        console.error('Ошибка обновления:', error.message);
        alert(error.message);
      }
    },
  },
  mounted() {
    this.newName = this.name;
  },
};
</script>

<style scoped>
.profile-detail {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 48, 96, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  z-index: 1000;
}

.close-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  background: rgba(246, 238, 225, 0.3);
  border: none;
  color: #003060;
  font-size: 28px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background: rgba(246, 238, 225, 0.5);
  transform: scale(1.1);
}

.profile-card {
  background: rgba(246, 238, 225, 0.9);
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 15px 30px rgba(0, 48, 96, 0.3);
  max-width: 500px;
  width: 100%;
  animation: slideIn 0.6s ease-out;
  position: relative;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.title {
  color: #003060;
  font-size: 28px;
  font-weight: 700;
  text-align: center;
  margin-bottom: 30px;
  position: relative;
}

.title::after {
  content: '';
  position: absolute;
  bottom: -10px;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 3px;
  background: #003060;
  border-radius: 2px;
}

.avatar-section {
  text-align: center;
  margin-bottom: 30px;
}

.avatar-wrapper {
  position: relative;
  display: inline-block;
  cursor: pointer;
  margin-bottom: 10px;
}

.avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #003060;
  box-shadow: 0 4px 10px rgba(0, 48, 96, 0.15);
  transition: all 0.3s ease;
}

.avatar:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 15px rgba(0, 48, 96, 0.25);
}

.avatar-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 48, 96, 0.6);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
  color: #F6EEE1;
}

.avatar-wrapper:hover .avatar-overlay {
  opacity: 1;
}

.avatar-label {
  color: #003060;
  font-size: 14px;
  margin-top: 8px;
  font-weight: 500;
  transition: color 0.3s ease;
}

.avatar-wrapper:hover .avatar-label {
  color: #003060;
  opacity: 0.8;
}

.avatar-input {
  display: none;
}

.form-section {
  width: 100%;
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  color: #003060;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.input-wrapper {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 48, 96, 0.1);
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.input-wrapper:hover {
  box-shadow: 0 4px 12px rgba(0, 48, 96, 0.15);
}

.input-wrapper.disabled {
  opacity: 0.7;
}

.input-field {
  width: 100%;
  padding: 14px 20px;
  border: none;
  background: rgba(255, 255, 255, 0.8);
  font-size: 16px;
  color: #003060;
  transition: all 0.3s ease;
  outline: none;
}

.input-field:focus {
  background: white;
  box-shadow: inset 0 0 0 2px #003060;
}

.save-btn {
  width: 100%;
  padding: 16px;
  background: #003060;
  color: #F6EEE1;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 48, 96, 0.2);
}

.save-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(0, 48, 96, 0.3);
  background: #00254d;
}

.save-btn:active {
  transform: translateY(0);
}

@media (max-width: 600px) {
  .profile-detail {
    padding: 10px;
  }

  .close-btn {
    top: 15px;
    right: 15px;
    width: 36px;
    height: 36px;
    font-size: 24px;
  }

  .profile-card {
    padding: 30px 20px;
    margin: 10px;
  }

  .title {
    font-size: 24px;
    margin-bottom: 25px;
  }

  .avatar {
    width: 80px;
    height: 80px;
    border: 2px solid #003060;
  }

  .form-label {
    font-size: 13px;
  }

  .input-field {
    padding: 12px 15px;
    font-size: 15px;
  }

  .save-btn {
    padding: 14px;
    font-size: 15px;
  }
}
</style>
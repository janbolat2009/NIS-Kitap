<template>
     <div class="profile-detail">
       <button class="back-btn" @click="$emit('back')">← Назад</button>
       <h1>Профиль пользователя</h1>
       <div class="profile-info">
         <div class="avatar-section">
           <img :src="avatar || defaultAvatar" class="avatar" />
           <input type="file" @change="onAvatarChange" />
         </div>
         <div class="info-section">
           <label>Почта</label>
           <p class="email-display">{{ email }}</p>
           <label>Новый пароль</label>
           <input
             type="password"
             v-model="password"
             placeholder="Введите новый пароль"
           />
           <button class="save-btn" @click="updateProfile">Сохранить</button>
         </div>
       </div>
     </div>
   </template>

   <script>
   import axios from 'axios';

   export default {
     name: 'Profile',
     props: {
       email: {
         type: String,
         required: true
       }
     },
     data() {
       return {
         password: '',
         avatar: '',
         defaultAvatar: require('@/assets/img/user.png'),
         token: localStorage.getItem('token')
       };
     },
     methods: {
       onAvatarChange(e) {
         const file = e.target.files[0];
         if (!file) return;
         const reader = new FileReader();
         reader.onload = evt => {
           this.avatar = evt.target.result;
         };
         reader.readAsDataURL(file);
       },
       async updateProfile() {
         try {
           const updates = {};
           if (this.password) updates.password = this.password;
           if (this.avatar) updates.avatar = this.avatar;
           const response = await axios.put('http://localhost:3000/auth/profile', updates, {
             headers: { Authorization: `Bearer ${this.token}` }
           });
           alert(response.data.msg);
           const user = response.data.user;
           localStorage.setItem('user', JSON.stringify(user));
         } catch (error) {
           console.error('Ошибка обновления профиля:', error.response ? error.response.data : error.message);
           alert(error.response?.data.msg || 'Ошибка сервера');
         }
       }
     },
     mounted() {
       // Загружаем текущие данные профиля
       if (this.token) {
         axios.get('http://localhost:3000/auth/profile', {
           headers: { Authorization: `Bearer ${this.token}` }
         }).then(response => {
           this.avatar = response.data.avatar || this.defaultAvatar;
         }).catch(error => {
           console.error('Ошибка загрузки профиля:', error);
         });
       }
     }
   };
   </script>

   <style scoped>
   .profile-detail {
     background-color: #003060;
     min-height: 100vh;
     padding: 20px;
     color: #F6EEE1;
     text-align: center;
   }
   .back-btn {
     background: transparent;
     border: none;
     color: #F6EEE1;
     font-size: 18px;
     cursor: pointer;
     margin-bottom: 20px;
   }
   .back-btn:hover {
     color: #F6EEE1;
     transform: scale(1.1);
   }
   h1 {
     font-size: 32px;
     margin-bottom: 20px;
     color: #F6EEE1;
   }
   .profile-info {
     background-color: rgba(246, 238, 225, 0.9);
     padding: 20px;
     border-radius: 12px;
     max-width: 600px;
     margin: 0 auto;
     color: #003060;
     box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
     display: flex;
     flex-direction: column;
     align-items: center;
   }
   .avatar-section {
     margin-bottom: 20px;
   }
   .avatar {
     width: 120px;
     height: 120px;
     object-fit: cover;
     border-radius: 50%;
     margin-bottom: 10px;
     border: 3px solid #003060;
   }
   .info-section label {
     display: block;
     margin: 12px 0 6px;
     font-weight: 600;
   }
   .email-display {
     padding: 10px;
     background: white;
     border: 1px solid #ccc;
     border-radius: 8px;
     margin-bottom: 20px;
     text-align: center;
   }
   .info-section input {
     width: 100%;
     padding: 10px;
     border: 2px solid #003060;
     border-radius: 20px;
     font-size: 16px;
     margin-bottom: 20px;
   }
   .save-btn {
     width: 100%;
     padding: 12px;
     background-color: #003060;
     color: #F6EEE1;
     border: none;
     border-radius: 10px;
     font-weight: bold;
     cursor: pointer;
     transition: all 0.3s;
   }
   .save-btn:hover {
     background-color: transparent;
     border: 2px solid #003060;
     color: #003060;
     background-color: #F6EEE1;
   }
   </style>
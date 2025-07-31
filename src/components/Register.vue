<template>
     <div class="auth-container">
       <div class="register-side">
         <h1>Регистрация</h1>
         <form @submit.prevent="registerUser">
           <label>Имя</label>
           <input type="text" v-model="name" placeholder="Введите имя" required />

           <label>Почта</label>
           <input type="email" v-model="email" placeholder="Введите почту" required />

           <label>Пароль</label>
           <input type="password" v-model="password1" placeholder="Введите пароль" required />

           <label>Подтвердите пароль</label>
           <input type="password" v-model="password2" placeholder="Повторите пароль" required />

           <button type="submit" class="btn-register">Регистрация</button>
         </form>
       </div>
       <div class="login-side">
         <div class="login-content">
           <h1>Уже есть аккаунт?</h1>
           <h3>Войти</h3>
           <form @submit.prevent="loginUser">
             <label>Почта</label>
             <input type="email" v-model="loginEmail" placeholder="Введите почту" required />

             <label>Пароль</label>
             <input type="password" v-model="loginPassword" placeholder="Введите пароль" required />

             <button type="submit" class="btn-login">Войти</button>
           </form>
         </div>
       </div>
     </div>
   </template>

   <script>
   import axios from 'axios';

   export default {
     name: 'Register',
     data() {
       return {
         name: '',
         email: '',
         password1: '',
         password2: '',
         loginEmail: '',
         loginPassword: ''
       };
     },
     methods: {
       async registerUser() {
         if (this.password1 !== this.password2) {
           return alert('Пароли не совпадают!');
         }
         try {
           const response = await axios.post('http://localhost:3000/auth/register', {
             name: this.name,
             email: this.email,
             password: this.password1
           });
           alert(response.data.msg);
           this.$emit('registered', { email: this.email });
           this.$router.push('/');
         } catch (error) {
           console.error('Ошибка регистрации:', error.response ? error.response.data : error.message);
           alert(error.response?.data.msg || 'Ошибка сервера');
         }
       },
       async loginUser() {
         try {
           const response = await axios.post('http://localhost:3000/auth/login', {
             email: this.loginEmail,
             password: this.loginPassword
           });
           const { token, user } = response.data;
           localStorage.setItem('token', token);
           localStorage.setItem('user', JSON.stringify(user));
           this.$emit('registered', { email: this.loginEmail });
           this.$router.push('/');
         } catch (error) {
           console.error('Ошибка логина:', error.response ? error.response.data : error.message);
           alert(error.response?.data.msg || 'Ошибка сервера');
         }
       }
     }
   };
   </script>

   <style scoped>
   .auth-container {
     display: flex;
     width: 900px;
     height: 600px;
     margin: 50px auto;
     border-radius: 20px;
     overflow: hidden;
     box-shadow: 0 0 20px rgba(0,0,0,0.2);
     position: relative;
     top: -50px;
   }

   .register-side {
     background-color: #F6EEE1;
     color: #003060;
     flex: 1;
     padding: 40px;
     display: flex;
     flex-direction: column;
     gap: 15px;
   }

   .register-side h1 {
     font-size: 28px;
     font-weight: 700;
   }

   .register-side form {
     display: flex;
     flex-direction: column;
     gap: 12px;
   }

   .register-side input {
     border: 2px solid #003060;
     border-radius: 20px;
     padding: 10px;
     font-size: 16px;
   }

   .btn-register {
     margin-top: 10px;
     background-color: #003060;
     color: #F6EEE1;
     padding: 12px;
     border: none;
     border-radius: 10px;
     font-weight: bold;
     cursor: pointer;
     transition: all 0.3s;
   }

   .btn-register:hover {
     background-color: transparent;
     border: 2px solid #003060;
     color: #003060;
   }

   .login-side {
     position: relative;
     flex: 1;
     padding: 40px;
     background-color: #003060;
     color: #F6EEE1;
     display: flex;
     align-items: center;
     justify-content: center;
     background-image: url('@/assets/img/Ellipse 14.png');
     background-repeat: no-repeat;
     background-position: bottom left;
     background-size: auto 100%;
   }

   .login-content {
     position: relative;
     z-index: 1;
     width: 100%;
   }

   .login-content h1 {
     font-size: 24px;
     margin-bottom: 10px;
   }

   .login-content h3 {
     margin-bottom: 20px;
   }

   .login-content form {
     display: flex;
     flex-direction: column;
     gap: 12px;
   }

   .login-content input {
     border: 2px solid #F6EEE1;
     border-radius: 20px;
     padding: 10px;
     font-size: 16px;
     background: transparent;
     color: white;
   }

   .login-content input::placeholder {
     color: #ccc;
   }

   .btn-login {
     margin-top: 10px;
     background-color: #F6EEE1;
     color: #003060;
     padding: 12px;
     border: none;
     border-radius: 10px;
     font-weight: bold;
     cursor: pointer;
     transition: all 0.3s;
   }

   .btn-login:hover {
     background-color: transparent;
     border: 2px solid #F6EEE1;
     color: #F6EEE1;
   }
   </style>
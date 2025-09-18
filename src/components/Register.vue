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
        <button type="submit" class="btn-register" @click="registerUser">Регистрация</button>
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
          <button type="submit" class="btn-login" @click="loginUser">Войти</button>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useRouter } from 'vue-router';

export default {
  name: 'Register',
  data() {
    return {
      name: '',
      email: '',
      password1: '',
      password2: '',
      loginEmail: '',
      loginPassword: '',
    };
  },
  setup() {
    const router = useRouter();
    if (!router) {
      console.error('Router is not available. Check vue-router setup in main.js and router/index.js.');
    }
    return { router };
  },
  methods: {
    async registerUser() {
      if (this.password1 !== this.password2) {
        alert('Пароли не совпадают!');
        return;
      }
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, this.email, this.password1);
        const user = userCredential.user;

        await updateProfile(user, { displayName: this.name });

        await setDoc(doc(db, 'users', user.uid), {
          name: this.name,
          email: this.email,
          avatar: '',
          createdAt: new Date(),
        });

        alert('Регистрация успешна!');
        this.$emit('registered', { email: this.email, name: this.name });
        if (this.router) {
          this.router.push('/');
        } else {
          console.error('Router is not defined, falling back to window.location.');
          window.location.href = '/';
        }
      } catch (error) {
        console.error('Ошибка:', error.message);
        alert('Ошибка регистрации: ' + error.message);
      }
    },
    async loginUser() {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, this.loginEmail, this.loginPassword);
        const user = userCredential.user;

        alert('Вход выполнен!');
        this.$emit('loggedIn', { email: user.email, name: user.displayName || '' });
        if (this.router) {
          this.router.push('/');
        } else {
          console.error('Router is not defined, falling back to window.location.');
          window.location.href = '/';
        }
      } catch (error) {
        console.error('Ошибка:', error.message);
        alert('Ошибка логина: ' + error.message);
      }
    },
  },
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
@media (max-width: 768px) {
  .auth-container {
    width: 90%;
    height: auto;
    min-height: 500px;
    flex-direction: column;
    border-radius: 15px;
    margin-top: 10px;
    margin: 40px auto;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  }

  .register-side,
  .login-side {
    width: 100%;
    padding: 20px;
    flex: 1;
  }

  .register-side {
    background-color: #F6EEE1;
    color: #003060;
    border-bottom: 1px solid #ddd;
  }

  .register-side h1 {
    font-size: 24px;
    text-align: center;
  }

  .register-side form {
    gap: 10px;
  }

  .register-side input {
    padding: 12px;
    font-size: 16px;
    border-radius: 12px;
  }

  .btn-register {
    padding: 12px;
    font-size: 16px;
    border-radius: 10px;
  }

  .btn-register:hover {
    transform: scale(1.02);
  }

  .login-side {
    background-color: #003060;
    color: #F6EEE1;
    text-align: center;
    background-size: auto 80%;
    background-position: bottom left;
    padding: 30px 20px;
  }

  .login-content {
    width: 100%;
  }

  .login-content h1 {
    font-size: 22px;
    margin-bottom: 8px;
  }

  .login-content h3 {
    font-size: 20px;
    margin-bottom: 20px;
  }

  .login-content input {
    padding: 12px;
    font-size: 16px;
    border-radius: 12px;
  }

  .btn-login {
    padding: 12px;
    font-size: 16px;
    border-radius: 10px;
  }

  .btn-login:hover {
    transform: scale(1.02);
  }
}

@media (max-width: 480px) {
  .auth-container {
    width: 95%;
    min-height: 480px;
    border-radius: 12px;
    margin: 15px auto;
    box-shadow: 0 3px 12px rgba(0, 0, 0, 0.2);
    margin-top: 35px;
  }

  .register-side,
  .login-side {
    padding: 16px;
  }

  .register-side h1,
  .login-content h1 {
    font-size: 20px;
    margin-bottom: 12px;
  }

  .login-content h3 {
    font-size: 18px;
    margin-bottom: 16px;
  }

  .register-side form,
  .login-content form {
    gap: 8px;
  }

  .register-side input,
  .login-content input {
    padding: 10px;
    font-size: 15px;
    border-radius: 10px;
  }

  .btn-register,
  .btn-login {
    padding: 10px;
    font-size: 15px;
    border-radius: 8px;
  }

  .btn-register:hover,
  .btn-login:hover {
    transform: scale(1.01);
  }

  .login-side {
    background-size: auto 70%;
    padding: 20px 16px;
  }

  .auth-container {
    overflow: hidden;
  }
}
   </style>
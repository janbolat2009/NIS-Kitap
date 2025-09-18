<template>
     <div class="books-page">
       <header class="header">
         <h1>Русские книги</h1>
         <select v-model="selectedGenre" class="genre-select">
           <option value="">Все жанры</option>
           <option v-for="genre in uniqueGenres" :key="genre" :value="genre">{{ genre }}</option>
         </select>
        <h4 class="back-btn" @click="this.$router.push('/catalog')">Назад</h4>
       </header>
       <div class="books-container">
         <div
  v-for="book in filteredBooks"
  :key="book._id"
  class="book"
  @click="goToBookDetail(book)"
>
  <h3 class="title">{{ book.title }}</h3>
  <p><strong>Автор:</strong> {{ book.author }}</p>
  <p><strong>Жанры:</strong> {{ book.genre }}</p>
  <p><strong>Год выпуска:</strong> {{ book.year }}</p>
  <p><strong>Экземпляры:</strong> {{ book.copies }}</p>
</div>
         <p v-if="filteredBooks.length === 0" class="no-books">
           No English books found for the selected genre or data is loading.
         </p>
       </div>
     </div>
   </template>

   <script>
   import axios from 'axios';
import { useRouter } from 'vue-router';

export default {
  setup() {
    const router = useRouter();
    return { router };
  },
  data() {
    return {
      books: [],
      selectedGenre: ''
    };
  },
  computed: {
    uniqueGenres() {
      if (!Array.isArray(this.books)) return [];
      const genres = new Set(this.books.filter(book => book.language === 'Русский').map(book => book.genre));
      return Array.from(genres).sort();
    },
    filteredBooks() {
      if (!Array.isArray(this.books)) return [];
      let result = this.books.filter(book => book.language === 'Русский');
      if (this.selectedGenre) {
        result = result.filter(book => book.genre === this.selectedGenre);
      }
      return result;
    }
  },
  mounted() {
    axios.get('http://localhost:3000/api/books')
      .then(response => {
        if (Array.isArray(response.data)) {
          this.books = response.data;
        } else {
          console.error('Invalid data format:', response.data);
          this.books = [];
        }
        console.log('Loaded books:', this.books);
      })
      .catch(error => {
        console.error('Error loading books:', error);
        this.books = [];
      });
  },
  methods: {
    goToBookDetail(book) {
      const title = encodeURIComponent(book.title); 
      this.router.push({ name: 'BookDetail', params: { title } });
    }
  }
};
   </script>

   <style scoped>
   .books-page {
     background-color: #003060;
     min-height: 100vh;
     padding: 20px;
     color: #F6EEE1;
     position: relative;
   }
   .header {
     display: flex;
     flex-direction: column;
     align-items: flex-start;
     margin-bottom: 20px;
   }
   .back-btn {
    position:absolute;
    top: 45px;
    right: 120px;
    font-size: 18px;
    border-radius: 12px;
    border: 2px solid #F6EEE1;
    padding: 15px 25px;
    transition: all 800ms ease;
   }
   .back-btn:hover {
    transform: scale(1.09);
   }
   .genre-select {
     padding: 12px 20px;
     font-size: 16px;
     border-radius: 8px;
     background-color: #F6EEE1;
     color: #003060;
     border: 2px solid #4a90e2;
     cursor: pointer;
     transition: all 0.3s ease;
     margin-top: 10px;
     align-self: flex-start;
   }
   .genre-select:hover {
     background-color: #e0e0e0;
     transform: scale(1.05);
   }
   .books-container {
     display: flex;
     flex-wrap: wrap;
     gap: 20px;
     position: relative;
     top: 100px;
   }
   .book {
     background-color: rgba(246, 238, 225, 0.9);
     padding: 15px;
     border-radius: 8px;
     width: 250px;
     text-align: center;
     transition: transform 0.3s;
   }
   .book:hover {
     transform: scale(1.05);
   }
   .title {
     font-size: 18px;
     color: #003060;
     margin-bottom: 10px;
   }
   .no-books {
     text-align: center;
     color: #F6EEE1;
   }

   @media (max-width: 768px) {
     .books-page {
       padding: 4%;
     }
     
     .header {
       flex-direction: column;
       align-items: stretch;
       margin-bottom: 5%;
     }
     
     .header h1 {
       font-size: 1.8rem;
       margin-bottom: 4%;
       text-align: center;
     }
     
     .back-btn {
       position: static;
       align-self: flex-end;
       font-size: 1rem;
       padding: 3% 6%;
       margin-bottom: 4%;
       width: auto;
       max-width: 6rem;
       text-align: center;
     }
     
     .genre-select {
       padding: 4% 5%;
       font-size: 1rem;
       width: 100%;
       max-width: none;
       margin-top: 0;
     }
     
     .books-container {
       grid-template-columns: repeat(2, 1fr);
       gap: 4%;
       margin-top: 5%;
     }
     
     .book {
       padding: 4%;
       border-radius: 0.75rem;
       min-height: 12rem;
       display: flex;
       flex-direction: column;
       justify-content: space-between;
     }
     
     .title {
       font-size: 1rem;
       margin-bottom: 3%;
       line-height: 1.2;
     }
     
     .book p {
       font-size: 0.85rem;
       margin: 1% 0;
       line-height: 1.3;
     }
     
     .no-books {
       grid-column: 1 / -1;
       font-size: 1rem;
       padding: 5%;
     }
   }

   @media (max-width: 480px) {
     .books-page {
       padding: 3%;
     }
     
     .header h1 {
       font-size: 1.5rem;
       margin-top: 5%;
     }
     
     .back-btn {
       font-size: 0.9rem;
       padding: 3% 5%;
       margin-top: 5%;
     }
     
     .genre-select {
       padding: 4%;
       font-size: 0.9rem;
     }
     
     .books-container {
       gap: 3%;
       position: relative;
       top: 30vh;
     }
     
     .book {
       padding: 3%;
       min-height: 10rem;
       margin: 5% auto;
     }
     
     .title {
       font-size: 0.9rem;
     }
     
     .book p {
       font-size: 0.8rem;
     }
   }
   </style>
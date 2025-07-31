<template>
     <div class="books-page">
       <header class="header">
         <h1>Русские книги</h1>
         <select v-model="selectedGenre" class="genre-select">
           <option value="">Все жанры</option>
           <option v-for="genre in uniqueGenres" :key="genre" :value="genre">{{ genre }}</option>
         </select>
         <ul class="header-ul">
        <li @click="$router.push('/catalog')" class="back-btn">Назад</li>
      </ul>
       </header>
       <div class="books-container">
         <div
           v-for="book in filteredBooks"
           :key="book.title"
           class="book"
           @click="$router.push(`/book/${book.title.replace(/\s+/g, '-')}`)"
         >
           <h3 class="title">{{ book.title }}</h3>
           <p><strong>Aвтор:</strong> {{ book.author }}</p>
           <p><strong>Жанр:</strong> {{ book.genre }}</p>
           <p><strong>Год:</strong> {{ book.year }}</p>
           <p><strong>Экземпляры</strong> {{ book.copies }}</p>
         </div>
         <p v-if="filteredBooks.length === 0" class="no-books">
           No English books found for the selected genre or data is loading.
         </p>
       </div>
     </div>
   </template>

   <script>
   import axios from 'axios';

   export default {
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
   .header-ul {
    position: absolute;
    top: 50px;
    right: 20px;
    list-style: none;
    display: flex;
    align-items: center;
    margin-right: 120px;
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
   </style>
<template>
  <div class="books-page">
    <header class="header">
      <h1>Приключение</h1>
      <ul class="header-ul">
        <li @click="$router.push('/catalog')" class="back-btn">Назад</li>
      </ul>
    </header>

    <div class="books-container" style="margin-top: 100px;">
      <div
        v-for="book in books"
        :key="book._id"
        class="book"
        @click="goToBookDetail(book)"
      >
        <h3 class="title">{{ book.title }}</h3>
        <p><strong>Автор:</strong> {{ book.author }}</p>
        <p><strong>Жанр:</strong> {{ book.genre }}</p>
        <p><strong>Год:</strong> {{ book.year }}</p>
        <p><strong>Копий:</strong> {{ book.copies }}</p>
      </div>

      <p v-if="books.length === 0" class="no-books">
        Книги жанра «Приключение» не найдены или данные загружаются.
      </p>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'Adventure',
  data() {
    return {
      books: [],
    };
  },
  mounted() {
    this.fetchBooks();
  },
  methods: {
    async fetchBooks() {
      try {
        const response = await axios.get('http://localhost:3000/books/genre/Приключение');
        if (Array.isArray(response.data)) {
          this.books = response.data;
        } else {
          console.error('Некорректный формат данных:', response.data);
          this.books = [];
        }
      } catch (error) {
        console.error('Ошибка загрузки книг:', error);
        this.books = [];
      }
    },
    goToBookDetail(book) {
      const encodedTitle = encodeURIComponent(book.title);
      this.$router.push({ name: 'BookDetail', params: { title: encodedTitle } });
    },
  },
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
  background-color: #003060;
  width: 100%;
  max-width: 1920px;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  padding: 20px;
  display: flex;
  justify-content: flex-start;
  align-items: center;
}
.header-ul {
  list-style: none;
  display: flex;
  margin-left: 20px;
}
.back-btn {
  cursor: pointer;
  color: #F6EEE1;
  font-size: 18px;
  padding: 10px 20px;
  border: 2px solid #F6EEE1;
  border-radius: 25px;
  transition: all 0.4s ease;
}
.back-btn:hover {
  background-color: #F6EEE1;
  color: #003060;
  transform: rotate(5deg) scale(1.1);
  box-shadow: 0 5px 15px rgba(246, 238, 225, 0.3);
}
.books-container {
  margin: 120px 20px 0;
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  justify-content: center;
}
.book {
  background-color: rgba(246, 238, 225, 0.9);
  padding: 20px;
  border-radius: 15px;
  width: 220px;
  cursor: pointer;
  color: #003060;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15);
  transition: transform 0.3s ease;
  text-align: center;
}
.book:hover {
  transform: scale(1.05);
}
.title {
  font-size: 20px;
  margin-bottom: 10px;
}
.no-books {
  width: 100%;
  text-align: center;
  font-size: 18px;
  margin-top: 50px;
  color: #F6EEE1;
}
@media (max-width: 768px) {
  .books-page {
    padding: 4%;
    padding-top: 8%;
  }
  
  .header {
    position: relative;
    padding: 6% 4%;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    max-width: none;
    margin-top: 5vh;
  }
  
  .header h1 {
    font-size: 1.8rem;
    margin-bottom: 0;
    text-align: left;
    width: auto;
  }
  
  .header-ul {
    margin-left: 38vw;
    width: auto;
    justify-content: flex-end;
  }
  
  .back-btn {
    font-size: 1rem;
    padding: 7% 14%;
    border-radius: 1rem;
    border-width: 0.125rem;
  }
  
  .books-container {
    margin: 5% 0 0 0 !important;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 4%;
    padding: 0 2%;
    justify-content: stretch;
  }
  
  .book {
    width: 100%;
    padding: 4%;
    border-radius: 1rem;
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
    margin-top: 10%;
    padding: 5%;
  }
}

@media (max-width: 480px) {
  .books-page {
    padding: 3%;
  }
  
  .header {
    padding: 3%;
  }
  
  .header h1 {
    font-size: 1.5rem;
  }
  
  .back-btn {
    font-size: 0.9rem;
    padding: 5% 10%;
  }
  
  .books-container {
    gap: 3%;
    padding: 0 1%;
  }
  
  .book {
    padding: 5%;
    min-height: 10rem;
  }
  
  .title {
    font-size: 0.9rem;
  }
  
  .book p {
    font-size: 0.8rem;
  }
}
</style>

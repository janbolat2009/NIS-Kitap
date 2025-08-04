<template>
  <div class="search-results">
    <h2>Результаты поиска</h2>
    <div v-if="results.length" class="books-container">
      <div v-for="book in results" :key="book.title" class="book-item" @click="$emit('book-click', book)">
        <h3>{{ book.title }}</h3>
        <p><strong>Автор:</strong> {{ book.author }}</p>
        <p><strong>Жанр:</strong> {{ book.genre }}</p>
        <p><strong>Описание:</strong> {{ book.description }}</p>
      </div>
    </div>
    <p v-else class="no-results">Нет результатов.</p>
  </div>
</template>

<script>
export default {
  props: {
    results: Array,
  },
};
</script>

<style scoped>
.search-results {
  color: #003060;
  padding: 20px;
}

.books-container {
  max-height: 60vh;
  overflow-y: auto;
  padding-right: 10px;
}

.book-item {
  background-color: #F6EEE1;
  padding: 15px;
  margin-bottom: 15px;
  border-radius: 10px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
}

.book-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
  background-color: #E0D1C1;
}

.book-item h3 {
  color: #003060;
  margin-bottom: 10px;
  font-size: 1.2em;
  transition: color 0.3s ease;
}

.book-item:hover h3 {
  color: #0056b3;
}

.book-item p {
  color: #444;
  margin: 5px 0;
  font-size: 0.9em;
}

.no-results {
  text-align: center;
  color: #666;
  font-size: 1em;
  margin-top: 20px;
}

@media (max-width: 768px) {
  .search-results {
    padding: 10px;
  }

  .book-item {
    padding: 10px;
    margin-bottom: 10px;
  }

  .book-item h3 {
    font-size: 1em;
  }

  .book-item p {
    font-size: 0.8em;
  }

  .no-results {
    font-size: 0.9em;
  }
}
</style>
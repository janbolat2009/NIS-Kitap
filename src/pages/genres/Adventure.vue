<template>
  <GenreBookView 
    genre-title="Приключения"
    :genre-icon="icon"
    genre-desc="Дальние странствия, морские экспедиции, поиски сокровищ и испытания силы духа"
  />
</template>

<script>
import GenreBookView from '@/components/GenreBookView.vue';
import icon from '@/img/icons8_adventures.png';

export default {
  name: 'Adventure',
  components: { GenreBookView },
  setup() {
    return { icon };
  },
};
</script>

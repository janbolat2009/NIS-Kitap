<template>
  <GenreBookView 
    genre-title="Поэзия"
    :genre-icon="icon"
    genre-desc="Шедевры поэтического слова, классические стихи, философские поэмы и современные авторы"
  />
</template>

<script>
import GenreBookView from '@/components/GenreBookView.vue';
import icon from '@/img/streamline-ultimate_playlist-songs-bold.png';

export default {
  name: 'Poetry',
  components: { GenreBookView },
  setup() {
    return { icon };
  },
};
</script>

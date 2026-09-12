<template>
  <GenreBookView 
    genre-title="Фантастика"
    :genre-icon="icon"
    genre-desc="Научная фантастика, космические одиссеи, искусственный интеллект и неизведанные миры будущего"
  />
</template>

<script>
import GenreBookView from '@/components/GenreBookView.vue';
import icon from '@/img/Fantastic.png';

export default {
  name: 'Fantastica',
  components: { GenreBookView },
  setup() {
    return { icon };
  },
};
</script>

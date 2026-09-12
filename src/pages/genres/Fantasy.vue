<template>
  <GenreBookView 
    genre-title="Фэнтези"
    :genre-icon="icon"
    genre-desc="Магические королевства, древние пророчества, эпические битвы и легендарные герои"
  />
</template>

<script>
import GenreBookView from '@/components/GenreBookView.vue';
import icon from '@/img/mdi_fantasy.png';

export default {
  name: 'Fantasy',
  components: { GenreBookView },
  setup() {
    return { icon };
  },
};
</script>

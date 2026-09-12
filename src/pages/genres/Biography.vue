<template>
  <GenreBookView 
    genre-title="Биография"
    :genre-icon="icon"
    genre-desc="Подлинные истории выдающихся ученых, мыслителей, писателей и исторических лидеров"
  />
</template>

<script>
import GenreBookView from '@/components/GenreBookView.vue';
import icon from '@/img/mdi_biography.png';

export default {
  name: 'Biography',
  components: { GenreBookView },
  setup() {
    return { icon };
  },
};
</script>
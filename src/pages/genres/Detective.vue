<template>
  <GenreBookView 
    genre-title="Детектив"
    :genre-icon="icon"
    genre-desc="Запутанные тайны, дедуктивные расследования, криминальные загадки и психологическое напряжение"
  />
</template>

<script>
import GenreBookView from '@/components/GenreBookView.vue';
import icon from '@/img/ph_detective-fill.png';

export default {
  name: 'Detective',
  components: { GenreBookView },
  setup() {
    return { icon };
  },
};
</script>

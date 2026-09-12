<template>
  <GenreBookView 
    genre-title="Романтика"
    :genre-icon="icon"
    genre-desc="Глубокие чувства, искренние переживания, душевные драмы и трогательные истории любви"
  />
</template>

<script>
import GenreBookView from '@/components/GenreBookView.vue';
import icon from '@/img/devicon-plain_love2d.png';

export default {
  name: 'Romantica',
  components: { GenreBookView },
  setup() {
    return { icon };
  },
};
</script>

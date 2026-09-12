<template>
  <LanguageBookView 
    language-title="Русский"
    language-display-name="Книги на русском языке"
    language-desc="Шедевры мировой классической прозы, научная фантастика, исторические романы и публицистика"
    flag-emoji="🇷🇺"
  />
</template>

<script>
import LanguageBookView from '@/components/LanguageBookView.vue';

export default {
  name: 'RussianBooks',
  components: { LanguageBookView },
};
</script>
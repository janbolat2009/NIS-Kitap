<template>
  <LanguageBookView 
    language-title="English"
    language-display-name="English Books Collection"
    language-desc="World literature in original English, classic fiction, IELTS/SAT academic preparation books, and modern bestsellers"
    flag-emoji="🇬🇧"
  />
</template>

<script>
import LanguageBookView from '@/components/LanguageBookView.vue';

export default {
  name: 'EnglishBooks',
  components: { LanguageBookView },
};
</script>
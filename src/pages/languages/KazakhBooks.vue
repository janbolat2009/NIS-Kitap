<template>
  <LanguageBookView 
    language-title="Казахский"
    language-display-name="Қазақ тіліндегі әдебиет"
    language-desc="Қазақ әдебиетінің алтын қоры, классиктер мұрасы, тарихи дастандар мен заманауи кітаптар"
    flag-emoji="🇰🇿"
  />
</template>

<script>
import LanguageBookView from '@/components/LanguageBookView.vue';

export default {
  name: 'KazakhBooks',
  components: { LanguageBookView },
};
</script>
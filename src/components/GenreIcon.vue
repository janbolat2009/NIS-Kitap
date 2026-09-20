<template>
  <div 
    class="nis-genre-icon-container"
    :style="{ 
      width: `${computedContainerSize}px`, 
      height: `${computedContainerSize}px`,
      color: iconColor 
    }"
  >
    <svg 
      :width="computedIconSize" 
      :height="computedIconSize" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      :stroke-width="strokeWidth" 
      stroke-linecap="round" 
      stroke-linejoin="round"
      class="nis-genre-svg"
    >
      <!-- 1. Саморазвитие (Growth, target, upward progress) -->
      <g v-if="resolvedKey === 'selfDevelopment'">
        <path d="M22 7l-8.5 8.5-5-5L2 17" />
        <path d="M16 7h6v6" />
        <path d="M4 21h16" />
        <circle cx="12" cy="7" r="1.5" fill="currentColor" />
      </g>

      <!-- 2. Приключения (Adventure - Explorer compass) -->
      <g v-else-if="resolvedKey === 'adventure'">
        <circle cx="12" cy="12" r="9" />
        <polygon points="12 3 15 12 12 21 9 12" />
        <line x1="12" y1="3" x2="12" y2="21" />
        <line x1="3" y1="12" x2="21" y2="12" />
      </g>

      <!-- 3. Энциклопедии (Encyclopedia - World knowledge globe) -->
      <g v-else-if="resolvedKey === 'encyclopedia'">
        <circle cx="12" cy="12" r="9" />
        <path d="M3.6 9h16.8" />
        <path d="M3.6 15h16.8" />
        <path d="M12 3a13 13 0 0 0 0 18" />
        <path d="M12 3a13 13 0 0 1 0 18" />
      </g>

      <!-- 4. Фэнтези (Fantasy - Magic wand & starbursts) -->
      <g v-else-if="resolvedKey === 'fantasy'">
        <path d="M15 4l5 5L7 22H2v-5L15 4z" />
        <path d="M17 2v2 M19 4h2" />
        <path d="M11 3l-.6 1.4L9 5l1.4.6L11 7l.6-1.4L13 5l-1.4-.6z" fill="currentColor" />
        <path d="M4 10l-.5 1-1 .5 1 .5.5 1 .5-1 1-.5-1-.5z" fill="currentColor" />
      </g>

      <!-- 5. Детектив (Detective - Sleuth magnifying glass & focal mark) -->
      <g v-else-if="resolvedKey === 'detective'">
        <circle cx="11" cy="11" r="7" />
        <line x1="21" y1="21" x2="16.5" y2="16.5" />
        <circle cx="11" cy="11" r="2.5" />
      </g>

      <!-- 6. Биография (Biography - Profile medal & memoir) -->
      <g v-else-if="resolvedKey === 'biography'">
        <circle cx="12" cy="7" r="4" />
        <path d="M5 21v-2a6 6 0 0 1 14 0v2" />
        <path d="M19 8l2 2-2 2" />
      </g>

      <!-- 7. Романтика (Romance - Harmonious hearts) -->
      <g v-else-if="resolvedKey === 'romantica'">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </g>

      <!-- 8. Фантастика (Sci-Fi - Atomic cosmos & planetary orbit) -->
      <g v-else-if="resolvedKey === 'fantastica'">
        <ellipse cx="12" cy="12" rx="9" ry="3.8" transform="rotate(30 12 12)" />
        <ellipse cx="12" cy="12" rx="9" ry="3.8" transform="rotate(-30 12 12)" />
        <circle cx="12" cy="12" r="2.5" fill="currentColor" />
      </g>

      <!-- 9. Учебники (Textbooks - Academic graduation mortarboard) -->
      <g v-else-if="resolvedKey === 'textbooks'">
        <polygon points="12 3 22 8 12 13 2 8 12 3" />
        <path d="M6 10.5v5.5c0 2 3 3.5 6 3.5s6-1.5 6-3.5v-5.5" />
        <line x1="22" y1="8" x2="22" y2="15" />
      </g>

      <!-- 10. Методические пособия (Teacher guides - Pedagogy checklist clipboard) -->
      <g v-else-if="resolvedKey === 'teacherGuides'">
        <rect x="4" y="4" width="16" height="17" rx="2" />
        <path d="M9 2h6v3H9z" />
        <path d="M8 10h8" />
        <path d="M8 14h6" />
        <circle cx="8" cy="18" r="0.75" fill="currentColor" />
      </g>

      <!-- 11. Поэзия (Poetry - Feather quill pen) -->
      <g v-else-if="resolvedKey === 'poetry'">
        <path d="M20.24 2.76a4 4 0 0 0-5.66 0L3 14.34V20h5.66L20.24 8.42a4 4 0 0 0 0-5.66z" />
        <line x1="15" y1="6" x2="18" y2="9" />
        <path d="M3 20c1.5-2.5 3-3 5-3" />
      </g>

      <!-- 12. Классика (Classics - Classical temple column) -->
      <g v-else-if="resolvedKey === 'classics'">
        <path d="M4 4h16 M4 20h16" />
        <line x1="7" y1="4" x2="7" y2="20" />
        <line x1="12" y1="4" x2="12" y2="20" />
        <line x1="17" y1="4" x2="17" y2="20" />
        <path d="M5 4c0-1.1 1-2 2-2h10c1 0 2 .9 2 2" />
      </g>

      <!-- 13. Драма (Drama - Dual theater masks) -->
      <g v-else-if="resolvedKey === 'drama'">
        <circle cx="9" cy="11" r="7" />
        <circle cx="7" cy="10" r="0.8" fill="currentColor" />
        <circle cx="11" cy="10" r="0.8" fill="currentColor" />
        <path d="M7 14c.7.8 2.3.8 3 0" />
        <path d="M15 7a7 7 0 0 1 2 11" />
        <path d="M18 14c-.6-.7-1.4-.7-2 0" />
      </g>

      <!-- 14. Сказки (Fairy tales - Enchanted crescent & star) -->
      <g v-else-if="resolvedKey === 'fairyTales'">
        <path d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.32 5.32 0 0 1-4.4 2.26 5.5 5.5 0 0 1-5.5-5.5c0-1.8 1-3.3 2.4-4.2-.4-.1-.8-.2-1.4-.2z" />
        <path d="M18 2v3 M19.5 3.5h-3" />
        <circle cx="18" cy="3.5" r="0.5" fill="currentColor" />
      </g>

      <!-- 15. Математика (Mathematics - Pi symbol, geometry, calculus) -->
      <g v-else-if="resolvedKey === 'mathematics'">
        <line x1="4" y1="5" x2="20" y2="5" />
        <path d="M8 5v13c0 1.5-1 2-2.5 2" />
        <path d="M16 5v14c0 .8.5 1 1.5 1" />
        <path d="M3 16l2-2 3 3" />
      </g>

      <!-- 16. Физика (Physics - Quantum nucleus & orbital electrons) -->
      <g v-else-if="resolvedKey === 'physics'">
        <circle cx="12" cy="12" r="2.8" fill="currentColor" />
        <ellipse cx="12" cy="12" rx="9.5" ry="3.8" transform="rotate(45 12 12)" />
        <ellipse cx="12" cy="12" rx="9.5" ry="3.8" transform="rotate(-45 12 12)" />
      </g>

      <!-- 17. Химия (Chemistry - Lab conical flask with reaction) -->
      <g v-else-if="resolvedKey === 'chemistry'">
        <path d="M10 2v5.5L4.5 18a2 2 0 0 0 1.7 3h11.6a2 2 0 0 0 1.7-3L14 7.5V2" />
        <line x1="8.5" y1="2" x2="15.5" y2="2" />
        <path d="M6.5 15h11" />
        <circle cx="9.5" cy="12" r="0.9" fill="currentColor" />
        <circle cx="14" cy="13.5" r="0.75" fill="currentColor" />
      </g>

      <!-- 18. Биология (Biology - Sprouting organic leaf & life helix) -->
      <g v-else-if="resolvedKey === 'biology'">
        <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 20 2c0 3-.5 4.5-1.6 10.2A7 7 0 0 1 11 20z" />
        <path d="M2 22l9-9" />
        <circle cx="7.5" cy="9" r="1.3" />
      </g>

      <!-- 19. Информатика (Computer Science - Laptop & code brackets) -->
      <g v-else-if="resolvedKey === 'computerScience'">
        <rect x="3" y="4" width="18" height="12" rx="2" />
        <path d="M2 20h20" />
        <path d="M8 8.5l-2 1.5 2 1.5" />
        <path d="M16 8.5l2 1.5-2 1.5" />
        <line x1="13" y1="8" x2="11" y2="12" />
      </g>

      <!-- 20. История (History - Hourglass of time & historical era) -->
      <g v-else-if="resolvedKey === 'history'">
        <path d="M5 3h14v2a7 7 0 0 1-5 6.7V12a7 7 0 0 1 5 6.7V21H5v-2.3A7 7 0 0 1 10 12v-.3A7 7 0 0 1 5 5V3z" />
        <path d="M9 7h6" />
        <path d="M9 17h6" />
        <circle cx="12" cy="15" r="1" fill="currentColor" />
      </g>

      <!-- 21. Изучение языков (Languages - Multilingual dialogue bubbles) -->
      <g v-else-if="resolvedKey === 'languages'">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        <path d="M7.5 9h4" />
        <path d="M9.5 7v5" />
        <path d="M13.5 13l2-5 2 5" />
        <path d="M14.3 11.5h2.4" />
      </g>

      <!-- 22. Философия (Philosophy - Thinker lamp of wisdom) -->
      <g v-else-if="resolvedKey === 'philosophy'">
        <circle cx="12" cy="7" r="4" />
        <path d="M12 11v4" />
        <path d="M8 15h8" />
        <path d="M7 19h10" />
        <path d="M9 22h6" />
        <line x1="12" y1="3" x2="12" y2="1" />
      </g>

      <!-- 23. Искусство и культура (Art - Paint palette & brush) -->
      <g v-else-if="resolvedKey === 'art'">
        <path d="M12 2C6.5 2 2 6.5 2 12c0 2.2 1.3 4.1 3.2 5 .7.3 1.3.9 1.3 1.7 0 1.1.9 2 2 2h1.5c4.4 0 8-3.6 8-8 0-5.5-4.5-9.7-6-9.7z" />
        <circle cx="7.5" cy="9.5" r="1.3" fill="currentColor" />
        <circle cx="12" cy="6.5" r="1.3" fill="currentColor" />
        <circle cx="16.5" cy="9.5" r="1.3" fill="currentColor" />
        <circle cx="16" cy="14" r="1.3" fill="currentColor" />
      </g>

      <!-- 24. Литературоведение (Literary Studies - Folio manuscript with analysis lens) -->
      <g v-else-if="resolvedKey === 'literaryStudies'">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        <circle cx="12" cy="9" r="2.5" />
        <line x1="13.8" y1="10.8" x2="16" y2="13" />
      </g>

      <!-- 25. Детская литература (Children's Literature - Joyful teddy bear / star) -->
      <g v-else-if="resolvedKey === 'childrenLiterature'">
        <circle cx="12" cy="13" r="6.5" />
        <circle cx="6.5" cy="7.5" r="2.5" />
        <circle cx="17.5" cy="7.5" r="2.5" />
        <circle cx="9.5" cy="12" r="0.9" fill="currentColor" />
        <circle cx="14.5" cy="12" r="0.9" fill="currentColor" />
        <path d="M10 15c.7.7 3.3.7 4 0" />
      </g>

      <!-- 26. Экономика и общество (Social Sciences - Economic chart & scales) -->
      <g v-else-if="resolvedKey === 'socialSciences'">
        <line x1="12" y1="3" x2="12" y2="21" />
        <path d="M4 7h16" />
        <path d="M4 7l3 6H1l3-6z" />
        <path d="M20 7l3 6h-6l3-6z" />
        <path d="M9 21h6" />
      </g>

      <!-- 27. Сатира и юмор (Satire & Humor - Comedy smiling theatrical mask) -->
      <g v-else-if="resolvedKey === 'satire'">
        <circle cx="12" cy="12" r="9" />
        <path d="M8 9h2" />
        <circle cx="15" cy="9" r="1" fill="currentColor" />
        <path d="M8 13.5c1 2.5 7 2.5 8 0" />
        <path d="M10 16c.8.8 3.2.8 4 0" fill="currentColor" />
      </g>

      <!-- 28. География (Geography - Folded world map & location pin) -->
      <g v-else-if="resolvedKey === 'geography'">
        <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
        <line x1="8" y1="2" x2="8" y2="18" />
        <line x1="16" y1="6" x2="16" y2="22" />
        <circle cx="12" cy="10" r="1.8" fill="currentColor" />
      </g>

      <!-- 29. Молодежная литература (Young Adult - Dynamic energy & headphones) -->
      <g v-else-if="resolvedKey === 'youngAdult'">
        <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
        <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
        <polygon points="13 6 10 11 12 11 11 15 15 10 13 10" fill="currentColor" />
      </g>

      <!-- 30. Наука (Science - Laboratory microscope & discovery lens) -->
      <g v-else-if="resolvedKey === 'science'">
        <path d="M6 18h8" />
        <path d="M3 22h14" />
        <path d="M10 18a6 6 0 0 0 6-6V7" />
        <rect x="12" y="3" width="8" height="5" rx="1" transform="rotate(30 16 5.5)" />
        <circle cx="10" cy="10" r="1.3" fill="currentColor" />
      </g>

      <!-- Fallback / Default: Classic Open Library Book with ribbon -->
      <g v-else>
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        <line x1="9" y1="7" x2="15" y2="7" />
        <line x1="9" y1="11" x2="14" y2="11" />
      </g>
    </svg>
  </div>
</template>

<script>
import { computed } from 'vue';
import { getGenreMeta } from '@/config/genres';

export default {
  name: 'GenreIcon',
  props: {
    genreKey: {
      type: String,
      default: '',
    },
    genreName: {
      type: String,
      default: '',
    },
    size: {
      type: [Number, String],
      default: 28,
    },
    containerSize: {
      type: [Number, String],
      default: null,
    },
    color: {
      type: String,
      default: '',
    },
    strokeWidth: {
      type: [Number, String],
      default: 1.85,
    },
  },
  setup(props) {
    const resolvedKey = computed(() => {
      const target = (props.genreKey || props.genreName || '').trim();
      if (!target) return 'default';

      // 1. Direct canonical lookup
      const meta = getGenreMeta(target);
      if (meta && meta.key) return meta.key;

      const lower = target.toLowerCase();

      // 2. Intelligent fuzzy mapping
      if (lower.includes('мат') || lower.includes('math') || lower.includes('алгебр')) return 'mathematics';
      if (lower.includes('физик') || lower.includes('phys')) return 'physics';
      if (lower.includes('хим') || lower.includes('chem')) return 'chemistry';
      if (lower.includes('биол') || lower.includes('bio')) return 'biology';
      if (lower.includes('информ') || lower.includes('comp') || lower.includes('it') || lower.includes('бағдарлама')) return 'computerScience';
      if (lower.includes('истор') || lower.includes('тарих') || lower.includes('hist')) return 'history';
      if (lower.includes('тіл') || lower.includes('язык') || lower.includes('lang') || lower.includes('english')) return 'languages';
      if (lower.includes('филос')) return 'philosophy';
      if (lower.includes('өнер') || lower.includes('иск') || lower.includes('art') || lower.includes('мәден')) return 'art';
      if (lower.includes('әдеб') || lower.includes('лит') || lower.includes('проза')) return 'literaryStudies';
      if (lower.includes('бала') || lower.includes('дет') || lower.includes('ертегі')) return 'childrenLiterature';
      if (lower.includes('экон') || lower.includes('биз') || lower.includes('қарж') || lower.includes('саяс')) return 'socialSciences';
      if (lower.includes('сатир') || lower.includes('әзіл') || lower.includes('юмор')) return 'satire';
      if (lower.includes('геогр') || lower.includes('карт')) return 'geography';
      if (lower.includes('молод') || lower.includes('жас')) return 'youngAdult';
      if (lower.includes('ғылым') || lower.includes('наук') || lower.includes('scien')) return 'science';

      return lower;
    });

    const iconColor = computed(() => {
      if (props.color) return props.color;
      const target = (props.genreKey || props.genreName || '').trim();
      const meta = getGenreMeta(target);
      return meta && meta.accent ? meta.accent : '#38BDF8';
    });

    const computedIconSize = computed(() => Number(props.size) || 28);
    const computedContainerSize = computed(() => {
      if (props.containerSize) return Number(props.containerSize);
      return Number(props.size) || 28;
    });

    return {
      resolvedKey,
      iconColor,
      computedIconSize,
      computedContainerSize,
    };
  },
};
</script>

<style scoped>
.nis-genre-icon-container {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), filter 0.25s ease;
}

.nis-genre-svg {
  display: block;
  flex-shrink: 0;
}
</style>

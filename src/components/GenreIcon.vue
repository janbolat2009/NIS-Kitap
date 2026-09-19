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

      <!-- 7. Романтика (Romance - Harmonious heart) -->
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

      <!-- Fallback / Default: Classic Book -->
      <g v-else>
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        <line x1="9" y1="7" x2="15" y2="7" />
        <line x1="9" y1="11" x2="13" y2="11" />
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
      const target = props.genreKey || props.genreName || '';
      const meta = getGenreMeta(target);
      return meta ? meta.key : target;
    });

    const iconColor = computed(() => {
      if (props.color) return props.color;
      const meta = getGenreMeta(props.genreKey || props.genreName || '');
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

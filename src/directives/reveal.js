// v-reveal: fades a block in when it scrolls into view.
// Respects prefers-reduced-motion and does nothing without IntersectionObserver.
// Usage: <section v-reveal> or <div v-reveal="{ delay: 80 }">
const reduceMotion = () => typeof window !== 'undefined'
  && window.matchMedia
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let observer = null;

function getObserver() {
  if (observer || typeof IntersectionObserver === 'undefined') return observer;
  observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-revealed');
        observer.unobserve(entry.target);
      }
    }
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  return observer;
}

export const reveal = {
  mounted(el, binding) {
    const io = getObserver();
    if (!io || reduceMotion()) return;
    const delay = Number(binding.value?.delay) || 0;
    if (delay) el.style.setProperty('--reveal-delay', `${delay}ms`);
    el.classList.add('reveal-on-scroll');
    io.observe(el);
  },
  unmounted(el) {
    observer?.unobserve(el);
  },
};

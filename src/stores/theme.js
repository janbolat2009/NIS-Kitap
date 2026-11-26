// Colour theme: 'light' | 'dark', with 'system' meaning «follow the device».
// public/theme-init.js applies the theme before the first paint; this store keeps
// it in sync afterwards and saves the reader's choice.
import { ref } from 'vue';

const KEY = 'nis_kitap_theme';
const media = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

function readPref() {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'light' || v === 'dark' ? v : 'system';
  } catch {
    return 'system';
  }
}

export const themePref = ref(readPref());
export const theme = ref(typeof document !== 'undefined' ? document.documentElement.dataset.theme || 'light' : 'light');

function resolved(pref) {
  if (pref === 'light' || pref === 'dark') return pref;
  return media && media.matches ? 'dark' : 'light';
}

function apply(value) {
  theme.value = value;
  const root = document.documentElement;
  root.dataset.theme = value;
  root.style.colorScheme = value;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', value === 'dark' ? '#0f1318' : '#f6f4ef');
}

export function setTheme(pref) {
  themePref.value = pref;
  try {
    if (pref === 'system') localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, pref);
  } catch {
    // private mode: the choice lasts for this page only
  }
  apply(resolved(pref));
}

export function toggleTheme() {
  setTheme(theme.value === 'dark' ? 'light' : 'dark');
}

export function initTheme() {
  apply(resolved(themePref.value));
  if (media) {
    const onChange = () => {
      if (themePref.value === 'system') apply(resolved('system'));
    };
    if (media.addEventListener) media.addEventListener('change', onChange);
    else if (media.addListener) media.addListener(onChange);
  }
  // Colour transitions only after the first paint.
  requestAnimationFrame(() => document.documentElement.classList.add('theme-ready'));
}

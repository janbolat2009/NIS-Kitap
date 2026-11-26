// Global UI state: the sign-in dialog and short notifications.
import { reactive } from 'vue';

export const ui = reactive({
  authOpen: false,
  authMode: 'login',
  toasts: [],
});

export function openLogin(mode = 'login') {
  ui.authMode = mode === 'register' ? 'register' : 'login';
  ui.authOpen = true;
}

export function closeAuth() {
  ui.authOpen = false;
}

let seq = 0;
export function toast(message, { type = 'info', timeout = 3600 } = {}) {
  const id = ++seq;
  ui.toasts.push({ id, message, type });
  setTimeout(() => {
    const i = ui.toasts.findIndex((t) => t.id === id);
    if (i >= 0) ui.toasts.splice(i, 1);
  }, timeout);
}

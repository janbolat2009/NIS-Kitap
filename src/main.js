import { createApp } from 'vue';
import '@fontsource-variable/montserrat';
import '@fontsource-variable/manrope';
import Root from './Root.vue';
import router from './router';
import { startSession } from './stores/session';
import { initTheme } from './stores/theme';
import { reveal } from './directives/reveal';
import './assets/main.css';
import './assets/ui.css';

initTheme();
startSession();

const app = createApp(Root);
app.directive('reveal', reveal);
app.use(router);
app.mount('#app');

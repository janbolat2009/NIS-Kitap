import { createApp } from 'vue';
import Root from './Root.vue';
import router from './router';
import { startSession } from './stores/session';
import { reveal } from './directives/reveal';
import './assets/main.css';
import './assets/ui.css';

startSession();

const app = createApp(Root);

app.directive('reveal', reveal);
app.use(router);

app.mount('#app');

import './styles/tokens.css';
import './styles/reset.css';
import './styles/base.css';
import './styles/header.css';
import './styles/preloader.css';
import './styles/hero.css';
import './styles/vitrine.css';

import { initPreloader } from './scripts/preloader.js';
import { initMenu } from './scripts/menu.js';
import { initField } from './scripts/field.js';
import { initReveal } from './scripts/reveal.js';

initPreloader();
initMenu();
initField();
initReveal();

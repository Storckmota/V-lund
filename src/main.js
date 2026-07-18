import './styles/tokens.css';
import './styles/reset.css';
import './styles/base.css';
import './styles/header.css';
import './styles/hero.css';
import './styles/vitrine.css';

import { initPreloader } from './scripts/preloader.js';
import { initReveal } from './scripts/reveal.js';
import { initAtmosphere } from './scripts/atmosphere.js';
import { initMonument } from './scripts/monument.js';

initPreloader();
initReveal();
initAtmosphere();
initMonument();

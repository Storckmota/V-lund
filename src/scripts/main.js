import '../styles/tokens.css';
import '../styles/base.css';
import '../styles/layout.css';
import '../styles/navigation.css';
import '../styles/preloader.css';
import '../styles/hero.css';
import '../styles/works.css';
import '../styles/sections.css';
import '../styles/close.css';
import '../styles/motion.css';
import '../styles/responsive.css';

import { initNavigation } from './navigation.js';
import { initField } from './field.js';
import { initPreloader } from './preloader.js';
import { initHero } from './hero.js';
import { initScroll } from './scroll.js';
import { initFooter } from './footer.js';

initNavigation();
initField();
initPreloader();
initHero();
initScroll();
initFooter();

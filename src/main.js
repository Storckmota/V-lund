import './styles/tokens.css';
import './styles/reset.css';
import './styles/base.css';
import './styles/header.css';
import './styles/hero.css';
import './styles/below-fold.css';

import { initPreloader } from './scripts/preloader.js';
import { bindPointerField } from './scripts/pointer-field.js';
import { initAtmosphere } from './scripts/atmosphere.js';
import { initMonument } from './scripts/monument.js';
import { initCtaSplit } from './scripts/cta.js';
import { initBelowFold } from './scripts/below-fold.js';

initPreloader();
bindPointerField();
initAtmosphere();
initMonument();
initCtaSplit();
initBelowFold();

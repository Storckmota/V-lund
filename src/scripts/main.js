import '../styles/tokens.css';
import '../styles/base.css';
import '../styles/layout.css';
import '../styles/navigation.css';
import '../styles/hero.css';
import '../styles/projects.css';
import '../styles/sections.css';
import '../styles/footer.css';
import '../styles/motion.css';
import '../styles/responsive.css';

import { initNavigation } from './navigation.js';
import { initMotion } from './motion.js';
import { initProjects } from './projects.js';

initNavigation();
initProjects();
initMotion();

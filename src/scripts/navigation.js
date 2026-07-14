/* Header, menu mobile e índice de serviços */
export function initNavigation() {
  initHeader();
  initMenu();
  initServicos();
}

function initHeader() {
  const header = document.querySelector('[data-header]');
  if (!header) return;

  const update = () => {
    header.classList.toggle('is-solid', window.scrollY > 8);
  };

  update();
  window.addEventListener('scroll', update, { passive: true });
}

function initMenu() {
  const toggle = document.querySelector('[data-menu-toggle]');
  const menu = document.querySelector('[data-menu]');
  if (!toggle || !menu) return;

  const label = toggle.querySelector('[data-menu-label]');
  const links = menu.querySelectorAll('[data-menu-link]');

  const setOpen = (open, { focus = true } = {}) => {
    toggle.setAttribute('aria-expanded', String(open));
    menu.hidden = !open;
    document.body.classList.toggle('menu-open', open);
    if (label) label.textContent = open ? 'Fechar' : 'Menu';
    if (open && focus) {
      links[0]?.focus();
    }
  };

  toggle.addEventListener('click', () => {
    setOpen(menu.hidden);
  });

  links.forEach((link) => {
    link.addEventListener('click', () => setOpen(false, { focus: false }));
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !menu.hidden) {
      setOpen(false, { focus: false });
      toggle.focus();
    }
  });
}

function initServicos() {
  const toggles = document.querySelectorAll('[data-serv-toggle]');

  toggles.forEach((toggle, index) => {
    const panel = document.getElementById(toggle.getAttribute('aria-controls'));
    if (!panel) return;

    // Estado inicial: primeiro item aberto, demais recolhidos
    if (index > 0) {
      toggle.setAttribute('aria-expanded', 'false');
      panel.setAttribute('data-collapsed', '');
    }

    toggle.addEventListener('click', () => {
      const expanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!expanded));
      if (expanded) {
        panel.setAttribute('data-collapsed', '');
      } else {
        panel.removeAttribute('data-collapsed');
      }
    });
  });
}

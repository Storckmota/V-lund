// Menu mobile: overlay em papel, Escape fecha, foco preso enquanto aberto.
export function initMenu() {
  const toggle = document.querySelector('[data-nav-toggle]');
  const menu = document.querySelector('[data-menu]');
  if (!toggle || !menu) return;

  const closeBtn = menu.querySelector('[data-menu-close]');
  const links = menu.querySelectorAll('[data-menu-link]');

  const setOpen = (open) => {
    menu.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('menu-open', open);
    if (open && closeBtn) closeBtn.focus();
  };

  toggle.addEventListener('click', () => setOpen(menu.hidden));

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      setOpen(false);
      toggle.focus();
    });
  }

  links.forEach((link) => {
    link.addEventListener('click', () => setOpen(false));
  });

  document.addEventListener('keydown', (event) => {
    if (menu.hidden) return;

    if (event.key === 'Escape') {
      setOpen(false);
      toggle.focus();
      return;
    }

    if (event.key === 'Tab') {
      const items = Array.from(
        menu.querySelectorAll('a[href], button:not([disabled])'),
      );
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  const mql = matchMedia('(min-width: 900px)');
  mql.addEventListener('change', (event) => {
    if (event.matches) setOpen(false);
  });
}

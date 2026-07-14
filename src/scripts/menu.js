// Menu mobile: overlay em tinta com foco gerenciado, Escape e aria-expanded.
export function initMenu() {
  const toggle = document.querySelector('[data-nav-toggle]');
  const menu = document.querySelector('[data-menu]');
  const toggleText = toggle.querySelector('[data-toggle-text]');
  const links = menu.querySelectorAll('[data-menu-link]');

  function focusables() {
    return menu.querySelectorAll('a[href], button:not([disabled])');
  }

  function open() {
    menu.hidden = false;
    document.body.classList.add('menu-open');
    toggle.setAttribute('aria-expanded', 'true');
    toggleText.textContent = 'Fechar';
    const first = focusables()[0];
    if (first) first.focus();
    document.addEventListener('keydown', onKeydown);
  }

  function close(returnFocus = true) {
    menu.hidden = true;
    document.body.classList.remove('menu-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggleText.textContent = 'Menu';
    document.removeEventListener('keydown', onKeydown);
    if (returnFocus) toggle.focus();
  }

  function onKeydown(event) {
    if (event.key === 'Escape') {
      close();
      return;
    }
    if (event.key !== 'Tab') return;

    // Foco circula entre o toggle (no header) e os itens do overlay.
    const items = [toggle, ...focusables()];
    const firstItem = items[0];
    const lastItem = items[items.length - 1];
    if (event.shiftKey && document.activeElement === firstItem) {
      event.preventDefault();
      lastItem.focus();
    } else if (!event.shiftKey && document.activeElement === lastItem) {
      event.preventDefault();
      firstItem.focus();
    }
  }

  toggle.addEventListener('click', () => {
    if (menu.hidden) open();
    else close();
  });

  links.forEach((link) => {
    link.addEventListener('click', () => close(false));
  });
}

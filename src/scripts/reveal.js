// Revelação por rolagem: mesma linguagem de máscara da hero.
export function initReveal() {
  const els = document.querySelectorAll('.rv');
  if (!els.length) return;

  if (!('IntersectionObserver' in window)) {
    els.forEach((el) => el.classList.add('in'));
    return;
  }

  // elementos mascarados ficam fora do clip do pai antes de revelar,
  // então a interseção é medida no wrapper, não no próprio span
  const pairs = new Map();
  els.forEach((el) => {
    const watch = el.classList.contains('rv--mask') ? el.parentElement : el;
    if (!pairs.has(watch)) pairs.set(watch, []);
    pairs.get(watch).push(el);
  });

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          (pairs.get(entry.target) || []).forEach((el) => el.classList.add('in'));
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2, rootMargin: '0px 0px -8% 0px' },
  );

  pairs.forEach((_, watch) => io.observe(watch));

  const scanVisible = () => {
    pairs.forEach((items, watch) => {
      const rect = watch.getBoundingClientRect();
      const visible = rect.top < window.innerHeight * 0.9 && rect.bottom > window.innerHeight * 0.08;
      if (visible) {
        items.forEach((el) => el.classList.add('in'));
        io.unobserve(watch);
      }
    });
  };

  requestAnimationFrame(scanVisible);
  window.setTimeout(scanVisible, 120);
  window.addEventListener('hashchange', () => requestAnimationFrame(scanVisible));
  window.addEventListener('resize', scanVisible, { passive: true });
  window.addEventListener('scroll', scanVisible, { passive: true });
}

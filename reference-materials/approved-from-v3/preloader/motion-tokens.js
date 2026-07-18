// Referência isolada da v3. Não importar na implementação ativa.
export const DUR = {
  micro: 0.3,
  reveal: 0.8,
  large: 1.2,
};

export const EASE = {
  out: 'power3.out',
  in: 'power3.in',
  mask: 'power2.inOut',
};

export const AMP = {
  rise: 20,
  drift: 6,
  displace: 26,
};

export const reducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const finePointer = () =>
  window.matchMedia('(hover: hover) and (pointer: fine)').matches;

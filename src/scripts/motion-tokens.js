/* Gramática de motion — valores únicos do site (espelham tokens.css).
   Quatro primitivas: suspensão, deslocamento+rastro, máscara, traço de brasa. */

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
  rise: 20,      // px — revelação
  drift: 6,      // px — suspensão
  displace: 26,  // px — deslocamento máximo por cursor
};

export const reducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const finePointer = () =>
  window.matchMedia('(hover: hover) and (pointer: fine)').matches;

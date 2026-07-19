// Estado compartilhado do ponteiro: posição amortecida, velocidade e
// direção do gesto. Atmosfera e monumento leem o mesmo vetor — a
// superfície e os glifos respondem à mesma física, não a fenômenos
// separados. Um único listener global; a integração acontece uma vez
// por quadro, guardada por timestamp (vários loops podem chamar step).

const state = {
  rawX: -1e4,
  rawY: -1e4,
  x: -1e4,
  y: -1e4,
  vx: 0,
  vy: 0,
  speed: 0,
  dirX: 1,
  dirY: 0,
  active: false,
};

let lastFrame = -1;
let bound = false;

export function bindPointerField() {
  if (bound) return state;
  bound = true;
  window.addEventListener(
    'pointermove',
    (e) => {
      state.rawX = e.clientX;
      state.rawY = e.clientY;
      if (!state.active) {
        state.x = e.clientX;
        state.y = e.clientY;
        state.active = true;
      }
    },
    { passive: true },
  );
  return state;
}

export function stepPointerField(now) {
  if (now === lastFrame || !state.active) return state;
  lastFrame = now;
  const px = state.x;
  const py = state.y;
  state.x += (state.rawX - state.x) * 0.16;
  state.y += (state.rawY - state.y) * 0.16;
  state.vx += (state.x - px - state.vx) * 0.22;
  state.vy += (state.y - py - state.vy) * 0.22;
  const sp = Math.hypot(state.vx, state.vy);
  state.speed += (sp - state.speed) * 0.12;
  if (sp > 0.2) {
    state.dirX = state.vx / sp;
    state.dirY = state.vy / sp;
  }
  return state;
}

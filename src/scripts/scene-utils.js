// Utilitários compartilhados pelas cenas.

// Executa a montagem no quadro seguinte e devolve um cleanup válido mesmo
// se o contexto for revertido antes de a montagem acontecer.
//
// Motivo: ao cruzar 900px, o gsap.matchMedia reverte o contexto desktop e
// cria o mobile no mesmo tick. Enquanto isso, os pins do desktop ainda
// estão sendo desfeitos (o pin-spacer é desembrulhado do DOM). Criar
// gatilhos sobre elementos que ainda vivem dentro desse spacer faz o
// ScrollTrigger refrescar um alvo inconsistente e quebrar.
export function adiado(montar) {
  let limpar = null;
  let cancelado = false;
  const quadro = requestAnimationFrame(() => {
    if (cancelado) return;
    limpar = montar();
  });
  return () => {
    cancelado = true;
    cancelAnimationFrame(quadro);
    if (typeof limpar === 'function') limpar();
  };
}

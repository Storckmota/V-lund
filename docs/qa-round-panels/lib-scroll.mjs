// Utilitário de QA: leva um seletor ao topo da viewport de forma confiável
// mesmo com seções pinadas acima. Dentro de um pin, a posição de um
// elemento posterior se desloca conforme o scroll, então a convergência
// direta não fecha. A aproximação por baixo (a partir do fim do documento)
// é estável: passado o último pin, a página volta ao fluxo normal.
export async function irPara(page, seletor, offset = 0) {
  // 1) vai para o fim (todos os pins já resolvidos)
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await new Promise((r) => setTimeout(r, 500));

  // 2) sobe até o alvo cruzar o offset desejado
  for (let i = 0; i < 260; i += 1) {
    const top = await page.evaluate((s) => {
      const el = document.querySelector(s);
      return el ? el.getBoundingClientRect().top : NaN;
    }, seletor);
    if (Number.isNaN(top)) return;
    if (top >= offset - 2) break;
    await page.evaluate((passo) => window.scrollTo(0, window.scrollY - passo), 90);
    await new Promise((r) => setTimeout(r, 45));
  }

  // 3) ajuste fino
  for (let i = 0; i < 8; i += 1) {
    const d = await page.evaluate(
      ({ s, o }) => {
        const el = document.querySelector(s);
        const delta = el.getBoundingClientRect().top - o;
        window.scrollTo(0, window.scrollY + delta);
        return Math.round(delta);
      },
      { s: seletor, o: offset },
    );
    await new Promise((r) => setTimeout(r, 260));
    if (Math.abs(d) < 3) break;
  }
  await new Promise((r) => setTimeout(r, 600));
}

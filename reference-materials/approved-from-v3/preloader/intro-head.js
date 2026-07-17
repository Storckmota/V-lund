// Referência isolada da v3. Não importar na implementação ativa.
document.documentElement.classList.replace('no-js', 'js');

try {
  if (!sessionStorage.getItem('volund-intro') && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.documentElement.classList.add('intro');
  }
} catch (e) {
  // sessão indisponível: segue sem preloader
}

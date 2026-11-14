(() => {
  const button = document.querySelector('.shop-menu');
  const nav = document.getElementById('shop-main-nav');
  if (!button || !nav) return;
  document.documentElement.classList.add('shop-menu-enabled');
  function setOpen(open) {
    button.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('shop-nav-open', open);
  }
  button.addEventListener('click', () => setOpen(button.getAttribute('aria-expanded') === 'false'));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && button.getAttribute('aria-expanded') === 'true') {
      setOpen(false);
      button.focus();
    }
  });
  document.addEventListener('pointerdown', event => {
    if (!nav.contains(event.target) && !button.contains(event.target)) setOpen(false);
  });
})();

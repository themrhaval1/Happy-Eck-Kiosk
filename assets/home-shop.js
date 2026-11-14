(() => {
  const button = document.querySelector('.menu-btn');
  const nav = document.getElementById('nav-links');
  if (!button || !nav) return;
  document.documentElement.classList.add('has-menu');
  function setOpen(open) {
    button.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('open', open);
  }
  button.addEventListener('click', () => setOpen(button.getAttribute('aria-expanded') === 'false'));
  nav.addEventListener('click', event => {
    if (event.target.closest('a')) setOpen(false);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && button.getAttribute('aria-expanded') === 'true' &&
        !document.querySelector('dialog[open]')) {
      setOpen(false);
      button.focus();
    }
  });
  document.addEventListener('pointerdown', event => {
    if (!nav.contains(event.target) && !button.contains(event.target)) setOpen(false);
  });
})();

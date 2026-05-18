window.addEventListener('scroll', () => {
  document.getElementById('c-navbar')
    .classList.toggle('scrolled', window.scrollY > 24);
}, { passive: true });

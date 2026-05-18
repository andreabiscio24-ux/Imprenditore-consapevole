// Fade in sequenziale degli elementi al load
window.addEventListener('load', () => {
  const elements = document.querySelectorAll(
    '.avatar, .brand-name, .brand-author, .brand-tagline, .pills, .page-footer'
  );
  elements.forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(16px)';
    el.style.transition = 'opacity 0.7s ease, transform 0.7s ease';
    setTimeout(() => {
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    }, 80 * i);
  });
});

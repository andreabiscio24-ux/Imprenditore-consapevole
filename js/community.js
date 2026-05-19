window.addEventListener('scroll', () => {
  document.getElementById('c-navbar')
    .classList.toggle('scrolled', window.scrollY > 24);
}, { passive: true });

document.querySelectorAll('.waitlist-form').forEach(form => {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    try {
      const res = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' }
      });
      if (res.ok) {
        form.hidden = true;
        form.nextElementSibling.hidden = false;
      } else {
        btn.disabled = false;
      }
    } catch (_) {
      btn.disabled = false;
    }
  });
});

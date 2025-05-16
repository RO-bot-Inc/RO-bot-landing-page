document.addEventListener('DOMContentLoaded', () => {
  const arrowImage = document.querySelector('.scroll-spin');
  let isScrolling = false;
  let scrollTimeout;

  window.addEventListener('scroll', () => {
    if (!isScrolling) {
      arrowImage.classList.add('spinning');
    }

    isScrolling = true;
    clearTimeout(scrollTimeout);

    scrollTimeout = setTimeout(() => {
      isScrolling = false;
      arrowImage.classList.remove('spinning');
    }, 150);
  });

  const waitlistLinks = document.querySelectorAll('a[href="#waitlist-form"]');

  waitlistLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const form = document.getElementById('waitlist-form');
      form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
});
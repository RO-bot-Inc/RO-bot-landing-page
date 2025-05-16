
document.addEventListener('DOMContentLoaded', () => {
  const waitlistLinks = document.querySelectorAll('a[href="#waitlist-form"]');
  const arrowImage = document.querySelector('.scroll-spin');
  let scrollTimeout;

  let isScrolling = false;

  window.addEventListener('scroll', () => {
    if (!isScrolling) {
      arrowImage.classList.add('spinning');
      isScrolling = true;
    }
    
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      arrowImage.classList.remove('spinning');
      isScrolling = false;
    }, 150);
  });
  
  waitlistLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const form = document.getElementById('waitlist-form');
      form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
});

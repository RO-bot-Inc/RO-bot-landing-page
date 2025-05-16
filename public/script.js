
document.addEventListener('DOMContentLoaded', () => {
  const waitlistLinks = document.querySelectorAll('a[href="#waitlist-form"]');
  const arrowImage = document.querySelector('.scroll-spin');
  let scrollTimeout;

  window.addEventListener('scroll', () => {
    arrowImage.classList.add('spinning');
    
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      arrowImage.classList.remove('spinning');
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

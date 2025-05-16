
document.addEventListener('DOMContentLoaded', () => {
  const waitlistLinks = document.querySelectorAll('a[href="#waitlist-form"]');
  const arrowImage = document.querySelector('.scroll-spin');
  let scrollTimeout;

  let isScrolling = false;

  let lastScrollPosition = window.pageYOffset;
  
  window.addEventListener('scroll', () => {
    const currentScrollPosition = window.pageYOffset;
    
    if (currentScrollPosition !== lastScrollPosition) {
      arrowImage.classList.add('spinning');
      isScrolling = true;
      
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        arrowImage.classList.remove('spinning');
        isScrolling = false;
      }, 150);
    }
    
    lastScrollPosition = currentScrollPosition;
  });
  
  waitlistLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const form = document.getElementById('waitlist-form');
      form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
});

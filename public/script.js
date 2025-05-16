
document.addEventListener('DOMContentLoaded', () => {
  const waitlistLinks = document.querySelectorAll('a[href="#waitlist-form"]');
  const arrowImage = document.querySelector('.scroll-spin');
  let scrollTimeout;

  let currentRotation = 0;
  let isScrolling = false;

  window.addEventListener('scroll', () => {
    if (!isScrolling) {
      isScrolling = true;
      animate();
    }
    
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      isScrolling = false;
    }, 150);
  });

  function animate() {
    if (isScrolling) {
      currentRotation = (currentRotation + 5) % 360;
      arrowImage.style.setProperty('--rotation', `${currentRotation}deg`);
      requestAnimationFrame(animate);
    }
  }
  
  waitlistLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const form = document.getElementById('waitlist-form');
      form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
});

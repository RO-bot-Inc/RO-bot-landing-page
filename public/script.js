
document.addEventListener('DOMContentLoaded', () => {
  const arrowImage = document.querySelector('.scroll-spin');
  let currentRotation = 0;
  let lastScrollTime = Date.now();
  let animationFrameId = null;
  
  function updateRotation() {
    if (Date.now() - lastScrollTime < 50) {
      currentRotation = (currentRotation + 2) % 360;
      arrowImage.style.transform = `translate(-50%, -50%) rotate(${currentRotation}deg)`;
      animationFrameId = requestAnimationFrame(updateRotation);
    }
  }

  window.addEventListener('scroll', () => {
    lastScrollTime = Date.now();
    if (!animationFrameId) {
      animationFrameId = requestAnimationFrame(updateRotation);
    }
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

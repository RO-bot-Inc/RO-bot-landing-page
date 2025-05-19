document.addEventListener('DOMContentLoaded', () => {
  const arrowImage = document.querySelector('.scroll-spin');
  const floatingTexts = document.querySelectorAll('.floating-text');
  let currentRotation = 0;
  let lastScrollPosition = window.pageYOffset;
  let isScrolling = false;
  let scrollTimeout;

  // Text boxes will use fixed positions defined in HTML
  
  window.addEventListener('scroll', () => {
    const currentScrollPosition = window.pageYOffset;
    
    if (currentScrollPosition > lastScrollPosition) {
      currentRotation += 10.5;
    } else {
      currentRotation -= 10.5;
    }
    
    arrowImage.style.transform = `translate(-50%, -50%) rotate(${currentRotation}deg)`;
    
    // Update floating text layer position based on scroll with parallax effect
    const floatingLayer = document.querySelector('.floating-text-layer');
    if (floatingLayer) {
      const parallaxSpeed = 0.7; // Speed factor (0 = fixed, 1 = normal scroll speed)
      const scrollDelta = currentScrollPosition - lastScrollPosition;
      const parallaxDelta = scrollDelta * (1 - parallaxSpeed);
      const currentTransform = floatingLayer.style.transform || 'translateY(0px)';
      const currentY = parseFloat(currentTransform.match(/translateY\(([-\d.]+)px\)/) || [0, 0])[1];
      const newY = currentY - parallaxDelta;
      floatingLayer.style.transform = `translateY(${newY}px)`;
    }
    
    lastScrollPosition = currentScrollPosition;
    
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      isScrolling = false;
    }, 50);
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
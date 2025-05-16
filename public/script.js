document.addEventListener('DOMContentLoaded', () => {
  const arrowImage = document.querySelector('.scroll-spin');
  const floatingTexts = document.querySelectorAll('.floating-text');
  let currentRotation = 0;
  let lastScrollPosition = window.pageYOffset;
  let isScrolling = false;
  let scrollTimeout;

  // Randomly position floating texts
  floatingTexts.forEach(text => {
    if (text) {
      const randomX = Math.random() * 60 + 20; // 20% to 80% of container width
      const randomY = Math.random() * 60 + 20; // 20% to 80% of container height
      text.style.left = `${randomX}%`;
      text.style.top = `${randomY}%`;
    }
  });
  
  window.addEventListener('scroll', () => {
    const currentScrollPosition = window.pageYOffset;
    
    if (currentScrollPosition > lastScrollPosition) {
      currentRotation += 10.5;
    } else {
      currentRotation -= 10.5;
    }
    
    arrowImage.style.transform = `translate(-50%, -50%) rotate(${currentRotation}deg)`;
    
    // Update floating texts position based on scroll
    floatingTexts.forEach((text, index) => {
      const speed = 0.3 + (index * 0.2); // Different speed for each text
      const delta = (lastScrollPosition - currentScrollPosition) * speed;
      const currentTop = parseFloat(text.style.top);
      text.style.top = `${currentTop + delta * 0.1}%`;
      
      // Keep texts within container bounds
      const boundedTop = Math.min(Math.max(20, parseFloat(text.style.top)), 80);
      text.style.top = `${boundedTop}%`;
    });
    
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
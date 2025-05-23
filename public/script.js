document.addEventListener('DOMContentLoaded', () => {
  const arrowImage = document.querySelector('.scroll-spin');
  const floatingTexts = document.querySelectorAll('.floating-text');
  let currentRotation = 0;
  let lastScrollPosition = window.pageYOffset;
  let isScrolling = false;
  let scrollTimeout;
  let animationTriggered = false;

  // Text boxes will use fixed positions defined in HTML
  
  window.addEventListener('scroll', () => {
    const currentScrollPosition = window.pageYOffset;
    
    if (currentScrollPosition > lastScrollPosition) {
      currentRotation += 10.5;
    } else {
      currentRotation -= 10.5;
    }
    
    if (arrowImage) {
      arrowImage.style.transform = `translate(-50%, -50%) rotate(${currentRotation}deg)`;
    }
    
    // Update floating text layer position based on scroll
    const floatingLayer = document.querySelector('.floating-text-layer');
    if (floatingLayer) {
      const scrollSpeed = 0.5;
      const delta = (currentScrollPosition - lastScrollPosition) * scrollSpeed;
      const currentTransform = floatingLayer.style.transform || 'translateY(0px)';
      const currentY = parseFloat(currentTransform.match(/translateY\(([-\d.]+)px\)/) || [0, 0])[1];
      const newY = currentY - delta;
      floatingLayer.style.transform = `translateY(${newY}px)`;
    }
    
    // Check if dipstick image is in view to trigger message bubble animations
    const dipstickContainer = document.getElementById('techSpecsContainer');
    if (dipstickContainer && !animationTriggered) {
      const rect = dipstickContainer.getBoundingClientRect();
      const isInView = (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
      );
      
      if (isInView) {
        animateMessageBubbles();
        animationTriggered = true;
      }
    }
    
    lastScrollPosition = currentScrollPosition;
    
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      isScrolling = false;
    }, 50);
  });

  // Function to animate message bubbles in sequence
  function animateMessageBubbles() {
    const bubbles = document.querySelectorAll('.message-bubble');
    const sortedBubbles = Array.from(bubbles).sort((a, b) => {
      return parseInt(a.dataset.animationOrder) - parseInt(b.dataset.animationOrder);
    });
    
    // Animate the bubbles in order with timing
    sortedBubbles.forEach((bubble, index) => {
      const order = parseInt(bubble.dataset.animationOrder);
      
      // Calculate delay based on animation order
      let delay = 300 * (order - 1);
      
      // Add extra 1 second delay between oil2 and torque (between items 2 and 3)
      if (order > 2) {
        delay += 1000;
      }
      
      setTimeout(() => {
        bubble.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        bubble.style.opacity = '1';
        bubble.style.transform = 'translateY(0)';
      }, delay);
    });
  }

  // Set initial transform for animation
  document.querySelectorAll('.message-bubble').forEach(bubble => {
    bubble.style.transform = 'translateY(20px)';
  });

  // Check if elements are in view on initial page load
  setTimeout(() => {
    const dipstickContainer = document.getElementById('techSpecsContainer');
    if (dipstickContainer) {
      const rect = dipstickContainer.getBoundingClientRect();
      const isInView = (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
      );
      
      if (isInView && !animationTriggered) {
        animateMessageBubbles();
        animationTriggered = true;
      }
    }
  }, 500);

  const waitlistLinks = document.querySelectorAll('a[href="#waitlist-form"]');

  waitlistLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const form = document.getElementById('waitlist-form');
      if (form) {
        form.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
});
document.addEventListener('DOMContentLoaded', () => {
  const arrowImage = document.querySelector('.scroll-spin');
  const floatingTexts = document.querySelectorAll('.floating-text');
  let currentRotation = 0;
  let lastScrollPosition = window.pageYOffset;
  let isScrolling = false;
  let scrollTimeout;
  let animationTriggered = false;
  let inspectionAnimationTriggered = false;
  
  // Function to check if an element is in viewport
  function isElementInViewport(el) {
    const rect = el.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }
  
  // Function to check if element is partially in viewport (more lenient)
  function isElementPartiallyInViewport(el) {
    const rect = el.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    const windowWidth = window.innerWidth || document.documentElement.clientWidth;
    
    return (
      rect.bottom > 0 &&
      rect.right > 0 &&
      rect.top < windowHeight &&
      rect.left < windowWidth
    );
  }
  
  // Function to reset inspection text to invisible state
  function resetInspectionText() {
    const inspectionTexts = document.querySelectorAll('.floating-text');
    inspectionTexts.forEach(text => {
      text.style.opacity = '0';
      text.style.transform = 'translateY(20px)';
    });
    inspectionAnimationTriggered = false;
  }
  
  // Function to animate inspection text in sequence
  function animateInspectionText() {
    const inspectionTexts = document.querySelectorAll('.floating-text');
    
    // Reset all text first
    inspectionTexts.forEach(text => {
      text.style.opacity = '0';
      text.style.transform = 'translateY(20px)';
    });
    
    // Animate each text with delays
    inspectionTexts.forEach((text, index) => {
      let delay;
      if (index === 0) {
        delay = 0; // First line: no delay
      } else if (index === 1) {
        delay = 1500; // Second line: 1 second delay + 500ms from first = 1500ms
      } else {
        delay = 3000; // Third line: 1 second delay + 2000ms from second = 3000ms
      }
      
      setTimeout(() => {
        text.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        text.style.opacity = '1';
        text.style.transform = 'translateY(0)';
      }, delay);
    });
  }
  
  // Function to reset message bubbles to initial invisible state
  function resetMessageBubbles() {
    const bubbles = document.querySelectorAll('.message-bubble');
    bubbles.forEach(bubble => {
      bubble.style.opacity = '0';
      bubble.style.transform = 'translateY(20px)';
    });
    animationTriggered = false;
  }
  
  // Function to animate message bubbles in sequence
  function animateMessageBubbles() {
    const bubbles = document.querySelectorAll('.message-bubble');
    const sortedBubbles = Array.from(bubbles).sort((a, b) => {
      return parseInt(a.dataset.animationOrder) - parseInt(b.dataset.animationOrder);
    });
    
    // Initial pause before starting animations (1 second)
    const initialDelay = 1000;
    
    // Animate the bubbles in order with timing
    sortedBubbles.forEach((bubble, index) => {
      const order = parseInt(bubble.dataset.animationOrder);
      
      // Calculate delay based on animation order and requested pauses
      let delay = initialDelay; // Start with initial 1 second delay
      
      if (order === 1) {
        // First bubble (torque) - after initial 1s delay
        delay = initialDelay;
      } else if (order === 2) {
        // Second bubble (torque2) - 300ms after first
        delay = initialDelay + 300;
      } else if (order === 3) {
        // Third bubble (oil) - 2s pause after second bubble
        delay = initialDelay + 300 + 2000;
      } else if (order === 4) {
        // Fourth bubble (oil2) - 300ms after third
        delay = initialDelay + 300 + 2000 + 300;
      }
      
      setTimeout(() => {
        bubble.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        bubble.style.opacity = '1';
        bubble.style.transform = 'translateY(0)';
      }, delay);
    });
  }
  
  // Check if tech specs container is in view and handle animations
  function checkTechSpecsVisibility() {
    const dipstickContainer = document.getElementById('techSpecsContainer');
    if (dipstickContainer) {
      const isInView = isElementInViewport(dipstickContainer);
      
      if (isInView && !animationTriggered) {
        // Element just came into view, start animation
        animateMessageBubbles();
        animationTriggered = true;
      } else if (!isInView && animationTriggered) {
        // Element just left view, reset animations
        resetMessageBubbles();
      }
    }
  }
  
  // Check if inspection image is in view and handle text animations
  function checkInspectionVisibility() {
    const inspectionImage = document.querySelector('img[src="inspection.png"]');
    if (inspectionImage) {
      const isInView = isElementPartiallyInViewport(inspectionImage);
      
      if (isInView && !inspectionAnimationTriggered) {
        // Inspection image just came into view, start text animation
        animateInspectionText();
        inspectionAnimationTriggered = true;
      } else if (!isInView && inspectionAnimationTriggered) {
        // Inspection image just left view, reset text animations
        resetInspectionText();
      }
    }
  }
  
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
    
    // Check if dipstick container is in view
    checkTechSpecsVisibility();
    
    // Check if inspection image is in view
    checkInspectionVisibility();
    
    lastScrollPosition = currentScrollPosition;
    
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      isScrolling = false;
    }, 50);
  });

  // Set initial state for message bubbles
  document.querySelectorAll('.message-bubble').forEach(bubble => {
    bubble.style.opacity = '0';
    bubble.style.transform = 'translateY(20px)';
  });

  // Set initial state for inspection text
  document.querySelectorAll('.floating-text').forEach(text => {
    text.style.opacity = '0';
    text.style.transform = 'translateY(20px)';
  });

  // Check if elements are in view on initial page load
  setTimeout(() => {
    checkTechSpecsVisibility();
    checkInspectionVisibility();
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
document.addEventListener('DOMContentLoaded', () => {
  const arrowImage = document.querySelector('.scroll-spin');
  const floatingTexts = document.querySelectorAll('.floating-text');
  let currentRotation = 0;
  let lastScrollPosition = window.pageYOffset;
  let scrollTimeout;
  let animationTriggered = false;
  let inspectionAnimationTriggered = false;

  // Simple hero animation variables
  let heroAnimationRunning = false;

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
        delay = 1000; // First line: 1 second delay
      } else if (index === 1) {
        delay = 2500; // Second line: 1 second delay + 1500ms from first = 2500ms
      } else {
        delay = 4000; // Third line: 1 second delay + 3000ms from second = 4000ms
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

    // Only update arrow rotation from scroll if hero animation is not running
    if (!heroAnimationRunning) {
      if (currentScrollPosition > lastScrollPosition) {
        currentRotation += 10.5;
      } else {
        currentRotation -= 10.5;
      }

      if (arrowImage) {
        arrowImage.style.transform = `translate(-50%, -50%) rotate(${currentRotation}deg)`;
      }
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
      // No longer needed
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

  // Simple, elegant hero animation
  function getHeroVideo() {
    return document.querySelector('video[src*="record note"], video[src*="record%20note"], video source[src*="record note"], video source[src*="record%20note"]')?.closest('video');
  }

  function getUpdateStoryVideo() {
    return document.querySelector('video[src*="update story"], video[src*="update%20story"], video source[src*="update story"], video source[src*="update%20story"]')?.closest('video');
  }

  function playVideoOnce(video) {
    return new Promise((resolve) => {
      if (!video) {
        resolve();
        return;
      }

      video.currentTime = 0;
      video.loop = false;

      const onEnd = () => {
        video.removeEventListener('ended', onEnd);
        video.pause();
        resolve();
      };

      video.addEventListener('ended', onEnd);
      video.play().catch(() => resolve());
    });
  }

  function rotateArrows() {
    return new Promise((resolve) => {
      if (!arrowImage) {
        resolve();
        return;
      }

      const startRotation = currentRotation;
      const targetRotation = startRotation + 720; // Two full rotations
      const duration = 2000; // 2 seconds
      const startTime = performance.now();

      function animate(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        currentRotation = startRotation + (targetRotation - startRotation) * progress;
        arrowImage.style.transform = `translate(-50%, -50%) rotate(${currentRotation}deg)`;

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      }

      requestAnimationFrame(animate);
    });
  }

  async function runHeroSequence() {
    if (heroAnimationRunning) return;

    heroAnimationRunning = true;
    const recordVideo = getHeroVideo();
    const updateVideo = getUpdateStoryVideo();

    while (heroAnimationRunning) {
      // Step 1: Play record note video once
      await playVideoOnce(recordVideo);
      if (!heroAnimationRunning) break;

      // Step 2: Rotate arrows twice
      await rotateArrows();
      if (!heroAnimationRunning) break;

      // Step 3: Play update story video once
      await playVideoOnce(updateVideo);
      if (!heroAnimationRunning) break;
    }
  }

  function startHeroAnimation() {
    const recordVideo = getHeroVideo();
    const updateVideo = getUpdateStoryVideo();
    
    if (recordVideo) {
      recordVideo.removeAttribute('autoplay');
      recordVideo.removeAttribute('loop');
      recordVideo.pause();
    }
    
    if (updateVideo) {
      updateVideo.removeAttribute('autoplay');
      updateVideo.removeAttribute('loop');
      updateVideo.pause();
    }

    runHeroSequence();
  }

  function stopHeroAnimation() {
    heroAnimationRunning = false;

    const recordVideo = getHeroVideo();
    const updateVideo = getUpdateStoryVideo();
    
    if (recordVideo) {
      recordVideo.setAttribute('autoplay', '');
      recordVideo.setAttribute('loop', '');
      recordVideo.play();
    }
    
    if (updateVideo) {
      updateVideo.setAttribute('autoplay', '');
      updateVideo.setAttribute('loop', '');
      updateVideo.play();
    }
  }

  // Start hero animation when page loads
  setTimeout(() => {
    checkTechSpecsVisibility();
    checkInspectionVisibility();
    startHeroAnimation();
  }, 500);

  // Waitlist links
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
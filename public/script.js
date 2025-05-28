document.addEventListener('DOMContentLoaded', () => {
  const arrowImage = document.querySelector('.scroll-spin');
  const floatingTexts = document.querySelectorAll('.floating-text');
  let currentRotation = 0;
  let lastScrollPosition = window.pageYOffset;
  let isScrolling = false;
  let scrollTimeout;
  let animationTriggered = false;
  let inspectionAnimationTriggered = false;
  
  // Hero animation sequence variables
  let heroAnimationActive = false;
  let heroSequenceRunning = false; // Prevent multiple sequences from running
  let heroSequenceStep = 0;
  let arrowRotations = 0;
  let heroSequenceInterval;
  
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
    
    // Only update arrow rotation from scroll if hero animation is not active
    if (!heroAnimationActive) {
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

  // Hero animation sequence functions
  function getHeroVideo() {
    // Find video with source containing "record note" or "record%20note"
    const videoWithSource = document.querySelector('video source[src*="record note"], video source[src*="record%20note"]');
    if (videoWithSource) {
      return videoWithSource.parentElement;
    }
    
    // Find video with direct src containing "record note"
    const directVideo = document.querySelector('video[src*="record note"], video[src*="record%20note"]');
    if (directVideo) {
      return directVideo;
    }
    
    return null;
  }
  
  function playVideoOnce(video) {
    return new Promise((resolve) => {
      if (!video) {
        console.log('No video found for playback');
        resolve();
        return;
      }
      
      console.log('Starting video playback');
      video.currentTime = 0;
      video.loop = false; // Ensure loop is disabled
      
      let resolved = false;
      
      const cleanup = () => {
        video.removeEventListener('ended', handleEnded);
        video.removeEventListener('timeupdate', handleTimeUpdate);
        video.removeEventListener('error', handleError);
      };
      
      const handleEnded = () => {
        if (resolved) return;
        resolved = true;
        console.log('Video playback completed');
        cleanup();
        video.pause();
        resolve();
      };
      
      const handleTimeUpdate = () => {
        // Fallback: if video reaches end but ended event doesn't fire
        if (video.currentTime >= video.duration - 0.1 && video.duration > 0) {
          if (resolved) return;
          console.log('Video reached end via timeupdate');
          handleEnded();
        }
      };
      
      const handleError = (e) => {
        if (resolved) return;
        resolved = true;
        console.log('Video play error:', e);
        cleanup();
        resolve();
      };
      
      video.addEventListener('ended', handleEnded);
      video.addEventListener('timeupdate', handleTimeUpdate);
      video.addEventListener('error', handleError);
      
      video.play().catch(e => {
        console.log('Video play failed:', e);
        if (!resolved) {
          resolved = true;
          cleanup();
          resolve();
        }
      });
    });
  }
  
  function rotateArrowsTwice() {
    return new Promise((resolve) => {
      if (!arrowImage) {
        console.log('No arrow image found for rotation');
        resolve();
        return;
      }
      
      console.log('Starting arrow rotation');
      const startRotation = currentRotation;
      const targetRotation = startRotation + 720; // 2 full rotations (360 * 2)
      const duration = 2000; // 2 seconds
      const startTime = Date.now();
      
      function animate() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function for smooth rotation
        const easeProgress = 0.5 - 0.5 * Math.cos(progress * Math.PI);
        currentRotation = startRotation + (targetRotation - startRotation) * easeProgress;
        
        arrowImage.style.transform = `translate(-50%, -50%) rotate(${currentRotation}deg)`;
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          console.log('Arrow rotation completed');
          resolve();
        }
      }
      
      animate();
    });
  }
  
  async function runHeroSequence() {
    if (!heroAnimationActive || heroSequenceRunning) {
      console.log('Hero sequence blocked - active:', heroAnimationActive, 'running:', heroSequenceRunning);
      return;
    }
    
    heroSequenceRunning = true;
    const heroVideo = getHeroVideo();
    console.log('Starting hero sequence, video found:', !!heroVideo);
    
    try {
      // Step 1: Play "record note" video once - wait for it to complete
      console.log('Step 1: Playing video once');
      await playVideoOnce(heroVideo);
      
      if (!heroAnimationActive) {
        heroSequenceRunning = false;
        return;
      }
      console.log('Step 1 complete, starting step 2');
      
      // Step 2: Rotate arrows twice - wait for rotation to complete
      console.log('Step 2: Rotating arrows twice');
      await rotateArrowsTwice();
      
      if (!heroAnimationActive) {
        heroSequenceRunning = false;
        return;
      }
      console.log('Step 2 complete, starting step 3');
      
      // Step 3: Play "record note" video once again - wait for it to complete
      console.log('Step 3: Playing video once more');
      await playVideoOnce(heroVideo);
      
      if (!heroAnimationActive) {
        heroSequenceRunning = false;
        return;
      }
      console.log('Step 3 complete, sequence finished');
      
      // Reset flag before scheduling next sequence
      heroSequenceRunning = false;
      
      // Continue the loop after all steps are complete
      if (heroAnimationActive) {
        console.log('All steps complete, restarting sequence in 1 second');
        setTimeout(() => {
          if (heroAnimationActive && !heroSequenceRunning) {
            runHeroSequence();
          }
        }, 1000); // 1 second pause before next sequence
      }
    } catch (error) {
      console.error('Error in hero sequence:', error);
      heroSequenceRunning = false; // Reset flag on error
      if (heroAnimationActive) {
        setTimeout(() => {
          if (heroAnimationActive && !heroSequenceRunning) {
            runHeroSequence();
          }
        }, 2000); // Retry after error
      }
    }
  }
  
  function startHeroAnimation() {
    if (heroAnimationActive || heroSequenceRunning) return;
    
    heroAnimationActive = true;
    heroSequenceRunning = false; // Reset sequence flag
    
    // Stop the default video autoplay and loop
    const heroVideo = getHeroVideo();
    if (heroVideo) {
      heroVideo.removeAttribute('autoplay');
      heroVideo.removeAttribute('loop');
      heroVideo.pause();
      heroVideo.currentTime = 0;
    }
    
    // Start the sequence
    runHeroSequence();
  }
  
  function stopHeroAnimation() {
    heroAnimationActive = false;
    heroSequenceRunning = false; // Reset sequence flag
    
    // Restore normal video behavior
    const heroVideo = getHeroVideo();
    if (heroVideo) {
      heroVideo.setAttribute('autoplay', '');
      heroVideo.setAttribute('loop', '');
      heroVideo.currentTime = 0;
      heroVideo.play();
    }
  }

  // Check if elements are in view on initial page load and start hero animation
  setTimeout(() => {
    checkTechSpecsVisibility();
    checkInspectionVisibility();
    startHeroAnimation(); // Start hero animation on page load
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
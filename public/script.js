document.addEventListener('DOMContentLoaded', function() {
    // Only disable autoplay on 5-Second Stories video, leave other videos alone
    const storyVideo = document.querySelector('video[src*="update story.mov"], video source[src*="update story.mov"]');
    const actualStoryVideo = storyVideo ? storyVideo.parentElement.tagName === 'VIDEO' ? storyVideo.parentElement : storyVideo : null;

    if (actualStoryVideo) {
        actualStoryVideo.removeAttribute('autoplay');
        actualStoryVideo.pause();
        actualStoryVideo.currentTime = 0;
    }

    // Animation for "Specs At Your Fingertips" message bubbles
    function animateSpecsBubbles() {
        const bubbles = document.querySelectorAll('.message-bubble');

        bubbles.forEach((bubble, index) => {
            const order = parseInt(bubble.getAttribute('data-animation-order'));
            let delay = 0;

            // First pair (Q1, A1): orders 1 and 2
            if (order <= 2) {
                delay = (order - 1) * 800; // 0ms for Q1, 800ms for A1
            }
            // Second pair (Q2, A2): orders 3 and 4 - add 1 second pause after first pair
            else {
                delay = 2 * 800 + 1000 + (order - 3) * 800; // First pair time + 1s pause + timing for second pair
            }

            setTimeout(() => {
                bubble.style.opacity = '1';
                bubble.style.transform = 'translateY(0)';
                bubble.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            }, delay);
        });

        // Hide bubbles after showing them all + 4 second pause
        const totalAnimationTime = 2 * 800 + 1000 + 2 * 800; // First pair + pause + second pair
        setTimeout(() => {
            bubbles.forEach(bubble => {
                bubble.style.opacity = '0';
                bubble.style.transform = 'translateY(10px)';
            });
        }, totalAnimationTime + 4000); // Show for 4 seconds after last bubble
    }

    // Animation for "Smarter Diagnostics" task overlays
    function animateTaskOverlays() {
        const overlays = document.querySelectorAll('.task-overlay');

        overlays.forEach((overlay, index) => {
            const order = parseInt(overlay.getAttribute('data-animation-order'));
            setTimeout(() => {
                overlay.style.opacity = '1';
                overlay.style.transform = 'translateX(0)';
                overlay.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            }, (order - 1) * 600); // 600ms delay between each task
        });

        // Hide overlays after showing them all
        setTimeout(() => {
            overlays.forEach(overlay => {
                overlay.style.opacity = '0';
                overlay.style.transform = 'translateX(20px)';
            });
        }, overlays.length * 600 + 2500); // Show for 2.5 seconds after last overlay
    }

    // Dynamic positioning system for warranty overlays
    function calculateOptimalPositions() {
        const container = document.getElementById('warrantyContainer');
        const overlays = document.querySelectorAll('.warranty-overlay');
        
        if (!container || overlays.length === 0) return;
        
        const containerRect = container.getBoundingClientRect();
        const containerWidth = containerRect.width;
        const containerHeight = containerRect.height;
        const screenWidth = window.innerWidth;
        
        // Define positioning strategies for different screen sizes
        let positions = [];
        
        if (screenWidth <= 640) {
            // Mobile: Smaller sizes for better proportion
            positions = [
                { left: '8%', top: '5%', width: '36vw', maxWidth: '220px', transform: 'none', zIndex: 14 },
                { right: '8%', top: '25%', width: '38vw', maxWidth: '230px', transform: 'none', zIndex: 13 },
                { left: '12%', top: '48%', width: '40vw', maxWidth: '240px', transform: 'none', zIndex: 12 },
                { right: '12%', top: '70%', width: '37vw', maxWidth: '225px', transform: 'none', zIndex: 15 }
            ];
        } else if (screenWidth <= 768) {
            // Small tablet: Reduced sizes
            positions = [
                { left: '3%', top: '8%', width: '28vw', maxWidth: '260px', transform: 'none', zIndex: 14 },
                { right: '3%', top: '20%', width: '30vw', maxWidth: '280px', transform: 'none', zIndex: 13 },
                { left: '3%', bottom: '30%', width: '32vw', maxWidth: '300px', transform: 'none', zIndex: 12 },
                { right: '3%', bottom: '8%', width: '29vw', maxWidth: '270px', transform: 'none', zIndex: 15 }
            ];
        } else if (screenWidth <= 1024) {
            // Medium tablet: More conservative sizing
            positions = [
                { left: '4%', top: '8%', width: '25vw', maxWidth: '280px', transform: 'none', zIndex: 14 },
                { right: '4%', top: '18%', width: '27vw', maxWidth: '300px', transform: 'none', zIndex: 13 },
                { left: '4%', bottom: '26%', width: '29vw', maxWidth: '320px', transform: 'none', zIndex: 12 },
                { right: '4%', bottom: '8%', width: '26vw', maxWidth: '290px', transform: 'none', zIndex: 15 }
            ];
        } else {
            // Large screens: Even smaller for better proportion
            positions = [
                { left: '4%', top: '6%', width: '15vw', maxWidth: '240px', transform: 'none', zIndex: 14 },
                { right: '4%', top: '12%', width: '17vw', maxWidth: '260px', transform: 'none', zIndex: 13 },
                { left: '4%', bottom: '20%', width: '19vw', maxWidth: '280px', transform: 'none', zIndex: 12 },
                { right: '4%', bottom: '18%', width: '16vw', maxWidth: '250px', transform: 'none', zIndex: 16 }
            ];
        }
        
        // Apply calculated positions with overlap detection and adjustment
        overlays.forEach((overlay, index) => {
            if (index >= positions.length) return;
            
            const pos = positions[index];
            overlay.classList.add('positioned');
            
            // Apply base positioning
            Object.entries(pos).forEach(([property, value]) => {
                if (property === 'transform') {
                    overlay.style.transform = value;
                } else if (property === 'zIndex') {
                    overlay.style.zIndex = value;
                } else if (property === 'maxWidth') {
                    overlay.style.maxWidth = value;
                } else {
                    overlay.style[property] = value;
                }
            });
            
            // Clear conflicting positioning
            if (pos.left) overlay.style.right = 'auto';
            if (pos.right) overlay.style.left = 'auto';
            if (pos.top) overlay.style.bottom = 'auto';
            if (pos.bottom) overlay.style.top = 'auto';
        });
        
        // Fine-tune positions to minimize overlap after initial positioning
        setTimeout(() => adjustForOverlaps(overlays, screenWidth), 100);
    }
    
    // Detect and adjust overlapping elements
    function adjustForOverlaps(overlays, screenWidth) {
        const rects = Array.from(overlays).map(overlay => ({
            element: overlay,
            rect: overlay.getBoundingClientRect()
        }));
        
        // Check for overlaps and make micro-adjustments
        for (let i = 0; i < rects.length; i++) {
            for (let j = i + 1; j < rects.length; j++) {
                const overlap = calculateOverlap(rects[i].rect, rects[j].rect);
                if (overlap.area > 0) {
                    // Make small adjustments to reduce overlap
                    adjustOverlappingElements(rects[i].element, rects[j].element, overlap, screenWidth);
                }
            }
        }
    }
    
    // Calculate overlap between two rectangles
    function calculateOverlap(rect1, rect2) {
        const left = Math.max(rect1.left, rect2.left);
        const right = Math.min(rect1.right, rect2.right);
        const top = Math.max(rect1.top, rect2.top);
        const bottom = Math.min(rect1.bottom, rect2.bottom);
        
        const width = Math.max(0, right - left);
        const height = Math.max(0, bottom - top);
        
        return {
            area: width * height,
            width: width,
            height: height
        };
    }
    
    // Make small adjustments to reduce overlap
    function adjustOverlappingElements(elem1, elem2, overlap, screenWidth) {
        // Only make micro-adjustments (max 2-3% movement)
        const maxAdjustment = screenWidth * 0.03;
        
        if (overlap.width > overlap.height) {
            // Horizontal overlap - adjust horizontally
            const adjustment = Math.min(overlap.width / 2, maxAdjustment);
            
            // Handle left-positioned elements
            if (elem1.style.left && elem1.style.left !== 'auto') {
                const currentLeft = parseFloat(elem1.style.left);
                elem1.style.left = Math.max(1, currentLeft - adjustment / screenWidth * 100) + '%';
            }
            
            // Handle right-positioned elements
            if (elem1.style.right && elem1.style.right !== 'auto') {
                const currentRight = parseFloat(elem1.style.right);
                elem1.style.right = Math.max(1, currentRight + adjustment / screenWidth * 100) + '%';
            }
            
            if (elem2.style.left && elem2.style.left !== 'auto') {
                const currentLeft = parseFloat(elem2.style.left);
                elem2.style.left = Math.max(1, currentLeft + adjustment / screenWidth * 100) + '%';
            }
            
            if (elem2.style.right && elem2.style.right !== 'auto') {
                const currentRight = parseFloat(elem2.style.right);
                elem2.style.right = Math.max(1, currentRight - adjustment / screenWidth * 100) + '%';
            }
        } else {
            // Vertical overlap - adjust vertically
            const adjustment = Math.min(overlap.height / 2, maxAdjustment);
            const container = document.getElementById('warrantyContainer');
            const containerHeight = container.getBoundingClientRect().height;
            
            if (elem1.style.top && elem1.style.top !== 'auto') {
                const currentTop = parseFloat(elem1.style.top);
                elem1.style.top = Math.max(1, currentTop - adjustment / containerHeight * 100) + '%';
            }
            
            if (elem2.style.top && elem2.style.top !== 'auto') {
                const currentTop = parseFloat(elem2.style.top);
                elem2.style.top = Math.max(1, currentTop + adjustment / containerHeight * 100) + '%';
            }
            
            if (elem1.style.bottom && elem1.style.bottom !== 'auto') {
                const currentBottom = parseFloat(elem1.style.bottom);
                elem1.style.bottom = Math.max(1, currentBottom + adjustment / containerHeight * 100) + '%';
            }
            
            if (elem2.style.bottom && elem2.style.bottom !== 'auto') {
                const currentBottom = parseFloat(elem2.style.bottom);
                elem2.style.bottom = Math.max(1, currentBottom - adjustment / containerHeight * 100) + '%';
            }
        }
    }

    // Make warranty claim overlays continuously visible with dynamic positioning
    function startWarrantyFloating() {
        calculateOptimalPositions();
        
        const overlays = document.querySelectorAll('.warranty-overlay');
        overlays.forEach((overlay, index) => {
            // Make overlays visible permanently
            overlay.style.opacity = '1';
            overlay.style.transition = 'all 0.3s ease';
        });
    }
    
    // Recalculate positions on window resize
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            const warrantyContainer = document.getElementById('warrantyContainer');
            if (warrantyContainer) {
                calculateOptimalPositions();
            }
        }, 250);
    });

    // Dynamic positioning system for floating text elements
    function adjustFloatingTextPositions() {
        const floatingTexts = document.querySelectorAll('.floating-text');
        if (floatingTexts.length === 0) return;

        const screenWidth = window.innerWidth;
        const containerHeight = window.innerHeight * 0.7; // Approximate hero section height
        
        // Check for overlaps and adjust positions
        const textRects = Array.from(floatingTexts).map(text => ({
            element: text,
            rect: text.getBoundingClientRect()
        }));

        // Apply dynamic adjustments based on screen size and overlap detection
        for (let i = 0; i < textRects.length; i++) {
            for (let j = i + 1; j < textRects.length; j++) {
                const overlap = calculateTextOverlap(textRects[i].rect, textRects[j].rect);
                if (overlap.area > 100) { // Threshold for significant overlap
                    adjustOverlappingText(textRects[i].element, textRects[j].element, overlap, screenWidth);
                }
            }
        }
    }

    // Calculate overlap between two text elements
    function calculateTextOverlap(rect1, rect2) {
        const left = Math.max(rect1.left, rect2.left);
        const right = Math.min(rect1.right, rect2.right);
        const top = Math.max(rect1.top, rect2.top);
        const bottom = Math.min(rect1.bottom, rect2.bottom);
        
        const width = Math.max(0, right - left);
        const height = Math.max(0, bottom - top);
        
        return {
            area: width * height,
            width: width,
            height: height
        };
    }

    // Adjust overlapping text elements with minimal movement
    function adjustOverlappingText(elem1, elem2, overlap, screenWidth) {
        const maxAdjustment = screenWidth <= 640 ? 15 : 25; // Smaller adjustments on mobile
        
        if (overlap.width > overlap.height) {
            // Horizontal overlap - adjust horizontally
            const adjustment = Math.min(overlap.width / 3, maxAdjustment);
            
            // Get current positions
            const elem1Style = window.getComputedStyle(elem1);
            const elem2Style = window.getComputedStyle(elem2);
            
            // Adjust left-positioned element
            if (elem1Style.left !== 'auto' && elem1Style.left !== '') {
                const currentLeft = parseFloat(elem1Style.left);
                if (currentLeft > 2) { // Don't go too close to edge
                    elem1.style.left = Math.max(2, currentLeft - 2) + '%';
                }
            }
            
            // Adjust right-positioned element
            if (elem2Style.right !== 'auto' && elem2Style.right !== '') {
                const currentRight = parseFloat(elem2Style.right);
                if (currentRight > 2) { // Don't go too close to edge
                    elem2.style.right = Math.max(2, currentRight - 2) + '%';
                }
            }
        } else {
            // Vertical overlap - adjust vertically with minimal movement
            const adjustment = Math.min(overlap.height / 3, 20);
            
            const elem1Style = window.getComputedStyle(elem1);
            const elem2Style = window.getComputedStyle(elem2);
            
            // Move the lower element down slightly
            if (elem2Style.top !== 'auto' && elem2Style.top !== '') {
                const currentTop = parseFloat(elem2Style.top);
                if (currentTop < 85) { // Don't push beyond container
                    elem2.style.top = Math.min(85, currentTop + 1.5) + '%';
                }
            }
        }
    }

    // Responsive adjustment on window resize
    let textResizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(textResizeTimeout);
        textResizeTimeout = setTimeout(() => {
            adjustFloatingTextPositions();
        }, 200);
    });

    // Initial positioning adjustment after page load
    window.addEventListener('load', () => {
        setTimeout(adjustFloatingTextPositions, 500);
    });

    // Intersection Observer to trigger animations when sections come into view
    const observerOptions = {
        threshold: 0.3,
        rootMargin: '0px 0px -100px 0px'
    };

    // Observer for specs section
    const specsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateSpecsBubbles();
                // Repeat animation every 12 seconds (total animation + pauses)
                setInterval(animateSpecsBubbles, 12000);
                specsObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observer for diagnostics section
    const diagnosticsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateTaskOverlays();
                // Repeat animation every 7 seconds
                setInterval(animateTaskOverlays, 7000);
                diagnosticsObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observer for warranty section
    const warrantyObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                startWarrantyFloating();
                warrantyObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Start observing the containers
    const techSpecsContainer = document.getElementById('techSpecsContainer');
    const diagnosticContainer = document.getElementById('diagnosticContainer');
    const warrantyContainer = document.getElementById('warrantyContainer');

    if (techSpecsContainer) {
        specsObserver.observe(techSpecsContainer);
    }

    if (diagnosticContainer) {
        diagnosticsObserver.observe(diagnosticContainer);
    }

    if (warrantyContainer) {
        warrantyObserver.observe(warrantyContainer);
    }

    // Video-Timer Sync - Simple Button Triggered Version
    function setupVideoTimerSync() {
        // Specifically target the story video in the container with the timer
        const storyVideo = document.querySelector('video[src*="update story.mov"], video source[src*="update story.mov"]');
        const actualVideo = storyVideo ? storyVideo.parentElement.tagName === 'VIDEO' ? storyVideo.parentElement : storyVideo : null;
        const timerIframe = document.querySelector('iframe[src*="timer.html"]');

        console.log('Story video found:', actualVideo);
        console.log('Timer iframe found:', timerIframe);

        if (!actualVideo || !timerIframe) {
            console.log('Video or timer not found, retrying...');
            setTimeout(setupVideoTimerSync, 1000);
            return;
        }

        // Send message to timer iframe
        function sendTimerMessage(message) {
            try {
                timerIframe.contentWindow.postMessage(message, '*');
            } catch (error) {
                console.error('Error sending message to timer:', error);
            }
        }

        // Start sequence: play video and timer simultaneously immediately
        function startSequence() {
            console.log('Button pressed, starting immediately');
            console.log('Video element:', actualVideo);

            // Set flag to allow this video to play
            window.buttonVideoPlaying = true;

            // Remove autoplay and loop to prevent conflicts
            actualVideo.removeAttribute('autoplay');
            actualVideo.removeAttribute('loop');
            actualVideo.currentTime = 0;
            actualVideo.muted = true;

            // Add event listener to stop video after one play cycle
            const handleVideoEnd = () => {
                console.log('Video finished one play cycle, stopping');
                actualVideo.pause();
                window.buttonVideoPlaying = false; // Reset flag
                actualVideo.removeEventListener('ended', handleVideoEnd);
            };
            actualVideo.addEventListener('ended', handleVideoEnd);

            // Force play the video immediately
            const playPromise = actualVideo.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    console.log('Video started successfully');
                }).catch(error => {
                    console.error('Error playing video:', error);
                    window.buttonVideoPlaying = false; // Reset flag on error
                });
            }

            sendTimerMessage('startTimer');
        }

        // Listen for timer stopping at 1.671 (no additional actions needed)
        window.addEventListener('message', (event) => {
            if (event.data === 'timerStopped') {
                console.log('Timer stopped at 1.671');
                // Timer stops automatically, no other actions needed
            }
        });

        // Initialize video to first frame
        actualVideo.currentTime = 0;
        actualVideo.pause();
        actualVideo.muted = true;
        actualVideo.removeAttribute('autoplay');
        sendTimerMessage('resetTimer');

        // Expose controls globally for button access
        window.videoTimerControls = {
            start: startSequence
        };
    }

    // Initialize video-timer sync only
    setTimeout(setupVideoTimerSync, 500);

    // Contact modal functionality
    const contactModal = document.getElementById('contactModal');
    const closeModal = document.getElementById('closeModal');
    const contactLinks = document.querySelectorAll('a[href="#contact"], a[href="#support"]');

    if (contactModal && closeModal) {
        contactLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                contactModal.classList.remove('hidden');
            });
        });

        closeModal.addEventListener('click', function() {
            contactModal.classList.add('hidden');
        });

        contactModal.addEventListener('click', function(e) {
            if (e.target === contactModal) {
                contactModal.classList.add('hidden');
            }
        });
    }
});
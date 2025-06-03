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
            setTimeout(() => {
                bubble.style.opacity = '1';
                bubble.style.transform = 'translateY(0)';
                bubble.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            }, (order - 1) * 800); // 800ms delay between each bubble
        });

        // Hide bubbles after showing them all
        setTimeout(() => {
            bubbles.forEach(bubble => {
                bubble.style.opacity = '0';
                bubble.style.transform = 'translateY(10px)';
            });
        }, bubbles.length * 800 + 2000); // Show for 2 seconds after last bubble
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

    // Animation for warranty claim overlays
    function animateWarrantyOverlays() {
        const overlays = document.querySelectorAll('.warranty-overlay');

        overlays.forEach((overlay, index) => {
            const order = parseInt(overlay.getAttribute('data-animation-order'));
            setTimeout(() => {
                overlay.style.opacity = '1';
                overlay.style.transform = 'translateX(0)';
                overlay.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            }, (order - 1) * 700); // 700ms delay between each overlay
        });

        // Hide overlays after showing them all
        setTimeout(() => {
            overlays.forEach(overlay => {
                overlay.style.opacity = '0';
                const isLeftSide = overlay.style.transform.includes('-20px');
                overlay.style.transform = isLeftSide ? 'translateX(-20px)' : 'translateX(20px)';
            });
        }, overlays.length * 700 + 2500); // Show for 2.5 seconds after last overlay
    }

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
                // Repeat animation every 8 seconds
                setInterval(animateSpecsBubbles, 8000);
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
                animateWarrantyOverlays();
                // Repeat animation every 8 seconds
                setInterval(animateWarrantyOverlays, 8000);
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
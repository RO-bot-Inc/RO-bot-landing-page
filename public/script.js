
document.addEventListener('DOMContentLoaded', function() {
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

    // Start observing the containers
    const techSpecsContainer = document.getElementById('techSpecsContainer');
    const diagnosticContainer = document.getElementById('diagnosticContainer');
    
    if (techSpecsContainer) {
        specsObserver.observe(techSpecsContainer);
    }
    
    if (diagnosticContainer) {
        diagnosticsObserver.observe(diagnosticContainer);
    }

    // Video and Timer Synchronization - Refactored for reliability
    function setupVideoTimerSync() {
        const storyVideo = document.querySelector('video source[src*="update story.mov"]')?.parentElement || 
                          document.querySelector('video[src*="update story.mov"]') ||
                          document.querySelector('video');
        
        const timerIframe = document.querySelector('iframe[src*="timer.html"]') ||
                           document.querySelector('iframe');
        
        console.log('Setting up video-timer sync:', {
            video: !!storyVideo,
            iframe: !!timerIframe
        });
        
        if (!storyVideo || !timerIframe) {
            console.log('Missing elements, retrying...');
            setTimeout(setupVideoTimerSync, 1000);
            return;
        }

        // State management
        let state = {
            isInViewport: false,
            isRunning: false,
            isReady: true
        };

        // Initialize video
        const initializeVideo = () => {
            storyVideo.currentTime = 0;
            storyVideo.pause();
            storyVideo.muted = true;
        };

        // Complete cycle sequence
        const runCycle = () => {
            if (!state.isReady || state.isRunning) {
                console.log('Cycle blocked - Ready:', state.isReady, 'Running:', state.isRunning);
                return;
            }

            state.isRunning = true;
            state.isReady = false;
            
            console.log('=== Starting new cycle ===');
            
            // Step 1: 2-second delay
            setTimeout(() => {
                if (!state.isInViewport) {
                    console.log('Left viewport during delay, aborting cycle');
                    resetState();
                    return;
                }
                
                console.log('Playing video...');
                storyVideo.play();
                
                // Step 2: Start timer after sync delay
                setTimeout(() => {
                    console.log('Starting timer...');
                    timerIframe.contentWindow.postMessage('startTimer', '*');
                }, 1500);
                
            }, 2000);
        };

        // Reset to ready state
        const resetState = () => {
            console.log('Resetting state...');
            state.isRunning = false;
            initializeVideo();
            
            setTimeout(() => {
                timerIframe.contentWindow.postMessage('resetTimer', '*');
                state.isReady = true;
                console.log('State reset complete, ready for next cycle');
            }, 500);
        };

        // Handle timer completion
        const handleTimerStop = () => {
            console.log('Timer stopped, pausing video...');
            storyVideo.pause();
            
            // 3-second pause, then reset and restart
            setTimeout(() => {
                console.log('3-second pause complete, resetting...');
                resetState();
                
                // Start next cycle after reset delay
                setTimeout(() => {
                    if (state.isInViewport && state.isReady) {
                        runCycle();
                    }
                }, 2000);
            }, 3000);
        };

        // Viewport observer
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const wasInViewport = state.isInViewport;
                state.isInViewport = entry.isIntersecting;
                
                console.log('Viewport change:', state.isInViewport);
                
                if (state.isInViewport && !wasInViewport && state.isReady && !state.isRunning) {
                    console.log('Entered viewport, starting cycle');
                    runCycle();
                }
            });
        }, { threshold: 0.1 });

        // Setup event listeners
        const setupEventListeners = () => {
            // Timer messages
            window.addEventListener('message', (event) => {
                if (event.data === 'timerStopped') {
                    handleTimerStop();
                }
            });

            // Video events
            storyVideo.addEventListener('loadedmetadata', () => {
                console.log('Video loaded, duration:', storyVideo.duration);
                initializeVideo();
            });

            storyVideo.addEventListener('ended', () => {
                if (state.isRunning) {
                    console.log('Video ended unexpectedly');
                    handleTimerStop();
                }
            });

            // Start observing
            observer.observe(storyVideo);
        };

        // Initialize everything
        initializeVideo();
        
        if (timerIframe.contentDocument?.readyState === 'complete') {
            setupEventListeners();
        } else {
            timerIframe.addEventListener('load', setupEventListeners);
        }
    }
    
    // Setup video-timer sync with multiple retry attempts
    setTimeout(setupVideoTimerSync, 500);
    setTimeout(setupVideoTimerSync, 1500);
    setTimeout(setupVideoTimerSync, 3000);

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

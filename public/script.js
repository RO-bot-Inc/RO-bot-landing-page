
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

    // Video-Timer Sync - Complete Rewrite
    function setupVideoTimerSync() {
        const storyVideo = document.querySelector('video');
        const timerIframe = document.querySelector('iframe[src*="timer.html"]');
        
        if (!storyVideo || !timerIframe) {
            console.log('Video or timer not found, retrying...');
            setTimeout(setupVideoTimerSync, 1000);
            return;
        }

        let isInViewport = false;
        let isRunning = false;
        let currentTimeout = null;

        // Initialize to starting state
        function resetToStartingState() {
            console.log('Resetting to starting state');
            storyVideo.currentTime = 0;
            storyVideo.pause();
            storyVideo.muted = true;
            timerIframe.contentWindow.postMessage('resetTimer', '*');
        }

        // Start the sequence cycle
        function startCycle() {
            if (isRunning || !isInViewport) return;
            
            isRunning = true;
            console.log('=== Starting new cycle ===');
            
            // Step 1: Reset to starting state
            resetToStartingState();
            
            // Step 2: 2 second pause
            currentTimeout = setTimeout(() => {
                if (!isInViewport) {
                    stopCycle();
                    return;
                }
                
                console.log('Starting video and timer simultaneously');
                // Step 3: Start video and timer simultaneously
                storyVideo.play();
                timerIframe.contentWindow.postMessage('startTimer', '*');
                
            }, 2000);
        }

        // Stop the current cycle
        function stopCycle() {
            console.log('Stopping cycle');
            isRunning = false;
            if (currentTimeout) {
                clearTimeout(currentTimeout);
                currentTimeout = null;
            }
            storyVideo.pause();
            timerIframe.contentWindow.postMessage('stopTimer', '*');
        }

        // Handle timer stopping at 1.671
        function onTimerStop() {
            console.log('Timer stopped at 1.671, pausing video');
            storyVideo.pause();
            
            // Step 5: 3 second pause after timer stops
            currentTimeout = setTimeout(() => {
                if (!isInViewport) {
                    stopCycle();
                    return;
                }
                
                // Step 6: Reset and restart cycle
                isRunning = false;
                startCycle();
                
            }, 3000);
        }

        // Viewport observer
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const wasInViewport = isInViewport;
                isInViewport = entry.isIntersecting;
                
                console.log('Viewport change:', isInViewport);
                
                if (isInViewport && !wasInViewport) {
                    // Entered viewport - start the cycle
                    startCycle();
                } else if (!isInViewport && wasInViewport) {
                    // Left viewport - stop everything
                    stopCycle();
                    resetToStartingState();
                }
            });
        }, { threshold: 0.1 });

        // Listen for timer messages
        window.addEventListener('message', (event) => {
            if (event.data === 'timerStopped') {
                onTimerStop();
            }
        });

        // Video error handling
        storyVideo.addEventListener('error', (e) => {
            console.error('Video error:', e);
        });

        // Initialize
        resetToStartingState();
        observer.observe(storyVideo);
        
        // Wait for iframe to load before starting
        if (timerIframe.contentDocument?.readyState === 'complete') {
            console.log('Timer iframe ready');
        } else {
            timerIframe.addEventListener('load', () => {
                console.log('Timer iframe loaded');
            });
        }
    }

    // Initialize with retry
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

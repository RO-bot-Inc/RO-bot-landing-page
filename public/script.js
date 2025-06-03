
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

    // Video and Timer Synchronization
    function setupVideoTimerSync() {
        // Look for any video with story source
        const storyVideo = document.querySelector('video source[src*="update story.mov"]')?.parentElement || 
                          document.querySelector('video[src*="update story.mov"]') ||
                          document.querySelector('video');
        
        const timerIframe = document.querySelector('iframe[src*="timer.html"]') ||
                           document.querySelector('iframe');
        
        console.log('Attempting video-timer sync setup:', {
            video: !!storyVideo,
            iframe: !!timerIframe,
            videoSrc: storyVideo?.querySelector('source')?.src || storyVideo?.src
        });
        
        if (storyVideo && timerIframe) {
            console.log('Setting up video-timer synchronization');
            
            // Variables for sequence control
            let isInViewport = false;
            let sequenceActive = false;
            let timerStoppedTime = null;
            
            // Log video duration when metadata loads
            storyVideo.addEventListener('loadedmetadata', function() {
                console.log('Story video duration:', storyVideo.duration, 'seconds');
                // Ensure video starts paused on first frame
                storyVideo.currentTime = 0;
                storyVideo.pause();
            });
            
            // Initialize video state
            storyVideo.currentTime = 0;
            storyVideo.pause();
            
            // Intersection Observer for viewport detection
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    const wasInViewport = isInViewport;
                    isInViewport = entry.isIntersecting;
                    
                    if (isInViewport && !wasInViewport && !sequenceActive) {
                        console.log('Video entered viewport - starting 2-second countdown');
                        startSequence();
                    }
                });
            }, {
                threshold: 0.1 // Trigger when 10% of video is visible
            });
            
            observer.observe(storyVideo);
            
            // Main sequence function
            function startSequence() {
                if (sequenceActive) return;
                sequenceActive = true;
                
                console.log('Sequence started - 2 second delay before play');
                setTimeout(() => {
                    if (isInViewport && sequenceActive) {
                        console.log('Playing video and starting timer simultaneously');
                        storyVideo.play();
                        // Delay timer start by 1500ms to sync with video playback
                        setTimeout(() => {
                            timerIframe.contentWindow.postMessage('startTimer', '*');
                        }, 1500);
                    }
                }, 2000);
            }
            
            // Wait for iframe to be fully loaded
            const setupEvents = () => {
                // Listen for timer stop message from timer iframe
                window.addEventListener('message', function(event) {
                    if (event.data === 'timerStopped') {
                        console.log('Timer stopped - starting 3-second pause');
                        timerStoppedTime = Date.now();
                        storyVideo.pause();
                        
                        setTimeout(() => {
                            console.log('3-second pause complete - resetting for next cycle');
                            // Reset video to first frame
                            storyVideo.currentTime = 0;
                            storyVideo.pause();
                            // Reset timer
                            timerIframe.contentWindow.postMessage('resetTimer', '*');
                            // Mark sequence as ready to restart
                            sequenceActive = false;
                            
                            // If still in viewport, start the sequence again
                            if (isInViewport) {
                                setTimeout(() => {
                                    startSequence();
                                }, 2000);
                            }
                        }, 3000);
                    }
                });
                
                // Handle video end (backup in case timer doesn't stop it)
                storyVideo.addEventListener('ended', function() {
                    if (!timerStoppedTime || (Date.now() - timerStoppedTime) > 1000) {
                        console.log('Video ended without timer stop - triggering sequence reset');
                        window.postMessage('timerStopped', '*');
                    }
                });
            };
            
            // Setup events after iframe loads
            if (timerIframe.contentDocument && timerIframe.contentDocument.readyState === 'complete') {
                setupEvents();
            } else {
                timerIframe.addEventListener('load', setupEvents);
            }
            
        } else {
            console.log('Video or timer iframe not found for synchronization', {
                videoFound: !!storyVideo,
                iframeFound: !!timerIframe
            });
            
            // Retry after a longer delay if elements not found
            setTimeout(setupVideoTimerSync, 2000);
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

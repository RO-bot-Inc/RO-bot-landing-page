
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
            
            // Wait for iframe to be fully loaded
            const setupEvents = () => {
                // When story video starts playing
                storyVideo.addEventListener('play', function() {
                    console.log('Story video started playing - starting timer');
                    timerIframe.contentWindow.postMessage('startTimer', '*');
                });
                
                // When story video is paused
                storyVideo.addEventListener('pause', function() {
                    console.log('Story video paused - stopping timer');
                    timerIframe.contentWindow.postMessage('stopTimer', '*');
                });
                
                // When story video ends
                storyVideo.addEventListener('ended', function() {
                    console.log('Story video ended - resetting timer');
                    timerIframe.contentWindow.postMessage('resetTimer', '*');
                });
                
                // Handle video seeking/restarting
                storyVideo.addEventListener('seeked', function() {
                    if (storyVideo.currentTime < 0.5) { // If seeked to beginning
                        console.log('Story video seeked to beginning - resetting timer');
                        timerIframe.contentWindow.postMessage('resetTimer', '*');
                        if (!storyVideo.paused) {
                            timerIframe.contentWindow.postMessage('startTimer', '*');
                        }
                    }
                });
                
                // Handle video looping - reset timer when video restarts
                let lastTime = 0;
                storyVideo.addEventListener('timeupdate', function() {
                    // Detect when video loops back to beginning
                    if (lastTime > storyVideo.currentTime + 1) {
                        console.log('Story video looped - resetting and starting timer');
                        timerIframe.contentWindow.postMessage('resetTimer', '*');
                        timerIframe.contentWindow.postMessage('startTimer', '*');
                    }
                    lastTime = storyVideo.currentTime;
                });
                
                // Start timer if video is already playing when page loads
                if (!storyVideo.paused && storyVideo.currentTime > 0) {
                    console.log('Story video already playing - starting timer');
                    timerIframe.contentWindow.postMessage('startTimer', '*');
                }
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

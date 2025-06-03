
document.addEventListener('DOMContentLoaded', function() {
    // Disable any automatic hero sequences
    const heroVideos = document.querySelectorAll('.hero-section video, .hero video, video[autoplay]');
    heroVideos.forEach(video => {
        video.removeAttribute('autoplay');
        video.pause();
    });

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

        // Start sequence: play video and timer simultaneously
        function startSequence() {
            console.log('Starting video and timer simultaneously');
            console.log('Video element:', actualVideo);
            
            // Remove autoplay to prevent conflicts
            actualVideo.removeAttribute('autoplay');
            actualVideo.currentTime = 0;
            actualVideo.muted = true;
            
            // Force play the video
            const playPromise = actualVideo.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    console.log('Video started successfully');
                }).catch(error => {
                    console.error('Error playing video:', error);
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

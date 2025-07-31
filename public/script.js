document.addEventListener('DOMContentLoaded', () => {

    // ===========================================
    // ALL FUNCTION DEFINITIONS
    // ===========================================

    // --- Hero Section Animations ---
    function createVoiceVisualizer() {
        const root = document.getElementById('voice-visualizer-root');
        if (!root) return;
        const container = document.createElement('div');
        container.className = 'voice-visualizer-container';
        container.style.cssText = `position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 30; width: 200px; height: 4px; display: flex; align-items: center; justify-content: center;`;
        const voiceLine = document.createElement('div');
        voiceLine.className = 'voice-line';
        voiceLine.style.cssText = `width: 100%; height: 2px; background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.8), transparent); border-radius: 2px; animation: voicePulse 2s ease-in-out infinite; box-shadow: 0 0 8px rgba(255, 255, 255, 0.3);`;
        container.appendChild(voiceLine);
        root.appendChild(container);
    }

    function initializeWaveformAnimation() {
        const container = document.getElementById('waveform');
        if (!container || container.querySelector('.waveform-bars')) return;
        const barsContainer = document.createElement('div');
        barsContainer.className = 'waveform-bars';
        const textContainer = document.getElementById('animated-text-container');
        if (textContainer) container.insertBefore(barsContainer, textContainer);
        else container.appendChild(barsContainer);

        const numBars = 40, bars = [], targetHeights = new Array(numBars).fill(0.05), visualHeights = new Array(numBars).fill(0.05);
        let isSpeaking = true, frameCount = 0;
        for (let i = 0; i < numBars; i++) {
            const bar = document.createElement('div');
            bar.classList.add('waveform-bar');
            barsContainer.appendChild(bar);
            bars.push(bar);
        }
        function speechCycle() {
            isSpeaking = !isSpeaking;
            setTimeout(speechCycle, isSpeaking ? 2000 + Math.random() * 2000 : 1000 + Math.random() * 1500);
        }
        function animate() {
            if (frameCount % 4 === 0) {
                for (let i = 0; i < numBars - 1; i++) { targetHeights[i] = targetHeights[i + 1]; }
                targetHeights[numBars - 1] = isSpeaking && Math.random() > 0.7 ? 0.4 + Math.random() * 0.6 : 0.05 + Math.random() * 0.1;
            }
            for (let i = 0; i < numBars; i++) {
                visualHeights[i] += (targetHeights[i] - visualHeights[i]) * 0.1;
                bars[i].style.transform = `scaleY(${visualHeights[i]})`;
            }
            frameCount++;
            requestAnimationFrame(animate);
        }
        animate();
        speechCycle();
        initializeTextAnimation();
    }

    function initializeTextAnimation() {
        const container = document.getElementById('animated-text-container');
        if (!container) return;
        const sentences = ["The engine compartment looks pretty clean overall. No leaks that I can see.", "A bit of corrosion around the battery terminals.", "Looks like a cracked hose right here."];
        let sentenceIndex = 0, wordIndex = 0;
        function animate() {
            const words = sentences[sentenceIndex].split(' ');
            if (wordIndex < words.length) {
                container.textContent = words.slice(0, wordIndex + 1).join(' ');
                wordIndex++;
                setTimeout(animate, 200);
            } else {
                setTimeout(() => {
                    sentenceIndex = (sentenceIndex + 1) % sentences.length;
                    wordIndex = 0;
                    container.textContent = '';
                    setTimeout(animate, 300);
                }, 2000);
            }
        }
        setTimeout(animate, 1000);
    }

    // --- Feature 1: 5-Second Stories ---
    function setupVideoTimerSync() {
        const timerIframe = document.querySelector('iframe[src*="timer.html"]');
        let actualVideo = document.querySelector('video[src*="update_story.mov"]');
        if (!actualVideo && timerIframe) {
            const featureContainer = timerIframe.closest('div.relative');
            if (featureContainer) { actualVideo = featureContainer.querySelector('video'); }
        }
        if (!actualVideo || !timerIframe) return;

        function sendTimerMessage(message) { try { timerIframe.contentWindow.postMessage(message, '*'); } catch (error) { } }
        function resetSequence() {
            actualVideo.pause();
            actualVideo.currentTime = 0;
            actualVideo.muted = true;
            actualVideo.removeAttribute('autoplay');
            sendTimerMessage('resetTimer');
        }
        function startSequence() {
            actualVideo.currentTime = 0;
            actualVideo.muted = true;
            actualVideo.play().then(() => { sendTimerMessage('startTimer'); }).catch(error => { });
        }
        resetSequence();
        const featureContainer = actualVideo.closest('.relative');
        if (featureContainer) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting && entry.intersectionRatio >= 1.0) {
                        setTimeout(() => { startSequence(); }, 500);
                    } else if (!entry.isIntersecting) {
                        // Reset sequence when container leaves viewport
                        resetSequence();
                    }
                });
            }, { threshold: 1.0 });
            observer.observe(featureContainer);
        }
        const writeStoryBtn = document.getElementById('writeStoryBtn');
        if (writeStoryBtn) { writeStoryBtn.addEventListener('click', startSequence); }
    }

    // --- Feature 2 & 3: Observers and Handlers ---
    function setupFeatureObservers() {
        const warrantyContainer = document.getElementById('warrantyContainer');
        const techSpecsContainer = document.getElementById('techSpecsContainer');
        const diagnosticContainer = document.getElementById('diagnosticContainer');

        if (warrantyContainer) {
            const warrantyObserver = new IntersectionObserver((entries, obs) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        calculateOptimalPositions();
                        obs.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.3 });
            warrantyObserver.observe(warrantyContainer);
        }

        if (techSpecsContainer) {
            const specsObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting && entry.intersectionRatio >= 1.0) {
                        animateSpecsSequence();
                    }
                });
            }, { threshold: 1.0 });
            specsObserver.observe(techSpecsContainer);
        }

        if (diagnosticContainer) {
            const diagnosticObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting && entry.intersectionRatio >= 1.0) {
                        startDiagnosticAutoplay();
                    } else {
                        resetDiagnosticMessages();
                    }
                });
            }, { threshold: 1.0 });
            diagnosticObserver.observe(diagnosticContainer);
        }
    }

    function calculateOptimalPositions() {
        const container = document.getElementById('warrantyContainer');
        const overlays = document.querySelectorAll('.warranty-overlay');
        if (!container || overlays.length === 0) return;
        const screenWidth = window.innerWidth;
        let positions = [];
        if (screenWidth <= 640) { positions = [{ left: '8%', top: '5%', width: '36vw', zIndex: 14 }, { right: '8%', top: '25%', width: '38vw', zIndex: 13 }, { left: '12%', top: '48%', width: '40vw', zIndex: 12 }, { right: '12%', top: '70%', width: '37vw', zIndex: 15 }]; }
        else if (screenWidth <= 1024) { positions = [{ left: '4%', top: '8%', width: '25vw', zIndex: 14 }, { right: '4%', top: '18%', width: '27vw', zIndex: 13 }, { left: '4%', bottom: '26%', width: '29vw', zIndex: 12 }, { right: '4%', bottom: '8%', width: '26vw', zIndex: 15 }]; }
        else { positions = [{ left: '4%', top: '6%', width: '15vw', zIndex: 14 }, { right: '4%', top: '12%', width: '17vw', zIndex: 13 }, { left: '4%', bottom: '20%', width: '19vw', zIndex: 12 }, { right: '4%', bottom: '18%', width: '16vw', zIndex: 16 }]; }
        overlays.forEach((overlay, index) => {
            if (index >= positions.length) return;
            const pos = positions[index];
            Object.assign(overlay.style, { position: 'absolute', left: pos.left || 'auto', top: pos.top || 'auto', right: pos.right || 'auto', bottom: pos.bottom || 'auto', width: pos.width, zIndex: pos.zIndex, opacity: '1' });
        });
    }

    function calculateSpecsBubblePositions() {
        const container = document.getElementById('techSpecsContainer');
        const a1 = document.getElementById('a1Bubble');
        const a2 = document.getElementById('a2Bubble');
        if (!container || !a1 || !a2) return;
        
        const screenWidth = window.innerWidth;
        let positions = [];
        
        // Define safe zones for the new text containers
        if (screenWidth <= 640) {
            positions = [
                { // A1 - upper right (oil capacity)
                    bubble: a1,
                    right: '5%',
                    top: '8%',
                    left: 'auto',
                    bottom: 'auto'
                },
                { // A2 - lower left (torque specs)
                    bubble: a2,
                    left: '5%',
                    bottom: '15%',
                    right: 'auto',
                    top: 'auto'
                }
            ];
        } else if (screenWidth <= 1024) {
            positions = [
                { // A1 - upper right (oil capacity)
                    bubble: a1,
                    right: '4%',
                    top: '10%',
                    left: 'auto',
                    bottom: 'auto'
                },
                { // A2 - lower left (torque specs)
                    bubble: a2,
                    left: '4%',
                    bottom: '15%',
                    right: 'auto',
                    top: 'auto'
                }
            ];
        } else {
            positions = [
                { // A1 - upper right (oil capacity)
                    bubble: a1,
                    right: '4%',
                    top: '12%',
                    left: 'auto',
                    bottom: 'auto'
                },
                { // A2 - lower left (torque specs)
                    bubble: a2,
                    left: '4%',
                    bottom: '18%',
                    right: 'auto',
                    top: 'auto'
                }
            ];
        }
        
        // Add slight random variation within safe zones
        positions.forEach(pos => {
            const randomOffset = Math.random() * 6 - 3; // ±3% variation
            
            if (pos.top !== 'auto') {
                const topValue = parseFloat(pos.top);
                pos.top = `${Math.max(5, topValue + randomOffset)}%`;
            }
            if (pos.bottom !== 'auto') {
                const bottomValue = parseFloat(pos.bottom);
                pos.bottom = `${Math.max(5, bottomValue + randomOffset)}%`;
            }
            if (pos.left !== 'auto') {
                const leftValue = parseFloat(pos.left);
                pos.left = `${Math.max(2, leftValue + randomOffset)}%`;
            }
            if (pos.right !== 'auto') {
                const rightValue = parseFloat(pos.right);
                pos.right = `${Math.max(2, rightValue + randomOffset)}%`;
            }
            
            // Apply positioning
            Object.assign(pos.bubble.style, {
                position: 'absolute',
                left: pos.left,
                top: pos.top,
                right: pos.right,
                bottom: pos.bottom
            });
        });
    }

    function animateSpecsSequence() {
        const a1 = document.getElementById('a1Bubble');
        const a2 = document.getElementById('a2Bubble');
        if (!a1 || !a2) return;
        
        // Only animate if not already visible
        if (a1.style.opacity !== '1') {
            // Position both bubbles using zone-based positioning
            calculateSpecsBubblePositions();
            
            // Show bubbles immediately with floating animation
            a1.style.opacity = '1';
            a2.style.opacity = '1';
            a1.classList.add('floating');
            a2.classList.add('floating');
        }
    }

    function resetSpecsBubbles() {
        const allBubbles = document.querySelectorAll('#techSpecsContainer .message-bubble');
        allBubbles.forEach(bubble => {
            bubble.style.opacity = '0';
            bubble.classList.remove('floating');
        });
    }

    

    // --- Feature 4: Diagnostic Autoplay (Refactored) ---
    class DiagnosticAutoplay {
        constructor() {
            this.isRunning = false;
            this.timeouts = [];
            this.container = null;
            this.messages = [];
            this.delays = [];
        }

        initialize() {
            this.container = document.getElementById('chatMessagesContainer');
            if (!this.container) return false;

            this.messages = [
                { type: 'user', text: "We've got this error message on the display panel… adaptive cruise temporarily unavailable. I'm also getting some DTCs… U0235, C1A67, U0415" },
                { type: 'robot', text: "Those codes are related to the advanced driver-assistance system. Start with a visual inspection of radar sensor and fascia.\n- Check for obstructions (dirt, bug splatter, snow/ice, aftermarket grille cover).\n- Verify sensor is properly seated. The sensor must be aimed straight ahead and level to the ground." },
                { type: 'user', text: "No issues found. Now what?" },
                { type: 'robot', text: "Check wiring/connectors for damage and run radar sensor calibration.\n- Connect MDI 2 and launch GDS2 or Techline Connect.\n- Navigate to: Chassis > Front View Camera Module > Special Functions > Radar Sensor Learn" },
                { type: 'user', text: "Calibration was successful. That was the issue. Error message resolved." },
                { type: 'robot', text: "Resolution confirmed. Check to make sure DTCs are clear." },
                { type: 'fadeout', text: "" },
                { type: 'user', text: "Road test confirms a rattling noise from the rear passenger side. It gets louder with speed." },
                { type: 'robot', text: "Remove the right rear wheel. Inspect rear passenger side wheel area.\n- Brake dust shield\n- Parking brake\n- Exhaust near wheel well — hangers, clearance from body, heat shields\n- Shock mount points — wear, cracked bushings, loose fasteners\n- Suspension arms and links\n- Rotor" },
                { type: 'user', text: "Everything looks normal. Now what?" },
                { type: 'robot', text: "Use a chassis ear kit or mechanic's stethoscope to isolate the noise. Check these areas:\n- Rear shock absorber lower mount\n- Control arm\n- Sway bar link\n- Subframe\n- Seatbelt anchor" },
                { type: 'user', text: "It was coming from the inside of the door. I opened up the panel and found a loose wiring harness." },
                { type: 'robot', text: "Mystery solved! Secure the harness and confirm the resolution with a final road test." },
                { type: 'finalfadeout', text: "" }
            ];

            // Timing based on new sequence specifications:
            // User 1 (1s), RO-bot 1 (3s), User 2 (7s), RO-bot 2 (9s), User 3 (13s), RO-bot 3 (15s), 
            // fadeout (19s), User 4 (21s), RO-bot 4 (23s), User 5 (27s), RO-bot 5 (29s), User 6 (33s), RO-bot 6 (35s), finalfadeout (39s)
            this.delays = [1000, 3000, 7000, 9000, 13000, 15000, 19000, 21000, 23000, 27000, 29000, 33000, 35000, 39000];

            return true;
        }

        clearTimeouts() {
            this.timeouts.forEach(timeout => clearTimeout(timeout));
            this.timeouts = [];
        }

        reset() {
            this.isRunning = false;
            this.clearTimeouts();
            if (this.container) {
                this.container.innerHTML = '';
            }
        }

        createRobotTag() {
            const tagEl = document.createElement('div');
            tagEl.textContent = 'RO-bot';
            tagEl.className = 'text-xs text-white mb-1 self-start font-bold';
            tagEl.style.cssText = 'margin-left: 10px; margin-bottom: -8px; font-weight: bold;';
            return tagEl;
        }

        createMessageElement(message) {
            const messageEl = document.createElement('div');
            messageEl.className = `chat-bubble ${message.type === 'user' ? 'user-message' : 'robot-message'}`;
            
            // Add smooth entrance animation
            messageEl.style.opacity = '0';
            messageEl.style.transform = 'translateY(20px)';
            messageEl.style.transition = 'all 0.6s cubic-bezier(0.25, 0.8, 0.25, 1)';
            
            // Format RO-bot messages to create new lines for dash bullet points only
            if (message.type === 'robot' && message.text.includes('- ')) {
                // Only split on dashes that have a space after them (bullet points)
                const bulletPattern = /(\s+-\s)/g;
                let formattedText = message.text;
                
                // Replace bullet point dashes with newline + bullet
                formattedText = formattedText.replace(bulletPattern, '\n• ');
                
                messageEl.style.whiteSpace = 'pre-line';
                messageEl.style.textAlign = 'left';
                
                // Split into lines and format each bullet point properly
                const lines = formattedText.trim().split('\n');
                let htmlContent = '';
                
                lines.forEach(line => {
                    if (line.startsWith('• ')) {
                        // This is a bullet point - create proper hanging indent where text aligns
                        htmlContent += `<div style="padding-left: 0.8em; text-indent: -0.8em;">${line}</div>`;
                    } else if (line.trim()) {
                        // Regular line
                        htmlContent += `<div>${line}</div>`;
                    }
                });
                
                messageEl.innerHTML = htmlContent;
            } else {
                messageEl.textContent = message.text;
            }
            
            return messageEl;
        }

        fadeOutMessages() {
            const allMessages = this.container.querySelectorAll('.chat-bubble, div[style*="margin-left: 10px"]');
            allMessages.forEach((msg, index) => {
                // Stagger the fade out animation for a smoother effect
                setTimeout(() => {
                    msg.style.transition = 'all 0.8s cubic-bezier(0.25, 0.8, 0.25, 1)';
                    msg.style.opacity = '0';
                    msg.style.transform = 'translateY(-10px)';
                }, index * 100);
            });

            // Clear container after fade animation completes
            const clearTimeout = setTimeout(() => {
                if (this.isRunning && this.container) {
                    this.container.innerHTML = '';
                }
            }, 1200);

            this.timeouts.push(clearTimeout);
        }

        displayMessage(message, index) {
            if (!this.isRunning) return;

            if (message.type === 'fadeout' || message.type === 'finalfadeout') {
                this.fadeOutMessages();

                // If this is the final fadeout, schedule restart after 2 second pause
                if (message.type === 'finalfadeout') {
                    const restartTimeout = setTimeout(() => {
                        if (this.isRunning) {
                            this.start();
                        }
                    }, 3200); // 1.2s fade + 2s pause
                    this.timeouts.push(restartTimeout);
                }
                return;
            }

            if (message.type === 'robot') {
                const robotTag = this.createRobotTag();
                robotTag.style.opacity = '0';
                robotTag.style.transform = 'translateY(10px)';
                robotTag.style.transition = 'all 0.5s cubic-bezier(0.25, 0.8, 0.25, 1)';
                this.container.appendChild(robotTag);
                
                // Animate robot tag in
                setTimeout(() => {
                    robotTag.style.opacity = '1';
                    robotTag.style.transform = 'translateY(0)';
                }, 50);
            }

            const messageEl = this.createMessageElement(message);
            this.container.appendChild(messageEl);
            
            // Smooth scroll to bottom
            this.container.style.scrollBehavior = 'smooth';
            this.container.scrollTop = this.container.scrollHeight;
            
            // Animate message in
            setTimeout(() => {
                messageEl.style.opacity = '1';
                messageEl.style.transform = 'translateY(0)';
            }, message.type === 'robot' ? 200 : 100);
        }

        start() {
            if (!this.initialize()) return;

            this.reset();
            this.isRunning = true;

            this.messages.forEach((message, index) => {
                const timeout = setTimeout(() => {
                    this.displayMessage(message, index);
                }, this.delays[index]);

                this.timeouts.push(timeout);
            });
        }

        stop() {
            this.reset();
        }
    }

    // Create singleton instance
    const diagnosticAutoplay = new DiagnosticAutoplay();

    function startDiagnosticAutoplay() {
        diagnosticAutoplay.start();
    }

    function resetDiagnosticMessages() {
        diagnosticAutoplay.stop();
    }

    // --- Contact Modal Handler ---
    function setupContactModal() {
        const closeModal = document.getElementById('closeModal');
        const contactModal = document.getElementById('contactModal');
        
        if (closeModal && contactModal) {
            closeModal.addEventListener('click', () => {
                contactModal.classList.add('hidden');
            });
            
            // Close modal when clicking outside
            contactModal.addEventListener('click', (e) => {
                if (e.target === contactModal) {
                    contactModal.classList.add('hidden');
                }
            });
        }
    }

    // --- Hamburger Menu Handler ---
    function setupHamburgerMenu() {
        const hamburgerBtn = document.getElementById('hamburger-btn');
        const hamburgerClose = document.getElementById('hamburger-close');
        const hamburgerOverlay = document.getElementById('hamburger-overlay');
        const body = document.body;
        
        if (!hamburgerBtn || !hamburgerClose || !hamburgerOverlay) return;
        
        function openMenu() {
            hamburgerBtn.classList.add('active');
            hamburgerOverlay.classList.add('active');
            body.classList.add('hamburger-open');
        }
        
        function closeMenu() {
            hamburgerBtn.classList.remove('active');
            hamburgerOverlay.classList.remove('active');
            body.classList.remove('hamburger-open');
        }
        
        // Open menu
        hamburgerBtn.addEventListener('click', openMenu);
        
        // Close menu
        hamburgerClose.addEventListener('click', closeMenu);
        
        // Close menu when clicking overlay
        hamburgerOverlay.addEventListener('click', (e) => {
            if (e.target === hamburgerOverlay) {
                closeMenu();
            }
        });
        
        // Close menu on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && hamburgerOverlay.classList.contains('active')) {
                closeMenu();
            }
        });
        
        // Close menu when clicking nav items
        const navItems = document.querySelectorAll('.hamburger-nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', closeMenu);
        });
    }

    // --- Smooth Scroll Handler ---
    function setupSmoothScroll() {
        const smoothScrollLinks = document.querySelectorAll('a[data-smooth-scroll]');
        
        smoothScrollLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                
                const targetId = this.getAttribute('href').substring(1);
                const targetElement = document.getElementById(targetId);
                
                if (targetElement) {
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    // ===========================================
    // INITIALIZE ALL PAGE SCRIPTS
    // ===========================================
    createVoiceVisualizer();
    initializeWaveformAnimation();
    setupVideoTimerSync();
    setupFeatureObservers();
    setupSmoothScroll();
    setupContactModal();
    setupHamburgerMenu();

    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(calculateOptimalPositions, 250);
    });
});
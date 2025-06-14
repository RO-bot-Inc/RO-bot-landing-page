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
                        observer.unobserve(entry.target);
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
                    } else {
                        resetSpecsBubbles();
                    }
                });
            }, { threshold: 1.0 });
            setupSpecsClickHandlers();
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

    function animateSpecsSequence() {
        const q1 = document.getElementById('q1Bubble');
        const q2 = document.getElementById('q2Bubble');
        if (!q1 || !q2) return;
        resetSpecsBubbles();
        setTimeout(() => {
            q1.style.opacity = '1';
            q1.style.transform = 'translateY(0)';
        }, 0);
        setTimeout(() => {
            q2.style.opacity = '1';
            q2.style.transform = 'translateY(0)';
        }, 800);
    }

    function resetSpecsBubbles() {
        const allBubbles = document.querySelectorAll('#techSpecsContainer .message-bubble');
        allBubbles.forEach(bubble => {
            bubble.style.opacity = '0';
            bubble.style.transform = 'translateY(10px)';
        });
        document.querySelectorAll('#techSpecsContainer .clickable-question').forEach(q => {
            q.classList.remove('tapped');
        });
    }

    function setupSpecsClickHandlers() {
        const questions = document.querySelectorAll('#techSpecsContainer .clickable-question');
        questions.forEach(question => {
            question.addEventListener('click', function() {
                if (this.classList.contains('tapped')) return;
                const answerId = this.getAttribute('data-answer');
                const answerBubble = document.getElementById(answerId);
                if (answerBubble) {
                    answerBubble.style.opacity = '1';
                    answerBubble.style.transform = 'translateY(0)';
                }
                this.classList.add('tapped');
            });
        });
    }

    // --- Feature 4: Diagnostic Autoplay ---
    let isAutoplayRunning = false;

    function startDiagnosticAutoplay() {
        const container = document.getElementById('chatMessagesContainer');
        if (!container || isAutoplayRunning) return;

        isAutoplayRunning = true;
        container.innerHTML = '';

        const messages = [
            { type: 'user', text: "We've got this error message on the display panel… adaptive cruise temporarily unavailable. I'm also getting some DTCs… U0235, C1A67, U0415" },
            { type: 'robot', text: "Those codes are related to the advanced driver-assistance system. Start with a visual inspection of radar sensor and fascia.\n- Check for obstructions (dirt, bug splatter, snow/ice, aftermarket grille cover).\n- Verify sensor is properly seated. The sensor must be aimed straight ahead and level to the ground." },
            { type: 'user', text: "No issues found. Now what?" },
            { type: 'robot', text: "Check wiring/connectors for damage and run radar sensor calibration.\n- Connect MDI 2 and launch GDS2 or Techline Connect.\n- Navigate to: Chassis > Front View Camera Module > Special Functions > Radar Sensor Learn" },
            { type: 'user', text: "Calibration was successful. That was the issue. Error message resolved." },
            { type: 'robot', text: "Resolution confirmed. Check to make sure DTCs are clear." },
            { type: 'user', text: "Road test confirms a rattling noise from the rear passenger side. It gets louder with speed." },
            { type: 'robot', text: "Remove the right rear wheel. Inspect rear passenger side wheel area.\n- Brake dust shield\n- Parking brake\n- Exhaust near wheel well — hangers, clearance from body, heat shields\n- Shock mount points — wear, cracked bushings, loose fasteners\n- Suspension arms and links\n- Rotor" },
            { type: 'user', text: "Everything looks normal. Now what?" },
            { type: 'robot', text: "Use a chassis ear kit or mechanic's stethoscope to isolate the noise. Check these areas:\n- Rear shock absorber lower mount\n- Control arm\n- Sway bar link\n- Subframe\n- Seatbelt anchor" },
            { type: 'user', text: "It was coming from the inside of the door. I opened up the panel and found a loose wiring harness." },
            { type: 'robot', text: "Mystery solved! Secure the harness and confirm the resolution with a final road test." }
        ];

        // Animation sequence with 4-second delays between RO-bot messages and user messages
        const delays = [0, 2000, 6000, 8000, 12000, 14000, 18000, 22000, 26000, 28000, 32000, 34000];

        messages.forEach((message, index) => {
            setTimeout(() => {
                if (message.type === 'robot') {
                    const tagEl = document.createElement('div');
                    tagEl.textContent = 'RO-bot';
                    tagEl.className = 'text-xs text-white mb-1 self-start font-bold';
                    tagEl.style.cssText = 'margin-left: 10px; margin-bottom: -8px;';
                    container.appendChild(tagEl);
                }

                const messageEl = document.createElement('div');
                messageEl.className = `chat-bubble ${message.type === 'user' ? 'user-message' : 'robot-message'}`;
                messageEl.textContent = message.text;
                container.appendChild(messageEl);
                container.scrollTop = container.scrollHeight;

                // Restart the sequence when last message is shown
                if (index === messages.length - 1) {
                    setTimeout(() => {
                        startDiagnosticAutoplay();
                    }, 3000); // Wait 3 seconds before restarting
                }
            }, delays[index]);
        });
    }

    function resetDiagnosticMessages() {
        const container = document.getElementById('chatMessagesContainer');
        if (container) {
            container.innerHTML = '';
        }
        isAutoplayRunning = false;
    }

    // ===========================================
    // INITIALIZE ALL PAGE SCRIPTS
    // ===========================================
    createVoiceVisualizer();
    initializeWaveformAnimation();
    setupVideoTimerSync();
    setupFeatureObservers();

    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(calculateOptimalPositions, 250);
    });
});
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

        function sendTimerMessage(message) { try { timerIframe.contentWindow.postMessage(message, '*'); } catch (error) {} }
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
            actualVideo.play().then(() => { sendTimerMessage('startTimer'); }).catch(error => {});
        }
        resetSequence();

        // Set up intersection observer for auto-trigger
        const featureContainer = actualVideo.closest('.relative');
        if (featureContainer) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting && entry.intersectionRatio >= 1.0) {
                        // Trigger animation 0.5 seconds after fully in viewport
                        setTimeout(() => {
                            startSequence();
                        }, 500);
                        // Stop observing after first trigger
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 1.0 });
            observer.observe(featureContainer);
        }

        // Keep button functionality as backup
        const writeStoryBtn = document.getElementById('writeStoryBtn');
        if (writeStoryBtn) { writeStoryBtn.addEventListener('click', startSequence); }
    }

    // --- Feature 2 & 3: Observers and Handlers ---
    function setupFeatureObservers() {
        const warrantyContainer = document.getElementById('warrantyContainer');
        const techSpecsContainer = document.getElementById('techSpecsContainer');

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
    }

    function calculateOptimalPositions() {
        const container = document.getElementById('warrantyContainer');
        const overlays = document.querySelectorAll('.warranty-overlay');
        if (!container || overlays.length === 0) return;
        const screenWidth = window.innerWidth;
        let positions = [];
        if (screenWidth <= 640) { positions = [ { left: '8%', top: '5%', width: '36vw', zIndex: 14 }, { right: '8%', top: '25%', width: '38vw', zIndex: 13 }, { left: '12%', top: '48%', width: '40vw', zIndex: 12 }, { right: '12%', top: '70%', width: '37vw', zIndex: 15 } ]; } 
        else if (screenWidth <= 1024) { positions = [ { left: '4%', top: '8%', width: '25vw', zIndex: 14 }, { right: '4%', top: '18%', width: '27vw', zIndex: 13 }, { left: '4%', bottom: '26%', width: '29vw', zIndex: 12 }, { right: '4%', bottom: '8%', width: '26vw', zIndex: 15 } ]; } 
        else { positions = [ { left: '4%', top: '6%', width: '15vw', zIndex: 14 }, { right: '4%', top: '12%', width: '17vw', zIndex: 13 }, { left: '4%', bottom: '20%', width: '19vw', zIndex: 12 }, { right: '4%', bottom: '18%', width: '16vw', zIndex: 16 } ]; }
        overlays.forEach((overlay, index) => {
            if (index >= positions.length) return;
            const pos = positions[index];
            Object.assign(overlay.style, { position: 'absolute', left: pos.left || 'auto', top: pos.top || 'auto', right: pos.right || 'auto', bottom: pos.bottom || 'auto', width: pos.width, zIndex: pos.zIndex, opacity: '1' });
        });
    }

    function animateSpecsSequence() {
        const q1 = document.getElementById('q1Bubble');
        const a1 = document.getElementById('a1Bubble');
        const q2 = document.getElementById('q2Bubble');
        const a2 = document.getElementById('a2Bubble');

        // Reset all elements first
        resetSpecsBubbles();

        // Animation sequence: Q1, pause 0.5s, A1, pause 1.5s, Q2, pause 0.5s, A2
        setTimeout(() => {
            if (q1) {
                q1.style.opacity = '1';
                q1.style.transform = 'translateY(0)';
            }
        }, 0);

        setTimeout(() => {
            if (a1) {
                a1.style.opacity = '1';
                a1.style.transform = 'translateY(0)';
            }
        }, 500);

        setTimeout(() => {
            if (q2) {
                q2.style.opacity = '1';
                q2.style.transform = 'translateY(0)';
            }
        }, 2000);

        setTimeout(() => {
            if (a2) {
                a2.style.opacity = '1';
                a2.style.transform = 'translateY(0)';
            }
        }, 2500);
    }

    function resetSpecsBubbles() {
        const allBubbles = document.querySelectorAll('#techSpecsContainer .message-bubble');
        allBubbles.forEach(bubble => { 
            bubble.style.opacity = '0'; 
            bubble.style.transform = 'translateY(10px)'; 
        });
        document.querySelectorAll('#techSpecsContainer .clickable-question').forEach(q => {
            q.classList.remove('tapped');
            // Keep the original notap images since that's what we want to show
        });
    }

    function setupSpecsClickHandlers() {
        const questions = document.querySelectorAll('#techSpecsContainer .clickable-question');
        questions.forEach(question => {
            question.addEventListener('click', function() {
                if(this.classList.contains('tapped')) return;
                const answerId = this.getAttribute('data-answer');
                const answerBubble = document.getElementById(answerId);
                if (answerBubble) { answerBubble.style.opacity = '1'; answerBubble.style.transform = 'translateY(0)'; }
                this.classList.add('tapped');
                const img = this.querySelector('img');
                if (!img) return;
                // The images are already the "notap" versions, so no need to change them
            });
        });
    }

    // --- Feature 4: "Choose Your Own Adventure" Demo ---
    function initializeChooserDemo() {
        const choicesWrapper = document.getElementById('choices-wrapper');
        const chatLog = document.getElementById('chat-log');
        if (!choicesWrapper || !chatLog) return;

        const choicesHeading = document.getElementById('choices-heading');
        const choiceBubbles = document.getElementById('choice-bubbles');
        const chatOverlay = document.getElementById('chat-overlay');

        const scrollToBottom = () => { if (chatLog) chatLog.scrollTop = chatLog.scrollHeight; };

        const _renderChoices = (choicesArray) => {
            if (!choiceBubbles || !choicesHeading) return;
            const text = 'Try It!';
            const emoji = '&#128073;';
            const textSpans = text.split('').map(char => `<span>${char === ' ' ? '&nbsp;' : char}</span>`).join('');
            choicesHeading.innerHTML = textSpans + `<span>${emoji}</span>`;
            const chars = choicesHeading.querySelectorAll('span');
            chars.forEach((char, index) => { char.style.animationDelay = `${index * 0.08}s`; });

            choiceBubbles.innerHTML = '';
            const isInitialChoice = choicesArray.length > 0 && (choicesArray[0].id === 'initial_error_code_path' || choicesArray[0].id === 'initial_symptom_path');
            choicesArray.forEach((choice, index) => {
                const button = document.createElement('button');
                button.dataset.choice = choice.id;
                button.innerText = choice.text;
                button.className = choice.id === 'reset' ? 'bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg text-sm shadow-md transition-transform transform hover:scale-105' : 'bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg text-sm shadow-md transition-transform transform hover:scale-105';
                choiceBubbles.appendChild(button);
                if (choicesArray.length === 2 && index === 0 && !isInitialChoice) {
                    const orText = document.createElement('span');
                    orText.className = 'text-gray-500 font-semibold';
                    orText.innerText = 'or';
                    choiceBubbles.appendChild(orText);
                }
            });
        };

        const resetDemo = () => {
            if (chatLog) chatLog.innerHTML = '';
            if (chatOverlay) chatOverlay.classList.add('opacity-0');
            if (choicesHeading) choicesHeading.classList.remove('no-animation');
            _renderChoices([{ text: 'Error codes', id: 'initial_error_code_path' }, { text: 'Mystery noise', id: 'initial_symptom_path' }]);
        };

        const addMessage = (text, type, delay = 0) => new Promise(resolve => setTimeout(() => {
            const messageElement = document.createElement('div');
            messageElement.classList.add('chat-bubble', type);
            messageElement.innerHTML = text;
            if (chatLog) chatLog.appendChild(messageElement);
            setTimeout(scrollToBottom, 50);
            resolve();
        }, delay));

        const showChoices = (choices, delay = 0) => setTimeout(() => _renderChoices(choices), delay);

        const handleChoice = async (choiceId) => {
            if (choiceId === 'initial_error_code_path' || choiceId === 'initial_symptom_path') {
                if (choicesHeading) choicesHeading.classList.add('no-animation');
                if (chatOverlay) chatOverlay.classList.remove('opacity-0');
            } else if (choiceId !== 'reset') {
                if (choiceBubbles) choiceBubbles.innerHTML = '';
            }

            switch (choiceId) {
                case 'initial_error_code_path':
                    await addMessage('I got these error codes: U0235, C1A67, U0415', 'user-message');
                    await addMessage("Okay, I see three codes related to the advanced driver-assistance system.", 'robot-message', 1250);
                    showChoices([{ text: 'What do these codes mean?', id: 'path1_what_mean' }, { text: 'Suggest next steps', id: 'path1_suggest_steps' }], 500);
                    break;
                case 'initial_symptom_path':
                    await addMessage("The rustomer reports a rattling noise from the rear passenger side...There’s a metallic rattle at 30–50 mph.", 'user-message');
                    await addMessage("Remove the right rear wheel. Inspect rear passenger side wheel area...", 'robot-message', 1250);
                    showChoices([{ text: 'Rotor noise', id: 'symptom_rotor_noise' }, { text: 'Everything normal', id: 'symptom_everything_normal' }], 500);
                    break;
                case 'reset':
                    resetDemo();
                    break;
                // Add all other story branch cases here...
            }
        };

        choicesWrapper.addEventListener('click', (e) => {
            if (e.target.matches('#choice-bubbles button[data-choice]')) {
                handleChoice(e.target.dataset.choice);
            }
        });
        resetDemo();
    }

    // ===========================================
    // INITIALIZE ALL PAGE SCRIPTS
    // ===========================================
    createVoiceVisualizer();
    initializeWaveformAnimation();
    initializeChooserDemo();
    setupVideoTimerSync();
    setupFeatureObservers();

    // Recalculate warranty positions on window resize
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(calculateOptimalPositions, 250);
    });

});

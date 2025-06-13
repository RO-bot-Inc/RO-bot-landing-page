
// Voice Visualizer Vanilla JavaScript Component
function createVoiceVisualizer() {
    const voiceVisualizerRoot = document.getElementById('voice-visualizer-root');
    if (!voiceVisualizerRoot) return;

    // Create the voice visualizer container
    const container = document.createElement('div');
    container.className = 'voice-visualizer-container';
    container.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 30;
        width: 200px;
        height: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
    `;

    // Create the voice line
    const voiceLine = document.createElement('div');
    voiceLine.className = 'voice-line';
    voiceLine.style.cssText = `
        width: 100%;
        height: 2px;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.8), transparent);
        border-radius: 2px;
        animation: voicePulse 2s ease-in-out infinite;
        box-shadow: 0 0 8px rgba(255, 255, 255, 0.3);
    `;

    container.appendChild(voiceLine);
    voiceVisualizerRoot.appendChild(container);
}

// Waveform Animation Function
function initializeWaveformAnimation() {
    const waveformContainer = document.getElementById('waveform');
    if (!waveformContainer) return;

    // Check if waveform is already initialized to prevent duplicates
    if (waveformContainer.querySelector('.waveform-bars')) {
        console.log('Waveform already initialized, skipping...');
        return;
    }

    // Create bars container
    const barsContainer = document.createElement('div');
    barsContainer.className = 'waveform-bars';

    // Insert bars container before the text container
    const textContainer = document.getElementById('animated-text-container');
    if (textContainer) {
        waveformContainer.insertBefore(barsContainer, textContainer);
    } else {
        waveformContainer.appendChild(barsContainer);
    }

    const numberOfBars = 40;
    const bars = [];
    const targetHeights = new Array(numberOfBars).fill(0.05);
    const visualHeights = new Array(numberOfBars).fill(0.05);
    const smoothingFactor = 0.1;
    let isSpeaking = true;

    for (let i = 0; i < numberOfBars; i++) {
        const bar = document.createElement('div');
        bar.classList.add('waveform-bar');
        barsContainer.appendChild(bar);
        bars.push(bar);
    }

    function manageSpeechCycle() {
        isSpeaking = !isSpeaking;
        const duration = isSpeaking ? 2000 + Math.random() * 2000 : 1000 + Math.random() * 1500;
        setTimeout(manageSpeechCycle, duration);
    }

    let frameCount = 0;
    function animateWave() {
        if (frameCount % 4 === 0) {
            for (let i = 0; i < numberOfBars - 1; i++) {
                targetHeights[i] = targetHeights[i + 1];
            }
            let newHeight;
            if (isSpeaking && Math.random() > 0.7) { 
                newHeight = 0.4 + Math.random() * 0.6; 
            } else {
                newHeight = 0.05 + Math.random() * 0.1;
            }
            targetHeights[numberOfBars - 1] = newHeight;
        }
        for (let i = 0; i < numberOfBars; i++) {
            visualHeights[i] += (targetHeights[i] - visualHeights[i]) * smoothingFactor;
            bars[i].style.transform = `scaleY(${visualHeights[i]})`;
        }
        frameCount++;
        requestAnimationFrame(animateWave);
    }

    animateWave();
    manageSpeechCycle();

    // Initialize text animation
    initializeTextAnimation();
}

// Text Animation Function
function initializeTextAnimation() {
    const textContainer = document.getElementById('animated-text-container');
    if (!textContainer) return;

    const sentences = [
        "The engine compartment looks pretty clean overall. No leaks that I can see.",
        "A bit of corrosion around the battery terminals.",
        "Looks like a cracked hose right here."
    ];

    let currentSentenceIndex = 0;
    let currentWordIndex = 0;
    let isAnimating = false;

    function animateNextWord() {
        if (isAnimating) return;

        const currentSentence = sentences[currentSentenceIndex];
        const words = currentSentence.split(' ');

        if (currentWordIndex < words.length) {
            // Add the next word
            const currentText = words.slice(0, currentWordIndex + 1).join(' ');
            textContainer.textContent = currentText;
            currentWordIndex++;

            // Continue with next word after 200ms
            setTimeout(animateNextWord, 200);
        } else {
            // Sentence complete, pause for 2 seconds
            setTimeout(() => {
                // Move to next sentence
                currentSentenceIndex = (currentSentenceIndex + 1) % sentences.length;
                currentWordIndex = 0;
                textContainer.textContent = '';

                // Start next sentence after clearing
                setTimeout(animateNextWord, 300);
            }, 2000);
        }
    }

    // Start the animation
    setTimeout(animateNextWord, 1000);
}

// Chat demo functionality
const chatChoices = [
    {
        text: "Error codes",
        response: "P0234 indicates turbocharger overboost. Common causes: wastegate actuator malfunction, boost pressure sensor fault, or vacuum leak."
    },
    {
        text: "Mystery noise",
        response: "Based on your description, that grinding noise during turns could be CV joints or wheel bearings. Check for play in the wheel and listen for changes when turning left vs right."
    }
];

// Function to create choice bubbles
function createChoiceBubbles() {
    const choiceBubbles = document.getElementById('choice-bubbles');
    if (!choiceBubbles) {
        console.log('Choice bubbles container not found');
        return;
    }

    console.log('Creating choice bubbles');
    choiceBubbles.innerHTML = '';

    chatChoices.forEach((choice, index) => {
        const bubble = document.createElement('button');
        bubble.className = 'choice-bubble';
        bubble.textContent = choice.text;
        bubble.style.cssText = `
            background-color: #3B82F6;
            color: white;
            border: none;
            border-radius: 20px;
            padding: 8px 16px;
            margin: 0 4px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            transition: all 0.2s ease;
            white-space: nowrap;
        `;

        bubble.addEventListener('mouseenter', () => {
            bubble.style.backgroundColor = '#2563EB';
            bubble.style.transform = 'translateY(-2px)';
        });

        bubble.addEventListener('mouseleave', () => {
            bubble.style.backgroundColor = '#3B82F6';
            bubble.style.transform = 'translateY(0)';
        });

        bubble.addEventListener('click', () => {
            handleChoiceClick(index);
        });

        choiceBubbles.appendChild(bubble);
    });
}

// Handle choice bubble clicks
function handleChoiceClick(index) {
    const choice = chatChoices[index];
    const chatLog = document.getElementById('chat-log');

    if (!chatLog) {
        console.log('Chat log not found');
        return;
    }

    // Add user message
    const userMessage = document.createElement('div');
    userMessage.className = 'chat-bubble user-message';
    userMessage.textContent = choice.text;
    chatLog.appendChild(userMessage);

    // Add robot response after a delay
    setTimeout(() => {
        const robotMessage = document.createElement('div');
        robotMessage.className = 'chat-bubble robot-message';
        robotMessage.textContent = choice.response;
        chatLog.appendChild(robotMessage);

        // Scroll to bottom
        chatLog.scrollTop = chatLog.scrollHeight;
    }, 1000);

    // Hide choice bubbles after first interaction
    const choiceBubbles = document.getElementById('choice-bubbles');
    if (choiceBubbles) {
        choiceBubbles.style.opacity = '0.5';
        choiceBubbles.style.pointerEvents = 'none';
    }
}

// Main DOMContentLoaded event listener - SINGLE INSTANCE
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing...');

    // Create Voice Visualizer
    createVoiceVisualizer();

    // Initialize waveform animation (only once)
    initializeWaveformAnimation();

    // Only disable autoplay on 5-Second Stories video, leave other videos alone
    const storyVideo = document.querySelector('video[src*="update story.mov"], video source[src*="update story.mov"]');
    const actualStoryVideo = storyVideo ? storyVideo.parentElement.tagName === 'VIDEO' ? storyVideo.parentElement : storyVideo : null;

    if (actualStoryVideo) {
        actualStoryVideo.removeAttribute('autoplay');
        actualStoryVideo.pause();
        actualStoryVideo.currentTime = 0;
    }

    // Initialize choice bubbles for Feature 4
    createChoiceBubbles();

    // New specs animation logic - auto-animate questions, click for answers
    function animateSpecsQuestions() {
        const questions = document.querySelectorAll('.clickable-question');

        questions.forEach((question, index) => {
            const delay = index * 800; // 800ms between Q1 and Q2

            setTimeout(() => {
                question.style.opacity = '1';
                question.style.transform = 'translateY(0)';
                question.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            }, delay);
        });
    }

    // Function to hide all specs bubbles when not in viewport
    function hideSpecsBubbles() {
        const allBubbles = document.querySelectorAll('.message-bubble');
        allBubbles.forEach(bubble => {
            bubble.style.opacity = '0';
            bubble.style.transform = 'translateY(10px)';
            bubble.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        });

        // Reset question images back to original tappable versions
        resetQuestionImages();
    }

    // Function to show answer bubble when question is clicked
    function showAnswerBubble(answerId) {
        const answerBubble = document.getElementById(answerId);
        if (answerBubble) {
            answerBubble.style.opacity = '1';
            answerBubble.style.transform = 'translateY(0)';
            answerBubble.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        }
    }

    // Function to replace question image with no-tap version
    function replaceQuestionImage(questionElement) {
        const img = questionElement.querySelector('img');
        if (!img) return;

        const currentSrc = img.src;
        if (currentSrc.includes('Q1_notap.png')) {
            img.src = 'specs/Q1_notap.png';
            questionElement.classList.add('tapped');
            questionElement.classList.remove('clickable-question');
        } else if (currentSrc.includes('Q2_notap.png')) {
            img.src = 'specs/Q2_notap.png';
            questionElement.classList.add('tapped');
            questionElement.classList.remove('clickable-question');
        }
    }

    // Function to reset question images back to original
    function resetQuestionImages() {
        const q1Element = document.getElementById('q1Bubble');
        const q2Element = document.getElementById('q2Bubble');

        if (q1Element && q1Element.classList.contains('tapped')) {
            const img = q1Element.querySelector('img');
            if (img) {
                img.src = 'specs/Q1_notap.png';
                q1Element.classList.remove('tapped');
                q1Element.classList.add('clickable-question');
            }
        }

        if (q2Element && q2Element.classList.contains('tapped')) {
            const img = q2Element.querySelector('img');
            if (img) {
                img.src = 'specs/Q2_notap.png';
                q2Element.classList.remove('tapped');
                q2Element.classList.add('clickable-question');
            }
        }
    }

    // Setup click handlers for questions with enhanced feedback
    function setupSpecsClickHandlers() {
        const questions = document.querySelectorAll('.clickable-question');

        questions.forEach(question => {
            // Add click handler
            question.addEventListener('click', function() {
                const answerId = this.getAttribute('data-answer');

                // Add click animation
                this.style.transform = 'translateY(-4px) scale(0.98)';
                setTimeout(() => {
                    this.style.transform = 'translateY(0) scale(1)';
                }, 150);

                // Hide the click indicator after clicking
                this.style.setProperty('--clicked', 'true');

                // Replace the question image with no-tap version
                replaceQuestionImage(this);

                showAnswerBubble(answerId);
            });

            // Add mouse enter/leave effects for better feedback
            question.addEventListener('mouseenter', function() {
                // Only show hover effects if not tapped
                if (!this.classList.contains('tapped')) {
                    this.style.cursor = 'pointer';
                }
            });

            question.addEventListener('mouseleave', function() {
                if (!this.style.getPropertyValue('--clicked') && !this.classList.contains('tapped')) {
                    this.style.transform = 'translateY(0) scale(1)';
                }
            });
        });
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

        // For mobile screens, apply better spacing
        if (screenWidth <= 640) {
            floatingTexts.forEach((text, index) => {
                if (index === 0) {
                    text.style.top = '65%';
                    text.style.left = '5%';
                    text.style.right = 'auto';
                }
                if (index === 1) {
                    text.style.top = '72%';
                    text.style.right = '5%';
                    text.style.left = 'auto';
                }
                if (index === 2) {
                    text.style.top = '85%';
                    text.style.left = '5%';
                    text.style.right = 'auto';
                    text.style.textAlign = 'left';
                    text.style.transform = 'none';
                }
            });
        }

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

    // Adjust overlapping text elements with minimal movement - prioritize overlap tolerance
    function adjustOverlappingText(elem1, elem2, overlap, screenWidth) {
        // Increase overlap tolerance - only adjust for significant overlaps
        const overlapThreshold = screenWidth <= 640 ? 200 : 300;

        if (overlap.area < overlapThreshold) {
            return; // Allow minor overlaps
        }

        const maxAdjustment = screenWidth <= 640 ? 10 : 15; // Even smaller adjustments

        if (overlap.width > overlap.height) {
            // Horizontal overlap - make minimal adjustments
            const elem1Style = window.getComputedStyle(elem1);
            const elem2Style = window.getComputedStyle(elem2);

            // Only adjust if elements are too close to center
            if (elem1Style.left !== 'auto' && parseFloat(elem1Style.left) > 40) {
                const currentLeft = parseFloat(elem1Style.left);
                elem1.style.left = Math.max(5, currentLeft - 1) + '%';
            }

            if (elem2Style.right !== 'auto' && parseFloat(elem2Style.right) > 40) {
                const currentRight = parseFloat(elem2Style.right);
                elem2.style.right = Math.max(5, currentRight - 1) + '%';
            }
        } else {
            // Vertical overlap - prefer stacking with slight offset
            const elem1Style = window.getComputedStyle(elem1);
            const elem2Style = window.getComputedStyle(elem2);

            // Only move lower element if there's room
            if (elem2Style.top !== 'auto' && elem2Style.top !== '') {
                const currentTop = parseFloat(elem2Style.top);
                if (currentTop < 80) {
                    elem2.style.top = Math.min(80, currentTop + 0.5) + '%';
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

    // Automatic specs animation sequence
    function animateSpecsSequence() {
        console.log('Starting specs animation sequence');

        // Get all the elements we need to animate
        const q1Bubble = document.getElementById('q1Bubble');
        const a1Bubble = document.getElementById('a1Bubble');
        const q2Bubble = document.getElementById('q2Bubble');
        const a2Bubble = document.getElementById('a2Bubble');

        if (!q1Bubble || !a1Bubble || !q2Bubble || !a2Bubble) {
            console.log('Some specs elements not found');
            return;
        }

        // Animation sequence with precise timing
        // 1. Q1 appears
        setTimeout(() => {
            q1Bubble.style.opacity = '1';
            q1Bubble.style.transform = 'translateY(0)';
            q1Bubble.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        }, 0);

        // 2. A1 appears after 0.5 second pause
        setTimeout(() => {
            a1Bubble.style.opacity = '1';
            a1Bubble.style.transform = 'translateY(0)';
            a1Bubble.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        }, 500);

        // 3. Q2 appears after 1.5 second pause (from A1)
        setTimeout(() => {
            q2Bubble.style.opacity = '1';
            q2Bubble.style.transform = 'translateY(0)';
            q2Bubble.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        }, 2000);

        // 4. A2 appears after 0.5 second pause (from Q2)
        setTimeout(() => {
            a2Bubble.style.opacity = '1';
            a2Bubble.style.transform = 'translateY(0) scale(1.3)';
            a2Bubble.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        }, 2500);
    }

    // Reset specs elements for next animation
    function resetSpecsSequence() {
        console.log('Resetting specs animation sequence');

        const allBubbles = document.querySelectorAll('#techSpecsContainer .message-bubble');
        allBubbles.forEach(bubble => {
            bubble.style.opacity = '0';
            bubble.style.transform = 'translateY(10px)';
            bubble.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        });

        // Reset question images back to original tappable versions
        resetQuestionImages();
    }

    // Observer for specs section with scroll-triggered animation
    const specsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Container is entering viewport - trigger animation after 1 second delay
                console.log('Specs container entering viewport, starting animation in 1 second');
                setTimeout(() => {
                    animateSpecsSequence();
                }, 1000);
                entry.target.setAttribute('data-specs-visible', 'true');
            } else {
                // Container is leaving viewport - reset for next time
                console.log('Specs container left viewport, resetting');
                resetSpecsSequence();
                entry.target.setAttribute('data-specs-visible', 'false');
            }
        });
    }, {
        threshold: 0.8, // Trigger when 80% of container is visible
        rootMargin: '0px'
    });

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
        // Find the background image within the specs container
        const specsBackgroundImg = techSpecsContainer.querySelector('img[src*="dipstick"]');
        if (specsBackgroundImg) {
            specsObserver.observe(specsBackgroundImg);
        } else {
            // Fallback to container if no background image found
            specsObserver.observe(techSpecsContainer);
        }
    }

    if (diagnosticContainer) {
        diagnosticsObserver.observe(diagnosticContainer);
    }

    if (warrantyContainer) {
        warrantyObserver.observe(warrantyContainer);
    }

    // Video-Timer Sync - Scroll-Triggered Version
    function setupVideoTimerSync() {
        // Find the timer iframe first
        const timerIframe = document.querySelector('iframe[src*="timer.html"]');

        // Find the video element - look more broadly
        let actualVideo = null;

        // First try to find video by source attribute
        actualVideo = document.querySelector('video[src*="update_story"]') || 
                     document.querySelector('video source[src*="update_story"]')?.parentElement;

        // If not found, look in the same container as the timer iframe
        if (!actualVideo && timerIframe) {
            const featureContainer = timerIframe.closest('.flex, .relative, div');
            if (featureContainer) {
                actualVideo = featureContainer.querySelector('video');
            }
        }

        // Fallback: get any video in the feature section
        if (!actualVideo) {
            const featureSections = document.querySelectorAll('.flex.flex-col.md\\:flex-row');
            for (let section of featureSections) {
                const video = section.querySelector('video');
                if (video) {
                    actualVideo = video;
                    break;
                }
            }
        }

        console.log('Story video found:', actualVideo);
        console.log('Timer iframe found:', timerIframe);

        if (!actualVideo || !timerIframe) {
            console.log('Video or timer not found, retrying in 1 second...');
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

        // Reset function to prepare for next trigger
        function resetSequence() {
            console.log('Resetting video and timer');
            actualVideo.pause();
            actualVideo.currentTime = 0;
            actualVideo.muted = true;
            actualVideo.removeAttribute('autoplay');
            sendTimerMessage('resetTimer');
            window.buttonVideoPlaying = false;
        }

        // Start sequence: play video and timer simultaneously
        function startSequence() {
            console.log('Starting video-timer sequence');

            // Set flag to allow this video to play
            window.buttonVideoPlaying = true;

            // Prepare video
            actualVideo.removeAttribute('autoplay');
            actualVideo.removeAttribute('loop');
            actualVideo.currentTime = 0;
            actualVideo.muted = true;

            // Add event listener to stop video after one play cycle
            const handleVideoEnd = () => {
                console.log('Video finished, stopping');
                actualVideo.pause();
                window.buttonVideoPlaying = false;
                actualVideo.removeEventListener('ended', handleVideoEnd);
            };
            actualVideo.addEventListener('ended', handleVideoEnd);

            // Start video and timer
            const playPromise = actualVideo.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    console.log('Video started successfully');
                    sendTimerMessage('startTimer');
                }).catch(error => {
                    console.error('Error playing video:', error);
                    window.buttonVideoPlaying = false;
                });
            } else {
                sendTimerMessage('startTimer');
            }
        }

        // Listen for timer stopping
        window.addEventListener('message', (event) => {
            if (event.data === 'timerStopped') {
                console.log('Timer stopped at 1.671');
            }
        });

        // Initialize video
        resetSequence();

        // Setup scroll-triggered animation with reset
        setupStoryScrollTrigger(startSequence, resetSequence);

        // Keep button click handler as backup
        const writeStoryBtn = document.getElementById('writeStoryBtn');
        if (writeStoryBtn) {
            writeStoryBtn.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('Button clicked, starting sequence');
                startSequence();
            });
        }

        // Expose controls globally
        window.videoTimerControls = {
            start: startSequence,
            reset: resetSequence
        };
    }

    // Scroll-triggered animation for Feature 1 with reset capability
    function setupStoryScrollTrigger(startSequence, resetSequence) {
        // Find the container with the typing.png image
        let targetContainer = null;

        // Look for the container that has both the image and the iframe
        const timerIframe = document.querySelector('iframe[src*="timer.html"]');
        if (timerIframe) {
            targetContainer = timerIframe.closest('.relative, .bg-black, div');
        }

        // Fallback: find by image
        if (!targetContainer) {
            const typingImage = document.querySelector('img[src*="typing.png"]');
            if (typingImage) {
                targetContainer = typingImage.closest('.relative, .bg-black, div');
            }
        }

        console.log('Target container for scroll trigger:', targetContainer);

        if (!targetContainer) {
            console.log('Feature container not found for scroll trigger');
            return;
        }

        let hasTriggered = false;
        let animationTimeout = null;

        const storyObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Container is entering viewport
                    if (!hasTriggered) {
                        console.log('Feature 1 container entering viewport, triggering animation in 0.5 seconds');
                        hasTriggered = true;

                        // Clear any existing timeout
                        if (animationTimeout) {
                            clearTimeout(animationTimeout);
                        }

                        animationTimeout = setTimeout(() => {
                            startSequence();
                        }, 500); // 0.5 second delay as requested
                    }
                } else {
                    // Container is leaving viewport - reset for next time
                    console.log('Feature 1 container left viewport, resetting');
                    hasTriggered = false;

                    // Clear any pending animation
                    if (animationTimeout) {
                        clearTimeout(animationTimeout);
                        animationTimeout = null;
                    }

                    // Reset the sequence
                    resetSequence();
                }
            });
        }, {
            threshold: 0.8, // Trigger when 80% of container is visible
            rootMargin: '0px'
        });

        storyObserver.observe(targetContainer);
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

    console.log('All initialization complete');
});

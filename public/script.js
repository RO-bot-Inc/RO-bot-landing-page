document.addEventListener('DOMContentLoaded', () => {

    /* ---------- Chat-demo HELPER UTILITIES ---------- */

    // Keep the newest bubble scrolled into view
    function scrollToBottom() {
        const chatLog = document.getElementById('chat-log');
        if (chatLog) chatLog.scrollTop = chatLog.scrollHeight;
    }

    // Add a bubble after an optional delay, then resolve a promise
    function addMessage(html, cssClass, delay = 0) {
        return new Promise(res => setTimeout(() => {
            const chatLog = document.getElementById('chat-log');
            if (!chatLog) return;
            const bubble = document.createElement('div');
            bubble.classList.add('chat-bubble', cssClass);
            bubble.innerHTML = html;
            chatLog.appendChild(bubble);
            setTimeout(scrollToBottom, 20);
            res();
        }, delay));
    }

    // ===========================================
    // ALL FUNCTION DEFINITIONS
    // ===========================================

    // --- Hero Section Animations ---
    function createVoiceVisualizer() { /*  … unchanged …  */ }

    function initializeWaveformAnimation() { /*  … unchanged …  */ }

    function initializeTextAnimation() { /*  … unchanged …  */ }

    // --- Feature 1: 5-Second Stories ---
    function setupVideoTimerSync() { /*  … unchanged …  */ }

    // --- Feature 2 & 3: Observers and Handlers ---
    function setupFeatureObservers() { /*  … unchanged …  */ }
    function calculateOptimalPositions() { /*  … unchanged …  */ }
    function animateSpecsSequence() { /*  … unchanged …  */ }
    function resetSpecsBubbles() { /*  … unchanged …  */ }
    function setupSpecsClickHandlers() { /*  … unchanged …  */ }

    /* ---------- LINEAR CHAT DEMO ---------- */
    function initializeChatDemo() {
        const chatLog  = document.getElementById('chat-log');
        const chatWrap = document.getElementById('chat-overlay');
        if (!chatLog || !chatWrap) return;

        // Edit dialogue or timing here
        const timeline = [
            { who:'user',  text:'Hey RO-bot, I pulled these codes: U0235, C1A67, U0415.', delay: 0 },
            { who:'robot', text:'Got it. Three ADAS-related faults. Let me decode…', delay: 1200 },
            { who:'robot', text:'• U0235 → Lost comms with cruise control<br>• C1A67 → Radar mis-alignment<br>• U0415 → ABS data invalid', delay: 800 },
            { who:'user',  text:'Okay, what should I check first?', delay: 1400 },
            { who:'robot', text:'Start with a quick radar calibration. If that passes, inspect wiring at the ABS connector.', delay: 1000 },
            { who:'user',  text:'👍 Thanks — that saves me some guess-work.', delay: 1600 }
        ];

        function playChat() {
            chatLog.innerHTML = '';
            chatWrap.classList.remove('opacity-0');
            let t = 0;
            timeline.forEach(m => {
                t += m.delay;
                setTimeout(() => {
                    addMessage(
                        m.text,
                        m.who === 'user' ? 'user-message' : 'robot-message'
                    );
                }, t);
            });
        }

        // Play once when section is fully visible
        const section = document.getElementById('choices-wrapper') || chatWrap;
        if (!section) return;
        const obs = new IntersectionObserver(entries => {
            entries.forEach(e => {
                if (e.isIntersecting && e.intersectionRatio === 1) {
                    playChat();
                    obs.unobserve(e.target);
                }
            });
        }, { threshold: 1 });
        obs.observe(section);
    }

    // ===========================================
    // INITIALIZE ALL PAGE SCRIPTS
    // ===========================================
    createVoiceVisualizer();
    initializeWaveformAnimation();
    initializeChatDemo();
    setupVideoTimerSync();
    setupFeatureObservers();

    // Recalculate warranty positions on window resize
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(calculateOptimalPositions, 250);
    });

});

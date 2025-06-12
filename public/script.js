// New, combined hero animation function
function initializeHeroAnimation() {
    const waveformContainer = document.getElementById('waveform');
    const transcriptionContainer = document.getElementById('transcription-text');
    if (!waveformContainer || !transcriptionContainer) return;

    const numberOfBars = 40;
    const bars = [];
    const targetHeights = new Array(numberOfBars).fill(0.05);
    const visualHeights = new Array(numberOfBars).fill(0.05);
    const smoothingFactor = 0.1;
    let isSpeaking = false;

    // The sentences to be animated
    const sentences = [
        "The engine compartment looks pretty clean overall.",
        "No leaks that I can see.",
        "A bit of corrosion around the battery terminals.",
        "Looks like a cracked hose right here."
    ];
    let currentSentenceIndex = 0;

    // Create a container for the waveform bars
    const barsContainer = document.createElement('div');
    barsContainer.classList.add('waveform-bars');
    waveformContainer.insertBefore(barsContainer, transcriptionContainer);

    // Generate the bar elements inside the bars container
    for (let i = 0; i < numberOfBars; i++) {
        const bar = document.createElement('div');
        bar.classList.add('waveform-bar');
        barsContainer.appendChild(bar);
        bars.push(bar);
    }

    // This is the main animation loop for the waveform visualizer
    function animateWave() {
        if (isSpeaking && Math.random() > 0.5) {
            // Create more dramatic variations with occasional super tall peaks
            const randomValue = Math.random();
            if (randomValue > 0.8) {
                // 20% chance of very tall peaks
                targetHeights[numberOfBars - 1] = 1.2 + Math.random() * 0.8;
            } else {
                // Regular speaking heights with more variation
                targetHeights[numberOfBars - 1] = 0.3 + Math.random() * 1.2;
            }
        } else {
            targetHeights[numberOfBars - 1] = 0.01 + Math.random() * 0.05;
        }

        // Propagate heights with natural variation
        for (let i = 0; i < numberOfBars - 1; i++) {
            targetHeights[i] = targetHeights[i + 1];
            
            // Add variation to bars that are more than 5 positions apart from each other
            if (i % 6 === 0 && isSpeaking) {
                // Every 6th bar gets additional random variation during speech
                const variationFactor = 0.3 + Math.random() * 0.4; // 0.3 to 0.7 multiplier
                targetHeights[i] *= variationFactor;
                
                // Occasionally make some bars significantly different
                if (Math.random() > 0.8) {
                    targetHeights[i] = 0.2 + Math.random() * 0.8;
                }
            }
            
            // Add subtle micro-variations to create more natural speech patterns
            if (isSpeaking && Math.random() > 0.7) {
                const microVariation = 0.9 + Math.random() * 0.2; // ±10% variation
                targetHeights[i] *= microVariation;
            }
        }

        for (let i = 0; i < numberOfBars; i++) {
            visualHeights[i] += (targetHeights[i] - visualHeights[i]) * smoothingFactor;
            bars[i].style.transform = `scaleY(${visualHeights[i]})`;
        }
        requestAnimationFrame(animateWave);
    }

    // This function controls the word-by-word animation cycle
    async function transcriptionCycle() {
        while (true) {
            const sentence = sentences[currentSentenceIndex];
            const words = sentence.split(' ');
            transcriptionContainer.innerHTML = '';

            for (const word of words) {
                isSpeaking = true;
                const wordSpan = document.createElement('span');
                wordSpan.textContent = word + ' ';
                wordSpan.style.opacity = '0';
                wordSpan.style.transition = 'opacity 0.2s ease-in-out';
                transcriptionContainer.appendChild(wordSpan);

                await new Promise(resolve => setTimeout(resolve, 50));
                wordSpan.style.opacity = '1';

                const wordPause = 250 + Math.random() * 100;
                await new Promise(resolve => setTimeout(resolve, wordPause));
                isSpeaking = false;
                await new Promise(resolve => setTimeout(resolve, 50));
            }

            await new Promise(resolve => setTimeout(resolve, 2000));
            currentSentenceIndex = (currentSentenceIndex + 1) % sentences.length;
        }
    }

    // Start both animation loops
    animateWave();
    transcriptionCycle();
}

// Initialize hero animation when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeHeroAnimation();
});
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
        // Generate new bar at the rightmost position with variation
        if (isSpeaking && Math.random() > 0.7) {
            targetHeights[numberOfBars - 1] = 0.5 + Math.random() * 1.0;
        } else {
            targetHeights[numberOfBars - 1] = 0.02 + Math.random() * 0.08;
        }

        // Simply shift all bars to the left, maintaining their heights
        for (let i = 0; i < numberOfBars - 1; i++) {
            targetHeights[i] = targetHeights[i + 1];
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
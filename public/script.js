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

     // Generate the bar elements
     for (let i = 0; i < numberOfBars; i++) {
         const bar = document.createElement('div');
         bar.classList.add('waveform-bar');
         waveformContainer.appendChild(bar);
         bars.push(bar);
     }

     // This is the main animation loop for the waveform visualizer
     function animateWave() {
         if (isSpeaking && Math.random() > 0.7) {
             targetHeights[numberOfBars - 1] = 0.4 + Math.random() * 0.6;
         } else {
             targetHeights[numberOfBars - 1] = 0.05 + Math.random() * 0.1;
         }

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
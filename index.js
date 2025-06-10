const { exec } = require('child_process');
const path = require("path")
const express = require("express")
const app = express()

app.use(express.static(path.join(__dirname, "public")))

app.get("/", (req,res) => {
  exec('npx tailwindcss -i ./input.css -o ./public/out.css', (err, stdout, stderr) => {
    if (err) {
      console.error('Error building CSS:', err);
      return;
    }
  });
  res.sendFile(path.join(__dirname, "public/index.html"))
})

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`)
})

window.addEventListener('load', () => {
    const waveformContainer = document.getElementById('waveform');
    if (!waveformContainer) return;

    const numberOfBars = 40;
    const bars = [];
    const targetHeights = new Array(numberOfBars).fill(0.05);
    const visualHeights = new Array(numberOfBars).fill(0.05);
    const smoothingFactor = 0.1;
    let isSpeaking = true;

    for (let i = 0; i < numberOfBars; i++) {
        const bar = document.createElement('div');
        bar.classList.add('waveform-bar');
        waveformContainer.appendChild(bar);
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

    const text1 = document.getElementById('text1');
    const text2 = document.getElementById('text2');
    const text3 = document.getElementById('text3');

    if(text1) setTimeout(() => { text1.classList.add('visible'); }, 1000);
    if(text2) setTimeout(() => { text2.classList.add('visible'); }, 2500);
    if(text3) setTimeout(() => { text3.classList.add('visible'); }, 4000);
});

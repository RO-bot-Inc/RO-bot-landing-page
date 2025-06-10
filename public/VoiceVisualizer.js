
import React from 'react';

const VoiceVisualizer = () => {
  return (
    <div className="voice-visualizer-container">
      <div className="voice-line"></div>
      <style jsx>{`
        .voice-visualizer-container {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 20;
          width: 200px;
          height: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .voice-line {
          width: 100%;
          height: 2px;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.8), transparent);
          border-radius: 2px;
          animation: voicePulse 2s ease-in-out infinite;
          box-shadow: 0 0 8px rgba(255, 255, 255, 0.3);
        }

        @keyframes voicePulse {
          0%, 100% {
            height: 2px;
            opacity: 0.6;
            transform: scaleX(0.8);
          }
          25% {
            height: 3px;
            opacity: 0.8;
            transform: scaleX(0.9);
          }
          50% {
            height: 4px;
            opacity: 1;
            transform: scaleX(1);
          }
          75% {
            height: 3px;
            opacity: 0.8;
            transform: scaleX(0.95);
          }
        }

        @media (max-width: 640px) {
          .voice-visualizer-container {
            width: 150px;
            height: 3px;
          }
          
          .voice-line {
            height: 1.5px;
          }
          
          @keyframes voicePulse {
            0%, 100% {
              height: 1.5px;
              opacity: 0.6;
              transform: scaleX(0.8);
            }
            25% {
              height: 2px;
              opacity: 0.8;
              transform: scaleX(0.9);
            }
            50% {
              height: 3px;
              opacity: 1;
              transform: scaleX(1);
            }
            75% {
              height: 2.5px;
              opacity: 0.8;
              transform: scaleX(0.95);
            }
          }
        }
      `}</style>
    </div>
  );
};

export default VoiceVisualizer;

import React from 'react';
import { motion } from 'framer-motion';

function LunarLander({ thrustPercent, hasLanded, landingResult }) {
  const isThrusting = thrustPercent > 0 && !hasLanded;
  const thrustIntensity = thrustPercent / 100;

  // Determine lander state for visuals
  const landerState = hasLanded
    ? landingResult?.success
      ? 'landed'
      : 'crashed'
    : 'flying';

  return (
    <div className="relative">
      {/* Main lander body - Apollo LM style */}
      <svg
        width="120"
        height="140"
        viewBox="0 0 120 140"
        className={`drop-shadow-2xl ${landerState === 'crashed' ? 'opacity-50' : ''}`}
      >
        {/* Descent stage (octagonal base) */}
        <polygon
          points="30,80 20,90 20,110 30,120 90,120 100,110 100,90 90,80"
          fill="#3a3a3a"
          stroke="#5a5a5a"
          strokeWidth="2"
        />
        
        {/* Gold foil thermal blankets on descent stage */}
        <polygon
          points="32,82 22,92 22,108 32,118 88,118 98,108 98,92 88,82"
          fill="url(#goldFoil)"
          opacity="0.9"
        />

        {/* Ascent stage (crew cabin) */}
        <polygon
          points="40,35 35,45 35,80 40,85 80,85 85,80 85,45 80,35"
          fill="#4a4a4a"
          stroke="#6a6a6a"
          strokeWidth="2"
        />

        {/* Crew cabin window - main */}
        <polygon
          points="50,40 45,50 45,60 50,65 70,65 75,60 75,50 70,40"
          fill="#1a1a2e"
          stroke="#333"
          strokeWidth="1"
        />
        <polygon
          points="52,42 48,50 48,58 52,63 68,63 72,58 72,50 68,42"
          fill="#0a0a1a"
          opacity="0.8"
        />
        {/* Window glare */}
        <polygon
          points="53,43 50,48 50,52 53,55 58,55 60,52 60,48 58,43"
          fill="rgba(255,255,255,0.1)"
        />

        {/* Docking port on top */}
        <rect x="52" y="25" width="16" height="12" rx="2" fill="#555" stroke="#666" />
        <circle cx="60" cy="31" r="4" fill="#333" stroke="#444" />

        {/* RCS thrusters (4 corners) */}
        <rect x="30" y="50" width="6" height="8" fill="#444" />
        <rect x="84" y="50" width="6" height="8" fill="#444" />
        <rect x="30" y="70" width="6" height="8" fill="#444" />
        <rect x="84" y="70" width="6" height="8" fill="#444" />

        {/* Landing legs */}
        {/* Front left leg */}
        <line x1="30" y1="115" x2="5" y2="140" stroke="#666" strokeWidth="3" />
        <circle cx="5" cy="140" r="5" fill="#555" stroke="#666" />
        
        {/* Front right leg */}
        <line x1="90" y1="115" x2="115" y2="140" stroke="#666" strokeWidth="3" />
        <circle cx="115" cy="140" r="5" fill="#555" stroke="#666" />
        
        {/* Back left leg */}
        <line x1="40" y1="120" x2="25" y2="145" stroke="#666" strokeWidth="3" />
        <circle cx="25" cy="145" r="4" fill="#555" stroke="#666" />
        
        {/* Back right leg */}
        <line x1="80" y1="120" x2="95" y2="145" stroke="#666" strokeWidth="3" />
        <circle cx="95" cy="145" r="4" fill="#555" stroke="#666" />

        {/* Descent engine bell */}
        <ellipse cx="60" cy="120" rx="15" ry="5" fill="#333" stroke="#444" />
        <path
          d="M 45 120 Q 45 135 40 145 L 80 145 Q 75 135 75 120"
          fill="#2a2a2a"
          stroke="#444"
          strokeWidth="1"
        />

        {/* Antennas */}
        <line x1="35" y1="35" x2="25" y2="15" stroke="#888" strokeWidth="1" />
        <circle cx="25" cy="15" r="3" fill="#aaa" />
        <line x1="85" y1="35" x2="95" y2="20" stroke="#888" strokeWidth="1" />
        <line x1="92" y1="18" x2="98" y2="22" stroke="#888" strokeWidth="1" />

        {/* American flag decal */}
        <rect x="65" y="55" width="12" height="8" fill="#fff" />
        <rect x="65" y="55" width="5" height="4" fill="#002868" />
        <line x1="65" y1="56" x2="77" y2="56" stroke="#bf0a30" strokeWidth="1" />
        <line x1="65" y1="58" x2="77" y2="58" stroke="#bf0a30" strokeWidth="1" />
        <line x1="65" y1="60" x2="77" y2="60" stroke="#bf0a30" strokeWidth="1" />
        <line x1="65" y1="62" x2="77" y2="62" stroke="#bf0a30" strokeWidth="1" />

        {/* Gold foil gradient definition */}
        <defs>
          <linearGradient id="goldFoil" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#d4af37', stopOpacity: 1 }} />
            <stop offset="25%" style={{ stopColor: '#f4e04d', stopOpacity: 1 }} />
            <stop offset="50%" style={{ stopColor: '#c5a028', stopOpacity: 1 }} />
            <stop offset="75%" style={{ stopColor: '#e8d44d', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#b8960f', stopOpacity: 1 }} />
          </linearGradient>
        </defs>
      </svg>

      {/* Thrust flame effect */}
      {isThrusting && (
        <div className="absolute left-1/2 -translate-x-1/2" style={{ top: '140px' }}>
          <motion.div
            className="relative"
            animate={{
              scaleY: [1, 1.2, 0.9, 1.1, 1],
              scaleX: [1, 0.95, 1.05, 0.98, 1],
            }}
            transition={{
              duration: 0.1,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            {/* Outer flame (orange/red) */}
            <div
              className="absolute left-1/2 -translate-x-1/2"
              style={{
                width: `${20 + thrustIntensity * 20}px`,
                height: `${40 + thrustIntensity * 80}px`,
                background: `radial-gradient(ellipse at top, 
                  rgba(255, 200, 50, ${0.3 + thrustIntensity * 0.5}) 0%,
                  rgba(255, 100, 0, ${0.5 + thrustIntensity * 0.4}) 30%,
                  rgba(255, 50, 0, ${0.3 + thrustIntensity * 0.3}) 60%,
                  transparent 100%)`,
                filter: 'blur(3px)',
                borderRadius: '50% 50% 50% 50% / 20% 20% 80% 80%',
              }}
            />
            
            {/* Inner flame (white/yellow) */}
            <div
              className="absolute left-1/2 -translate-x-1/2"
              style={{
                width: `${12 + thrustIntensity * 8}px`,
                height: `${25 + thrustIntensity * 40}px`,
                background: `radial-gradient(ellipse at top,
                  rgba(255, 255, 255, ${0.8 + thrustIntensity * 0.2}) 0%,
                  rgba(255, 255, 100, ${0.6 + thrustIntensity * 0.3}) 30%,
                  rgba(255, 200, 50, ${0.4 + thrustIntensity * 0.3}) 60%,
                  transparent 100%)`,
                filter: 'blur(2px)',
                borderRadius: '50% 50% 50% 50% / 20% 20% 80% 80%',
              }}
            />

            {/* Particle effects */}
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full bg-orange-400"
                style={{
                  width: 4,
                  height: 4,
                  left: `${50 + (Math.random() - 0.5) * 30}%`,
                }}
                animate={{
                  y: [0, 60 + thrustIntensity * 40],
                  opacity: [1, 0],
                  scale: [1, 0.2],
                }}
                transition={{
                  duration: 0.3 + Math.random() * 0.2,
                  repeat: Infinity,
                  delay: Math.random() * 0.2,
                  ease: "easeOut"
                }}
              />
            ))}
          </motion.div>
        </div>
      )}

      {/* Crash effect */}
      {landerState === 'crashed' && (
        <motion.div
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {/* Explosion particles */}
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute left-1/2 top-1/2 w-3 h-3 rounded-full"
              style={{
                background: i % 2 === 0 ? '#ff6600' : '#ffcc00',
              }}
              initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
              animate={{
                x: (Math.cos(i * 30 * Math.PI / 180) * 80),
                y: (Math.sin(i * 30 * Math.PI / 180) * 80),
                opacity: 0,
                scale: 0,
              }}
              transition={{
                duration: 1,
                ease: "easeOut"
              }}
            />
          ))}
          
          {/* Smoke */}
          <motion.div
            className="absolute left-1/2 top-full -translate-x-1/2"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 0.5, scale: 2, y: -20 }}
            transition={{ duration: 2 }}
          >
            <div className="w-32 h-32 rounded-full bg-gray-600 blur-xl" />
          </motion.div>
        </motion.div>
      )}

      {/* Landed indicator */}
      {landerState === 'landed' && (
        <motion.div
          className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-console-green font-display text-sm whitespace-nowrap"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          ✓ TOUCHDOWN
        </motion.div>
      )}
    </div>
  );
}

export default LunarLander;

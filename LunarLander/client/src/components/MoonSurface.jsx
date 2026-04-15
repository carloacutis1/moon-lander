import React from 'react';

function MoonSurface() {
  return (
    <div className="relative h-40">
      {/* Surface gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-700 via-gray-600 to-gray-500" />
      
      {/* Surface texture with craters */}
      <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
        <defs>
          {/* Crater gradient */}
          <radialGradient id="craterGradient" cx="30%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#3a3a3a" />
            <stop offset="100%" stopColor="#5a5a5a" />
          </radialGradient>
          
          {/* Surface texture pattern */}
          <pattern id="surfaceTexture" patternUnits="userSpaceOnUse" width="100" height="100">
            <rect width="100" height="100" fill="#4a4a4a" />
            <circle cx="20" cy="30" r="3" fill="#3a3a3a" />
            <circle cx="50" cy="70" r="2" fill="#5a5a5a" />
            <circle cx="80" cy="40" r="4" fill="#3a3a3a" />
            <circle cx="30" cy="80" r="2" fill="#555" />
            <circle cx="70" cy="20" r="3" fill="#444" />
          </pattern>
        </defs>

        {/* Main surface */}
        <rect x="0" y="20" width="100%" height="120" fill="url(#surfaceTexture)" />

        {/* Horizon line */}
        <line x1="0" y1="15" x2="100%" y2="15" stroke="#6a6a6a" strokeWidth="3" />
        
        {/* Craters */}
        <ellipse cx="15%" cy="60" rx="30" ry="15" fill="url(#craterGradient)" />
        <ellipse cx="15%" cy="58" rx="28" ry="12" fill="none" stroke="#666" strokeWidth="1" />
        
        <ellipse cx="45%" cy="80" rx="50" ry="25" fill="url(#craterGradient)" />
        <ellipse cx="45%" cy="76" rx="45" ry="20" fill="none" stroke="#666" strokeWidth="1" />
        
        <ellipse cx="75%" cy="50" rx="40" ry="18" fill="url(#craterGradient)" />
        <ellipse cx="75%" cy="48" rx="36" ry="14" fill="none" stroke="#666" strokeWidth="1" />
        
        <ellipse cx="90%" cy="90" rx="25" ry="12" fill="url(#craterGradient)" />
        
        {/* Small surface rocks */}
        <polygon points="100,100 110,85 120,100" fill="#555" />
        <polygon points="300,110 315,90 330,110" fill="#4a4a4a" />
        <polygon points="500,105 510,92 525,108 515,110" fill="#555" />
        <polygon points="700,100 718,82 735,100" fill="#4a4a4a" />
        
        {/* Surface dust/regolith details */}
        <circle cx="50" cy="100" r="2" fill="#5a5a5a" />
        <circle cx="150" cy="95" r="1.5" fill="#555" />
        <circle cx="250" cy="105" r="2" fill="#5a5a5a" />
        <circle cx="350" cy="98" r="1" fill="#555" />
        <circle cx="450" cy="102" r="2.5" fill="#5a5a5a" />
        <circle cx="550" cy="96" r="1.5" fill="#555" />
        <circle cx="650" cy="104" r="2" fill="#5a5a5a" />
        <circle cx="750" cy="99" r="1" fill="#555" />
      </svg>

      {/* Landing zone marker */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center">
        <div className="text-xs text-gray-400 font-mono mb-1">LANDING ZONE</div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 border-l-2 border-t-2 border-console-green" />
          <div className="w-16 h-0.5 bg-console-green" />
          <div className="w-4 h-4 border-r-2 border-t-2 border-console-green" />
        </div>
      </div>

      {/* Depth shading at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-gray-800 to-transparent" />
    </div>
  );
}

export default MoonSurface;

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import LunarLander from './LunarLander';
import MoonSurface from './MoonSurface';

function SimulationView({ state, thrustPercent }) {
  // Guard against undefined state
  if (!state) {
    return (
      <div className="flex-1 min-w-0 relative overflow-hidden bg-gradient-to-b from-black via-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-gray-500">Loading simulation...</div>
      </div>
    );
  }

  // Calculate visual position based on altitude
  // Map altitude to screen position (0 = bottom, maxAlt = top)
  const maxAlt = 100000; // Reference max altitude for full view
  
  const landerPosition = useMemo(() => {
    // Normalize altitude to 0-1 range, with some padding
    const normalizedAlt = Math.min(state.altitude / maxAlt, 1);
    // Position from bottom (20% from bottom at surface, 80% at max alt)
    const yPercent = 80 - (normalizedAlt * 60);
    return yPercent;
  }, [state.altitude]);

  // Calculate scale based on altitude (closer = larger)
  const landerScale = useMemo(() => {
    if (state.altitude > 50000) return 0.3;
    if (state.altitude > 10000) return 0.5;
    if (state.altitude > 1000) return 0.8;
    return 1 + (1 - state.altitude / 1000) * 0.5;
  }, [state.altitude]);

  // Determine alert level
  const getAlertLevel = () => {
    if (state.velocity > 50 && state.altitude < 5000) return 'critical';
    if (state.velocity > 20 && state.altitude < 2000) return 'critical';
    if (state.velocity > 10 && state.altitude < 500) return 'critical';
    if (state.velocity > 5 && state.altitude < 100) return 'critical';
    if (state.altitude < 1000) return 'warning';
    return 'normal';
  };

  const alertLevel = getAlertLevel();

  return (
    <div className="flex-1 min-w-0 relative overflow-hidden bg-gradient-to-b from-black via-gray-900 to-gray-800">
      {/* Stars overlay */}
      <div className="absolute inset-0 stars opacity-50" />

      {/* Earth in background (small, in corner) */}
      <div className="absolute top-8 right-8">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 via-blue-600 to-blue-900 shadow-lg shadow-blue-500/20">
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent to-white/20" />
          <div className="absolute top-2 left-2 w-4 h-3 bg-green-500/40 rounded blur-sm" />
          <div className="absolute top-4 right-3 w-3 h-2 bg-green-500/30 rounded blur-sm" />
        </div>
        <div className="text-center text-xs text-gray-500 mt-1">EARTH</div>
      </div>

      {/* Altitude markers */}
      <div className="absolute left-4 top-0 bottom-0 flex flex-col justify-between py-8 text-xs text-gray-500 font-mono">
        <div>100 km</div>
        <div>75 km</div>
        <div>50 km</div>
        <div>25 km</div>
        <div>10 km</div>
        <div>1 km</div>
        <div className="text-console-green">SURFACE</div>
      </div>

      {/* Altitude bar */}
      <div className="absolute left-12 top-8 bottom-8 w-1 bg-gray-700 rounded">
        <motion.div
          className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-console-green to-nasa-blue rounded"
          style={{ height: `${Math.min((state.altitude / maxAlt) * 100, 100)}%` }}
        />
        <motion.div
          className="absolute left-0 right-0 h-2 bg-white rounded"
          style={{ bottom: `${Math.min((state.altitude / maxAlt) * 100, 100)}%` }}
        />
      </div>

      {/* Main viewport */}
      <div className="absolute inset-0 flex items-center justify-center">
        {/* Lander */}
        <motion.div
          className="absolute z-10"
          style={{ 
            top: `${landerPosition}%`,
            transform: `scale(${landerScale})`
          }}
          animate={{
            y: state.hasLanded ? 0 : [0, -2, 0, 2, 0],
          }}
          transition={{
            y: {
              duration: 2,
              repeat: state.hasLanded ? 0 : Infinity,
              ease: "easeInOut"
            }
          }}
        >
          <LunarLander 
            thrustPercent={thrustPercent} 
            hasLanded={state.hasLanded}
            landingResult={state.landingResult}
          />
        </motion.div>
      </div>

      {/* Moon surface */}
      <div className="absolute bottom-0 left-0 right-0">
        <MoonSurface />
      </div>

      {/* Velocity vector indicator */}
      <div className="absolute bottom-32 right-8 p-3 bg-gray-900/80 border border-gray-700 rounded">
        <div className="text-xs text-gray-400 mb-1">VELOCITY VECTOR</div>
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-2 border-gray-600 rounded-full" />
          <div className="absolute inset-2 border border-gray-700 rounded-full" />
          <motion.div
            className="absolute left-1/2 top-1/2 w-1 bg-nasa-red origin-top"
            style={{
              height: Math.min(Math.abs(state.velocity) / 2, 30),
              transform: `translateX(-50%) rotate(${state.velocity > 0 ? 180 : 0}deg)`
            }}
          />
          <div className="absolute left-1/2 top-1/2 w-2 h-2 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
        </div>
        <div className={`text-center text-sm font-mono mt-1 ${
          state.velocity > 5 ? 'text-nasa-red' : 'text-console-green'
        }`}>
          {state.velocity.toFixed(1)} m/s
        </div>
      </div>

      {/* Alert overlay */}
      {alertLevel !== 'normal' && (
        <div className={`absolute inset-0 pointer-events-none ${
          alertLevel === 'critical' 
            ? 'bg-red-900/10 animate-pulse' 
            : 'bg-amber-900/5'
        }`}>
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
            px-6 py-3 rounded font-display text-2xl ${
            alertLevel === 'critical'
              ? 'bg-red-900/80 text-red-200 border-2 border-red-500'
              : 'bg-amber-900/60 text-amber-200 border border-amber-500'
          }`}>
            {alertLevel === 'critical' ? '⚠️ REDUCE VELOCITY' : 'APPROACH PHASE'}
          </div>
        </div>
      )}

      {/* Current altitude display overlay */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 text-center">
        <div className="text-xs text-gray-400 font-mono">ALTITUDE</div>
        <div className="text-4xl font-display text-white">
          {state.altitude > 1000 
            ? `${(state.altitude / 1000).toFixed(2)} km`
            : `${state.altitude.toFixed(1)} m`
          }
        </div>
      </div>
    </div>
  );
}

export default SimulationView;

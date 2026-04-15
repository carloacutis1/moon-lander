import React from 'react';
import { motion } from 'framer-motion';
import { 
  Rocket, 
  Cpu, 
  Gauge,
  ChevronUp,
  ChevronDown,
  Zap
} from 'lucide-react';

function ControlPanel({ 
  thrustPercent, 
  setThrustPercent, 
  mode, 
  onToggleMode,
  simulationSpeed,
  setSimulationSpeed,
  state 
}) {
  // Guard against undefined state
  if (!state) {
    return (
      <div className="w-72 bg-gray-900/90 border-l border-gray-700 flex flex-col items-center justify-center">
        <div className="text-gray-500">Loading controls...</div>
      </div>
    );
  }

  return (
    <div className="w-72 min-w-[16rem] flex-shrink-0 bg-gray-900/90 border-l border-gray-700 flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-gray-700 bg-nasa-red/20">
        <h2 className="font-display text-lg text-white flex items-center gap-2">
          <Rocket size={20} />
          CONTROLS
        </h2>
      </div>

      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {/* Mode Toggle */}
        <div className="gauge p-3">
          <div className="text-xs text-gray-400 mb-2 flex items-center gap-1">
            <Cpu size={12} />
            CONTROL MODE
          </div>
          <div className="flex gap-2">
            <button
              onClick={onToggleMode}
              className={`flex-1 p-3 rounded border-2 transition-all ${
                mode === 'manual'
                  ? 'bg-nasa-blue/30 border-nasa-blue text-white'
                  : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:border-gray-500'
              }`}
            >
              <div className="font-display text-sm">MANUAL</div>
            </button>
            <button
              onClick={onToggleMode}
              className={`flex-1 p-3 rounded border-2 transition-all ${
                mode === 'auto'
                  ? 'bg-console-green/30 border-console-green text-white'
                  : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:border-gray-500'
              }`}
            >
              <div className="font-display text-sm">AUTO</div>
            </button>
          </div>
          <div className="text-xs text-gray-500 mt-2 text-center">
            Press A to toggle
          </div>
        </div>

        {/* Thrust Control */}
        <div className={`gauge p-3 ${mode === 'auto' ? 'opacity-50' : ''}`}>
          <div className="text-xs text-gray-400 mb-3 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Zap size={12} />
              THRUST CONTROL
            </span>
            <span className={`${thrustPercent > 0 ? 'text-nasa-red' : 'text-gray-500'}`}>
              {mode === 'auto' ? state.thrustPercent?.toFixed(0) : thrustPercent}%
            </span>
          </div>

          {/* Thrust Slider */}
          <div className="relative mb-4">
            <input
              type="range"
              min="0"
              max="100"
              value={mode === 'auto' ? state.thrustPercent || 0 : thrustPercent}
              onChange={(e) => setThrustPercent(Number(e.target.value))}
              disabled={mode === 'auto'}
              className="thrust-slider w-full"
            />
          </div>

          {/* Quick thrust buttons */}
          <div className="grid grid-cols-4 gap-2">
            {[0, 25, 50, 100].map((val) => (
              <button
                key={val}
                onClick={() => setThrustPercent(val)}
                disabled={mode === 'auto'}
                className={`p-2 rounded border text-sm font-mono transition-all ${
                  thrustPercent === val && mode === 'manual'
                    ? 'bg-nasa-red/30 border-nasa-red text-white'
                    : 'bg-gray-800 border-gray-600 text-gray-400 hover:border-gray-400'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {val}%
              </button>
            ))}
          </div>

          {/* Arrow key indicators */}
          <div className="flex justify-center gap-4 mt-4">
            <div className="text-center">
              <div className="w-10 h-10 rounded border border-gray-600 flex items-center justify-center bg-gray-800">
                <ChevronUp size={20} className="text-gray-400" />
              </div>
              <div className="text-xs text-gray-500 mt-1">+10%</div>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 rounded border border-gray-600 flex items-center justify-center bg-gray-800">
                <ChevronDown size={20} className="text-gray-400" />
              </div>
              <div className="text-xs text-gray-500 mt-1">-10%</div>
            </div>
          </div>
        </div>

        {/* Full Thrust Button */}
        <div className="gauge p-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            onMouseDown={() => mode === 'manual' && setThrustPercent(100)}
            onMouseUp={() => mode === 'manual' && setThrustPercent(0)}
            onMouseLeave={() => mode === 'manual' && setThrustPercent(0)}
            disabled={mode === 'auto' || state.fuel <= 0}
            className={`w-full p-4 rounded-lg border-2 font-display text-lg transition-all ${
              thrustPercent === 100 && mode === 'manual'
                ? 'bg-nasa-red border-red-400 text-white shadow-lg shadow-red-500/30'
                : 'bg-gray-800 border-gray-600 text-gray-300 hover:border-gray-400'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <Rocket className="inline-block mr-2" size={24} />
            FULL THRUST
          </motion.button>
          <div className="text-xs text-gray-500 mt-2 text-center">
            Hold SPACE for full thrust
          </div>
        </div>

        {/* Simulation Speed */}
        <div className="gauge p-3">
          <div className="text-xs text-gray-400 mb-2 flex items-center gap-1">
            <Gauge size={12} />
            SIMULATION SPEED
          </div>
          <div className="flex gap-2">
            {[1, 2, 5, 10].map((speed) => (
              <button
                key={speed}
                onClick={() => setSimulationSpeed(speed)}
                className={`flex-1 p-2 rounded border text-sm font-mono transition-all ${
                  simulationSpeed === speed
                    ? 'bg-nasa-blue/30 border-nasa-blue text-white'
                    : 'bg-gray-800 border-gray-600 text-gray-400 hover:border-gray-400'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>

        {/* Quick Reference */}
        <div className="gauge p-3">
          <div className="text-xs text-gray-400 mb-2">KEYBOARD SHORTCUTS</div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500">SPACE</span>
              <span className="text-gray-400">Full Thrust</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">↑ / ↓</span>
              <span className="text-gray-400">Adjust Thrust</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">A</span>
              <span className="text-gray-400">Toggle Autopilot</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">P</span>
              <span className="text-gray-400">Pause/Resume</span>
            </div>
          </div>
        </div>

        {/* Landing Requirements */}
        <div className="gauge p-3 border-console-green/50">
          <div className="text-xs text-console-green mb-2">SAFE LANDING</div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-400">Touchdown Velocity</span>
              <span className="text-console-green">≤ 5 m/s</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Perfect Landing</span>
              <span className="text-console-green">≤ 2 m/s</span>
            </div>
          </div>
        </div>
      </div>

      {/* Status footer */}
      <div className="p-3 border-t border-gray-700 bg-gray-900">
        <div className={`text-center text-sm font-mono ${
          state.fuel > 0 ? 'text-console-green' : 'text-nasa-red'
        }`}>
          {state.fuel > 0 
            ? `PROPULSION: READY` 
            : `PROPULSION: NO FUEL`
          }
        </div>
      </div>
    </div>
  );
}

export default ControlPanel;

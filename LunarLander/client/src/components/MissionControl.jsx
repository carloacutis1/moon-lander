import React from 'react';
import { Radio, Clock, Cpu, Pause, Play } from 'lucide-react';

function MissionControl({ state, mode, isPaused, onTogglePause }) {
  // Guard against undefined state
  if (!state) {
    return (
      <div className="bg-gray-900/90 border-b border-gray-700 px-4 py-1.5 flex-shrink-0">
        <div className="text-gray-500">Loading mission control...</div>
      </div>
    );
  }

  const formatTime = (seconds) => {
    if (seconds === undefined || seconds === null || isNaN(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getMissionStatus = () => {
    if (state.hasLanded) {
      return state.landingResult?.success ? 'LANDED' : 'CRASHED';
    }
    if (state.altitude < 1000) return 'FINAL APPROACH';
    if (state.altitude < 10000) return 'DESCENT PHASE';
    return 'APPROACH PHASE';
  };

  const getStatusColor = () => {
    if (state.hasLanded) {
      return state.landingResult?.success ? 'text-console-green' : 'text-nasa-red';
    }
    if (state.altitude < 1000) return 'text-warning-amber';
    return 'text-console-green';
  };

  return (
    <div className="bg-gray-900/90 border-b border-gray-700 px-4 py-1.5 flex-shrink-0">
      <div className="flex items-center justify-between">
        {/* Left - Mission ID */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Radio className="text-nasa-red animate-pulse" size={16} />
            <span className="text-xs text-gray-400">MISSION CONTROL</span>
          </div>
          <div className={`font-display text-lg ${getStatusColor()}`}>
            {getMissionStatus()}
          </div>
        </div>

        {/* Center - Time & Mode */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-gray-400" />
            <span className="font-mono text-lg text-white">
              T+ {formatTime(state.time)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Cpu size={16} className={mode === 'auto' ? 'text-console-green' : 'text-gray-400'} />
            <span className={`font-mono text-sm px-2 py-1 rounded ${
              mode === 'auto' 
                ? 'bg-console-green/20 text-console-green border border-console-green' 
                : 'bg-gray-800 text-gray-400 border border-gray-600'
            }`}>
              {mode === 'auto' ? 'AUTOPILOT' : 'MANUAL'}
            </span>
          </div>
        </div>

        {/* Right - Controls */}
        <div className="flex items-center gap-4">
          <button
            onClick={onTogglePause}
            className="flex items-center gap-2 px-3 py-1 rounded border border-gray-600 hover:border-gray-400 transition-colors"
          >
            {isPaused ? (
              <>
                <Play size={16} className="text-console-green" />
                <span className="text-sm text-gray-300">Resume</span>
              </>
            ) : (
              <>
                <Pause size={16} className="text-warning-amber" />
                <span className="text-sm text-gray-300">Pause</span>
              </>
            )}
          </button>

          <div className="text-xs text-gray-500">
            NASA LUNAR SIMULATION
          </div>
        </div>
      </div>
    </div>
  );
}

export default MissionControl;

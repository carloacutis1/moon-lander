import React from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle, 
  XCircle, 
  RotateCcw, 
  Trophy,
  AlertTriangle,
  Skull
} from 'lucide-react';

function LandingResult({ state, onRestart }) {
  // Guard against undefined state
  if (!state) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="text-gray-500">Loading results...</div>
      </div>
    );
  }

  const result = state.landingResult || { success: false, rating: 'crash-fatal', message: 'Mission failed' };
  const isSuccess = result?.success;
  const touchdownVelocity = state.touchdownVelocity ?? Math.abs(state.velocity);

  const getIcon = () => {
    switch (result?.rating) {
      case 'perfect':
        return <Trophy className="text-yellow-400" size={80} />;
      case 'good':
        return <CheckCircle className="text-console-green" size={80} />;
      case 'hard':
        return <AlertTriangle className="text-warning-amber" size={80} />;
      case 'crash-survivable':
        return <XCircle className="text-orange-500" size={80} />;
      case 'crash-fatal':
        return <Skull className="text-nasa-red" size={80} />;
      default:
        return <XCircle className="text-gray-500" size={80} />;
    }
  };

  const getGradient = () => {
    if (result?.rating === 'perfect') {
      return 'from-yellow-900/30 via-yellow-800/20 to-transparent';
    }
    if (isSuccess) {
      return 'from-green-900/30 via-green-800/20 to-transparent';
    }
    return 'from-red-900/30 via-red-800/20 to-transparent';
  };

  const getBorderColor = () => {
    switch (result?.rating) {
      case 'perfect':
        return 'border-yellow-500';
      case 'good':
        return 'border-console-green';
      case 'hard':
        return 'border-warning-amber';
      default:
        return 'border-nasa-red';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`h-full w-full flex items-center justify-center bg-gradient-to-b ${getGradient()}`}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        className={`max-w-lg w-full mx-4 bg-gray-900/90 border-2 ${getBorderColor()} rounded-lg p-8`}
      >
        {/* Icon */}
        <div className="text-center mb-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.4, type: 'spring', stiffness: 300 }}
          >
            {getIcon()}
          </motion.div>
        </div>

        {/* Title */}
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className={`text-4xl font-display text-center mb-4 ${
            isSuccess ? 'text-console-green' : 'text-nasa-red'
          }`}
        >
          {isSuccess ? 'MISSION SUCCESS' : 'MISSION FAILED'}
        </motion.h1>

        {/* Message */}
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-xl text-center text-gray-300 mb-8"
        >
          {result?.message}
        </motion.p>

        {/* Stats */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="grid grid-cols-2 gap-4 mb-8"
        >
          <div className="bg-gray-800/50 rounded p-4 text-center">
            <div className="text-xs text-gray-400 mb-1">TOUCHDOWN VELOCITY</div>
            <div className={`text-2xl font-display ${
              touchdownVelocity <= 5 ? 'text-console-green' : 'text-nasa-red'
            }`}>
              {touchdownVelocity.toFixed(2)} m/s
            </div>
          </div>

          <div className="bg-gray-800/50 rounded p-4 text-center">
            <div className="text-xs text-gray-400 mb-1">MISSION TIME</div>
            <div className="text-2xl font-display text-white">
              {Math.floor(state.time / 60)}:{(state.time % 60).toFixed(0).padStart(2, '0')}
            </div>
          </div>

          <div className="bg-gray-800/50 rounded p-4 text-center">
            <div className="text-xs text-gray-400 mb-1">FUEL REMAINING</div>
            <div className="text-2xl font-display text-white">
              {state.fuel.toFixed(0)} kg
            </div>
          </div>

          <div className="bg-gray-800/50 rounded p-4 text-center">
            <div className="text-xs text-gray-400 mb-1">RATING</div>
            <div className={`text-2xl font-display uppercase ${
              result?.rating === 'perfect' ? 'text-yellow-400' :
              isSuccess ? 'text-console-green' : 'text-nasa-red'
            }`}>
              {result?.rating?.replace('-', ' ')}
            </div>
          </div>
        </motion.div>

        {/* Score breakdown for successful landings */}
        {isSuccess && (() => {
          const fuelPct = state.fuelPercentage ?? (state.fuelCapacity ? (state.fuel / state.fuelCapacity) * 100 : 0);
          return (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mb-8 p-4 bg-gray-800/30 rounded border border-gray-700"
          >
            <div className="text-sm text-gray-400 mb-2">Performance Analysis</div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Descent Control</span>
                <span className={`${touchdownVelocity <= 2 ? 'text-console-green' : 'text-warning-amber'}`}>
                  {touchdownVelocity <= 2 ? 'Excellent' : touchdownVelocity <= 5 ? 'Good' : 'Acceptable'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Fuel Efficiency</span>
                <span className={`${fuelPct > 10 ? 'text-console-green' : 'text-warning-amber'}`}>
                  {fuelPct.toFixed(1)}% remaining
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Time Efficiency</span>
                <span className="text-gray-300">{state.time.toFixed(0)}s descent</span>
              </div>
            </div>
          </motion.div>
          );
        })()}

        {/* Restart Button */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="text-center"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onRestart}
            className="px-8 py-4 bg-gradient-to-b from-nasa-blue to-blue-800 rounded-lg font-display text-xl text-white border-2 border-blue-400 hover:shadow-lg hover:shadow-blue-500/30 transition-all"
          >
            <RotateCcw className="inline-block mr-2" size={24} />
            NEW MISSION
          </motion.button>
        </motion.div>

        {/* Footer text */}
        <div className="mt-6 text-center text-xs text-gray-600">
          {isSuccess 
            ? '"Houston, Tranquility Base here. The Eagle has landed."'
            : '"Houston, we have a problem."'
          }
        </div>
      </motion.div>
    </motion.div>
  );
}

export default LandingResult;

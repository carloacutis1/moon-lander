import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Rocket, Gauge, Zap, Database, Info } from 'lucide-react';
import { getLanders, getEquations } from '../api/simulation';

function StartScreen({ onStart, error }) {
  const [landers, setLanders] = useState([]);
  const [selectedLander, setSelectedLander] = useState(1);
  const [startAltitude, setStartAltitude] = useState(100000);
  const [startVelocity, setStartVelocity] = useState(50);
  const [mode, setMode] = useState('manual');
  const [showEquations, setShowEquations] = useState(false);
  const [equations, setEquations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [landersRes, equationsRes] = await Promise.all([
          getLanders(),
          getEquations()
        ]);
        setLanders(landersRes.data);
        setEquations(equationsRes.data);
        setLoading(false);
      } catch (err) {
        console.error('Failed to load data:', err);
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleStart = () => {
    onStart({
      landerId: selectedLander,
      startAltitude,
      startVelocity,
      mode
    });
  };

  const selectedLanderData = landers.find(l => l.id === selectedLander);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="min-h-screen w-full py-5 px-4 overflow-y-auto flex flex-col items-center"
    >
      <div className="max-w-3xl w-full mx-auto">
        {/* NASA-style Header */}
        <div className="text-center mb-5">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-3"
          >
            <div className="inline-block p-3 rounded-full bg-nasa-blue/20 border-2 border-nasa-blue mb-3">
              <Rocket size={48} className="text-white" />
            </div>
          </motion.div>
          <h1 className="text-4xl font-display font-bold text-white mb-1">
            LUNAR LANDER
          </h1>
          <p className="text-lg text-gray-400 font-mono">
            DESCENT & LANDING SIMULATION
          </p>
          <div className="mt-2 text-nasa-red font-mono text-sm">
            NASA MISSION CONTROL • SIMULATION SYSTEM v1.0
          </div>
        </div>

        {/* Main Panel */}
        <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-lg p-5">
          {error && (
            <div className="mb-4 p-4 bg-red-900/50 border border-red-500 rounded text-red-200">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column - Lander Selection */}
            <div>
              <h2 className="text-lg font-display text-nasa-blue flex items-center gap-2 mb-4">
                <Rocket size={20} />
                SELECT LANDER MODULE
              </h2>
              
              {loading ? (
                <div className="text-gray-400">Loading configurations...</div>
              ) : (
                <div className="space-y-2">
                  {landers.map(lander => (
                    <button
                      key={lander.id}
                      onClick={() => setSelectedLander(lander.id)}
                      className={`w-full p-3 text-left rounded border transition-all ${
                        selectedLander === lander.id
                          ? 'bg-nasa-blue/30 border-nasa-blue'
                          : 'bg-gray-800/50 border-gray-700 hover:border-gray-500'
                      }`}
                    >
                      <div className="font-mono text-white">{lander.name}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        Mass: {lander.empty_mass}kg • Fuel: {lander.fuel_capacity}kg • Max Thrust: {lander.max_thrust}N
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {selectedLanderData && (
                <div className="mt-4 p-3 bg-gray-800/50 rounded border border-gray-700">
                  <div className="text-xs text-gray-400 mb-2">SPECIFICATIONS</div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">Empty Mass:</span>
                      <span className="text-white ml-2">{selectedLanderData.empty_mass} kg</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Fuel Capacity:</span>
                      <span className="text-white ml-2">{selectedLanderData.fuel_capacity} kg</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Max Thrust:</span>
                      <span className="text-white ml-2">{selectedLanderData.max_thrust} N</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Fuel Rate:</span>
                      <span className="text-white ml-2">{selectedLanderData.fuel_consumption_rate} kg/s</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Parameters */}
            <div>
              <h2 className="text-lg font-display text-nasa-blue flex items-center gap-2 mb-4">
                <Gauge size={20} />
                MISSION PARAMETERS
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    Starting Altitude (meters)
                  </label>
                  <input
                    type="number"
                    value={startAltitude}
                    onChange={(e) => setStartAltitude(Number(e.target.value))}
                    className="w-full p-2 bg-gray-800 border border-gray-600 rounded text-white font-mono focus:border-nasa-blue focus:outline-none"
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    {(startAltitude / 1000).toFixed(1)} km above surface
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    Initial Velocity (m/s toward surface)
                  </label>
                  <input
                    type="number"
                    value={startVelocity}
                    onChange={(e) => setStartVelocity(Number(e.target.value))}
                    className="w-full p-2 bg-gray-800 border border-gray-600 rounded text-white font-mono focus:border-nasa-blue focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    Control Mode
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setMode('manual')}
                      className={`flex-1 p-3 rounded border transition-all ${
                        mode === 'manual'
                          ? 'bg-nasa-blue/30 border-nasa-blue'
                          : 'bg-gray-800/50 border-gray-700 hover:border-gray-500'
                      }`}
                    >
                      <div className="font-mono text-white">MANUAL</div>
                      <div className="text-xs text-gray-400">You control thrust</div>
                    </button>
                    <button
                      onClick={() => setMode('auto')}
                      className={`flex-1 p-3 rounded border transition-all ${
                        mode === 'auto'
                          ? 'bg-console-green/30 border-console-green'
                          : 'bg-gray-800/50 border-gray-700 hover:border-gray-500'
                      }`}
                    >
                      <div className="font-mono text-white">AUTOPILOT</div>
                      <div className="text-xs text-gray-400">Computer-guided</div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Equations Toggle */}
          <div className="mt-6 border-t border-gray-700 pt-4">
            <button
              onClick={() => setShowEquations(!showEquations)}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <Database size={16} />
              <span className="text-sm">
                {showEquations ? 'Hide' : 'Show'} Physics Equations from Reference Data
              </span>
            </button>

            {showEquations && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="mt-4 p-4 bg-gray-800/50 rounded border border-gray-700 overflow-hidden"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {equations.map(eq => (
                    <div key={eq.id} className="p-2 bg-gray-900/50 rounded">
                      <div className="text-xs text-nasa-blue font-display">{eq.name}</div>
                      <div className="text-sm text-console-green font-mono mt-1">{eq.formula}</div>
                      <div className="text-xs text-gray-500 mt-1">{eq.description}</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Start Button */}
          <div className="mt-6 text-center">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleStart}
              disabled={loading}
              className="px-12 py-4 bg-gradient-to-b from-nasa-red to-red-700 rounded-lg font-display text-2xl text-white border-2 border-red-400 shadow-lg hover:shadow-red-500/30 transition-all disabled:opacity-50"
            >
              <Zap className="inline-block mr-2" size={24} />
              INITIATE DESCENT
            </motion.button>
            <div className="mt-4 text-sm text-gray-500">
              Press SPACE for full thrust • Arrow keys to adjust • A to toggle autopilot • P to pause
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-gray-600 text-sm">
          <Info className="inline-block mr-1" size={14} />
          Safe landing velocity: 0-5 m/s • Moon surface gravity: 1.62 m/s²
        </div>
      </div>
    </motion.div>
  );
}

export default StartScreen;

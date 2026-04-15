import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MissionControl from './components/MissionControl';
import SimulationView from './components/SimulationView';
import TelemetryPanel from './components/TelemetryPanel';
import ControlPanel from './components/ControlPanel';
import StartScreen from './components/StartScreen';
import LandingResult from './components/LandingResult';
import { startSimulation, stepSimulation, setSimulationMode } from './api/simulation';

function App() {
  const [gameState, setGameState] = useState('start'); // start, running, paused, ended
  const [session, setSession] = useState(null);
  const [simulationState, setSimulationState] = useState(null);
  const [thrustPercent, setThrustPercent] = useState(0);
  const [mode, setMode] = useState('manual');
  const [error, setError] = useState(null);
  const [simulationSpeed, setSimulationSpeed] = useState(1);
  const intervalRef = useRef(null);
  const keyDownRef = useRef(false);
  const stepInFlightRef = useRef(false);
  const sessionRef = useRef(null);
  const simulationStateRef = useRef(null);
  const modeRef = useRef('manual');
  const thrustPercentRef = useRef(0);

  useEffect(() => {
    sessionRef.current = session;
    simulationStateRef.current = simulationState;
    modeRef.current = mode;
    thrustPercentRef.current = thrustPercent;
  }, [session, simulationState, mode, thrustPercent]);

  // Start new simulation
  const handleStart = async (config) => {
    try {
      setError(null);
      const response = await startSimulation(config);
      setSession(response.data);
      setSimulationState(response.data.state);
      setMode(config.mode || 'manual');
      setThrustPercent(0);
      setGameState('running');
    } catch (err) {
      console.error('Failed to start simulation:', err);
      setError('Failed to start simulation. Is the server running?');
    }
  };

  // Toggle mode
  const toggleMode = useCallback(async () => {
    const activeSession = sessionRef.current;
    if (!activeSession) return;

    const nextMode = modeRef.current === 'manual' ? 'auto' : 'manual';

    try {
      await setSimulationMode(activeSession.sessionId, nextMode);
      modeRef.current = nextMode;
      setMode(nextMode);
    } catch (err) {
      console.error('Failed to change mode:', err);
    }
  }, []);

  // Step simulation
  const step = useCallback(async () => {
    const activeSession = sessionRef.current;
    const activeState = simulationStateRef.current;

    if (!activeSession || !activeState || activeState.hasLanded || stepInFlightRef.current) return;

    stepInFlightRef.current = true;

    try {
      const response = await stepSimulation(
        activeSession.sessionId, 
        modeRef.current === 'auto' ? undefined : thrustPercentRef.current,
        1
      );
      
      if (response.data && response.data.state) {
        simulationStateRef.current = response.data.state;
        setSimulationState(response.data.state);

        if (response.data.state.hasLanded) {
          setGameState('ended');
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        }
      }
    } catch (err) {
      console.error('Simulation step failed:', err);
      // Don't crash - just skip this step
    } finally {
      stepInFlightRef.current = false;
    }
  }, []);

  // Game loop
  useEffect(() => {
    if (gameState === 'running' && simulationState && !simulationState.hasLanded) {
      // Clear any existing interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      intervalRef.current = setInterval(step, 1000 / simulationSpeed);
      
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }
  }, [gameState, simulationState, step, simulationSpeed]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameState !== 'running') return;

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          if (!keyDownRef.current) {
            keyDownRef.current = true;
            setThrustPercent(100);
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          setThrustPercent(prev => Math.min(100, prev + 10));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setThrustPercent(prev => Math.max(0, prev - 10));
          break;
        case 'KeyA':
          toggleMode();
          break;
        case 'KeyP':
          setGameState(prev => prev === 'running' ? 'paused' : 'running');
          break;
        default:
          break;
      }
    };

    const handleKeyUp = (e) => {
      if (e.code === 'Space') {
        keyDownRef.current = false;
        setThrustPercent(0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState, toggleMode]);

  // Restart simulation
  const handleRestart = () => {
    setGameState('start');
    setSession(null);
    setSimulationState(null);
    setThrustPercent(0);
  };

  return (
    <div className="min-h-screen w-full relative">
      {/* Starfield Background */}
      <div className="starfield">
        <div className="stars"></div>
      </div>

      {/* Main Content */}
      <AnimatePresence mode="wait">
        {gameState === 'start' && (
          <StartScreen 
            key="start"
            onStart={handleStart} 
            error={error}
          />
        )}

        {(gameState === 'running' || gameState === 'paused') && simulationState && (
          <motion.div
            key="game"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-screen w-full flex flex-col overflow-hidden"
          >
            {/* Top Bar - Mission Control */}
            <MissionControl 
              state={simulationState}
              mode={mode}
              isPaused={gameState === 'paused'}
              onTogglePause={() => setGameState(prev => prev === 'running' ? 'paused' : 'running')}
            />

            {/* Main Area */}
            <div className="flex-1 flex min-h-0 overflow-hidden">
              {/* Telemetry Panel - Left (blackboard) */}
              <TelemetryPanel state={simulationState} />

              {/* Simulation View - Center (rocket on moon) */}
              <SimulationView 
                state={simulationState}
                thrustPercent={mode === 'manual' ? thrustPercent : simulationState.thrustPercent}
              />

              {/* Control Panel - Right */}
              <ControlPanel
                thrustPercent={thrustPercent}
                setThrustPercent={setThrustPercent}
                mode={mode}
                onToggleMode={toggleMode}
                simulationSpeed={simulationSpeed}
                setSimulationSpeed={setSimulationSpeed}
                state={simulationState}
              />
            </div>

            {/* Pause Overlay */}
            {gameState === 'paused' && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50">
                <div className="text-center">
                  <h2 className="text-4xl font-display text-white mb-4">SIMULATION PAUSED</h2>
                  <p className="text-gray-400 mb-8">Press P or click Resume to continue</p>
                  <button
                    onClick={() => setGameState('running')}
                    className="control-btn control-btn-primary text-xl px-8 py-4"
                  >
                    RESUME
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {gameState === 'ended' && simulationState && (
          <LandingResult
            key="result"
            state={simulationState}
            onRestart={handleRestart}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Gauge, 
  Rocket, 
  Fuel, 
  ArrowDown, 
  Timer, 
  Weight,
  Activity,
  Thermometer,
  Shield,
  Navigation
} from 'lucide-react';

function TelemetryPanel({ state }) {
  // Guard against undefined state
  if (!state) {
    return (
      <div className="min-w-[20rem] bg-gray-900/90 border-r border-gray-700 flex flex-col items-center justify-center">
        <div className="text-gray-500">Loading telemetry...</div>
      </div>
    );
  }

  const formatNumber = (num, decimals = 1) => {
    if (num === undefined || num === null || isNaN(num)) return '--';
    return num.toFixed(decimals);
  };

  const formatAltitude = (alt) => {
    if (alt === undefined || alt === null || isNaN(alt)) return '--';
    if (alt >= 1000) {
      return `${(alt / 1000).toFixed(2)} km`;
    }
    return `${alt.toFixed(1)} m`;
  };

  const formatTime = (seconds) => {
    if (!isFinite(seconds) || seconds > 9999) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getVelocityStatus = () => {
    if (state.velocity <= 5) return { color: 'text-console-green', status: 'SAFE' };
    if (state.velocity <= 20) return { color: 'text-warning-amber', status: 'CAUTION' };
    return { color: 'text-nasa-red', status: 'HIGH' };
  };

  const getFuelStatus = () => {
    const fuelPercent = state.fuelPercentage ?? (
      state.fuelCapacity > 0 ? (state.fuel / state.fuelCapacity) * 100 : 0
    );
    if (fuelPercent > 50) return { color: 'text-console-green', status: 'NOMINAL' };
    if (fuelPercent > 20) return { color: 'text-warning-amber', status: 'LOW' };
    return { color: 'text-nasa-red', status: 'CRITICAL' };
  };

  const fuelPercent = state.fuelPercentage ?? (
    state.fuelCapacity > 0 ? (state.fuel / state.fuelCapacity) * 100 : 0
  );
  const velocityGaugePosition = (() => {
    const velocity = Math.max(0, state.velocity);

    if (velocity <= 5) {
      return (velocity / 5) * 25;
    }

    if (velocity <= 20) {
      return 25 + ((velocity - 5) / 15) * 25;
    }

    if (velocity <= 100) {
      return 50 + ((velocity - 20) / 80) * 50;
    }

    return 100;
  })();
  const velocityGaugeTicks = [
    { label: '0', position: '0%', transform: 'translateX(0)' },
    { label: '5', position: '25%', transform: 'translateX(-50%)' },
    { label: '20', position: '50%', transform: 'translateX(-50%)' },
    { label: '100 m/s', position: '100%', transform: 'translateX(-100%)' }
  ];
  const velocityStatus = getVelocityStatus();
  const fuelStatus = getFuelStatus();

  return (
    <div className="w-96 min-w-[20rem] flex-shrink-0 bg-gray-900/90 border-r border-gray-700 flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-gray-700 bg-nasa-blue/20">
        <h2 className="font-display text-lg text-white flex items-center gap-2">
          <Activity size={20} />
          TELEMETRY
        </h2>
      </div>

      {/* Main Telemetry Data */}
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {/* Altitude */}
        <div className="gauge p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <ArrowDown size={12} />
              ALTITUDE
            </span>
            <span className="text-xs text-gray-500">ASL</span>
          </div>
          <div className="text-3xl font-display text-white">
            {formatAltitude(state.altitude)}
          </div>
          {/* Altitude bar */}
          <div className="mt-2 h-2 bg-gray-800 rounded overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-nasa-blue to-console-green"
              style={{ width: `${Math.min((state.altitude / 100000) * 100, 100)}%` }}
            />
          </div>
        </div>

        {/* Velocity */}
        <div className={`gauge p-3 ${state.velocity > 10 && state.altitude < 1000 ? 'critical' : ''}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Gauge size={12} />
              DESCENT VELOCITY
            </span>
            <span className={`text-xs ${velocityStatus.color}`}>
              {velocityStatus.status}
            </span>
          </div>
          <div className={`text-3xl font-display ${velocityStatus.color}`}>
            {formatNumber(state.velocity)} <span className="text-lg">m/s</span>
          </div>
          {/* Safe zone indicator */}
          <div className="mt-2 relative h-4 bg-gray-800 rounded overflow-hidden">
            {/* Safe zone (0-5 m/s) */}
            <div className="absolute left-0 top-0 bottom-0 w-1/4 bg-console-green/30" />
            {/* Caution zone (5-20 m/s) */}
            <div className="absolute left-1/4 top-0 bottom-0 w-1/4 bg-warning-amber/20" />
            {/* High-speed zone (20-100+ m/s) */}
            <div className="absolute left-1/2 top-0 bottom-0 w-1/2 bg-nasa-red/15" />
            {velocityGaugeTicks.map((tick) => (
              <div
                key={tick.label}
                className="absolute top-0 bottom-0 w-px bg-gray-500/70"
                style={{ left: tick.position, transform: tick.transform }}
              />
            ))}
            {/* Velocity indicator */}
            <motion.div
              className="absolute top-0 bottom-0 w-1 -translate-x-1/2 bg-white"
              style={{ left: `${velocityGaugePosition}%` }}
            />
          </div>
          <div className="relative mt-1 h-4 text-xs text-gray-500">
            {velocityGaugeTicks.map((tick) => (
              <span
                key={tick.label}
                className="absolute top-0 whitespace-nowrap"
                style={{ left: tick.position, transform: tick.transform }}
              >
                {tick.label}
              </span>
            ))}
          </div>
        </div>

        {/* Fuel */}
        <div className={`gauge p-3 ${fuelPercent < 10 ? 'warning' : ''}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Fuel size={12} />
              PROPELLANT
            </span>
            <span className={`text-xs ${fuelStatus.color}`}>
              {fuelStatus.status}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-display ${fuelStatus.color}`}>
              {formatNumber(state.fuel, 0)}
            </span>
            <span className="text-lg text-gray-400">kg</span>
            <span className="text-sm text-gray-500">
              ({fuelPercent.toFixed(1)}%)
            </span>
          </div>
          {/* Fuel bar */}
          <div className="mt-2 h-4 bg-gray-800 rounded overflow-hidden">
            <motion.div
              className={`h-full ${
                fuelPercent > 50 
                  ? 'bg-gradient-to-r from-console-green to-green-400' 
                  : fuelPercent > 20 
                    ? 'bg-gradient-to-r from-warning-amber to-yellow-400'
                    : 'bg-gradient-to-r from-nasa-red to-red-400'
              }`}
              style={{ width: `${fuelPercent}%` }}
            />
          </div>
        </div>

        {/* Mass */}
        <div className="gauge p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Weight size={12} />
              TOTAL MASS
            </span>
          </div>
          <div className="text-2xl font-display text-white">
            {formatNumber(state.mass, 0)} <span className="text-sm">kg</span>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Dry mass: {formatNumber(state.emptyMass, 0)} kg
          </div>
        </div>

        {/* Thrust */}
        <div className="gauge p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Rocket size={12} />
              ENGINE THRUST
            </span>
            <span className={`text-xs ${state.thrust > 0 ? 'text-nasa-red' : 'text-gray-500'}`}>
              {state.thrust > 0 ? 'FIRING' : 'IDLE'}
            </span>
          </div>
          <div className={`text-2xl font-display ${state.thrust > 0 ? 'text-nasa-red' : 'text-gray-400'}`}>
            {formatNumber(state.thrust, 0)} <span className="text-sm">N</span>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {formatNumber(state.thrustPercent, 0)}% throttle
          </div>
        </div>

        {/* Time to Impact */}
        <div className="gauge p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Timer size={12} />
              TIME TO SURFACE
            </span>
          </div>
          <div className={`text-2xl font-display ${
            state.timeToImpact < 30 ? 'text-nasa-red' : 
            state.timeToImpact < 60 ? 'text-warning-amber' : 'text-white'
          }`}>
            {formatTime(state.timeToImpact)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            At current trajectory
          </div>
        </div>

        {/* Gravitational Acceleration */}
        <div className="gauge p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400">
              LOCAL GRAVITY
            </span>
          </div>
          <div className="text-xl font-display text-white">
            {formatNumber(state.gravity, 4)} <span className="text-sm">m/s²</span>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Surface: 1.62 m/s²
          </div>
        </div>

        {/* Net Acceleration */}
        <div className="gauge p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400">
              NET ACCELERATION
            </span>
          </div>
          <div className={`text-xl font-display ${
            state.acceleration > 0 ? 'text-console-green' : 'text-nasa-red'
          }`}>
            {state.acceleration > 0 ? '+' : ''}{formatNumber(state.acceleration, 3)} <span className="text-sm">m/s²</span>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {state.acceleration > 0 ? 'Decelerating' : 'Accelerating toward surface'}
          </div>
        </div>

        {/* Mission Phase */}
        {state.phase && (
          <div className="gauge p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Navigation size={12} />
                MISSION PHASE
              </span>
            </div>
            <div className={`text-lg font-display uppercase ${
              state.phase === 'landed' ? 'text-console-green' :
              state.phase === 'crashed' ? 'text-nasa-red' :
              state.phase === 'braking' ? 'text-warning-amber' :
              state.phase === 'terminal' ? 'text-nasa-red' :
              'text-nasa-blue'
            }`}>
              {state.phase.replace('_', ' ')}
            </div>
            {state.optimalBrakingAltitude && (
              <div className="text-xs text-gray-500 mt-1">
                Optimal brake at: {formatAltitude(state.optimalBrakingAltitude)}
              </div>
            )}
          </div>
        )}

        {/* Ship Health */}
        {state.health && (
          <div className={`gauge p-3 ${state.health === 'red' ? 'critical' : state.health === 'yellow' ? 'warning' : ''}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Shield size={12} />
                SHIP HEALTH
              </span>
              <span className={`text-xs font-bold uppercase ${
                state.health === 'green' ? 'text-console-green' :
                state.health === 'yellow' ? 'text-warning-amber' :
                'text-nasa-red'
              }`}>
                {state.health}
              </span>
            </div>
            
            {/* Thermal Load */}
            {state.thermalLoad !== undefined && (
              <div className="mt-2">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span className="flex items-center gap-1">
                    <Thermometer size={10} />
                    THERMAL
                  </span>
                  <span>{formatNumber(state.thermalLoad, 0)}%</span>
                </div>
                <div className="h-2 bg-gray-800 rounded overflow-hidden">
                  <motion.div
                    className={`h-full ${
                      state.thermalLoad > 80 ? 'bg-nasa-red' :
                      state.thermalLoad > 50 ? 'bg-warning-amber' :
                      'bg-console-green'
                    }`}
                    style={{ width: `${state.thermalLoad}%` }}
                  />
                </div>
              </div>
            )}

            {/* Structural Integrity */}
            {state.structuralIntegrity !== undefined && (
              <div className="mt-2">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>STRUCTURE</span>
                  <span>{formatNumber(state.structuralIntegrity, 0)}%</span>
                </div>
                <div className="h-2 bg-gray-800 rounded overflow-hidden">
                  <motion.div
                    className={`h-full ${
                      state.structuralIntegrity < 50 ? 'bg-nasa-red' :
                      state.structuralIntegrity < 75 ? 'bg-warning-amber' :
                      'bg-console-green'
                    }`}
                    style={{ width: `${state.structuralIntegrity}%` }}
                  />
                </div>
              </div>
            )}

            {/* Warnings */}
            {state.warnings && state.warnings.length > 0 && (
              <div className="mt-2 space-y-1">
                {state.warnings.map((warning, idx) => (
                  <div key={idx} className="text-xs text-nasa-red bg-red-900/30 px-2 py-1 rounded">
                    ⚠ {warning}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Status LEDs */}
      <div className="p-3 border-t border-gray-700 bg-gray-900">
        <div className="grid grid-cols-4 gap-2 text-xs">
          <div className="flex items-center gap-2">
            <div className={`led ${state.fuel > 0 ? 'led-green' : 'led-red'}`} />
            <span className="text-gray-400">FUEL</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`led ${state.thrust > 0 ? 'led-amber' : 'led-off'}`} />
            <span className="text-gray-400">ENG</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`led ${state.velocity <= 5 ? 'led-green' : state.velocity <= 20 ? 'led-amber' : 'led-red'}`} />
            <span className="text-gray-400">VEL</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`led ${
              state.health === 'green' ? 'led-green' : 
              state.health === 'yellow' ? 'led-amber' : 
              state.health === 'red' ? 'led-red' : 'led-green'
            }`} />
            <span className="text-gray-400">SYS</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TelemetryPanel;

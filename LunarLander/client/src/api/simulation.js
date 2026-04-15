import axios from 'axios';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
});

// Physical Constants & Equations
export const getConstants = () => api.get('/constants');
export const getEquations = (category) => 
  category ? api.get(`/equations/${category}`) : api.get('/equations');

// Lander Configurations
export const getLanders = () => api.get('/landers');
export const getLander = (id) => api.get(`/landers/${id}`);

// Simulation
export const startSimulation = (config) => api.post('/simulation/start', config);
export const stepSimulation = (sessionId, thrustPercent, dt = 1) => 
  api.post(`/simulation/${sessionId}/step`, { thrustPercent, dt });
export const getSimulation = (sessionId) => api.get(`/simulation/${sessionId}`);
export const getTelemetry = (sessionId) => api.get(`/simulation/${sessionId}/telemetry`);
export const setSimulationMode = (sessionId, mode) => 
  api.post(`/simulation/${sessionId}/mode`, { mode });
export const resetSimulation = (sessionId) => 
  api.post(`/simulation/${sessionId}/reset`);

// Physics Calculations
export const calculateGravity = (altitude) => 
  api.post('/physics/gravity', { altitude });
export const calculateTimeToImpact = (altitude, velocity) => 
  api.post('/physics/time-to-impact', { altitude, velocity });

// Session History
export const getSessions = () => api.get('/sessions');

export default api;

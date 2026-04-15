import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { after, before, test } from 'node:test';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const serverDir = join(__dirname, '..');
const tempDataDir = mkdtempSync(join(tmpdir(), 'lunar-lander-test-'));
const port = 3101;
const baseUrl = `http://localhost:${port}`;

let serverProcess;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServerReady() {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/api/health`);
      if (response.ok) return;
    } catch {
      // Server is still starting.
    }

    await delay(100);
  }

  throw new Error('Server did not become ready in time');
}

async function postJson(path, payload) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload)
  });

  assert.equal(response.ok, true, `Expected successful response for ${path}`);
  return response.json();
}

async function postEmpty(path) {
  const response = await fetch(`${baseUrl}${path}`, { method: 'POST' });
  assert.equal(response.ok, true, `Expected successful response for ${path}`);
  return response.json();
}

async function runAutopilotScenario(dt) {
  const start = await postJson('/api/simulation/start', {
    landerId: 1,
    startAltitude: 100000,
    startVelocity: 50,
    mode: 'auto'
  });

  let state = start.state;
  let steps = 0;

  while (!state.hasLanded && steps < 5000) {
    const step = await postJson(`/api/simulation/${start.sessionId}/step`, { dt });
    state = step.state;
    steps += 1;
  }

  return { start, state, steps };
}

before(async () => {
  serverProcess = spawn(process.execPath, ['src/index.js'], {
    cwd: serverDir,
    env: {
      ...process.env,
      PORT: String(port),
      LUNAR_LANDER_DATA_DIR: tempDataDir,
      LUNAR_LANDER_DB_FILE: join(tempDataDir, 'lunar_lander.test.json')
    },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  serverProcess.stdout.on('data', () => {});
  serverProcess.stderr.on('data', () => {});

  await waitForServerReady();
});

after(() => {
  if (serverProcess && !serverProcess.killed) {
    serverProcess.kill('SIGINT');
  }

  rmSync(tempDataDir, { recursive: true, force: true });
});

test('reset restores the original advanced simulation state', async () => {
  const start = await postJson('/api/simulation/start', {
    landerId: 1,
    startAltitude: 1000,
    startVelocity: 10,
    mode: 'manual'
  });

  const firstStep = await postJson(`/api/simulation/${start.sessionId}/step`, {
    thrustPercent: 0,
    dt: 1
  });

  const reset = await postEmpty(`/api/simulation/${start.sessionId}/reset`);

  const secondStepAfterReset = await postJson(`/api/simulation/${start.sessionId}/step`, {
    thrustPercent: 0,
    dt: 1
  });

  assert.equal(start.state.phase, 'freefall');
  assert.ok(start.state.timeToImpact > 0);
  assert.equal(reset.state.phase, 'freefall');
  assert.equal(reset.state.time, 0);
  assert.equal(reset.state.altitude, start.state.altitude);
  assert.equal(reset.state.velocity, start.state.velocity);
  assert.equal(secondStepAfterReset.state.time, firstStep.state.time);
  assert.equal(secondStepAfterReset.state.altitude, firstStep.state.altitude);
  assert.equal(secondStepAfterReset.state.velocity, firstStep.state.velocity);
});

test('landing preserves touchdown velocity while settling the final state to zero', async () => {
  const start = await postJson('/api/simulation/start', {
    landerId: 1,
    startAltitude: 1000,
    startVelocity: 10,
    mode: 'manual'
  });

  let state = start.state;

  while (!state.hasLanded) {
    const step = await postJson(`/api/simulation/${start.sessionId}/step`, {
      thrustPercent: 0,
      dt: 1
    });

    state = step.state;
  }

  assert.equal(state.velocity, 0);
  assert.ok(state.touchdownVelocity > 50);
  assert.equal(state.landingResult.rating, 'crash-fatal');
});

test('autopilot remains consistent when the API receives larger timesteps', async () => {
  const dt1 = await runAutopilotScenario(1);
  const dt2 = await runAutopilotScenario(2);

  assert.equal(dt1.state.hasLanded, true);
  assert.equal(dt2.state.hasLanded, true);
  assert.equal(dt1.state.landingResult.success, true);
  assert.equal(dt2.state.landingResult.success, true);
  assert.equal(dt1.state.landingResult.rating, dt2.state.landingResult.rating);
  assert.ok(Math.abs(dt1.state.touchdownVelocity - dt2.state.touchdownVelocity) < 1e-9);
  assert.ok(Math.abs(dt1.state.time - dt2.state.time) < 1e-9);
});

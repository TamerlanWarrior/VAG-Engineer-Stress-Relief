import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createInitialState,
  calculateStage,
  processHit,
  TOOLS,
  SPECIAL_TOOL,
  CORE_QUOTES,
  pickQuote,
} from './logic';

test('createInitialState initializes correct default values', () => {
  const state = createInitialState(1000);
  assert.equal(state.mechanicStress, 1000);
  assert.equal(state.maxStress, 1000);
  assert.equal(state.rage, 0);
  assert.equal(state.combo, 0);
  assert.equal(state.stage, 1);
  assert.equal(state.zenAchieved, false);
});

test('calculateStage transitions through damage thresholds', () => {
  assert.equal(calculateStage(1000, 1000), 1);
  assert.equal(calculateStage(800, 1000), 1);
  assert.equal(calculateStage(600, 1000), 2);
  assert.equal(calculateStage(300, 1000), 3);
  assert.equal(calculateStage(100, 1000), 4);
  assert.equal(calculateStage(0, 1000), 4);
});

test('processHit reduces stress, increases combo and builds rage', () => {
  const state0 = createInitialState(1000);
  const slapTool = TOOLS.find(t => t.id === 'slap')!;

  const hit1 = processHit(state0, slapTool, 1000, false);
  assert.ok(hit1.nextState.mechanicStress < 1000, 'Stress must be reduced');
  assert.equal(hit1.nextState.combo, 1);
  assert.equal(hit1.nextState.totalHits, 1);
  assert.equal(hit1.nextState.rage, slapTool.rageGain);

  // Subsequent hit within combo window (1.0s later)
  const hit2 = processHit(hit1.nextState, slapTool, 2000, false);
  assert.equal(hit2.nextState.combo, 2);
  assert.equal(hit2.nextState.totalHits, 2);
  assert.equal(hit2.nextState.rage, slapTool.rageGain * 2);

  // Hit after combo drop (5.0s later)
  const hit3 = processHit(hit2.nextState, slapTool, 7000, false);
  assert.equal(hit3.nextState.combo, 1);
});

test('pickQuote returns core quotes when forced or on multiple of 3', () => {
  for (let i = 0; i < 20; i++) {
    const forced = pickQuote(i, true);
    assert.equal(forced.isCore, true);
    assert.ok(
      CORE_QUOTES.includes(forced.text as typeof CORE_QUOTES[number]),
      `Picked quote "${forced.text}" must be one of the core quotes`
    );
  }
});

test('Special tool discharges rage and deals heavy damage', () => {
  const state = {
    ...createInitialState(1000),
    rage: 100,
  };
  const hit = processHit(state, SPECIAL_TOOL, 1000, true);
  assert.equal(hit.nextState.rage, 0, 'Rage must be consumed by special tool');
  assert.ok(hit.damageDealt >= SPECIAL_TOOL.damage, 'Damage must be at least base damage');
});

test('Stress reaches zero and triggers zenAchieved', () => {
  const state = {
    ...createInitialState(50),
    mechanicStress: 10,
  };
  const sledge = TOOLS.find(t => t.id === 'sledge')!;
  const hit = processHit(state, sledge, 1000, true);
  assert.equal(hit.nextState.mechanicStress, 0);
  assert.equal(hit.nextState.zenAchieved, true);
});

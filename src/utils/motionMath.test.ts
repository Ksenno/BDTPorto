import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clamp,
  lerp,
  smootherStep,
  mapRange,
  computeScrollTransform,
  computeChapterFromScroll,
  computeMagneticOffset,
  computeHorizontalStageMetrics,
  computeProcessStageState,
  shortestAngleDeltaDeg,
  stepAngleSpring,
  stepUnderdampedSpring,
  stepSpringVector2D,
  stepSpringNode2D,
  computeChapterEntranceMetrics,
  computeIntroExitPortalMetrics,
  stepSlewDampedValue,
  compressWheelDelta,
} from './motionMath';

test('stepUnderdampedSpring and stepSpringVector2D provide organic inertia and respect velocity caps', () => {
  const s1 = stepUnderdampedSpring(0, 0, 1, 1 / 60, 130, 15.5, 1.5);
  assert.ok(s1.value > 0 && s1.value <= 1.5 * (1 / 60) + 0.001);
  assert.ok(s1.velocity > 0);

  const v2 = stepSpringVector2D({ x: 0, y: 0, vx: 0, vy: 0 }, 10, -10, 1 / 60);
  assert.ok(v2.x > 0 && v2.y < 0);
  assert.equal(smootherStep(0, 1, 0.5), 0.5);
});

test('stepSlewDampedValue tracks small changes accurately and caps excessive fast-scroll jumps', () => {
  // Small difference tracks smoothly
  const gentle = stepSlewDampedValue(0.2, 0.22, 1 / 60, 12, 0.8);
  assert.ok(gentle > 0.2 && gentle <= 0.22);

  // Huge sudden jump (0 -> 1) is bounded by maxSpeedPerSec * dt so animation is never skipped
  const maxSpeed = 0.6;
  const dt = 0.016;
  const capped = stepSlewDampedValue(0, 1, dt, 12, maxSpeed);
  assert.ok(capped <= maxSpeed * dt + 0.0005, 'slew rate must cap fast animation jump');
});

test('compressWheelDelta preserves gentle scrolling and compresses extreme wheel bursts', () => {
  assert.equal(compressWheelDelta(24, false), 24);
  const burst = compressWheelDelta(500, false);
  assert.ok(burst < 105 && burst > 40, 'extreme wheel spike should be soft-compressed');
  const checkpointBurst = compressWheelDelta(500, true);
  assert.ok(checkpointBurst < burst, 'checkpoint detent should further damp fast bursts');
});

test('clamp and lerp enforce boundaries accurately', () => {
  assert.equal(clamp(1.5, 0, 1), 1);
  assert.equal(clamp(-0.5, 0, 1), 0);
  assert.equal(lerp(10, 20, 0.5), 15);
  assert.equal(mapRange(0.5, 0, 1, 100, 200), 150);
});

test('computeScrollTransform follows exact scroll storytelling specification', () => {
  const start = computeScrollTransform(0.0);
  assert.equal(start.scale, 0.8);
  assert.equal(start.opacity, 0);
  assert.equal(start.rotation, -5);

  const mid = computeScrollTransform(0.5);
  assert.equal(mid.scale, 1);
  assert.equal(mid.opacity, 1);
  assert.equal(mid.rotation, 0);
  assert.equal(mid.blur, 0);

  const end = computeScrollTransform(1.0);
  assert.equal(end.scale, 1.2);
  assert.equal(end.opacity, 0);
  assert.equal(end.rotation, 5);
});

test('computeChapterFromScroll maps scroll progress to chapters 01-07', () => {
  const ch1 = computeChapterFromScroll(0.05);
  assert.equal(ch1.code, '01');
  assert.equal(ch1.id, 'intro');
  assert.equal(ch1.isEnding, false);

  const ch3 = computeChapterFromScroll(0.42);
  assert.equal(ch3.code, '03');
  assert.equal(ch3.id, 'work');

  const ch7 = computeChapterFromScroll(0.98);
  assert.equal(ch7.code, '07');
  assert.equal(ch7.id, 'ending');
  assert.equal(ch7.isEnding, true);
});

test('computeMagneticOffset pulls cursor within radius and zeroes outside', () => {
  const inside = computeMagneticOffset(110, 100, 50, 50, 100, 100, 0.4, 100);
  assert.equal(inside.isInside, true);
  assert.ok(inside.x > 0);
  assert.equal(inside.y, 0);

  const outside = computeMagneticOffset(400, 400, 50, 50, 100, 100, 0.4, 100);
  assert.equal(outside.isInside, false);
  assert.equal(outside.x, 0);
  assert.equal(outside.y, 0);
});

test('computeHorizontalStageMetrics computes stage transforms and active stage', () => {
  const startMetrics = computeHorizontalStageMetrics(0, 5);
  assert.equal(startMetrics.activeStageIndex, 0);
  assert.equal(startMetrics.translateXPercent, 0);
  assert.equal(startMetrics.stageTransforms[0].scale, 1);
  assert.equal(startMetrics.stageTransforms[0].isActive, true);

  const midMetrics = computeHorizontalStageMetrics(0.5, 5);
  assert.equal(midMetrics.activeStageIndex, 2);
  assert.equal(midMetrics.stageTransforms[2].isActive, true);
  assert.equal(midMetrics.stageTransforms[2].scale, 1);

  const endMetrics = computeHorizontalStageMetrics(1, 5);
  assert.equal(endMetrics.activeStageIndex, 4);
  assert.equal(endMetrics.translateXPercent, -80);
});

test('computeProcessStageState interpolates across all 6 process stages', () => {
  const idea = computeProcessStageState(0, 6);
  assert.equal(idea.activeStageIndex, 0);
  assert.equal(idea.stageWeights[0], 1);

  const ship = computeProcessStageState(1, 6);
  assert.equal(ship.activeStageIndex, 5);
  assert.equal(ship.stageWeights[5], 1);
});

test('shortestAngleDeltaDeg and stepAngleSpring prevent 360-degree flip across -180/+180 boundary', () => {
  const delta = shortestAngleDeltaDeg(175, -175);
  assert.equal(delta, 10);

  const step = stepAngleSpring(175, 0, -175, 180, 18, 1 / 60);
  assert.ok(step.angle > 175, 'angle should increase smoothly past 175 rather than snapping negative');
});

test('stepSpringNode2D applies radial repulsion from cursor and restores toward origin', () => {
  const initialNode = {
    x: 100,
    y: 100,
    originX: 100,
    originY: 100,
    vx: 0,
    vy: 0,
  };

  const pushed = stepSpringNode2D(initialNode, 80, 100, 120, 0, true, 100);
  assert.ok(pushed.vx > 0);
  assert.ok(pushed.x > 100);

  const returning = stepSpringNode2D(
    { ...initialNode, x: 120, y: 100, vx: 0, vy: 0 },
    0,
    0,
    0,
    0,
    false
  );
  assert.ok(returning.vx < 0);
});

test('computeChapterEntranceMetrics and computeIntroExitPortalMetrics drive SVG dashoffset and clip-path', () => {
  const startEntrance = computeChapterEntranceMetrics(0, 900, 0.36);
  assert.equal(startEntrance.entranceRatio, 0);
  assert.equal(startEntrance.strokeDashoffset, 900);
  assert.ok(startEntrance.clipInsetSidePercent > 0);

  const fullEntrance = computeChapterEntranceMetrics(0.5, 900, 0.36);
  assert.equal(fullEntrance.entranceRatio, 1);
  assert.equal(fullEntrance.strokeDashoffset, 0);
  assert.equal(fullEntrance.clipInsetSidePercent, 0);
  assert.equal(fullEntrance.fillOpacity, 1);

  const introStart = computeIntroExitPortalMetrics(0, 600);
  assert.equal(introStart.exitRatio, 0);
  assert.equal(introStart.conduitDashoffset, 600);

  const introEnd = computeIntroExitPortalMetrics(1, 600);
  assert.equal(introEnd.exitRatio, 1);
  assert.equal(introEnd.conduitDashoffset, 0);
  assert.ok(introEnd.frameInsetPercent > 0);
});



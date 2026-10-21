export interface ScrollInterpolatedState {
  scale: number;
  opacity: number;
  rotation: number;
  blur: number;
  translateY: number;
  letterSpacingEm: number;
}

export interface ChapterProgressInfo {
  index: number;
  code: string;
  id: string;
  label: string;
  localProgress: number;
  isEnding: boolean;
}

export interface StageTransform {
  scale: number;
  opacity: number;
  parallaxX: number;
  metadataOffset: number;
  clipInsetPercent: number;
  isActive: boolean;
}

export interface HorizontalGalleryMetrics {
  translateXPercent: number;
  continuousIndex: number;
  activeStageIndex: number;
  stageLocalProgress: number;
  stageTransforms: StageTransform[];
}

export interface MagneticVector {
  x: number;
  y: number;
  distance: number;
  isInside: boolean;
}

export interface ProcessStageMetrics {
  activeStageIndex: number;
  morphProgress: number;
  stageWeights: number[];
}

export function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return Math.min(Math.max(value, min), max);
}

export function lerp(start: number, end: number, amount: number): number {
  const t = clamp(amount, 0, 1);
  return start + (end - start) * t;
}

/**
 * Perlin C2-continuous quintic smootherstep (6t^5 - 15t^4 + 10t^3).
 * Eliminates acceleration jerk at start/end boundaries for organic motion.
 */
export function smootherStep(edge0: number, edge1: number, x: number): number {
  if (Math.abs(edge1 - edge0) < 1e-9) return 0;
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return Number((t * t * t * (t * (t * 6 - 15) + 10)).toFixed(4));
}

export function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
  clampResult = true
): number {
  if (Math.abs(inMax - inMin) < 1e-9) return outMin;
  const normalized = (value - inMin) / (inMax - inMin);
  const mapped = outMin + normalized * (outMax - outMin);
  if (!clampResult) return mapped;
  const low = Math.min(outMin, outMax);
  const high = Math.max(outMin, outMax);
  return clamp(mapped, low, high);
}

/**
 * Continuous scroll storytelling curve:
 * progress 0.00 -> scale 0.8, opacity 0, rotation -5deg
 * progress 0.50 -> scale 1.0, opacity 1, rotation 0deg
 * progress 1.00 -> scale 1.2, opacity 0, rotation +5deg
 */
export function computeScrollTransform(progress: number): ScrollInterpolatedState {
  const p = clamp(progress, 0, 1);

  const scale = p <= 0.5
    ? mapRange(p, 0, 0.5, 0.8, 1.0)
    : mapRange(p, 0.5, 1.0, 1.0, 1.2);

  const opacity = p <= 0.5
    ? mapRange(p, 0, 0.5, 0.0, 1.0)
    : mapRange(p, 0.5, 1.0, 1.0, 0.0);

  const rotation = mapRange(p, 0, 1, -5, 5);

  const distanceFromCenter = Math.abs(p - 0.5) * 2; // 0 at center, 1 at edges
  const blur = Number((distanceFromCenter * distanceFromCenter * 8).toFixed(2));
  const translateY = mapRange(p, 0, 1, 48, -48);
  const letterSpacingEm = mapRange(p, 0, 1, -0.05, 0.04);

  return {
    scale: Number(scale.toFixed(4)),
    opacity: Number(opacity.toFixed(4)),
    rotation: Number(rotation.toFixed(4)),
    blur,
    translateY: Number(translateY.toFixed(2)),
    letterSpacingEm: Number(letterSpacingEm.toFixed(4)),
  };
}

export const CHAPTER_BOUNDARIES = [
  { code: '01', id: 'intro', label: 'INTRO', start: 0.0, end: 0.14 },
  { code: '02', id: 'identity', label: 'IDENTITY', start: 0.14, end: 0.28 },
  { code: '03', id: 'work', label: 'WORK', start: 0.28, end: 0.58 },
  { code: '04', id: 'lab', label: 'LAB', start: 0.58, end: 0.74 },
  { code: '05', id: 'process', label: 'PROCESS', start: 0.74, end: 0.86 },
  { code: '06', id: 'about', label: 'ABOUT', start: 0.86, end: 0.94 },
  { code: '07', id: 'ending', label: 'ENDING', start: 0.94, end: 1.0 },
] as const;

export function computeChapterFromScroll(scrollRatio: number): ChapterProgressInfo {
  const r = clamp(scrollRatio, 0, 1);
  for (let i = 0; i < CHAPTER_BOUNDARIES.length; i++) {
    const ch = CHAPTER_BOUNDARIES[i];
    const isLast = i === CHAPTER_BOUNDARIES.length - 1;
    if (r >= ch.start && (r < ch.end || isLast)) {
      const localProgress = clamp((r - ch.start) / (ch.end - ch.start), 0, 1);
      return {
        index: i,
        code: ch.code,
        id: ch.id,
        label: ch.label,
        localProgress: Number(localProgress.toFixed(4)),
        isEnding: ch.id === 'ending' && localProgress > 0.35,
      };
    }
  }
  const fallback = CHAPTER_BOUNDARIES[0];
  return {
    index: 0,
    code: fallback.code,
    id: fallback.id,
    label: fallback.label,
    localProgress: 0,
    isEnding: false,
  };
}

export function computeMagneticOffset(
  cursorX: number,
  cursorY: number,
  rectLeft: number,
  rectTop: number,
  rectWidth: number,
  rectHeight: number,
  strength = 0.35,
  radius = 120
): MagneticVector {
  const centerX = rectLeft + rectWidth / 2;
  const centerY = rectTop + rectHeight / 2;
  const dx = cursorX - centerX;
  const dy = cursorY - centerY;
  const distance = Math.hypot(dx, dy);

  if (distance > radius || radius <= 0) {
    return { x: 0, y: 0, distance: Number(distance.toFixed(2)), isInside: false };
  }

  // Smooth organic falloff curve near the edge of the magnetic field
  const normFalloff = 1 - distance / radius;
  const organicFalloff = normFalloff * (1.15 - 0.15 * normFalloff);
  const pullFactor = organicFalloff * strength;
  return {
    x: Number((dx * pullFactor).toFixed(2)),
    y: Number((dy * pullFactor).toFixed(2)),
    distance: Number(distance.toFixed(2)),
    isInside: true,
  };
}

export function computeHorizontalStageMetrics(
  scrollProgress: number,
  stageCount: number
): HorizontalGalleryMetrics {
  const safeCount = Math.max(1, stageCount);
  const p = clamp(scrollProgress, 0, 1);

  if (safeCount === 1) {
    return {
      translateXPercent: 0,
      continuousIndex: 0,
      activeStageIndex: 0,
      stageLocalProgress: p,
      stageTransforms: [
        {
          scale: 1,
          opacity: 1,
          parallaxX: 0,
          metadataOffset: 0,
          clipInsetPercent: 0,
          isActive: true,
        },
      ],
    };
  }

  const totalSpan = safeCount - 1;
  const rawContinuous = p * totalSpan;
  const baseIdx = Math.min(Math.floor(rawContinuous), totalSpan - 1);
  const frac = rawContinuous - baseIdx;

  // Plateau-ease with C2 quintic smootherStep so stage entry/exit has zero acceleration jerk
  let easedFrac = 0;
  if (frac < 0.25) {
    easedFrac = 0;
  } else if (frac > 0.75) {
    easedFrac = 1;
  } else {
    easedFrac = smootherStep(0.25, 0.75, frac);
  }

  const continuousIndex = Number((p >= 1 ? totalSpan : baseIdx + easedFrac).toFixed(4));
  const activeStageIndex = clamp(Math.round(continuousIndex), 0, safeCount - 1);
  const stageSegment = 1 / totalSpan;
  const stageStart = activeStageIndex * stageSegment;
  const stageLocalProgress = clamp(
    (p - (stageStart - stageSegment * 0.5)) / stageSegment,
    0,
    1
  );

  // Translate container horizontally across stages using the eased index
  const translateXPercent = Number(
    (-(continuousIndex / safeCount) * 100).toFixed(4)
  );

  const stageTransforms: StageTransform[] = [];
  for (let i = 0; i < safeCount; i++) {
    const delta = continuousIndex - i; // 0 when centered on stage i
    const absDelta = Math.abs(delta);
    const scale = clamp(1 - absDelta * 0.05, 0.94, 1);
    const opacity = clamp(1 - absDelta * 0.16, 0.84, 1);
    const parallaxX = Number((delta * 28).toFixed(2));
    const metadataOffset = Number((delta * 32).toFixed(2));
    const clipInsetPercent = Number(clamp(absDelta * 8, 0, 12).toFixed(2));

    stageTransforms.push({
      scale: Number(scale.toFixed(4)),
      opacity: Number(opacity.toFixed(4)),
      parallaxX,
      metadataOffset,
      clipInsetPercent,
      isActive: i === activeStageIndex,
    });
  }

  return {
    translateXPercent,
    continuousIndex,
    activeStageIndex,
    stageLocalProgress: Number(stageLocalProgress.toFixed(4)),
    stageTransforms,
  };
}

export function computeProcessStageState(
  scrollProgress: number,
  totalStages = 6
): ProcessStageMetrics {
  const count = Math.max(1, totalStages);
  const p = clamp(scrollProgress, 0, 1);
  const scaled = p * (count - 1);
  const activeStageIndex = clamp(Math.round(scaled), 0, count - 1);
  const morphProgress = Number((scaled - Math.floor(scaled)).toFixed(4));

  const stageWeights: number[] = [];
  for (let i = 0; i < count; i++) {
    const dist = Math.abs(scaled - i);
    const weight = clamp(1 - dist * 0.85, 0.12, 1);
    stageWeights.push(Number(weight.toFixed(4)));
  }

  return {
    activeStageIndex,
    morphProgress,
    stageWeights,
  };
}

export interface SpringNode2D {
  x: number;
  y: number;
  originX: number;
  originY: number;
  vx: number;
  vy: number;
}

export interface SpringVector2D {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

/**
 * Computes the shortest signed angular difference in degrees within [-180, 180]
 * to prevent 360-degree wrap-around flips at the -180/+180 atan2 boundary.
 */
export function shortestAngleDeltaDeg(currentDeg: number, targetDeg: number): number {
  const diff = ((targetDeg - currentDeg + 180) % 360 + 360) % 360 - 180;
  return Number(diff.toFixed(4));
}

/**
 * Advances a continuous angle (unbounded degrees) toward targetDeg using shortest-path
 * spring-damper physics so needles rotate smoothly without branch-cut snapping.
 */
export function stepAngleSpring(
  currentDeg: number,
  velocityDeg: number,
  targetDeg: number,
  stiffness = 165,
  damping = 15,
  dt = 1 / 60
): { angle: number; velocity: number } {
  const delta = shortestAngleDeltaDeg(currentDeg, targetDeg);
  const accel = delta * stiffness - velocityDeg * damping;
  const nextVel = velocityDeg + accel * dt;
  const nextAngle = currentDeg + nextVel * dt;
  return {
    angle: Number(nextAngle.toFixed(3)),
    velocity: Number(nextVel.toFixed(3)),
  };
}

/**
 * Steps a 1D soft underdamped spring (zeta ~ 0.68..0.76) with optional velocity cap
 * so animations have a gentle, organic swing and follow-through without ever skipping.
 */
export function stepUnderdampedSpring(
  current: number,
  velocity: number,
  target: number,
  dtSeconds: number,
  stiffness = 130,
  damping = 15.5,
  maxSpeedPerSec = 0
): { value: number; velocity: number } {
  const safeDt = clamp(dtSeconds, 0.001, 0.045);
  const disp = target - current;
  if (Math.abs(disp) < 0.0004 && Math.abs(velocity) < 0.002) {
    return { value: target, velocity: 0 };
  }

  const accel = disp * stiffness - velocity * damping;
  let nextVel = velocity + accel * safeDt;
  if (maxSpeedPerSec > 0) {
    nextVel = clamp(nextVel, -maxSpeedPerSec, maxSpeedPerSec);
  }
  const nextVal = current + nextVel * safeDt;
  return {
    value: Number(nextVal.toFixed(4)),
    velocity: Number(nextVel.toFixed(4)),
  };
}

/**
 * Steps a 2D soft-spring vector for organic cursor tracking, magnetic buttons, and tilt planes.
 */
export function stepSpringVector2D(
  state: SpringVector2D,
  targetX: number,
  targetY: number,
  dtSeconds: number,
  stiffness = 135,
  damping = 15
): SpringVector2D {
  const sx = stepUnderdampedSpring(state.x, state.vx, targetX, dtSeconds, stiffness, damping);
  const sy = stepUnderdampedSpring(state.y, state.vy, targetY, dtSeconds, stiffness, damping);
  return {
    x: sx.value,
    y: sy.value,
    vx: sx.velocity,
    vy: sy.velocity,
  };
}

/**
 * Steps a 2D Hooke's law spring node with accurate radial pointer repulsion/attraction
 * and soft underdamped velocity damping for organic elastic oscillation.
 */
export function stepSpringNode2D(
  node: SpringNode2D,
  pointerX: number,
  pointerY: number,
  pointerVx: number,
  pointerVy: number,
  pointerActive: boolean,
  interactionRadius = 115,
  stiffness = 150,
  damping = 11.5,
  dt = 1 / 60
): SpringNode2D {
  // Restoring spring force toward (originX, originY)
  const dispX = node.x - node.originX;
  const dispY = node.y - node.originY;
  let fx = -stiffness * dispX - damping * node.vx;
  let fy = -stiffness * dispY - damping * node.vy;

  if (pointerActive && interactionRadius > 0) {
    const dx = node.x - pointerX;
    const dy = node.y - pointerY;
    const dist = Math.hypot(dx, dy);
    if (dist < interactionRadius) {
      const falloff = 1 - dist / interactionRadius;
      const safeDist = Math.max(0.001, dist);
      const nx = dx / safeDist;
      const ny = dy / safeDist;
      // Elastic repulsion away from cursor + momentum transfer from cursor velocity
      const pushMag = falloff * falloff * 5400;
      fx += nx * pushMag + pointerVx * falloff * 15;
      fy += ny * pushMag + pointerVy * falloff * 15;
    }
  }

  const nextVx = node.vx + fx * dt;
  const nextVy = node.vy + fy * dt;
  const maxOffset = 48;
  const rawNextX = node.x + nextVx * dt;
  const rawNextY = node.y + nextVy * dt;

  const clampedX = node.originX + clamp(rawNextX - node.originX, -maxOffset, maxOffset);
  const clampedY = node.originY + clamp(rawNextY - node.originY, -maxOffset, maxOffset);

  return {
    ...node,
    x: Number(clampedX.toFixed(3)),
    y: Number(clampedY.toFixed(3)),
    vx: Number(nextVx.toFixed(3)),
    vy: Number(nextVy.toFixed(3)),
  };
}

export interface ChapterEntranceMetrics {
  entranceRatio: number;
  strokeDashoffset: number;
  strokeOpacity: number;
  fillOpacity: number;
  clipInsetTopPercent: number;
  clipInsetSidePercent: number;
  translateY: number;
  scale: number;
}

/**
 * Computes scroll-driven SVG line-drawing blueprint stroke metrics and
 * spatial clip-path reveal values for any chapter entrance.
 */
export function computeChapterEntranceMetrics(
  sectionProgress: number,
  pathLength = 1000,
  entranceWindow = 0.36
): ChapterEntranceMetrics {
  const p = clamp(sectionProgress, 0, 1);
  const safeWindow = Math.max(0.05, entranceWindow);
  const raw = clamp(p / safeWindow, 0, 1);
  // C2 quintic smootherStep easing for organic scroll settle
  const entranceRatio = smootherStep(0, 1, raw);

  const strokeDashoffset = Number(((1 - entranceRatio) * pathLength).toFixed(2));
  const strokeOpacity = Number(clamp(mapRange(raw, 0, 0.2, 0.25, 1), 0.25, 1).toFixed(3));
  const fillOpacity = Number(clamp(mapRange(raw, 0.32, 0.92, 0, 1), 0, 1).toFixed(3));
  const clipInsetTopPercent = Number(mapRange(entranceRatio, 0, 1, 18, 0).toFixed(2));
  const clipInsetSidePercent = Number(mapRange(entranceRatio, 0, 1, 4.5, 0).toFixed(2));
  const translateY = Number(mapRange(entranceRatio, 0, 1, 36, 0).toFixed(2));
  const scale = Number(mapRange(entranceRatio, 0, 1, 0.95, 1).toFixed(4));

  return {
    entranceRatio,
    strokeDashoffset,
    strokeOpacity,
    fillOpacity,
    clipInsetTopPercent,
    clipInsetSidePercent,
    translateY,
    scale,
  };
}

export interface IntroExitPortalMetrics {
  exitRatio: number;
  conduitDashoffset: number;
  frameInsetPercent: number;
  headlineSplitY: number;
  portalScale: number;
  bridgeOpacity: number;
}

/**
 * Computes the scrollytelling exit transition for Chapter 01 (Intro)
 * as it bridges into Chapter 02 (Identity).
 */
export function computeIntroExitPortalMetrics(
  introProgress: number,
  conduitLength = 600
): IntroExitPortalMetrics {
  const p = clamp(introProgress, 0, 1);
  const rawExit = clamp((p - 0.15) / 0.85, 0, 1);
  const exitRatio = smootherStep(0, 1, rawExit);

  const conduitDashoffset = Number(((1 - exitRatio) * conduitLength).toFixed(2));
  const frameInsetPercent = Number(mapRange(exitRatio, 0, 1, 0, 6.5).toFixed(2));
  const headlineSplitY = Number(mapRange(exitRatio, 0, 1, 0, -44).toFixed(2));
  const portalScale = Number(mapRange(exitRatio, 0, 1, 1, 0.94).toFixed(4));
  const bridgeOpacity = Number(clamp(mapRange(p, 0.12, 0.75, 0.15, 1), 0.15, 1).toFixed(3));

  return {
    exitRatio,
    conduitDashoffset,
    frameInsetPercent,
    headlineSplitY,
    portalScale,
    bridgeOpacity,
  };
}

/**
 * Advances a scalar value toward `target` using frame-rate-independent exponential damping
 * while enforcing a strict maximum slew rate (`maxSpeedPerSec`).
 * Ensures normal scrolling feels 1:1 accurate while fast scrolling never rushes or skips animations.
 */
export function stepSlewDampedValue(
  current: number,
  target: number,
  dtSeconds: number,
  dampingLambda = 10,
  maxSpeedPerSec = 0.65
): number {
  const safeDt = clamp(dtSeconds, 0.001, 0.05);
  const diff = target - current;
  if (Math.abs(diff) < 0.0005) {
    return target;
  }

  const alpha = 1 - Math.exp(-Math.max(0.5, dampingLambda) * safeDt);
  const dampedDelta = diff * alpha;
  const maxStep = Math.max(0.01, maxSpeedPerSec) * safeDt;

  if (Math.abs(dampedDelta) > maxStep) {
    return Number((current + Math.sign(diff) * maxStep).toFixed(4));
  }
  return Number((current + dampedDelta).toFixed(4));
}

/**
 * Soft-knee compressor for wheel/trackpad scroll deltas.
 * Preserves 1:1 precision for gentle/normal scrolling while compressing extreme high-velocity
 * wheel spikes so sections and stages cannot be accidentally skipped.
 */
export function compressWheelDelta(
  rawDeltaY: number,
  isNearCheckpoint = false
): number {
  if (!Number.isFinite(rawDeltaY) || rawDeltaY === 0) return 0;
  const sign = Math.sign(rawDeltaY);
  const absY = Math.abs(rawDeltaY);

  // Gentle scroll stays accurate; soft-knee engages above 40px per event
  const knee = 40;
  const maxExtra = isNearCheckpoint ? 34 : 58;
  const scale = isNearCheckpoint ? 95 : 120;

  let shaped = absY;
  if (absY > knee) {
    shaped = knee + Math.tanh((absY - knee) / scale) * maxExtra;
  }

  // Subtle magnetic detent damping when crossing a section or stage checkpoint
  const detentMultiplier = isNearCheckpoint ? 0.72 : 1.0;
  return Number((sign * shaped * detentMultiplier).toFixed(2));
}

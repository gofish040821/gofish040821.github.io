import { ACTIONS, PARTS } from './catalog.js';
import { pose, drawPose, wingPart } from './rig.js';

export { ACTIONS };
const rate = 1.8;
const transitionMs = 180;
const stillURL = new URL('./still.webp', import.meta.url);
const baseParts = ['torso', 'leg-left', 'leg-right', 'foot-left', 'foot-right',
  'wing-left', 'wing-right', 'ball', 'head-base'];

async function decodePart(name, signal) {
  const url = new URL(name + '.webp', import.meta.url);
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error('Mascot component unavailable');
  const blob = await response.blob();
  const box = PARTS[name];
  if (typeof createImageBitmap === 'function') {
    const image = await createImageBitmap(blob, ...box);
    return { image, box };
  }
  const objectURL = URL.createObjectURL(blob);
  try {
    const source = new Image();
    source.src = objectURL;
    await source.decode();
    const image = document.createElement('canvas');
    image.width = box[2];
    image.height = box[3];
    image.getContext('2d').drawImage(source, ...box, 0, 0, box[2], box[3]);
    return { image, box };
  } finally {
    URL.revokeObjectURL(objectURL);
  }
}

// Only moving actors acquire the shared bank. Crop fully transparent margins
// at decode time, retaining the original placement and resolution of each part.
let sharedBank;
function acquireBank() {
  if (!sharedBank) {
    const controller = new AbortController();
    const images = new Map();
    const requested = new Set();
    const failures = new Set();
    sharedBank = {
      users: 0, images, failures,
      request(name) {
        if (requested.has(name)) return;
        requested.add(name);
        decodePart(name, controller.signal).then(part => {
          if (controller.signal.aborted) part.image.close?.();
          else images.set(name, part);
        }).catch(() => failures.add(name));
      },
      release() {
        if (--this.users) return;
        controller.abort();
        for (const part of images.values()) part.image.close?.();
        images.clear();
        sharedBank = undefined;
      }
    };
    baseParts.forEach(name => sharedBank.request(name));
  }
  sharedBank.users++;
  return sharedBank;
}

// Geometry interpolates in joint space. A discrete face/wing changes once,
// so interrupted movements never stack two faces, two balls or two bodies.
function bridgeJoint(target, source, amount) {
  for (const key of Object.keys(target)) {
    if (typeof target[key] === 'number') {
      let delta = target[key] - source[key];
      if (key === 'a') delta = Math.atan2(Math.sin(delta), Math.cos(delta));
      target[key] = source[key] + delta * amount;
    } else if (amount < .5) {
      target[key] = source[key];
    }
  }
}

export function createMascotRenderer(host) {
  const layer = document.createElement('span');
  layer.style.cssText = 'display:block;position:relative;width:100%;height:100%;pointer-events:none';
  layer.setAttribute('aria-hidden', 'true');
  const still = new Image();
  still.src = stillURL.href;
  still.alt = '';
  still.draggable = false;
  const canvas = document.createElement('canvas');
  for (const el of [still, canvas]) {
    el.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:contain;pointer-events:none';
  }
  canvas.hidden = true;
  layer.append(still, canvas);
  host.append(layer);

  let bank, ctx, dead = false;
  let id = 'idle', offsetMs = 0, face;
  let previous = null, drawn = null, bridgeTime = 0;
  let cssWidth = 0, dpr = 0;
  function resize(width) {
    cssWidth = width;
    dpr = window.devicePixelRatio || 1;
    const pixels = Math.max(1, Math.min(768, Math.ceil(width * dpr)));
    if (canvas.width === pixels && canvas.height === pixels) return;
    canvas.width = canvas.height = pixels;
    if (ctx && drawn) drawPose(ctx, bank.images, drawn);
  }
  const observer = new ResizeObserver(entries => resize(entries[0].contentRect.width));
  observer.observe(layer);
  resize(host.clientWidth);

  return {
    play(action, options = {}) {
      if (dead || !Object.hasOwn(ACTIONS, action)) return;
      id = action;
      offsetMs = Math.max(0, options.offsetMs || 0);
      face = Object.hasOwn(PARTS, 'head-' + options.face) ? options.face : undefined;
      previous = drawn;
      bridgeTime = 0;
      if (face && bank) bank.request('head-' + face);
    },
    tick(elapsedMs, dtMs) {
      if (dead) return true;
      bank ??= acquireBank();
      ctx ??= canvas.getContext('2d', { alpha: true });
      if (!ctx) return true;
      if (dpr !== (window.devicePixelRatio || 1)) resize(cssWidth);
      const meta = ACTIONS[id];
      const time = Math.min(meta.sourceDurationMs, (elapsedMs + offsetMs) * rate);
      const p = pose(id, time, meta.sourceDurationMs);
      p.ballBodyWeight = p.floorBall ? 0 : 1;
      if (face) p.head.face = face;
      // Request expressions and open wings just before or when needed. Always
      // draw a complete skeleton, even when a particular expression loads late.
      const needed = ['head-' + p.head.face, wingPart('left', p.left), wingPart('right', p.right)];
      needed.forEach(name => bank.request(name));
      if (baseParts.some(name => bank.failures.has(name)) || needed.some(name => bank.failures.has(name))) {
        canvas.hidden = true;
        still.hidden = false;
        drawn = previous = null;
        return true;
      }
      if ((!drawn && baseParts.some(name => !bank.images.has(name))) ||
          needed.some(name => !bank.images.has(name))) return false;
      if (!drawn) {
        // These two time-sensitive reactions should be decoded before a visitor
        // reveals the key or finishes validating it. Requests coalesce per bank.
        bank.request('head-blink');
        bank.request('head-surprise');
        previous = pose('idle', 0, ACTIONS.idle.sourceDurationMs);
        previous.ballBodyWeight = 1;
        bridgeTime = 0;
      }
      if (previous) {
        bridgeTime += Math.max(0, dtMs);
        const u = Math.min(1, bridgeTime / transitionMs);
        const t = u * u * (3 - 2 * u);
        for (const key of ['root', 'body', 'head', 'left', 'right', 'ball']) {
          bridgeJoint(p[key], previous[key], t);
        }
        p.legs.forEach((leg, i) => bridgeJoint(leg, previous.legs[i], t));
        p.ballBodyWeight = previous.ballBodyWeight + t * (p.ballBodyWeight - previous.ballBodyWeight);
        if (t < .5) p.floorBall = previous.floorBall;
        if (face) p.head.face = face;
        if (u === 1) previous = null;
      }
      drawPose(ctx, bank.images, p);
      drawn = p;
      canvas.hidden = false;
      still.hidden = true;
      return !previous;
    },
    destroy() {
      if (dead) return;
      dead = true;
      observer.disconnect();
      layer.remove();
      canvas.width = canvas.height = 1;
      bank?.release();
      drawn = previous = ctx = bank = null;
    }
  };
}

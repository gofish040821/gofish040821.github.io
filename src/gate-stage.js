const roles = [
  ['explorer', 'Curious Explorer', 94],
  ['player', 'Basketball Player', 137],
  ['performer', 'Little Performer', 76]
];
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
const random = (low, high) => low + Math.random() * (high - low);
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const inside = (p, r) => p.x >= r.left && p.x <= r.right && p.y >= r.top && p.y <= r.bottom;
const edgeGap = 9;
const cardGap = 12;
const neighborGap = 6;

function inflate(rect, padding) {
  return { left: rect.left - padding, right: rect.right + padding,
    top: rect.top - padding, bottom: rect.bottom + padding };
}

function span(a, b) {
  return { left: Math.min(a.x, b.x), right: Math.max(a.x, b.x),
    top: Math.min(a.y, b.y), bottom: Math.max(a.y, b.y) };
}

// Intersect the range of times in which the segment is inside each axis slab.
// Obstacles are expanded by the full moving sprite's half-size, so this tests
// its swept rectangle, including hair, feet and the airborne ball.
function crosses(a, b, rect) {
  let enter = 0, leave = 1;
  for (const [start, end, low, high] of [
    [a.x, b.x, rect.left, rect.right], [a.y, b.y, rect.top, rect.bottom]
  ]) {
    const delta = end - start;
    if (Math.abs(delta) < 0.0001) {
      if (start < low || start > high) return false;
    } else {
      const first = (low - start) / delta, second = (high - start) / delta;
      enter = Math.max(enter, Math.min(first, second));
      leave = Math.min(leave, Math.max(first, second));
      if (enter > leave) return false;
    }
  }
  return true;
}

function routeBetween(start, end, bounds, card, obstacles) {
  const clear = (a, b) => !obstacles.some(rect => crosses(a, b, rect));
  if (!inside(end, bounds) || obstacles.some(rect => inside(end, rect))) return null;
  if (clear(start, end)) return [start, end];
  const corners = [
    { x: card.left - 2, y: card.top - 2 }, { x: card.right + 2, y: card.top - 2 },
    { x: card.right + 2, y: card.bottom + 2 }, { x: card.left - 2, y: card.bottom + 2 }
  ];
  let best = null, shortest = Infinity;
  function consider(points) {
    let length = 0;
    for (let i = 1; i < points.length; i++) {
      if (!inside(points[i], bounds) || !clear(points[i - 1], points[i])) return;
      length += distance(points[i - 1], points[i]);
    }
    if (length < shortest) { shortest = length; best = points; }
  }
  corners.forEach((corner, i) => {
    consider([start, corner, end]);
    consider([start, corner, corners[(i + 1) % 4], end]);
    consider([start, corner, corners[(i + 3) % 4], end]);
  });
  return best;
}

function truncate(points, budget) {
  const path = [], initial = points[0];
  let previous = initial, length = 0;
  for (const next of points.slice(1)) {
    const leg = distance(previous, next);
    if (leg < .01) continue;
    const travel = Math.min(leg, budget - length);
    const t = travel / leg;
    path.push({ from: previous, to: { x: previous.x + (next.x - previous.x) * t,
      y: previous.y + (next.y - previous.y) * t }, start: length, length: travel });
    length += travel;
    if (travel < leg || length >= budget) break;
    previous = next;
  }
  return { path, length };
}

function centerBounds(w, h, size) {
  const inset = size / 2 + edgeGap;
  return { left: inset, right: w - inset, top: inset, bottom: h - inset };
}

// Choose the nearest legal spawn to each role's preferred location. Include
// exact edges of narrow free strips as well as a small grid of fallback points.
function place(ideals, bounds, card, size) {
  if (bounds.right < bounds.left || bounds.bottom < bounds.top) return null;
  const used = [];
  for (const ideal of ideals) {
    const xs = [ideal.x, card.left - 1, card.right + 1];
    const ys = [ideal.y, card.top - 1, card.bottom + 1];
    for (let i = 0; i <= 8; i++) xs.push(bounds.left + (bounds.right - bounds.left) * i / 8);
    for (let i = 0; i <= 8; i++) ys.push(bounds.top + (bounds.bottom - bounds.top) * i / 8);
    let best = null, nearest = Infinity;
    for (const x of xs) for (const y of ys) {
      const point = { x, y };
      if (!inside(point, bounds) || inside(point, card)) continue;
      if (used.some(other => Math.abs(x - other.x) <= size + neighborGap + 1 &&
        Math.abs(y - other.y) <= size + neighborGap + 1)) continue;
      const d = distance(point, ideal);
      if (d < nearest) { nearest = d; best = point; }
    }
    if (!best) return null;
    used.push(best);
  }
  return used;
}

export class MascotStage {
  constructor(gate, root = gate.querySelector('#gate-stage'), card = gate.querySelector('.gate-card')) {
    this.gate = gate;
    this.root = root;
    this.card = card;
    this.count = 0;
    this.layoutFrame = 0;
    this.reduced = matchMedia('(prefers-reduced-motion: reduce)');
    this.abort = new AbortController();
    const options = { signal: this.abort.signal, passive: true };
    this.slots = roles.map(([id, label, speed]) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'gate-mascot';
      button.dataset.mascot = id;
      button.setAttribute('aria-label', label);
      button.hidden = true;
      const turn = document.createElement('span');
      turn.className = 'gate-mascot-turn';
      turn.setAttribute('aria-hidden', 'true');
      const art = document.createElement('span');
      art.className = 'gate-mascot-art';
      turn.append(art); button.append(turn); root.append(button);
      return { id, speed, button, art, x: 0, y: 0, size: 0, visible: false,
        route: null, lift: null, liftY: 0, settle: null, destination: null };
    });
    this.scheduleLayout = () => {
      if (this.layoutFrame) return;
      this.layoutFrame = requestAnimationFrame(() => { this.layoutFrame = 0; this.layout(); });
    };
    window.addEventListener('resize', this.scheduleLayout, options);
    window.visualViewport?.addEventListener('resize', this.scheduleLayout, options);
    window.visualViewport?.addEventListener('scroll', this.scheduleLayout, options);
    this.reduced.addEventListener('change', this.scheduleLayout, options);
    if ('ResizeObserver' in window) {
      this.resizeObserver = new ResizeObserver(this.scheduleLayout);
      this.resizeObserver.observe(card);
      this.resizeObserver.observe(root);
    }
    gate.classList.add('gate-mascot-stage-active');
    this.layout();
  }

  layout() {
    const view = window.visualViewport;
    const styles = this.gate.style;
    styles.setProperty('--gate-view-width', (view?.width ?? document.documentElement.clientWidth) + 'px');
    styles.setProperty('--gate-view-height', (view?.height ?? innerHeight) + 'px');
    styles.setProperty('--gate-view-top', (view?.offsetTop ?? 0) + 'px');
    styles.setProperty('--gate-view-left', (view?.offsetLeft ?? 0) + 'px');
    const frame = this.root.getBoundingClientRect(), box = this.card.getBoundingClientRect();
    const w = frame.width, h = frame.height;
    const card = { left: box.left - frame.left, right: box.right - frame.left,
      top: box.top - frame.top, bottom: box.bottom - frame.top };
    const signature = [frame.left, frame.top, w, h, ...Object.values(card), this.reduced.matches].join(',');
    if (this.signature === signature) return;
    this.signature = signature;
    this.frame = frame;
    // A small pair can take turns welcoming visitors on phones; the placement
    // search below falls back to one (or none) when the keyboard leaves no room.
    const wanted = this.reduced.matches ? 1 : w < 1024 ? 2 : 3;
    let preferred = wanted === 3 ? Math.min(268, w * .205, h * .34) :
      wanted === 2 && w < 620 ? Math.min(136, w * .34, h * .24) :
      wanted === 2 ? Math.min(208, w * .24, h * .32) : Math.min(158, w * .42, h * .30);
    // On a short laptop screen, keep a traversable band around the card so
    // actors can cross between wings. Do not miniaturize them on squat screens.
    const crossingRoom = Math.max(card.top, h - card.bottom) - edgeGap - cardGap - 12;
    if (wanted === 3 && crossingRoom >= 120) preferred = Math.min(preferred, crossingRoom);
    const anchors = [
      wanted === 1 ? { x:w * .44, y:card.top * .52 } : { x:card.left * .52, y:h * .42 },
      { x:card.right + (w - card.right) * .48, y:h * .59 },
      { x:w * .47, y:card.bottom + (h - card.bottom) * .55 }
    ];
    const ideals = this.slots.map((s, i) => s.visible && this.previousCount === wanted
      ? { x:s.x * w / this.width, y:s.y * h / this.height } : anchors[i]);
    let positions = [], size = preferred;
    // If the keyboard leaves no safe slot even at the minimum legible size,
    // the form uses the viewport alone until space returns.
    for (let n = wanted; n && !positions.length; n--) {
      for (let trial = Math.floor(preferred); trial >= 62; trial -= 8) {
        const bounds = centerBounds(w, h, trial);
        const safe = inflate(card, trial / 2 + cardGap);
        const fit = place(ideals.slice(0, n), bounds, safe, trial);
        if (fit) { positions = fit; size = trial; this.bounds = bounds; this.safe = safe; break; }
      }
    }
    this.width = w; this.height = h; this.previousCount = wanted;
    this.count = positions.length;
    const residual = this.slots.map(s => s.route ? s.route.duration - s.route.elapsed : 0);
    this.slots.forEach((s, i) => {
      const wasVisible = s.visible;
      this.stop(i);
      s.destination = null;
      s.visible = i < this.count;
      s.button.hidden = !s.visible;
      if (!s.visible) return;
      s.settle = null; s.liftY = 0;
      s.x = positions[i].x; s.y = positions[i].y; s.size = size;
      s.button.style.setProperty('--mascot-size', size + 'px');
      if (!wasVisible) this.face(i, box.left + box.width / 2);
      this.paint(s);
    });
    residual.forEach((ms, i) => { if (ms > 250 && this.slots[i].visible) this.walk(i, ms); });
    this.onLayout?.();
  }

  reservations(index) {
    const obstacles = [this.safe];
    this.slots.forEach((s, i) => {
      if (index === i || !s.visible) return;
      const padding = (this.slots[index].size + s.size) / 2 + neighborGap;
      let previous = { x:s.x, y:s.y };
      obstacles.push(inflate(span(previous, { x:s.x, y:s.y - Math.max(s.lift?.height || 0, s.liftY) }), padding));
      if (!s.route) return;
      for (const leg of s.route.path.slice(s.route.index)) {
        obstacles.push(inflate(span(previous, leg.to), padding));
        previous = leg.to;
      }
    });
    return obstacles;
  }

  walk(index, duration, speedFactor = 1) {
    const s = this.slots[index];
    if (!s?.visible || this.reduced.matches || duration <= 0) return false;
    this.stop(index);
    if (s.settle) return false;
    const start = { x:s.x, y:s.y }, bounds = this.bounds;
    const obstacles = this.reservations(index);
    const budget = s.speed * speedFactor * (this.count === 1 ? .9 : 1) * duration / 1000;
    for (let attempt = 0; attempt < 22; attempt++) {
      let end;
      if (!attempt && s.destination && distance(start, s.destination) > 20) end = s.destination;
      else if (attempt < 8) end = { x:random(bounds.left, bounds.right), y:random(bounds.top, bounds.bottom) };
      else {
        const angle = random(-Math.PI, Math.PI);
        end = { x:clamp(s.x + Math.cos(angle) * budget, bounds.left, bounds.right),
          y:clamp(s.y + Math.sin(angle) * budget, bounds.top, bounds.bottom) };
      }
      const points = routeBetween(start, end, bounds, this.safe, obstacles);
      if (!points) continue;
      const route = truncate(points, budget);
      // Prefer a visible journey over tiny back-and-forth steps. In a crowded
      // or keyboard-constrained stage, accept a shorter safe path as fallback.
      if (route.length < Math.min(attempt < 14 ? s.size * .35 : 18, budget * .6)) continue;
      s.destination = end;
      s.route = { ...route, index: 0, elapsed: 0, duration };
      this.face(index, this.frame.left + s.route.path[0].to.x);
      return true;
    }
    s.destination = null;
    return false;
  }

  jump(index, duration) {
    const s = this.slots[index];
    if (!s?.visible || this.reduced.matches || duration <= 0) return false;
    this.stop(index);
    if (s.settle) return false;
    const height = Math.min(random(s.size * .055, s.size * .11), s.y - this.bounds.top);
    if (height < 2) return false;
    const top = { x:s.x, y:s.y - height };
    if (this.reservations(index).some(r => crosses(s, top, r))) return false;
    s.lift = { elapsed:0, duration, height };
    return true;
  }

  stop(index) {
    const s = this.slots[index];
    if (!s) return;
    s.route = null; s.lift = null;
    // Keep the first interrupted frame continuous, then land on the original
    // baseline. Repeated reactions cannot leave the actor floating higher.
    if (s.liftY && !s.settle) s.settle = { from:s.liftY, elapsed:0, duration:180 };
  }

  face(index, clientX) {
    const s = this.slots[index];
    if (!s?.visible) return;
    const dx = clientX - this.frame.left - s.x;
    if (Math.abs(dx) > s.size * .08) s.button.dataset.facing = dx < 0 ? 'left' : 'right';
  }

  nearest(element) {
    const box = element.getBoundingClientRect();
    const center = { x:box.left + box.width / 2 - this.frame.left, y:box.top + box.height / 2 - this.frame.top };
    let best = -1, nearest = Infinity;
    this.slots.forEach((s, i) => {
      if (!s.visible) return;
      const d = distance(s, center);
      if (d < nearest) { nearest = d; best = i; }
    });
    return best;
  }

  paint(s) {
    const x = s.x - s.size / 2, y = s.y - s.size / 2 - s.liftY;
    s.button.style.transform = 'translate(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px)';
  }

  tick(dt) {
    this.slots.forEach((s, index) => {
      if (!s.visible || (!s.route && !s.lift && !s.settle)) return;
      if (s.route) {
        const r = s.route;
        r.elapsed = Math.min(r.duration, r.elapsed + dt);
        const t = r.elapsed / r.duration;
        const travelled = r.length * t;
        let leg = r.path[r.index];
        while (r.index < r.path.length - 1 && travelled > leg.start + leg.length) {
          leg = r.path[++r.index];
          this.face(index, this.frame.left + leg.to.x);
        }
        const phase = clamp((travelled - leg.start) / leg.length, 0, 1);
        const progress = phase * phase * (3 - 2 * phase);
        s.x = leg.from.x + (leg.to.x - leg.from.x) * progress;
        s.y = leg.from.y + (leg.to.y - leg.from.y) * progress;
        if (t === 1) s.route = null;
      }
      if (s.lift) {
        s.lift.elapsed = Math.min(s.lift.duration, s.lift.elapsed + dt);
        const t = s.lift.elapsed / s.lift.duration;
        const airborne = clamp((t - .18) / .66, 0, 1);
        s.liftY = s.lift.height * Math.sin(airborne * Math.PI) ** 2;
        if (t === 1) { s.lift = null; s.liftY = 0; }
      }
      if (s.settle) {
        s.settle.elapsed = Math.min(s.settle.duration, s.settle.elapsed + dt);
        const t = s.settle.elapsed / s.settle.duration;
        s.liftY = s.settle.from * (1 - t * t * (3 - 2 * t));
        if (t === 1) { s.settle = null; s.liftY = 0; }
      }
      this.paint(s);
    });
  }

  destroy() {
    this.abort.abort();
    this.resizeObserver?.disconnect();
    cancelAnimationFrame(this.layoutFrame);
    this.slots.forEach((s, i) => { this.stop(i); s.button.remove(); });
    this.slots.length = this.count = 0;
    this.onLayout = null;
    this.gate.classList.remove('gate-mascot-stage-active');
    for (const key of ['width','height','top','left']) this.gate.style.removeProperty('--gate-view-' + key);
  }
}

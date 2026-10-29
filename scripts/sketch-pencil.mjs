// Small, authored drawings with solid ink and flat colour. A fixed seed keeps
// gentle width changes and tapered ends consistent without tonal shading.
const f = n => Number(n.toFixed(2));
const pts = points => typeof points === 'string'
  ? points.trim().split(/\s+/).map(pair => pair.split(',').map(Number)) : points;
const path = points => `M${points.map(p => p.map(f).join(' ')).join('L')}`;
function seedFor(points) {
  let seed = 2166136261;
  for (const p of points) for (const n of p) seed = Math.imul(seed ^ Math.round(n * 100), 16777619);
  return () => { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return (seed >>> 0) / 4294967296; };
}
function samples(points) {
  const result = [];
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[Math.max(0, i - 1)], b = points[i], c = points[i + 1], d = points[Math.min(points.length - 1, i + 2)];
    const steps = Math.max(2, Math.ceil(Math.hypot(c[0] - b[0], c[1] - b[1]) / 1.8));
    for (let j = 0; j < steps; j++) {
      const t = j / steps, t2 = t * t, t3 = t2 * t;
      // A little corner is left in the gesture instead of fitting a perfect curve.
      result.push([0, 1].map(k => .72 * .5 * (2*b[k] + (-a[k]+c[k])*t + (2*a[k]-5*b[k]+4*c[k]-d[k])*t2 + (-a[k]+3*b[k]-3*c[k]+d[k])*t3) + .28*(b[k]+(c[k]-b[k])*t)));
    }
  }
  result.push(points.at(-1));
  return result;
}
function mark(points, weight, tone) {
  points = pts(points);
  const random = seedFor(points), center = samples(points), left = [], right = [];
  const pressures = Array.from({length: 7}, () => .82 + random() * .36);
  for (let i = 0; i < center.length; i++) {
    const a = center[Math.max(0,i-1)], b = center[Math.min(center.length-1,i+1)], p = center[i];
    const length = Math.hypot(b[0]-a[0],b[1]-a[1]) || 1;
    const nx = -(b[1]-a[1])/length, ny = (b[0]-a[0])/length;
    const t = i/(center.length-1), position = t*5, knot = Math.floor(position);
    const pressure = pressures[knot] + (pressures[knot+1]-pressures[knot])*(position-knot);
    const taper = .2 + .8*Math.min(1,t*12,(1-t)*8);
    const radius = weight*pressure*taper/2;
    const edge = (random()-.5)*Math.min(.45,weight*.18);
    left.push([p[0]+nx*(radius+edge),p[1]+ny*(radius+edge)]);
    right.push([p[0]-nx*(radius-edge),p[1]-ny*(radius-edge)]);
  }
  // One opaque ribbon per gesture: crossings cannot accumulate darker ink,
  // and there are no separately shaded segments or seams along the stroke.
  const outline = [...left, ...right.reverse()];
  return `<path class="${tone}" fill="currentColor" stroke="none" d="${path(outline)}Z"/>`;
}
export const pencil = (points, weight = 3.1) => mark(points,weight,'illustration-ink');
export const crayon = (points, weight = 6) => mark(points,weight,'illustration-accent');
export const paper = points => `<path class="illustration-paper" d="${path(pts(points))}Z"/>`;
export const part = (name, drawing) => `<g data-scene-part="${name}">${Array.isArray(drawing) ? drawing.join('') : drawing}</g>`;

// Animated gestures retain a real centerline for their stroke-reveal motion.
// Authored changes of direction keep the revealed line informal, too.
export function drawnLine(points, weight = 2.4) {
  const coordinates = samples(pts(points));
  return `<path d="${path(coordinates)}" fill="none" stroke="currentColor" stroke-width="${weight}" stroke-linecap="round" stroke-linejoin="round"/>`;
}

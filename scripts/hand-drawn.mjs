// Pressure-shaped SVG ink. Every stroke is a filled ribbon, not a uniform outline.
// Coordinates are deliberately drawn by hand; no filters or random runtime noise.
const fmt = n => Number(n.toFixed(2));
let strokeNumber = 0;
export function pen(points, weight = 3.1, opacity = 1) {
  const phase = ++strokeNumber * 1.73;
  const samples = [];
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[Math.max(0, i - 1)], b = points[i];
    const c = points[i + 1], d = points[Math.min(points.length - 1, i + 2)];
    const steps = Math.max(3, Math.ceil(Math.hypot(c[0] - b[0], c[1] - b[1]) / 3.2));
    for (let j = 0; j < steps; j++) {
      const t = j / steps, t2 = t * t, t3 = t2 * t;
      samples.push([0, 1].map(k => .5 * ((2 * b[k]) + (-a[k] + c[k]) * t + (2 * a[k] - 5 * b[k] + 4 * c[k] - d[k]) * t2 + (-a[k] + 3 * b[k] - 3 * c[k] + d[k]) * t3)));
    }
  }
  samples.push(points[points.length - 1]);
  let distance = 0;
  const distances = samples.map((p, i) => {
    if (i) distance += Math.hypot(p[0] - samples[i - 1][0], p[1] - samples[i - 1][1]);
    return distance;
  });
  const left = [], right = [];
  for (let i = 0; i < samples.length; i++) {
    const p = samples[i], a = samples[Math.max(0, i - 1)], b = samples[Math.min(samples.length - 1, i + 1)];
    const length = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const normal = [-(b[1] - a[1]) / length, (b[0] - a[0]) / length];
    const t = distances[i] / (distance || 1);
    const pressure = (.84 + .2 * Math.sin(t * 8.8 + phase) + .12 * Math.sin(t * 19 + phase * .7));
    const taper = .22 + .78 * Math.min(1, t * 11, (1 - t) * 9);
    const radius = weight * pressure * taper / 2;
    const drift = weight * .045 * Math.sin(distances[i] * 1.4 + phase);
    left.push([fmt(p[0] + normal[0] * (radius + drift)), fmt(p[1] + normal[1] * (radius + drift))]);
    right.push([fmt(p[0] - normal[0] * (radius - drift)), fmt(p[1] - normal[1] * (radius - drift))]);
  }
  const outline = [...left, ...right.reverse()];
  return `<path class="illustration-ink" fill="currentColor" stroke="none"${opacity < 1 ? ` opacity="${opacity}"` : ''} d="M${outline.map(p => p.join(' ')).join('L')}Z"/>`;
}
export function wash(d, accent = false) {
  return `<path class="${accent ? 'illustration-accent' : 'illustration-paper'}" stroke="none" d="${d}"/>`;
}
export function dot(x, y, radius = 4, accent = false) {
  return `<path class="${accent ? 'illustration-accent' : 'illustration-ink'}" fill="${accent ? 'var(--illustration-accent)' : 'currentColor'}" stroke="none" d="M${x - radius} ${y}c-.4 ${-radius * .7} ${radius * .4} ${-radius * 1.1} ${radius} ${-radius}c${radius * 1.4} -.4 ${radius * 1.5} ${radius * 2.2} -.3 ${radius * 2}c${-radius} .2 ${-radius * 1.1} ${-radius * .3} ${-radius * .7} ${-radius}Z"/>`;
}

import { pen as p } from './hand-drawn.mjs';
const drawings = {
  external: p([[5,19],[11,12],[19,5]],1.8) + p([[10,5],[19,5],[19,14]],1.7),
  down: p([[12,3],[12.3,12],[12,21]],1.7) + p([[5,14],[12,21],[19,14]],1.8),
  up: p([[12,21],[11.7,12],[12,3]],1.7) + p([[5,10],[12,3],[19,10]],1.8),
  left: p([[21,12],[12,11.7],[3,12]],1.7) + p([[10,5],[3,12],[10,19]],1.8),
  right: p([[3,12],[12,12.3],[21,12]],1.7) + p([[14,5],[21,12],[14,19]],1.8),
  chevron: p([[5,9],[12,15],[19,8]],1.9),
  plus: p([[4,12],[12,11.8],[20,12]],1.7) + p([[12,4],[11.8,12],[12,20]],1.6),
  minus: p([[4,12],[12,11.8],[20,12]],1.7),
  close: p([[5,5],[12,11.7],[19,19]],1.7) + p([[19,5],[12.3,12],[5,19]],1.8),
  menu: p([[3,7],[12,6.7],[21,7]],1.6) + p([[3,17],[12,17.3],[21,17]],1.8),
  moon: p([[15,3],[9,4],[4,9],[4,15],[8,20],[15,21],[20,16],[15,17],[10,14],[10,8],[15,3]],1.6),
  sun: p([[17,8],[12,6],[7,9],[6,13],[9,17],[14,18],[18,14],[18,10],[17,8]],1.7) + p([[12,3],[12,1]],1.5) + p([[12,21],[12,23]],1.5) + p([[3,12],[1,12]],1.5) + p([[21,12],[23,12]],1.5) + p([[5,5],[3,3]],1.4) + p([[19,19],[21,21]],1.5) + p([[19,5],[21,3]],1.4) + p([[5,19],[3,21]],1.4)
};
export function uiIcon(name) {
  if (!drawings[name]) throw new Error(`Unknown UI sketch: ${name}`);
  return `<svg class="ui-icon" data-ui-icon="${name}" viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true" focusable="false"><use href="#ui-sketch-${name}"/></svg>`;
}
export function uiIllustrationSprite() {
  return `<svg class="illustration-library" width="0" height="0" aria-hidden="true" focusable="false"><defs>${Object.entries(drawings).map(([name, drawing]) => `<symbol id="ui-sketch-${name}" viewBox="0 0 24 24">${drawing}</symbol>`).join('')}</defs></svg>`;
}

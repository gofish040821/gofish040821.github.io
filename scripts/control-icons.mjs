// Compact functional symbols. Decorative sketches remain in illustrations.mjs.
const icons = {
  external: '<path d="M7 17 17 7M7 7h10v10"/>',
  down: '<path d="M12 5v14m-6-6 6 6 6-6"/>',
  chevron: '<path d="m7 10 5 5 5-5"/>',
  moon: '<path d="M20 14.1A8.3 8.3 0 0 1 9.9 4a8.3 8.3 0 1 0 10.1 10.1Z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  menu: '<path d="M5 8h14M5 16h14"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/>'
};
export function controlIcon(name) {
  if (!icons[name]) throw new Error(`Unknown control icon: ${name}`);
  return `<svg class="ui-icon control-icon" data-ui-icon="${name}" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${icons[name]}</svg>`;
}

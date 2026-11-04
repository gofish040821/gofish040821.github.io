// Keep the accessible alert in the form; this visual copy follows its speaker.
export function createMascotDialogue({ gate, card, error, stage }) {
  const bubble = document.createElement('div');
  bubble.className = 'gate-mascot-dialogue';
  bubble.setAttribute('aria-hidden', 'true');
  bubble.hidden = true;
  stage.append(bubble);

  let frame = 0;
  let speaker = 0;
  let active = false;
  const listeners = new AbortController();
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const actorsChanged = new MutationObserver(records => {
    if (records.some(record => record.type === 'attributes'
      ? record.target.matches('.gate-mascot')
      : [...record.addedNodes, ...record.removedNodes].some(node => node.nodeType === 1 && node.matches('.gate-mascot')))) wake();
  });

  function wake() {
    if (active && !frame && !document.hidden) frame = requestAnimationFrame(place);
  }
  document.addEventListener('visibilitychange', wake, { signal: listeners.signal });
  window.addEventListener('resize', wake, { signal: listeners.signal, passive: true });
  window.visualViewport?.addEventListener('resize', wake, { signal: listeners.signal, passive: true });
  window.visualViewport?.addEventListener('scroll', wake, { signal: listeners.signal, passive: true });
  reduced.addEventListener('change', wake, { signal: listeners.signal });

  const intersection = (a, b) => Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) *
    Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));

  function place() {
    frame = 0;
    if (!active || !gate.isConnected || document.hidden) return;
    const actors = [...stage.querySelectorAll('.gate-mascot:not([hidden])')];
    const actor = actors[speaker % actors.length];
    if (!actor) {
      bubble.style.visibility = 'hidden';
      delete bubble.dataset.speaker;
      error.classList.remove('gate-error--spoken');
      return;
    }

    const bounds = stage.getBoundingClientRect();
    const target = actor.getBoundingClientRect();
    const form = card.getBoundingClientRect();
    const { width, height } = bubble.getBoundingClientRect();
    const pad = 8, gap = 5;
    const clamp = (v, min, max) => Math.max(min, Math.min(v, max));
    const options = [
      { side: 'bottom', x: target.left + (target.width - width) / 2, y: target.top - height - gap },
      { side: 'top', x: target.left + (target.width - width) / 2, y: target.bottom + gap },
      { side: 'right', x: target.left - width - gap, y: target.top + (target.height - height) / 2 },
      { side: 'left', x: target.right + gap, y: target.top + (target.height - height) / 2 },
    ];
    let best = null, score = Infinity;
    if (width + 2 * pad <= bounds.width && height + 2 * pad <= bounds.height) {
      for (const option of options) {
        const x = clamp(option.x, bounds.left + pad, bounds.right - pad - width);
        const y = clamp(option.y, bounds.top + pad, bounds.bottom - pad - height);
        const rect = { left: x, right: x + width, top: y, bottom: y + height };
        if (intersection(rect, form) || intersection(rect, target)) continue;
        const displacement = Math.hypot(x - option.x, y - option.y);
        const collisions = actors.filter(other => other !== actor)
          .reduce((sum, other) => sum + intersection(rect, other.getBoundingClientRect()), 0);
        const candidateScore = displacement + collisions * .02;
        if (candidateScore < score) { best = { x, y, side: option.side }; score = candidateScore; }
      }
    }
    if (best) {
      bubble.dataset.side = best.side;
      bubble.style.left = (best.x - bounds.left) + 'px';
      bubble.style.top = (best.y - bounds.top) + 'px';
      bubble.style.visibility = 'visible';
      bubble.dataset.speaker = actor.dataset.mascot || '';
      error.classList.add('gate-error--spoken');
    } else {
      bubble.style.visibility = 'hidden';
      delete bubble.dataset.speaker;
      error.classList.remove('gate-error--spoken');
    }
    if (!reduced.matches) wake();
  }

  function hide() {
    active = false;
    cancelAnimationFrame(frame);
    frame = 0;
    bubble.hidden = true;
    delete bubble.dataset.speaker;
    actorsChanged.disconnect();
    error.classList.remove('gate-error--spoken');
  }

  return {
    show(attempt, message) {
      if (!message || !gate.isConnected) return;
      speaker = Math.max(0, Number(attempt) - 1);
      bubble.textContent = message;
      bubble.hidden = false;
      bubble.style.visibility = 'hidden';
      active = true;
      actorsChanged.observe(stage, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden'] });
      wake();
    },
    hide,
    destroy() { hide(); listeners.abort(); bubble.remove(); },
  };
}

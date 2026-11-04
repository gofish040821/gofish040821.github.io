import { ACTIONS, createMascotRenderer } from './mascot-art/renderer.js';
import { MascotStage } from './gate-stage.js';

// Choose whole little stories. Pauses between gestures, and rests between
// stories, are separate from the original animation's playback speed.
const CAST = [
  {
    speed: 1.5, wait: [500, 1650], click: ['wave', 'laugh', 'highfive'],
    stories: [
      [5, ['walk', 'peek', 'think', 'nod']],
      [4, ['walk', 'wave', 'bow']],
      [3, ['walk', 'peek', 'surprise', 'jump', 'laugh']],
      [3, ['walk', 'point', 'nod']],
      [2, ['walk', 'think', 'shake', 'blink']],
      [2, ['stretch', 'walk', 'peek']],
    ],
  },
  {
    speed: 1.75, wait: [600, 1900], click: ['highfive', 'jump', 'laugh', 'dance'],
    stories: [
      [5, ['walk', 'dribble', 'toss', 'bow']], // toss includes the catch
      [4, ['walk', 'dribble', 'jump']],
      [3, ['walk', 'highfive', 'laugh', 'dance']],
      [3, ['jog', 'stretch', 'dribble']],
      [3, ['jog', 'toss', 'jump', 'cheer']],
    ],
  },
  {
    speed: 1.2, wait: [900, 2600], click: ['groom', 'shy', 'wave', 'dance'],
    stories: [
      [5, ['walk', 'groom', 'blink', 'shy']],
      [4, ['walk', 'dance', 'laugh', 'bow']],
      [2, ['walk', 'yawn', 'sleep', 'stretch', 'groom']],
      [3, ['walk', 'wave', 'peek']],
      [2, ['walk', 'blink', 'groom', 'highfive']],
    ],
  },
];

const PRIORITY = { rest: 0, story: 1, peer: 2, nearby: 2, focus: 3, typing: 3, click: 3, enter: 4, error: 5, privacy: 6 };
// The jointed artwork already plays at 1.8×. A modest additional increase is
// applied only to ordinary gestures, not precisely timed reactions or finales.
const GESTURE_PACE = 1.12;
const PROTECTED = new Set(['jump', 'toss', 'dribble', 'highfive', 'bow']);
const SURPRISE_MS = 400;
const PHRASE_MS = 1000;
const CELEBRATION_MS = SURPRISE_MS + 3 * PHRASE_MS;
// Offsets and spans are wall-clock milliseconds in the v9 performance.
// The middle player finishes one complete throw/catch, then holds the ball.
const FINALE = [
  [['wave', 350, 1000], ['cheer', 380, 1000], ['bow', 0, 1000]],
  [['jump', 333, 889], ['toss', 889, 889], ['laugh', 400, 1000]],
  [['dance', 360, 1000], ['highfive', 390, 1000], ['laugh', 340, 1000]],
];
const random = (min, max) => min + Math.random() * (max - min);

function weighted(items, score) {
  const weights = items.map(score);
  let roll = Math.random() * weights.reduce((sum, weight) => sum + weight, 0);
  for (let i = 0; i < items.length; i++) {
    roll -= weights[i];
    if (roll < 0) return items[i];
  }
  return items[items.length - 1];
}

export class MascotBehaviorController {
  constructor({ gate, card, input, enter, root }) {
    this.card = card;
    this.input = input;
    this.enter = enter;
    this.stage = new MascotStage(gate, root, card);
    this.motion = matchMedia('(prefers-reduced-motion: reduce)');
    this.events = new AbortController();
    this.clock = 0;
    this.lastFrame = null;
    this.frame = 0;
    this.active = -1;
    this.lastFocus = -Infinity;
    this.lastTyping = -Infinity;
    this.lastEnter = -Infinity;
    this.lastContact = 0;
    this.quietUntil = 0;
    this.peerAfter = 7000;
    this.errorCount = 0;
    this.revealed = false;
    this.finale = null;
    this.disposed = false;
    this.greeted = false;
    this.actors = this.stage.slots.map((slot, index) => ({
      index, slot, renderer: createMascotRenderer(slot.art), history: [],
      source: 'rest', mood: 'at ease', priority: 0, interruptible: true,
      queue: [], action: 'idle', start: 0, next: 0, span: 0, painted: -1,
      visible: false, nearbyAfter: 0, finaleBeat: -1,
    }));

    const listen = (el, type, fn, options = {}) =>
      el.addEventListener(type, fn, { ...options, signal: this.events.signal });
    listen(input, 'focus', () => this.attend());
    listen(input, 'pointerdown', () => this.attend()); // Includes an already autofocused field.
    listen(input, 'input', () => this.typing()); // No value, caret, or character data is read.
    listen(enter, 'pointerenter', () => this.expect());
    listen(enter, 'focus', () => this.expect());
    listen(gate, 'pointermove', event => this.nearby(event), { passive: true });
    for (const actor of this.actors) {
      this.describe(actor);
      listen(actor.slot.button, 'click', event => this.tapped(actor, event));
    }
    listen(this.motion, 'change', () => {
      this.stopClock();
      for (const actor of this.actors) {
        this.stage.stop(actor.index);
        actor.renderer.destroy();
        actor.renderer = createMascotRenderer(actor.slot.art);
        actor.visible = false;
        actor.finaleBeat = -1;
        actor.action = 'idle';
        actor.mood = 'at ease';
        actor.source = 'rest';
        this.describe(actor);
      }
      if (this.motion.matches && this.finale) this.finishCelebration();
      this.wake();
    });
    listen(document, 'visibilitychange', () => {
      if (document.hidden) {
        this.stopClock();
        if (this.finale) this.finishCelebration();
      } else this.wake();
    });
    this.stage.onLayout = () => this.wake();
    this.animate = time => this.step(time);
    this.wake();
  }

  wake() {
    if (this.frame || this.disposed || document.hidden || this.motion.matches || this.finale?.done) return;
    this.frame = requestAnimationFrame(this.animate);
  }

  stopClock() {
    cancelAnimationFrame(this.frame);
    this.frame = 0;
    this.lastFrame = null;
  }

  step(time) {
    this.frame = 0;
    if (this.disposed || document.hidden || this.motion.matches) return;
    const dt = this.lastFrame === null ? 0 : Math.min(100, Math.max(0, time - this.lastFrame));
    this.lastFrame = time;
    this.clock += dt;
    const count = this.stage.count;
    this.stage.tick(dt);
    for (const actor of this.actors) {
      if (actor.index >= count) {
        actor.visible = false;
        continue;
      }
      if (this.finale) {
        this.paintCelebration(actor, time - this.finale.start, dt);
        continue;
      }
      if (!actor.visible) {
        actor.visible = true;
        if (this.revealed) this.coverEyes(actor);
        else if (actor.index === 0 && !this.greeted && actor.source === 'rest') {
          this.greeted = true;
          this.toward(actor, this.input);
          this.run(actor, 'story', 'welcoming', ['wave', 'walk', 'point', 'nod']);
        } else if (actor.source === 'rest') this.rest(actor, 250 + actor.index * 590 + random(60, 360));
      }
      if (this.clock >= actor.next) this.advance(actor);
      const elapsed = Math.min(actor.span, Math.max(0, this.clock - actor.start));
      if (elapsed !== actor.painted) {
        if (actor.renderer.tick(elapsed * actor.playbackRate, dt) !== false) actor.painted = elapsed;
      }
    }
    const eyesCovered = this.revealed && !this.finale && this.actors.slice(0, count)
      .every(actor => actor.source === 'privacy' && actor.painted === actor.span);
    if (count && !eyesCovered) this.wake();
    else this.stopClock(); // Layout or new intent wakes a resting stage.
  }

  freshWeight(actor, id) {
    const index = actor.history.indexOf(id);
    let weight = index < 0 ? 1 : [.15, .3, .45][index];
    if (this.actors.some(other => other !== actor && other.visible && other.action === id)) weight *= .3;
    return weight;
  }

  choose(actor, ids) {
    return weighted(ids, id => this.freshWeight(actor, id));
  }

  story(actor) {
    const choice = weighted(CAST[actor.index].stories, ([base, ids]) => {
      let weight = base * this.freshWeight(actor, ids[0]);
      for (const id of ids.slice(1)) if (actor.history.includes(id)) weight *= .7;
      if (ids.includes('sleep')) weight *= this.clock - this.lastContact > 24000 ? 2.8 : .25;
      return weight;
    });
    this.run(actor, 'story', ['curious', 'playful', 'content'][actor.index], choice[1]);
  }

  run(actor, source, mood, steps) {
    actor.source = source;
    actor.mood = mood;
    actor.priority = PRIORITY[source];
    actor.queue = steps.slice(1);
    this.play(actor, steps[0]);
    this.wake();
  }

  play(actor, beat) {
    const item = typeof beat === 'string' ? { id: beat } : beat;
    let id = item.id;
    const playbackRate = item.span === undefined && id !== 'idle' ? GESTURE_PACE : 1;
    const duration = item.span ?? ACTIONS[id].durationMs / playbackRate;
    this.stage.stop(actor.index);
    if (id === 'walk' || id === 'jog') {
      const speed = CAST[actor.index].speed * (id === 'jog' ? 1.2 : 1);
      if (!this.stage.walk(actor.index, duration, speed)) id = 'peek';
    }
    if (id === 'jump') this.stage.jump(actor.index, duration);
    actor.visible = actor.slot.visible;
    actor.action = id;
    actor.start = this.clock;
    actor.playbackRate = playbackRate;
    actor.span = id === item.id ? duration : ACTIONS[id].durationMs / playbackRate;
    actor.next = this.clock + actor.span + (item.hold ?? random(100, 320));
    actor.painted = -1;
    actor.interruptible = !PROTECTED.has(id);
    if (id !== 'idle') {
      actor.history = [id, ...actor.history.filter(previous => previous !== id)].slice(0, 3);
    }
    actor.renderer.play(id, { offsetMs: item.offset ?? 0, face: item.face });
    this.describe(actor);
    if (actor.source === 'story' && ['wave', 'toss', 'highfive'].includes(id)) this.glanceFromPeer(actor);
  }

  describe(actor) {
    const data = actor.slot.button.dataset;
    data.action = actor.action;
    data.mood = actor.mood;
    data.behavior = actor.source;
  }

  rest(actor, duration = random(...CAST[actor.index].wait)) {
    this.run(actor, 'rest', 'at ease', [{ id: 'idle', span: Math.min(duration, 1500), hold: Math.max(0, duration - 1500) }]);
  }

  advance(actor) {
    if (this.revealed && actor.source !== 'privacy' && !actor.queue.length) {
      this.coverEyes(actor);
    } else if (actor.index !== this.active && this.clock < this.quietUntil && actor.priority <= PRIORITY.story) {
      this.rest(actor, this.quietUntil - this.clock + random(200, 900));
    } else if (actor.queue.length) {
      this.play(actor, actor.queue.shift());
    } else if (actor.source === 'rest') {
      this.story(actor);
    } else {
      this.rest(actor);
    }
  }

  glanceFromPeer(actor) {
    if (this.clock < this.peerAfter || Math.random() > .32) return;
    const idle = this.actors.filter(other => other !== actor && other.visible && other.source === 'rest');
    if (!idle.length) return;
    const peer = idle[Math.floor(Math.random() * idle.length)];
    this.peerAfter = this.clock + random(9000, 18000);
    const r = actor.slot.button.getBoundingClientRect();
    this.stage.face(peer.index, r.left + r.width / 2);
    this.run(peer, 'peer', 'watching a friend', [this.choose(peer, ['peek', 'nod', 'blink'])]);
  }

  canReact() {
    return !this.disposed && !this.finale && !this.motion.matches && this.stage.count > 0;
  }

  activeActor() {
    if (this.active < 0 || this.active >= this.stage.count) this.active = this.stage.nearest(this.input);
    return this.actors[this.active];
  }

  toward(actor, el) {
    const r = el.getBoundingClientRect();
    this.stage.face(actor.index, r.left + r.width / 2);
  }

  nearby(event) {
    if (!this.canReact() || this.revealed || event.pointerType === 'touch' || this.clock < (this.pointerAfter ?? 0)) return;
    this.pointerAfter = this.clock + 240;
    this.lastContact = this.clock;
    for (const actor of this.actors.slice(0, this.stage.count)) {
      if (!actor.visible || !actor.interruptible || actor.priority > PRIORITY.story || actor.nearbyAfter > this.clock) continue;
      const r = actor.slot.button.getBoundingClientRect();
      if (Math.hypot(event.clientX - (r.left + r.width / 2), event.clientY - (r.top + r.height / 2)) > r.width * .85) continue;
      actor.nearbyAfter = this.clock + random(5500, 10500);
      if (Math.random() < .6) {
        this.stage.face(actor.index, event.clientX);
        this.run(actor, 'nearby', 'curious', [this.choose(actor, ['peek', 'blink', 'nod'])]);
      }
      break;
    }
  }

  tapped(actor, event) {
    if (!this.canReact() || this.revealed || actor.priority >= PRIORITY.error) return;
    this.lastContact = this.clock;
    const r = actor.slot.button.getBoundingClientRect();
    const head = event.detail !== 0 && event.clientY < r.top + r.height * .43;
    this.run(actor, 'click', head ? 'bashful' : 'delighted', [head ? 'groom' : this.choose(actor, CAST[actor.index].click)]);
  }

  attend() {
    if (!this.canReact() || this.revealed || this.clock - this.lastFocus < 550) return;
    this.lastFocus = this.lastContact = this.clock;
    this.active = this.stage.nearest(this.input);
    const actor = this.activeActor();
    if (!actor || actor.priority >= PRIORITY.error) return;
    this.toward(actor, this.input);
    this.run(actor, 'focus', 'attentive', [this.choose(actor, ['think', 'peek'])]);
  }

  typing() {
    if (!this.canReact()) return;
    this.lastContact = this.clock;
    this.quietUntil = this.clock + 2700;
    let clearedError = false;
    for (const actor of this.actors) {
      if (actor.source !== 'error') continue;
      clearedError = true;
      if (this.revealed) this.coverEyes(actor);
      else this.rest(actor, 500);
    }
    if (this.revealed || (!clearedError && this.clock - this.lastTyping < 2200)) return;
    this.lastTyping = this.clock;
    const actor = this.activeActor();
    if (!actor) return;
    this.toward(actor, this.input);
    this.run(actor, 'typing', 'curious', [this.choose(actor, ['blink', 'shy', 'think'])]);
  }

  expect() {
    if (!this.canReact() || this.revealed || this.clock - this.lastEnter < 900) return;
    this.lastEnter = this.lastContact = this.clock;
    const active = this.activeActor();
    if (active && active.priority < PRIORITY.error) {
      this.toward(active, this.enter);
      this.run(active, 'enter', 'expectant', ['nod']);
    }
    for (const actor of this.actors) {
      if (actor.visible && actor !== active && actor.action === 'sleep') this.run(actor, 'nearby', 'waking up', ['stretch']);
    }
  }

  coverEyes(actor) {
    this.run(actor, 'privacy', 'eyes closed', [{ id: 'shy', face: 'blink', span: 880, hold: Infinity }]);
  }

  reveal(shown) {
    if (this.finale || this.disposed) return;
    this.revealed = shown;
    if (!this.canReact()) return;
    this.lastContact = this.clock;
    for (const actor of this.actors.slice(0, this.stage.count)) {
      if (shown) this.coverEyes(actor);
      else if (actor.source === 'privacy' || actor.source === 'error') this.rest(actor, random(400, 1100));
    }
  }

  error(attempts) {
    this.errorCount = Number.isInteger(attempts) && attempts > 0 ? attempts : this.errorCount + 1;
    const index = this.stage.count ? (this.errorCount - 1) % this.stage.count : -1;
    if (index >= 0) this.active = index;
    if (!this.canReact()) return index;
    // The form still reports the rejection, while showing a key keeps the
    // higher-priority privacy pose intact until the visitor hides it again.
    if (this.revealed) return index;
    const actor = this.activeActor();
    if (!actor) return index;
    // New feedback replaces any earlier rejection rather than leaving two
    // characters acting out an obsolete response at the same time.
    for (const other of this.actors) {
      if (other !== actor && other.source === 'error') this.rest(other, 300);
    }
    this.lastContact = this.clock;
    this.toward(actor, this.input);
    this.run(actor, 'error', 'puzzled', [
      { id: 'surprise', offset: 250, span: 650, face: 'surprise', hold: 80 },
      this.errorCount % 2 ? 'shake' : 'think',
    ]);
    return index;
  }

  // Called only by the gate's existing successful-validation branch.
  // The promise describes a visual interval. It has no access to the key,
  // the verifier, the gate lock, or the decision to enter the homepage.
  celebrate() {
    if (this.finale) return this.finale.promise;
    if (this.disposed) return Promise.resolve();
    let finish;
    const promise = new Promise(resolve => { finish = resolve; });
    this.finale = { start: performance.now(), promise, finish, done: false };
    for (const actor of this.actors) {
      this.stage.stop(actor.index);
      actor.queue.length = 0;
      actor.finaleBeat = -1;
      if (actor.index >= this.stage.count) continue;
      this.toward(actor, this.card); // The validated form, including its input, is already hidden.
      if (!this.motion.matches && !document.hidden) this.paintCelebration(actor, 0, 0);
    }
    if (document.hidden) this.finishCelebration();
    else {
      const brief = this.motion.matches || !this.stage.count;
      this.finishTimer = setTimeout(() => this.finishCelebration(), brief ? 450 : CELEBRATION_MS);
      this.wake();
    }
    return promise;
  }

  paintCelebration(actor, time, dt) {
    const beat = time < SURPRISE_MS ? -1 : Math.min(2, Math.floor((time - SURPRISE_MS) / PHRASE_MS));
    const [id, offsetMs, span] = beat < 0 ? ['surprise', 0, SURPRISE_MS] : FINALE[actor.index][beat];
    if (actor.source !== 'celebration' || actor.finaleBeat !== beat) {
      actor.source = 'celebration';
      actor.priority = Infinity;
      actor.interruptible = false;
      actor.mood = beat < 0 ? 'surprised' : 'celebrating';
      actor.finaleBeat = beat;
      actor.action = id;
      actor.renderer.play(id, { offsetMs, face: beat < 0 ? 'surprise' : undefined });
      this.describe(actor);
    }
    const local = beat < 0 ? time : time - SURPRISE_MS - PHRASE_MS * beat;
    actor.renderer.tick(Math.min(span, Math.max(0, local)), dt);
  }

  finishCelebration() {
    if (!this.finale || this.finale.done) return;
    this.finale.done = true;
    clearTimeout(this.finishTimer);
    this.stopClock();
    this.finale.finish();
  }

  destroy() {
    if (this.disposed) return;
    this.disposed = true;
    this.finishCelebration();
    this.stopClock();
    this.events.abort();
    this.stage.onLayout = null;
    for (const actor of this.actors) actor.renderer.destroy();
    this.stage.destroy();
  }
}

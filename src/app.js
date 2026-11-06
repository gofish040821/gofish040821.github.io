(() => {
  'use strict';
  document.querySelector('#year').textContent = new Date().getFullYear();

  const I18N = window.__I18N__ || { default: 'en', languages: [], translations: {} };
  const translations = I18N.translations || {};
  const languages = I18N.languages || [];
  const STORAGE_KEY = 'gofish-language';
  const root = document.documentElement;
  const BIRTH_DATE = '2004-08-21';
  let progressQueued = false;
  let headerController = null;

  function scheduleProgress() {
    if (progressQueued) return;
    progressQueued = true;
    requestAnimationFrame(() => {
      headerController?.update();
      progressQueued = false;
    });
  }

  window.addEventListener('scroll', scheduleProgress, { passive: true });
  window.addEventListener('resize', () => {
    headerController?.scheduleMeasure();
    scheduleProgress();
  }, { passive: true });
  if ('ResizeObserver' in window) new ResizeObserver(scheduleProgress).observe(document.body);
  scheduleProgress();

  const uiIcon = name => '<svg class="ui-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true" focusable="false"><use href="#ui-sketch-' + name + '"/></svg>';
  let strings = {};
  const t = (key, fallback) => (strings[key] === undefined ? (fallback || '') : strings[key]);
  const currentCode = () => root.getAttribute('data-language') || I18N.default;
  function currentAge() {
    const today = new Date();
    const birth = new Date(BIRTH_DATE + 'T00:00:00');
    let age = today.getFullYear() - birth.getFullYear();
    const birthdayPassed = today.getMonth() > birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() >= birth.getDate());
    return birthdayPassed ? age : age - 1;
  }
  const renderText = value => String(value).replace(/\{age\}/g, String(currentAge()));

  /* ---------------- header nav (mobile) ---------------- */
  const menuButton = document.querySelector('.menu-toggle');
  const menu = document.querySelector('#mobile-nav');
  function closeMenu() {
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', t('menuOpen', 'Open menu'));
    menu.hidden = true;
  }
  menuButton.addEventListener('click', () => {
    const expanded = menuButton.getAttribute('aria-expanded') !== 'true';
    menuButton.setAttribute('aria-expanded', String(expanded));
    menuButton.setAttribute('aria-label', expanded ? t('menuClose', 'Close menu') : t('menuOpen', 'Open menu'));
    menu.hidden = !expanded;
    if (expanded) closeLangMenu();
  });
  menu.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
  menuButton.addEventListener('keydown', event => {
    if (event.key !== 'ArrowDown') return;
    event.preventDefault();
    menu.hidden = false;
    menuButton.setAttribute('aria-expanded', 'true');
    menuButton.setAttribute('aria-label', t('menuClose', 'Close menu'));
    closeLangMenu();
    menu.querySelector('a')?.focus();
  });
  document.addEventListener('click', event => {
    if (!menu.hidden && !menu.contains(event.target) && !menuButton.contains(event.target)) closeMenu();
  });
  document.querySelector('.site-header').addEventListener('focusout', event => {
    if (event.relatedTarget && !menu.hidden && !menu.contains(event.relatedTarget) && !menuButton.contains(event.relatedTarget)) closeMenu();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !menu.hidden) { closeMenu(); menuButton.focus(); }
  });
  window.matchMedia('(min-width: 1201px)').addEventListener('change', event => { if (event.matches) closeMenu(); });

  /* ---------------- scrollspy ---------------- */
  const links = [...document.querySelectorAll('.desktop-nav a')];
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const link = links.find(a => a.hash === '#' + entry.target.id);
        if (entry.isIntersecting) {
          links.forEach(a => a.removeAttribute('aria-current'));
          if (link) link.setAttribute('aria-current', 'location');
        } else if (link) link.removeAttribute('aria-current');
      });
    }, { rootMargin: '-10% 0px -60% 0px', threshold: 0 });
    links.forEach(link => observer.observe(document.querySelector(link.hash)));
  }

  /* ---------------- one-time section reveals ---------------- */
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------------- small illustrated scenes ---------------- */
  const activeScenes = new Map();
  const introducedScenes = new WeakSet();

  // Zones use the original 120×120 drawing coordinates. Each beat gives a time
  // and one strength per zone. A second zone lets a crease travel along a mark.
  const zone = (x, y, rx, ry, dx, dy) => ({ x, y, rx, ry, dx, dy });
  const pencilBends = {
    writing: {
      zones: [zone(48,75,9,9,-.5,3.0), zone(58,76,9,9,.8,2.7)], pressure: .42,
      beats: [[.17,0,0],[.26,.62,0],[.34,1,0],[.42,-.12,0],[.49,.36,.08],[.61,.12,.64],[.68,0,1],[.78,0,0]]
    },
    lens: {
      zones: [zone(48,44,11,11,-4.6,3.2)],
      beats: [[.12,0],[.24,.78],[.32,1],[.43,-.74],[.62,.36],[.74,.12],[.88,0]]
    },
    discovery: {
      zones: [zone(47,55,10,14,-3.4,.8), zone(67,54,12,13,4.3,-1.1)],
      beats: [[.32,0,0],[.47,-.42,-.23],[.56,1,.28],[.63,.38,1],[.75,-.18,.26],[.89,0,0]]
    },
    'book-page': {
      zones: [zone(99,32,42,54,-8,-6), zone(99,84,36,48,5,-4)],
      beats: [[.04,0,0],[.13,.72,0],[.21,-.16,.14],[.34,1,.27],[.44,.38,1],[.57,-.40,.64],[.70,-.17,-.53],[.88,.16,-.09],[.98,0,0]]
    },
    'leaf-left': {
      zones: [zone(43,53,17,16,-1.5,3.7), zone(30,42,21,20,-2.8,6)],
      beats: [[.06,0,0],[.17,.85,.18],[.27,.32,1],[.46,-.22,.13],[.56,-.68,-.26],[.64,-.12,-.64],[.80,.12,.20],[.94,0,0]]
    },
    'leaf-right': {
      zones: [zone(88,47,24,25,1.8,-4.7)],
      beats: [[.14,0],[.31,.68],[.48,.47],[.67,-.82],[.83,.22],[.95,0]]
    },
    flower: {
      zones: [zone(51,20,15,18,-3.7,-1.9), zone(73,20,14,17,3.4,-2.8)],
      beats: [[.12,0,0],[.29,-.50,-.41],[.40,.42,.05],[.49,1,.67],[.55,.48,1],[.72,-.19,.22],[.93,0,0]]
    },
    'code-line': {
      zones: [zone(49,86,13,9,.6,3.3), zone(67,86,12,8,1.4,-2.8)], pressure: .32,
      beats: [[.48,0,0],[.59,1,0],[.67,.16,.14],[.77,0,1],[.85,0,-.16],[.94,0,0]]
    },
    'chicken-piece': {
      zones: [zone(90,53,29,35,3.1,4.8), zone(73,68,28,22,-.7,3.1)],
      beats: [[.12,0,0],[.28,.82,.10],[.35,1,.72],[.48,-.42,.40],[.60,.40,-.32],[.74,0,0],[.83,.50,.78],[.91,-.12,.14]]
    },
    'burger-middle': {
      zones: [zone(58,68,32,24,-1.6,3.7), zone(27,68,38,24,-3.0,6.8)],
      beats: [[.08,0,0],[.17,-.42,-.18],[.31,.72,-.22],[.43,.95,.56],[.52,.38,1],[.60,.17,.95],[.76,-.35,.22],[.84,.08,-.41],[.95,0,0]]
    },
    'burger-top': {
      zones: [zone(53,25,43,26,0,3.7), zone(87,44,19,20,1.8,2.4)],
      beats: [[.04,0,0],[.17,.91,.19],[.34,-.25,.66],[.50,0,0],[.76,0,0],[.86,.74,.30],[.93,-.15,.27]]
    },
    racket: {
      zones: [zone(63,48,18,18,-4.8,6.8), zone(48,51,17,17,-2.1,4.0)],
      beats: [[.42,0,0],[.45,1,.18],[.48,.07,.93],[.52,-.55,.12],[.56,.17,-.38],[.69,0,0]]
    },
    shuttle: {
      zones: [zone(83,21,12,17,4.2,5.3), zone(101,24,13,16,-3.6,5.6)],
      beats: [[.42,0,0],[.46,.85,.20],[.50,1,.96],[.55,-.46,-.15],[.61,-.16,-.42],[.72,0,0]]
    },
    flag: {
      zones: [zone(88,30,10,14,-.7,-4.6), zone(101,32,14,14,-.7,-6.8)],
      beats: [[.08,0,0],[.21,-.35,-.5],[.32,1,-.35],[.43,-.31,1],[.57,-.77,.08],[.65,.24,-.79],[.78,-.13,.34],[.94,0,0]]
    },
    'steam-a': {
      zones: [zone(42,46,13,13,5.6,-1), zone(44,29,16,15,-7.0,-2.1)],
      beats: [[.06,0,0],[.23,.93,-.25],[.40,.16,1],[.57,-.68,.24],[.76,.16,-.54],[.94,0,0]]
    },
    'steam-b': {
      zones: [zone(58,42,14,14,5.1,-2.2)],
      beats: [[.10,0],[.37,1],[.58,-.60],[.83,.16],[.96,0]]
    },
    clapper: {
      zones: [zone(66,38,25,17,0,-2.6), zone(92,34,26,21,0,-4.4)],
      beats: [[.12,0,0],[.24,-.26,-.62],[.34,0,.18],[.47,0,0],[.54,.68,1],[.56,.08,.16],[.58,-.48,-.84],[.62,.19,.32],[.68,0,0]],
      // Only the receiving edge and its chalk marks give. The bottom stays on the table.
      body: {
        zones: [zone(91,54,37,27,-.6,4.2), zone(68,71,35,24,-.8,2.4)],
        beats: [[.55,0,0],[.573,1,.15],[.61,-.38,.84],[.66,.16,-.35],[.74,0,.10],[.81,0,0]]
      }
    },
    'film-light': {
      zones: [zone(104,51,12,13,1.4,-4.2), zone(108,69,12,10,4.6,3.3)],
      beats: [[.54,0,0],[.575,.94,0],[.62,.40,1],[.69,-.28,.68],[.81,0,-.12],[.91,0,0]]
    }
  };
  const bendCache = new WeakMap();
  function bendFrames(path, bend) {
    const rest = path.getAttribute('d');
    // Pencil outlines are sampled M/L polygons. Apply the same smooth field to
    // adjacent graphite fragments and crayon fill so their shared edges stay together.
    const vertices = [...rest.matchAll(/([ML])(-?[\d.]+) (-?[\d.]+)/g)].map(match => {
      const x = Number(match[2]), y = Number(match[3]);
      const weights = bend.zones.map(zone => {
        const distance = ((x - zone.x) / zone.rx) ** 2 + ((y - zone.y) / zone.ry) ** 2;
        return Math.max(0, 1 - distance) ** 2;
      });
      return { command: match[1], x, y, weights, affected: weights.some(w => w > 0), original: match[0] };
    });
    if (!vertices.some(point => point.affected)) return null;
    const end = rest.endsWith('Z') ? 'Z' : '';
    // A future illustration can use curves without having them flattened to lines.
    if (vertices.map(point => point.original).join('') + end !== rest) return null;
    // The brush generator walks out on one edge of a stroke and back on the
    // other. Paired samples recover its original width, including at chunk seams.
    // Pressure widens the two edges; the smaller sideways slip shifts both
    // together, as if the same stroke had been traced by hand a second time.
    const graphite = path.classList.contains('illustration-ink');
    const crayon = path.classList.contains('illustration-accent');
    if (end && (graphite || crayon) && vertices.length % 2 === 0) {
      vertices.forEach((point, i) => {
        const opposite = vertices[vertices.length - 1 - i];
        const midX = (point.x + opposite.x) / 2, midY = (point.y + opposite.y) / 2;
        const side = i < vertices.length / 2 ? 1 : -1;
        const slip = Math.sin(midX * .17 + midY * .11) * side;
        const nib = graphite ? .48 + .56 * slip : .17 + .22 * slip;
        point.nibX = (point.x - midX) * nib;
        point.nibY = (point.y - midY) * nib;
      });
    }
    const restWeights = bend.zones.map(() => 0);
    const poses = [[0, ...restWeights], ...bend.beats, [1, ...restWeights]];
    return poses.map(([offset, ...strengths]) => {
      const d = strengths.every(strength => strength === 0) ? rest : vertices.map(point => {
        if (!point.affected) return point.original;
        let x = point.x, y = point.y, load = 0;
        bend.zones.forEach((zone, i) => {
          const amount = point.weights[i] * strengths[i];
          load += amount;
          x += zone.dx * amount;
          y += zone.dy * amount;
        });
        if (point.nibX !== undefined) {
          const pressure = Math.max(-1, Math.min(1, load));
          x += pressure * point.nibX;
          y += pressure * point.nibY;
        }
        return point.command + x.toFixed(2) + ' ' + y.toFixed(2);
      }).join('') + end;
      const frame = { offset, d: 'path("' + d + '")', easing: 'cubic-bezier(.29,.18,.38,.98)' };
      if (bend.pressure) frame.strokeWidth = Number(path.getAttribute('stroke-width')) * (1 + bend.pressure * Math.max(0, ...strengths));
      return frame;
    });
  }

  function playStrokes(paths, bend, timing) {
    for (const path of paths) {
      if (!bendCache.has(path)) bendCache.set(path, bendFrames(path, bend));
      const frames = bendCache.get(path);
      if (frames) path.animate(frames, timing);
    }
  }

  function playPencilBends(scene) {
    if (!window.CSS?.supports('d', 'path("M0 0L1 1")')) return;
    for (const part of scene.querySelectorAll('[data-scene-part]')) {
      const bend = pencilBends[part.dataset.scenePart];
      if (!bend) continue;
      const gesture = part.getAnimations()[0];
      if (!gesture) continue;
      const { duration, delay } = gesture.effect.getTiming();
      playStrokes(part.querySelectorAll('path'), bend, { duration, delay });
      if (bend.body) playStrokes(scene.querySelectorAll(':scope > path'), bend.body, { duration, delay });
    }
  }

  function playScene(scene) {
    if (reducedMotion.matches || activeScenes.has(scene) || !scene.getClientRects().length || typeof scene.getAnimations !== 'function') return;
    // Local parts keep every scene independent of the shared SVG sprite.
    const use = scene.querySelector('use');
    if (use) {
      const symbol = document.getElementById(use.getAttribute('href').slice(1));
      if (!symbol) return;
      use.replaceWith(...Array.from(symbol.childNodes, node => node.cloneNode(true)));
    }
    const token = {};
    activeScenes.set(scene, token);
    scene.classList.add('is-scene-playing');
    playPencilBends(scene);
    Promise.all(scene.getAnimations({ subtree: true }).map(animation => animation.finished.catch(() => {})))
      .then(() => {
        if (activeScenes.get(scene) !== token) return;
        scene.classList.remove('is-scene-playing');
        activeScenes.delete(scene);
      });
  }

  function settleScenes() {
    activeScenes.forEach((_, scene) => {
      scene.getAnimations({ subtree: true }).forEach(animation => animation.cancel());
      scene.classList.remove('is-scene-playing');
    });
    activeScenes.clear();
  }
  const sceneObserver = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting || reducedMotion.matches) continue;
      introducedScenes.add(entry.target);
      sceneObserver.unobserve(entry.target);
      playScene(entry.target);
    }
  }, { threshold: .6, rootMargin: '0px 0px -8% 0px' }) : null;

  function observeScenes() {
    sceneObserver?.disconnect();
    if (reducedMotion.matches) return;
    document.querySelectorAll('.illustration[data-illustration]').forEach(scene => {
      if (!introducedScenes.has(scene)) sceneObserver?.observe(scene);
    });
  }
  // A scene introduces itself once on arrival. Hover or touch can replay it;
  // a resting pointer never loops it and moving away never cuts a gesture short.
  document.addEventListener('pointerover', event => {
    if (event.pointerType === 'touch') return;
    const scene = event.target.closest?.('.illustration[data-illustration]');
    if (scene && !scene.contains(event.relatedTarget)) playScene(scene);
  });
  document.addEventListener('pointerdown', event => {
    if (event.pointerType === 'mouse') return;
    const scene = event.target.closest?.('.illustration[data-illustration]');
    if (scene) playScene(scene);
  }, { passive: true });
  document.addEventListener('visibilitychange', () => { if (document.hidden) settleScenes(); });
  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) settleScenes();
    observeScenes();
  });

  function initReveals() {
    if (reducedMotion.matches || !('IntersectionObserver' in window)) return;
    const selectors = [
      ['.about .section-aside', 0], ['.about-main', 60],
      ['.research .section-top', 0], ['.research-grid', 60],
      ['.research-skills', 0],
      ['.education .section-aside', 0], ['.timeline', 60],
      ['.life-section .section-top', 0], ['.hobbies', 60],
      ['.gallery', 0], ['.closing', 0]
    ];
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.remove('reveal-pending');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.04 });
    selectors.forEach(([selector, delay]) => {
      const element = document.querySelector(selector);
      if (!element) return;
      const rect = element.getBoundingClientRect();
      // Never hide content already visible on load or reached by a deep link.
      if (rect.top < window.innerHeight * 0.88) return;
      element.style.setProperty('--reveal-delay', `${delay}ms`);
      element.classList.add('reveal-item', 'reveal-pending');
      observer.observe(element);
    });
    document.addEventListener('focusin', event => {
      const element = event.target.closest?.('.reveal-pending');
      if (element) { element.classList.remove('reveal-pending'); observer.unobserve(element); }
    });
    reducedMotion.addEventListener('change', event => {
      if (!event.matches) return;
      observer.disconnect();
      document.querySelectorAll('.reveal-pending').forEach(element => element.classList.remove('reveal-pending'));
    });
  }

  /* ---------------- gallery ---------------- */
  const initialCount = 4;
  let photoCards = [];
  let photoLinks = [];
  let galleryExpanded = false;
  const galleryToggle = document.querySelector('#gallery-toggle');

  function renderGalleryToggle() {
    if (photoCards.length <= initialCount) { galleryToggle.hidden = true; return; }
    galleryToggle.hidden = false;
    const label = galleryExpanded
      ? t('galleryCollapse', 'Collapse gallery')
      : t('galleryExpand', 'Show all {n} photos').replace('{n}', photoCards.length);
    const mark = uiIcon(galleryExpanded ? 'minus' : 'plus');
    galleryToggle.innerHTML = label + ' <span aria-hidden="true">' + mark + '</span>';
  }

  function applyGalleryVisibility() {
    photoCards.forEach((card, i) => { card.hidden = i >= initialCount && !galleryExpanded; });
  }

  function bindGallery() {
    photoCards = [...document.querySelectorAll('.photo-card')];
    photoLinks = [...document.querySelectorAll('.photo-link')];
    applyGalleryVisibility();
    renderGalleryToggle();
    bindPhotoLinks();
  }

  galleryToggle.addEventListener('click', () => {
    galleryExpanded = !galleryExpanded;
    galleryToggle.setAttribute('aria-expanded', String(galleryExpanded));
    applyGalleryVisibility();
    renderGalleryToggle();
    scheduleProgress();
    if (!galleryExpanded) document.querySelector('#gallery').scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  });

  /* ---------------- skills ---------------- */
  const initialSkillCount = 6;
  const skillToggle = document.querySelector('#skills-toggle');
  const skillList = document.querySelector('#skill-badges');
  let skillItems = [];
  let skillsExpanded = false;

  function renderSkillToggle() {
    if (!skillToggle || skillItems.length <= initialSkillCount) return;
    const label = skillsExpanded ? t('skillsCollapse', 'Show fewer skills') : t('skillsExpand', 'Show all skills');
    const mark = uiIcon(skillsExpanded ? 'minus' : 'plus');
    skillToggle.innerHTML = '<span>' + label + '</span> <span aria-hidden="true">' + mark + '</span>';
  }

  function applySkillVisibility() {
    skillItems.forEach((item, i) => { item.hidden = i >= initialSkillCount && !skillsExpanded; });
  }

  function bindSkills() {
    if (!skillToggle || !skillList) return;
    skillItems = [...skillList.querySelectorAll('li')];
    if (skillItems.length <= initialSkillCount) { skillToggle.hidden = true; return; }
    skillToggle.hidden = false;
    applySkillVisibility();
    renderSkillToggle();
  }

  if (skillToggle) {
    skillToggle.addEventListener('click', () => {
      skillsExpanded = !skillsExpanded;
      skillToggle.setAttribute('aria-expanded', String(skillsExpanded));
      applySkillVisibility();
      renderSkillToggle();
      scheduleProgress();
      if (!skillsExpanded) document.querySelector('#skills-title').scrollIntoView({ block: 'center', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    });
  }

  /* ---------------- lightbox ---------------- */
  const dialog = document.querySelector('#lightbox');
  const fullImage = document.querySelector('#lightbox-image');
  const previewImage = document.querySelector('#lightbox-preview');
  const photoVisual = document.querySelector('.lightbox-visual');
  const closeButton = document.querySelector('#lightbox-close');
  const lightboxTitle = document.querySelector('#lightbox-title');
  const lightboxDescription = document.querySelector('#lightbox-description');
  const lightboxCount = document.querySelector('#lightbox-count');
  const photoCache = new Map();
  let activeIndex = 0;
  let opener = null;
  let photoRequest = 0;
  let closingPhoto = false;
  let zoomAnimation = null;
  let detailAnimation = null;
  let outgoingImage = null;
  let intentTimer = null;

  function canPrefetchPhotos() {
    const connection = navigator.connection;
    return !connection?.saveData && !/(^|-)2g$/.test(connection?.effectiveType || '');
  }

  // Keep a small decoded cache; simultaneous hover/open requests share one load.
  function loadPhoto(url, priority = 'low') {
    const cached = photoCache.get(url);
    if (cached) {
      if (priority === 'high') cached.image.fetchPriority = 'high';
      photoCache.delete(url);
      photoCache.set(url, cached);
      return cached.promise;
    }
    const image = new Image();
    image.decoding = 'async';
    image.fetchPriority = priority;
    const entry = { image, ready: false, promise: null };
    entry.promise = new Promise((resolve, reject) => {
      image.onload = async () => {
        try { await image.decode(); } catch { /* Loaded images can still be displayed without decode(). */ }
        entry.ready = true;
        for (const [key, value] of photoCache) {
          if (photoCache.size <= 6) break;
          if (key !== url && value.ready) photoCache.delete(key);
        }
        resolve(image);
      };
      image.onerror = () => { photoCache.delete(url); reject(new Error('Photo unavailable')); };
    });
    photoCache.set(url, entry);
    image.src = url;
    return entry.promise;
  }

  function prefetchNeighbours(request) {
    if (!canPrefetchPhotos()) return;
    const warm = () => {
      if (!dialog.open || closingPhoto || request !== photoRequest || !canPrefetchPhotos()) return;
      for (const offset of [-1, 1]) {
        const link = photoLinks[(activeIndex + offset + photoLinks.length) % photoLinks.length];
        loadPhoto(link.href).catch(() => {});
      }
    };
    if ('requestIdleCallback' in window) requestIdleCallback(warm, { timeout: 900 });
    else setTimeout(warm, 180);
  }

  function stopPhotoAnimations(keepPendingPreview = false) {
    zoomAnimation?.cancel();
    zoomAnimation = null;
    detailAnimation?.cancel();
    detailAnimation = null;
    // A preference change must not remove the only decoded image while the
    // next thumbnail is still loading. Its reveal callback will clear it.
    if (!keepPendingPreview || (previewImage.complete && previewImage.naturalWidth) || !fullImage.hidden) {
      outgoingImage?.remove();
      outgoingImage = null;
    }
    dialog.classList.remove('is-photo-zooming');
  }

  function photoTransform(source) {
    const target = photoVisual.getBoundingClientRect();
    const width = Number(previewImage.getAttribute('width')) || 1;
    const height = Number(previewImage.getAttribute('height')) || 1;
    const fit = Math.min(target.width / width, target.height / height);
    const dx = source.left + source.width / 2 - target.left - target.width / 2;
    const dy = source.top + source.height / 2 - target.top - target.height / 2;
    return `translate(${dx}px, ${dy}px) scale(${source.width / (width * fit)}, ${source.height / (height * fit)})`;
  }

  function zoomPhoto(source, reverse = false) {
    if (reducedMotion.matches || !source || source.width <= 0 || source.height <= 0) return null;
    zoomAnimation?.cancel();
    const from = { transform: photoTransform(source) };
    const to = { transform: 'none' };
    dialog.classList.add('is-photo-zooming');
    const animation = photoVisual.animate(reverse ? [to, from] : [from, to], {
      duration: reverse ? 260 : 420,
      easing: reverse ? 'cubic-bezier(.4,0,.5,1)' : 'cubic-bezier(.2,.75,.25,1)',
      fill: 'none'
    });
    zoomAnimation = animation;
    animation.finished.catch(() => {}).then(() => { if (zoomAnimation === animation) dialog.classList.remove('is-photo-zooming'); });
    return animation;
  }

  function showPhoto(index, opening = false) {
    if (!photoLinks.length) return;
    if (closingPhoto) return;
    const previous = !opening && dialog.open ? (outgoingImage || (fullImage.hidden ? previewImage : fullImage)).cloneNode() : null;
    stopPhotoAnimations();
    const request = ++photoRequest;
    activeIndex = (index + photoLinks.length) % photoLinks.length;
    const link = photoLinks[activeIndex];
    const thumbnail = link.querySelector('img');
    // The already downloaded thumbnail appears in this same frame, even offline.
    previewImage.width = thumbnail.naturalWidth || Number(thumbnail.getAttribute('width'));
    previewImage.height = thumbnail.naturalHeight || Number(thumbnail.getAttribute('height'));
    previewImage.src = thumbnail.currentSrc || thumbnail.src;
    photoVisual.setAttribute('aria-label', thumbnail.alt);
    fullImage.hidden = true;
    fullImage.removeAttribute('src');
    lightboxTitle.textContent = link.dataset.title || '';
    lightboxDescription.textContent = link.dataset.caption || '';
    lightboxCount.textContent = String(activeIndex + 1).padStart(2, '0') + ' / ' + String(photoLinks.length).padStart(2, '0');
    let revealPreview = () => {};
    if (previous) {
      previous.removeAttribute('id');
      previous.className = 'lightbox-outgoing';
      previous.setAttribute('aria-hidden', 'true');
      photoVisual.append(previous);
      outgoingImage = previous;
      let revealing = false;
      revealPreview = () => {
        if (request !== photoRequest || outgoingImage !== previous || revealing) return;
        revealing = true;
        const remove = () => { previous.remove(); if (outgoingImage === previous) outgoingImage = null; };
        if (reducedMotion.matches) { remove(); return; }
        const fade = previous.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 180, easing: 'ease-out', fill: 'forwards' });
        fade.finished.catch(() => {}).then(remove);
      };
      if (previewImage.complete && previewImage.naturalWidth) revealPreview();
      else previewImage.decode().then(revealPreview).catch(() => {});
    }
    loadPhoto(link.href, 'high').then(image => {
      if (request !== photoRequest || !dialog.open || closingPhoto) return;
      fullImage.src = image.src;
      fullImage.hidden = false;
      revealPreview();
      if (!reducedMotion.matches) {
        detailAnimation = fullImage.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 180, easing: 'ease-out' });
      }
      prefetchNeighbours(request);
    }).catch(() => { /* Keep the usable preview when a full-size request fails. */ });
  }

  function closePhoto() {
    if (!dialog.open || closingPhoto) return;
    closingPhoto = true;
    ++photoRequest;
    stopPhotoAnimations();
    const source = photoLinks[activeIndex]?.querySelector('img');
    const rect = source?.getBoundingClientRect();
    const onScreen = rect && rect.top < window.innerHeight && rect.bottom > 0 && rect.width > 0;
    if (reducedMotion.matches) { dialog.close(); return; }
    dialog.classList.add('is-closing');
    const animation = onScreen ? zoomPhoto(rect, true) : dialog.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 180 });
    if (animation) animation.finished.catch(() => {}).then(() => { if (closingPhoto && dialog.open) dialog.close(); });
    else dialog.close();
  }

  function bindPhotoLinks() {
    photoLinks.forEach((link, i) => {
      const warm = () => { if (canPrefetchPhotos()) loadPhoto(link.href).catch(() => {}); };
      link.addEventListener('pointerenter', event => {
        if (event.pointerType === 'touch') return;
        clearTimeout(intentTimer);
        intentTimer = setTimeout(warm, 120);
      });
      link.addEventListener('pointerleave', () => clearTimeout(intentTimer));
      link.addEventListener('focus', warm);
      link.addEventListener('pointerdown', event => { if (event.pointerType === 'touch') warm(); }, { passive: true });
      link.addEventListener('click', event => {
        if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
        if (typeof dialog.showModal !== 'function') return;
        event.preventDefault();
        clearTimeout(intentTimer);
        opener = link;
        const source = link.querySelector('img').getBoundingClientRect();
        closingPhoto = false;
        dialog.classList.remove('is-closing');
        showPhoto(i, true);
        dialog.showModal();
        document.body.classList.add('modal-open');
        closeButton.focus({ preventScroll: true });
        zoomPhoto(source);
      });
    });
  }

  if (typeof dialog.showModal === 'function') {
    document.querySelector('#lightbox-prev').addEventListener('click', () => showPhoto(activeIndex - 1));
    document.querySelector('#lightbox-next').addEventListener('click', () => showPhoto(activeIndex + 1));
    closeButton.addEventListener('click', closePhoto);
    dialog.addEventListener('cancel', event => { event.preventDefault(); closePhoto(); });
    dialog.addEventListener('close', () => {
      ++photoRequest;
      closingPhoto = false;
      stopPhotoAnimations();
      dialog.classList.remove('is-closing');
      document.body.classList.remove('modal-open');
      if (opener?.isConnected) opener.focus({ preventScroll: true });
    });
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const box = dialog.getBoundingClientRect();
      if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) closePhoto();
    });
    dialog.addEventListener('keydown', event => {
      if (event.key === 'ArrowRight') { event.preventDefault(); showPhoto(activeIndex + 1); }
      if (event.key === 'ArrowLeft') { event.preventDefault(); showPhoto(activeIndex - 1); }
    });
    let touchStart = null;
    photoVisual.addEventListener('touchstart', event => {
      touchStart = event.touches.length === 1 ? [event.touches[0].clientX, event.touches[0].clientY] : null;
    }, { passive: true });
    photoVisual.addEventListener('touchend', event => {
      if (!touchStart || event.changedTouches.length !== 1) return;
      const dx = event.changedTouches[0].clientX - touchStart[0];
      const dy = event.changedTouches[0].clientY - touchStart[1];
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) showPhoto(activeIndex + (dx < 0 ? 1 : -1));
      touchStart = null;
    }, { passive: true });
    reducedMotion.addEventListener('change', event => {
      if (!event.matches) return;
      stopPhotoAnimations(true);
      if (closingPhoto && dialog.open) dialog.close();
    });
  }

  /* ---------------- research details ---------------- */
  const researchGrid = document.querySelector('.research-grid');
  const expandedResearch = new Set();
  const researchAnimations = new WeakMap();

  function updateResearchDetails(button, animate = false) {
    const expanded = expandedResearch.has(button.dataset.researchKey);
    const panel = document.getElementById(button.getAttribute('aria-controls'));
    button.setAttribute('aria-expanded', String(expanded));
    button.querySelector('[data-research-label]').textContent = t(expanded ? 'researchLess' : 'researchMore');
    if (!panel) return;

    const startHeight = panel.hidden ? 0 : panel.getBoundingClientRect().height;
    researchAnimations.get(panel)?.cancel();
    panel.inert = !expanded;
    if (!animate || reducedMotion.matches || typeof panel.animate !== 'function') {
      panel.hidden = !expanded;
      return;
    }

    panel.hidden = false;
    const endHeight = expanded ? panel.firstElementChild.getBoundingClientRect().height : 0;
    const animation = panel.animate([
      { height: `${startHeight}px`, opacity: startHeight ? 1 : 0 },
      { height: `${endHeight}px`, opacity: expanded ? 1 : 0 }
    ], { duration: 260, easing: 'cubic-bezier(.2,.7,.2,1)' });
    researchAnimations.set(panel, animation);
    animation.finished.then(() => {
      if (researchAnimations.get(panel) !== animation) return;
      panel.hidden = !expanded;
      researchAnimations.delete(panel);
    }).catch(() => { /* A second click reverses the current animation. */ });
  }

  function syncResearchDetails() {
    researchGrid.querySelectorAll('.research-more').forEach(button => updateResearchDetails(button));
  }

  researchGrid.addEventListener('click', event => {
    const button = event.target.closest('.research-more');
    if (!button) return;
    const key = button.dataset.researchKey;
    if (expandedResearch.has(key)) expandedResearch.delete(key);
    else expandedResearch.add(key);
    updateResearchDetails(button, true);
    scheduleProgress();
  });

  /* ---------------- language switcher ---------------- */
  const langSwitch = document.querySelector('#lang-switch');
  const langToggle = document.querySelector('.lang-toggle');
  const langMenu = document.querySelector('.lang-menu');
  const langCurrent = document.querySelector('.lang-current');

  function closeLangMenu() {
    langMenu.hidden = true;
    langToggle.setAttribute('aria-expanded', 'false');
  }

  function buildLangMenu() {
    langMenu.innerHTML = languages.map(item => {
      const attrs = ' data-code="' + item.code + '" lang="' + (item.lang || item.code) + '"';
      const selected = item.code === currentCode() ? 'true' : 'false';
      return '<button type="button" role="option" class="lang-option"' + attrs + ' aria-selected="' + selected + '" tabindex="' + (selected === 'true' ? '0' : '-1') + '"><bdi class="lang-option-label" dir="' + (item.dir || 'ltr') + '">' + item.label + '</bdi></button>';
    }).join('');
  }

  // Swap every node the template marked: plain strings, aria labels, and the
  // pre-rendered content sections. Runs on init and on every switch.
  function translateStatic(entry) {
    const text = entry.strings || {};
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const value = text[el.dataset.i18n];
      if (value !== undefined) {
        const text = renderText(value);
        el.innerHTML = el.dataset.i18n === 'headline'
          ? text.replace(/\b(LLMs?|Agents?)\b/g, '<bdi class="research-name" dir="ltr" lang="en">$1</bdi>')
          : text;
      }
    });
    document.querySelectorAll('[data-i18n-aria]').forEach(el => {
      const value = text[el.dataset.i18nAria];
      if (value !== undefined) el.setAttribute('aria-label', renderText(value));
    });
    const sections = entry.sections || {};
    document.querySelectorAll('[data-i18n-section]').forEach(el => {
      const value = sections[el.dataset.i18nSection];
      if (value !== undefined) el.innerHTML = value;
    });
  }

  function applyLanguage(code) {
    const entry = translations[code] || translations[I18N.default];
    if (!entry) return;
    const meta = languages.find(item => item.code === code) || { code: code, label: code, lang: code, dir: 'ltr' };
    root.setAttribute('data-language', code);
    root.setAttribute('lang', meta.lang || code);
    root.setAttribute('dir', meta.dir || 'ltr');
    strings = entry.strings || {};
    if (langCurrent) langCurrent.textContent = meta.label || code;
    settleScenes();
    translateStatic(entry);
    if (strings.metaTitle) document.title = strings.metaTitle;
    if (dialog.open) dialog.close();
    closeMenu();
    closeLangMenu();
    bindGallery();
    bindSkills();
    syncResearchDetails();
    observeScenes();
    buildLangMenu();
    renderThemeToggle();
    scheduleProgress();
    try { localStorage.setItem(STORAGE_KEY, code); } catch (error) { /* private mode */ }
    // Keep the address bar shareable: ...?lang=ru stays in that language.
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.get('lang') !== code) {
        url.searchParams.set('lang', code);
        window.history.replaceState(null, '', url);
      }
    } catch (error) { /* file:// or sandboxed */ }
  }

  langToggle.addEventListener('click', () => {
    const willOpen = langMenu.hidden;
    langMenu.hidden = !willOpen;
    langToggle.setAttribute('aria-expanded', String(willOpen));
    if (willOpen) {
      closeMenu();
      langMenu.scrollTop = 0;
    }
  });
  // A listbox uses arrow keys; Tab leaves it without getting trapped.
  langToggle.addEventListener('keydown', event => {
    if (!['ArrowDown', 'ArrowUp'].includes(event.key)) return;
    event.preventDefault();
    langMenu.hidden = false;
    langToggle.setAttribute('aria-expanded', 'true');
    closeMenu();
    const options = [...langMenu.querySelectorAll('.lang-option')];
    const selected = options.find(option => option.getAttribute('aria-selected') === 'true');
    (selected || options[event.key === 'ArrowUp' ? options.length - 1 : 0])?.focus();
  });
  langMenu.addEventListener('keydown', event => {
    const options = [...langMenu.querySelectorAll('.lang-option')];
    const current = options.indexOf(document.activeElement);
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const index = event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1 : (current + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length;
    options.forEach((option, i) => { option.tabIndex = i === index ? 0 : -1; });
    options[index]?.focus();
  });
  // During native pointer focus transitions activeElement can briefly be body.
  // Use the actual destination so choosing an option cannot dismiss it before click.
  // A null destination is handled by the outside-click listener below.
  langSwitch.addEventListener('focusout', event => {
    if (event.relatedTarget && !langSwitch.contains(event.relatedTarget)) closeLangMenu();
  });
  langMenu.addEventListener('click', event => {
    const option = event.target.closest('.lang-option');
    if (!option) return;
    applyLanguage(option.dataset.code);
    langToggle.focus();
  });
  document.addEventListener('click', event => { if (!langSwitch.contains(event.target)) closeLangMenu(); });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !langMenu.hidden) { closeLangMenu(); langToggle.focus(); }
  });

  /* ---------------- theme ---------------- */
  // The inline <head> script already picked the initial theme before first paint.
  // This handles switching, persistence, and the label the button announces.
  const THEME_KEY = 'gofish-theme';
  const themeToggle = document.querySelector('#theme-toggle');
  const themeColorMeta = document.querySelector('#theme-color');
  const currentTheme = () => (root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light');

  function renderThemeToggle() {
    const dark = currentTheme() === 'dark';
    if (themeToggle) themeToggle.setAttribute('aria-label', t(dark ? 'themeToLight' : 'themeToDark', dark ? 'Switch to light mode' : 'Switch to dark mode'));
    if (themeColorMeta) themeColorMeta.setAttribute('content', dark ? '#191816' : '#f7f5f0');
  }

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    try { localStorage.setItem(THEME_KEY, theme); } catch (error) { /* private mode */ }
    renderThemeToggle();
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', () => applyTheme(currentTheme() === 'dark' ? 'light' : 'dark'));
  }

  /* ---------------- quiet sticky header ---------------- */
  function createHeaderController() {
    const header = document.querySelector('.site-header');
    const brand = header.querySelector('.brand');
    const wordmark = brand.querySelector('.brand-wordmark');
    // Older exported templates retain their original, non-collapsing header.
    if (!wordmark) return null;
    const avatar = brand.querySelector('img');
    const controls = [header.querySelector('.desktop-nav'), header.querySelector('.header-tools'), menu];
    const enterAt = 128, leaveAt = 40;
    let compact = null;
    let measureFrame = 0, readyFrame = 0;

    function measure() {
      // Subtract the current interpolated translation: measuring during a
      // reversal must not treat the moving wordmark as its own starting point.
      const transform = getComputedStyle(wordmark).transform;
      const translated = transform === 'none' ? 0 : new DOMMatrixReadOnly(transform).m41;
      const rect = wordmark.getBoundingClientRect();
      const originCenter = rect.left + rect.width / 2 - translated;
      const moving = wordmark.getAnimations().some(animation => animation.playState === 'running');
      // A settled, centered wordmark tracks a resized viewport immediately.
      // An in-flight transition instead retargets from its current position.
      if (compact && !moving) wordmark.style.transition = 'none';
      header.style.setProperty('--header-brand-x', `${window.innerWidth / 2 - originCenter}px`);
      root.style.setProperty('--sticky-header-offset', `${header.getBoundingClientRect().height + 16}px`);
      if (compact && !moving) {
        wordmark.getBoundingClientRect();
        wordmark.style.removeProperty('transition');
      }
    }

    function update(reset = false) {
      const next = reset || compact === null
        ? window.scrollY > enterAt
        : compact ? window.scrollY > leaveAt : window.scrollY > enterAt;
      if (next === compact) return;
      if (next) {
        const moveFocus = controls.some(control => control.contains(document.activeElement));
        closeMenu();
        closeLangMenu();
        if (moveFocus) brand.focus({ preventScroll: true });
      }
      compact = next;
      controls.forEach(control => {
        control.inert = compact;
        if (compact) control.setAttribute('aria-hidden', 'true');
        else control.removeAttribute('aria-hidden');
      });
      if (avatar) {
        if (compact) avatar.setAttribute('aria-hidden', 'true');
        else avatar.removeAttribute('aria-hidden');
      }
      header.dataset.headerCompact = String(compact);
    }

    function scheduleMeasure() {
      if (measureFrame) return;
      measureFrame = requestAnimationFrame(() => {
        measureFrame = 0;
        measure();
        update();
      });
    }

    function initialize() {
      cancelAnimationFrame(readyFrame);
      header.classList.remove('header-motion-ready');
      measure();
      update(true);
      // Native history restoration can happen after the deferred script. Sync
      // again before enabling transitions, rather than animating an initial state.
      readyFrame = requestAnimationFrame(() => {
        measure();
        update(true);
        wordmark.getBoundingClientRect();
        readyFrame = requestAnimationFrame(() => header.classList.add('header-motion-ready'));
      });
    }

    if ('ResizeObserver' in window) {
      const observer = new ResizeObserver(scheduleMeasure);
      [header, header.querySelector('.header-inner'), wordmark].forEach(el => observer.observe(el));
    }
    document.fonts?.ready.then(scheduleMeasure);
    window.addEventListener('pageshow', initialize);
    return { update, scheduleMeasure, initialize };
  }

  /* ---------------- init ---------------- */
  // English is the default; only an explicit earlier choice overrides it.
  // Priority: ?lang= in the URL  >  a previously chosen language  >  English.
  let initial = null;
  try {
    const fromUrl = new URL(window.location.href).searchParams.get('lang');
    if (fromUrl && translations[fromUrl]) initial = fromUrl;
  } catch (error) { /* file:// */ }
  if (!initial) {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && translations[saved]) initial = saved;
    } catch (error) { /* private mode */ }
  }
  buildLangMenu();
  applyLanguage(initial || I18N.default);
  initReveals();
  headerController = createHeaderController();
  headerController?.initialize();
})();

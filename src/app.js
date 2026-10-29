(() => {
  'use strict';
  document.querySelector('#year').textContent = new Date().getFullYear();

  const I18N = window.__I18N__ || { default: 'en', languages: [], translations: {} };
  const translations = I18N.translations || {};
  const languages = I18N.languages || [];
  const STORAGE_KEY = 'gofish-language';
  const root = document.documentElement;
  const progressBar = document.querySelector('#reading-progress');
  let progressQueued = false;

  function scheduleProgress() {
    if (progressQueued || !progressBar) return;
    progressQueued = true;
    requestAnimationFrame(() => {
      const scrollable = Math.max(root.scrollHeight, document.body.scrollHeight) - root.clientHeight;
      const progress = scrollable > 0 ? Math.max(0, Math.min(1, window.scrollY / scrollable)) : 0;
      progressBar.style.setProperty('--reading-progress', String(progress));
      progressQueued = false;
    });
  }

  window.addEventListener('scroll', scheduleProgress, { passive: true });
  window.addEventListener('resize', scheduleProgress, { passive: true });
  if ('ResizeObserver' in window) new ResizeObserver(scheduleProgress).observe(document.body);
  scheduleProgress();

  const uiIcon = name => '<svg class="ui-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true" focusable="false"><use href="#ui-sketch-' + name + '"/></svg>';
  let strings = {};
  const t = (key, fallback) => (strings[key] === undefined ? (fallback || '') : strings[key]);
  const currentCode = () => root.getAttribute('data-language') || I18N.default;

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
    Promise.all(scene.getAnimations({ subtree: true }).map(animation => animation.finished.catch(() => {})))
      .then(() => {
        if (activeScenes.get(scene) !== token) return;
        scene.classList.remove('is-scene-playing');
        activeScenes.delete(scene);
      });
  }

  function settleScenes() {
    activeScenes.forEach((_, scene) => scene.classList.remove('is-scene-playing'));
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

  function applyLanguage(code) {
    if (!translations[code]) code = I18N.default;
    const entry = translations[code] || translations[I18N.default];
    if (!entry) return;
    strings = entry.strings || {};
    window.gofishI18n.apply(code);
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
    if (themeToggle) {
      themeToggle.dataset.i18nAria = dark ? 'themeToLight' : 'themeToDark';
      themeToggle.setAttribute('aria-label', t(themeToggle.dataset.i18nAria));
    }
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
})();

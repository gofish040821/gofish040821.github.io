(() => {
  'use strict';
  document.querySelector('#year').textContent = new Date().getFullYear();

  const I18N = window.__I18N__ || { default: 'en', languages: [], translations: {} };
  const translations = I18N.translations || {};
  const languages = I18N.languages || [];
  const STORAGE_KEY = 'gofish-language';
  const root = document.documentElement;
  const BIRTH_DATE = '2004-08-21';
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

  /* ---------------- brief, local sketch gestures ---------------- */
  const sketchMotion = window.matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
  // Delegation also covers the illustrations replaced by language switching.
  document.addEventListener('pointerover', event => {
    if (event.pointerType !== 'mouse' || !sketchMotion.matches) return;
    const sketch = event.target.closest?.('.illustration[data-illustration]');
    if (!sketch || sketch.contains(event.relatedTarget) || sketch.classList.contains('is-sketch-playing')) return;
    if (typeof sketch.getAnimations !== 'function') return;

    // Keep the shared sprite until first use. Local copies let each illustration
    // animate its own parts without changing another instance or its ink paths.
    const use = sketch.querySelector('use');
    if (use) {
      const symbol = document.getElementById(use.getAttribute('href').slice(1));
      if (!symbol) return;
      use.replaceWith(...Array.from(symbol.childNodes, node => node.cloneNode(true)));
      for (const part of ['agent-node', 'cooking-steam']) {
        sketch.querySelectorAll(`[data-sketch-part="${part}"]`).forEach((node, index) => {
          node.style.setProperty('--sketch-delay', `${index * 70}ms`);
        });
      }
    }

    sketch.classList.add('is-sketch-playing');
    // Finish the gesture even if the pointer leaves; re-entry during playback
    // does not stack animations, and resting on an icon never starts a loop.
    Promise.all(sketch.getAnimations({ subtree: true }).map(animation => animation.finished.catch(() => {})))
      .then(() => sketch.classList.remove('is-sketch-playing'));
  });
  sketchMotion.addEventListener('change', () => {
    if (!sketchMotion.matches) {
      document.querySelectorAll('.is-sketch-playing').forEach(sketch => sketch.classList.remove('is-sketch-playing'));
    }
  });

  function initReveals() {
    if (reducedMotion.matches || !('IntersectionObserver' in window)) return;
    const selectors = [
      ['.about .section-aside', 0], ['.about-main', 60],
      ['.research .section-top', 0], ['.research-grid', 60],
      ['.research-notes', 0], ['.research-skills', 0],
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
  const closeButton = document.querySelector('#lightbox-close');
  const lightboxTitle = document.querySelector('#lightbox-title');
  const lightboxDescription = document.querySelector('#lightbox-description');
  const lightboxCount = document.querySelector('#lightbox-count');
  let activeIndex = 0;
  let opener = null;

  function showPhoto(index) {
    if (!photoLinks.length) return;
    activeIndex = (index + photoLinks.length) % photoLinks.length;
    const link = photoLinks[activeIndex];
    const thumbnail = link.querySelector('img');
    fullImage.src = link.href;
    fullImage.alt = thumbnail ? thumbnail.alt : '';
    lightboxTitle.textContent = link.dataset.title || '';
    lightboxDescription.textContent = link.dataset.caption || '';
    lightboxCount.textContent = String(activeIndex + 1).padStart(2, '0') + ' / ' + String(photoLinks.length).padStart(2, '0');
  }

  function bindPhotoLinks() {
    photoLinks.forEach((link, i) => {
      link.addEventListener('click', event => {
        if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
        event.preventDefault();
        opener = link;
        showPhoto(i);
        dialog.showModal();
        document.body.classList.add('modal-open');
        closeButton.focus();
      });
    });
  }

  if (typeof dialog.showModal === 'function') {
    document.querySelector('#lightbox-prev').addEventListener('click', () => showPhoto(activeIndex - 1));
    document.querySelector('#lightbox-next').addEventListener('click', () => showPhoto(activeIndex + 1));
    closeButton.addEventListener('click', () => dialog.close());
    dialog.addEventListener('close', () => { document.body.classList.remove('modal-open'); if (opener) opener.focus(); });
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const box = dialog.getBoundingClientRect();
      if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
    });
    dialog.addEventListener('keydown', event => {
      if (event.key === 'ArrowRight') { event.preventDefault(); showPhoto(activeIndex + 1); }
      if (event.key === 'ArrowLeft') { event.preventDefault(); showPhoto(activeIndex - 1); }
    });
    let touchStart = null;
    fullImage.addEventListener('touchstart', event => {
      touchStart = event.touches.length === 1 ? [event.touches[0].clientX, event.touches[0].clientY] : null;
    }, { passive: true });
    fullImage.addEventListener('touchend', event => {
      if (!touchStart || event.changedTouches.length !== 1) return;
      const dx = event.changedTouches[0].clientX - touchStart[0];
      const dy = event.changedTouches[0].clientY - touchStart[1];
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) showPhoto(activeIndex + (dx < 0 ? 1 : -1));
      touchStart = null;
    }, { passive: true });
  }

  /* ---------------- research details ---------------- */
  const researchGrid = document.querySelector('.research-grid');
  const expandedResearch = new Set();

  function syncResearchDetails() {
    researchGrid.querySelectorAll('.research-more').forEach(button => {
      const expanded = expandedResearch.has(button.dataset.researchKey);
      const panel = document.getElementById(button.getAttribute('aria-controls'));
      button.setAttribute('aria-expanded', String(expanded));
      if (panel) panel.hidden = !expanded;
      button.querySelector('[data-research-label]').textContent = t(expanded ? 'researchLess' : 'researchMore');
    });
  }

  researchGrid.addEventListener('click', event => {
    const button = event.target.closest('.research-more');
    if (!button) return;
    const key = button.dataset.researchKey;
    if (expandedResearch.has(key)) expandedResearch.delete(key);
    else expandedResearch.add(key);
    syncResearchDetails();
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
          ? text.replace(/\b(Agent RSI|Physical AI)\b/g, '<bdi class="research-name" dir="ltr" lang="en">$1</bdi>')
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
    translateStatic(entry);
    if (strings.metaTitle) document.title = strings.metaTitle;
    if (dialog.open) dialog.close();
    closeMenu();
    closeLangMenu();
    bindGallery();
    bindSkills();
    syncResearchDetails();
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

(() => {
  'use strict';
  document.querySelector('#year').textContent = new Date().getFullYear();

  const I18N = window.__I18N__ || { default: 'en', languages: [], translations: {} };
  const translations = I18N.translations || {};
  const languages = I18N.languages || [];
  const STORAGE_KEY = 'gofish-language';
  const root = document.documentElement;

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
  });
  menu.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !menu.hidden) { closeMenu(); menuButton.focus(); }
  });
  window.matchMedia('(min-width: 761px)').addEventListener('change', event => { if (event.matches) closeMenu(); });

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
    const mark = galleryExpanded ? '&minus;' : '&#43;';
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
    if (!galleryExpanded) document.querySelector('#gallery').scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  });

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
      const attrs = ' data-code="' + item.code + '" lang="' + (item.lang || item.code) + '"' + (item.dir === 'rtl' ? ' dir="rtl"' : '');
      const selected = item.code === currentCode() ? 'true' : 'false';
      return '<button type="button" role="option" class="lang-option"' + attrs + ' aria-selected="' + selected + '">' + item.label + '</button>';
    }).join('');
  }

  // Swap every node the template marked: plain strings, aria labels, and the
  // pre-rendered content sections. Runs on init and on every switch.
  function translateStatic(entry) {
    const text = entry.strings || {};
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const value = text[el.dataset.i18n];
      if (value !== undefined) el.innerHTML = value;
    });
    document.querySelectorAll('[data-i18n-aria]').forEach(el => {
      const value = text[el.dataset.i18nAria];
      if (value !== undefined) el.setAttribute('aria-label', value);
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
    buildLangMenu();
    renderThemeToggle();
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
})();

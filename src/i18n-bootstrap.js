// Inlined after the dictionary. Localize before revealing the first frame,
// independently of the download time of the deferred interaction script.
(() => {
  'use strict';
  const root = document.documentElement;
  const dictionary = window.__I18N__;
  const escape = value => String(value).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  function apply(code) {
    const entry = dictionary.translations[code];
    const language = dictionary.languages.find(item => item.code === code);
    const strings = entry.strings;
    if (root.dataset.language !== code) {
      document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.dataset.i18n;
        const text = escape(strings[key]);
        el.innerHTML = key === 'headline'
          ? text.replace(/\b(Agent RSI|Physical AI)\b/g, '<bdi class="research-name" dir="ltr" lang="en">$1</bdi>')
          : text;
      });
      document.querySelectorAll('[data-i18n-section]').forEach(el => {
        el.innerHTML = entry.sections[el.dataset.i18nSection];
      });
    }
    const themeToggle = document.querySelector('#theme-toggle');
    themeToggle.dataset.i18nAria = root.dataset.theme === 'dark' ? 'themeToLight' : 'themeToDark';
    document.querySelectorAll('[data-i18n-aria]').forEach(el => {
      el.setAttribute('aria-label', strings[el.dataset.i18nAria]);
    });
    root.dataset.language = code;
    root.lang = language.lang || code;
    root.dir = language.dir || 'ltr';
    document.querySelector('.lang-current').textContent = language.label;
    document.querySelector('.menu-toggle').setAttribute('aria-label', strings.menuOpen);
    document.title = strings.metaTitle;
    document.querySelector('meta[name="description"]').content = strings.metaDescription;
    document.querySelector('meta[property="og:description"]').content = strings.metaDescription;
    document.querySelector('meta[property="og:title"]').content = strings.metaTitle;
    document.querySelector('meta[property="og:locale"]').content = language.locale;
    // Query languages cannot have different source HTML on GitHub Pages.
    // Inject one canonical rather than contradicting a static English canonical.
    const canonical = document.querySelector('link[rel="canonical"]') || document.createElement('link');
    canonical.rel = 'canonical';
    canonical.href = dictionary.siteUrl + '/?lang=' + code;
    if (!canonical.isConnected) document.head.append(canonical);
    document.querySelector('meta[property="og:url"]').content = canonical.href;
  }
  function showAll() {
    root.dataset.appUnavailable = 'true';
    document.querySelectorAll('.photo-card, .skill-badge, .research-details, #mobile-nav').forEach(el => { el.hidden = false; });
    document.querySelectorAll('#skills-toggle, #gallery-toggle, .research-more, .menu-toggle, #theme-toggle, #lang-switch').forEach(el => { el.hidden = true; });
    root.removeAttribute('data-i18n-pending');
  }
  window.gofishI18n = { apply, showAll };
  try {
    let code = new URL(location.href).searchParams.get('lang');
    if (!dictionary.translations[code]) {
      try { code = localStorage.getItem('gofish-language'); } catch { /* private mode */ }
    }
    if (!dictionary.translations[code]) code = dictionary.default;
    apply(code);
    for (const [selector, limit, toggleId, key] of [
      ['.photo-card', 4, '#gallery-toggle', 'galleryExpand'],
      ['.skill-badge', 6, '#skills-toggle', 'skillsExpand']
    ]) {
      const items = [...document.querySelectorAll(selector)];
      items.forEach((item, index) => { item.hidden = index >= limit; });
      const button = document.querySelector(toggleId);
      button.hidden = items.length <= limit;
      const icon = button.querySelector('svg').outerHTML;
      button.innerHTML = escape(dictionary.translations[code].strings[key].replace('{n}', items.length)) + ' ' + icon;
    }
    if (window.gofishAppFailed) showAll();
  } catch (error) {
    console.error('Could not initialize page language', error);
    showAll();
  } finally {
    // Existing font files are unchanged. Wait for their first layout to avoid
    // moving the translated text after it becomes visible.
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => root.removeAttribute('data-i18n-pending'));
  }
})();

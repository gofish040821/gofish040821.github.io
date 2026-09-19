(() => {
  'use strict';
  document.querySelector('#year').textContent = new Date().getFullYear();
  const menuButton = document.querySelector('.menu-toggle');
  const menu = document.querySelector('#mobile-nav');
  function closeMenu() {
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', '展开导航');
    menu.hidden = true;
  }
  menuButton.addEventListener('click', () => {
    const expanded = menuButton.getAttribute('aria-expanded') !== 'true';
    menuButton.setAttribute('aria-expanded', String(expanded));
    menuButton.setAttribute('aria-label', expanded ? '收起导航' : '展开导航');
    menu.hidden = !expanded;
  });
  menu.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !menu.hidden) { closeMenu(); menuButton.focus(); }
  });
  window.matchMedia('(min-width: 761px)').addEventListener('change', event => { if (event.matches) closeMenu(); });
  const links = [...document.querySelectorAll('.desktop-nav a')];
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const link = links.find(a => a.hash === '#' + entry.target.id);
        if (entry.isIntersecting) {
          links.forEach(a => a.removeAttribute('aria-current'));
          link?.setAttribute('aria-current', 'location');
        } else link?.removeAttribute('aria-current');
      });
    }, { rootMargin: '-10% 0px -60% 0px', threshold: 0 });
    links.forEach(link => observer.observe(document.querySelector(link.hash)));
  }

  const cards = [...document.querySelectorAll('.photo-card')];
  const photoLinks = [...document.querySelectorAll('.photo-link')];
  const galleryToggle = document.querySelector('#gallery-toggle');
  const initialCount = 4;
  if (cards.length > initialCount) {
    galleryToggle.hidden = false;
    cards.slice(initialCount).forEach(card => { card.hidden = true; });
    galleryToggle.innerHTML = `展开全部 ${cards.length} 张照片 <span aria-hidden="true">＋</span>`;
    galleryToggle.addEventListener('click', () => {
      const expanded = galleryToggle.getAttribute('aria-expanded') !== 'true';
      galleryToggle.setAttribute('aria-expanded', String(expanded));
      cards.slice(initialCount).forEach(card => { card.hidden = !expanded; });
      galleryToggle.innerHTML = expanded ? '收起相册 <span aria-hidden="true">−</span>' : `展开全部 ${cards.length} 张照片 <span aria-hidden="true">＋</span>`;
      if (!expanded) document.querySelector('.gallery-heading').scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    });
  }
  const dialog = document.querySelector('#lightbox');
  if (typeof dialog.showModal !== 'function') return;
  let activeIndex = 0;
  let opener = null;
  const fullImage = document.querySelector('#lightbox-image');
  const closeButton = document.querySelector('#lightbox-close');
  function showPhoto(index) {
    activeIndex = (index + photoLinks.length) % photoLinks.length;
    const link = photoLinks[activeIndex];
    const thumbnail = link.querySelector('img');
    fullImage.src = link.href;
    fullImage.alt = thumbnail.alt;
    document.querySelector('#lightbox-title').textContent = link.dataset.title;
    document.querySelector('#lightbox-description').textContent = link.dataset.caption;
    document.querySelector('#lightbox-count').textContent = `${String(activeIndex + 1).padStart(2, '0')} / ${String(photoLinks.length).padStart(2, '0')}`;
  }
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
  document.querySelector('#lightbox-prev').addEventListener('click', () => showPhoto(activeIndex - 1));
  document.querySelector('#lightbox-next').addEventListener('click', () => showPhoto(activeIndex + 1));
  closeButton.addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => { document.body.classList.remove('modal-open'); opener?.focus(); });
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
    if (event.touches.length === 1) touchStart = [event.touches[0].clientX, event.touches[0].clientY];
    else touchStart = null;
  }, { passive: true });
  fullImage.addEventListener('touchend', event => {
    if (!touchStart || event.changedTouches.length !== 1) return;
    const dx = event.changedTouches[0].clientX - touchStart[0];
    const dy = event.changedTouches[0].clientY - touchStart[1];
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) showPhoto(activeIndex + (dx < 0 ? 1 : -1));
    touchStart = null;
  }, { passive: true });
})();

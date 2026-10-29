"""Browser checks: python scripts/check-site.py [base URL] [screenshot directory].

Requires playwright, html5lib and Pillow. Uses installed Chrome, or set CHROME_PATH.
Start python -m http.server 4173 --bind 127.0.0.1 --directory dist first.
"""
import asyncio
from collections import Counter
import json
import os
from pathlib import Path
import sys
from urllib.parse import urljoin
from urllib.request import urlopen

import html5lib
from PIL import Image
from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parents[1]
BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://127.0.0.1:4173'
OUTPUT = Path(sys.argv[2]) if len(sys.argv) > 2 else None
I18N = json.loads((ROOT/'src/i18n.json').read_text(encoding='utf-8'))

def check_html_and_images():
    parser = html5lib.HTMLParser()
    document = parser.parse((ROOT/'dist/index.html').read_text(encoding='utf-8'))
    assert not parser.errors, parser.errors
    counts = Counter(el.attrib['id'] for el in document.iter() if 'id' in el.attrib)
    assert not [key for key, count in counts.items() if count > 1], 'Duplicate IDs'
    paths = set()
    for el in document.iter():
        if el.tag.endswith('}img'):
            if el.get('src'): paths.add(el.get('src'))
            assert '：' not in el.get('alt', '')
            for item in el.get('srcset', '').split(','):
                if not item.strip(): continue
                path, descriptor = item.strip().split()
                paths.add(path)
                image = Image.open(ROOT/'dist'/path)
                assert image.width == int(descriptor[:-1]), (path, descriptor, image.width)
    paths.update(['./assets/og-cover.jpg'])
    for path in paths:
        with urlopen(urljoin(BASE, path)) as response:
            assert response.status == 200, path
    assert Image.open(ROOT/'dist/assets/og-cover.jpg').size == (1200, 630)
    print(f'HTML5 parsing: 0 errors; duplicate IDs: 0; image paths: {len(paths)} OK')

FRAME_SCRIPT = """(() => {
  window.__frames = []; window.__shifts = [];
  new PerformanceObserver(list => {
    for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.__shifts.push(entry.value);
  }).observe({ type: 'layout-shift', buffered: true });
  function record() {
    const el = document.querySelector('.hero-description');
    if (el && getComputedStyle(el).visibility === 'visible') {
      const row = {text: el.textContent, lang: document.documentElement.lang, dir: document.documentElement.dir};
      if (!window.__frames.length || JSON.stringify(window.__frames.at(-1)) !== JSON.stringify(row)) window.__frames.push(row);
    }
    requestAnimationFrame(record);
  }
  requestAnimationFrame(record);
})();"""

async def load(page, code):
    await page.goto(f'{BASE}/?lang={code}', wait_until='load')
    await page.wait_for_function("!document.documentElement.hasAttribute('data-i18n-pending')")
    await page.wait_for_timeout(600)

async def browser_checks():
    async with async_playwright() as p:
        chrome = os.environ.get('CHROME_PATH', r'C:\Program Files\Google\Chrome\Application\chrome.exe')
        browser = await p.chromium.launch(executable_path=chrome, headless=True)
        for width, height in [(1365, 1000), (390, 844)]:
            for code in ['en', 'zh', 'ar']:
                context = await browser.new_context(viewport={'width': width, 'height': height}, device_scale_factor=1)
                await context.add_init_script(FRAME_SCRIPT)
                # Third-party visitor counts are not part of deterministic site checks.
                await context.route('**/*', lambda route: route.continue_() if route.request.url.startswith(BASE) else route.abort())
                page = await context.new_page()
                errors = []
                page.on('pageerror', lambda error: errors.append(str(error)))
                await load(page, code)
                strings = I18N['translations'][code]['strings']
                frames = await page.evaluate('window.__frames')
                assert frames and all(f['text'] == strings['intro'] for f in frames), frames
                assert await page.get_attribute('html', 'dir') == ('rtl' if code == 'ar' else 'ltr')
                assert await page.locator('.hero-copy').evaluate('(el) => getComputedStyle(el).direction') == ('rtl' if code == 'ar' else 'ltr')
                assert await page.evaluate('document.documentElement.scrollWidth <= innerWidth'), 'Horizontal overflow'
                cls = await page.evaluate('window.__shifts.reduce((a,b)=>a+b,0)')
                assert cls < 0.001, ('Layout shift', code, width, cls)
                assert await page.locator('meta[name="description"]').get_attribute('content') == strings['metaDescription']
                assert await page.locator('meta[property="og:description"]').get_attribute('content') == strings['metaDescription']
                assert await page.locator('link[rel="canonical"]').get_attribute('href') == f'https://gofish040821.github.io/?lang={code}'
                assert await page.locator('link[rel="alternate"]').count() == 15
                await page.keyboard.press('Tab')
                assert await page.locator('.skip-link').evaluate('(el) => el === document.activeElement && el.getBoundingClientRect().top >= 0')
                await page.keyboard.press('Enter')
                assert await page.evaluate("document.activeElement.id === 'main'")
                await page.keyboard.press('Tab')
                assert await page.evaluate("document.activeElement.getAttribute('href') === '#research'")
                toggle = page.locator('#theme-toggle')
                assert await toggle.get_attribute('aria-label') == strings['themeToDark']
                await toggle.click()
                assert await toggle.get_attribute('aria-label') == strings['themeToLight']
                await page.reload(wait_until='load')
                assert await page.get_attribute('html', 'data-theme') == 'dark'
                assert await toggle.get_attribute('aria-label') == strings['themeToLight']
                await toggle.click()
                if width < 1200:
                    await page.locator('.menu-toggle').focus()
                    await page.keyboard.press('ArrowDown')
                    assert await page.evaluate("document.activeElement.closest('#mobile-nav') !== null")
                    await page.keyboard.press('Escape')
                    assert await page.evaluate("document.activeElement.matches('.menu-toggle')")
                # Keyboard activation, trapped dialog focus, and restoration.
                link = page.locator('.photo-link').first
                await link.focus()
                await page.keyboard.press('Enter')
                await page.wait_for_function("document.querySelector('#lightbox').open")
                await page.wait_for_timeout(500)
                for _ in range(5):
                    await page.keyboard.press('Tab')
                    # Chromium may briefly focus browser chrome (body is the
                    # reported active element); no background control may focus.
                    assert await page.evaluate("document.activeElement === document.body || document.activeElement.closest('#lightbox') !== null")
                await page.keyboard.press('Escape')
                await page.wait_for_function("!document.querySelector('#lightbox').open")
                assert await link.evaluate('(el) => el === document.activeElement')
                assert not errors, errors
                if OUTPUT:
                    OUTPUT.mkdir(parents=True, exist_ok=True)
                    await page.evaluate('scrollTo(0,0)')
                    await page.wait_for_timeout(400)
                    await page.screenshot(path=str(OUTPUT/f'{code}-{width}.png'), full_page=True)
                hero = await page.locator('.photo-mat img').evaluate('(el) => ({src:el.currentSrc, width:el.naturalWidth})')
                print(f'{code} {width}px: first visible language OK; CLS={cls:.6f}; keyboard/theme/RTL/meta OK; hero={hero}')
                await context.close()

        context = await browser.new_context(viewport={'width': 390, 'height': 844}, java_script_enabled=False)
        page = await context.new_page()
        await page.goto(BASE, wait_until='load')
        assert await page.locator('#mobile-nav').is_visible()
        content = json.loads((ROOT/'content.json').read_text(encoding='utf-8'))
        assert await page.locator('.skill-badge:visible').count() == len(content['skills']) + len(content['agentSkills'])
        assert await page.locator('.research-details:visible').count() == 2
        assert await page.locator('.photo-card:visible').count() == 14
        assert await page.locator('.photo-mat').evaluate("el=>el.getBoundingClientRect().width > 0")
        print('JavaScript disabled: mobile nav, all skills, research details and all photos visible')
        await context.close()

        context = await browser.new_context(viewport={'width': 1365, 'height': 1000})
        await context.route('**/*', lambda route: route.continue_() if route.request.url.startswith(BASE) else route.abort())
        await context.add_init_script(FRAME_SCRIPT)
        async def delay_app(route):
            await asyncio.sleep(2)
            await route.continue_()
        await context.route('**/app.js?*', delay_app)
        page = await context.new_page()
        await load(page, 'zh')
        assert all(f['text'] == I18N['translations']['zh']['strings']['intro'] for f in await page.evaluate('window.__frames'))
        assert await page.evaluate('window.__shifts.reduce((a,b)=>a+b,0)') < .001
        print('App script delayed 2 seconds: no English frame or layout shift')
        await context.close()

        context = await browser.new_context(viewport={'width': 390, 'height': 844})
        await context.route('**/*', lambda route: route.continue_() if route.request.url.startswith(BASE) else route.abort())
        await context.route('**/app.js?*', lambda route: route.abort())
        page = await context.new_page()
        await load(page, 'ar')
        assert await page.locator('.hero-description').inner_text() == I18N['translations']['ar']['strings']['intro']
        assert await page.locator('.photo-card:visible').count() == 14
        assert await page.locator('#mobile-nav').is_visible()
        print('App script unavailable: translated readable fallback and all photos visible')
        await context.close()

        context = await browser.new_context(viewport={'width': 1365, 'height': 1000}, device_scale_factor=2)
        await context.route('**/*', lambda route: route.continue_() if route.request.url.startswith(BASE) else route.abort())
        page = await context.new_page()
        await load(page, 'en')
        hero = await page.locator('.photo-mat img').evaluate('(el) => el.currentSrc')
        assert hero.endswith('mountains-medium.webp'), hero
        await page.locator('#theme-toggle').click()
        for language in I18N['languages']:
            code = language['code']
            await page.locator('.lang-toggle').click()
            await page.locator(f'.lang-option[data-code="{code}"]').click()
            assert await page.locator('#theme-toggle').get_attribute('aria-label') == I18N['translations'][code]['strings']['themeToLight']
            assert await page.locator('link[rel="canonical"]').get_attribute('href') == f'https://gofish040821.github.io/?lang={code}'
        await page.goto(BASE+'/?lang=en', wait_until='load')
        assert await page.get_attribute('html', 'data-language') == 'en', 'URL must override saved language'
        await page.evaluate("localStorage.setItem('gofish-language','zh')")
        await page.goto(BASE, wait_until='load')
        assert await page.get_attribute('html', 'data-language') == 'zh'
        print('14 language switches: dark-mode labels and canonical OK; URL overrides saved language; saved choice works; DPR 2 uses 1200px hero')
        await context.close()
        await browser.close()

if __name__ == '__main__':
    check_html_and_images()
    asyncio.run(browser_checks())

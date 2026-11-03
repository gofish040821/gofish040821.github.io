"""Run against npm run preview with Python Playwright and Chrome installed."""
import argparse
import json
import re
import secrets
from pathlib import Path
from urllib.parse import urlparse

from playwright.sync_api import sync_playwright


def check_denials(page):
    field = page.locator('#gate-input')
    for i, message in enumerate(['你干嘛哈哈哎哟', '哦呀哈哈Amagi', '再练两年半吧']):
        field.fill('invalid-browser-fixture-' + str(i))
        assert page.locator('#gate-error').is_hidden()
        field.press('Enter')
        assert page.locator('#gate-error').inner_text() == message
        assert field.get_attribute('aria-invalid') == 'true'
        assert page.locator('main').evaluate('(e) => e.inert')
        assert page.locator('.gate-success').count() == 0
    field.fill('')
    assert field.get_attribute('aria-invalid') is None
    toggle = page.locator('#gate-visibility')
    for expected in ['text', 'password']:
        toggle.focus()
        toggle.press('Space')
        assert field.get_attribute('type') == expected
        assert toggle.get_attribute('aria-pressed') == str(expected == 'text').lower()


def success_fixture(page, url):
    # Change only the expected digest in an intercepted LOCAL document. The
    # random fixture credential never goes into a file or a production build.
    value = secrets.token_hex(16)
    digest = 5381
    for char in value:
        digest = ((digest * 33) ^ ord(char)) & 0xffffffff

    def serve_fixture(route):
        response = route.fetch()
        html, count = re.subn(r'var KEY_HASH = \d+;', f'var KEY_HASH = {digest};', response.text())
        assert count == 1
        route.fulfill(response=response, body=html)

    page.route(url, serve_fixture)
    return value


def run(url, evidence):
    assert urlparse(url).hostname in ('localhost', '127.0.0.1', '::1')
    evidence.mkdir(parents=True, exist_ok=True)
    report = []
    with sync_playwright() as pw:
        browser = pw.chromium.launch(channel='chrome')
        for width, height in [(1440, 900), (1280, 720), (768, 900), (390, 844), (320, 568)]:
            for theme in ['light', 'dark']:
                context = browser.new_context(viewport={'width': width, 'height': height})
                context.add_init_script(f"localStorage.setItem('gofish-theme','{theme}')")
                context.route('**/*busuanzi*', lambda route: route.abort())
                page = context.new_page()
                errors = []
                page.on('pageerror', lambda error: errors.append(str(error)))
                page.goto(url + ('?lang=en' if theme == 'light' else '?lang=zh'))
                actors = page.locator('#gate-stage button:visible')
                expected = 3 if width >= 1024 else 2 if width >= 620 else 1
                page.wait_for_function(
                    '(n)=>document.querySelectorAll("#gate-stage button:not([hidden]) canvas:not([hidden])").length===n',
                    arg=expected)
                assert actors.count() == expected
                assert page.locator('.gate-brand').count() == 0
                assert page.locator('#main').evaluate('(e)=>e.inert')
                assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
                page.screenshot(path=str(evidence / f'gate-{width}-{theme}.png'))
                check_denials(page)
                assert not errors, errors
                report.append(dict(width=width, height=height, theme=theme, actors=expected))
                context.close()

        for mode in ['normal', 'reduced', 'part-offline', 'module-offline']:
            context = browser.new_context(viewport={'width': 1440, 'height': 900},
                                          reduced_motion='reduce' if mode == 'reduced' else 'no-preference')
            context.route('**/*busuanzi*', lambda route: route.abort())
            page = context.new_page()
            errors = []
            page.on('pageerror', lambda error: errors.append(str(error)))
            if mode == 'part-offline':
                page.route('**/torso.webp', lambda route: route.abort())
            elif mode == 'module-offline':
                page.route('**/gate-mascots.js', lambda route: route.abort())
            document_url = url + '?lang=en'
            fixture = success_fixture(page, document_url)
            page.goto(document_url)
            if mode == 'module-offline':
                page.locator('.gate-fallback').wait_for(state='visible')
            elif mode in ('reduced', 'part-offline'):
                page.locator('#gate-stage button:visible img:visible').first.wait_for()
                if mode == 'reduced':
                    assert page.locator('#gate-stage button:visible').count() == 1
            else:
                page.locator('#gate-stage canvas:visible').first.wait_for()
            check_denials(page)
            field = page.locator('#gate-input')
            field.fill(' ' + fixture.upper() + ' ')
            page.evaluate("""() => {
              const gate = document.querySelector('#gate');
              const log = window.gateReview = { beats: [] };
              gate.querySelector('form').addEventListener('submit', () => {
                log.start = performance.now();
              }, { capture: true, once: true });
              const observer = new MutationObserver(() => {
                if (!gate.isConnected) {
                  log.unlockMs = Math.round(performance.now() - log.start);
                  observer.disconnect();
                  return;
                }
                const actors = [...gate.querySelectorAll('button[data-behavior="celebration"]:not([hidden])')];
                if (!actors.length) return;
                const actions = actors.map(el => el.dataset.action).join('/');
                if (log.beats.at(-1)?.actions !== actions) {
                  log.beats.push({ ms: Math.round(performance.now() - log.start), actions });
                }
              });
              observer.observe(document.body, { subtree: true, childList: true,
                attributes: true, attributeFilter: ['data-action', 'data-behavior'] });
            }""")
            field.press('Enter')
            assert page.locator('#gate-error').inner_text() == '哇真的是你呀'
            assert page.locator('.gate-success').evaluate('(e)=>parseFloat(getComputedStyle(e).fontSize)>=36')
            if mode == 'reduced':
                assert page.locator('.gate-success').evaluate('(e)=>getComputedStyle(e).animationName') == 'none'
            # Duplicate submissions during celebration cannot restart the
            # timeline, append another success message, or unlock early.
            page.evaluate('document.querySelector("#gate-form").requestSubmit()')
            assert page.locator('.gate-success').count() == 1
            assert page.locator('main').evaluate('(e)=>e.inert')
            if mode == 'normal':
                page.wait_for_timeout(1000)
                page.screenshot(path=str(evidence / 'celebration.png'))
            page.locator('#gate').wait_for(state='detached', timeout=6500)
            assert page.locator('.gate-mascot, #gate-stage, .gate-fallback').count() == 0
            timeline = page.evaluate('window.gateReview')
            if mode == 'normal':
                assert [b['actions'] for b in timeline['beats']] == [
                    'surprise/surprise/surprise', 'wave/jump/dance',
                    'cheer/toss/highfive', 'bow/laugh/laugh'
                ], timeline
            assert not page.locator('main').evaluate('(e)=>e.inert')
            assert page.locator('.brand').evaluate('(e)=>e===document.activeElement')
            assert page.evaluate('!document.body.classList.contains("gate-locked")')
            page.evaluate('scrollTo({top:650,behavior:"instant"})')
            page.wait_for_function('document.querySelector(".site-header").dataset.headerCompact==="true"')
            assert not errors, errors
            report.append(dict(successFixture=mode, **timeline))
            context.close()
        browser.close()
    (evidence / 'gate-flow.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
    print('Gate interaction checks passed.', len(report), 'cases.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--url', default='http://127.0.0.1:4173/')
    parser.add_argument('--evidence', type=Path, required=True)
    args = parser.parse_args()
    run(args.url.rstrip('/') + '/', args.evidence)

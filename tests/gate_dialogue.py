"""Exercise mascot replies and the success message against a local preview."""
import argparse
import hashlib
import re
import secrets
from pathlib import Path
from urllib.parse import urlparse

from playwright.sync_api import sync_playwright


def run(url, evidence):
    assert urlparse(url).hostname in ('localhost', '127.0.0.1', '::1')
    evidence.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(channel='chrome')
        for width, height, reduced in [(1440, 900, False), (390, 844, False),
                                       (320, 568, False), (390, 844, True)]:
            context = browser.new_context(viewport={'width': width, 'height': height},
                                          reduced_motion='reduce' if reduced else 'no-preference')
            context.route('**/*busuanzi*', lambda route: route.abort())
            page = context.new_page()
            errors = []
            page.on('pageerror', lambda error: errors.append(str(error)))
            page.goto(url, wait_until='domcontentloaded')
            page.wait_for_selector('#gate-stage .gate-mascot:not([hidden])')
            count = page.locator('#gate-stage .gate-mascot:visible').count()
            assert count == (1 if reduced else (3 if width >= 1024 else 2))
            assert '输入正确的key才能查看哦' in page.locator('#gate-guide').inner_text()
            assert page.locator('#gate-title').is_visible()
            assert page.locator('#gate-title').inner_text() == '只因名？'
            for attempt in range(3):
                page.locator('#gate-input').fill('incorrect-' + str(attempt))
                page.locator('#gate-input').press('Enter')
                page.wait_for_function('!document.querySelector("#gate-error").hidden')
                assert page.locator('#gate-title').is_visible()
                bubble = page.locator('.gate-mascot-dialogue')
                bubble.wait_for(state='visible')
                speaker = page.locator('#gate-stage .gate-mascot:visible').nth(attempt % count)
                page.wait_for_function('(name) => document.querySelector(".gate-mascot-dialogue").dataset.speaker === name',
                                       arg=speaker.get_attribute('data-mascot'))
                assert bubble.inner_text() == page.locator('#gate-error').inner_text()
                if attempt == 0 and width in (1440, 390) and not reduced:
                    page.screenshot(path=str(evidence / f'error-{width}.png'))
                page.locator('#gate-input').fill('next attempt')
                assert bubble.is_hidden() and page.locator('#gate-error').is_hidden()
                assert page.locator('#gate-title').is_visible()
            assert not errors, errors
            context.close()

        context = browser.new_context(viewport={'width': 390, 'height': 844}, has_touch=True)
        context.route('**/*busuanzi*', lambda route: route.abort())
        page = context.new_page()
        credential = secrets.token_hex(16)
        digest = hashlib.sha256(credential.encode()).hexdigest()
        def fixture(route):
            response = route.fetch()
            html, count = re.subn(r'var GATE_HASH = "[0-9a-f]{64}";',
                                  f'var GATE_HASH = "{digest}";', response.text())
            assert count == 1
            route.fulfill(response=response, body=html)
        page.route(url, fixture)
        page.goto(url, wait_until='domcontentloaded')
        page.locator('#gate-input').fill(credential)
        page.locator('.gate-submit').click()
        page.locator('.gate-success').wait_for(state='visible')
        assert page.locator('.gate-success').inner_text() == '哇真的是你呀'
        assert page.locator('#gate-title').is_hidden()
        assert page.locator('#gate-guide').is_hidden()
        page.wait_for_timeout(800)
        page.screenshot(path=str(evidence / 'success-390.png'))
        page.locator('#gate').wait_for(state='detached', timeout=8000)
        assert not page.locator('#main').evaluate('(el) => el.inert')
        context.close()
        browser.close()
    print('Mascot replies and success: 5 cases passed.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--url', default='http://127.0.0.1:4173/')
    parser.add_argument('--evidence', type=Path, required=True)
    args = parser.parse_args()
    run(args.url.rstrip('/') + '/', args.evidence)

"""Check locally that each supplied clip follows its validation result."""
import argparse
import hashlib
import re
import secrets
from urllib.parse import urlparse

from playwright.sync_api import sync_playwright


def run(url):
    assert urlparse(url).hostname in ('localhost', '127.0.0.1', '::1')
    with sync_playwright() as p:
        browser = p.chromium.launch(channel='chrome', args=['--mute-audio'])
        for width, height in [(1440, 900), (390, 844)]:
            context = browser.new_context(viewport={'width': width, 'height': height})
            context.route('**/*busuanzi*', lambda route: route.abort())
            context.add_init_script("""(() => {
              window.feedbackStarts = 0;
              window.voiceTestNext = 0;
              const start = AudioBufferSourceNode.prototype.start;
              AudioBufferSourceNode.prototype.start = function(...args) {
                window.feedbackStarts++; return start.apply(this, args);
              };
            })()""")
            page = context.new_page()
            fixture = secrets.token_hex(16)
            digest = hashlib.sha256(fixture.encode()).hexdigest()
            def route_page(route):
                response = route.fetch()
                html, count = re.subn(r'var GATE_HASH = "[0-9a-f]{64}";',
                                      f'var GATE_HASH = "{digest}";', response.text())
                assert count == 1
                # Exercise each choice in a local response without changing the
                # production random picker or the homepage's actual key.
                html, count = re.subn(r'Math\.floor\(Math\.random\(\) \* laterErrorSounds\.length\)',
                                      '(window.voiceTestNext++ % laterErrorSounds.length)', html)
                assert count == 1
                route.fulfill(response=response, body=html)
            page.route(url, route_page)
            requests = []
            page.on('request', lambda request: requests.append(request.url)
                    if '/gate-audio/' in request.url else None)
            page.goto(url, wait_until='domcontentloaded')
            assert not requests
            for attempt, filename in enumerate(['first-error.mp3', 'second-error.mp3']):
                page.locator('#gate-input').fill('incorrect-' + str(attempt))
                page.locator('#gate-input').press('Enter')
                page.wait_for_function('(n) => window.feedbackStarts === n', arg=attempt + 1)
                assert requests[-1].endswith(filename), requests
            for index, filename in enumerate(['late-kunge.mp3', 'late-practice.mp3',
                                               'late-annoyed.mp3', 'late-surprised.mp3']):
                page.locator('#gate-input').fill('incorrect-later-' + str(index))
                page.locator('#gate-input').press('Enter')
                page.wait_for_function('(n) => window.feedbackStarts === n', arg=index + 3)
                assert requests[-1].endswith(filename), requests
                assert page.locator('#gate-error').inner_text() == '再练两年半吧'
            page.locator('#gate-input').fill(fixture)
            page.locator('#gate-input').press('Enter')
            page.wait_for_function('window.feedbackStarts === 7')
            assert requests[-1].endswith('success.mp3'), requests
            page.locator('#gate').wait_for(state='detached', timeout=8000)
            context.close()
        browser.close()
    print('Feedback audio mapping passed at desktop and phone sizes.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--url', default='http://127.0.0.1:4173/')
    args = parser.parse_args()
    run(args.url.rstrip('/') + '/')

"""Real-time browser soak; test-only access never reaches the production bundle."""
import argparse
import json
from pathlib import Path
from urllib.parse import urlparse

from playwright.sync_api import sync_playwright


def capture_controller(route):
    response = route.fetch()
    source = response.text()
    needle = 'this.animate = time => this.step(time);'
    assert source.count(needle) == 1
    route.fulfill(response=response, body=source.replace(
        needle, needle + '\n    window.mascotReview = this;'))


SAMPLER = """() => {
  const ctl = window.mascotReview;
  const r = window.soak = { start: performance.now(), frames: 0, intervals: [],
    collisions: 0, outside: 0, teleports: [], flips: [], simultaneousMs: 0,
    activeMs: 0, actions: [], actors: ctl.actors.map(a => ({
      id: a.slot.id, actions: {}, travel: 0, moves: [], idleMs: 0
    })) };
  const old = ctl.actors.map(() => ({}));
  const overlap = (a,b) => a.left < b.right - .5 && a.right > b.left + .5 &&
    a.top < b.bottom - .5 && a.bottom > b.top + .5;
  let last = performance.now();
  function frame(now) {
    if (r.done) return;
    const dt = now - last; last = now; r.frames++;
    if (dt < 250) r.intervals.push(dt);
    const card = ctl.card.getBoundingClientRect();
    const boxes = ctl.actors.filter(a => a.slot.visible).map(a => a.slot.button.getBoundingClientRect());
    boxes.forEach((b,i) => {
      if (overlap(b,card) || boxes.slice(i+1).some(c => overlap(b,c))) r.collisions++;
      if (b.left < -.5 || b.top < -.5 || b.right > innerWidth+.5 || b.bottom > innerHeight+.5) r.outside++;
    });
    const active = ctl.actors.filter(a => a.action !== 'idle');
    if (active.length > 1) {
      r.activeMs += dt;
      if (new Set(active.map(a => a.action)).size < active.length) r.simultaneousMs += dt;
    }
    ctl.actors.forEach((a,i) => {
      const s = a.slot, prev = old[i], rec = r.actors[i];
      const x = s.x, y = s.y - s.liftY;
      if (Number.isFinite(prev.x)) {
        const d = Math.hypot(x-prev.x,y-prev.y);
        if (d > 0) rec.travel += d;
        if (d > Math.max(12, dt*.7)) r.teleports.push({ ms: now-r.start, actor:i, d, dt });
        if (s.button.dataset.facing !== prev.facing && d > .02) {
          const dx = x-prev.x;
          r.flips.push({ms:now-r.start, actor:i, action:a.action, facing:s.button.dataset.facing, dx});
        }
      }
      if (a.start !== prev.start || a.action !== prev.action) {
        rec.actions[a.action] = (rec.actions[a.action] || 0) + 1;
        r.actions.push({ ms:Math.round(now-r.start), actor:i, action:a.action, source:a.source });
        if (s.route) rec.moves.push({x,y,target:s.destination,legs:s.route.path.length});
      }
      if (a.action === 'idle') rec.idleMs += dt;
      Object.assign(prev,{x,y,start:a.start,action:a.action,facing:s.button.dataset.facing});
    });
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}"""


def run(url, evidence, seconds):
    assert urlparse(url).hostname in ('localhost', '127.0.0.1', '::1')
    evidence.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as pw:
        browser = pw.chromium.launch(channel='chrome')
        context = browser.new_context(viewport={'width':1440,'height':900},
                                      record_video_dir=str(evidence / 'video'),
                                      record_video_size={'width':1440,'height':900})
        context.route('**/*busuanzi*', lambda r:r.abort())
        context.route('**/gate-mascots.js', capture_controller)
        page = context.new_page()
        errors = []
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.goto(url + '?lang=en')
        page.wait_for_function('window.mascotReview?.actors.every(a=>a.slot.art.querySelector("canvas:not([hidden])"))')
        page.mouse.move(1,1)
        page.evaluate(SAMPLER)
        session = context.new_cdp_session(page)
        session.send('Performance.enable')
        processes = browser.new_browser_cdp_session()
        metrics = []
        for elapsed in range(0, seconds + 1, 15):
            if elapsed:
                page.wait_for_timeout(min(15, seconds-elapsed+15) * 1000)
            sample = {m['name']:m['value'] for m in session.send('Performance.getMetrics')['metrics']}
            metrics.append({k:sample.get(k) for k in ['Timestamp','TaskDuration','ScriptDuration','JSHeapUsedSize','Nodes']})
            metrics[-1]['processCpuSeconds'] = {p['id']:p['cpuTime'] for p in
                processes.send('SystemInfo.getProcessInfo')['processInfo']}
            page.screenshot(path=str(evidence / f'soak-{elapsed:03d}.png'))
            state = page.evaluate('mascotReview.actors.map(a=>[a.slot.id,a.action])')
            print(f'{elapsed}s {state}', flush=True)
        results = page.evaluate('soak.done=true; soak.elapsedMs=performance.now()-soak.start; soak')
        intervals = sorted(results.pop('intervals'))
        results.update(errors=errors, metrics=metrics,
                       fps=1000/(sum(intervals)/len(intervals)),
                       p95FrameMs=intervals[int(len(intervals)*.95)],
                       actionsUsed=sorted({e['action'] for e in results['actions']}))
        (evidence/'soak.json').write_text(json.dumps(results,indent=2),encoding='utf-8')
        context.close()
        browser.close()
        assert not errors, errors
        assert results['collisions'] == 0, results['collisions']
        assert results['outside'] == 0, results['outside']
        assert not results['teleports'], results['teleports'][:3]
        print(f"Real-time soak passed: {results['elapsedMs']/1000:.1f}s, {len(results['actionsUsed'])} actions.")


def interactions(url, evidence):
    """Use real DOM events, with local-only observation of queues and landings."""
    assert urlparse(url).hostname in ('localhost', '127.0.0.1', '::1')
    evidence.mkdir(parents=True, exist_ok=True)
    report = {}
    with sync_playwright() as pw:
        browser = pw.chromium.launch(channel='chrome')
        context = browser.new_context(viewport={'width':1440,'height':900})
        context.route('**/*busuanzi*', lambda r:r.abort())
        context.route('**/gate-mascots.js', capture_controller)
        page = context.new_page()
        errors = []
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.goto(url + '?lang=en')
        page.wait_for_function('window.mascotReview?.actors.every(a=>a.slot.art.querySelector("canvas:not([hidden])"))')
        field = page.locator('#gate-input')
        assert page.locator('.gate-brand').count() == 0
        field.click()
        assert page.evaluate('mascotReview.activeActor().source') == 'focus'
        field.fill('invalid-interaction-fixture')
        assert page.evaluate('mascotReview.activeActor().source') == 'typing'
        before = page.evaluate('mascotReview.activeActor().start')
        for _ in range(8):
            field.dispatch_event('input')
        assert page.evaluate('mascotReview.activeActor().start') == before
        report['typingThrottled'] = True
        field.press('Enter')
        assert page.evaluate('mascotReview.activeActor().source') == 'error'
        field.fill('another-invalid-fixture')
        assert page.evaluate('mascotReview.actors.every(a=>a.source!=="error" && !a.queue.includes("shake"))')
        page.wait_for_timeout(900)
        assert page.evaluate('mascotReview.activeActor().source') != 'error'
        report['staleErrorCancelled'] = True

        toggle = page.locator('#gate-visibility')
        toggle.click()
        field.press('Enter')
        assert field.get_attribute('type') == 'text'
        assert page.evaluate('mascotReview.actors.every(a=>a.source==="privacy")')
        page.wait_for_timeout(1200)
        assert page.evaluate('mascotReview.actors.every(a=>a.source==="privacy") && !mascotReview.frame')
        page.screenshot(path=str(evidence/'privacy-after-rejection.png'))
        toggle.click()
        assert field.get_attribute('type') == 'password'
        assert page.evaluate('mascotReview.actors.every(a=>a.source!=="privacy")')
        report['privacyOutranksRejection'] = True
        field.fill('third-invalid-fixture')
        field.press('Enter')
        page.wait_for_function('mascotReview.activeActor().action==="shake"')
        field.fill('fourth-invalid-fixture')
        field.press('Enter')
        page.wait_for_function('mascotReview.activeActor().action==="think"')
        field.fill('')
        report['rejectionVariants'] = ['shake','think']

        page.evaluate('mascotReview.lastEnter=-Infinity; mascotReview.run(mascotReview.actors.find(a=>a.index!==mascotReview.active),"story","sleepy",["sleep"])')
        page.locator('.gate-submit').hover()
        assert page.evaluate('mascotReview.activeActor().source') == 'enter'
        assert page.evaluate('!mascotReview.actors.some(a=>a.action==="sleep")')
        report['enterAnticipationAndWake'] = True
        mascot = page.locator('[data-mascot="explorer"]')
        mascot.click(position={'x':90,'y':45})
        assert mascot.get_attribute('data-action') == 'groom'
        page.wait_for_function('document.querySelector("[data-mascot=explorer]").dataset.behavior!=="click"', timeout=7000)
        mascot.focus()
        mascot.press('Space')
        assert mascot.get_attribute('data-behavior') == 'click'
        report['headClickKeyboardAndResume'] = True

        landings = []
        for _ in range(3):
            page.evaluate('mascotReview.run(mascotReview.actors[0],"click","delighted",["jump"])')
            page.wait_for_function('mascotReview.stage.slots[0].liftY > 1', timeout=3000)
            cut = page.evaluate('''() => {
              const c=mascotReview,s=c.stage.slots[0],baseline=s.y,before=s.y-s.liftY;
              c.run(c.actors[0],'click','bashful',['groom']);
              return {baseline,frameDelta:Math.abs(before-(s.y-s.liftY))};
            }''')
            page.wait_for_timeout(250)
            cut.update(page.evaluate('({landedY:mascotReview.stage.slots[0].y,lift:mascotReview.stage.slots[0].liftY})'))
            assert cut['frameDelta'] < .01 and cut['lift'] == 0 and abs(cut['landedY']-cut['baseline']) < .01, cut
            landings.append(cut)
        report['interruptedJumpLandings'] = landings
        # A controlled visibility event leaves Chrome's timers available for
        # observation, so this checks our clock rather than browser throttling.
        paused = page.evaluate('''() => {
          window.reviewHidden=true;
          Object.defineProperty(document,'hidden',{configurable:true,get:()=>reviewHidden});
          document.dispatchEvent(new Event('visibilitychange'));
          return mascotReview.clock;
        }''')
        page.wait_for_timeout(1200)
        assert page.evaluate('mascotReview.clock') == paused
        assert page.evaluate('mascotReview.frame') == 0
        page.evaluate('reviewHidden=false; document.dispatchEvent(new Event("visibilitychange")); delete document.hidden')
        page.wait_for_timeout(150)
        resumed = page.evaluate('mascotReview.clock') - paused
        assert 0 < resumed < 300, resumed
        report['controlledVisibilityPause'] = {'pausedMs':1200,'resumedClockMs':resumed}
        report['errors'] = errors
        assert not errors, errors
        context.close()
        browser.close()
    (evidence/'interactions.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
    print('Priority, input, privacy, keyboard, and interrupted-landing regressions passed.')


if __name__ == '__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--url',default='http://127.0.0.1:4189/')
    parser.add_argument('--evidence',required=True,type=Path)
    parser.add_argument('--seconds',type=int,default=180)
    parser.add_argument('--interactions',action='store_true')
    args=parser.parse_args()
    if args.interactions:
        interactions(args.url.rstrip('/')+'/',args.evidence)
    else:
        run(args.url.rstrip('/')+'/',args.evidence,args.seconds)

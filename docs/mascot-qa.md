# Gate motion review · 2026-11-03

This second review follows the initial v9 ensemble release. It keeps the supplied character art, original joint curves, 1.8× playback and existing key verifier.

## Corrections

- A rejected key could interrupt the closed-eye gesture while the key was visible. Privacy now remains the higher-priority state. The existing form rejection still appears.
- Cutting off a hop kept its elevated position as a new baseline. A 180 ms landing now returns it to the original baseline, preserving the first interrupted frame. Three consecutive interruptions returned to the same ground position without drift. Nearby actors reserve the landing space, and another walk waits for landing to finish.
- Reduced motion now disables the success text's entrance animation.
- The gate's redundant `Gofish.` wordmark is removed. “哇真的是你呀” uses 36–52 px type with a slightly stronger weight. The homepage wordmark remains in its header.

Both behavioral faults were reproduced in browser responses serving the previous controller and stage before checking the corrected code. Fresh input already canceled old error sequences; this behavior now has an explicit regression test.

## Real-time observation

Two desktop observations used real time, recorded video, a 1440 × 900 viewport and the actual renderer. Neither accelerated the behavior clock.

| Observation | Duration | Distinct actions | Form / actor overlap | Outside viewport | Position jumps |
|---|---:|---:|---:|---:|---:|
| Before corrections | 181.4 s | 24 | 0 | 0 | 0 |
| After corrections | 181.7 s | 23 | 0 | 0 | 0 |

The second random sample did not select `shake` autonomously. Targeted rejection checks exercised it, and all 24 actions were drawn in the art review. Same-action overlap among active, non-idle actors occupied 2.6% and 2.0% of the two samples. Independent role weights were retained.

The explorer walked 12 times in the second observation. The player dribbled six times and tossed five times. The performer groomed six times and slept four times. Their stage travel totaled approximately 2,873 px, 899 px and 533 px respectively. The performer spent longer resting while the explorer traveled more.

The corrected sample averaged 59.97 animation frames/s, with a 95th-percentile frame interval of 16.8 ms. JavaScript heap samples ranged from 2.73 to 3.58 MiB without sustained growth. These are local Chrome results without CPU or network throttling; physical-device performance can differ.

## Input, celebration and cleanup

Actual DOM events exercised focus, rapid input, input immediately after rejection, Enter hover, head clicks, Space activation, privacy toggles and return to autonomous behavior. Input bursts did not restart a whole action per character. Rejections alternated shake/thinking reactions. Editing canceled the pending reaction, including its queued follow-up.

The local success fixture temporarily substitutes a random expected digest in one intercepted document. It never uses or records the owner's key. The production hash constant, normalization, comparison and rejection messages were compared with the prior revision and matched.

| Observed time after accepted fixture | Group state |
|---|---|
| 8 ms | All three surprised |
| 424 ms | Wave / jump / dance |
| 1,424 ms | Cheer / toss-catch / high-five |
| 2,424 ms | Bow / laugh / laugh |
| 3,662 ms | Gate removed and homepage usable |

Repeated submits during the celebration did not restart it. Focus returned to the header brand, background `inert` and the scroll lock cleared, and all gate actors, canvases and fallback nodes were removed. The controller releases its shared image bank and listeners. There is no confetti emitter to retain. Reduced motion entered after 469 ms. Missing-part and missing-module cases also entered after verified fixture success.

## Art, loading and CPU

All 24 actions were inspected at five phases each, using native 768 px canvases. Every sampled pose had transparent clearance at each edge. Hair, wings, feet and the basketball stayed complete. The supplied textures and original action curves are unchanged. A single skeleton and ball are painted on each canvas. There is no floor shadow, reflection or opaque backdrop. [Complete action inventory](mascot-actions.md)

Fresh-context local HTTP traces measured requests begun in the first five seconds.

| View | Mascot transfer | Whole-page transfer including existing fonts and imagery |
|---|---:|---:|
| Desktop 1440 × 900 | 351,751 B · 343.5 KiB | 2,327,869 B |
| Phone 390 × 844 | 339,160 B · 331.2 KiB | 2,315,278 B |
| Reduced-motion desktop | 81,089 B · 79.2 KiB | 2,144,210 B |

All mascot requests stayed below the 512 KiB budget. There were no duplicate mascot URLs in the loading/interaction trace. The shared in-memory bank continues to coalesce part requests across actors. Content-versioned URLs preserve browser-cache eligibility on deployment. Local preview serves uncompressed bodies with `no-cache`; the public host may transfer fewer compressed bytes.

A separate run without video encoding measured browser process CPU time at 19.4–22.5% of one CPU core during movement, and 1.2% while privacy poses rested. Main-thread busy time was 4.5–6.2% during movement. Under a controlled hidden-document event, the controller clock stopped for 1.2 s and resumed without advancing through the pause; a separate 10 s hidden interval measured 0.16% of one core. The controlled event tests the handler while leaving browser timers observable. Video recording adds encoding work and is excluded from these CPU figures.

## Responsive checks and limits

The 14 gate cases passed at 1440 × 900, 1280 × 720, 768 × 900, 390 × 844 and 320 × 568 across light/dark themes and English/Chinese. They cover rejection, Show/Hide, success, reduced motion and resource failures. Original homepage scrolling and its compact header worked after entry.

Another 12 touch-emulated Arabic/RTL cases covered light/dark themes, portrait/landscape, 390 × 390 and 320 × 260 keyboard-like viewport reductions. The input and Enter stayed visible and focus was preserved. Head taps and live reduced-motion changes passed. A very short viewport temporarily hides characters to protect the form. These tests simulate keyboard geometry in Chrome; a physical phone's IME and GPU were not tested.

## Repeat the checks

With Chrome and Python Playwright installed, install Playwright's recording helper once with `python -m playwright install ffmpeg`. Start the normal preview, then run:

```sh
npm run build
npm run preview
python tests/gate_browser.py --url http://127.0.0.1:4173 --evidence ../gate-review
python tests/mascot_dynamics.py --url http://127.0.0.1:4173 --evidence ../mascot-soak
python tests/mascot_dynamics.py --url http://127.0.0.1:4173 --evidence ../mascot-events --interactions
```

The state-observation hook is injected only into intercepted local test responses and is absent from production source and bundles. Screenshots, videos and detailed traces from this review are retained as local review artifacts rather than site downloads.

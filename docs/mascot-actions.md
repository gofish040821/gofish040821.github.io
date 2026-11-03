# Gofish gate motion catalog

The personal gate uses **Gofish-Mascot-HD v9**, the expanded motion revision with playback rate 1.8. All 204 entries in the supplied SHA-256 list matched the source files. The 24 actions below were verified by decoding the three original exports for every action. WebP frame timings are in milliseconds. GIF rounds to its 10 ms time unit.

`hd-webp/<id>.webp` is 768 × 768, `web-webp/<id>.webp` is 384 × 384 and `gif-preview/<id>.gif` is 384 × 384. Every decoded frame had fully transparent and fully opaque pixels. Each export is encoded for infinite looping. The gate plays the joint curves for a bounded action or excerpt and schedules the next gesture separately.

| ID | Source action | Design ms | HD / web filename | Frames · wall ms | GIF filename | Frames · wall ms | HD clear margin¹ |
|---|---|---:|---|---:|---|---:|---:|
| `idle` | 待机呼吸 | 10000 | `idle.webp` | 250 · 5556 | `idle.gif` | 125 · 5560 | 75 px |
| `wave` | 挥翅招手 | 5200 | `wave.webp` | 130 · 2889 | `wave.gif` | 65 · 2890 | 75 px |
| `blink` | 歪头眨眼 | 4400 | `blink.webp` | 110 · 2444 | `blink.gif` | 55 · 2440 | 75 px |
| `jump` | 开心跳跃 | 6000 | `jump.webp` | 150 · 3333 | `jump.gif` | 75 · 3330 | 13 px |
| `dribble` | 拍拍篮球 | 6800 | `dribble.webp` | 170 · 3778 | `dribble.gif` | 85 · 3780 | 75 px |
| `toss` | 抛球接球 | 6400 | `toss.webp` | 160 · 3556 | `toss.gif` | 80 · 3560 | 24 px |
| `dance` | 左右舞步 | 7200 | `dance.webp` | 180 · 4000 | `dance.gif` | 90 · 4000 | 73 px |
| `cheer` | 庆祝欢呼 | 5200 | `cheer.webp` | 130 · 2889 | `cheer.gif` | 65 · 2890 | 75 px |
| `think` | 托腮思考 | 5600 | `think.webp` | 140 · 3111 | `think.gif` | 70 · 3110 | 75 px |
| `surprise` | 惊讶后仰 | 4800 | `surprise.webp` | 120 · 2667 | `surprise.gif` | 60 · 2670 | 75 px |
| `sleep` | 打个瞌睡 | 10000 | `sleep.webp` | 250 · 5556 | `sleep.gif` | 125 · 5560 | 75 px |
| `bow` | 鞠躬致意 | 5200 | `bow.webp` | 130 · 2889 | `bow.gif` | 64 · 2890 | 75 px |
| `walk` | 慢慢走路 | 6400 | `walk.webp` | 160 · 3556 | `walk.gif` | 80 · 3560 | 72 px |
| `jog` | 小步奔跑 | 6000 | `jog.webp` | 150 · 3333 | `jog.gif` | 75 · 3330 | 75 px |
| `peek` | 探头张望 | 5200 | `peek.webp` | 130 · 2889 | `peek.gif` | 65 · 2890 | 75 px |
| `point` | 指路介绍 | 5200 | `point.webp` | 130 · 2889 | `point.gif` | 65 · 2890 | 73 px |
| `stretch` | 伸个懒腰 | 8000 | `stretch.webp` | 200 · 4444 | `stretch.gif` | 96 · 4440 | 63 px |
| `yawn` | 打个哈欠 | 7200 | `yawn.webp` | 180 · 4000 | `yawn.gif` | 88 · 4000 | 75 px |
| `laugh` | 开心大笑 | 7000 | `laugh.webp` | 175 · 3889 | `laugh.gif` | 88 · 3890 | 75 px |
| `shy` | 害羞捂脸 | 6400 | `shy.webp` | 160 · 3556 | `shy.gif` | 80 · 3560 | 65 px |
| `highfive` | 击掌回应 | 6000 | `highfive.webp` | 150 · 3333 | `highfive.gif` | 75 · 3330 | 75 px |
| `nod` | 点头回应 | 5200 | `nod.webp` | 130 · 2889 | `nod.gif` | 65 · 2890 | 75 px |
| `shake` | 摇头回应 | 5200 | `shake.webp` | 130 · 2889 | `shake.gif` | 65 · 2890 | 75 px |
| `groom` | 整理发型 | 6800 | `groom.webp` | 170 · 3778 | `groom.gif` | 85 · 3780 | 75 px |

¹ Minimum distance to any canvas edge, counting every pixel with nonzero alpha across the entire HD clip. The combined visible bounds of all HD frames are x = [59, 705), y = [13, 724). The original pose sheet cells measured 627 × 627. The rig and HD delivery use a 768 × 768 coordinate space.

The entire WebP catalog runs for 84,113 ms, and the GIF catalog for 84,130 ms. `toss` contains both throw and catch, `blink` includes the head tilt, `groom` fixes the hair, and `peek` looks around. Sleeping leads into `stretch` when the performer wakes. The player’s short celebration uses one complete jump beat and one complete throw/catch beat from the original curves. [Role sequences and event priorities](../src/gate-mascots.js)

## Web delivery

All three actors draw the same 15 transparent WebP parts. Parts retain their source bytes. Each bitmap is trimmed to its padded alpha bounds **in memory**, then drawn using its original pivot at the current device pixel density, up to the native 768 px. The renderer bridges numeric joint transforms for 180 ms on an interruption and paints one skeleton per frame. The held ball and the ball on the floor share one image. [Renderer](../src/mascot-art/renderer.js) · [Joint curves](../src/mascot-art/rig.js) · [Runtime timing and part bounds](../src/mascot-art/catalog.js)

The 384 px idle poster is 27,124 bytes. Nine base parts total 147,878 bytes. After the first complete frame, the renderer prefetches the blink and surprised faces (108,048 bytes together). Additional expressions and open wings are requested only when used. A shared request cache deduplicates concurrent actors. All 15 parts total 386,218 bytes. A failed required part falls back to the idle poster. Reduced motion loads the poster without decoding the rig textures.

The inspected local package contained 405,437,237 bytes. The site ships the shared rig, its adapter, the catalog and the poster. The original HD/Web animations, GIFs, 23 reference sheets, source PNGs and baking tools stay in the owner's source package. [Personal asset usage](../ASSET-LICENSES.md)

The cold-load target for mascot resources started in the first five seconds is 512 KiB. In a fresh Chrome context on the local preview, the 1440 × 900 desktop transferred 353,011 bytes, the 390 × 844 viewport transferred 340,315 bytes, and the reduced-motion desktop transferred 81,089 bytes. These measurements include the new scripts, CSS and image requests under the versioned gate directory.

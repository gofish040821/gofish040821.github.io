import { hobbyScenes } from './hobby-scenes.mjs';

// Open ink contours and offset paper shapes. Each part has a role in its scene.
const ink = (d, width = 2.2, opacity = 1) => `<path d="${d}" fill="none" stroke="currentColor" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"${opacity < 1 ? ` opacity="${opacity}"` : ''}/>`;
const paper = d => `<path class="illustration-paper" d="${d}"/>`;
const accent = d => `<path class="illustration-accent" d="${d}"/>`;
const part = (name, drawing) => `<g data-scene-part="${name}">${drawing}</g>`;
const star = (x, y, size = 7) => ink(`M${x-size} ${y}Q${x} ${y-1} ${x} ${y-size}Q${x+1} ${y} ${x+size} ${y}Q${x} ${y+1} ${x} ${y+size}Q${x-1} ${y} ${x-size} ${y}`, 1.7);

const drawings = {
  notebook: [
    paper('M27 20Q49 17 77 20L92 34 90 102Q59 105 27 100Z'),
    accent('M24 20 33 19 33 99 25 98Z'),
    ink('M28 18Q49 15 76 18L94 34 92 101Q63 105 29 101'),
    ink('M26 23 25 96M77 20 76 35Q85 33 94 34', 1.8),
    ink('M28 33C12 26 13 43 27 39M27 52C12 45 12 62 27 58M27 72C12 65 12 82 26 78', 2),
    ink('M42 37Q52 35 63 37M42 48 72 47M42 59Q55 57 74 59', 1.6, .55),
    part('writing', ink('M42 78Q48 68 51 75T60 75Q63 71 67 77', 2)),
    part('pencil', accent('M80 76 96 39 103 42 87 80Z') +
      ink('M80 76 96 38Q99 36 104 41L88 80 79 87Z') +
      ink('M80 77 88 80M95 43 101 46M80 86 82 82', 1.5)),
    ink('M37 108Q61 110 83 107', 1.4, .25)
  ].join(''),
  curiosity: [
    paper('M23 25Q44 17 68 25L69 87 26 91Z'),
    ink('M23 26Q41 20 66 24M23 29 26 91 58 89', 1.9),
    ink('M33 36 43 35M33 47 40 47M33 79 45 78', 1.6, .45),
    part('discovery', accent('M57 44Q61 54 72 55Q61 57 58 68Q56 58 46 57Q55 54 57 44Z') + star(58,55,10)),
    part('lens', paper('M78 74 102 94 97 101 72 80Z') +
      ink('M85 54C87 35 69 23 52 29S27 56 39 71 70 85 81 68Q85 62 85 54Z', 2.5) +
      ink('M75 77 99 101Q106 100 104 94L82 73', 2.4) +
      ink('M42 50Q44 39 54 36', 1.4, .5)),
    part('curiosity-spark', ink('M91 23 95 17M99 34 107 33', 1.7))
  ].join(''),
  chicken: [
    paper('M17 83Q48 69 94 81L108 91Q66 110 18 96Z'),
    ink('M16 87C26 73 91 72 107 86S79 108 44 103Q22 101 16 93', 1.8),
    ink('M24 89Q52 77 98 88M30 98Q61 104 85 97', 1.2, .45),
    part('chicken-bone', paper('M47 68 32 83Q25 80 22 86T25 96Q31 100 34 92L55 77Z') +
      ink('M48 67 33 82C25 78 19 87 24 92Q27 99 34 94L36 88 56 74', 2.2)),
    part('chicken-piece', accent('M43 61C40 47 49 30 65 28S94 37 94 51 80 72 62 75Q48 76 43 61Z') +
      ink('M42 57Q39 47 47 43Q45 33 57 32Q61 22 73 29Q85 25 89 36Q101 39 96 51Q99 64 86 67Q79 78 68 74Q52 81 46 68Q39 66 42 57Z', 2.4) +
      ink('M52 45 55 41M72 36 75 39M85 48 81 52M57 62 62 65M73 57 70 60', 1.9, .6)),
    part('crumb-a', accent('M91 74 96 71 98 77 94 80Z')),
    part('crumb-b', ink('M76 88 80 86 82 90', 1.9)),
    part('chicken-aroma', ink('M52 20Q48 15 53 10M78 17Q83 12 80 7', 1.4, .5))
  ].join(''),
  burger: [
    ink('M19 106Q60 111 103 105', 1.4, .35),
    part('burger-top', paper('M25 43C27 16 88 15 96 42Z') +
      accent('M25 41Q61 37 96 41L96 48Q58 52 25 47Z') +
      ink('M24 43C29 12 85 12 96 40M24 47Q60 51 96 46', 2.4) +
      ink('M42 31 45 29M61 25 64 27M78 31 80 34', 1.7) +
      ink('M25 54Q31 49 37 54T50 54 64 54 78 54 95 53', 1.8)),
    part('burger-middle', accent('M23 63Q57 60 98 62L98 72Q56 76 23 72Z') +
      ink('M23 62Q57 59 98 62M24 64 24 73Q58 77 98 72L98 65', 2.1) +
      ink('M35 68 84 67', 1.2, .4)),
    part('burger-base', ink('M25 81Q32 77 39 81T53 81 67 81 80 81 96 80', 1.8) +
      paper('M26 88Q63 92 96 87L93 99Q59 108 29 99Z') +
      ink('M25 88Q60 94 96 88M26 92Q26 102 44 103Q78 108 93 98L96 92', 2.3)),
    part('burger-note', ink('M106 61Q109 60 111 62L111 73Q109 76 105 75', 1.6, .6) +
      ink('M9 61 6 62 6 74 10 75', 1.6, .6))
  ].join(''),
  education: [
    paper('M17 29Q37 22 60 34Q78 23 101 29L101 91Q80 85 61 98Q39 86 18 94Z'),
    ink('M18 29Q40 22 60 34Q79 23 100 29M17 33 19 94Q40 87 61 99Q80 87 102 92L101 34', 2.3),
    ink('M60 35Q58 66 61 97M12 41 13 100Q39 95 56 106M67 106Q88 95 109 99L108 44', 1.7, .65),
    ink('M28 46Q40 43 49 48M29 57Q40 54 49 59M30 69 46 70', 1.5, .5),
    part('book-page', accent('M63 34Q78 23 100 29L100 88Q80 85 62 96Z') +
      ink('M63 34Q78 24 100 29L100 88Q80 84 62 96', 1.8) +
      ink('M73 46 89 42M72 56 90 53M72 67 84 64', 1.4, .6)),
    part('book-star', star(40,82,6))
  ].join(''),
  life: [
    ink('M28 108Q59 112 89 107', 1.4, .3),
    accent('M36 80Q60 84 85 79L78 103Q58 108 43 101Z'),
    ink('M33 78Q60 82 87 77L85 84Q62 88 35 84ZM39 87 44 102Q61 108 78 102L83 87', 2.1),
    part('plant-stem', ink('M60 79Q57 59 61 36', 2.2)),
    part('leaf-left', paper('M58 63Q31 63 29 40Q50 39 58 63Z') +
      ink('M58 63Q33 65 29 40Q50 38 58 63M38 48 56 62', 1.9)),
    part('leaf-right', paper('M60 71Q61 47 88 45Q88 68 60 71Z') +
      ink('M61 71Q61 48 88 45Q90 67 61 71M61 71 80 54', 1.9)),
    part('flower', accent('M61 38C41 41 43 26 52 27C42 9 58 7 62 20C72 5 84 18 73 26C89 28 80 43 69 35Q65 43 61 38Z') +
      ink('M59 37C43 41 41 27 51 26C44 13 57 9 62 20C71 9 82 18 73 26C87 30 77 43 68 35Q64 41 59 37Z', 1.8) +
      ink('M60 28Q64 24 68 28Q68 33 64 33Q60 33 60 28Z', 1.7))
  ].join(''),
  tools: [
    paper('M21 25Q60 20 101 25L98 95 21 97Z'),
    ink('M22 25Q62 20 101 25L98 94Q59 98 21 95L22 30', 2.3),
    accent('M24 26Q63 22 99 26L99 39 23 39Z'),
    ink('M23 40Q59 38 99 40', 1.8),
    ink('M31 31 32 31M40 31 41 31M49 31 50 31', 2.6),
    part('code-left', ink('M44 56 34 66 44 75', 2.4)),
    part('code-right', ink('M78 56 87 65 77 75', 2.4)),
    part('code-cursor', ink('M65 53 56 78', 2.3)),
    part('code-line', ink('M36 86 73 85', 1.7, .4))
  ].join(''),
  ...hobbyScenes
};

export function illustrationSprite() {
  return `<svg class="illustration-library" width="0" height="0" aria-hidden="true" focusable="false"><defs>${Object.entries(drawings).map(([name, drawing]) => `<symbol id="sketch-${name}" viewBox="0 0 120 120">${drawing}</symbol>`).join('')}</defs></svg>`;
}

export function illustration(name, extraClass = '') {
  if (!drawings[name]) throw new Error(`Unknown illustration: ${name}`);
  return `<svg class="illustration ${extraClass}" data-illustration="${name}" viewBox="0 0 120 120" width="120" height="120" fill="none" aria-hidden="true" focusable="false"><use href="#sketch-${name}"/></svg>`;
}

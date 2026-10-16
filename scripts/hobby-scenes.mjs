// Original editorial scenes for a 120 × 120 canvas.
// Local helpers keep these curves independent of the shared ink generator.
const ink = (d, width = 2.2, opacity = 1) =>
  `<path d="${d}" fill="none" stroke="currentColor" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"${opacity < 1 ? ` opacity="${opacity}"` : ''}/>`;
const paper = d => `<path class="illustration-paper" d="${d}"/>`;
const accent = d => `<path class="illustration-accent" d="${d}"/>`;
const part = (name, shapes) => `<g data-scene-part="${name}">${shapes.join('')}</g>`;

export const hobbyScenes = {
  badminton: [
    // The grip is the fixed point of the swing: 35,94.
    part('racket', [
      paper('M43 30 C56 21 72 27 75 39 C79 52 64 68 51 68 C37 67 31 45 43 30Z'),
      ink('M45 68 C32 62 31 46 40 33 C48 21 63 21 72 30 C82 40 77 55 67 64 C61 69 54 71 49 70'),
      // Four generous strings suggest the mesh without drawing a dense grid.
      ink('M40 41 Q54 41 70 51 M39 52 Q49 53 60 63', 1.9, .72),
      ink('M49 30 Q43 44 47 63 M61 28 Q53 45 58 61', 1.9, .72),
      ink('M46 70 Q41 83 35 95 M51 72 Q44 86 39 97'),
      accent('M34 87 Q37 88 41 90 L37 101 Q33 101 31 97Z'),
      ink('M34 88 L31 97 Q32 100 36 101 L41 91', 2.1)
    ]),
    // Cork sits around 89,39; the feathers open into the empty upper right.
    part('shuttle', [
      paper('M84 35 L83 19 Q95 20 106 28 L92 38Z'),
      ink('M84 35 L83 20 Q95 20 105 28 L94 36'),
      ink('M90 35 Q89 28 89 23 M93 34 L99 27', 1.9, .8),
      accent('M84 35 Q89 34 93 37 C95 41 90 46 86 43 Q82 41 84 35Z'),
      ink('M84 35 Q90 34 93 37 C95 41 90 45 86 43 Q83 42 83 39', 2.1)
    ]),
    part('shuttle-trail', [
      ink('M76 65 C83 61 88 55 91 49', 2, .65),
      ink('M88 66 Q94 61 97 55', 1.9, .42)
    ])
  ].join(''),

  travel: [
    // The hills remain still; the moving flag is anchored at 80,32.
    paper('M15 85 C29 63 35 56 49 67 C65 43 77 42 90 58 Q99 69 107 84 L107 94 Q66 103 17 94Z'),
    ink('M13 83 C24 69 32 57 42 61 C51 63 58 72 64 76'),
    ink('M51 65 C63 52 73 43 82 50 C90 56 97 69 107 75'),
    ink('M16 94 Q30 97 41 96 M74 97 Q91 95 107 92', 2, .63),
    part('trail', [
      ink('M31 104 C43 98 62 95 59 88 C57 84 48 83 53 79 Q57 76 66 74', 2.1, .82)
    ]),
    part('flag', [
      accent('M82 33 C90 29 97 37 104 33 L102 44 C94 48 88 40 82 44Z'),
      ink('M80 32 Q79 44 79 55'),
      ink('M83 32 C91 29 96 36 103 32 L101 43 Q92 45 84 41', 2)
    ]),
    part('sun', [
      accent('M28 22 C33 18 40 22 40 28 C40 34 33 38 28 34 C23 31 23 25 28 22Z'),
      ink('M22 18 L19 14 M43 19 L47 16 M45 32 L50 33', 1.9, .73)
    ])
  ].join(''),

  cooking: [
    part('steam-a', [
      ink('M43 58 C35 50 51 45 44 36 Q39 30 44 23', 2.1, .68)
    ]),
    part('steam-b', [
      ink('M59 55 C53 48 66 42 61 35', 2.1, .55)
    ]),
    // The spoon pivots at 80,66. Its bowl disappears behind the pot front.
    part('spoon', [
      paper('M69 65 C62 67 64 78 69 80 C75 81 80 72 76 67 Q73 64 69 65Z'),
      ink('M76 66 Q85 48 93 29', 2.4),
      ink('M69 65 C63 67 64 77 69 79 C75 81 79 72 76 68 Q74 65 71 65', 2.1)
    ]),
    // Offset color and contour give the pot the feel of a small paper cutout.
    accent('M30 73 Q56 68 89 74 L87 91 Q84 102 70 103 L43 101 Q31 100 30 88Z'),
    ink('M30 74 C31 85 29 96 42 100 Q63 104 80 99 C88 97 88 85 89 76', 2.3),
    ink('M30 73 C44 67 74 68 89 73 Q76 78 61 77', 2.2),
    ink('M28 78 C17 75 17 88 29 87 M92 77 C103 76 102 87 92 87', 2.2),
    paper('M39 84 Q43 86 44 94 L40 93Z')
  ].join(''),

  film: [
    paper('M27 53 L97 51 L98 95 Q70 101 26 97Z'),
    ink('M25 54 L25 95 Q48 99 74 97 L95 95 Q97 76 95 55', 2.3),
    ink('M29 52 Q61 49 92 51', 2.1),
    ink('M39 68 Q57 66 76 67 M39 82 Q49 81 59 82', 2, .65),
    // The hinged top closes around 24,49; its stripes are large paper pieces.
    part('clapper', [
      accent('M24 37 L90 25 L94 39 L26 51Z'),
      paper('M37 34 L44 33 L53 46 L45 47Z'),
      paper('M61 30 L69 29 L78 42 L70 43Z'),
      ink('M24 49 L22 36 Q56 29 91 24 L94 38 Q62 43 29 49', 2.3),
      ink('M24 48 Q27 46 29 49 Q29 52 26 52', 1.9)
    ]),
    part('film-light', [
      accent('M104 47 Q104 53 110 54 Q104 55 104 61 Q103 55 98 54 Q103 53 104 47Z'),
      ink('M102 69 L108 71', 1.9, .58)
    ])
  ].join('')
};

# Design principles

English | [中文](DESIGN.zh-CN.md)

This design aims for “warm restraint.” Paper tones, pencil lines with varied pressure, and open space give the page the feel of a sheet of paper worth spending time with. Clear hierarchy keeps it orderly. Specific writing, personal photographs, and a few hand-drawn marks give it the character of its owner.

The light theme uses warm white #f7f5f0, dark gray #30302c, and terracotta #b75e43. Reserve the accent for section markers, illustration fills, and selected controls. The dark theme has its own ink, paper, and accent colors.

Headings use Source Serif 4, body text uses Source Sans 3, and numbers and dates use the system monospace font. Chinese text falls back to system serif and sans-serif fonts. The bundled fonts have open licenses. Keep the license notices and check line wrapping if you change fonts.

The introduction and cover sit side by side on desktop and stack on mobile. The content area is at most about 1160px wide, with the introduction limited to 62ch. Spacing, type size, and a few dividing rules separate sections. Project cards lead with a concrete question and reveal process and results on request. The gallery initially shows four images.

The warm paper palette, serif headings, and pencil marks draw on editorial design. Space gives content room to breathe, fine rules separate sections, and accents remain selective. Adapt the colors, type, and images to the owner's own work.

The 11 illustrations retain their resting outlines. Each gesture has a beginning, a point of contact, a response, and a finish. Individual strokes bend or widen as movement passes through them. A shuttlecock meets the racket before rebounding, a pencil touches down twice, and the edge of a clapperboard responds after it closes. Each gesture plays once and can be replayed by hovering or touching.

When editing motion, start with where and when an action occurs. Adjust the whole-object animation in src/style.css and the local stroke motion in src/app.js together. Check the resting frames, mobile sizes, and reduced-motion settings. Larger movements suit larger illustrations; small section icons need extra care around their boundaries.

Controls should communicate their purpose. Buttons and the language menu have visible focus states. The gallery supports arrow keys, Escape, and touch. Content remains readable with JavaScript disabled or reduced motion enabled.

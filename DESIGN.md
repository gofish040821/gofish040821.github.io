# Warm Restraint

[English](DESIGN.md) | [中文](DESIGN.zh-CN.md)

Some AI products picture the future in neon gradients, glass and blue halos against a dark background. I write about questions I’m working through, places I’ve been and people I know. I want this homepage to feel like a notebook left open. Minimalism matters less to me than having room for a graduation photo, a line beneath it or an experiment I haven’t finished.

I can give a math problem my full attention and take just as much care over cooking dinner. I like that kind of seriousness when it leaves people at ease. I want to share my interests while leaving visitors some room of their own. That’s what I mean by warm restraint. On the page, I give an idea enough space to explain it and leave it to the reader to decide how far to read and where to pause.

## Paper, ink and space

The sense of paper starts with the background. In light mode I use a warm off-white (`#f7f5f0`) with charcoal text (`#30302c`). A clay color (`#b75e43`) picks out the section numbers and a few small cues. The crayon fills in the illustrations use a brighter shade (`#cf7958`). I keep the grain in the marks themselves. The pressure varies along a pencil stroke, its two edges differ slightly, and its ends taper. The reading area stays clear. In dark mode the paper shifts to `#191816`, the text to `#e9e5dd` and the illustrated accents to `#d78a65`, so the ink still stands apart from the page. [How the pencil marks are drawn](scripts/sketch-pencil.mjs) · [Color palette](src/style.css)

On desktop, my name and research interests sit to the left of a photo of me in the mountains. I set my name in a serif face at 88–118px and the introduction at 17px. There’s 88px of space above this opening and 100px below it, giving it room before the next section begins. The content area is up to 1160px wide, but the text in the About section runs to about 62ch, roughly the width of 62 zeroes. I leave 54px between the two research cards and keep each caption close to its photo. The spacing helps readers see what belongs together. [Typography and layout](src/editorial.css)

## Room for research and daily life

Each research card starts with a question you could put in your own words. An expandable note explains how I might test it and what I’d measure. If I remove the middle bun from a Big Mac, how much of the change comes from having less bread, and how much from where the bread sat? Describing a comparison with the same amount taken from the outer buns says more about my thinking than the label “ablation study” could on its own. It’s still an idea for an experiment, so the card stops at the plan.

The gallery needs fewer words. Under my graduation photo I wrote, “A graduation photo, and the two people who made the long road possible.” The photograph says the rest. The first four images show a summit, my family, a puppy and the seaside. Visitors can open the remaining ten if they want to see more. Daily life has a place here in its own right. I don’t need a technical reason to include a picture.

## How a gesture comes to rest

The third version keeps the original drawings for the five section and tool illustrations, the two research illustrations and the four hobby illustrations. Each gesture comes from the object in the drawing. The pencil makes its first stroke quickly. When the tip lifts, the ink stops, and only then does the second stroke begin. The burger’s middle layer catches at first. As the weight above it lifts, it slides out at an angle and pauses at about −9°. The shuttlecock meets the racket strings before its feathers turn. A little pressure widens and bends part of a line. The small delay between one part taking the force and the next part moving makes them feel connected. [Scene illustrations](scripts/illustrations.mjs) · [Hobby illustrations](scripts/hobby-scenes.mjs)

An illustration plays once when it comes into view, then returns to its resting pose. Hovering or tapping plays it again. Leaving the pointer in place keeps it still. With reduced motion enabled, the drawings and text tell the same story at rest. On a phone, text and images fall into one column. Portrait and landscape photos keep their full composition, each followed by its caption. I want people to be able to read at their own pace. [Interaction code](src/app.js)

Anthropic’s design partly inspired the warm paper tones and editorial layout. I made the site independently and have no official affiliation with Anthropic. On my own site, I use Anthropic Serif for Latin-script headings, Anthropic Sans for body text and Anthropic Mono for numbering. Chinese headings and body text fall back to the system’s Song-style serif and Hei-style sans-serif fonts. Arabic and Urdu use script-appropriate fonts and read from right to left. The permission covering the Anthropic fonts on my site does not transfer to template users. The template ships with open fonts that allow redistribution and leaves out my photos and personal details. [Asset and font licenses](ASSET-LICENSES.md)

# Personal homepage template

English | [中文](README.zh-CN.md)

A bilingual personal homepage with warm paper tones, terracotta accents, hand-drawn pencil illustrations, and the openly licensed Source Serif and Source Sans fonts. Replace the example name, projects, education, contact details, and images with your own.

Node.js 20 or later is required. There are no third-party build or runtime dependencies.

```sh
npm run build
npm run preview
```

Open http://127.0.0.1:4173/. Stop the preview with Ctrl+C. Set the PORT environment variable to use another port.

## Edit the content

Start with AGENTS.md and content.json. The latter holds the name, contact details, site URL, cover, introduction, projects, education, skills, interests, and gallery order. The build uses it for the English content. src/i18n.json contains interface labels in both languages and the Chinese translation.

When editing Chinese, update the zh section in src/i18n.json and keep each image, project className, and hobby symbol consistent. Replace the example links your-username, your-name, and hello@example.com with your own.

The two sample projects use the chicken and burger illustrations. Keep those names or choose other illustrations defined in scripts/illustrations.mjs. Local changes in line shape and pressure are in src/app.js. Whole-object motion is in src/style.css.

Optional skill illustrations also include Figma, Zotero, Manim, DaVinci Resolve and REAPER. To list a tool you use, add its name and badge key (figma, zotero, manim, davinci or reaper) to skills in content.json, then rebuild.

Gallery images live in dist/assets/photos/. Each image needs both name.webp and name-small.webp with the same framing and aspect ratio. The default cover is sample-01, and the avatar uses avatar.webp and avatar-small.webp. Update each title, caption, and alt text when replacing images, then rebuild. The supplied images are abstract placeholders.

## Adjust the design

[DESIGN.md](DESIGN.md) explains the palette, typography, spacing, hierarchy, and motion. Base styles and motion live in src/style.css, controls in src/controls.css, and typography and layout refinements in src/editorial.css. Check desktop and mobile widths in light and dark themes after changing them.

dist/ contains both generated pages and assets required by the build. Keep its images, fonts, and skill icons. Run the build to update generated HTML, CSS, and JavaScript.

## Publish your site

Change siteUrl in content.json and push the project to your own repository. A user site normally uses https://your-username.github.io. A project site uses https://your-username.github.io/repository-name. Relative resource paths support either; the 404 page, canonical URL, robots file, and sitemap follow siteUrl.

For GitHub Pages, copy deploy/pages.yml.example to .github/workflows/pages.yml in your repository. Under Settings → Pages, choose GitHub Actions as the source, then run Deploy homepage manually from the Actions tab. You can also upload the built dist directory to another static host.

The exported project has no original site's Git history, personal information, analytics, or proprietary fonts. The code and original illustrations use the MIT License. Source fonts use their included SIL OFL licenses. Keep source and licensing information for any assets you add.

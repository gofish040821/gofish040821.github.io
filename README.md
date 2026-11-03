[English](README.md) | [中文](README.zh-CN.md)

# Gofish’s personal homepage

I like to be specific about the things I care about and leave some room for the person listening. I think of that balance as “warm restraint.” Some AI products use dark backgrounds, neon gradients and glassy glows to suggest the future. I wanted this site to feel like a notebook left open on a desk, with room for a carefully framed research question and a photo of my parents and me at graduation.

The live site has my research notes, education and photos from everyday life. If you’re building a homepage of your own, there’s also a template with neutral sample content. [Homepage in English](https://gofish040821.github.io/?lang=en) · [中文主页](https://gofish040821.github.io/?lang=zh) · [Design notes](DESIGN.md)

## Preview the personal site

Updated 2026-11-03, motion review. The gate now lands an interrupted hop on its original baseline and keeps the privacy gesture through a rejected visible key. Editing the field clears the old rejection sequence, and the one-time initialization listener removes itself after running. The redundant gate wordmark is removed, and “哇真的是你呀” uses a larger 36–52 px success treatment. Reduced motion also disables its entrance animation. [Motion QA](docs/mascot-qa.md)

Updated 2026-11-03. Three visitors share the space around the key card. The explorer wanders, the player practices with a basketball, and the performer alternates between small shows and rests. Tap a character or focus the key field to get a response. Showing the key prompts a privacy gesture. A correct answer brings the group together for a brief celebration before entry. Tablets and phones use fewer characters. Reduced motion shows a still character. [Action and asset inventory](docs/mascot-actions.md)

Updated 2026-11-02. A lightweight front-end key gate now opens the site: visitors answer “只因名？” with the right key before the homepage appears. It only deters casual visitors and is not a security boundary. The markup, styles and check script are inlined in `src/index.html` for easy redesign.

Updated 2026-11-02. Chinese headings now use a self-hosted Noto Serif SC subset instead of the system Song-style font. The light clay accent is adjusted for contrast, and the italic serif used in the opening caption is preloaded.

Updated 2026-11-02. The hobby heading now reads “Sports,” while keeping the badminton illustration. The header and page ending use a clearer four-layer paper-fiber texture and vignette: dark paper frames the light theme, and light paper frames the dark theme. The surfaces adapt to the available width and height, with matching text, controls and borders.

The paper header now stays at the top while reading. Once you leave the opening area, its controls fade away and the complete `Gofish.` wordmark moves smoothly to the center of the viewport. Return to the top to restore the full navigation. The transition supports reduced motion and keeps hidden controls out of keyboard navigation.

Updated 2026-11-01. Skills & Tools now includes Figma, Zotero, Manim, DaVinci Resolve and REAPER alongside the development and research tools. Each uses the same monochrome pencil sketch and label style. Expand the list to see all 30 tools.

The `main` branch contains the source for the live site. It supports 14 languages and light and dark themes. The third version keeps all 11 original pencil illustrations and gives each its own movement. The pencil touches down twice to write a note. The burger’s middle layer slides out and pauses at an angle.

From the repository root, build and preview with Node.js 20 or later. There are no third-party dependencies to install.

```sh
npm run build
npm run preview
```

Open the [local preview](http://127.0.0.1:4173). After editing a source file, rebuild and refresh the page. Press `Ctrl+C` to stop the preview server.

With Chrome and Python Playwright available, keep the preview running and use `python tests/gate_browser.py --evidence ../gate-review` to exercise the gate locally. The success test substitutes a temporary digest in one isolated browser response.

Use `python tests/mascot_dynamics.py --url http://127.0.0.1:4173 --evidence ../mascot-soak` for a real three-minute motion observation. Add `--interactions` to check input priorities, privacy, keyboard activation and interrupted landings. The observation hook exists only in intercepted local test responses.

## Make your own homepage

The template includes English and Chinese, sample projects, placeholder illustrations and fonts licensed for redistribution. Replace the profile, avatar and contact details with your own.

**Export from an existing clone.** From the root of the `main` branch, export the template into a new directory.

```sh
node scripts/create-template.mjs ../my-homepage
cd ../my-homepage
npm run build
npm run preview
```

**Download just the template.** Clone the standalone `template` branch.

```sh
git clone --branch template --single-branch https://github.com/gofish040821/gofish040821.github.io.git my-homepage
cd my-homepage
npm run build
npm run preview
```

Either route gives you a site that builds on its own. The `template/` directory on `main` holds only the settings and assets used to replace the personal content during export. See `AGENTS.md` at the root of the exported project for its maintenance guide.

## Edit the content

| What to change | Where to edit |
| --- | --- |
| Name, introduction, contact details, site URL and last-updated label | `content.json` |
| Research or projects, education, skills, interests and gallery order | The corresponding arrays in `content.json` |
| Interface labels and translations | `src/i18n.json` |
| Page structure, colors, controls and typography | `src/index.html`, `src/style.css`, `src/controls.css`, `src/editorial.css` |
| Illustrations and their motion | `scripts/illustrations.mjs`, `scripts/hobby-scenes.mjs`, `scripts/sketch-pencil.mjs`, `src/style.css` and `src/app.js` |

The personal site uses `content.json` to build the opening section and default English copy. The language switcher uses `src/i18n.json`. When you edit text that has translations, update the matching fields in each language, including the personal site’s English dictionary. Keep the project `className` and the hobby `symbol` unchanged across languages. They select the illustrations.

Store gallery photos in `dist/assets/photos/`. Supply both `name.webp` and `name-small.webp`, then set `gallery[].image` to the name without its extension. Add a title, caption, alt text and framing position. Each translation identifies the same photo by its `image` value. The navigation avatar follows the same convention with `avatar.webp` and `avatar-small.webp`. Before publishing a photo, remove any EXIF metadata you want to keep private.

The `dist/` directory contains both published output and build inputs. Keep the photos, fonts and badges in `dist/assets/`. The build reads or validates them and generates the pages and scripts from source.

## Publish

When changes to the relevant pages, scripts or assets reach `main`, GitHub Actions builds the personal site and deploys `dist/`. [Personal site workflow](.github/workflows/pages.yml)

The template is set up for local preview. To publish it from your own repository, follow these steps.

1. Set `siteUrl` in `content.json` to your full public URL. For a GitHub Pages project site, include the repository path. Replace the sample contact details and images, then push the project to your own repository.
2. In your repository, copy `deploy/pages.yml.example` to `.github/workflows/pages.yml` and commit it to the default branch. Under **Settings → Pages → Build and deployment → Source**, select **GitHub Actions**. [GitHub Pages publishing settings](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
3. Open **Actions**, select the Pages workflow, click **Run workflow** and choose the branch to publish. The example workflow builds and deploys `dist/` only when run manually.

## License

The original code and illustrations are available under the MIT License. The author’s personal photos, avatar and writing are outside the scope of the template’s reuse license. The personal site has separate authorization to use the Anthropic fonts on the web. The template ships fonts under open licenses. The asset notes cover third-party credits and license terms. [Code license](LICENSE) · [Asset notes](ASSET-LICENSES.md)

[English](README.md) | [中文](README.zh-CN.md)

# Gofish’s personal homepage

I like to be specific about the things I care about and leave some room for the person listening. I think of that balance as “warm restraint.” Some AI products use dark backgrounds, neon gradients and glassy glows to suggest the future. I wanted this site to feel like a notebook left open on a desk, with room for a carefully framed research question and a photo of my parents and me at graduation.

The live site has my research notes, education and photos from everyday life. If you’re building a homepage of your own, there’s also a template with neutral sample content. [Homepage in English](https://DolomitiAugust.github.io/?lang=en) · [中文主页](https://DolomitiAugust.github.io/?lang=zh) · [Design notes](DESIGN.md)

[![Preview the template](https://img.shields.io/badge/Preview-template-8a5a44?style=for-the-badge)](https://DolomitiAugust.github.io/template-preview/)
[![Clone the template](https://img.shields.io/badge/Clone-template-2ea44f?style=for-the-badge&logo=github&logoColor=white)](https://DolomitiAugust.github.io/template.zip)

**Start your own copy:** [preview the template live](https://DolomitiAugust.github.io/template-preview/) — sample content only, with no personal text, photos or links — or [download the template ZIP](https://DolomitiAugust.github.io/template.zip) and run `npm run build && npm run preview`.

## Design approach

**Warm restraint** is the balance I look for between clarity and personality. The site borrows the feel of paper and ink: warm neutrals, clay accents, readable type and enough space for the content to breathe. Fine grain, directional fibers and broad pulp variation give the header and footer their paper texture. Light and dark themes use contrasting paper frames while keeping the reading area comfortable.

The layout treats research and everyday life as parts of the same person. Questions and projects get room for detail; photographs and short captions make space for family, travel and other interests. The aim is to communicate carefully without making the page feel formal or distant.

Motion follows the thing being drawn. A pencil touches paper to write, a burger layer slides out, and a shuttlecock responds to a racket. Gestures have a beginning and a rest, with small variations in pressure and timing. The header settles into a centered wordmark while reading, then returns to full navigation near the top. Reduced-motion settings keep the interface usable at rest.

The key page brings three Gofish characters into a shared space. Their different habits and reactions add playfulness around the form, while the form remains easy to use. The key is a front-end access gate, not an authentication security boundary. [Design notes](DESIGN.md) · [Mascot motion](docs/mascot-actions.md)

## Build and preview

The personal site uses native HTML, CSS and JavaScript, supports 14 languages and includes light and dark themes. Node.js 20 or later is required; the site build has no third-party dependencies.

From the repository root, build and preview with Node.js 20 or later. There are no third-party dependencies to install.

```sh
npm run build
npm run preview
```

Open the [local preview](http://127.0.0.1:4173). After editing a source file, rebuild and refresh the page. Press `Ctrl+C` to stop the preview server.

With Chrome and Python Playwright available, keep the preview running and use `python tests/gate_browser.py --evidence ../gate-review` to exercise the gate locally. The success test substitutes a temporary digest in one isolated browser response.

Use `python tests/mascot_dynamics.py --url http://127.0.0.1:4173 --evidence ../mascot-soak` for a real three-minute motion observation. Add `--interactions` to check input priorities, privacy, keyboard activation and interrupted landings. The observation hook exists only in intercepted local test responses.

## Make your own homepage

The template includes English and Chinese, sample projects, placeholder illustrations and fonts licensed for redistribution. None of the personal text, photos or links from this site appear in it — every contact link is a placeholder you replace. [Preview it live](https://DolomitiAugust.github.io/template-preview/) or [download the ZIP](https://DolomitiAugust.github.io/template.zip).

**Export from an existing clone.** From the root of the `main` branch, export the template into a new directory.

```sh
node scripts/create-template.mjs ../my-homepage
cd ../my-homepage
npm run build
npm run preview
```

**How the template stays current.** The template is rebuilt automatically on every deploy from this site's design and structure, so it always reflects the latest homepage — including new sections, layout and styling. Only the personal content layer is held back: the entry key, all photos, your real links and every piece of personal writing stay out, and every contact link is a placeholder you replace. If you add a UI label or a new section to the homepage, the export fails loudly until the template's neutral copy is updated, so nothing personal can leak by accident.

Either route above gives you a site that builds on its own. The `template/` directory on `main` holds only the neutral settings and sample assets used to replace the personal content during export. See `AGENTS.md` at the root of the exported project for its maintenance guide.

## Edit the content

| What to change | Where to edit |
| --- | --- |
| Name, introduction, contact details, site URL and last-updated label | `content.json` |
| Research or projects, education, skills, interests and gallery order | The corresponding arrays in `content.json` |
| Interface labels and translations | `src/i18n.json` |
| Page structure, colors, controls and typography | `src/index.html`, `src/style.css`, `src/controls.css`, `src/editorial.css` |
| Illustrations and their motion | `scripts/illustrations.mjs`, `scripts/hobby-scenes.mjs`, `scripts/sketch-pencil.mjs`, `src/style.css` and `src/app.js` |

The personal site uses `content.json` to build the opening section and default English copy. The language switcher uses `src/i18n.json`. When you edit text that has translations, update the matching fields in each language, including the personal site’s English dictionary. Keep the project `className` and the hobby `symbol` unchanged across languages. They select the illustrations.

Store gallery photos in `dist/assets/photos/`. Supply both `name.webp` and `name-small.webp`, then set `gallery[].image` to the name without its extension. Add a title, caption, alt text and framing position. Each translation identifies the same photo by its `image` value. The personal site’s header avatar is referenced directly from `src/index.html` as `dist/assets/photos/header-mascot.webp`. The standalone template uses its own avatar assets. Before publishing a photo, remove any EXIF metadata you want to keep private.

The `dist/` directory contains both published output and build inputs. Keep the photos, fonts and badges in `dist/assets/`. The build reads or validates them and generates the pages and scripts from source.

## Publish

When changes to the relevant pages, scripts or assets reach `main`, GitHub Actions builds the personal site and deploys `dist/`. [Personal site workflow](.github/workflows/pages.yml)

The template is set up for local preview. To publish it from your own repository, follow these steps.

1. Set `siteUrl` in `content.json` to your full public URL. For a GitHub Pages project site, include the repository path. Replace the sample contact details and images, then push the project to your own repository.
2. In your repository, copy `deploy/pages.yml.example` to `.github/workflows/pages.yml` and commit it to the default branch. Under **Settings → Pages → Build and deployment → Source**, select **GitHub Actions**. [GitHub Pages publishing settings](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
3. Open **Actions**, select the Pages workflow, click **Run workflow** and choose the branch to publish. The example workflow builds and deploys `dist/` only when run manually.

## License

The original code and illustrations are available under the MIT License. The author’s personal photos, avatar and writing are outside the scope of the template’s reuse license. The personal site has separate authorization to use the Anthropic fonts on the web. The template ships fonts under open licenses. The asset notes cover third-party credits and license terms. [Code license](LICENSE) · [Asset notes](ASSET-LICENSES.md)

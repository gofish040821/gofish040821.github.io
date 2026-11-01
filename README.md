[English](README.md) | [中文](README.zh-CN.md)

# Gofish’s personal homepage

I like to be specific about the things I care about and leave some room for the person listening. I think of that balance as “warm restraint.” Some AI products use dark backgrounds, neon gradients and glassy glows to suggest the future. I wanted this site to feel like a notebook left open on a desk, with room for a carefully framed research question and a photo of my parents and me at graduation.

The live site has my research notes, education and photos from everyday life. If you’re building a homepage of your own, there’s also a template with neutral sample content. [Homepage in English](https://gofish040821.github.io/?lang=en) · [中文主页](https://gofish040821.github.io/?lang=zh) · [Design notes](DESIGN.md)

## Preview the personal site

Updated 2026-11-02. The hobby heading now reads “Sports,” while keeping the badminton illustration. A subtle paper-fiber texture extends across the closing section and footer, with separate settings for light and dark themes.

Updated 2026-11-01. Skills & Tools now includes Figma, Zotero, Manim, DaVinci Resolve and REAPER alongside the development and research tools. Each uses the same monochrome pencil sketch and label style. Expand the list to see all 30 tools.

The `main` branch contains the source for the live site. It supports 14 languages and light and dark themes. The third version keeps all 11 original pencil illustrations and gives each its own movement. The pencil touches down twice to write a note. The burger’s middle layer slides out and pauses at an angle.

From the repository root, build and preview with Node.js 20 or later. There are no third-party dependencies to install.

```sh
npm run build
npm run preview
```

Open the [local preview](http://127.0.0.1:4173). After editing a source file, rebuild and refresh the page. Press `Ctrl+C` to stop the preview server.

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

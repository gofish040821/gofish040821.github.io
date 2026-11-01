import { copyFile, mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const publicFonts = ['source-serif-4-regular', 'source-sans-3-regular'];
const metaDescription = String.raw`  metaDescription: escape(String(data.intro ?? '').replace(/<\/?(?:br|p|div)\b[^<>]*>/gi, ' ').replace(/<\/?[a-z][^<>]*>/gi, '').replace(/\s+/g, ' ').trim()),`;

const englishFromContent = `// content.json supplies the English copy for both first paint and language switching.
const english = i18n.translations.en;
for (const key of Object.keys(english.strings)) {
  if (typeof data[key] === 'string') english.strings[key] = values[key];
}
for (const key of Object.keys(english.content)) {
  if (Array.isArray(data[key])) english.content[key] = data[key];
}
for (const entry of Object.values(i18n.translations)) {
  entry.strings.metaTitle = data.name + ' · Personal homepage';
  entry.strings.brandHome = data.name + ' home';
}
`;

function genericBuild(source) {
  return source
    .replace(/^import \{ fishMark \} from '\.\/fish-mark\.mjs';\n/m, '')
    .replace(/^  fishMark: fishMark\(\),\n/m, '')
    .replace(/^await copyFile\(resolve\(root, 'src\/assets\/fish\.svg'\)[^\n]*\n/m, '')
    .replace(/^const currentAge = \(\) => \{[\s\S]*?^\};/m, "const currentAge = () => '';")
    .replace(/^const heroHeadline = [^\n]+;/m, 'const heroHeadline = escape;')
    .replace('const values = {\n', 'const values = {\n' + metaDescription + '\n')
    .replace('const translations = {};', englishFromContent + '\nconst translations = {};')
    .replace("html.replace('</body>', `<script>", "html.replace('</body>', () => `<script>")
    .replace(/^for \(const font of \['anthropic-[^\n]+\]\) \{/m,
      `for (const font of ${JSON.stringify(publicFonts)}) {`)
    .replace(", 'busuanzi.pure.mini.js'", '')
    .replace(/^\/\/ A missing path[^\n]*\n\/\/[^\n]*\n/m, '')
    .replace('Built Gofish homepage', 'Built portfolio homepage');
}

function genericApp(source) {
  return source
    .replace(/^  const BIRTH_DATE = [^\n]+;\n/m, '')
    .replace(/^  function currentAge\(\) \{[\s\S]*?^  \}/m, "  const currentAge = () => '';")
    .replace(/        const text = renderText\(value\);\n        el\.innerHTML = el\.dataset\.i18n === 'headline'\n[^\n]*\n          : text;/, '        el.innerHTML = renderText(value);')
    .replaceAll('gofish-language', 'portfolio-language')
    .replaceAll('gofish-theme', 'portfolio-theme')
    .replaceAll('Gofish', 'Your Name');
}

async function exportSite(target) {
  const pathInRepo = relative(root, target);
  if (!isAbsolute(pathInRepo) && ['.git', 'template', 'src', 'scripts', 'dist'].includes(pathInRepo.split(sep)[0])) {
    throw new Error('Choose a destination outside the source and template directories.');
  }
  await mkdir(dirname(target), { recursive: true });
  // Deliberately claim the final directory without recursive mode. Concurrent
  // exports and existing directories (even empty ones) must never be merged.
  await mkdir(target);

  async function copy(from, to = from) {
    const output = resolve(target, to);
    await mkdir(dirname(output), { recursive: true });
    await copyFile(resolve(root, from), output);
  }

  async function transformed(file, transform) {
    const original = await readFile(resolve(root, file), 'utf8');
    const generic = transform(original.replace(/\r\n/g, '\n'));
    if (/gofish|2004-08-21|BIRTH_DATE|busuanzi|anthropic|fishMark|fish-mark\.mjs|assets\/fish\.svg|Agent RSI|Physical AI/i.test(generic)) {
      throw new Error(`Personal site references remain in ${file}. Update the export conversion before sharing.`);
    }
    await mkdir(dirname(resolve(target, file)), { recursive: true });
    await writeFile(resolve(target, file), generic);
  }

  async function copyTemplateAssets(from = 'template/assets', to = 'dist/assets') {
    for (const item of await readdir(resolve(root, from), { withFileTypes: true })) {
      const input = `${from}/${item.name}`, output = `${to}/${item.name}`;
      if (item.isDirectory()) await copyTemplateAssets(input, output);
      else if (item.isFile()) await copy(input, output);
      else throw new Error(`Template assets must be regular files or directories: ${input}`);
    }
  }

  for (const name of ['serve', 'illustrations', 'hobby-scenes', 'sketch-pencil', 'hand-drawn', 'skill-icons', 'ui-icons', 'control-icons']) {
    await copy(`scripts/${name}.mjs`);
  }
  await transformed('scripts/build.mjs', genericBuild);
  await transformed('src/app.js', genericApp);
  await transformed('src/style.css', css => css.replace(/\/\* ---- visitor counter ----[\s\S]*?\*\/\n/, ''));
  await copy('src/controls.css');
  for (const file of ['index.html', '404.html', 'editorial.css', 'i18n.json']) {
    await copy(`template/src/${file}`, `src/${file}`);
  }
  await copy('template/content.json', 'content.json');
  await copy('template/pages.yml', 'deploy/pages.yml.example');
  await copy('template/README.md', 'README.md');
  await copy('template/README.zh-CN.md', 'README.zh-CN.md');
  await copy('template/DESIGN.md', 'DESIGN.md');
  await copy('template/DESIGN.zh-CN.md', 'DESIGN.zh-CN.md');
  for (const name of ['AGENTS.md', 'LICENSE', 'ASSET-LICENSES.md']) {
    const override = await stat(resolve(root, 'template', name)).catch(error => {
      if (error.code === 'ENOENT') return null;
      throw error;
    });
    await copy(override ? `template/${name}` : name, name);
  }
  for (const name of [...publicFonts.map(f => f + '.woff2'), 'Source-Serif-LICENSE.md', 'Source-Sans-LICENSE.md']) {
    await copy(`dist/assets/fonts/${name}`);
  }
  for (const item of await readdir(resolve(root, 'dist/assets/skills'), { withFileTypes: true })) {
    if (item.isFile() && /^[a-z0-9-]+\.svg$/.test(item.name)) await copy(`dist/assets/skills/${item.name}`);
  }
  await copyTemplateAssets();

  const pkg = {
    name: 'personal-portfolio', version: '1.0.0', private: true,
    scripts: { build: 'node scripts/build.mjs', preview: 'node scripts/serve.mjs' },
    engines: { node: '>=20' }
  };
  await writeFile(resolve(target, 'package.json'), JSON.stringify(pkg, null, 2) + '\n');
  await writeFile(resolve(target, '.gitignore'), 'node_modules/\n.DS_Store\nThumbs.db\n*.log\n.env\n.env.*\n');
}

const [destination, ...extra] = process.argv.slice(2);
if (!destination?.trim() || extra.length) {
  console.error('Usage: node scripts/create-template.mjs <new-directory>');
  process.exitCode = 1;
} else {
  const target = resolve(destination);
  try {
    await exportSite(target);
    console.log(`Created portfolio in ${target}\nFrom that directory run npm run build, then npm run preview.`);
  } catch (error) {
    console.error(`Could not export to ${target}: ${error.message}`);
    process.exitCode = 1;
  }
}

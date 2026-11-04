import { copyFile, mkdir, readFile, readdir, stat, writeFile, rm } from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { deflateRawSync } from 'node:zlib';
import { spawnSync } from 'node:child_process';

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
    .replace("import { buildGateAssets } from './build-gate-assets.mjs';\n", '')
    .replace('  gateAssets: await buildGateAssets(root),\n', '')
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

// --- Structure layer (index.html) is derived from the personal site so the two
// --- never diverge: any section, control or layout the owner adds to the live
// --- page is reflected here. Only the gate, personal meta and the visitor
// --- counter are stripped; everything structural stays.
function genericIndexHtml(source) {
  let html = source.replace(/\r\n/g, '\n');
  html = html.replace(/<style>\s*\/\* Simple front-end key gate[\s\S]*?<\/style>\n?/, '');
  html = html.replace(/<link rel="stylesheet" href="\{\{gateAssets\}\}\/gate-mascots\.css">\n?/, '');
  html = html.replace(/<link rel="stylesheet" href="\{\{gateAssets\}\}\/gate-dialogue\.css">\n?/, '');
  html = html.replace(/<link rel="preload" href="\.\/assets\/fonts\/anthropic-serif-roman\.woff2"[^>]*>\n?\s*<link rel="preload" href="\.\/assets\/fonts\/anthropic-sans-roman\.woff2"[^>]*>\n?\s*<link rel="preload" href="\.\/assets\/fonts\/anthropic-serif-italic\.woff2"[^>]*>\n?/,
    '<link rel="preload" href="./assets/fonts/source-serif-4-regular.woff2" as="font" type="font/woff2" crossorigin>\n  <link rel="preload" href="./assets/fonts/source-sans-3-regular.woff2" as="font" type="font/woff2" crossorigin>\n');
  html = html.replace(/<script src="\.\/busuanzi\.pure\.mini\.js" defer><\/script>\n?/, '');
  html = html.replace(/<div class="gate"[\s\S]*?GATE_HASH[\s\S]*?<\/script>\n?/, '');
  html = html.replace(/\s+inert\b/g, '');
  html = html.replace(/<body class="gate-locked">/, '<body>');
  html = html.replace(/<meta name="description" content="[^"]*">/, '<meta name="description" content="{{metaDescription}}">');
  html = html.replace(/<meta property="og:title" content="[^"]*">/, '<meta property="og:title" content="{{name}} · Personal homepage">');
  html = html.replace(/<meta property="og:description" content="[^"]*">/, '<meta property="og:description" content="{{metaDescription}}">');
  html = html.replace(/<title>[^<]*<\/title>/, '<title>{{name}} · Personal homepage</title>');
  html = html.replace(/<a class="brand" href="#home" aria-label="[^"]*" data-i18n-aria="brandHome">/, '<a class="brand" href="#home" aria-label="{{name}} home" data-i18n-aria="brandHome">');
  html = html.replace(/<img src="\.\/assets\/photos\/header-mascot\.webp" alt="[^"]*"[^>]*>/, '<img src="./assets/photos/avatar-small.webp" alt="" width="38" height="38">');
  html = html.replace(/<img src="\.\/assets\/photos\/{{heroImage}}\.webp" alt="[^"]*"([^>]*)>/, '<img src="./assets/photos/{{heroImage}}.webp" alt="Portfolio cover"$1>');
  html = html.replace(/\{\{fishMark\}\}/, '');
  html = html.replace(/<span data-i18n="footerTag">[^<]*<\/span>/, '<span data-i18n="footerTag">Portfolio</span>');
  html = html.replace(/<span class="visit-stats"><span id="busuanzi_container_site_pv" class="visit-stat"><span data-i18n="statsViews">[^<]*<\/span> <span id="busuanzi_value_site_pv" class="visit-value"><\/span><\/span><span id="busuanzi_container_site_uv" class="visit-stat"><span class="visit-sep" aria-hidden="true">&middot;<\/span> <span data-i18n="statsVisitors">[^<]*<\/span> <span id="busuanzi_value_site_uv" class="visit-value"><\/span><\/span><\/span>/, '');
  html = html.replace(/localStorage\.getItem\('gofish-theme'\)/, "localStorage.getItem('portfolio-theme')");
  return html;
}

// The 404 page is a redirect stub; only the personal title is neutralised.
function generic404(source) {
  return source.replace(/\r\n/g, '\n').replace(/<title>[^<]*<\/title>/, '<title>Page not found</title>');
}

// Design layer (editorial.css): keep every rule, but swap the licensed web fonts
// the template cannot ship for the open Source Serif/Sans it does ship, and drop
// any comment that names the licensed fonts. The rest of the styling (paper
// texture, illustrations, layout) is shared verbatim so design stays in sync.
const SOURCE_FONT_FACES = `@font-face{font-family:"Source Serif 4";src:url("./assets/fonts/source-serif-4-regular.woff2") format("woff2");font-style:normal;font-weight:200 900;font-display:swap}\n@font-face{font-family:"Source Sans 3";src:url("./assets/fonts/source-sans-3-regular.woff2") format("woff2");font-style:normal;font-weight:200 900;font-display:swap}\n`;
function genericEditorialCss(source) {
  return source.replace(/\r\n/g, '\n')
    .replace(/@font-face\{[^}]*font-family:"(?:Anthropic|Noto Serif SC)[^"]*"[^}]*\}\n?/g, '')
    .replace(/"Anthropic Serif"/g, '"Source Serif 4"')
    .replace(/"Anthropic Sans"/g, '"Source Sans 3"')
    .replace(/"Anthropic Mono"/g, '"Source Sans 3"')
    .replace(/\/\*[\s\S]*?\*\/\n?/g, m => (/Anthropic/.test(m) ? '' : m))
    .replace(/^/, SOURCE_FONT_FACES);
}

const PERSONAL_GUARD = /gofish|2004-08-21|BIRTH_DATE|busuanzi|anthropic|fishMark|fish-mark\.mjs|assets\/fish\.svg|Agent RSI|Physical AI/i;

// Content-layer contract: the template's i18n keeps its own invented copy, but
// its UI string keys and section keys must track the homepage. New UI strings or
// sections on the live site fail the export loudly so nothing personal leaks and
// the structure never silently drifts.
async function exportI18n(target) {
  const mainI18n = JSON.parse(await readFile(resolve(root, 'src/i18n.json'), 'utf8'));
  const tplI18n = JSON.parse(await readFile(resolve(root, 'template/src/i18n.json'), 'utf8'));
  for (const code of Object.keys(tplI18n.translations)) {
    const tplStrings = tplI18n.translations[code].strings || {};
    const mainStrings = mainI18n.translations[code]?.strings || {};
    const missingStrings = Object.keys(mainStrings).filter(key => !(key in tplStrings));
    if (missingStrings.length) {
      throw new Error(`template i18n (${code}) is missing UI string keys required by the homepage: ${missingStrings.join(', ')}. Add neutral values to template/src/i18n.json.`);
    }
    const mainContent = Object.keys(mainI18n.translations[code].content || {});
    const tplContent = Object.keys(tplI18n.translations[code].content || {});
    const missingContent = mainContent.filter(key => !tplContent.includes(key));
    const extraContent = tplContent.filter(key => !mainContent.includes(key));
    if (missingContent.length || extraContent.length) {
      throw new Error(`template i18n (${code}) content sections must match the homepage: missing [${missingContent}], extra [${extraContent}].`);
    }
  }
  const out = JSON.stringify(tplI18n, null, 2) + '\n';
  if (PERSONAL_GUARD.test(out)) throw new Error('Personal site references remain in template i18n.json.');
  await mkdir(resolve(target, 'src'), { recursive: true });
  await writeFile(resolve(target, 'src/i18n.json'), out);
}

async function exportSite(target) {
  const pathInRepo = relative(root, target).split(sep).join('/');
  const top = pathInRepo.split('/')[0];
  const blocked = ['.git', 'template', 'src', 'scripts'];
  if (!isAbsolute(pathInRepo) && (blocked.includes(top) || (top === 'dist' && !/^dist\/\.template-build($|\/)/.test(pathInRepo)))) {
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

  for (const name of ['serve', 'illustrations', 'hobby-scenes', 'sketch-pencil', 'hand-drawn', 'skill-icons', 'ui-icons', 'control-icons', 'create-template']) {
    await copy(`scripts/${name}.mjs`);
  }
  await transformed('scripts/build.mjs', genericBuild);
  await transformed('src/app.js', genericApp);
  await transformed('src/style.css', css => css.replace(/\/\* ---- visitor counter ----[\s\S]*?\*\/\n/, ''));
  await copy('src/controls.css');
  // Structure and design layers are derived from the live site so they stay in
  // sync automatically; only the content layer (template/content.json and the
  // invented i18n copy) is kept separate and isolated.
  await transformed('src/index.html', genericIndexHtml);
  await transformed('src/404.html', generic404);
  await transformed('src/editorial.css', genericEditorialCss);
  await exportI18n(target);
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

async function copyDir(src, dest) {
  await mkdir(dest, { recursive: true });
  for (const entry of await readdir(src, { withFileTypes: true })) {
    const from = resolve(src, entry.name);
    const to = resolve(dest, entry.name);
    if (entry.isDirectory()) await copyDir(from, to);
    else if (entry.isFile()) await copyFile(from, to);
  }
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    table[n] = c >>> 0;
  }
  return table;
})();
function crc32(buffer) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buffer.length; i++) c = CRC_TABLE[(c ^ buffer[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

// Dependency-free ZIP (UTF-8 names, deflate) so the downloadable template needs
// no third-party packages.
async function zipDir(srcDir, outFile) {
  const files = [];
  async function walk(dir, base) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      if (entry.name === 'node_modules' || entry.name === '.git') continue;
      const full = resolve(dir, entry.name);
      const rel = base ? `${base}/${entry.name}` : entry.name;
      if (entry.isDirectory()) await walk(full, rel);
      else if (entry.isFile()) files.push(rel);
    }
  }
  await walk(srcDir, '');
  files.sort();
  const encoder = new TextEncoder();
  const localParts = [];
  const central = [];
  let offset = 0;
  for (const rel of files) {
    const data = await readFile(resolve(srcDir, rel));
    const nameBuf = encoder.encode(rel);
    const compressed = deflateRawSync(data);
    const crc = crc32(data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6); // UTF-8 filename
    local.writeUInt16LE(8, 8); // deflate
    local.writeUInt16LE(0, 10);
    local.writeUInt16LE(0, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(compressed.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    local.writeUInt16LE(0, 28);
    localParts.push(local, nameBuf, compressed);
    const centralHdr = Buffer.alloc(46);
    centralHdr.writeUInt32LE(0x02014b50, 0);
    centralHdr.writeUInt16LE(20, 4);
    centralHdr.writeUInt16LE(20, 6);
    centralHdr.writeUInt16LE(0x0800, 8);
    centralHdr.writeUInt16LE(8, 10);
    centralHdr.writeUInt16LE(0, 12);
    centralHdr.writeUInt16LE(0, 14);
    centralHdr.writeUInt32LE(crc, 16);
    centralHdr.writeUInt32LE(compressed.length, 20);
    centralHdr.writeUInt32LE(data.length, 24);
    centralHdr.writeUInt16LE(nameBuf.length, 28);
    centralHdr.writeUInt16LE(0, 30);
    centralHdr.writeUInt16LE(0, 32);
    centralHdr.writeUInt16LE(0, 34);
    centralHdr.writeUInt16LE(0, 36);
    centralHdr.writeUInt32LE(offset, 42);
    central.push(centralHdr, nameBuf);
    offset += local.length + nameBuf.length + compressed.length;
  }
  const centralBuf = Buffer.concat(central);
  const localBuf = Buffer.concat(localParts);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(centralBuf.length, 12);
  end.writeUInt32LE(localBuf.length, 16);
  end.writeUInt16LE(0, 20);
  await new Promise((resolvePromise, reject) => {
    const stream = createWriteStream(outFile);
    stream.on('error', reject);
    stream.write(localBuf);
    stream.write(centralBuf);
    stream.write(end);
    stream.end(() => resolvePromise());
  });
}

// Build the template source into a throwaway directory, then publish a live
// preview and a downloadable ZIP next to the personal site's build output.
// Called from build.mjs so the template is regenerated on every deploy; the
// nested build is flagged so it never recurses into another template build.
export async function generateTemplatePreviewAndZip(distDir = resolve(root, 'dist')) {
  const scratch = resolve(root, 'dist/.template-build');
  await rm(scratch, { recursive: true, force: true });
  await exportSite(scratch);
  const result = spawnSync(process.execPath, ['scripts/build.mjs'], {
    cwd: scratch,
    env: { ...process.env, TEMPLATE_BUILD: '1' },
    encoding: 'utf8'
  });
  if (result.status !== 0) {
    throw new Error(`Template build failed:\n${result.stderr || result.stdout || 'unknown error'}`);
  }
  await copyDir(resolve(scratch, 'dist'), resolve(distDir, 'template-preview'));

  // The live preview mirrors the personal site's Anthropic typography, while the
  // downloadable ZIP keeps the open-source fonts that are safe to redistribute.
  const previewDir = resolve(distDir, 'template-preview');
  for (const font of ['anthropic-serif-roman', 'anthropic-serif-italic', 'anthropic-sans-roman', 'anthropic-sans-italic', 'anthropic-mono-roman', 'noto-serif-sc-subset']) {
    await copyFile(resolve(distDir, 'assets/fonts', `${font}.woff2`), resolve(previewDir, 'assets/fonts', `${font}.woff2`));
  }
  for (const css of ['editorial.css', 'style.css', 'controls.css']) {
    await copyFile(resolve(distDir, css), resolve(previewDir, css));
  }
  const previewIndex = resolve(previewDir, 'index.html');
  const previewHtml = await readFile(previewIndex, 'utf8');
  await writeFile(previewIndex, previewHtml.replace(
    /<link rel="preload" href="\.\/assets\/fonts\/source-serif-4-regular\.woff2"[^>]*>\s*<link rel="preload" href="\.\/assets\/fonts\/source-sans-3-regular\.woff2"[^>]*>/,
    '<link rel="preload" href="./assets/fonts/anthropic-serif-roman.woff2" as="font" type="font/woff2" crossorigin> <link rel="preload" href="./assets/fonts/anthropic-sans-roman.woff2" as="font" type="font/woff2" crossorigin> <link rel="preload" href="./assets/fonts/anthropic-serif-italic.woff2" as="font" type="font/woff2" crossorigin>'
  ));

  await zipDir(scratch, resolve(distDir, 'template.zip'));
  await rm(scratch, { recursive: true, force: true });
  console.log('Built template preview and downloadable ZIP from the current site design.');
}

const [destination, ...extra] = process.argv.slice(2);
if (resolve(process.argv[1] || '') === fileURLToPath(import.meta.url)) {
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
}

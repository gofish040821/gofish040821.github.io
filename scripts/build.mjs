import { readFile, writeFile, mkdir, copyFile, access } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { illustration, illustrationSprite } from './illustrations.mjs';
import { loadSkillIcons, skillIllustrationSprite } from './skill-icons.mjs';
import { uiIcon, uiIllustrationSprite } from './ui-icons.mjs';
import { controlIcon } from './control-icons.mjs';
import { fishMark } from './fish-mark.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const data = JSON.parse(await readFile(resolve(root, 'content.json'), 'utf8'));
const i18n = JSON.parse(await readFile(resolve(root, 'src/i18n.json'), 'utf8'));
// Content-based versions prevent HTML updates from reusing stale CSS or JS.
const assetVersions = Object.fromEntries(await Promise.all(
  [['styleVersion', 'style.css'], ['controlsVersion', 'controls.css'], ['editorialVersion', 'editorial.css'], ['appVersion', 'app.js']]
    .map(async ([key, file]) => [key, createHash('sha256').update(await readFile(resolve(root, 'src', file))).digest('hex').slice(0, 12)])
));
const allSkills = [...data.skills, ...data.agentSkills];
const skillIcons = await loadSkillIcons(root, allSkills);
const skillOrder = ['python','pytorch','numpy','huggingface','transformers','langchain','langgraph','rag','mcp','git','latex','docker','cpp','java','golang','springboot','typescript','javascript','react','nodejs','html','css','socketio','vite','vitest'];
const orderedSkills = [...allSkills].sort((a,b) => skillOrder.indexOf(a.badge)-skillOrder.indexOf(b.badge));
const escape = (value) => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const paragraphs = value => escape(value).replace(/&lt;br\s*\/?&gt;/g, '<br>');
const heroHeadline = value => escape(value).replace(/\b(Agent RSI|Physical AI)\b/g, '<bdi class="research-name" dir="ltr" lang="en">$1</bdi>');
const currentAge = () => {
  const today = new Date();
  const birth = new Date('2004-08-21T00:00:00');
  let age = today.getFullYear() - birth.getFullYear();
  const birthdayPassed = today.getMonth() > birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() >= birth.getDate());
  return birthdayPassed ? age : age - 1;
};
const renderRuntimeText = value => String(value).replace(/\{age\}/g, String(currentAge()));
const photoPath = (name, small = false) => {
  if (!/^[a-z0-9-]+$/.test(name)) throw new Error(`Invalid photo name: ${name}`);
  return `./assets/photos/${name}${small ? '-small' : ''}.webp`;
};

// Read intrinsic thumbnail dimensions so mixed portrait/landscape photos can
// keep their full framing without shifting the page as lazy images arrive.
async function photoSize(name, small = true) {
  const image = await readFile(resolve(root, 'dist', photoPath(name, small)));
  if (image.toString('ascii', 0, 4) !== 'RIFF' || image.toString('ascii', 8, 12) !== 'WEBP') {
    throw new Error(`Invalid WebP photo: ${name}`);
  }
  for (let offset = 12; offset + 8 <= image.length;) {
    const type = image.toString('ascii', offset, offset + 4);
    const size = image.readUInt32LE(offset + 4);
    const start = offset + 8;
    if (start + size > image.length) break;
    if (type === 'VP8X' && size >= 10) return [1 + image.readUIntLE(start + 4, 3), 1 + image.readUIntLE(start + 7, 3)];
    if (type === 'VP8 ' && size >= 10) return [image.readUInt16LE(start + 6) & 0x3fff, image.readUInt16LE(start + 8) & 0x3fff];
    if (type === 'VP8L' && size >= 5) {
      const bits = image.readUInt32LE(start + 1);
      return [1 + (bits & 0x3fff), 1 + ((bits >>> 14) & 0x3fff)];
    }
    offset = start + size + (size % 2);
  }
  throw new Error(`Cannot read photo dimensions: ${name}`);
}
const photoSizes = new Map(await Promise.all(data.gallery.map(async item => [item.image, await photoSize(item.image)])));
const fullPhotoSizes = new Map(await Promise.all(data.gallery.map(async item => [item.image, await photoSize(item.image, false)])));
const photoSrcset = name => `${photoPath(name, true)} ${photoSizes.get(name)[0]}w, ${photoPath(name)} ${fullPhotoSizes.get(name)[0]}w`;
const heroSizes = await photoSize(data.heroImage, false);
const heroSrcset = `${photoPath(data.heroImage, true)} ${(await photoSize(data.heroImage))[0]}w, ./assets/photos/${data.heroImage}-medium.webp 1200w, ${photoPath(data.heroImage)} ${heroSizes[0]}w`;
const gallerySizes = index => {
  const span = index < 4 ? (index % 2 ? 7 : 5) : 4;
  const fraction = span / 12;
  return `(max-width:520px) calc(100vw - 40px), (max-width:760px) calc((100vw - 60px) / 2), (max-width:1100px) calc(${(fraction * 100).toFixed(3)}vw - ${(fraction * 40 + 24).toFixed(3)}px), (max-width:1256px) calc(${(fraction * 100).toFixed(3)}vw - ${(fraction * 64 + 32).toFixed(3)}px), ${(fraction * 1192 - 32).toFixed(3)}px`;
};
const galleryOrder = data.gallery.map(item => item.image);

// Translations follow image identity, never an independent positional index.
function orderedGallery(items, language) {
  const byImage = new Map(items.map(item => [item.image, item]));
  if (items.length !== galleryOrder.length || byImage.size !== items.length || galleryOrder.some(name => !byImage.has(name))) {
    throw new Error(`Gallery images do not match the source: ${language}`);
  }
  return galleryOrder.map(name => byImage.get(name));
}
for (const key of ['github', 'linkedin', 'siteUrl']) {
  if (!/^https:\/\//.test(data[key])) throw new Error(`${key} should be an https URL`);
}

// --- Section renderers. The default content and every translation go through
// --- exactly the same markup, so switching language never shifts the layout.
const renderAbout = items => items.map(text => `<p>${escape(text)}</p>`).join('\n');
const renderResearch = (items, strings) => items.map(item => {
  const key = escape(item.className);
  const details = item.details;
  if (!details?.approach || !details?.evaluation) throw new Error(`Missing research details: ${item.title}`);
  return `<article class="research-card ${key}"><div class="research-card-top">${illustration(item.className, 'research-illustration')}</div><h3 id="research-title-${key}">${escape(item.title)}</h3><p class="research-subtitle">${escape(item.subtitle)}</p><p class="research-description">${escape(item.description)}</p><div class="tags">${item.tags.map(tag => `<span>${escape(tag)}</span>`).join('')}</div><button class="research-more" type="button" data-research-key="${key}" aria-expanded="false" aria-controls="research-details-${key}" aria-describedby="research-title-${key}"><span data-research-label>${escape(strings.researchMore)}</span><span class="research-more-icon" aria-hidden="true"></span></button><div class="research-details" id="research-details-${key}" role="region" aria-labelledby="research-title-${key}" hidden><div class="research-details-content"><div class="research-detail"><h4>${escape(strings.researchApproach)}</h4><p>${escape(details.approach)}</p></div><div class="research-detail"><h4>${escape(strings.researchEvaluation)}</h4><p>${escape(details.evaluation)}</p></div></div></div></article>`;
}).join('\n');
const renderSkills = items => items.map(item => `<li class="skill-badge">${skillIcons.get(item.badge)}<span lang="en" dir="ltr">${escape(item.name)}</span></li>`).join('\n');
const renderEducation = items => items.map(item => `<article class="education-item${item.current ? ' current' : ''}"><div class="education-meta"><span class="education-dates">${escape(item.dates)}</span><span class="education-degree">${escape(item.degree)}</span></div><h3>${escape(item.school)}</h3><p class="school-abbr" lang="en">${escape(item.abbr)}</p><p class="education-note">${escape(item.note)}</p></article>`).join('\n');
const hobbyIllustrations = { '↗': 'badminton', '⌁': 'travel', '◡': 'cooking', '▷': 'film' };
const renderHobbies = items => items.map(item => `<article class="hobby">${illustration(hobbyIllustrations[item.symbol], 'hobby-illustration')}<div class="hobby-title"><h3>${escape(item.title)}</h3></div><p>${escape(item.description)}</p></article>`).join('\n');
const renderGallery = items => items.map((item, i) => {
  const [width, height] = photoSizes.get(item.image);
  const sizes = gallerySizes(i);
  return `<figure class="photo-card" data-photo="${escape(item.image)}"><a class="photo-link" href="${photoPath(item.image)}" data-caption="${escape(item.caption)}" data-title="${escape(item.title)}" aria-label="${escape(item.title)}"><img src="${photoPath(item.image, true)}" srcset="${photoSrcset(item.image)}" sizes="${sizes}" alt="${escape(item.alt)}" width="${width}" height="${height}" style="object-position:${escape(item.position)}" loading="lazy" decoding="async"><span class="expand-icon" aria-hidden="true">${uiIcon('external')}</span></a><figcaption><div class="photo-caption-copy"><span class="photo-title">${escape(item.title)}</span><p class="photo-caption">${escape(item.caption)}</p></div><span class="photo-number">${String(i+1).padStart(2,'0')}</span></figcaption></figure>`;
}).join('\n');

const values = {
  ...assetVersions,
  heroSrcset,
  heroWidth: heroSizes[0],
  heroHeight: heroSizes[1],
  alternateLinks: [...i18n.languages.map(({ code }) => `<link rel="alternate" hreflang="${code}" href="${escape(data.siteUrl)}/?lang=${code}">`), `<link rel="alternate" hreflang="x-default" href="${escape(data.siteUrl)}/?lang=en">`].join('\n  '),
  personJson: JSON.stringify({
    '@context': 'https://schema.org', '@type': 'Person', name: 'Yiming Zeng', alternateName: ['Gofish', '曾一鸣'],
    jobTitle: "Master's student in mathematics",
    affiliation: { '@type': 'CollegeOrUniversity', name: 'Southern University of Science and Technology' },
    url: data.siteUrl + '/', sameAs: [data.github, data.linkedin], email: data.email
  }).replace(/</g, '\\u003c'),
  fishMark: fishMark(),
  ...Object.fromEntries(['external','down','chevron','moon','sun','menu','close','mail'].map(name => ['control' + name[0].toUpperCase() + name.slice(1) + 'Icon', controlIcon(name)])),
  illustrationLibrary: illustrationSprite() + skillIllustrationSprite() + uiIllustrationSprite(),
  externalIcon: uiIcon('external'),
  downIcon: uiIcon('down'),
  upIcon: uiIcon('up'),
  leftIcon: uiIcon('left'),
  rightIcon: uiIcon('right'),
  chevronIcon: uiIcon('chevron'),
  plusIcon: uiIcon('plus'),
  closeIcon: uiIcon('close'),
  menuIcon: uiIcon('menu'),
  moonIcon: uiIcon('moon'),
  sunIcon: uiIcon('sun'),
  aboutIllustration: illustration('notebook', 'section-illustration'),
  researchIllustration: illustration('curiosity', 'section-illustration'),
  educationIllustration: illustration('education', 'section-illustration'),
  lifeIllustration: illustration('life', 'section-illustration'),
  toolsIllustration: illustration('tools', 'tools-illustration'),
  ...Object.fromEntries(Object.entries(data).filter(([, value]) => typeof value === 'string').map(([key, value]) => [key, escape(renderRuntimeText(value))])),
  headline: heroHeadline(data.headline),
  intro: paragraphs(data.intro),
  about: renderAbout(data.about),
  research: renderResearch(data.research, i18n.translations.en.strings),
  skills: renderSkills(orderedSkills),
  education: renderEducation(data.education),
  hobbies: renderHobbies(data.hobbies),
  gallery: renderGallery(data.gallery),
  emailLink: data.email ? `<a class="action-link contact-link" href="mailto:${escape(data.email)}"><span data-i18n="closingEmail">Write me</span> ${controlIcon('mail')}</a>` : ''
};

// --- Runtime dictionary: per language, the UI strings plus pre-rendered sections.
const translations = {};
for (const [code, entry] of Object.entries(i18n.translations || {})) {
  const content = entry.content || {};
  for (const key of ['researchMore', 'researchLess', 'researchApproach', 'researchEvaluation']) {
    if (!entry.strings[key]) throw new Error(`Missing ${key} translation: ${code}`);
  }
  if (content.research?.length !== data.research.length) throw new Error(`Incomplete research translation: ${code}`);
  translations[code] = {
    strings: entry.strings || {},
    sections: {
      about: renderAbout(content.about || []),
      research: renderResearch(content.research, entry.strings),
      education: renderEducation(content.education || []),
      hobbies: renderHobbies(content.hobbies || []),
      gallery: renderGallery(orderedGallery(content.gallery || [], code))
    }
  };
}
const payload = { default: i18n.default || 'en', siteUrl: data.siteUrl, languages: i18n.languages || [], translations };

const template = await readFile(resolve(root, 'src/index.html'), 'utf8');
let html = template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
  if (!(key in values)) throw new Error(`Missing content field: ${key}`);
  return values[key];
});
// Inline dictionary, emitted before the deferred app.js so it is always available.
// "<" and ">" are escaped so the JSON can never terminate the script element early.
const json = JSON.stringify(payload).replace(/</g, '\u005cu003c').replace(/>/g, '\u005cu003e');
const bootstrap = await readFile(resolve(root, 'src/i18n-bootstrap.js'), 'utf8');
html = html.replace('</body>', `<script>window.__I18N__=${json};</script><script>${bootstrap}</script></body>`);

await mkdir(resolve(root, 'dist'), { recursive: true });
for (const font of ['anthropic-serif-roman', 'anthropic-serif-italic', 'anthropic-sans-roman', 'anthropic-sans-italic', 'anthropic-mono-roman']) {
  await access(resolve(root, 'dist/assets/fonts', `${font}.woff2`));
}
for (const name of new Set(['avatar', data.heroImage, ...data.gallery.map(item => item.image)])) {
  for (const small of [false, true]) await access(resolve(root, 'dist', photoPath(name, small)));
}
await access(resolve(root, `dist/assets/photos/${data.heroImage}-medium.webp`));
await access(resolve(root, 'dist/assets/og-cover.jpg'));
for (const item of [...data.skills, ...data.agentSkills]) await access(resolve(root, 'dist/assets/skills', `${item.badge}.svg`));
await writeFile(resolve(root, 'dist/index.html'), html);
for (const file of ['style.css', 'controls.css', 'editorial.css', 'app.js', 'busuanzi.pure.mini.js']) await copyFile(resolve(root, 'src', file), resolve(root, 'dist', file));
await copyFile(resolve(root, 'src/assets/fish.svg'), resolve(root, 'dist/assets/fish.svg'));
await writeFile(resolve(root, 'dist/.nojekyll'), '');
await writeFile(resolve(root, 'dist/robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${data.siteUrl}/sitemap.xml\n`);
await writeFile(resolve(root, 'dist/sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${i18n.languages.map(({ code }) => `<url><loc>${escape(data.siteUrl)}/?lang=${code}</loc></url>`).join('')}</urlset>\n`);

// A missing path (e.g. gofish040821.github.io/gofish040821/, which reads as a
// repo name rather than a route) would otherwise land on Pages' bare 404 page.
const notFound = (await readFile(resolve(root, 'src/404.html'), 'utf8')).replace(/__SITE_URL__/g, data.siteUrl);
await writeFile(resolve(root, 'dist/404.html'), notFound);
console.log(`Built Gofish homepage: ${data.gallery.length} photos, ${data.research.length} research interests, ${Object.keys(translations).length} languages.`);

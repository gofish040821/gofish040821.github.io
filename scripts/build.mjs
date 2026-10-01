import { readFile, writeFile, mkdir, copyFile, access } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { illustration } from './illustrations.mjs';
import { loadSkillIcons } from './skill-icons.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const data = JSON.parse(await readFile(resolve(root, 'content.json'), 'utf8'));
const i18n = JSON.parse(await readFile(resolve(root, 'src/i18n.json'), 'utf8'));
const allSkills = [...data.skills, ...data.agentSkills];
const skillIcons = await loadSkillIcons(root, allSkills);
const skillOrder = ['python','pytorch','numpy','huggingface','transformers','langchain','langgraph','rag','mcp','git','latex','docker','cpp','java','golang','springboot','typescript','javascript','react','nodejs','html','css','socketio','vite','vitest'];
const orderedSkills = [...allSkills].sort((a,b) => skillOrder.indexOf(a.badge)-skillOrder.indexOf(b.badge));
const escape = (value) => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const paragraphs = value => escape(value).replace(/&lt;br\s*\/?&gt;/g, '<br>');
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
for (const key of ['github', 'linkedin', 'siteUrl']) {
  if (!/^https:\/\//.test(data[key])) throw new Error(`${key} should be an https URL`);
}

// --- Section renderers. The default content and every translation go through
// --- exactly the same markup, so switching language never shifts the layout.
const renderAbout = items => items.map(text => `<p>${escape(text)}</p>`).join('\n');
const renderResearch = items => items.map(item => `<article class="research-card ${escape(item.className)}"><div class="research-card-top"><span class="card-marker">${escape(item.number)}</span>${illustration(item.className, 'research-illustration')}</div><h3>${escape(item.title)}</h3><p class="research-subtitle">${escape(item.subtitle)}</p><p class="research-description">${escape(item.description)}</p><div class="tags">${item.tags.map(tag => `<span>${escape(tag)}</span>`).join('')}</div></article>`).join('\n');
const renderSkills = items => items.map(item => `<li class="skill-badge">${skillIcons.get(item.badge)}<span lang="en" dir="ltr">${escape(item.name)}</span></li>`).join('\n');
const renderNotes = items => items.map((item,i) => `<article class="research-note"><span class="note-index" aria-hidden="true">${String(i+1).padStart(2,'0')}</span><div><h4>${escape(item.title)}</h4><p>${escape(item.body)}</p></div></article>`).join('\n');
const renderEducation = items => items.map(item => `<article class="education-item${item.current ? ' current' : ''}"><div class="education-meta"><span class="education-dates">${escape(item.dates)}</span><span class="education-degree">${escape(item.degree)}</span></div><h3>${escape(item.school)}</h3><p class="school-abbr" lang="en">${escape(item.abbr)}</p><p class="education-note">${escape(item.note)}</p></article>`).join('\n');
const hobbyIllustrations = { '↗': 'badminton', '⌁': 'travel', '◡': 'cooking', '▷': 'film' };
const renderHobbies = items => items.map(item => `<article class="hobby">${illustration(hobbyIllustrations[item.symbol], 'hobby-illustration')}<div class="hobby-title"><h3>${escape(item.title)}</h3></div><p>${escape(item.description)}</p></article>`).join('\n');
const renderGallery = items => items.map((item, i) => `<figure class="photo-card"><a class="photo-link" href="${photoPath(item.image)}" data-caption="${escape(item.caption)}" data-title="${escape(item.title)}" aria-label="${escape(item.title)}"><img src="${photoPath(item.image, true)}" alt="${escape(item.alt)}" width="720" height="960" style="object-position:${escape(item.position)}" loading="lazy" decoding="async"><span class="expand-icon" aria-hidden="true">↗</span></a><figcaption><div class="photo-caption-copy"><span class="photo-title">${escape(item.title)}</span><p class="photo-caption">${escape(item.caption)}</p></div><span class="photo-number">${String(i+1).padStart(2,'0')}</span></figcaption></figure>`).join('\n');

const values = {
  aboutIllustration: illustration('notebook', 'section-illustration'),
  researchIllustration: illustration('curiosity', 'section-illustration'),
  educationIllustration: illustration('education', 'section-illustration'),
  lifeIllustration: illustration('life', 'section-illustration'),
  toolsIllustration: illustration('tools', 'tools-illustration'),
  ...Object.fromEntries(Object.entries(data).filter(([, value]) => typeof value === 'string').map(([key, value]) => [key, escape(renderRuntimeText(value))])),
  headline: paragraphs(data.headline),
  intro: paragraphs(data.intro),
  about: renderAbout(data.about),
  research: renderResearch(data.research),
  skills: renderSkills(orderedSkills),
  researchNotes: renderNotes(data.researchNotes),
  education: renderEducation(data.education),
  hobbies: renderHobbies(data.hobbies),
  gallery: renderGallery(data.gallery),
  emailLink: data.email ? `<a class="text-link" href="mailto:${escape(data.email)}"><span data-i18n="closingEmail">Write me</span> <span aria-hidden="true">↗</span></a>` : ''
};

// --- Runtime dictionary: per language, the UI strings plus pre-rendered sections.
const translations = {};
for (const [code, entry] of Object.entries(i18n.translations || {})) {
  const content = entry.content || {};
  if (!entry.strings.notesTitle || !entry.strings.notesStatus || content.researchNotes?.length !== data.researchNotes.length) throw new Error(`Incomplete research notes translation: ${code}`);
  translations[code] = {
    strings: entry.strings || {},
    sections: {
      about: renderAbout(content.about || []),
      research: renderResearch(content.research || []),
      researchNotes: renderNotes(content.researchNotes || []),
      education: renderEducation(content.education || []),
      hobbies: renderHobbies(content.hobbies || []),
      gallery: renderGallery(content.gallery || [])
    }
  };
}
const payload = { default: i18n.default || 'en', languages: i18n.languages || [], translations };

const template = await readFile(resolve(root, 'src/index.html'), 'utf8');
let html = template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
  if (!(key in values)) throw new Error(`Missing content field: ${key}`);
  return values[key];
});
// Inline dictionary, emitted before the deferred app.js so it is always available.
// "<" and ">" are escaped so the JSON can never terminate the script element early.
const json = JSON.stringify(payload).replace(/</g, '\u005cu003c').replace(/>/g, '\u005cu003e');
html = html.replace('</body>', `<script>window.__I18N__=${json};</script></body>`);

await mkdir(resolve(root, 'dist'), { recursive: true });
for (const name of new Set(['avatar', data.heroImage, ...data.gallery.map(item => item.image)])) {
  for (const small of [false, true]) await access(resolve(root, 'dist', photoPath(name, small)));
}
for (const item of [...data.skills, ...data.agentSkills]) await access(resolve(root, 'dist/assets/skills', `${item.badge}.svg`));
await writeFile(resolve(root, 'dist/index.html'), html);
for (const file of ['style.css', 'app.js', 'busuanzi.pure.mini.js']) await copyFile(resolve(root, 'src', file), resolve(root, 'dist', file));
await writeFile(resolve(root, 'dist/.nojekyll'), '');
await writeFile(resolve(root, 'dist/robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${data.siteUrl}/sitemap.xml\n`);
await writeFile(resolve(root, 'dist/sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${escape(data.siteUrl)}/</loc></url></urlset>\n`);

// A missing path (e.g. gofish040821.github.io/gofish040821/, which reads as a
// repo name rather than a route) would otherwise land on Pages' bare 404 page.
const notFound = (await readFile(resolve(root, 'src/404.html'), 'utf8')).replace(/__SITE_URL__/g, data.siteUrl);
await writeFile(resolve(root, 'dist/404.html'), notFound);
console.log(`Built Gofish homepage: ${data.gallery.length} photos, ${data.research.length} research interests, ${Object.keys(translations).length} languages.`);

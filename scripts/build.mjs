import { readFile, writeFile, mkdir, copyFile, access } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const data = JSON.parse(await readFile(resolve(root, 'content.json'), 'utf8'));
const escape = (value) => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const paragraphs = value => escape(value).replace(/&lt;br\s*\/?&gt;/g, '<br>');
const photoPath = (name, small = false) => {
  if (!/^[a-z0-9-]+$/.test(name)) throw new Error(`照片名称无效：${name}`);
  return `./assets/photos/${name}${small ? '-small' : ''}.webp`;
};
for (const key of ['github', 'siteUrl']) {
  if (!/^https:\/\//.test(data[key])) throw new Error(`${key} 应为 https 地址`);
}
const values = {
  ...Object.fromEntries(Object.entries(data).filter(([, value]) => typeof value === 'string').map(([key, value]) => [key, escape(value)])),
  headline: paragraphs(data.headline),
  intro: paragraphs(data.intro),
  about: data.about.map(text => `<p>${escape(text)}</p>`).join('\n'),
  research: data.research.map(item => `<article class="research-card ${escape(item.className)}"><div class="research-card-top"><span class="card-marker">${escape(item.number)}</span><span class="research-type">A QUESTION TO EXPLORE</span></div><h3>${escape(item.title)}</h3><p class="research-subtitle">${escape(item.subtitle)}</p><p class="research-description">${escape(item.description)}</p><div class="tags">${item.tags.map(tag => `<span>${escape(tag)}</span>`).join('')}</div><div class="process" aria-label="${escape(item.process.join('，'))}">${item.process.map((step, i) => `${i ? '<i aria-hidden="true">→</i>' : ''}<span>${escape(step)}</span>`).join('')}<i aria-hidden="true">↺</i></div></article>`).join('\n'),
  education: data.education.map(item => `<article class="education-item${item.current ? ' current' : ''}"><div class="education-meta"><span class="education-dates">${escape(item.dates)}</span><span class="education-degree">${escape(item.degree)}</span></div><h3>${escape(item.school)}</h3><p class="school-en" lang="en">${escape(item.english)}</p><p class="education-note">${escape(item.note)}</p></article>`).join('\n'),
  hobbies: data.hobbies.map(item => `<article class="hobby"><div class="hobby-title"><span class="hobby-symbol" aria-hidden="true">${escape(item.symbol)}</span><h3>${escape(item.title)}</h3></div><p>${escape(item.description)}</p></article>`).join('\n'),
  gallery: data.gallery.map((item, i) => `<figure class="photo-card"><a class="photo-link" href="${photoPath(item.image)}" data-caption="${escape(item.caption)}" data-title="${escape(item.title)}" aria-label="查看照片：${escape(item.title)}"><img src="${photoPath(item.image, true)}" alt="${escape(item.alt)}" width="720" height="960" style="object-position:${escape(item.position)}" loading="lazy" decoding="async"><span class="expand-icon" aria-hidden="true">↗</span></a><figcaption><span>${escape(item.title)}</span><span class="photo-number">${String(i+1).padStart(2,'0')}</span></figcaption></figure>`).join('\n'),
  emailLink: data.email ? `<a class="text-link" href="mailto:${escape(data.email)}">写一封邮件 ↗</a>` : ''
};
const template = await readFile(resolve(root, 'src/index.html'), 'utf8');
const html = template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
  if (!(key in values)) throw new Error(`未找到内容字段：${key}`);
  return values[key];
});
await mkdir(resolve(root, 'dist'), { recursive: true });
for (const name of new Set(['avatar', data.heroImage, ...data.gallery.map(item => item.image)])) {
  for (const small of [false, true]) await access(resolve(root, 'dist', photoPath(name, small)));
}
await writeFile(resolve(root, 'dist/index.html'), html);
for (const file of ['style.css', 'app.js']) await copyFile(resolve(root, 'src', file), resolve(root, 'dist', file));
await writeFile(resolve(root, 'dist/.nojekyll'), '');
await writeFile(resolve(root, 'dist/robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${data.siteUrl}/sitemap.xml\n`);
await writeFile(resolve(root, 'dist/sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${escape(data.siteUrl)}/</loc></url></urlset>\n`);
console.log(`Built Gofish homepage: ${data.gallery.length} photos, ${data.research.length} research interests. No dependencies required.`);

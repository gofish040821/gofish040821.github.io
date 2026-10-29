import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = name => readFile(resolve(root, name), 'utf8');
const html = await read('dist/index.html');
const source = JSON.parse(await read('src/i18n.json'));
const content = JSON.parse(await read('content.json'));
const sandbox = { window: {} };
vm.runInNewContext(html.match(/<script>(window\.__I18N__=.*?;)<\/script>/s)[1], sandbox);
const runtime = sandbox.window.__I18N__;
const keys = attribute => [...new Set([...html.matchAll(new RegExp(`${attribute}="([^"]+)"`, 'g'))].map(match => match[1]))];
const markedStrings = [...keys('data-i18n'), ...keys('data-i18n-aria')];
const sections = keys('data-i18n-section');
const allStrings = new Set([...markedStrings, ...Object.values(source.translations).flatMap(entry => Object.keys(entry.strings))]);
const missing = [];
const present = value => typeof value === 'string' && value.trim().length > 0;
for (const { code } of source.languages) {
  const entry = runtime.translations[code];
  for (const key of allStrings) if (!present(entry?.strings[key])) missing.push(`${code}: strings.${key}`);
  for (const key of sections) if (!present(entry?.sections[key])) missing.push(`${code}: sections.${key}`);
  assert(!('aboutAside' in entry.strings), `${code}: obsolete aboutAside`);
  assert(!/alt="[^"]*：/.test(entry.sections.gallery), `${code}: fullwidth colon in alt`);
}
console.log(`Languages: ${source.languages.length}; string keys: ${allStrings.size}; section keys: ${sections.length}`);
console.log(`Missing/empty keys: ${missing.length ? '\n' + missing.join('\n') : '[]'}`);
assert.equal(missing.length, 0);

// The static English source and the dictionary must agree before rendering.
const en = source.translations.en;
for (const key of ['metaTitle', 'metaDescription', 'headline', 'intro', 'heroCaption', 'profileNote', 'closing', 'closingText']) {
  assert.equal(content[key], en.strings[key], `English mismatch: ${key}`);
}
for (const key of sections) assert.deepEqual(content[key], en.content[key], `English section mismatch: ${key}`);

const copyTexts = code => {
  const entry = source.translations[code];
  return [
    ...['metaDescription', 'intro', 'heroCaption', 'closing', 'closingText'].map(key => entry.strings[key]),
    ...entry.content.about, ...entry.content.hobbies.map(item => item.description),
    ...entry.content.gallery.filter(item => ['summit', 'aircraft'].includes(item.image)).flatMap(item => [item.title, item.caption])
  ];
};
for (const text of copyTexts('en')) {
  assert(!/\b(clarity|perspective|journey|curiosity|fascinating|truly|fascinates)\b/i.test(text), text);
  for (const sentence of text.split(/[.!?]+/).filter(Boolean)) {
    const count = (sentence.match(/[\p{L}\p{N}]+(?:['’’-][\p{L}\p{N}]+)*/gu) || []).length;
    assert(count <= 25, `English sentence has ${count} words: ${sentence}`);
  }
}
for (const text of copyTexts('zh')) {
  for (const sentence of text.split(/[。！？]+/).filter(Boolean)) {
    const count = [...sentence].filter(char => !/[\p{P}\s]/u.test(char)).length;
    assert(count <= 40, `Chinese sentence has ${count} characters: ${sentence}`);
  }
}
console.log('Static/dictionary English match; new English/Chinese sentence limits pass.');

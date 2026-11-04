import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

// Give relative ES imports and all their image URLs the same immutable version.
export async function buildGateAssets(root) {
  const source = resolve(root, 'src');
  const output = resolve(root, 'dist/assets/gate');
  const files = ['gate-mascots.css', 'gate-mascots.js', 'gate-stage.js', 'gate-dialogue.css', 'gate-dialogue.js'];
  async function collect(folder) {
    for (const entry of await readdir(resolve(source, folder), { withFileTypes: true })) {
      const relative = folder + '/' + entry.name;
      if (entry.isDirectory()) await collect(relative);
      else if (entry.isFile() && /\.(js|json|webp)$/.test(relative)) files.push(relative);
      else throw new Error('Unexpected file in mascot runtime: ' + relative);
    }
  }
  await collect('mascot-art');
  const hash = createHash('sha256');
  const contents = new Map();
  for (const name of files.sort()) {
    let bytes = await readFile(resolve(source, name));
    if (!name.endsWith('.webp')) bytes = Buffer.from(bytes.toString().replace(/\r\n/g, '\n'));
    hash.update(name).update('\0').update(bytes);
    contents.set(name, bytes);
  }
  const version = hash.digest('hex').slice(0, 12);
  for (const [name, bytes] of contents) {
    const target = resolve(output, version, name);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, bytes);
  }
  for (const entry of await readdir(output, { withFileTypes: true })) {
    const target = resolve(output, entry.name);
    if (entry.isDirectory() && /^[a-f0-9]{12}$/.test(entry.name) &&
        entry.name !== version && dirname(target) === output) {
      await rm(target, { recursive: true });
    }
  }
  return './assets/gate/' + version;
}

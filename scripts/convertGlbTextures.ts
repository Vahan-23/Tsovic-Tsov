/**
 * Re-encode only color textures in GLB (baseColor/emissive → JPEG).
 * Normal / metallic-roughness / occlusion stay PNG — JPEG breaks PBR data maps.
 *
 * Usage: npx tsx scripts/convertGlbTextures.ts [path/to/model.glb ...]
 */
import { existsSync } from 'fs';
import { join } from 'path';
import { NodeIO } from '@gltf-transform/core';
import { EXTTextureWebP } from '@gltf-transform/extensions';
import { textureCompress } from '@gltf-transform/functions';
import sharp from 'sharp';

const io = new NodeIO().registerExtensions([EXTTextureWebP]);

const DEFAULT_GLB = [
  join('assets', '3Dmodels', 'MAYR_HAYASTAN.glb'),
  join('assets', '3Dmodels', 'SASUNCI_DAVIT.glb'),
  join('assets', '3Dmodels', 'HOVHANNES_TUMANYAN.glb'),
  join('assets', '3Dmodels', 'KOMITAS.glb'),
  join('assets', '3Dmodels', 'SAYAT_NOVA.glb'),
];

async function convertOne(path: string) {
  if (!existsSync(path)) {
    console.warn(`skip (missing): ${path}`);
    return;
  }
  const doc = await io.read(path);
  await doc.transform(
    textureCompress({
      encoder: sharp,
      targetFormat: 'jpeg',
      quality: 92,
      slots: /baseColor|emissive/i,
    })
  );
  await io.write(path, doc);
  console.log(`ok: ${path}`);
}

async function main() {
  const paths = process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT_GLB;
  for (const p of paths) {
    await convertOne(p);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

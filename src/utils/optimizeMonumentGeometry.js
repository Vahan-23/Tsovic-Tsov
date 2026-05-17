/**
 * Light geometry prep for display — keeps UVs/textures for realistic materials.
 * @param {import('three').BufferGeometry} geometry
 */
export function prepareMonumentGeometry(geometry) {
  if (!geometry?.attributes?.position) return geometry;

  if (!geometry.attributes.normal) geometry.computeVertexNormals();

  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();

  return geometry;
}

/**
 * @param {import('three').BufferGeometry} geometry
 */
export function safePrepareMonumentGeometry(geometry) {
  if (!geometry?.attributes?.position) return geometry;
  try {
    const prepared = prepareMonumentGeometry(geometry);
    const count = prepared?.attributes?.position?.count ?? 0;
    if (count < 3) return geometry;
    return prepared;
  } catch (_) {
    return geometry;
  }
}

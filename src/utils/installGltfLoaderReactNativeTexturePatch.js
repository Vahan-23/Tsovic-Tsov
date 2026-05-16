import * as THREE from 'three';
import { decode as decodePng } from 'fast-png';
import * as jpeg from 'jpeg-js';

const patchedLoaders = new WeakMap();

function expandPngToRgba(width, height, src, channels) {
  const n = width * height;
  const out = new Uint8Array(n * 4);
  if (channels === 4) {
    out.set(src.subarray(0, n * 4));
    return out;
  }
  if (channels === 3) {
    let si = 0;
    let oi = 0;
    for (let i = 0; i < n; i++) {
      out[oi++] = src[si++];
      out[oi++] = src[si++];
      out[oi++] = src[si++];
      out[oi++] = 255;
    }
    return out;
  }
  if (channels === 2) {
    let si = 0;
    let oi = 0;
    for (let i = 0; i < n; i++) {
      const g = src[si++];
      const a = src[si++];
      out[oi++] = g;
      out[oi++] = g;
      out[oi++] = g;
      out[oi++] = a;
    }
    return out;
  }
  if (channels === 1) {
    let si = 0;
    let oi = 0;
    for (let i = 0; i < n; i++) {
      const g = src[si++];
      out[oi++] = g;
      out[oi++] = g;
      out[oi++] = g;
      out[oi++] = 255;
    }
    return out;
  }
  throw new Error(`GLTF RN texture: unsupported PNG channel count ${channels}`);
}

/**
 * DOM-free path for embedded glTF images (React Native has no `document` / HTMLImageElement).
 * @param {ArrayBuffer} arrayBuffer
 * @param {string} mimeType
 * @returns {THREE.DataTexture}
 */
function decodeBufferToDataTexture(arrayBuffer, mimeType) {
  const u8 = new Uint8Array(arrayBuffer);
  const m = (mimeType || '').toLowerCase();

  let width;
  let height;
  /** @type {Uint8Array} */
  let rgba;

  if (m.includes('jpeg') || m.includes('jpg')) {
    const raw = jpeg.decode(u8, { useTArray: true, formatAsRGBA: true });
    width = raw.width;
    height = raw.height;
    rgba = raw.data;
  } else if (m.includes('png')) {
    const img = decodePng(u8);
    width = img.width;
    height = img.height;
    if (img.depth !== 8) {
      throw new Error(`GLTF RN texture: PNG bit depth ${img.depth} (only 8-bit supported)`);
    }
    rgba = expandPngToRgba(width, height, img.data, img.channels);
  } else if (m.includes('webp')) {
    throw new Error(
      'GLTF RN texture: image/webp is not supported in-app; re-export textures as JPEG or PNG'
    );
  } else {
    throw new Error(`GLTF RN texture: unsupported image mime type "${mimeType}"`);
  }

  const tex = new THREE.DataTexture(
    rgba,
    width,
    height,
    THREE.RGBAFormat,
    THREE.UnsignedByteType
  );
  tex.needsUpdate = true;
  tex.flipY = false;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.generateMipmaps = false;
  tex.unpackAlignment = 1;
  return tex;
}

function assignImageExtras(texture, sourceDef) {
  if (sourceDef.extras !== undefined && typeof sourceDef.extras === 'object') {
    Object.assign(texture.userData, sourceDef.extras);
  } else if (sourceDef.extras !== undefined) {
    console.warn(
      'THREE.GLTFLoader: Ignoring primitive type .extras, ',
      sourceDef.extras
    );
  }
}

/**
 * Call once per GLTFLoader instance before load().
 * Fixes: (1) RN Blob(ArrayBuffer), (2) no `document` for TextureLoader/ImageLoader.
 * @param {import('three/examples/jsm/loaders/GLTFLoader.js').GLTFLoader} loader
 */
export function installGltfLoaderReactNativeTexturePatch(loader) {
  if (patchedLoaders.has(loader)) return;
  patchedLoaders.set(loader, true);

  loader.register((parser) => {
    const original = parser.loadImageSource.bind(parser);

    parser.loadImageSource = function patchedLoadImageSource(sourceIndex, imageLoader) {
      const json = parser.json;
      const sourceDef = json.images[sourceIndex];

      if (sourceDef.bufferView === undefined) {
        return original(sourceIndex, imageLoader);
      }

      if (parser.sourceCache[sourceIndex] !== undefined) {
        return parser.sourceCache[sourceIndex].then((texture) => texture.clone());
      }

      const mimeType = sourceDef.mimeType || 'image/png';

      const promise = parser
        .getDependency('bufferView', sourceDef.bufferView)
        .then((bufferView) => {
          const ab =
            bufferView instanceof ArrayBuffer
              ? bufferView
              : bufferView.buffer.slice(
                  bufferView.byteOffset,
                  bufferView.byteOffset + bufferView.byteLength
                );
          return decodeBufferToDataTexture(ab, mimeType);
        })
        .then((texture) => {
          assignImageExtras(texture, sourceDef);
          texture.userData.mimeType = mimeType;
          return texture;
        })
        .catch((error) => {
          console.error(
            "THREE.GLTFLoader: Couldn't load texture (RN DataTexture path)",
            sourceIndex,
            error
          );
          throw error;
        });

      parser.sourceCache[sourceIndex] = promise;
      return promise;
    };

    return { name: 'EXT_TSOVIC_RN_TEXTURE_DATATEXTURE' };
  });
}

import * as THREE from 'three';
import { decode as decodePng } from 'fast-png';
import * as jpeg from 'jpeg-js';

const patchedLoaders = new WeakMap();

/** @type {((buffer: ArrayBuffer) => Promise<ImageData>) | null} */
let webpDecodeFn = null;

async function getWebpDecode() {
  if (!webpDecodeFn) {
    const mod = await import('@jsquash/webp');
    webpDecodeFn = mod.decode;
  }
  return webpDecodeFn;
}

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

function createDataTextureFromRgba(rgba, width, height, mimeType) {
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
  tex.userData.mimeType = mimeType;
  return tex;
}

/** Neutral stone tone when a texture fails to decode. */
function createPlaceholderTexture(mimeType) {
  return createDataTextureFromRgba(
    new Uint8Array([168, 160, 152, 255]),
    1,
    1,
    mimeType || 'image/placeholder'
  );
}

async function decodeWebpToRgba(arrayBuffer) {
  const decode = await getWebpDecode();
  const imageData = await decode(arrayBuffer);
  const { width, height, data } = imageData;
  const rgba =
    data instanceof Uint8Array
      ? data
      : new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  return { width, height, rgba };
}

/**
 * DOM-free path for embedded glTF images (React Native has no `document` / HTMLImageElement).
 * @param {ArrayBuffer} arrayBuffer
 * @param {string} mimeType
 * @returns {Promise<THREE.DataTexture>}
 */
async function decodeBufferToDataTexture(arrayBuffer, mimeType) {
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
    ({ width, height, rgba } = await decodeWebpToRgba(arrayBuffer));
  } else {
    throw new Error(`GLTF RN texture: unsupported image mime type "${mimeType}"`);
  }

  return createDataTextureFromRgba(rgba, width, height, mimeType);
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
          return texture;
        })
        .catch((error) => {
          console.warn(
            "THREE.GLTFLoader: Couldn't load texture (RN DataTexture path)",
            sourceIndex,
            mimeType,
            error
          );
          const placeholder = createPlaceholderTexture(mimeType);
          assignImageExtras(placeholder, sourceDef);
          return placeholder;
        });

      parser.sourceCache[sourceIndex] = promise;
      return promise;
    };

    return { name: 'EXT_TSOVIC_RN_TEXTURE_DATATEXTURE' };
  });
}

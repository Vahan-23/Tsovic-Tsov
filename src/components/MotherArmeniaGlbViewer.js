import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  PanResponder,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { GLView } from 'expo-gl';
import { Asset } from 'expo-asset';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { installGltfLoaderReactNativeTexturePatch } from '../utils/installGltfLoaderReactNativeTexturePatch';
import { useLanguage } from '../context/LanguageContext';

const MODEL_ASSET = require('../../assets/3Dmodels/MAYR_HAYASTAN.glb');

function parseHexColor(hex) {
  const h = String(hex || '#0F1219').replace('#', '');
  if (h.length === 3) {
    return parseInt(
      h
        .split('')
        .map((c) => c + c)
        .join(''),
      16
    );
  }
  return parseInt(h.slice(0, 6), 16);
}

const HOLO_GOLD = 0xe8c878;
const HOLO_GOLD_DEEP = 0xc9a050;
const HOLO_GOLD_UI = '#e8c878';

const TEXTURE_MAP_KEYS = [
  'map',
  'normalMap',
  'roughnessMap',
  'metalnessMap',
  'emissiveMap',
  'aoMap',
  'alphaMap',
  'bumpMap',
  'displacementMap',
  'lightMap',
];

/** Skip decoding huge embedded images — hologram uses a single material anyway. */
function installHologramTextureStub(loader) {
  loader.register((parser) => {
    const previous = parser.loadImageSource.bind(parser);
    parser.loadImageSource = function hologramStubLoadImageSource(sourceIndex, imageLoader) {
      const sourceDef = parser.json.images[sourceIndex];
      if (sourceDef.bufferView === undefined) {
        return previous(sourceIndex, imageLoader);
      }
      if (parser.sourceCache[sourceIndex] !== undefined) {
        return parser.sourceCache[sourceIndex].then((texture) => texture.clone());
      }
      const tex = new THREE.DataTexture(
        new Uint8Array([232, 200, 120, 255]),
        1,
        1,
        THREE.RGBAFormat,
        THREE.UnsignedByteType
      );
      tex.needsUpdate = true;
      tex.flipY = false;
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.generateMipmaps = false;
      const promise = Promise.resolve(tex);
      parser.sourceCache[sourceIndex] = promise;
      return promise;
    };
    return { name: 'HOLO_TEX_STUB' };
  });
}

function disposeMaterialMaps(material) {
  if (!material) return;
  const mats = Array.isArray(material) ? material : [material];
  for (const m of mats) {
    if (!m) continue;
    for (const key of TEXTURE_MAP_KEYS) {
      if (m[key]) {
        m[key].dispose?.();
        m[key] = null;
      }
    }
    m.dispose?.();
  }
}

function createHologramMaterial() {
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(HOLO_GOLD),
    emissive: new THREE.Color(HOLO_GOLD_DEEP),
    emissiveIntensity: 0.92,
    metalness: 0.78,
    roughness: 0.22,
    transparent: true,
    opacity: 0.42,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
}

/** One merged mesh + one material — avoids Hermes "property storage exceeds 196607". */
function applyHologramStyle(root) {
  root.updateMatrixWorld(true);
  const holoMat = createHologramMaterial();
  const meshes = [];
  root.traverse((child) => {
    if (child instanceof THREE.Mesh && child.geometry) meshes.push(child);
  });
  if (!meshes.length) return [holoMat];

  const staticMeshes = meshes.filter((m) => !m.isSkinnedMesh);
  const skinnedMeshes = meshes.filter((m) => m.isSkinnedMesh);
  const batchGeoms = [];

  for (const mesh of staticMeshes) {
    mesh.updateWorldMatrix(true, false);
    const g = mesh.geometry.clone();
    if (!g.attributes.normal) g.computeVertexNormals();
    g.applyMatrix4(mesh.matrixWorld);
    batchGeoms.push(g);
  }

  let mergedGeom = null;
  if (batchGeoms.length > 0) {
    try {
      mergedGeom = mergeGeometries(batchGeoms, false);
      if (mergedGeom && !mergedGeom.attributes.normal) mergedGeom.computeVertexNormals();
    } catch (_) {
      mergedGeom = null;
    }
    batchGeoms.forEach((g) => g.dispose());
  }

  if (mergedGeom) {
    for (const mesh of staticMeshes) {
      disposeMaterialMaps(mesh.material);
      mesh.parent?.remove(mesh);
      mesh.geometry?.dispose();
    }
    mergedGeom.center();
    mergedGeom.computeBoundingBox();
    const holoMesh = new THREE.Mesh(mergedGeom, holoMat);
    holoMesh.renderOrder = 1;
    root.add(holoMesh);
  } else {
    for (const mesh of staticMeshes) {
      disposeMaterialMaps(mesh.material);
      mesh.material = holoMat;
      mesh.renderOrder = 1;
    }
  }

  for (const mesh of skinnedMeshes) {
    disposeMaterialMaps(mesh.material);
    mesh.material = holoMat;
    mesh.renderOrder = 1;
  }

  return [holoMat];
}

function setupHologramLights(scene) {
  scene.add(new THREE.AmbientLight(0x2a1e10, 0.62));
  const key = new THREE.DirectionalLight(0xffe4a8, 1.2);
  key.position.set(4, 8, 6);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xd8a85a, 0.85);
  rim.position.set(-5, 3, -4);
  scene.add(rim);
  const fill = new THREE.PointLight(0xf5d78a, 0.5, 24);
  fill.position.set(0, 3, 2);
  scene.add(fill);
}

/** Center model at origin, scale, frame camera on the visual center. */
function fitModelToView(root, camera, embedLarge) {
  root.position.set(0, 0, 0);
  root.rotation.set(0, 0, 0);
  root.scale.set(1, 1, 1);
  root.updateMatrixWorld(true);

  const box = new THREE.Box3().setFromObject(root);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  root.position.set(-center.x, -center.y, -center.z);
  root.updateMatrixWorld(true);

  const maxDim = Math.max(size.x, size.y, size.z, 0.001);
  const scale = (embedLarge ? 3.45 : 2.8) / maxDim;
  root.scale.setScalar(scale);
  root.updateMatrixWorld(true);

  let worldBox = new THREE.Box3().setFromObject(root);
  let sphere = new THREE.Sphere();
  worldBox.getBoundingSphere(sphere);
  if (Math.abs(sphere.center.x) > 0.0001) {
    root.position.x -= sphere.center.x;
    root.updateMatrixWorld(true);
    worldBox = new THREE.Box3().setFromObject(root);
    worldBox.getBoundingSphere(sphere);
  }

  const r = Math.max(sphere.radius, 0.001);
  const vFov = THREE.MathUtils.degToRad(camera.fov);
  const hFov = 2 * Math.atan(Math.tan(vFov / 2) * camera.aspect);
  const distV = r / Math.sin(vFov / 2);
  const distH = r / Math.sin(hFov / 2);
  const fitPad = embedLarge ? 0.72 : 1.06;
  const dist = Math.max(distV, distH) * fitPad;
  const lookY = sphere.center.y;

  camera.position.set(0, lookY + r * 0.06, sphere.center.z + dist);
  camera.near = Math.max(dist / 800, 0.05);
  camera.far = dist * 8 + r * 4;
  camera.updateProjectionMatrix();
  camera.lookAt(0, lookY, 0);
}

function createRenderer(gl, appBgHex) {
  const { drawingBufferWidth: width, drawingBufferHeight: height } = gl;
  const bg = parseHexColor(appBgHex);
  const canvasStub = {
    width,
    height,
    style: {},
    addEventListener: () => {},
    removeEventListener: () => {},
    clientHeight: height,
    clientWidth: width,
  };
  const renderer = new THREE.WebGLRenderer({
    canvas: canvasStub,
    context: gl,
    antialias: true,
    alpha: true,
  });
  renderer.setSize(width, height);
  renderer.setPixelRatio(1);
  if ('outputColorSpace' in renderer) {
    renderer.outputColorSpace = THREE.SRGBColorSpace;
  }
  if ('toneMapping' in renderer) {
    renderer.toneMapping = THREE.LinearToneMapping;
    renderer.toneMappingExposure = 1;
  }
  renderer.setClearColor(bg, 1);
  return renderer;
}

function disposeScene(scene) {
  scene.traverse((obj) => {
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) {
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      mats.forEach((m) => m?.dispose?.());
    }
  });
}

/**
 * Local GLB preview — horizontal drag only (Y rotation), hologram look.
 */
export default function MotherArmeniaGlbViewer({ colors, viewerHeight: viewerHeightProp }) {
  const { t } = useLanguage();
  const { height: windowHeight } = useWindowDimensions();
  const viewHeight =
    typeof viewerHeightProp === 'number' && viewerHeightProp > 0
      ? Math.round(viewerHeightProp)
      : Math.min(440, Math.round(windowHeight * 0.38));
  const rotationY = useRef(0);
  const largeEmbedRef = useRef(false);
  largeEmbedRef.current =
    typeof viewerHeightProp === 'number' && viewerHeightProp > 0;
  const rootRef = useRef(null);
  const holoMatsRef = useRef([]);
  const disposedRef = useRef(false);
  const rafRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const progressTimerRef = useRef(null);
  const displayPctRef = useRef(1);
  const targetPctRef = useRef(2);
  const loadFinishedRef = useRef(false);
  const [loadError, setLoadError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadPercent, setLoadPercent] = useState(1);

  const clearProgressTimer = useCallback(() => {
    if (progressTimerRef.current != null) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
  }, []);

  const bumpTarget = useCallback((pct) => {
    targetPctRef.current = Math.min(99, Math.max(targetPctRef.current, pct));
  }, []);

  const startSmoothProgress = useCallback(() => {
    clearProgressTimer();
    progressTimerRef.current = setInterval(() => {
      if (disposedRef.current) {
        clearProgressTimer();
        return;
      }
      if (!loadFinishedRef.current && targetPctRef.current < 97) {
        targetPctRef.current += 0.14;
      }
      if (loadFinishedRef.current) {
        targetPctRef.current = 100;
      }
      const cur = displayPctRef.current;
      const tgt = targetPctRef.current;
      if (cur < tgt) {
        const step = Math.max(0.35, (tgt - cur) * 0.07);
        displayPctRef.current = Math.min(tgt, cur + step);
      } else if (loadFinishedRef.current && cur < 100) {
        displayPctRef.current = Math.min(100, cur + 0.65);
      }
      const shown = Math.min(100, Math.max(1, Math.round(displayPctRef.current)));
      setLoadPercent(shown);
    }, 45);
  }, [clearProgressTimer]);

  const waitUntilShown100 = useCallback(() => {
    return new Promise((resolve) => {
      const tick = () => {
        if (disposedRef.current) {
          resolve();
          return;
        }
        if (displayPctRef.current >= 99.5) {
          displayPctRef.current = 100;
          setLoadPercent(100);
          setTimeout(resolve, 150);
          return;
        }
        setTimeout(tick, 50);
      };
      tick();
    });
  }, []);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, g) =>
          Math.abs(g.dx) > Math.abs(g.dy) && Math.abs(g.dx) > 2,
        onPanResponderMove: (_, g) => {
          rotationY.current += g.dx * 0.012;
        },
      }),
    []
  );

  const shutdown = useCallback(() => {
    disposedRef.current = true;
    clearProgressTimer();
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (sceneRef.current) {
      disposeScene(sceneRef.current);
      sceneRef.current = null;
    }
    if (rendererRef.current) {
      rendererRef.current.dispose();
      rendererRef.current = null;
    }
    rootRef.current = null;
    holoMatsRef.current = [];
  }, [clearProgressTimer]);

  useEffect(() => () => shutdown(), [shutdown]);

  const onContextCreate = useCallback(
    (gl) => {
      disposedRef.current = false;
      setLoadError(null);
      setLoading(true);
      displayPctRef.current = 1;
      targetPctRef.current = 2;
      loadFinishedRef.current = false;
      setLoadPercent(1);
      startSmoothProgress();

      const appBg = colors.bg;
      const width = gl.drawingBufferWidth;
      const height = gl.drawingBufferHeight;
      const renderer = createRenderer(gl, appBg);
      rendererRef.current = renderer;
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(parseHexColor(appBg));
      sceneRef.current = scene;
      const camera = new THREE.PerspectiveCamera(48, width / height, 0.05, 500);
      camera.position.set(0, 0, 5);
      camera.lookAt(0, 0, 0);

      setupHologramLights(scene);

      const renderFrame = () => {
        if (disposedRef.current) return;
        rafRef.current = requestAnimationFrame(renderFrame);
        const t = Date.now() * 0.001;
        const pulse = 0.74 + Math.sin(t * 2.4) * 0.2;
        const opacity = 0.3 + Math.sin(t * 3.1) * 0.07;
        for (const m of holoMatsRef.current) {
          m.emissiveIntensity = pulse;
          m.opacity = opacity;
        }
        if (rootRef.current) {
          rootRef.current.rotation.y = rotationY.current;
        }
        renderer.render(scene, camera);
        gl.endFrameEXP();
      };
      rafRef.current = requestAnimationFrame(renderFrame);

      (async () => {
        try {
          bumpTarget(6);
          const asset = Asset.fromModule(MODEL_ASSET);
          await asset.downloadAsync();
          bumpTarget(14);

          const uri = asset.localUri || asset.uri;
          if (!uri) throw new Error('no model uri');

          bumpTarget(18);

          await new Promise((resolve, reject) => {
            const loader = new GLTFLoader();
            installGltfLoaderReactNativeTexturePatch(loader);
            installHologramTextureStub(loader);
            loader.load(
              uri,
              async (gltf) => {
                if (disposedRef.current) {
                  gltf.scene.traverse((child) => {
                    if (child.geometry) child.geometry.dispose();
                    if (child.material) {
                      const mats = Array.isArray(child.material)
                        ? child.material
                        : [child.material];
                      mats.forEach((m) => m?.dispose?.());
                    }
                  });
                  resolve();
                  return;
                }
                bumpTarget(88);
                const root = gltf.scene;
                holoMatsRef.current = applyHologramStyle(root);
                bumpTarget(94);

                scene.add(root);
                rootRef.current = root;
                fitModelToView(root, camera, largeEmbedRef.current);
                loadFinishedRef.current = true;
                bumpTarget(100);
                await waitUntilShown100();
                resolve();
              },
              (xhr) => {
                if (xhr.total > 0) {
                  const filePct = (xhr.loaded / xhr.total) * 100;
                  bumpTarget(18 + filePct * 0.7);
                }
              },
              (err) => reject(err)
            );
          });
        } catch (e) {
          if (!disposedRef.current) setLoadError(String(e?.message || e));
        } finally {
          clearProgressTimer();
          if (!disposedRef.current) setLoading(false);
        }
      })();
    },
    [bumpTarget, clearProgressTimer, colors.bg, startSmoothProgress, waitUntilShown100]
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          width: '100%',
          height: viewHeight,
          overflow: 'hidden',
          backgroundColor: colors.bg,
        },
        inner: {
          flex: 1,
          width: '100%',
          minHeight: 1,
        },
        gl: {
          ...StyleSheet.absoluteFillObject,
          width: '100%',
          height: '100%',
        },
        touchLayer: {
          ...StyleSheet.absoluteFillObject,
          backgroundColor: 'transparent',
        },
        overlay: {
          ...StyleSheet.absoluteFillObject,
          justifyContent: 'center',
          alignItems: 'center',
          pointerEvents: 'none',
          backgroundColor: colors.overlay,
        },
        loadBlock: {
          alignItems: 'center',
          gap: 10,
          paddingHorizontal: 32,
        },
        loadPercent: {
          fontSize: 52,
          fontWeight: '800',
          color: HOLO_GOLD_UI,
          letterSpacing: -1,
          fontVariant: ['tabular-nums'],
          textShadowColor: 'rgba(216, 168, 90, 0.55)',
          textShadowOffset: { width: 0, height: 0 },
          textShadowRadius: 16,
        },
        loadLabel: {
          fontSize: 15,
          fontWeight: '600',
          color: 'rgba(245, 220, 170, 0.9)',
          letterSpacing: 0.4,
        },
        progressTrack: {
          width: 200,
          height: 4,
          borderRadius: 2,
          backgroundColor: 'rgba(216, 168, 90, 0.22)',
          overflow: 'hidden',
          marginTop: 6,
        },
        progressFill: {
          height: '100%',
          borderRadius: 2,
          backgroundColor: HOLO_GOLD_UI,
        },
        hintWrap: {
          position: 'absolute',
          bottom: 14,
          left: 16,
          right: 16,
          alignItems: 'center',
          gap: 4,
          pointerEvents: 'none',
        },
        hintTitle: {
          fontSize: 17,
          fontWeight: '800',
          letterSpacing: 0.35,
          lineHeight: 24,
          color: 'rgba(255, 236, 200, 0.98)',
          textAlign: 'center',
          textShadowColor: 'rgba(0, 0, 0, 0.55)',
          textShadowOffset: { width: 0, height: 1 },
          textShadowRadius: 6,
        },
        hintSub: {
          fontSize: 14,
          fontWeight: '600',
          letterSpacing: 0.25,
          lineHeight: 20,
          color: 'rgba(245, 220, 170, 0.88)',
          textAlign: 'center',
          textShadowColor: 'rgba(0, 0, 0, 0.45)',
          textShadowOffset: { width: 0, height: 1 },
          textShadowRadius: 4,
        },
        err: {
          padding: 16,
          fontSize: 14,
          color: colors.textSecondary,
          textAlign: 'center',
        },
      }),
    [colors, viewHeight]
  );

  return (
    <View style={styles.wrap}>
      <View style={styles.inner}>
        <GLView style={styles.gl} onContextCreate={onContextCreate} />
        <View style={styles.touchLayer} {...panResponder.panHandlers} />
      </View>
      {loading ? (
        <View style={styles.overlay}>
          <View style={styles.loadBlock}>
            <Text style={styles.loadPercent}>{loadPercent}%</Text>
            <Text style={styles.loadLabel}>{t('statueMotherArmeniaModelLoading')}</Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${loadPercent}%` }]} />
            </View>
          </View>
        </View>
      ) : null}
      {loadError ? (
        <View style={styles.overlay}>
          <Text style={styles.err}>{loadError}</Text>
        </View>
      ) : null}
      {!loadError && !loading ? (
        <View style={styles.hintWrap}>
          <Text style={styles.hintTitle}>{t('statueMotherArmeniaModelHintTitle')}</Text>
          <Text style={styles.hintSub}>{t('statueMotherArmeniaModelHintSub')}</Text>
        </View>
      ) : null}
    </View>
  );
}

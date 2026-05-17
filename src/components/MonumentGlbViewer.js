import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
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
import { installGltfLoaderReactNativeTexturePatch } from '../utils/installGltfLoaderReactNativeTexturePatch';
import { useLanguage } from '../context/LanguageContext';
import { getMonumentGlbAsset, getMonumentGlbViewTuning } from '../data/monumentGlbModels';


/** Bump when model cache format / material pipeline changes. */
const MODEL_CACHE_VERSION = 12;

/** @type {Map<string, { modelRoot: import('three').Group | null, assetUri: string | null, preloadPromise: Promise<string> | null, modelVersion: number }>} */
const modelCaches = new Map();

function getModelCache(cardId) {
  let cache = modelCaches.get(cardId);
  if (!cache) {
    cache = {
      modelRoot: null,
      assetUri: null,
      preloadPromise: null,
      modelVersion: 0,
    };
    modelCaches.set(cardId, cache);
  }
  if (cache.modelVersion !== MODEL_CACHE_VERSION) {
    disposeModelRoot(cache.modelRoot);
    cache.modelRoot = null;
    cache.modelVersion = MODEL_CACHE_VERSION;
  }
  return cache;
}

function hasCachedModel(cardId) {
  return getModelCache(cardId).modelRoot != null;
}

function preloadModelAsset(cardId) {
  const cache = getModelCache(cardId);
  const modelAsset = getMonumentGlbAsset(cardId);
  if (!modelAsset) return Promise.reject(new Error('no model asset'));
  if (cache.assetUri) {
    return Promise.resolve(cache.assetUri);
  }
  if (!cache.preloadPromise) {
    cache.preloadPromise = Asset.fromModule(modelAsset)
      .downloadAsync()
      .then((asset) => {
        const uri = asset.localUri || asset.uri;
        if (!uri) throw new Error('no model uri');
        cache.assetUri = uri;
        return uri;
      })
      .catch((err) => {
        cache.preloadPromise = null;
        throw err;
      });
  }
  return cache.preloadPromise;
}

function disposeModelRoot(root) {
  if (!root) return;
  root.traverse((obj) => {
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) disposeMaterialMaps(obj.material);
  });
}

function saveModelToCache(cardId, root) {
  const cache = getModelCache(cardId);
  disposeModelRoot(cache.modelRoot);
  cache.modelRoot = root.clone(true);
  cache.modelVersion = MODEL_CACHE_VERSION;
}

function buildModelFromCache(cardId) {
  const cache = getModelCache(cardId);
  if (!cache.modelRoot) throw new Error('no cached model');
  return { root: cache.modelRoot.clone(true) };
}

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

const LOADER_ACCENT = '#9aa3b2';
const FAKE_PROGRESS_CAP = 83;
/** Fake 0→83% duration; model loads in parallel, then real progress from 83. */
const FAKE_PROGRESS_MS = 13000;
const PROGRESS_TRACK_W = 200;
const REAL_PROGRESS_TICK_MS = 42;
const REAL_PCT_STEP = 1;

function easeOutCubic(t) {
  return 1 - (1 - t) ** 3;
}

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

/** glTF color textures — sRGB; data maps (normal, ORM) — linear. */
const TEXTURE_COLOR_SPACE = {
  map: THREE.SRGBColorSpace,
  emissiveMap: THREE.SRGBColorSpace,
  normalMap: THREE.NoColorSpace,
  roughnessMap: THREE.NoColorSpace,
  metalnessMap: THREE.NoColorSpace,
  aoMap: THREE.NoColorSpace,
  bumpMap: THREE.NoColorSpace,
  displacementMap: THREE.NoColorSpace,
  alphaMap: THREE.NoColorSpace,
  lightMap: THREE.NoColorSpace,
};

function tuneTexture(tex, mapKey) {
  if (!tex) return;
  const space = TEXTURE_COLOR_SPACE[mapKey] ?? THREE.NoColorSpace;
  tex.colorSpace = space;
  tex.flipY = false;
  tex.needsUpdate = true;
}

function tuneMaterialMaps(material) {
  if (!material) return;
  for (const key of TEXTURE_MAP_KEYS) {
    if (material[key]) tuneTexture(material[key], key);
  }
}

function ensurePbrMaterial(material) {
  if (!material) {
    return new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.5,
      roughness: 0.5,
    });
  }
  if (material.isMeshPhysicalMaterial || material.isMeshStandardMaterial) {
    return material;
  }
  const std = new THREE.MeshStandardMaterial({
    color: material.color?.clone?.() ?? new THREE.Color(0xffffff),
    map: material.map ?? null,
    normalMap: material.normalMap ?? null,
    roughnessMap: material.roughnessMap ?? null,
    metalnessMap: material.metalnessMap ?? null,
    aoMap: material.aoMap ?? null,
    emissive: material.emissive?.clone?.() ?? new THREE.Color(0x000000),
    emissiveMap: material.emissiveMap ?? null,
    transparent: material.transparent ?? false,
    opacity: material.opacity ?? 1,
    metalness: material.metalness ?? 0.5,
    roughness: material.roughness ?? 0.5,
  });
  if (material.normalScale) std.normalScale.copy(material.normalScale);
  material.dispose?.();
  return std;
}

function tuneMaterialForRealistic(material) {
  const mats = Array.isArray(material) ? material : [material];
  for (let i = 0; i < mats.length; i++) {
    let m = mats[i];
    if (!m) continue;
    m = ensurePbrMaterial(m);
    mats[i] = m;

    if (m.map && m.color) {
      m.color.setRGB(1, 1, 1);
    }
    if (m.emissiveIntensity != null && m.emissiveIntensity > 0.2) {
      m.emissiveIntensity = 0.15;
    }
    m.transparent = Boolean(m.transparent && m.opacity < 1);
    if (!m.transparent) {
      m.opacity = 1;
      m.depthWrite = true;
    }
    m.side = THREE.DoubleSide;
    tuneMaterialMaps(m);
    m.needsUpdate = true;
  }
  return Array.isArray(material) ? mats : mats[0];
}

/** Keep GLB materials/textures; neutral outdoor-statue lighting. */
function prepareRealisticModel(root) {
  root.updateMatrixWorld(true);
  root.traverse((obj) => {
    if (obj.isLight || obj.isCamera) {
      obj.parent?.remove(obj);
      return;
    }
    if (!(obj instanceof THREE.Mesh) || !obj.geometry) return;
    if (!obj.geometry.attributes.normal) obj.geometry.computeVertexNormals();
    obj.material = tuneMaterialForRealistic(obj.material);
    obj.castShadow = false;
    obj.receiveShadow = false;
  });
}

function setupSceneLights(scene) {
  scene.add(new THREE.AmbientLight(0xffffff, 0.42));
  const hemi = new THREE.HemisphereLight(0xe8eef8, 0x4a4438, 0.48);
  scene.add(hemi);
  const key = new THREE.DirectionalLight(0xfff8f0, 1.15);
  key.position.set(5, 11, 8);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xc8d4e8, 0.42);
  fill.position.set(-7, 3, 5);
  scene.add(fill);
  const rim = new THREE.DirectionalLight(0xffffff, 0.28);
  rim.position.set(0, 4, -9);
  scene.add(rim);
}

function recenterRootOnSphere(root) {
  const sphere = new THREE.Sphere();
  new THREE.Box3().setFromObject(root).getBoundingSphere(sphere);
  root.position.x -= sphere.center.x;
  root.position.y -= sphere.center.y;
  root.position.z -= sphere.center.z;
  root.updateMatrixWorld(true);
  return sphere;
}

/** Turn broad side toward camera (+Z); tall axis (Y) stays vertical. */
function alignStatueFrontTowardCamera(root) {
  const size = new THREE.Box3().setFromObject(root).getSize(new THREE.Vector3());
  if (size.z > size.x * 1.02) {
    root.rotation.y += Math.PI / 2;
  } else if (size.x > size.z * 1.02) {
    root.rotation.y -= Math.PI / 2;
  }
  root.updateMatrixWorld(true);
  recenterRootOnSphere(root);
}

/**
 * Center model, face camera, frame shot. Returns initial Y rotation for drag baseline.
 * @returns {number}
 */
function fitModelToView(root, camera, embedLarge, monumentCardId) {
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

  let sphere = recenterRootOnSphere(root);
  alignStatueFrontTowardCamera(root);

  // Other GLBs export facing -Z; auto ±90° leaves them back-on. Mother uses tuning PI only.
  if (monumentCardId !== 'mother_armenia') {
    root.rotation.y += Math.PI;
    root.updateMatrixWorld(true);
    sphere = recenterRootOnSphere(root);
  }

  const tuning = getMonumentGlbViewTuning(monumentCardId);
  if (tuning?.initialRotationY) {
    root.rotation.y += tuning.initialRotationY;
    root.updateMatrixWorld(true);
    sphere = recenterRootOnSphere(root);
  }

  const r = Math.max(sphere.radius, 0.001);
  if (tuning) {
    root.position.x += (tuning.x ?? 0) * r;
    root.position.y += (tuning.y ?? 0) * r;
    root.position.z += (tuning.z ?? 0) * r;
    root.updateMatrixWorld(true);
    sphere = recenterRootOnSphere(root);
  }

  const vFov = THREE.MathUtils.degToRad(camera.fov);
  const hFov = 2 * Math.atan(Math.tan(vFov / 2) * camera.aspect);
  const distV = r / Math.sin(vFov / 2);
  const distH = r / Math.sin(hFov / 2);
  const fitPad = embedLarge ? 0.72 : 1.06;
  const dist = Math.max(distV, distH) * fitPad;

  camera.position.set(0, r * 0.06, dist);
  camera.near = Math.max(dist / 800, 0.05);
  camera.far = dist * 8 + r * 4;
  camera.updateProjectionMatrix();
  camera.lookAt(0, 0, 0);

  return root.rotation.y;
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
    antialias: false,
    alpha: true,
    powerPreference: 'low-power',
  });
  renderer.setSize(width, height);
  renderer.setPixelRatio(1);
  if ('outputColorSpace' in renderer) {
    renderer.outputColorSpace = THREE.SRGBColorSpace;
  }
  if ('toneMapping' in renderer) {
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
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
 * Local GLB preview — horizontal drag only (Y rotation), realistic materials.
 */
export default function MonumentGlbViewer({ monumentCardId, colors, viewerHeight: viewerHeightProp }) {
  const { t } = useLanguage();
  const modelAsset = getMonumentGlbAsset(monumentCardId);
  const { height: windowHeight } = useWindowDimensions();
  const viewHeight =
    typeof viewerHeightProp === 'number' && viewerHeightProp > 0
      ? Math.round(viewerHeightProp)
      : Math.min(440, Math.round(windowHeight * 0.38));
  const rotationY = useRef(0);
  const monumentCardIdRef = useRef(monumentCardId);
  monumentCardIdRef.current = monumentCardId;
  const largeEmbedRef = useRef(false);
  largeEmbedRef.current =
    typeof viewerHeightProp === 'number' && viewerHeightProp > 0;
  const rootRef = useRef(null);
  const modelReadyRef = useRef(false);
  const disposedRef = useRef(false);
  const rafRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const fakeDoneRef = useRef(false);
  const realTargetRef = useRef(FAKE_PROGRESS_CAP);
  const displayPctRef = useRef(0);
  const loadFinishedRef = useRef(false);
  const progressIntervalRef = useRef(null);
  const fakeClockRef = useRef(null);
  const cameraRef = useRef(null);
  const glContextRef = useRef(null);
  const modelUriRef = useRef(null);
  const glReadyRef = useRef(false);
  const loadStartedRef = useRef(false);
  const loadGlow = useRef(new Animated.Value(0)).current;
  const [loadError, setLoadError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadPercent, setLoadPercent] = useState(0);

  const bumpRealProgress = useCallback((pctFrom60) => {
    realTargetRef.current = Math.min(100, Math.max(realTargetRef.current, pctFrom60));
  }, []);

  const clearProgressInterval = useCallback(() => {
    if (progressIntervalRef.current != null) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, []);

  const stopFakeAnimation = useCallback(() => {
    if (fakeClockRef.current != null) {
      clearInterval(fakeClockRef.current);
      fakeClockRef.current = null;
    }
  }, []);

  const tickRealProgress = useCallback(() => {
    if (disposedRef.current || !fakeDoneRef.current) return;

    let idealTarget = loadFinishedRef.current
      ? 100
      : Math.max(FAKE_PROGRESS_CAP, realTargetRef.current);

    const cur = displayPctRef.current;
    if (cur < idealTarget) {
      displayPctRef.current = Math.min(idealTarget, cur + REAL_PCT_STEP);
    }
    const shown = Math.min(100, Math.max(FAKE_PROGRESS_CAP, Math.round(displayPctRef.current)));
    setLoadPercent(shown);
  }, []);

  const startRealProgressTicker = useCallback(() => {
    clearProgressInterval();
    progressIntervalRef.current = setInterval(tickRealProgress, REAL_PROGRESS_TICK_MS);
  }, [clearProgressInterval, tickRealProgress]);

  const waitUntilShown100 = useCallback(() => {
    return new Promise((resolve) => {
      const tick = () => {
        if (disposedRef.current) {
          resolve();
          return;
        }
        tickRealProgress();
        if (displayPctRef.current >= 99.5) {
          displayPctRef.current = 100;
          setLoadPercent(100);
          setTimeout(resolve, 160);
          return;
        }
        requestAnimationFrame(tick);
      };
      tick();
    });
  }, [tickRealProgress]);

  const tryLoadModel = useCallback(() => {
    const fromCache = hasCachedModel(monumentCardId);
    if (
      loadStartedRef.current ||
      !glReadyRef.current ||
      (!fakeDoneRef.current && !fromCache) ||
      !sceneRef.current ||
      !cameraRef.current ||
      disposedRef.current
    ) {
      return;
    }
    if (!fromCache && !modelUriRef.current) return;

    loadStartedRef.current = true;
    const scene = sceneRef.current;
    const camera = cameraRef.current;

    if (fromCache) {
      try {
        const { root } = buildModelFromCache(monumentCardId);
        scene.add(root);
        rootRef.current = root;
        rotationY.current = fitModelToView(root, camera, largeEmbedRef.current, monumentCardId);
        modelReadyRef.current = true;
        loadFinishedRef.current = true;
        displayPctRef.current = 100;
        setLoadPercent(100);
      } catch (e) {
        if (!disposedRef.current) setLoadError(String(e?.message || e));
      } finally {
        clearProgressInterval();
        if (!disposedRef.current) setLoading(false);
      }
      return;
    }

    const uri = modelUriRef.current;

    (async () => {
      try {
        bumpRealProgress(64);
        await new Promise((resolve, reject) => {
          const loader = new GLTFLoader();
          installGltfLoaderReactNativeTexturePatch(loader);
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
              bumpRealProgress(78);
              gltf.animations = [];
              const root = gltf.scene;
              prepareRealisticModel(root);
              saveModelToCache(monumentCardId, root);
              bumpRealProgress(86);
              scene.add(root);
              rootRef.current = root;
              rotationY.current = fitModelToView(
                root,
                camera,
                largeEmbedRef.current,
                monumentCardId
              );
              modelReadyRef.current = true;
              loadFinishedRef.current = true;
              bumpRealProgress(100);
              await waitUntilShown100();
              resolve();
            },
            (xhr) => {
              if (xhr.total > 0) {
                const ratio = xhr.loaded / xhr.total;
                bumpRealProgress(FAKE_PROGRESS_CAP + ratio * 16);
              }
            },
            (err) => reject(err)
          );
        });
      } catch (e) {
        if (!disposedRef.current) setLoadError(String(e?.message || e));
      } finally {
        if (!disposedRef.current) setLoading(false);
      }
    })();
  }, [bumpRealProgress, clearProgressInterval, monumentCardId, waitUntilShown100]);

  const finishFakePhase = useCallback(() => {
    if (fakeDoneRef.current || disposedRef.current) return;
    fakeDoneRef.current = true;
    displayPctRef.current = FAKE_PROGRESS_CAP;
    setLoadPercent(FAKE_PROGRESS_CAP);
    stopFakeAnimation();
    startRealProgressTicker();
    tryLoadModel();
  }, [startRealProgressTicker, stopFakeAnimation, tryLoadModel]);

  const startFakeProgress = useCallback(() => {
    stopFakeAnimation();
    fakeDoneRef.current = false;
    realTargetRef.current = FAKE_PROGRESS_CAP;
    displayPctRef.current = 0;
    loadFinishedRef.current = false;
    setLoadPercent(0);

    const fakeStart = Date.now();
    fakeClockRef.current = setInterval(() => {
      if (fakeDoneRef.current || disposedRef.current) return;
      const t = Math.min(1, (Date.now() - fakeStart) / FAKE_PROGRESS_MS);
      const shown = Math.min(
        FAKE_PROGRESS_CAP,
        Math.max(0, Math.round(easeOutCubic(t) * FAKE_PROGRESS_CAP))
      );
      displayPctRef.current = shown;
      setLoadPercent(shown);
      if (t >= 1) finishFakePhase();
    }, 40);
  }, [finishFakePhase, stopFakeAnimation]);

  useEffect(() => {
    disposedRef.current = false;
    loadStartedRef.current = false;
    glReadyRef.current = false;
    modelUriRef.current = getModelCache(monumentCardId).assetUri;

    const fromCache = hasCachedModel(monumentCardId);
    if (fromCache) {
      fakeDoneRef.current = true;
      displayPctRef.current = 0;
      setLoadPercent(0);
    } else {
      startFakeProgress();
    }

    let cancelled = false;
    preloadModelAsset(monumentCardId)
      .then((uri) => {
        if (cancelled || disposedRef.current) return;
        modelUriRef.current = uri;
        if (fakeDoneRef.current || fromCache) tryLoadModel();
      })
      .catch((e) => {
        if (!cancelled && !disposedRef.current) {
          setLoadError(String(e?.message || e));
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
      stopFakeAnimation();
      clearProgressInterval();
    };
  }, [monumentCardId, startFakeProgress, stopFakeAnimation, clearProgressInterval, tryLoadModel]);

  useEffect(() => {
    if (!loading) return undefined;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(loadGlow, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(loadGlow, { toValue: 0, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [loading, loadGlow]);

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
    stopFakeAnimation();
    clearProgressInterval();
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
    modelReadyRef.current = false;
    glReadyRef.current = false;
    loadStartedRef.current = false;
    cameraRef.current = null;
    glContextRef.current = null;
  }, [clearProgressInterval, stopFakeAnimation]);

  useEffect(() => () => shutdown(), [shutdown]);

  const onContextCreate = useCallback(
    (gl) => {
      setLoadError(null);
      setLoading(true);
      glContextRef.current = gl;

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
      cameraRef.current = camera;

      setupSceneLights(scene);

      const renderFrame = () => {
        if (disposedRef.current) return;
        rafRef.current = requestAnimationFrame(renderFrame);

        if (modelReadyRef.current && rootRef.current) {
          rootRef.current.rotation.y = rotationY.current;
        }

        renderer.render(scene, camera);
        gl.endFrameEXP();
      };
      rafRef.current = requestAnimationFrame(renderFrame);

      glReadyRef.current = true;
      if (fakeDoneRef.current || hasCachedModel(monumentCardId)) tryLoadModel();
    },
    [colors.bg, monumentCardId, tryLoadModel]
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
          backgroundColor: colors.bg,
        },
        loadBlock: {
          alignItems: 'center',
          gap: 10,
          paddingHorizontal: 32,
        },
        loadPercent: {
          fontSize: 52,
          fontWeight: '800',
          color: colors.text ?? LOADER_ACCENT,
          letterSpacing: -1,
          fontVariant: ['tabular-nums'],
          textShadowColor: 'rgba(0, 0, 0, 0.35)',
          textShadowOffset: { width: 0, height: 0 },
          textShadowRadius: 16,
        },
        loadLabel: {
          fontSize: 15,
          fontWeight: '600',
          color: colors.textSecondary ?? LOADER_ACCENT,
          letterSpacing: 0.4,
        },
        progressTrack: {
          width: PROGRESS_TRACK_W,
          height: 4,
          borderRadius: 2,
          backgroundColor: 'rgba(154, 163, 178, 0.22)',
          overflow: 'hidden',
          marginTop: 6,
          position: 'relative',
        },
        progressFill: {
          height: '100%',
          borderRadius: 2,
          backgroundColor: colors.text ?? LOADER_ACCENT,
        },
        progressGlow: {
          position: 'absolute',
          left: 0,
          top: -2,
          bottom: -2,
          borderRadius: 4,
          backgroundColor: colors.text ?? LOADER_ACCENT,
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
          color: colors.text ?? '#e8eaef',
          textAlign: 'center',
          textShadowColor: 'rgba(0, 0, 0, 0.45)',
          textShadowOffset: { width: 0, height: 1 },
          textShadowRadius: 6,
        },
        hintSub: {
          fontSize: 14,
          fontWeight: '600',
          letterSpacing: 0.25,
          lineHeight: 20,
          color: colors.textSecondary ?? LOADER_ACCENT,
          textAlign: 'center',
          textShadowColor: 'rgba(0, 0, 0, 0.35)',
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

  if (!modelAsset) {
    return (
      <View style={[styles.wrap, { minHeight: viewHeight, justifyContent: 'center' }]}>
        <Text style={styles.err}>3D model unavailable</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.inner}>
        <GLView style={styles.gl} onContextCreate={onContextCreate} />
        <View style={styles.touchLayer} {...panResponder.panHandlers} />
      </View>
      {loading ? (
        <View style={styles.overlay}>
          <View style={styles.loadBlock}>
            <Animated.Text
              style={[
                styles.loadPercent,
                {
                  opacity: loadGlow.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.88, 1],
                  }),
                  transform: [
                    {
                      scale: loadGlow.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.04],
                      }),
                    },
                  ],
                },
              ]}
            >
              {loadPercent}%
            </Animated.Text>
            <Text style={styles.loadLabel}>{t('statueMotherArmeniaModelLoading')}</Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${loadPercent}%` }]} />
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.progressGlow,
                  {
                    width: `${Math.min(loadPercent + 8, 100)}%`,
                    opacity: loadGlow.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.12, 0.38],
                    }),
                  },
                ]}
              />
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

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
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

const MODEL_ASSET = require('../../assets/3Dmodels/mayrHayastan.glb');

function createRenderer(gl) {
  const { drawingBufferWidth: width, drawingBufferHeight: height } = gl;
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
    // ACES + exposure can render black on some Expo GL / mobile drivers — keep linear.
    renderer.toneMapping = THREE.LinearToneMapping;
    renderer.toneMappingExposure = 1;
  }
  renderer.setClearColor(0x000000, 0);
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
 * Local GLB preview — horizontal drag only (Y rotation).
 */
export default function MotherArmeniaGlbViewer({ colors, hintLabel, viewerHeight: viewerHeightProp }) {
  const { height: windowHeight } = useWindowDimensions();
  const viewHeight =
    typeof viewerHeightProp === 'number' && viewerHeightProp > 0
      ? Math.round(viewerHeightProp)
      : Math.min(440, Math.round(windowHeight * 0.38));
  const rotationY = useRef(0);
  /** Fresh value inside GLTF async path (onContextCreate deps are []). */
  const largeEmbedRef = useRef(false);
  largeEmbedRef.current =
    typeof viewerHeightProp === 'number' && viewerHeightProp > 0;
  const rootRef = useRef(null);
  const disposedRef = useRef(false);
  const rafRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const glRef = useRef(null);
  const [loadError, setLoadError] = useState(null);
  const [loading, setLoading] = useState(true);

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
    glRef.current = null;
  }, []);

  useEffect(() => () => shutdown(), [shutdown]);

  const onContextCreate = useCallback(
    (gl) => {
      disposedRef.current = false;
      glRef.current = gl;
      setLoadError(null);
      setLoading(true);

      const width = gl.drawingBufferWidth;
      const height = gl.drawingBufferHeight;
      const renderer = createRenderer(gl);
      rendererRef.current = renderer;
      const scene = new THREE.Scene();
      sceneRef.current = scene;
      const camera = new THREE.PerspectiveCamera(48, width / height, 0.05, 500);
      camera.position.set(0, 0, 5);
      camera.lookAt(0, 0, 0);

      scene.add(new THREE.HemisphereLight(0xfff6ec, 0xc9a36a, 0.52));
      scene.add(new THREE.AmbientLight(0xffeed8, 0.94));
      const key = new THREE.DirectionalLight(0xffe8c8, 1.05);
      key.position.set(5, 9, 6);
      scene.add(key);
      const fill = new THREE.DirectionalLight(0xffd6a0, 0.42);
      fill.position.set(-4, 4, -5);
      scene.add(fill);
      const torch = new THREE.DirectionalLight(0xfff0d4, 0.58);
      torch.position.set(-9, -5, 11);
      scene.add(torch);

      const renderFrame = () => {
        if (disposedRef.current) return;
        rafRef.current = requestAnimationFrame(renderFrame);
        if (rootRef.current) {
          rootRef.current.rotation.y = rotationY.current;
        }
        renderer.render(scene, camera);
        gl.endFrameEXP();
      };
      rafRef.current = requestAnimationFrame(renderFrame);

      (async () => {
        try {
          const asset = Asset.fromModule(MODEL_ASSET);
          await asset.downloadAsync();
          const uri = asset.localUri || asset.uri;
          if (!uri) throw new Error('no model uri');

          await new Promise((resolve, reject) => {
            const loader = new GLTFLoader();
            installGltfLoaderReactNativeTexturePatch(loader);
            loader.load(
              uri,
              (gltf) => {
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
                const root = gltf.scene;
                root.traverse((child) => {
                  if (child instanceof THREE.Mesh) {
                    if (child.material) {
                      const mats = Array.isArray(child.material)
                        ? child.material
                        : [child.material];
                      for (const m of mats) {
                        if (!m) continue;
                        if ('envMapIntensity' in m) m.envMapIntensity = 0.48;
                        if (m.isMeshStandardMaterial || m.isMeshPhysicalMaterial) {
                          const er = m.emissive?.r ?? 0;
                          const eg = m.emissive?.g ?? 0;
                          const eb = m.emissive?.b ?? 0;
                          const ei = m.emissiveIntensity ?? 0;
                          if (er + eg + eb < 0.04 && ei < 0.06) {
                            m.emissive.setHex(0x5c4018);
                            m.emissiveIntensity = 0.11;
                          }
                        }
                      }
                    }
                  }
                });
                const box = new THREE.Box3().setFromObject(root);
                const size = box.getSize(new THREE.Vector3());
                const center = box.getCenter(new THREE.Vector3());
                const maxDim = Math.max(size.x, size.y, size.z, 0.001);
                const embedLarge = largeEmbedRef.current;
                const scale = (embedLarge ? 3.45 : 2.8) / maxDim;
                root.scale.setScalar(scale);
                root.position.set(-center.x * scale, -center.y * scale, -center.z * scale);
                scene.add(root);
                rootRef.current = root;
                root.updateMatrixWorld(true);
                const worldBox = new THREE.Box3().setFromObject(root);
                const sphere = new THREE.Sphere();
                worldBox.getBoundingSphere(sphere);
                const r = Math.max(sphere.radius, 0.001);
                const vFov = THREE.MathUtils.degToRad(camera.fov);
                const hFov = 2 * Math.atan(Math.tan(vFov / 2) * camera.aspect);
                const distV = r / Math.sin(vFov / 2);
                const distH = r / Math.sin(hFov / 2);
                const fitPad = embedLarge ? 0.72 : 1.06;
                const dist = Math.max(distV, distH) * fitPad;
                camera.position.set(
                  sphere.center.x,
                  sphere.center.y + r * 0.06,
                  sphere.center.z + dist
                );
                camera.near = Math.max(dist / 800, 0.05);
                camera.far = dist * 8 + r * 4;
                camera.updateProjectionMatrix();
                camera.lookAt(sphere.center);
                resolve();
              },
              undefined,
              reject
            );
          });
        } catch (e) {
          if (!disposedRef.current) setLoadError(String(e?.message || e));
        } finally {
          if (!disposedRef.current) setLoading(false);
        }
      })();
    },
    []
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
        },
        hint: {
          position: 'absolute',
          bottom: 14,
          left: 16,
          right: 16,
          fontSize: 16,
          fontWeight: '800',
          letterSpacing: 0.35,
          lineHeight: 22,
          color: 'rgba(255, 248, 235, 0.96)',
          textAlign: 'center',
          pointerEvents: 'none',
          textShadowColor: 'rgba(0, 0, 0, 0.55)',
          textShadowOffset: { width: 0, height: 1 },
          textShadowRadius: 6,
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
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : null}
      {loadError ? (
        <View style={styles.overlay}>
          <Text style={styles.err}>{loadError}</Text>
        </View>
      ) : null}
      {hintLabel && !loadError ? <Text style={styles.hint}>{hintLabel}</Text> : null}
    </View>
  );
}


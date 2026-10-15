import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { STLLoader } from "three/addons/loaders/STLLoader.js";
import contours from "./panel-contours.json";
import { assembly, type Selection, type Part } from "./assembly";

export type ViewerOptions = {
  resolveAsset: (filename: string) => string;
  onError?: (error: Error) => void;
  onReady?: (parts: number) => void;
};
export function createRailViewer(host: HTMLElement, options: ViewerOptions) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setClearColor(0xeef1f2, 1);
  renderer.domElement.setAttribute(
    "aria-label",
    "レール組立。ドラッグで回転、二本指またはホイールで拡大。視点ボタンでも操作できます。",
  );
  renderer.domElement.setAttribute("role", "img");
  host.append(renderer.domElement);
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xffffff, 0x647587, 3));
  const light = new THREE.DirectionalLight(0xffffff, 3);
  light.position.set(100, -200, 300);
  scene.add(light);
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 10000);
  camera.up.set(0, 0, 1);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.minDistance = 40;
  controls.maxDistance = 2000;
  let group = new THREE.Group();
  scene.add(group);
  let version = 0,
    disposed = false,
    explode = 0;
  const visible = { body: true, bar: true, panel: true };
  const cache = new Map<string, THREE.BufferGeometry>();
  const loader = new STLLoader();
  const bounds = new THREE.Box3();
  function draw() {
    if (!disposed) {
      controls.update();
      renderer.render(scene, camera);
    }
  }
  renderer.setAnimationLoop(draw);
  const observer = new ResizeObserver(() => {
    const { width, height } = host.getBoundingClientRect();
    if (width && height) {
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      fit();
    }
  });
  observer.observe(host);
  function disposeGroup(g: THREE.Group) {
    g.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.material.dispose();
        if (o.userData.generated) o.geometry.dispose();
      }
    });
  }
  function fit(view: "iso" | "front" | "side" = "iso") {
    if (!group.children.length) return;
    bounds.setFromObject(group);
    const center = bounds.getCenter(new THREE.Vector3()),
      radius = bounds.getSize(new THREE.Vector3()).length() / 2;
    const fov = THREE.MathUtils.degToRad(camera.fov),
      limiting = Math.min(
        fov,
        2 * Math.atan(Math.tan(fov / 2) * camera.aspect),
      );
    const distance = (radius / Math.sin(limiting / 2)) * 1.15;
    const direction =
      view === "front"
        ? new THREE.Vector3(0, 0, 1)
        : view === "side"
          ? new THREE.Vector3(1, 0, 0)
          : new THREE.Vector3(0.9, -1.25, 1.6).normalize();
    const damping = controls.enableDamping;
    controls.enableDamping = false;
    controls.update();
    controls.enableDamping = damping;
    camera.position.copy(center).addScaledVector(direction, distance);
    controls.target.copy(center);
    camera.near = 0.1;
    camera.far = Math.max(4000, distance * 5);
    camera.updateProjectionMatrix();
    controls.update();
  }
  function applyDisplay() {
    group.children.forEach((o) => {
      const p = o.userData.part as Part;
      o.position.set(...p.explode).multiplyScalar(explode);
      o.visible = visible[p.category];
    });
  }
  async function setSelection(selection: Selection) {
    const request = ++version;
    scene.remove(group);
    disposeGroup(group);
    group = new THREE.Group();
    scene.add(group);
    try {
      const parts = assembly(selection);
      const names = [
        ...new Set(parts.flatMap((p) => (p.asset ? [p.asset] : []))),
      ];
      await Promise.all(
        names.map(async (name) => {
          if (!cache.has(name)) {
            const geometry = await loader.loadAsync(options.resolveAsset(name));
            if (disposed || request !== version) {
              geometry.dispose();
              return;
            }
            cache.set(name, geometry);
          }
        }),
      );
      if (disposed || request !== version) return;
      for (const p of parts) {
        let geometry: THREE.BufferGeometry;
        if (p.panel) {
          const data = contours[p.panel];
          const shape = new THREE.Shape(
            data.outer.map(([x, y]) => new THREE.Vector2(x, y)),
          );
          for (const hole of data.holes)
            shape.holes.push(
              new THREE.Path(hole.map(([x, y]) => new THREE.Vector2(x, y))),
            );
          geometry = new THREE.ExtrudeGeometry(shape, {
            depth: 1.6,
            bevelEnabled: false,
            curveSegments: 1,
          });
        } else geometry = cache.get(p.asset!)!;
        const color =
          p.category === "body"
            ? selection.color === "WH"
              ? 0xf8f6ee
              : 0x282c31
            : p.category === "bar"
              ? 0xc7bca2
              : 0x73818d;
        const material = new THREE.MeshStandardMaterial({
          color,
          roughness: p.category === "panel" ? 0.5 : 0.7,
          metalness: p.category === "panel" ? 0.65 : 0,
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.applyMatrix4(new THREE.Matrix4().fromArray(p.matrix));
        const wrapper = new THREE.Group();
        wrapper.userData.part = p;
        mesh.userData.generated = !!p.panel;
        wrapper.add(mesh);
        group.add(wrapper);
      }
      applyDisplay();
      fit();
      options.onReady?.(parts.length);
    } catch (reason) {
      if (!disposed && request === version)
        options.onError?.(
          reason instanceof Error ? reason : new Error(String(reason)),
        );
    }
  }
  return {
    setSelection,
    fit,
    zoom(factor: number) {
      camera.position
        .sub(controls.target)
        .multiplyScalar(factor)
        .add(controls.target);
      controls.update();
    },
    setExplode(value: number) {
      explode = Math.max(0, Math.min(1, value));
      applyDisplay();
      fit();
    },
    setVisible(category: Part["category"], value: boolean) {
      visible[category] = value;
      applyDisplay();
    },
    snapshot() {
      return {
        parts: group.children.length,
        items: group.children.map((o) => ({
          id: o.userData.part.id as string,
          visible: o.visible,
          position: o.position.toArray(),
        })),
        camera: camera.position.toArray(),
        target: controls.target.toArray(),
      };
    },
    dispose() {
      disposed = true;
      version++;
      observer.disconnect();
      renderer.setAnimationLoop(null);
      controls.dispose();
      disposeGroup(group);
      cache.forEach((g) => g.dispose());
      cache.clear();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}

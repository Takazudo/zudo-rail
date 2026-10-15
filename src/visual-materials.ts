import * as THREE from "three";
import type { Part } from "./assembly";

export const insertColors = { bar: 0x202124, nut: 0xc4c8cc };
// Display approximation only. Local X across slot, Y along rail, Z toward front.
export function createNutGeometry() {
  const shape = new THREE.Shape();
  shape.moveTo(-5, -1.3);
  shape.lineTo(-4.1, -2.2);
  shape.lineTo(4.1, -2.2);
  shape.lineTo(5, -1.3);
  shape.lineTo(5, 1.3);
  shape.lineTo(4.1, 2.2);
  shape.lineTo(-4.1, 2.2);
  shape.lineTo(-5, 1.3);
  shape.closePath();
  const hole = new THREE.Path();
  hole.absarc(0, 0, 1.5, 0, Math.PI * 2, true);
  shape.holes.push(hole);
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 3.6,
    bevelEnabled: false,
    curveSegments: 12,
  });
  const positions = geometry.getAttribute("position");
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i),
      z = positions.getZ(i);
    if (Math.abs(x) > 2)
      positions.setX(
        i,
        Math.sign(x) * (2 + (Math.abs(x) - 2) * (1 - ((1.4 / 3) * z) / 3.6)),
      );
  }
  geometry.computeVertexNormals();
  return geometry;
}
// Cap classification uses assembled normals, including the opposite left/right transforms.
export function assignPanelSurfaces(
  geometry: THREE.BufferGeometry,
  part: Part,
) {
  geometry.clearGroups();
  const normals = geometry.getAttribute("normal");
  const matrix = new THREE.Matrix4().fromArray(part.matrix);
  const side = Math.sign(matrix.elements[12]);
  const blackDirection = part.panel?.startsWith("frame") ? side : -side;
  for (let i = 0; i < normals.count; i += 3) {
    const normal = new THREE.Vector3()
      .fromBufferAttribute(normals, i)
      .transformDirection(matrix);
    const materialIndex = normal.x * blackDirection > 0.99 ? 1 : 0;
    const previous = geometry.groups.at(-1);
    if (previous?.materialIndex === materialIndex) previous.count += 3;
    else geometry.addGroup(i, 3, materialIndex);
  }
}

import { expect, test } from "vitest";
import { ExtrudeGeometry, Shape, Matrix4, Vector3 } from "three";
import { assembly, selections } from "../src/assembly";
import {
  assignPanelSurfaces,
  createNutGeometry,
} from "../src/visual-materials";
test("both sides have black outward frames, black inward pads, silver edges", () => {
  for (const s of selections)
    for (const part of assembly(s).filter((p) => p.panel)) {
      const shape = new Shape();
      shape.moveTo(0, 0);
      shape.lineTo(10, 0);
      shape.lineTo(10, 10);
      shape.lineTo(0, 10);
      shape.closePath();
      const geometry = new ExtrudeGeometry(shape, {
        depth: 1.6,
        bevelEnabled: false,
      });
      assignPanelSurfaces(geometry, part);
      const m = new Matrix4().fromArray(part.matrix),
        side = Math.sign(m.elements[12]);
      const normal = geometry.getAttribute("normal");
      const blackDirection = part.panel!.startsWith("frame") ? side : -side;
      expect(geometry.groups.length).toBeLessThanOrEqual(3);
      const seen = new Set<number>();
      for (const group of geometry.groups) {
        const n = new Vector3()
          .fromBufferAttribute(normal, group.start)
          .transformDirection(m);
        expect(group.materialIndex).toBe(n.x * blackDirection > 0.99 ? 1 : 0);
        seen.add(group.materialIndex!);
      }
      expect([...seen].sort()).toEqual([0, 1]);
      geometry.dispose();
    }
});
test("approximate nut bounds fit documented envelope", () => {
  const g = createNutGeometry();
  g.computeBoundingBox();
  const size = g.boundingBox!.getSize(new Vector3());
  expect(size.x).toBeCloseTo(10);
  expect(size.y).toBeCloseTo(4.4);
  expect(size.z).toBeCloseTo(3.6);
  g.dispose();
});

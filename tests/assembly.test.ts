import { describe, expect, it } from "vitest";
import { assembly, bom, productId, selections } from "../src/assembly";
import { Matrix4, Vector3 } from "three";
describe("16 selections", () => {
  it("has 16 distinct product IDs", () =>
    expect(new Set(selections.map(productId)).size).toBe(16));
  for (const s of selections)
    it(productId(s), () => {
      const items = bom(s);
      const rows = s.height === "3U" ? 2 : 6;
      expect(
        items.find(
          (x) =>
            x.name === (s.style === "NY" ? "ナイロンバー" : "スライドナット"),
        )?.count,
      ).toBe(s.style === "NY" ? rows : rows * s.width);
      if (s.height === "7U") {
        expect(() => assembly(s)).toThrow("確認中");
        return;
      }
      const parts = assembly(s);
      expect(parts.filter((x) => x.category === "body")).toHaveLength(2);
      expect(parts.filter((x) => x.category === "panel")).toHaveLength(4);
      expect(parts.filter((x) => x.category === "bar")).toHaveLength(
        s.style === "NY" ? 2 : 0,
      );
      for (const p of parts)
        expect(
          Math.abs(new Matrix4().fromArray(p.matrix).determinant()),
        ).toBeCloseTo(1);
      const axes =
        s.style === "NU"
          ? [14.930564880371094, 6.7535858154296875]
          : [5.2001, 14.42556];
      for (const [i, u] of [5.997998, 128.533836].entries()) {
        const m = new Matrix4().fromArray(
          parts.find((p) => p.id === `body-${i}`)!.matrix,
        );
        const point = new Vector3(...axes, 0).applyMatrix4(m);
        expect(Math.abs(point.x)).toBe(s.width === 40 ? 102 : 152.5);
        expect(point.y).toBeCloseTo(u - 67.26593, 5);
        expect(point.z).toBeCloseTo(-15.0303175, 5);
      }
    });
});

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
      const is7 = s.height === "7U";
      const center = is7 ? 157.377228 : 67.26593;
      const parts = assembly(s);
      expect(
        items.find((x) => x.name === `${s.height} side frame`)?.count,
      ).toBe(2);
      if (is7) {
        expect(parts.filter((p) => p.panel === "frame7u")).toHaveLength(2);
        expect(parts.filter((p) => p.panel === "pad3u")).toHaveLength(4);
        expect(parts.filter((p) => p.panel === "casePad1u")).toHaveLength(2);
        const pairAxes = [
          [128.533836, 140.5298535],
          [263.030426, 275.0617065],
        ];
        const xs =
          s.style === "NY" ? [5.197922, 17.022431] : [6.752716, 18.586121];
        pairAxes.forEach((pair, i) => {
          const m = new Matrix4().fromArray(
            parts.find((p) => p.id === `double-${i}`)!.matrix,
          );
          xs.forEach((x, j) => {
            const position = new Vector3(x, 5.201429, 0).applyMatrix4(m);
            const error = Math.abs(position.y - (pair[j] - center));
            expect(error).toBeGreaterThan(0.08);
            expect(error).toBeLessThan(0.105);
            expect(position.z).toBeCloseTo(-14.9950205, 5);
          });
        });
      }
      expect(parts.filter((x) => x.category === "body")).toHaveLength(
        is7 ? 4 : 2,
      );
      expect(parts.filter((x) => x.category === "panel")).toHaveLength(
        is7 ? 8 : 4,
      );
      expect(parts.filter((x) => x.category === "bar")).toHaveLength(
        s.style === "NY" ? rows : 0,
      );
      for (const p of parts)
        expect(new Matrix4().fromArray(p.matrix).determinant()).toBeCloseTo(1);
      const axes =
        s.style === "NU"
          ? [14.930564880371094, 6.7535858154296875]
          : [5.2001, 14.42556];
      for (const [i, u] of (is7
        ? [6.0332935, 308.7211605]
        : [5.997998, 128.533836]
      ).entries()) {
        const m = new Matrix4().fromArray(
          parts.find((p) => p.id === `single-${i}`)!.matrix,
        );
        const point = new Vector3(...axes, 0).applyMatrix4(m);
        expect(Math.abs(point.x)).toBe(s.width === 40 ? 102 : 152.5);
        expect(point.y).toBeCloseTo(u - center, 5);
        expect(point.z).toBeCloseTo(is7 ? -14.9950205 : -15.0303175, 5);
      }
    });
});

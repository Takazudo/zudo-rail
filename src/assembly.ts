import { Matrix4 } from "three";

export type Selection = {
  height: "3U" | "7U";
  width: 40 | 60;
  style: "NY" | "NU";
  color: "WH" | "BK";
};
export type Part = {
  id: string;
  category: "body" | "bar" | "panel";
  asset?: string;
  panel?: "frame3u" | "pad3u";
  matrix: number[];
  explode: [number, number, number];
};
export const initialSelection: Selection = {
  height: "3U",
  width: 40,
  style: "NY",
  color: "WH",
};
export const selections: Selection[] = (["3U", "7U"] as const).flatMap(
  (height) =>
    ([40, 60] as const).flatMap((width) =>
      (["NY", "NU"] as const).flatMap((style) =>
        (["WH", "BK"] as const).map((color) => ({
          height,
          width,
          style,
          color,
        })),
      ),
    ),
);
export function validateSelection(s: Selection) {
  if (!selections.some((x) => productId(x) === productId(s)))
    throw new Error("未対応の構成です");
}
export const productId = (s: Selection) =>
  `RAIL-${s.height}-${s.style}-${s.color}-${s.width}`;
export const bodyMaterial = (s: Selection) =>
  s.color === "WH" ? "9000HE Resin / 白" : "JLC Black Resin / 黒";
export function bom(s: Selection) {
  const rows = s.height === "3U" ? 2 : 6;
  return [
    { name: "single レール本体", count: 2, material: bodyMaterial(s) },
    ...(s.height === "7U"
      ? [{ name: "double レール本体", count: 2, material: bodyMaterial(s) }]
      : []),
    {
      name: s.style === "NY" ? "ナイロンバー" : "スライドナット",
      count: s.style === "NY" ? rows : rows * s.width,
      material:
        s.style === "NY"
          ? "ナイロン（本体樹脂とは別）"
          : "金属（単体形状未取得）",
    },
    {
      name: `${s.height} side frame`,
      count: s.height === "3U" ? 2 : 1,
      material:
        "アルミPCB 1.6 mm" + (s.height === "7U" ? " / 数量単位を確認中" : ""),
    },
    {
      name: "3U pad",
      count: s.height === "3U" ? 2 : 4,
      material: "アルミPCB 1.6 mm",
    },
    ...(s.height === "7U"
      ? [{ name: "1U pad", count: 2, material: "PCB対応を確認中" }]
      : []),
  ];
}
function matrix(...rows: number[]) {
  return new Matrix4().set(...(rows as Parameters<Matrix4["set"]>)).toArray();
}
export function assembly(s: Selection): Part[] {
  validateSelection(s);
  if (s.height === "7U")
    throw new Error(
      "7Uは side frame ×1 の単位と1U padの資産対応を確認中です。数量や接続を推測せず、組立表示を保留しています。",
    );
  const L = s.width === 40 ? 204 : 305;
  const parts: Part[] = [];
  for (const [i, u] of [5.997998, 128.533836].entries()) {
    const sign = i === 0 ? -1 : 1;
    const y = u - 67.26593,
      z = -15.0303175;
    const transform =
      s.style === "NU"
        ? matrix(
            0,
            0,
            sign,
            (-sign * L) / 2,
            0,
            sign,
            0,
            y - sign * 6.7535858154296875,
            -1,
            0,
            0,
            z + 14.930564880371094,
            0,
            0,
            0,
            1,
          )
        : matrix(
            0,
            0,
            sign,
            (-sign * L) / 2,
            sign,
            0,
            0,
            y - sign * 5.2001,
            0,
            1,
            0,
            z - 14.42556,
            0,
            0,
            0,
            1,
          );
    parts.push({
      id: `body-${i}`,
      category: "body",
      asset: `${s.style === "NY" ? "nylon" : "nuts"}-single-v3-${s.width}hp.stl`,
      matrix: transform,
      explode: [0, sign * 25, 0],
    });
    if (s.style === "NY") {
      const barLength = s.width === 40 ? 203.203278 : 304.718048;
      const local = new Matrix4().set(
        0,
        1,
        0,
        2.46461,
        0,
        0,
        1,
        20.716103,
        1,
        0,
        0,
        (L - barLength) / 2,
        0,
        0,
        0,
        1,
      );
      const m = new Matrix4().fromArray(transform).multiply(local);
      parts.push({
        id: `bar-${i}`,
        category: "bar",
        asset: `bar-${s.width}hp.stl`,
        matrix: m.toArray(),
        explode: [0, sign * 25, 32],
      });
    }
  }
  for (const sign of [-1, 1]) {
    for (const [panel, offset] of [
      ["pad3u", 0],
      ["frame3u", 1.6],
    ] as const) {
      // Source XY = row/depth; extrusion axis = rail width. End tabs wrap the outer panel edge.
      parts.push({
        id: `${panel}-${sign}`,
        category: "panel",
        panel,
        matrix: matrix(
          0,
          0,
          1,
          sign * (L / 2 + offset) + (sign < 0 ? -1.6 : 0),
          1,
          0,
          0,
          -67.26593,
          0,
          -1,
          0,
          0,
          0,
          0,
          0,
          1,
        ),
        explode: [sign * (panel === "frame3u" ? 55 : 30), 0, 0],
      });
    }
  }
  return parts;
}

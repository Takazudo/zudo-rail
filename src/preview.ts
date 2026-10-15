import "./style.css";
import {
  initialSelection,
  productId,
  bodyMaterial,
  bom,
  type Selection,
} from "./assembly";
import { createRailViewer } from "./viewer";

const assets = import.meta.glob("../working/*.stl", {
  query: "?url",
  import: "default",
  eager: true,
}) as Record<string, string>;
export function mountRailPreview(
  host: HTMLElement,
  config: {
    selection?: Selection;
    resolveAsset?: (name: string) => string;
    onSelection?: (selection: Selection) => void;
    onError?: (error: Error) => void;
  } = {},
) {
  let selection = { ...(config.selection ?? initialSelection) };
  host.classList.add("rail-preview");
  host.innerHTML = `<header><a class="brand" href="https://github.com/Takazudo/zudo-rail">TAKAZUDO MODULAR</a><span class="wip">WORK IN PROGRESS</span><h1>ZUDO <span>RAIL</span></h1><p>レールを選び、構造を見る。</p></header>
  <main><section class="scene" aria-label="組立プレビュー"><div class="scene-heading"><span id="variant"></span><span>実寸 STL / mm</span></div><div class="viewport"></div><div class="scene-message" role="status" aria-live="polite"></div><div class="toolbar" aria-label="視点操作"><button data-view="iso">全体・リセット</button><button data-view="front">正面</button><button data-view="side">側面</button><button data-zoom="in" aria-label="拡大">＋</button><button data-zoom="out" aria-label="縮小">−</button></div><p class="gesture">ドラッグで回転 · ホイールで拡大 · 二本指で移動・拡大</p></section>
  <aside><form><fieldset><legend>01 / サイズ</legend><label>高さ<select name="height"><option value="3U">3U</option><option value="7U">7U — 組立確認中</option></select></label><label>幅<select name="width"><option value="40">40HP</option><option value="60">60HP</option></select></label></fieldset><fieldset><legend>02 / モジュール固定方式</legend><label><input type="radio" name="style" value="NY"> NY / ナイロンバー</label><label><input type="radio" name="style" value="NU"> NU / スライドナット</label></fieldset><fieldset><legend>03 / 本体の樹脂・色</legend><label><input type="radio" name="color" value="WH"> 白 / 9000HE Resin</label><label><input type="radio" name="color" value="BK"> 黒 / JLC Black Resin</label><p class="help">色が変わるのはレール本体です。バーはナイロン、ナットは金属です。</p></fieldset></form><section class="display"><h2>構造を見る</h2><label>分解表示<input class="explode" type="range" min="0" max="100" value="0" aria-label="分解表示"></label><div class="layers"><label><input type="checkbox" data-layer="body" checked>本体</label><label><input type="checkbox" data-layer="bar" checked>バー</label><label><input type="checkbox" data-layer="panel" checked>フレーム・pad</label></div></section></aside>
  <section class="details"><div><span class="eyebrow">YOUR CONFIGURATION</span><h2 class="product-id"></h2><p class="material"></p><p class="scope">レールユニットのみ。外箱・モジュールは含みません。</p><p class="limitations">試作中の構造確認用です。現物の嵌合・強度・製造適合は未検証。NYバーの座り位置は溝寸法からの推定です。NUナットの単体CADは未取得のため、ナットは数量のみ表示します。</p></div><table><caption>構成部品（ユーザー確認済みBOM）</caption><thead><tr><th>部品</th><th>数量</th></tr></thead><tbody></tbody></table></section></main><footer><p>片側の積層：side frame 1.6 mm → pad 1.6 mm → 本体</p><a href="https://github.com/Takazudo/zudo-rail">出典・未確定事項・ソースコード ↗</a></footer>`;
  const query = <T extends Element>(selector: string) =>
    host.querySelector<T>(selector)!;
  const status = query<HTMLElement>(".scene-message");
  let viewer: ReturnType<typeof createRailViewer> | undefined;
  function error(e: Error) {
    status.textContent = e.message;
    status.dataset.state = "error";
    config.onError?.(e);
  }
  try {
    viewer = createRailViewer(query(".viewport"), {
      resolveAsset:
        config.resolveAsset ??
        ((name) => {
          const url = assets[`../working/${name}`];
          if (!url) throw new Error(`資産が見つかりません: ${name}`);
          return url;
        }),
      onError: error,
      onReady: (count) => {
        status.textContent = `${count}部品を表示中`;
        status.dataset.state = "ready";
      },
    });
  } catch (e) {
    error(e instanceof Error ? e : new Error(String(e)));
  }
  function update() {
    query("#variant").textContent =
      `${selection.height} / ${selection.width}HP / ${selection.style}`;
    query(".product-id").textContent = productId(selection);
    query(".material").textContent = bodyMaterial(selection);
    query("tbody").innerHTML = bom(selection)
      .map(
        (x) =>
          `<tr><td>${x.name}<small>${x.material}</small></td><td>${x.count}</td></tr>`,
      )
      .join("");
    query<HTMLSelectElement>("[name=height]").value = selection.height;
    query<HTMLSelectElement>("[name=width]").value = String(selection.width);
    query<HTMLInputElement>(`[name=style][value=${selection.style}]`).checked =
      true;
    query<HTMLInputElement>(`[name=color][value=${selection.color}]`).checked =
      true;
    if (viewer) {
      status.textContent = "実形状を読み込み中…";
      status.dataset.state = "loading";
      void viewer.setSelection(selection);
    }
    config.onSelection?.({ ...selection });
  }
  const abort = new AbortController();
  host.addEventListener(
    "change",
    (event) => {
      const input = event.target as HTMLInputElement;
      if (input.name) {
        selection = {
          ...selection,
          [input.name]:
            input.name === "width" ? Number(input.value) : input.value,
        };
        update();
      }
      if (input.dataset.layer)
        viewer?.setVisible(
          input.dataset.layer as "body" | "bar" | "panel",
          input.checked,
        );
    },
    { signal: abort.signal },
  );
  query(".explode").addEventListener(
    "input",
    (event) =>
      viewer?.setExplode(
        Number((event.target as HTMLInputElement).value) / 100,
      ),
    { signal: abort.signal },
  );
  host.addEventListener(
    "click",
    (event) => {
      const button = (event.target as Element).closest<HTMLButtonElement>(
        "button",
      );
      if (button?.dataset.view)
        viewer?.fit(button.dataset.view as "iso" | "front" | "side");
      if (button?.dataset.zoom)
        viewer?.zoom(button.dataset.zoom === "in" ? 0.8 : 1.25);
    },
    { signal: abort.signal },
  );
  update();
  return {
    setSelection(next: Selection) {
      selection = { ...next };
      update();
    },
    snapshot: () => viewer?.snapshot(),
    dispose() {
      abort.abort();
      viewer?.dispose();
      host.replaceChildren();
      host.classList.remove("rail-preview");
    },
  };
}

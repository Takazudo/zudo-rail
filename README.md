# ZUDO RAIL 組立プレビュー（WIP）

3U/7U、40HP/60HP、NY/NU、白/黒の16商品構成を選択できます。レール・パネルは実形状、NUナットは表示用近似形状です。製造承認版ではありません。

## 起動

Node.js 22以上、pnpm 11.19.0:

```sh
pnpm install --frozen-lockfile
pnpm dev
```

表示URL: `http://localhost:5173`。公開デプロイは設定していません。

```sh
pnpm typecheck
pnpm lint
pnpm test
pnpm check:assets
pnpm build
pnpm exec playwright install chromium
pnpm test:browser
```

ブラウザsuiteは利用環境のheavy/playwright guard経由で実行してください。全16構成の実描画、カメラ操作、読込失敗からの復帰、非同期切替、破棄を検証します。

## 組立決定と限界

- 7U side frame は左右1枚ずつ、**実板2枚**。ユーザー確認に基づき zudo-case と同じ組立を採用しました。以前の原価表 x1 は組立数量へ流用しません。
- 1U pad は中央に四角い開口のある `zb-side-frame-pad-1u/1u-padder.kicad_pcb`。P75 は概算原価用の代替参照であり形状には使用しません。
- double railと7U panelの軸間隔に約0.16–0.21mmの差があります。実嵌合は未検証です。
- NUスライドナットは商品画像と溝寸法を参考にした表示用近似です。BOMと同じ80/120/240/360個を例示配置します。製造CAD・嵌合保証ではありません。
- NYバーの配置は実溝寸法に基づく推定。Macの修復済みSTLとのバイト同一性は確認していません。

白本体は **9000HE Resin**、黒は **JLC Black Resin**。ナイロンバーは黒のJLC3DPナイロン、金属ナットは銀色で本体色に連動しません。フレームは外側黒／内側銀、padは内側黒、切断端・穴壁は銀です。padの隠れた裏面は写真で確認できず、銀色を表示上の仮定としています。外箱、10BOX、価格は対象外です。

## 再利用境界

`src/preview.ts` の `mountRailPreview(host, options)` が日本語UIを提供します。`src/viewer.ts` の `createRailViewer(host, options)` はThree.jsだけの描画境界、`src/assembly.ts` が純粋な選択/BOM/配置データです。

- options: `selection`, `resolveAsset(filename)`, `onSelection(selection)`, `onError(error)`。
- 戻り値: `setSelection(selection)`, `snapshot()`, `dispose()`。
- `dispose()` はDOM/listener/WebGL/geometry/materialを破棄します。
- `resolveAsset` は既定でViteのSTL URLを使います。移植先では独自URLに置換可能。
- previewモジュールが専用スコープのCSSを読み込みます。zzmodへの実装・公開変更は行っていません。

[計画](docs/preview-plan.md) / [形状根拠と変換](docs/asset-findings.md) / [出典manifest](docs/asset-manifest.json) / [全16構成の変換行列](docs/assembly-transforms.json) / [検証画像](docs/screenshots)。`working/`の製造資産は変更しません。PCB原本は出典検証用に保存しています。

ビルドはThree.jsを含むJS約700kB（gzip約183kB）のチャンク警告を表示します。動作失敗ではありませんが、埋込み時の遅延ロード・分割は将来の性能改善対象です。

[ナット形状・表面仕上げの根拠と追加検証](docs/visual-followup.md)

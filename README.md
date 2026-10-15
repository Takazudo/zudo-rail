# ZUDO RAIL 組立プレビュー（WIP）

3U/7U、40HP/60HP、NY/NU、白/黒の16商品構成を選択できます。**現在3Uの8構成のみ組立表示可能**です。7Uは確認済みBOMと参照組立の差が未解決のため表示を保留しています。完成版・製造承認版ではありません。

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

ブラウザsuiteは利用環境のheavy/playwright guard経由で実行してください。16選択状態を検証しますが、7Uの確認待ち表示のテストは組立検証の合格ではありません。

## 現時点の未確定事項

- 7U side frame ×1は左右2枚を含むセットか、実板1枚か。zudo-caseは左右2枚を使います。
- 指定P75（zb-side-frame-1u）とzudo-caseの1u-padderは異なる穴形状です。
- double railと7U panelの軸間隔に約0.16–0.21mmの差があります。実嵌合は未検証です。
- NUスライドナット単体CADは取得できていません。数量はBOMに表示し、推測形状は追加していません。
- NYバーの配置は実溝寸法に基づく推定。Macの修復済みSTLとのバイト同一性は確認していません。

白本体は **9000HE Resin**、黒は **JLC Black Resin**。ナイロンバーと金属ナットは別材質です。外箱、10BOX、価格は対象外です。

## 再利用境界

`src/preview.ts` の `mountRailPreview(host, options)` が日本語UIを提供します。`src/viewer.ts` の `createRailViewer(host, options)` はThree.jsだけの描画境界、`src/assembly.ts` が純粋な選択/BOM/配置データです。

- options: `selection`, `resolveAsset(filename)`, `onSelection(selection)`, `onError(error)`。
- 戻り値: `setSelection(selection)`, `snapshot()`, `dispose()`。
- `dispose()` はDOM/listener/WebGL/geometry/materialを破棄します。
- `resolveAsset` は既定でViteのSTL URLを使います。移植先では独自URLに置換可能。
- CSSは別途読み込んでください。zzmodへの実装・公開変更は行っていません。

[計画](docs/preview-plan.md) / [形状根拠と変換](docs/asset-findings.md) / [出典manifest](docs/asset-manifest.json)。`working/`の製造資産は変更しません。PCB原本は出典検証用に保存しています。

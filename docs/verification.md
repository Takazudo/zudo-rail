# プレビュー検証記録

## 実施範囲

- 全16構成の実STL/PCB描画と部品数、8商品ごとの代表画像（高さ/幅4組合せ×NY白/NU黒）。
- 17 unit tests: 商品ID/BOM/全剛体行列/取付軸、7U doubleの残留軸ずれを明示的に検査。
- 3 browser scenarios: 16選択・console/networkエラー監視・mobile、失敗資産の表示と復帰、orbit/zoom/preset/reset安定性/分解/可視性/遅延切替/dispose/CSS隔離。
- 元STLと元PCBのSHA256、生成した全輪郭を原本から再抽出して比較。`working/`変更なし。
- 独立計画レビュー、独立実装レビュー、独立形状レビュー。レビュアーは別コンテキストのCodex、managerモデルを継承（モデル上書きなし）。

実装レビューの指摘: CSSのhostへの漏れ、操作テストのassert不足、生成輪郭の検証漏れ、OrbitControlsの慣性がreset後も残る問題。すべて修正して再検証。

## 画像

|構成|NY・白|NU・黒|
|---|---|---|
|3U / 40HP|[画像](screenshots/RAIL-3U-NY-WH-40.png)|[画像](screenshots/RAIL-3U-NU-BK-40.png)|
|3U / 60HP|[画像](screenshots/RAIL-3U-NY-WH-60.png)|[画像](screenshots/RAIL-3U-NU-BK-60.png)|
|7U / 40HP|[画像](screenshots/RAIL-7U-NY-WH-40.png)|[画像](screenshots/RAIL-7U-NU-BK-40.png)|
|7U / 60HP|[画像](screenshots/RAIL-7U-NY-WH-60.png)|[画像](screenshots/RAIL-7U-NU-BK-60.png)|

[分解](screenshots/exploded.png) / [390pxモバイル](screenshots/mobile.png)。Playwright Chromium・software WebGLの実描画。画像はテスト時に再生成。

## 限界

NUナットの実CAD未取得のため数量のみ表示。端部締結ねじは今回BOM指定に含まれず描画しない。NYバーは実溝寸法からの座り位置推定。閉じたSTL topology・目視組立は実製造/嵌合/強度の保証ではない。double railと7U穴の片軸約0.08–0.10mm差は保持して記録。Mac修復版とのバイト比較は未実施。公開hosting設定はない。

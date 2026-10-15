# レール組立プレビュー実装計画

基準: zudo-rail main `3244722d4ed0896dcebc5e31bb154209488f2705`。既存 PR / issue は取得時点でなし。製造 STL は変更しない。対象は RAIL-{3U|7U}-{NY|NU}-{WH|BK}-{40|60} の16構成のみ。zzmod は参照のみ。

## 実装タスク

**Wave:** 1
**Depends on:** none
**Execution mode:** subagents - 実装は一つのブランチ、独立した形状調査・レビューで検証
**Difficulty:** mid - 新旧の実形状と取付軸を照合する必要がある

1. current STL と zudo-blanks の PCB、zudo-case の保存済み配置を照合。出典コミット、SHA-256、寸法、変換行列、未確定事項を manifest に残す。
2. Vite + TypeScript の独立したプレビューを追加。選択/BOM/組立データと Three.js 描画を分離し、ホスト DOM と資産 URL を渡せる境界を設ける。日本語・レスポンシブ・キーボード操作、orbit/zoom/reset、分解と部品表示を実装。
3. 16構成を検証。部品数、資産ハッシュ、剛体変換、取付軸、エラー処理、非同期切替、カメラ、モバイルを検査。実ブラウザの代表画像を保存し目視確認。
4. 独立レビュー、修正、最終 head のチェック、通常 PR マージ、受入 main の再チェック。既設 hosting がなければローカル起動手順を提供。

## 確定要件

- 3U: single x2、NY bar x2 または NU nut x80/x120、3U frame x2、3U pad x2。
- 7U: single x2 + double x2、NY bar x6 または NU nut x240/x360、7U frame x1（単位要確認）、3U pad x4、1U pad x2。
- WH = 9000HE Resin、BK = JLC Black Resin。本体樹脂とナイロンバー/金属ナットを区別。価格・外箱・10BOX・製造保証は含めない。
- 実形状は比例拡縮しない。Mac の修復データはアクセスせず、GitHub バイトとの同一性は保証しない。

## 判断と確認事項

- zudo-case は side frame/fixer 1.6mm と padder 1.6mm を片側で重ねる。板を無条件で2倍にしない。
- 7U は 3U+3U+1U を同一平面に配置。既存例は7U frameを左右に計2枚使用。今回のBOM x1がセット単位かは質問中。
- 指定の1U PCB名と既存例の1u-padderは異なる。対応を質問中。
- 既存例は旧single rail。新double railの軸間隔と新singleの端部を実測し、差を隠して強制配置しない。
- 公開deployment設定は未設置。新規サービスや認証・課金設定を作成しない。

## 検証条件

正しい16商品IDと確認済みBOM、HTTP/consoleエラーなし、部品が欠けない、正しい向き・縮尺・接触、選択連打でも古いモデルに戻らない、狭い画面で操作可能、resetで全体に戻る。未確定の接続は保証せず明示し、必要な確認を終えるまで完成組立として統合しない。

## 独立計画レビュー反映

- NU double の両幅について、面重複・閉じた辺・寸法を検証し、Mac修復とのバイト同一性とは区別する。
- 全16選択をブラウザで実行し、3U/40、3U/60、7U/40、7U/60の画像を保持。NY/NU、白/黒も代表画像に含める。
- 公開境界: typed selection、asset URL resolver、onSelection/onError、dispose（WebGL・listener解放）。

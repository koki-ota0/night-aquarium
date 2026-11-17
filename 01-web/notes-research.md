# 図鑑拡張 調査メモ（未実装・候補）

既存200種からサンゴ礁約20種を展示対象外へ移す場合、合計300種には新規約120種が必要。既存個体を失わない保管・セーブ互換を前提とする。下記は候補の生息地の確認であり、種の採用・和名・形態・飼育・各モデルの検証は未完了。

- 深海 Ceratias holboelli：通常水深400–2000m、雌は最大120cm TL、雄は小型。https://www.fishbase.se/summary/Ceratias-holboelli
- 深海 Caulophryne jordani：水深100–1510m、雌最大20cm TL。https://fishbase.se/summary/Caulophryne-jordani.html
- 深海 Gigantura indica：通常水深500–2000m、熱帯〜亜熱帯の深海。https://www.fishbase.se/Summary/SpeciesSummary.php?ID=7444
- 湖 Mylochromis spilostichus：マラウイ湖固有、砂底付近で魚を捕食。https://www.fishbase.se/summary/Mylochromis-spilostichus.html
- 湖 Copadichromis trewavasae：マラウイ湖固有、砂と岩の境界。https://www.fishbase.se/summary/Copadichromis-trewavasae.html
- 熱帯河口 Selenotoca multifasciata：沿岸河口やマングローブ水路。https://www.fishbase.se/summary/Scatophagus-multifasciatus.html
- 熱帯河口 Toxotes chatareus：汽水マングローブ河口、川や小流入域にも生息。https://www.fishbase.se/FieldGuide/FieldGuideSummary.php?genusname=Toxotes&speciesname=chatareus&c_code=144
- 冷温帯河口 Osmerus eperlanus：沿岸・河口・湖、遡河性と陸封型。https://www.fishbase.se/summary/Osmerus_eperlanus.html
- 冷温帯河口 Paralichthys dentatus：温帯、河口と沿岸の砂底など。https://www.fishbase.se/summary/1338

生息地は現実の展示適性・混泳可能性を保証せず、飼育条件は別途評価が必要。

## 実装作業の状態
- 探索を6グループに統合する試作コードと館内カードの種別シンボルを隔離コピーに作成。元のポート3000へは未反映。
- 探索グループ変更のテストを更新し単体69/69、隔離ブラウザE2E・保存バックアップ・balance:check成功。旧探索先の移行と時刻維持、館内11カードと探索先6件の表示を確認。実保存は未使用。
- 300種化は未着手。種・説明の出典照合、除外種の保管互換、形状・動き・餌・サムネイル、バランス検証が必要。

## 追加確認した寸法（出典により TL=全長、SL=標準体長）
- Gigantura indica：最大26cm TL。https://www.fishbase.se/summary/7444
- Mylochromis spilostichus：最大22.2cm TL。https://www.fishbase.se/summary/Mylochromis-spilostichus.html
- Copadichromis trewavasae：最大10.5cm SL、雄または性別不明。https://www.fishbase.se/summary/Copadichromis-trewavasae.html
- Selenotoca multifasciata：最大40cm SL。https://www.fishbase.se/summary/Scatophagus-multifasciatus.html
- Osmerus eperlanus：最大45cm TL。https://www.fishbase.se/summary/Osmerus_eperlanus.html
- Paralichthys dentatus：最大94cm TL。https://www.fishbase.se/summary/1338

## 2026-11-06 継続作業
- `data/expansion-216/candidates.tsv` と `evidence.json` に115候補の資料を収集。GBIFで完全一致・採用名・種階級を満たすもの111件。残り4件は学名の異名・曖昧一致のため採用保留。資料抽出は生物情報・外見・模型の個別審査に代わるものではない。
- 図鑑の表示総数・進捗幅・デモ表示をカタログ実数に追随させる改修を隔離版に追加。250・300種の館長賞に対応し、保存データの上限検証も更新（未公開）。
- 現行実データを読み取り専用で隔離版のインポート検証に通した。既存のバックアップは変更しない。
- 115件は調査候補で、実際の図鑑追加は0種。約20種のサンゴ礁構成見直し、各追加種の個別審査・日本語説明・3D造形・動き・餌・サムネイル・保存互換と検証が残る。300種の完成と誤認させる自動採用は行っていない。

## 2026-11-06 追加の作業（試作、非公開）
- 資料を確認した10種（深海3・湖2・熱帯河口2・冷たい河口2・冷たい海1）の名称、生息、寸法、ゲーム用の餌・動き、学名と根拠リンクを `data/expansion-216/curated-provisional.json` にまとめた。番号・ID・ゲーム設定は仮。
- 10種の試作3Dモデルを生成し `data/expansion-216/provisional-thumbs.json` と検査用画像で確認。コガシラボウエンギョの筒状眼、ヒレナガチョウチンアンコウの長いひれ、ビンナガの長い胸びれを種別造形として追加。試作のため色柄・輪郭・雌雄表現の追加確認が必要。
- 試作種に対する学名・出典・餌・動き・3D境界の単体検査を追加。全72件成功。250/300種の賞を含む保存の検証も追加。
- 現行図鑑にはまだ組み込んでいない。残りの追加種、サンゴ礁構成、旧個体保管、全体統合と実機検証が必要。

## 210種の隔離プレビュー（300種未完成）
- 既存200種に試作10種を隔離版の有効図鑑として統合。探索6分類、11室の景観・アイコンもプレビュー可能。候補種に個別の展示室、餌、動き、参考情報とモデル・サムネイルを設定。ただし7種は汎用形状由来で色柄・体型等の専門レビューは未了。完成品質の保証はできない。
- 追加候補の採用・個別制作、サンゴ礁約20種の構成見直しは未実施。300種完成ではないため既存本体へ同期しない。プレビューは3001・別保存で明示し、既存保存を共有しない。
- 単体74件、ブラウザE2E、バックアップE2E、バランス試算成功。10種は各部屋・探索プール・お迎え・保存復元を単体検証。既存の実保存を読み取りだけでインポート成功（8個体、未知種0）。未知の90 IDを含む合成300発見の保存も保持したが、これは本物の300種の完成・動作検証ではない。

## 第二陣 23種の追加試作
- `tools/curate-second-expansion.py` から `data/expansion-216/curated-second-provisional.json` に23種を別途用意。深海4・湖6・熱帯河口5・冷温帯河口3・冷海1・暖海4。初回10種と既存200種との学名・ID重複なし。全23種はGBIFの種階級・accepted・exactとFishBaseの該当ページ、参考最大寸法（全長/標準体長/尾叉長）を確認し、それぞれに生息域・説明・餌・動き・展示室を設定した。展示室の分類は代表的な生息域であり、種の分布全体を排他的に表すものではない。
- 名前照合で `Sillago sihama` を「シロギス」と誤記しそうになったが、シロギスは `S. japonica` であることを確認し「モトギス」に修正。資料: https://www.zukan-bouz.com/syu/%E3%82%B7%E3%83%AD%E3%82%AE%E3%82%B9 、https://i-zukan.jp/category/syu?category_id=26047 。`Exocoetus monocirrhus` は大西洋種ではなくインド太平洋に分布するため名称・分布を修正: https://www.discoverlife.org/20/q?search=Exocoetus+monocirrhus 。`Gerres filamentosus` の和名 https://marinespecies.org/aphia.php?id=218524&p=taxdetails 、`Scatophagus argus` https://www.gogo-zoo-aquarium.com/entry/fish/Perciformes/Scatophagidae/Scatophagus/argus 、`Alopias pelagicus` https://fishider.org/en/guide/elasmobranchii/alopiidae/alopias-pelagicus 。
- ニタリの長い尾を可動尾部として造形し、ミズウオの背びれ、イトヒキサギの長い背びれ、フロントーサの額を追加。23種の実際の3Dを `second-contact-sheet.png` で検査したが、多数は汎用の体型を流用しており、種ごとの輪郭・色・模様・性差の追加審査が必要。公開カタログにはまだ統合しない。
- `tests/current/expansion-second.test.mjs` で23種の学名の照合結果、既存との重複なし、部屋、餌、動き、有限な3D形状を確認。単体テスト75/75成功。追加分のブラウザ・セーブ・探索・繁殖E2Eは未検証。現在のプレビューは210種のまま。サンゴ礁約20種の見直しも未実施。

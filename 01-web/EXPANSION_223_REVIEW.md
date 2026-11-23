# Web 2.23｜両生類と図鑑

## 図鑑
- サンゴ・ホヤを「無脊椎動物」に移し、水草・海藻を別区分に。クラゲは見やすさのため独立区分を維持（クラゲも無脊椎動物）。海藻には植物でない藻類も含まれるため、展示上のまとめと明記。
- 既存番号とIDは変更していません。番号順・番号検索も維持。

## 表現
- ペンギン5種は丸みのある体と頭、瞳のハイライト、短めのシルエットを採用。既存の胸帯・斑点・顔の特徴やコガタの青色は維持。クラゲのモデルには手を加えていません。
- 両生類3種を追加。No.270 ウーパールーパーは羽状の外鰓・尾びれ、271 アカハライモリは黒い背・赤い腹、272 アフリカツメガエルは平たい体・大きな後肢。水底主体の動き、後の2種は時々水面へ呼吸に上がる動きを表現。動きや形はボクセルゲーム向けの簡略化です。
- 3種はいずれも湖の探索・展示に追加。共通のゲーム展示室であり、実際の温度・水質・毒・混泳条件などの飼育適合性を保証しません。幼体の陸上生活や現実の詳しい飼育条件は再現していません。

## 確認資料
- [Animal Diversity Web: Ambystoma mexicanum](https://animaldiversity.org/accounts/Ambystoma_mexicanum/) 成体の外鰓と尾びれ、湖、平均23cm。
- [いおワールドかごしま水族館: アカハライモリ](https://ioworld.jp/guide/guide-13138) 成体は穏やかな水辺、赤い腹、幼体は主に陸上。[福岡市](https://seibutsutayousei.city.fukuoka.lg.jp/learning/1209/) 皮膚の毒。
- [Animal Diversity Web: Xenopus laevis](https://animaldiversity.org/accounts/Xenopus_laevis/) 水生・後足の水かき・体長5–12cm。
- GBIF照合：3種ともEXACT・ACCEPTED。個別出典と分類は `data/expansion-216/curated-223.json`、`evidence.json`、`data/dex-taxonomy-221.json`。

## 検証
- 単体97/97。390×844隔離Chromiumで各種の番号検索・お迎え・湖の展示を確認。既存の水槽・探索・分類・ペンギン試験、保存バックアップ試験、探索バランス試算も実施。
- 現在272/300種。FlutterにはWeb 2.4以降未移植、Android・iPhone実機未検証。

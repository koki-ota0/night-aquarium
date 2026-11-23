# Web 2.28 生物追加・調査記録

## 重複確認と採用の考え方
ジンベエザメ No.100（検索別名ジンベイザメ）、ネコザメ No.26、オニイトマキエイ No.27、ミノカサゴ No.73、アンナウミウシ No.180 は登録済みのため重複追加せず、説明と出典を見直しました。既存のニタリ No.228 はオナガザメ属の別種です。マンタは総称なので、既存のオニイトマキエイに加えて別種のナンヨウマンタを追加しました。ウミヘビは指定どおり魚類を採用。ウミウシは既存種に加えブルードラゴンを追加。

## 今回追加した種
全9種の学名はGBIFで種レベルのEXACT・ACCEPTEDを確認。ID・番号・参照値は `data/expansion-216/curated-228.json`、分類確認は `evidence-228.json` と図鑑分類データに記録。分類・環境はゲーム内での整理であり、同居飼育の安全性を保証しません。

| No. | 生き物／学名 | 図鑑・展示 | 形や動き、調査根拠 |
|---|---|---|---|
| 278 | シロワニ *Carcharias taurus* | 魚／大型の冷・暖海 | 見える細い歯、二つの背びれ。沿岸の海底付近をゆっくり遊泳。[すみだ水族館](https://www.sumida-aquarium.com/about/animals/shirowani/)、[Aquarium of the Pacific](https://www.aquariumofpacific.org/onlinelearningcenter/species/sand_tiger_shark) |
| 279 | オナガザメ *Alopias vulpinus* | 魚／大型の冷・暖海 | 極端に長い上側の尾びれ。尾で魚群をたたく習性は説明に反映（ゲームの捕食動作では再現しない）。[FishBase](https://www.fishbase.org/FieldGuide/FieldGuideSummary.php?GenusName=Alopias&SpeciesName=vulpinus&pda=1) |
| 280 | マダラトビエイ *Aetobatus ocellatus* | 魚／暖海 | 黒っぽい体盤に白い点と長い尾、胸びれを動かして泳ぐ。[沖縄美ら海水族館](https://churaumi.okinawa/fishbook/00000514/)は日本周辺種を *A. ocellatus* とする。旧資料には *A. narinari* 表記もあり、分布を含む分類見直しに注意。 |
| 281 | アオミノウミウシ *Glaucus atlanticus* | 無脊椎動物・動く仲間／暖海 | 青と銀白、枝状の突起。別名ブルードラゴン。実際には腹面を上に海面に漂い、餌から得た刺胞を利用する。[OCEANA](https://oceana.ne.jp/domestic/69347) |
| 282 | モヨウモンガラドオシ *Myrichthys maculosus* | 魚／砂浜 | ウミヘビ科の魚。細長い体と暗色斑、エラで呼吸し爬虫類のウミヘビとは別。[京都大学瀬戸臨海実験所](https://www.seto.kyoto-u.ac.jp/shirahama_aqua/%E3%83%A2%E3%83%A8%E3%82%A6%E3%83%A2%E3%83%B3%E3%82%AC%E3%83%A9%E3%83%89%E3%82%AA%E3%82%B7/) |
| 283 | オニオコゼ *Inimicus japonicus* | 魚／砂浜 | 褐色の体、背の毒棘、歩行に使う胸びれの遊離条。[鳥羽水族館](https://aquarium.co.jp/picturebook/inimicus-japonicus.html) |
| 284 | アンドンクラゲ *Carybdea rastonii* | クラゲ／暖海 | 四角い傘と4本の長い触手。強い刺胞毒がある。[鴨川シーワールド](https://www.kamogawa-seaworld.jp/animal/aquarium_info/1095/)では綴り *C. rastoni*、GBIFでは *C. rastonii*。 |
| 285 | エチゼンクラゲ *Nemopilema nomurai* | クラゲ／冷海 | 厚い淡褐色の傘と枝分かれする口腕。大きな個体は傘径2mに達する。[日本大百科・世界大百科等](https://kotobank.jp/word/%E3%81%88%E3%81%A1%E3%81%9C%E3%82%93%E3%81%8F%E3%82%89%E3%81%92-3145070) |
| 286 | ナンヨウマンタ *Mobula alfredi* | 魚／大型暖海 | オニイトマキエイとは別種。頭びれと胸びれを広げて泳ぐ。[美ら海水族館の飼育員による解説](https://tierzine.com/facilities/manta-ray-explained/) |

大きさは展示調整用の参考値で、最大値の断定ではありません。動きは生態を参考にしたゲーム上の近似です。アオミノウミウシは水面付近の移動を再現していますが、実際の腹面を上にした浮き姿勢や刺胞の取り込みは再現していません。魚の砂潜り、狩り、毒による危険や種間関係も再現していません。クラゲは既存のボクセル世界観を維持し、立方形・4本の触手と大きな丸い傘・口腕で区別しています。

## 互換性と検証
既存のID・図鑑番号・獲得個体・クラゲの既存モデル・保存形式を維持。単体108件、9種の分類・モデル・餌・探索・セーブ、Chromiumで番号検索・お迎え・展示、既存機能・バックアップ・バランスを検証。公開前の実セーブは読み取りのみ。探索候補の増加により、同じ場所で個々の種に出会う相対確率は変わります。現在286 / 300種。Flutter・実機は今回対象外です。

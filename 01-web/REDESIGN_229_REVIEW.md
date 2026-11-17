# Web 2.29 展示と生き物の見直し

## 専用展示室
- ペンギンは左側の砂地と巣穴を持つ海岸、アシカは中央寄りの岩場と右の桟橋、カワウソは右側の巣穴と木の根がある淡水の川岸へ変更。水陸の境界と陸に上がる位置も各室の配置に合わせています。モデルはゲーム用の表現で、実際の飼育施設・混泳の安全性を示すものではありません。
- 展示の参考：[サンシャイン水族館](https://sunshinecity.jp/aquarium/area/sky-journey.html)、[宮島水族館](https://miyajima-aqua.jp/floor/)。

## 水槽の操作
餌・なかま配置・かざり配置を同じ列に配置。「水槽のくわしい操作」の折りたたみを廃止し、大きさ比べ・表示中の仲間、繁殖槽の操作も常時展開。かざり配置から数の変更と配置編集に進めます。320pxと390pxの画面で横はみ出しとボタン動作を確認しました。

## 今回追加（図鑑 No.287〜296）
| 種 | 特徴・環境 | 根拠 |
|---|---|---|
| シリヤケイカ *Sepiella japonica* | 白い小斑点とひれの白い縁、沿岸の砂泥底。 | [Honda釣魚図鑑](https://www.honda.co.jp/fishing/picture-book/shiriyakeika/) |
| カミナリイカ *Acanthosepion lycidas* | 眼状の斑紋がある大型のコウイカ。 | [鴨川シーワールド](https://www.kamogawa-seaworld.jp/event/event_info/13855/)。資料には *Sepia licidas* 等の表記もあるが、GBIFの採用名は *Acanthosepion lycidas*。 |
| ズワイガニ *Chionoecetes opilio* | 長い脚と小さな甲羅。冷たい海の深い底。 | [市場魚貝類図鑑](https://www.zukan-bouz.com/syu/%E3%82%BA%E3%83%AF%E3%82%A4%E3%82%AC%E3%83%8B) |
| ケガニ *Erimacrus isenbeckii* | 丸い甲羅、短い毛と棘。北の砂底。 | [加茂水族館](https://kamo-kurage.jp/shonaizukan/kegani/) |
| シャコ *Oratosquilla oratoria* | 平たい節の体と鎌状の捕脚。砂泥底に穴を掘る。 | [マリンピア日本海](https://www.marinepia.or.jp/picturebook/invertebrate/entry-11413.html) |
| マナマコ *Apostichopus japonicus* | 柔らかな体の棘皮動物。砂の有機物を触手で取り込む。 | [アクアマリンふくしま](https://www.aquamarine.or.jp/animals/japaneseseacucumber/) |
| ハゴロモモ *Cabomba caroliniana* | 扇状に分かれる葉の淡水植物。 | [葉っぱの岬](https://happamisaki.jp-o.net/biotope/mizukusa/cabomba.htm) |
| セイヨウセキショウモ *Vallisneria spiralis* | 帯状の葉を持ち走出枝で増える淡水植物。 | [GKZ植物事典](https://gkzplant.sakura.ne.jp/souhon2/shousai2/ha-gyou/hu/vrisuneriasupirarisu/varisuneriasupirarisu.html) |
| ワカメ *Undaria pinnatifida* | 岩に付着する褐藻。 | [世界大百科事典ほか](https://kotobank.jp/word/%E6%B5%B7%E8%97%BB-42617) |
| アナアオサ *Ulva australis* | 薄い膜状の緑藻。 | [アナアオサ](https://ja.wikipedia.org/wiki/%E3%82%A2%E3%83%8A%E3%82%A2%E3%82%AA%E3%82%B5) |

10種の学名はGBIFの種レベルEXACT・ACCEPTEDを確認し、`data/expansion-216/evidence.json` に記録。植物と藻類は展示上まとめていますが、別の生物群です。水草は淡水、海藻は海水の適合展示に配置。食性や動きはゲーム用の近似で、実際の世話・複雑な捕食行動を再現するものではありません。

## 検証・保護
110件の単体検証、10種のお迎え・展示先・分類・餌・保存、旧機能E2E、バックアップ・バランス検査を実施。種ID・番号、既存個体・セーブ形式は保持。種の追加に伴い各探索先で種ごとの相対出現率は変化します。Web 296 / 300種。Flutter移植と端末実機検証は今回未実施。

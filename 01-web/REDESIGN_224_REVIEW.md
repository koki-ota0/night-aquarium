# Web 2.24｜展示室と新しい生きもの

## 展示と形
- ペンギンは頭・瞳・種類ごとの模様を残し、胴体を縦長ですっきりした比率に変更。
- ペンギン展示は、海面と砂色の海岸、複数の巣穴、草、海中へ続く岩棚と砂底。参考：[サンシャイン水族館・草原のペンギン](https://sunshinecity.jp/aquarium/area/sky-journey.html)、[すみだ水族館](https://www.sumida-aquarium.com/)。寒冷な氷上生活と決めつけず、既存の温帯系ペンギンに合わせています。
- アシカ展示は、陸の岩棚から水中へ続く岩壁、浮き桟橋、海藻と広い遊泳空間。参考：[サンシャイン水族館](https://sunshinecity.jp/aquarium/animals/ashika.html)、[神戸須磨シーワールド](https://www.kobesuma-seaworld.jp/facilities/area/aqua-live/)。
- カワウソ展示は、川岸の巣穴、露出した根、倒木、浅瀬の石と植物。参考：[四国水族館](https://shikoku-aquarium.jp/kannai/exhibition/rivers_lake/000037/)、[アクア・トト ぎふ](https://aquatotto.com/event/schedule/detail.php?p=19562)。
- 岩や根などは他の展示に合わせたボクセル景観です。陸上・水中の往来はゲーム用の簡略化。実在施設の正確な模型や実際の飼育設計ではありません。

## 種と根拠
- ニホンウナギ *Anguilla japonica* は既存No.041、ID `real_177` を維持。小さな胸びれ、細長く連続するひれ、分節状の体と波打つ動きに変更。[神奈川県](https://www.pref.kanagawa.jp/docs/a4y/images/unagi.html)
- No.273 クリオネ（ハダカカメガイ） *Clione limacina*：殻のない浮遊性巻貝。翼を動かして泳ぎ、専用の餌として浮遊性巻貝を簡略表現。[Yahoo!きっず図鑑](https://kids.yahoo.co.jp/zukan/animal/kind/invertebrate/0012.html)。雌雄同体ですが、ゲームの性別・繁殖は共通ルールによる簡略化です。
- No.274 ステルレットチョウザメ *Acipenser ruthenus*：細い吻、4本のひげ、骨板と上下非対称の尾を表現。[FishBase](https://www.fishbase.se/Summary/SpeciesSummary.php?id=4604&lang=japanese)
- No.275 ウツボ *Gymnothorax kidako*：胸びれのない長い体、褐色の帯、大きな口を表現。ウナギとは別の分節体。[日本大百科全書](https://japanknowledge.com/contents/nipponica/sample_koumoku.html?entryid=936)、[鳥羽水族館](https://aquarium.co.jp/picturebook/gymnothorax-kidako.html)
- GBIF採用名・形態根拠は `data/expansion-216/curated-224.json`、`evidence.json` に保存。各種の移動・餌・繁殖は現実を完全に再現するものではありません。

## 検証と制約
- 単体98/98、390×844の隔離Chromiumで旧ウナギ、新3種、前版の両生類3種の番号検索・お迎えと3展示を確認。既存の水槽・探索・図鑑・バックアップ試験とバランス試算も通過。
- 実保存は読み取り互換性を確認し、公開同期とZIPから除外。Flutterへの移植、Android・iPhone実機での確認は未実施。275/300種。

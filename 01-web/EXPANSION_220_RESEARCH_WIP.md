# 2.20 調査メモ（未実装・未審査）

作業隔離版のみ。以下は候補であり、ゲームに追加済みではない。資料・分類を照合した後、モデル・探索・水槽・保存テストを完了してから公開する。生息地タグと現実の混泳可能性は異なり、現実の水族館の飼育条件は保証しない。

## ユーザー指定
- 日本の川・湖、深海無脊椎、砂底・岩陰魚、クラゲ・貝・甲殻類、ペンギン・アシカ・カワウソを増やす。
- とくにクラゲを多数、資料に基づく種固有デザインにする。
- ペンギン・アシカ・カワウソは3つの別展示室。既存の個体とセーブを維持。探索6分類は維持。

## 検索結果と候補（既存247件と学名照合し下記重複なし）

GBIF species/match 確認日 2026-10-27。下記の種は、備考のある2件を除いて照合結果が EXACT / ACCEPTED。出典は形態や生態を調べる起点であり、採用確定の意味ではない。大きさをゲームに入力する前に計測部位と代表値／最大値を併記して再確認する。

### クラゲ類
- *Chrysaora fuscescens* — https://www.montereybayaquarium.org/animals/animals-a-to-z/sea-nettle — 橙色の傘、長い触手とひだのある口腕。傘径最大約45cm、口腕3.6–4.6m。サイズは傘径を使い、触手はモデルで短縮。
- *Chrysaora colorata* — https://www.montereybayaquarium.org/animals-the-ocean/animals-a-to-z/purple-striped-jelly — 白銀色の傘に深紫色の放射帯、傘径最大1m。
- *Chrysaora achlyos* — https://www.montereybayaquarium.org/animals/animals-a-to-z/black-sea-nettle — 紫黒い傘と長い桃色の口腕、傘径約0.9m、口腕6mに達する。
- *Aequorea victoria* — https://www.montereybayaquarium.org/animals/animals-a-to-z/crystal-jelly — 透明、縁に細い触手、傘径最大25.4cm。光る部分は傘縁の発光器で、常時ネオン色にするのは不正確。
- *Catostylus mosaicus* — https://storage.montereybayaquarium.org/storage/pressroom/presskit/pdf/the_jellies_experience_press_kit_final.pdf — 色は白から青、８本の口腕があり長い触手はない。傘径最大約46cm。短い拍動。
- *Cassiopea ornata* — https://aquarium.co.jp/picturebook/cassiopea-ornata.html — 底で傘を下にして逆さに拍動、共生藻。浮遊魚と同じ軌道にしない。寸法は https://www.pierrewildlife.com/searchspecies/marineinvert/jellyfishes/casssiopeaornata/ で最大30cm、種の有効性について不確実性に言及あり。確定前に追加の分類確認。
- *Olindias formosus* — https://www.montereybayaquarium.org/animals/animals-a-to-z/flower-hat-jelly — 傘の細縞と色鮮やかな触手、海底近くで過ごすこともある、傘径15cm。水族館のページは O. formosa、GBIFの照合は O. formosus（FUZZY / ACCEPTED）で表記差あり。WoRMS等で学名を再確認。
- *Bolinopsis mikado* — https://www.sumida-aquarium.com/about/animals/kabutokurage/ 、https://www.sc.niigata-u.ac.jp/sc/sadomarine/english/marinelife/kabutokurage.html — 有櫛動物、刺胞動物ではない。櫛板の反射、成体は傘の拍動ではなく櫛板で泳ぐ。新潟大学掲載の実測例は全長6–7cmで、最大値とは区別。雌雄同体について現在のオス・メス方式と整合させる必要あり。https://assets.speakcdn.com/assets/2332/aza_jellyfish_care_manual.pdf に有櫛動物の飼育参考あり。
- 既存 *Chrysaora pacifica* は追加しない（アカクラゲは既存）。既存クラゲの検索結果を目視でも照合する。

### 水辺の3動物と3展示室
- *Spheniscus magellanicus* — https://www.sumida-aquarium.com/about/animals/magellanic-penguin/ および https://storage.montereybayaquarium.org/storage/pressroom/presskit/pdf/hot%20pink%20flamingos%20press%20kit.pdf — 南米沿岸のマゼランペンギン、最大約27インチの高さ。魚・イカなど。海水プールと休息・繁殖できる陸。雪原を必須としない。
- *Zalophus californianus* — https://www.montereybayaquarium.org/animals-the-ocean/animals-a-to-z/california-sea-lion — 北米西岸、雄最大2.4m／雌1.8m、魚・イカ・タコ。水中で前肢を用い遊泳、岩や陸で休息。アザラシと違う耳介や肢を表現。
- コツメカワウソ — https://animaldiversity.org/accounts/Aonyx_cinerea/ および https://aquarium.co.jp/picturebook/aonyx-cinerea.html — 東南アジア、器用な前足、小さな爪、カニ・貝など。頭胴長40.6–63.5cmと尾長24.6–30.4cmは区別。淡水域の浅瀬と陸場。ラッコの仰向け遊泳モーションを流用しない。GBIFでは *Aonyx cinerea* が FUZZY / SYNONYM、*Aonyx cinereus* に照合される一方上記の資料は cinerea、現在受容学名をWoRMS/専門分類データで確認して採用する。
- 専用展示室は見た目の部屋追加だけでなく、水面・水中・陸場、行動、専用アイコン、通常探索とデモ、繁殖槽、適性、保存検証が必要。種同士の混泳可否を安易に現実の飼育可能性として示さない。

### 日本の川・湖
- アユ *Plecoglossus altivelis* — https://www.fishbase.se/Fieldguide/FieldGuideSummary.php?genusname=Plecoglossus&speciesname=altivelis&c_code=410 — 川を上り岩の藻類を食む。幼魚と成魚で食性や海への移動が異なる。代表長と最大長を区別。
- カワムツ *Nipponocypris temminckii* — https://www.fishbase.se/summary/Nipponocypris-temminckii — 河川・湖、掲載最大全長17.4cm。食性は別途確認する。
- ウグイ *Tribolodon hakonensis* — GBIF EXACT / ACCEPTED、ただし FishBase https://fishbase.se/summary/Tribolodon-hakonensis.html は *Pseudaspius hakonensis*。最新の分類による表記ゆれを確認する。
- オオサンショウウオ *Andrias japonicus* — https://animaldiversity.org/accounts/Andrias_japonicus/ — 最大1.5m、平たい体・短い四肢、底生、魚・昆虫・甲殻類。固有3Dと底の動きを要する。

### 深海無脊椎・砂底・貝
- オオグソクムシ *Bathynomus doederleini* — https://aquarium.co.jp/diary/2021/08/54054 、https://aquarium.co.jp/diary/2013/07/7959 — 日本近海、10–13cm、大きな複眼、14本の脚。底生・固有の節足動物モデル。
- ダイオウグソクムシ *Bathynomus giganteus* — 同資料 — メキシコ湾、45–50cm。上記と大きさ・複眼比率が異なる。
- チンアナゴ *Heteroconger hassi* — https://www.fishbase.se/Summary/SpeciesSummary.php?id=12619&lang=swedish — 白地に小黒点と大きな黒斑、砂の巣穴から上半身を出す。全長最大40cm、表示では砂に隠れる部分を考慮する。底から離れて泳ぎ回る汎用モデルは不可。
- ニシキアナゴ *Gorgasia preclara* — https://www.fishbase.se/summary/Gorgasia-preclara — 白と黄〜橙の輪帯、砂中の巣穴、最大全長40cm。
- オウムガイ *Nautilus pompilius* — https://www.montereybayaquarium.org/animals/animals-a-to-z/chambered-nautilus — 殻径16–21cm、90本以上の触手、魚や甲殻類・死骸を食べる。殻の縞と噴射泳を専用造形。

## 実装時の重要な技術上の未解決事項
1. `catalog.js` の ROOMS / ROOM_BY_ID / parseTankId / GROUPS / HABITAT_POOL とデモ表示・既存適性の整合。既存魚の保存を上書きしない。
2. `save-transfer.js` は個体の性を male/female 必須としている。雌雄同体の有櫛動物を追加する場合、表示・ペア・保存validator・従来セーブの後方互換を包括的に見直すか、確認が済むまで採用を保留。
3. 海底・陸地での動作と上下反転、餌に向かう動きが互いに干渉しない設計、3室それぞれの専用背景・アイコンと3Dモデル。
4. 生体展示しづらい深海種等をゲーム表現と区別し、実際の飼育を保証しない。
5. 隔離版で unit / build / E2E / backup / balance とモバイル目視を実施。公開直前に本番実保存のSHA・構造を確認し、保存を除外して同期。Flutter版と退避保存は触らない。

# 2.20 追加生物・展示室の確認記録

## 内容
現行247種を削除せず、実在18種を加えて計265種。旧種のIDとサンゴ礁対象種を維持。表示番号248–265とID exp_220_001–018を追加。300種には到達していない。

- クラゲ7種：パシフィックシーネットル、パープルストライプジェリー、ブラックシーネットル、クリスタルジェリー、カラージェリー、サカサクラゲ、ハナガサクラゲ。傘・触手・口腕の差、短い拍動、底生の逆さ向きなどを表現。サイズの基準は傘径であり、長い触手の長さではない。モデルと餌は簡略化。カブトクラゲは未追加（雌雄同体に対する現在の個体・繁殖モデルの見直しが必要）。
- 深海・砂底：オオグソクムシ、ダイオウグソクムシ、オウムガイ、チンアナゴ、ニシキアナゴ。アナゴは砂の巣穴を離れない。オウムガイは深いサンゴ礁斜面の生息を踏まえて深海水槽に配置。
- 日本の水辺：アユ、カワムツ、オオサンショウウオ。オオサンショウウオは両生類で川底を移動。
- マゼランペンギン、カリフォルニアアシカ、コツメカワウソと、それぞれの海と岩場／淡水と陸場を描いた専用展示室3室。水中移動と陸上休息を切り替える。陸への移動は連続的な演出であり、歩行・登攀の物理シミュレーションではない。

## 資料と分類
個別の生態・形・学名資料は `data/expansion-216/curated-220.json` の各行に記録。照合情報は同ディレクトリの `evidence.json`。GBIF Species Match 2026-10-27に学名を個別照合し、全18種がEXACT／SPECIES／ACCEPTED。コツメカワウソは参照先の *Aonyx cinerea* とGBIF採用の *Amblonyx cinereus* の表記差を確認。ハナガサクラゲは参照先の *Olindias formosa* とGBIF採用の *Olindias formosus* の表記差を確認。サカサクラゲの種同定については分類に不確実性を指摘する資料もある。水族館展示・ゲームの混泳適性を自然界での飼育適合性とみなさない。

主要資料：鳥羽水族館の[サカサクラゲ](https://aquarium.co.jp/picturebook/cassiopea-ornata.html)、[グソクムシの比較](https://aquarium.co.jp/diary/2021/08/54054)、[オウムガイ](https://aquarium.co.jp/picturebook/nautilus-pompilius.html)、Monterey Bay Aquariumの[クラゲ](https://www.montereybayaquarium.org/animals-the-ocean/animals-a-to-z/jellies)および[シーネットル](https://www.montereybayaquarium.org/animals/animals-a-to-z/sea-nettle)、[クリスタルジェリー](https://www.montereybayaquarium.org/animals/animals-a-to-z/crystal-jelly)、[ハナガサクラゲ](https://www.montereybayaquarium.org/animals/animals-a-to-z/flower-hat-jelly)、[アシカ](https://www.montereybayaquarium.org/animals-the-ocean/animals-a-to-z/california-sea-lion)、FishBaseの[アユ](https://www.fishbase.se/Fieldguide/FieldGuideSummary.php?genusname=Plecoglossus&speciesname=altivelis&c_code=410)と[カワムツ](https://www.fishbase.se/summary/Nipponocypris-temminckii)、Animal Diversity Webの[オオサンショウウオ](https://animaldiversity.org/accounts/Andrias_japonicus/)と[コツメカワウソ](https://animaldiversity.org/accounts/Aonyx_cinerea/)。

ゲーム内の代表寸法は、傘径・殻径・全長・身長など種ごとに計測部位が異なる。個体差を省いた概数であり、最大記録や代表的な値を同一条件の実寸比較とはみなさない。カラージェリー約46cmは出典の最大傘径18インチからの換算値、サカサクラゲ25cmは参考値。コツメカワウソ85cmは頭胴長と尾長を合算した概数、アシカ200cmは雌雄の体長範囲を踏まえた表示用の代表値。

## ゲーム上の省略
餌、環境、水温、繁殖期間、生活史、成長、実際の施設での飼育、寸法・動作はゲーム向けに省略している。特にクラゲのポリプ世代やオウムガイの長期発生は共通の繁殖システムで再現していない。モデルの触手の数と長さも表示上簡略化している。

## 検証
- Node単体90件（カタログ、個別モデル、通常入手、給餌、3室、繁殖槽、セーブ取り込み）
- ブラウザの既存操作E2E、追加3室のデモ表示とサカサクラゲお迎えE2E、バックアップ復元・競合保護E2E
- 390×844 Chromiumで3室の3D表示を確認、ペンギンが陸側に移る様子も確認。実機Android／iOSでは未検証。
- 公開版の保存は読み取り専用で revision164、8個体、SHA256 a68e760fbdf3f7774727017417b80c45bda838495f723c10c5291dbffe0f554e を確認し、新版への読み込みと正規化が成功。公開前に再確認する。

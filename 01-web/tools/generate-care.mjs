// Historical Web 2.6 generator; not used for the 2.7 catalogue or build.
import {writeFile} from 'node:fs/promises';
import {CATALOG} from '../catalog.js';
import {FOODS,FOOD_BY_ID,careProfile} from '../care-profiles.js';
import {SIZE_CLASSES,sizeClass,sizeClassLabel} from '../size-classes.js';
const rows=CATALOG.filter(sp=>sp.kind!=='environment').map(sp=>{
 const p=careProfile(sp),accepted=p.foods.map(id=>FOOD_BY_ID[id].short).join('、'),not=FOODS.filter(f=>!p.foods.includes(f.id)).map(f=>f.short).join('、')||'なし';
 const status=sp.kind==='evolution'?'親・類似型等のゲーム値':([12,33].includes(sp.number)?'種名未確認・類似型':'代表例');
 return `| ${String(sp.number).padStart(3,'0')} | ${sp.name} | ${sizeClassLabel(sp)} | ${FOOD_BY_ID[p.favorite].short} | ${accepted} | ${not} | ${p.unit} ${p.cm} cm | ${status} |`;
}).join('\n');
const md=`# よるの水族館｜お世話・繁殖・サイズの仕様と参考資料

更新日：2026年11月3日。実装値は \`care-profiles.js\`・\`size-classes.js\`・\`engine.js\` から生成しています。100項目の同定・生息・造形については別紙 \`SPECIES_REVIEW.md\` を参照してください。

## 大切な前提

- 食べ物は**自然の食性を手掛かりにした5つの大きなゲーム分類**です。「ゲームで食べない」は絶対に摂食しないという生物学的断定ではなく、実際の飼料の適否や必要な栄養を示しません。種類、年齢、個体、地域で食性は変わります。このゲームを実際の飼育・混泳の手引きにしないでください。
- 図鑑には魚だけでなく、カメ・海棲哺乳類・エビ・ウミウシ・クラゲ・海草などもいます。環境扱いの10項目にも動物や植物が含まれます。本作では**環境10項目を餌・繁殖・性別の対象外**としたゲーム上の簡略化です。実際に食事や繁殖が不要という意味ではありません。
- 動物90項目の♂／♀は**ゲームの繁殖用属性**で、各生物の現実の生殖・性の仕組みを正確に再現していません。たとえばクマノミには性転換があり、ウミウシの多くは雌雄同体、タツノオトシゴでは雄が卵を保育します。名前が未確定の生物や架空形態には種の同定や実測値を捏造せず、親や類似タイプに基づくゲーム設定を使っています。
- 参考資料は制作時の根拠・類似例です。全90種の厳密な餌・成長段階・体長をそれぞれ査読検証したことや、外部の専門家による監修を意味しません。

## 餌と育成

| ゲーム内の餌 | ゲームでの大まかな扱い |
|---|---|
| プランクトン | 動物プランクトン、非常に小さな甲殻類など |
| 小さな虫 | 水生昆虫、落下した小昆虫など |
| 小魚・貝 | 小魚、貝、甲殻類などをまとめたもの |
| 水草・海藻 | 水草、海草、藻類をまとめたもの。海草と海藻は異なる生物群です |
| 専用食 | ウミウシの仲間で見られる海綿などの専門的な食性をまとめた架空の餌。現実のウミウシに同じものが適するという意味ではありません |

- 餌は**今開いている展示室・水質の水槽だけ**に届きます。手動では対応する個体だけが食べ、好きな餌は育成度＋12、その他の対応する餌は＋8。ゲーム内の共生等の条件で各＋1が加算される場合があります。食べる個体がいない餌は回数を消費しません。
- **おまかせ**は各個体の食べられる餌（ゲーム上の好物）を選んで一度に配る利便機能です。育成度は一律＋8（共生等の追加は別）で、通常の給餌1回分を使います。手動で好物を選べば＋12になる利点は残ります。現実の混泳・給餌方法の推奨ではありません。
- 各水槽は1日2回を基本に、館長賞によるボーナスを含め最大5回。表示の日付は端末のローカル日付です。環境種は給餌対象外です。
- 魚を含む動物には「おなか」0〜100があり、新規お迎え・旧セーブ補完時は70。適した餌で＋35（最大100）、時間経過で1時間につき1減少します（2.3までは2）。**20以上の間は1時間ごとに育成度＋1、20未満では放置成長と繁殖判定が休止**します。おなかが減っても病気や死亡はありません。更新時には既存のお世話記録にも新しい減少率を適用するため、旧版で未処理だった空腹・放置成長の計算結果が変わる場合があります。
- 成長はA＝40、S＝100。育成素材でも成長可能。デモ設定では個体詳細の「デモ：育成度をAまで進める」でAにできます。
- 水槽に餌が落下し、対応する表示中の動物が近づく演出があります。ウニ・ヒトデ・ウミウシ等は泳がず、餌が水底へ落ちます。1ページに表示できる動物は最大12体ですが、給餌判定はその水槽の全対象に適用されます。

## 繁殖とお迎え

- 探索や「今日の魚」で同種を最大6匹まで迎えられます。**2匹目は反対のゲーム上の性別**を保証。上限を超えた重複動物や、重複した環境種は素材になります。各生物の詳細からも、1匹しかいない種類のお相手を迎えられます。最初のお相手は無料、以後は育成素材1個です。
- 同じ種類、同じ展示室・同じ水質にいる、A以上の♂と♀から1ペアを選びます。親子と、親を共有する兄弟姉妹は組みません。**判定時の両個体のおなかが20以上なら30％**で同種の子を1匹お迎え。子には親IDが残り、育成度0から始まります。旧データなどで親情報がない場合、血縁関係を推測しません。近親判定は親子・兄弟姉妹のみで、全血統をたどる遺伝学的判定ではありません。
- 同種6匹が全展示室合計で上限。1つの展示室／水質／種類につき1ペアを判定します。通常の判定間隔は24時間、**デモで開始したペアは1分**。設定を後で変えても開始済みタイマーの間隔は変わりません。
- 水槽の繁殖欄は、相手不足・性別・育成度・親子／兄弟・同種上限・空腹などの状態と、ペアがある場合の直前の判定結果を表示します。
- デモ設定中で、かつデモ時に開始したペアには「デモ：1回判定」ボタンがあります。これは待ち時間を飛ばすだけで、30％判定は維持されます。結果は確定ではありません。
- 留守中の判定は再開時に最大7回分を順次処理し、それ以前の過剰な回数は繰り越しません。判定時のおなかや上限により生まれないことがあります。成熟・同室のペアを初めて認識した時点からタイマーを開始します。
- 個体に最大12文字の任意名をつけられ、食事・育成・誕生などの観察ノートを直近8件保存し、個体詳細に5件を表示します。

## 水槽カメラ・相対サイズ

- 水槽右下の＋／−と2本指のピンチで倍率を調整します。「指で動かす」は拡大後の1本指／マウスドラッグで移動し、「魚を追う」は現在のページの特定個体を選んで追跡します。個体詳細の「この子を水槽で追う」からも移動できます。倍率表示を押すと倍率・位置・追跡をリセットします。
- 正式100項目のうち**動物90項目を小型48・中型23・大型19**に分類。イソギンチャクやサンゴ、海草など環境10項目は、魚とのサイズ比較の対象にせず従来の表示を維持します。環境10項目には動物も含まれます。分類一覧は \`docs/SIZE_CLASSES_2_5.md\` に生成します。
- 水槽モデルの最長寸法を、ゲーム内の小型1.00〜1.12、中型1.74〜1.94、大型2.95〜3.20に正規化。各分類内のわずかな違いは下表の参考値を対数で丸め、個体差・成長・混雑を加えます。画面の投影は形・向きやカメラでも変わります。繁殖で生まれた個体は参考寸法の90%から100%へ少しずつ成長します。従来の個体差±15%のデータはそのまま使い、旧保存等で極端な値の場合は表示倍率だけをこの範囲に制限します。
- **水槽の大きさは参考値に比例せず、実寸比ではありません。** 下表の単位は全長のほか、エイの幅、クラゲの傘径、カメの甲長等が混在し、個体の実測値や厳密な最大値ではありません。創作種には親や類似型、またはゲームの設定値を用います。
- とくにご指定の「マグロ＝中型、サメ＝大型」に合わせ、クロマグロ／ホンマグロは中型、ネコザメ系は大型にしています。実際には**クロマグロはネコザメより大きくなることがあります**。分類は科学的な体長の閾値ではなく、水槽演出のための目安です。

## 動物90項目のゲーム設定一覧

「食べられる」に好きな餌を含みます。各値は生態調査の完全な一覧ではなく、仕様確認用です。

| No. | 名前 | 水槽の大きさ | 好き | ゲームで食べられる | ゲームで食べない | 大きさの基準 | 値の扱い |
|---:|---|---|---|---|---|---|---|
${rows}

## 追加で参照した主な資料

- [国立環境研究所：メダカ](https://www.nies.go.jp/biodiversity/invasive/DB/detail/50910.html) — 体長の例と、動植物プランクトン・小昆虫を含む雑食性。
- [Animal Diversity Web：コイ](https://animaldiversity.org/accounts/Cyprinus_carpio/) — 雑食と成長段階による餌の違い。#12は種名未確認のためコイ類を参考にしたのみ。
- [FishBase：ドジョウ](https://www.fishbase.se/summary/misgurnus-anguillicaudatus.html) — 食性と一般的な体長の例。
- [Animal Diversity Web：カージナルテトラ](https://animaldiversity.org/accounts/Paracheirodon_axelrodi/) — 小型テトラ類の類似例。ネオンテトラと同一種という意味ではない。
- [Aquarium of the Pacific：テッポウウオ](https://www.aquariumofpacific.org/onlinelearningcenter/species/banded_archerfish) — 小昆虫、プランクトンなどを食べる類似種の例。
- [Animal Diversity Web：クマノミ類](https://animaldiversity.org/accounts/Amphiprion_clarkii/) — 動物プランクトンと藻類を含む食性の例。
- [海遊館：イトマキヒトデ](https://www.kaiyukan.com/connect/blog/2016/03/post-937.html) — 甲殻類、貝類、海藻や死骸を食べる。
- [NOAA：オニイトマキエイ](https://www.fisheries.noaa.gov/species/giant-manta-ray) — 幅と動物プランクトン中心の食性。ゲームのマンタは種を限定しない。
- [Animal Diversity Web：ジュゴン](https://animaldiversity.org/accounts/Dugong_dugon/) — 成体の長さと海草中心の食性。
- [Monterey Bay Aquarium：ミズクラゲ](https://www.montereybayaquarium.org/animals-the-ocean/animals-a-to-z/moon-jelly) — 傘径、動物プランクトン、生活史。
- [Monterey Bay Aquarium：リーフィーシードラゴン](https://www.montereybayaquarium.org/animals-the-ocean/animals-a-to-z/leafy-sea-dragon) — 平均的な長さと小型甲殻類の食性。
- [Monterey Bay Aquarium：アオウミガメ](https://www.montereybayaquarium.org/animals-the-ocean/animals-a-to-z/green-turtle) — 成長段階に伴う食性の変化。
- [Animal Diversity Web：ウミウシの一群](https://animaldiversity.org/accounts/Hypselodoris/) — 種ごとに専門化する食性、雌雄同体の例。
- [UC Berkeley：クマノミの性転換](https://evolution.berkeley.edu/fisheye-view-tree-of-life/gender-bending-fish/) — 性が変わる魚の例。
- [NOAA：シャチ](https://www.fisheries.noaa.gov/species/killer-whale) — 体長・地域集団によって異なる食性。ゲームの「小魚・貝」は現実の食性全体を表すものではありません。
- [NOAA：太平洋クロマグロ](https://www.fisheries.noaa.gov/feature-story/overfished-sustainable-harvests-pacific-bluefin-tuna-rebound-new-highs) — 成魚は約10フィートに達し得ます。中型は今回の画面用分類です。
- [新江ノ島水族館：ネコザメ](https://www.enosui.com/diaryentry.php?eid=03946) — 成長すると体長約1m。大型は今回の画面用分類です。
- [Animal Diversity Web：カマイルカ](https://animaldiversity.org/accounts/Lagenorhynchus_obliquidens/) — 長さ約1.7〜2.5mの例。
- [NIFREL：カクレクマノミ](https://www.nifrel.jp/area/zukan/20432.html) — 最大約11cmの例。図鑑の「クマノミ」を厳密にこの種に同定するものではありません。

さらに基本種ごとの同定・自然分布と55件の参考文献は \`SPECIES_REVIEW.md\` を参照してください。
`;
await writeFile(new URL('../CARE_AND_BREEDING.md',import.meta.url),md,'utf8');

const sections=['small','medium','large'].map(key=>{
 const species=CATALOG.filter(sp=>sizeClass(sp)===key);
 const items=species.map(sp=>{const p=careProfile(sp);return `| ${String(sp.number).padStart(3,'0')} | ${sp.name} | ${sp.kind==='evolution'?'進化・創作形態等':'基本'} | ${p.unit} 約${p.cm} cm |`;}).join('\n');
 return `## ${SIZE_CLASSES[key].label}（${species.length}項目）\n\n| No. | 名前 | 種類 | 大きさの参考値 |\n|---:|---|---|---|\n${items}`;
}).join('\n\n');
const environments=CATALOG.filter(sp=>sp.kind==='environment').map(sp=>`#${String(sp.number).padStart(3,'0')} ${sp.name}`).join('、');
const reference=`# よるの水族館｜水槽の大きさ分類（Web 2.5）

更新日：2026年11月3日。正式図鑑の100項目を確認し、動物90項目を小型48・中型23・大型19に分類しました。環境種10項目は水底の生きた装飾として別扱いです。これは水槽の見た目のための分類であり、学術的なサイズの分類ではありません。

- ご要望どおり、クマノミは小型、クロマグロ／ホンマグロは中型、イルカ・ネコザメは大型。シャチ・マンタ・ジュゴン・ピラルクも大型です。
- 実際にはクロマグロは約3mに達し得る一方、ネコザメは成魚で約1mの例があり、分類順と実際の体長は一致しません。個体・年齢・性別・種によっても大きさは変わります。[NOAA](https://www.fisheries.noaa.gov/feature-story/overfished-sustainable-harvests-pacific-bluefin-tuna-rebound-new-highs)・[新江ノ島水族館](https://www.enosui.com/diaryentry.php?eid=03946)
- 値は従来の制作上の概算で、全長・甲長・幅・傘径・高さ等が混在します。厳密な測定値や飼育方法ではありません。進化・架空種は親や類似型、またはゲーム独自の目安です。ニンギョは中型、ネッシーは大型という演出設定。詳細と他の出典は \`CARE_AND_BREEDING.md\` と \`SPECIES_REVIEW.md\` を参照してください。
- 水槽でのサイズはモデルの最大寸法を小型1.00〜1.12、中型1.74〜1.94、大型2.95〜3.20に正規化し、同じ水槽ページでは同じ混雑係数を掛けます。元の個体差と生まれた個体の成長も反映。実寸比ではなく、画面での見え方は体型や向きで変わります。図鑑サムネイルは比較用ではなく種類ごとに見やすく拡大しています。
- 旧セーブの創作種は、残した姿を基に表示サイズを決めます。保存内容や育成・繁殖のルール自体は変更しません。

${sections}

## 環境種（10項目・サイズ分類対象外）

${environments}

環境種には植物だけでなく、イソギンチャク、ホヤ、イガイ等の動物も含みます。「対象外」は現実の生物分類ではなく、本ゲームでの扱いです。
`;
await writeFile(new URL('../docs/SIZE_CLASSES_2_5.md',import.meta.url),reference,'utf8');
console.log('Built the care and breeding reference and 100-item size classification');

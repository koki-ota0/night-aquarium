// Historical Web 2.6 generator; not used for the 2.7 catalogue or build.
import fs from 'node:fs';
import {CATALOG} from '../catalog.js';

const refs={
 1:['沖縄美ら海水族館：イソギンチャクとクマノミ','https://churaumi.okinawa/sp/blog/1724309403/'],
 2:['水産庁：サンゴの構造','https://www.jfa.maff.go.jp/j/seibi/attach/pdf/sango_tebiki_h21_03-6.pdf'],
 3:['沖縄美ら海水族館：ハナサンゴ','https://churaumi.okinawa/fishbook/00000049/'],
 4:['コトバンク：ウミウチワの同名','https://kotobank.jp/word/%E3%82%A6%E3%83%9F%E3%82%A6%E3%83%81%E3%83%AF-35148'],
 5:['水産庁：アマモと藻場','https://www.jfa.maff.go.jp/j/kikaku/tamenteki/kaisetu/moba/moba_genjou/'],
 6:['水草研究会報：オオバモの別名の記録','https://mizukusakenjp.sakura.ne.jp/PDF/BWPSJ051_6.pdf'],
 7:['NHK：海草と海藻','https://www.nhk.or.jp/bunken/summary/kotoba/term/111.html'],
 8:['水産資料館：ホヤの体','https://museum.suisan-shinkou.or.jp/guide/hoya-like/1209/'],
 9:['海遊館：イガイ類と足糸','https://www.kaiyukan.com/connect/blog/2017/01/post-1182.html'],
 10:['FishBase：メダカ','https://www.fishbase.se/summary/Oryzias-latipes.html'],
 11:['茨城県水産試験場：コイの参考資料（#12の同定根拠ではない）','https://www.pref.ibaraki.jp/nourinsuisan/naisuishi/gyogancho/documents/037_koi.pdf'],
 12:['FishBase：ドジョウ','https://www.fishbase.se/summary/Misgurnus-anguillicaudatus'],
 13:['FishBase：ネオンテトラ','https://fishbase.se/FieldGuide/FieldGuideSummary.php?GenusName=Paracheirodon&SpeciesName=innesi&print=&sps='],
 14:['環境省：イシガメとアカミミガメ','https://www.env.go.jp/guide/info/ecojin/quiz/20210616.html'],
 15:['Smithsonian：ピラルク','https://www.smithsonianmag.com/blogs/national-zoo-conservation-biology-institute/2024/10/30/creature-feature-meet-the-freshwater-giant-arapaima/'],
 16:['海遊館：アロワナ','https://www.kaiyukan.com/connect/encyclopedia/136.html'],
 17:['国立科学博物館：クマノミとイソギンチャク','https://www.kahaku.go.jp/research/db/zoology/uodas/fish_in_focus/colum/kumanomi/index.html'],
 18:['沖縄美ら海水族館：タツノオトシゴの仲間','https://churaumi.okinawa/topics/1720314634/'],
 19:['FishBase：キュウセン','https://www.fishbase.se/summary/parajulis-poecilepterus'],
 20:['沖縄美ら海水族館：コクテンフグ（#33の同定根拠ではない）','https://churaumi.okinawa/fishbook/00000332/'],
 21:['FishBase：テッポウウオの一種','https://www.fishbase.se/summary/8229'],
 22:['桂浜水族館：ゴンズイとミナミゴンズイの分類','https://katurahama-aquarium.note.jp/n/nc47911abf98f'],
 23:['トロピカ：エビの体と海水エビ','https://tropica.jp/2018/10/13/post-22617/'],
 24:['下関市立しものせき水族館：ウミウシ','https://www.kaikyokan.com/cms/cp_sealife/%E3%82%A6%E3%83%9F%E3%82%A6%E3%82%B7%E3%82%92%E7%9F%A5%E3%82%8D%E3%81%86%EF%BC%81%EF%BC%81%E2%91%A0/'],
 25:['加茂水族館：イトマキヒトデ','https://kamo-kurage.jp/shonaizukan/itomakihitode/'],
 26:['FishBase：トビウオ科','https://www.fishbase.se/summary/FamilySummary.php?ID=206'],
 27:['新潟市水族館：カマイルカ','https://www.marinepia.or.jp/picturebook/mammalian/entry-11192.html'],
 28:['WEB魚図鑑：ネコザメ','https://zukan.com/fish/internal414'],
 29:['沖縄美ら海水族館：ウミガメの呼吸','https://churaumi.okinawa/sp/blog/1598779340/'],
 30:['NOAA：オニイトマキエイ','https://www.fisheries.noaa.gov/species/giant-manta-ray'],
 31:['WWF：クロマグロとホンマグロ','https://www.wwf.or.jp/activities/basicinfo/63.html'],
 32:['NOAA：バンドウイルカ','https://www.fisheries.noaa.gov/species/common-bottlenose-dolphin'],
 33:['NOAA：シャチ','https://www.fisheries.noaa.gov/species/killer-whale'],
 34:['WEB魚図鑑：アカエイ','https://zukan.com/fish/internal151'],
 35:['大阪府立環境農林水産総合研究所：マダコ','https://www.knsk-osaka.jp/zukan/zukan_database/osakawanikimono/385c4e95fd0b200/775c4e979420c79.html'],
 36:['WEB魚図鑑：マコガレイ','https://zukan.com/fish/internal39'],
 37:['宇久井ビジターセンター：バフンウニ','https://www.ugui-vc.jp/zukan/detail/294/'],
 38:['豪州環境当局：ジュゴン','https://environment.gov.au/cgi-bin/sprat/public/publicspecies.pl?taxon_id=28'],
 39:['Monterey Bay Aquarium：ミズクラゲ','https://www.montereybayaquarium.org/animals-the-ocean/animals-a-to-z/moon-jelly'],
 40:['富山県ほたるいか協会：ホタルイカ','https://www.hotaruika-toyama.com/mystic'],
 41:['WWF：ウナギの一生','https://www.wwf.or.jp/activities/basicinfo/3671.html'],
 42:['加茂水族館：キアンコウの擬餌','https://kamo-kurage.jp/shonaizukan/kiannkou/'],
 43:['Monterey Bay Aquarium：リーフィーシードラゴン','https://www.montereybayaquarium.org/animals-the-ocean/animals-a-to-z/leafy-sea-dragon'],
 44:['環境省：アカミミガメ（ミドリガメ）','https://www.env.go.jp/nature/intro/3control/files/r_akamimi_tebiki.pdf'],
 45:['市場魚貝類図鑑：「ハリフグ」という地方名','https://www.zukan-bouz.com/aka/%E3%83%8F%E3%83%AA%E3%83%95%E3%82%B0'],
 46:['AQUALASSIC：レッドビーシュリンプ','https://www.aqualassic.com/bee-shrimp_world/'],
 47:['AQUALASSIC：青い淡水観賞エビ（類似名の参考）','https://www.aqualassic.com/bluevelvetbluejellyshrimp/'],
 48:['NOAA：アオウミガメ','https://www.fisheries.noaa.gov/species/green-turtle'],
 49:['おきなわ図鑑：ミミックオクトパス','https://okinawa-zukan.com/column.php?vol=5'],
 50:['市場魚貝類図鑑：ヌマガレイ','https://www.zukan-bouz.com/syu/%E3%83%8C%E3%83%9E%E3%82%AC%E3%83%AC%E3%82%A4'],
 51:['神奈川県：ムラサキウニ','https://www.pref.kanagawa.jp/docs/mx7/cnt/f430693/zukan-murasakiuni.html'],
 52:['東京ECO：ヒカリメダカの体型','https://www.tcaeco.ac.jp/contents/animalbook/medaka-type/'],
 53:['オーシャナ：羅臼の白いシャチと原因の未確定','https://oceana.ne.jp/blue-economy/social-news/113153'],
 54:['市場魚貝類図鑑：イズヒメエイ（類似名の参考）','https://www.zukan-bouz.com/syu/%E3%82%A4%E3%82%BA%E3%83%92%E3%83%A1%E3%82%A8%E3%82%A4'],
 55:['桂浜水族館：金色のアジアアロワナ（類似の参考）','https://katurahama-aquarium.note.jp/n/nf826201d094b']
};
const parentRefs={1:1,2:1,3:2,4:3,5:4,6:5,7:6,8:7,9:8,10:9,11:10,12:11,13:12,14:13,15:14,16:15,17:16,30:17,31:18,32:19,33:20,34:21,35:22,36:23,37:24,38:25,53:26,54:27,55:28,56:29,57:30,58:31,59:32,60:33,74:34,75:35,76:36,77:37,78:38,87:39,88:40,89:41,90:42,91:43};
const extraRefs={18:52,25:44,28:55,44:45,48:46,49:47,67:48,70:31,72:53,79:54,81:49,83:50,84:51};
const names={anemone:'放射状の触手',branchCoral:'枝分かれした群体',flowerCoral:'花状のポリプ',seaFan:'平たい扇形の枝',eelgrass:'細長い帯状の葉',broadleaf:'幅広い水草風の葉',seagrass:'束になった細い葉',ascidian:'袋形の体と二つの孔',mussel:'暗色の二枚貝',medaka:'細身と上向き気味の口',koi:'体の厚みと口ひげ',loach:'長い体と口ひげ',tetra:'青の線と体後半の赤帯',freshTurtle:'甲羅と指のある四肢',arapaima:'大型魚風の細長い体と後方の赤斑',arowana:'上向きの口と大きな鱗',clown:'白帯と淡色の尾',seahorse:'直立した体と巻いた尾',wrasse:'横長の体と体側の線',puffer:'丸い体と小さなひれ',archer:'銀色の体と黒い縦帯',catfish:'細長い体と口ひげ・横線',shrimp:'節のある体と長い触角',nudibranch:'触角と背中の鰓状突起',starfish:'切れ込みの浅い五角形',flyingFish:'翼のように広い胸びれ',pacificDolphin:'鎌形背びれと白黒灰の体',catshark:'太い頭と2基の背びれ',seaTurtle:'甲羅と大きな前びれ',manta:'広い胸びれと2つの頭びれ',tuna:'流線形と三日月尾・小離鰭',bottlenose:'短い吻と背びれ・水平の尾',orca:'背びれと白いアイパッチ',stingray:'平たい体盤と長い尾',octopus:'8本の腕と丸い外套膜',flatfish:'偏った目と扁平な体',urchin:'棘のある丸い殻',dugong:'丸い体と水平の尾',moonJelly:'短い触手・4つの輪',squid:'流線形の外套膜と腕',eel:'細長い体と連続するひれ',angler:'大きな口と釣り竿状の突起',seadragon:'長い吻・葉状突起'};
const special={18:'菱形に近い尾と上下のひれ',25:'目の後ろの赤い模様',41:'体に小さな突起',44:'全身の棘',48:'紅白の帯',49:'青と淡色の帯',67:'海ガメのひれと緑の甲',70:'クロマグロと共通のシルエット',71:'人型の上半身と魚風の尾（創作）',72:'淡い白色のシャチの体',73:'シャチ風の背びれと創作の突起',79:'小さなエイ型と長い尾',81:'しま模様の腕',83:'カレイ型の体とひれの帯',84:'長い紫色の棘',94:'3体のイカをまとめた群れ',95:'腕の残る丸い光の玉（創作）',98:'長い首とひれを備えた創作生物'};
const water={marine:'海水',fresh:'淡水',brackish:'汽水'};const kinds={environment:'環境',basic:'基本',evolution:'進化'};
const src=fs.readFileSync(new URL('../species-models.js',import.meta.url),'utf8').match(/const variantTint=\{([^}]+)\}/)[1];const variants=Object.fromEntries([...src.matchAll(/(\d+):0x([0-9a-f]+)/g)].map(m=>[Number(m[1]),parseInt(m[2],16)]));
const escape=s=>String(s??'').replaceAll('|','／').replaceAll('\n',' ');
const refLink=n=>`[${n}](${refs[n][1]})`;
let out=`# よるの水族館｜100項目の生態・デザイン確認\n\n確認日：2026年10月27日。対象：ご提供の \`fish-catalog-100.md\`、環境10・基本34・進化56の計100項目。番号・名称・レア度・展示カテゴリは原稿どおり。**文献を用いた制作上の調査であり、外部の魚類学者・水族館専門家による監修を受けたものではありません。**\n\n## 読み方と限界\n\n- **展示**は元原稿のゲーム上の分類、**水**は本試作で切り分けた海水・淡水・汽水タブです。現実の生息域、水温、混泳条件、適正飼育を保証する情報ではありません。\n- **確認と生息**のうち進化欄は、実在・同名の生物または親として参考にした生物の情報です。\`ゲーム内の創作変種\`は「この作品での扱い」であり、世界中に同名の生物・品種が存在しないとの断定ではありません。\n- **特徴・デザイン**は資料をもとに識別の手掛かりを選び、画面で分かりやすいようボクセル化しています。色・ひれ・模様は一部誇張、デフォルメされています。基調色はモデルの設計値であり、生物の厳密な実際色ではありません。大きさも画面向けに調整し、実際の種間比率ではありません。\n- 本作の「進化」はゲーム内で別の姿が増える仕組み。別種への変身や同名の生きものが自然に変身することを意味しません。図鑑の「ゲームの物語」も現実の生態ではありません。レア度はゲーム上の出現・取得設計です。\n- 参考資料への番号リンクは、実在する本人または近縁・類似する生物の**確認根拠**です。#12・#33等は種の同定根拠ではありません。ゲーム独自の色や模様の根拠としても扱いません。\n\n## 優先して区別した点\n\n1. **#7 オオバモ**：アマモ類の別名としての記録はありますが、原稿の「淡水草」がどの生物に当たるかは未確定。淡水展示は原設計を残したゲーム上の扱いです。\n2. **#12 ヨウガネコイ／#33 ヤマトフグ**：指定名だけでは確実な種対応を確認できず、それぞれコイ類・フグ類を参考にした表現とし、学名は付けていません。\n3. **#5 ウミウチワ**：同じ名前がサンゴ類と褐藻の両方に使われます。本作はサンゴ類風。#1〜10には魚ではない刺胞動物・植物・被嚢類・二枚貝が含まれます。\n4. **#18 ヒカリメダカ**は実在の観賞型と同名。実物は尾びれが菱形に近く、背びれ・尻びれが対称になる体型を指します。ゲーム内で別の個体から変化する設定は創作です。\n5. **#25 ミドリガメ**は一般にアカミミガメ幼体の通称で、ニホンイシガメとは別種。**#70 ホンマグロ**はクロマグロの別名。**#72**には実際に白いシャチの観察例がありますが、白い理由は外見だけで断定できません。\n6. **#34 テッポウウオ、#87 ミズクラゲ、#89 ウナギ、#91 リーフィーシードラゴン**の実際の分布は、原稿の「岩礁／深海」という展示分類と一致しません。個別欄に生息域を併記しました。#48・49のビーシュリンプは淡水の観賞エビとして展示を切り分けています。\n7. イソギンチャクとクマノミ以外を含む**ゲーム内の共生4組**はルールとして設計したもので、実際の共生関係だと断定しません。飾りや魚の同時展示も実際の飼育指南ではありません。なお、原稿の『サンゴ』『草』『砂』『イソ』はゲーム上の条件タグで、たとえば #9 ホヤに『サンゴ』タグが付いていても、ホヤがサンゴという意味ではありません。\n\n## 100項目の一覧\n\n進化の元は「←」、S/A等は原稿の進化条件です。出典が「参考」の場合、親や類似生物についての資料です。\n\n| No. | 名前 | ゲーム属性 | 確認と生息 | 特徴・デザイン | 資料 |\n|---:|---|---|---|---|---|\n`;
for(const sp of CATALOG){
 const parent=sp.parent?CATALOG.find(x=>x.number===sp.parent):null;const ref=parentRefs[sp.parent||sp.number],more=extraRefs[sp.number];if(!ref||!refs[ref])throw new Error('missing reference for '+sp.number);
 const c=variants[sp.number]??sp.tint??0x99b7b0;const hex='#'+c.toString(16).padStart(6,'0').toUpperCase();
 const kind=`${kinds[sp.kind]}・${sp.rarityOriginal}<br>展示：${sp.biome}／${water[sp.water]}`+(sp.kind==='environment'?`<br>条件タグ：${sp.tag}`:'')+(parent?`<br>←${parent.name}（${sp.condition.raw}）`:'');
 const statement=`${sp.status}<br>${sp.kind==='evolution'?'参考・同名生物：':'現実の参考：'}${sp.natural}<br>${sp.trivia}`;
 const design=`${special[sp.number]||names[sp.shape]||sp.feature}。${sp.feature}<br>基調色 ${hex}`;
 out+=`| ${String(sp.number).padStart(3,'0')} | ${escape(sp.name)} | ${escape(kind)} | ${escape(statement)} | ${escape(design)} | ${refLink(ref)}${more&&more!==ref?' '+refLink(more):''} |\n`;
}
out+=`\n## 参照資料\n\nリンク先の記述を確認し、総称と種、同名の別生物、ゲーム創作の区別に利用しました。すべての属・種を網羅的に同定したものではありません。閲覧不可になる場合があります。\n\n`;
for(const [n,[title,url]] of Object.entries(refs))out+=`${n}. [${title}](${url})\n`;
out+=`\n## 継続検討\n\n- #7、#12、#33、#49、#79、#81は原稿作成者への意図確認と、必要なら専門家による標本・学名の照合が望まれます。#18、#28など実在品種と名称が近い姿も同様です。\n- 全100項目のサムネイルは固有ですが、共通の体型メッシュを複数の進化形で再利用しています。水槽内には実寸比ではない3段階のサイズ差を導入しました。追加の独立造形、実際の体長比・行動・水温・餌・捕食関係を再現する場合は、別途制作と検証が必要です。\n`;
fs.writeFileSync(new URL('../SPECIES_REVIEW.md',import.meta.url),out);console.log('SPECIES_REVIEW.md generated:',CATALOG.length,'items',Object.keys(refs).length,'references');

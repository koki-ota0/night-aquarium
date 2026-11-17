// Rebuild the checked-in catalogue from the stable-ID curation table.
// GBIF confirms taxonomic names; FishBase / SeaLifeBase or institution pages
// supply species-specific ecological references. The on-screen swimming modes,
// approximate representative sizes and food groups are game-design choices.
import fs from 'node:fs';
import {classifyReferenceCm} from '../size-classes.js';
const table=fs.readFileSync('data/real-species-curation.tsv','utf8').split(/\r?\n/).filter(x=>x&&!x.startsWith('#'));
const taxonomy=JSON.parse(fs.readFileSync('data/gbif-taxonomy-2026-11-03.json','utf8'));
const references=JSON.parse(fs.readFileSync('data/species-reference-extracts-2026-11-03.json','utf8'));
const names=new Set(),ids=new Set();
const labels={fast:'速く大きく回遊',school:'群れを意識した回遊',roam:'中層を回遊',reef:'岩礁近くを小回り',hover:'ゆっくり漂う',vertical:'上下にゆっくり移動',jelly:'上下に漂い傘を動かす',bottom:'水底近くをゆっくり移動',crawl:'水底をゆっくり這う',sit:'水底で長く休む',glide:'ひれを広げて滑る',mammal:'ゆったり大きく回遊',fixed:'水底にとどまり揺れる',squid:'ひれや噴射を使い上下に泳ぐ',snake:'体をくねらせて泳ぐ',dart:'素早く小回り',surface:'水面近くを泳ぐ',burrow:'水底付近にひそむ',turtle:'ひれや足を動かし、ゆっくり泳ぐ',bottomGlide:'水底近くを滑る'};
const foodMap={p:'plankton',i:'insects',s:'seafood',a:'plants',x:'special'};
const biome={fresh:'淡水',brackish:'淡水',reef:'岩礁',coast:'外洋',sand:'砂地',deep:'深海'};
function hash(str){let h=2166136261;for(const ch of str)h=Math.imul(h^ch.charCodeAt(0),16777619);return h>>>0;}
function area(n,ref){
 const special={'Lampris guttatus':'北大西洋','Elodea densa':'南アメリカ原産','Sargassum horneri':'日本周辺','Mauremys japonica':'日本','Patiria pectinifera':'日本周辺','Octopus sinensis':'日本・東シナ海・台湾','Heliocidaris crassispina':'日本周辺',
  'Trachemys scripta':'北アメリカ原産','Hemicentrotus pulcherrimus':'日本周辺・東アジア','Tursiops truncatus':'世界各地','Phoca vitulina':'北半球','Enhydra lutris':'北太平洋',
  'Phycodurus eques':'オーストラリア南部','Mobula birostris':'世界各地','Neocaridina denticulata':'東アジア','Xiphias gladius':'世界各地','Regalecus glesne':'世界各地','Mitsukurina owstoni':'大西洋・インド洋・太平洋','Chlamydoselachus anguineus':'大西洋・インド洋・太平洋','Balaenoptera musculus':'世界各地','Delphinus delphis':'世界各地','Zostera marina':'北半球'};if(special[n])return special[n];
 const s=(ref.distribution||'').replace('| Faunafri ','').slice(0,145).toLowerCase();
 if(/ind[o-]*west pacific|indo-west pacific/.test(s))return 'インド洋〜西太平洋';
 if(/indo-pacific/.test(s))return 'インド太平洋';
 if(/south america/.test(s))return '南アメリカ';
 if(/northwest pacific/.test(s))return '北西太平洋';
 if(/north pacific|northern pacific/.test(s))return '北太平洋';
 if(/western (central )?pacific/.test(s))return '西太平洋';
 if(/north and central america/.test(s))return '北・中央アメリカ';
 if(/north america/.test(s))return '北アメリカ';
 if(/africa/.test(s)&&!/south africa/.test(s))return 'アフリカ';
 if(/asia/.test(s))return 'アジア';
 if(/circumglobal|worldwide|cosmopolitan|all oceans|circumtropical/.test(s))return '世界各地';
 if(/north atlantic/.test(s))return '北大西洋';
 if(/atlantic/.test(s))return '大西洋';
 if(/indian ocean/.test(s))return 'インド洋';
 if(/pacific/.test(s))return '太平洋';
 if(/mediterranean/.test(s))return '地中海';
 return '分布は種別資料を参照';
}
function habitat(row,ref){
 const [id,name,sci,zone]=row,ec=(ref.ecology||'').toLowerCase();
 const exceptions={'Oncorhynchus keta':'海と川を行き来し、産卵期に川へ遡上','Anguilla japonica':'成長期は川や河口、産卵は海','Toxotes jaculatrix':'河口・マングローブの汽水域、淡水にも入る','Zostera marina':'波の穏やかな浅海の砂泥底','Elodea densa':'湖沼や河川の水中','Sargassum horneri':'浅い海の岩上','Mauremys japonica':'河川・池・湿地など、水辺と陸上','Patiria pectinifera':'沿岸の岩礁や砂底','Octopus sinensis':'沿岸の砂地や岩礁','Heliocidaris crassispina':'沿岸の浅い岩場',
  'Trachemys scripta':'川や池・湿地など、水辺と陸上','Hemicentrotus pulcherrimus':'沿岸の浅い岩場','Phoca vitulina':'浅い沿岸・河口と、休息する海岸','Enhydra lutris':'浅い沿岸の岩場や海藻林','Dugong dugon':'浅い沿岸の海草藻場','Phycodurus eques':'温帯の浅い海、海藻や海草の生える岩礁','Mobula birostris':'外洋や島の周りの海','Balaenoptera musculus':'沖合の海を季節的に回遊'};
 let h=exceptions[sci];
 if(!h){if(zone==='fresh')h='川や湖沼などの淡水';else if(zone==='brackish')h='河口や汽水域';else if(/bathydemersal|bathypelagic|deep-water/.test(ec))h='深い海';else if(/reef-associated/.test(ec))h='沿岸の岩礁・サンゴ礁';else if(zone==='deep')h='深い海やその周辺';else if(zone==='sand')h='沿岸の海底付近';else if(/pelagic-oceanic/.test(ec))h='外洋';else if(/demersal|benthic/.test(ec))h='沿岸や海底付近';else if(zone==='reef')h='沿岸の岩礁・サンゴ礁';else h='海の中や沿岸';}
 return `${area(sci,ref)}：${h}${h.endsWith('など')?'':'など'}`;
}
// Correct sources where the primary extract is incomplete or misleading;
// original machine-extracted responses remain in data/species-reference-extracts.
const referenceOverrides={
 'Trachemys scripta':['https://www.digital-museum.hiroshima-u.ac.jp/~main/index.php/%E3%83%9F%E3%82%B7%E3%82%B7%E3%83%83%E3%83%94%E3%82%A2%E3%82%AB%E3%83%9F%E3%83%9F%E3%82%AC%E3%83%A1','広島大学デジタルミュージアム：アカミミガメ'],
 'Phycodurus eques':['https://www.aquariumofpacific.org/onlinelearningcenter/species/leafy_seadragon','Aquarium of the Pacific: leafy seadragon'],
 'Enhydra lutris':['https://www.montereybayaquarium.org/animals-the-ocean/animals-a-to-z/sea-otter','Monterey Bay Aquarium: sea otter'],
 'Phoca vitulina':['https://sanctuarysimon.org/dbtools/species-database/species-info-ajax.php?sID=216','NOAA SIMoN: harbor seal'],
 'Hemicentrotus pulcherrimus':['https://kotobank.jp/word/%E3%81%B0%E3%81%B5%E3%82%93%E3%81%86%E3%81%AB-3164283','日本大百科全書：バフンウニ'],
 'Tursiops truncatus':['https://greatsouthernreef.com/bottlenose-dolphin','Great Southern Reef: bottlenose dolphin'],
 'Mobula birostris':['https://www.fisheries.noaa.gov/new-england-mid-atlantic/consultations/section-7-species-presence-information-giant-manta-rays','NOAA: giant manta ray'],
 'Balaenoptera musculus':['https://www.fisheries.noaa.gov/species/blue-whale','NOAA: blue whale'],
 'Neocaridina denticulata':['https://www.lberi.jp/iframe_dir/data/neocaridina-denticulata-denticulata/index.html','琵琶湖博物館：ミナミヌマエビ'],
 'Mitsukurina owstoni':['https://fishesofaustralia.net.au/home/species/3254','Fishes of Australia: goblin shark'],
 'Portunus trituberculatus':['https://kotobank.jp/word/%E3%81%8C%E3%81%96%E3%81%BF-3148460','日本大百科全書：ガザミの甲幅'],
 'Mastigias papua':['https://kotobank.jp/word/%E3%82%BF%E3%82%B3%E3%82%AF%E3%83%A9%E3%82%B2-93163','日本大百科全書：タコクラゲの傘径'],
 'Octopus cyanea':['https://chinmi.org/knowledge/tako.html','全国珍味商工業協同組合連合会：タコの全長']
};
const measure=sh=>({freshTurtle:'甲長',seaTurtle:'甲長',manta:'体盤幅',reefManta:'体盤幅',stingray:'体盤幅',eagleRay:'体盤幅',spottedRay:'体盤幅',starfish:'直径',urchin:'殻の直径',moonJelly:'傘の直径',squid:'胴長',cuttlefish:'胴長',seahorse:'高さ'}[sh]||'体の大きさ');
const rows=table.map((line,i)=>{
 const a=line.split('|');if(a.length!==13)throw Error(`row ${i+1}: ${a.length} columns`);
 const [id,name,scientific,zone,shape,motion,size,rawCm,color,pattern,accent,feature,foodCode]=a;
 if(ids.has(id)||names.has(scientific))throw Error('duplicate id/name '+id+' '+scientific);ids.add(id);names.add(scientific);
 const t=taxonomy[scientific],ref=references[scientific];if(!t||t.status!=='ACCEPTED'||t.rank!=='SPECIES'||t.matchType!=='EXACT'||t.canonicalName!==scientific)throw Error('taxonomy '+scientific);
 if(!ref?.usable||!labels[motion]||!biome[zone])throw Error('reference/motion/zone '+scientific);
 const environment=size==='env',kind=environment?'environment':'basic';
 if(!environment&&size!==classifyReferenceCm(rawCm))throw Error(`size category does not match reference cm: ${id} ${size} ${rawCm}`);
 const food=[...foodCode].map(c=>foodMap[c]);if(!environment&&(!food.length||food.includes(undefined)))throw Error('food '+id);
 const h=hash(id)%100,rarity=environment?'common':h<49?'common':h<78?'rare':h<94?'epic':h<99?'legendary':'mythic';
 const rarityName={common:'コモン',rare:'レア',epic:'エピック',legendary:'レジェ',mythic:'ミシック'}[rarity];
 return {id,number:i+1,name,scientific,kind,biome:biome[zone],location:zone==='fresh'||zone==='brackish'?'fresh':zone==='reef'?'reef':zone==='deep'?'deep':'coast',water:zone==='fresh'?'fresh':zone==='brackish'?'brackish':'marine',rarity,rarityOriginal:rarityName,
  shape,model:shape,motion,motionLabel:labels[motion],sizeClass:environment?null:size,referenceCm:environment?null:Number(rawCm),referenceUnit:scientific==='Macrocheira kaempferi'?'脚を広げた幅':scientific==='Portunus trituberculatus'?'甲幅':scientific==='Melanocetus johnsonii'?'体長（メス）':shape==='octopus'?'全長（腕を含む）':measure(shape),food,tag:environment?(shape==='anemone'?'イソ':shape.includes('Coral')||shape==='seaFan'?'サンゴ':shape.includes('grass')||shape==='broadleaf'?'草':null):null,
  tint:parseInt(color,16),design:{pattern,accent:parseInt(accent,16)},status:'実在の種',natural:habitat(a,ref),feature:feature+'。',trivia:`水槽での動き：${labels[motion]}。`,referenceUrl:referenceOverrides[scientific]?.[0]||ref.final_url,referenceTitle:referenceOverrides[scientific]?.[1]||ref.title,taxonomyUrl:`https://www.gbif.org/species/${t.usageKey}`,sourceTaxonKey:t.usageKey,hue:0};
});
if(rows.length!==200||rows.filter(r=>r.kind==='environment').length!==10)throw Error('catalogue must contain 200, including 10 environment species');
fs.writeFileSync('data/real-catalog-data.json',JSON.stringify(rows,null,2)+'\n');
console.log(`built ${rows.length} species; ${ids.size} stable IDs; ${names.size} GBIF accepted species`);

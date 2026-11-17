"""Individually researched second batch; strictly offline staging, not active."""
import json
from pathlib import Path
P=Path(__file__).resolve().parents[1]
evidence={r['scientific']:r for r in json.loads((P/'data/expansion-216/evidence.json').read_text())}
# Habitat, scientific name, Japanese common/transliterated name, body, motion,
# published maximum and measurement type, food, colour, markings, accent,
# range, field observation, sourced biological detail. All 23 still need art review.
S=[
('deep','Bathylagus antarcticus','アンタークティック・ディープシースメルト','deepfish','roam',19,'標準体長',['plankton'],0x778994,'counter',0xb9c7c4,'南極海の深海','細長い体で深い海の中層に暮らす。','食性調査ではオキアミ類が餌の大きな割合を占めた。'),
('deep','Acanthonus armatus','アカントヌス・アルマトゥス','deepfish','hover',37.5,'標準体長',['seafood'],0x7d7770,'none',0xb5a59a,'世界の熱帯〜亜熱帯の深海','深海底に近い水中に生息する。','水深1171〜4415mで記録されている。'),
('deep','Alepisaurus ferox','ミズウオ','deepfish','hover',215,'全長',['seafood'],0x647e87,'counter',0xb5c9c4,'世界の熱帯〜温帯の沖合','細長い体に大きな背びれをもつ。','深海から表層まで広い深さで記録されている。'),
('deep','Caristius macropus','カリスティウス・マクロプス','disc','hover',32,'全長',['seafood'],0x4a535d,'none',0x8899a0,'温帯の深い海','深い海の中層を泳ぐ。','水深200〜1450mで記録されている。'),
('lake','Lamprologus speciosus','ランプロログス・スペキオスス','cichlid','bottomGlide',5,'全長',['insects'],0x9d9e8d,'none',0x514f4a,'タンガニーカ湖の南西部','砂底の貝殻を隠れ場所にする。','空の巻貝の殻を産卵や子育てにも使う。'),
('lake','Tropheus duboisi','トロフェウス・ドゥボイシー','cichlid','roam',12,'全長',['plants'],0x293c4d,'bands1',0xeeeece,'タンガニーカ湖の北部','岩場についた藻類を食べる。','雌は口の中で卵や子を守る。'),
('lake','Petrochromis trewavasae','ペトロクロミス・トレワヴァサエ','cichlid','roam',18,'全長',['plants'],0x535f54,'dots',0xc4d4bf,'タンガニーカ湖','浅い岩場で藻類を削り取って食べる。','岩についた生物の層をついばむ。'),
('lake','Cyphotilapia frontosa','フロントーサ','cichlid','roam',33,'全長',['seafood'],0x9bafbd,'bands4',0x283950,'タンガニーカ湖','岩場付近で集まって暮らす。','巻貝や二枚貝、小魚などを食べる。'),
('lake','Aulonocara jacobfreibergi','アウロノカラ・ヤコブフライベルギ','cichlid','roam',15,'全長',['seafood'],0x506e9e,'bands4',0x313e60,'マラウイ湖','岩場や洞穴のある場所に生息する。','湖の岩場に暮らすシクリッドの一種。'),
('lake','Melanochromis auratus','メラノクロミス・アウラトゥス','cichlid','roam',11,'全長',['plants'],0xd4b84b,'twin',0x413c39,'マラウイ湖','岩場で藻類などをついばむ。','雌と雄で体色の傾向が異なる。'),
('estuary-tropical','Butis butis','クレイジーフィッシュ','goby','hover',15,'全長',['seafood'],0x716e61,'mottled',0x393b37,'インド洋〜西太平洋の河口','マングローブの水中で獲物を待つ。','水中の物に沿って逆さまになることもある。'),
('estuary-tropical','Scatophagus argus','クロホシマンジュウダイ','disc','roam',45,'全長',['plants','seafood'],0xa3ae8d,'spots',0x41483d,'インド太平洋の河口・沿岸','体側に暗色の丸い斑点がある。','河口やマングローブ周辺で植物や小動物を食べる。'),
('estuary-tropical','Gerres filamentosus','イトヒキサギ','grouper','bottomGlide',39,'全長',['seafood'],0xa5b5ac,'spots',0x62736b,'インド西太平洋の沿岸・河口','砂や泥の底の近くで餌を探す。','沿岸の浅場や河口に生息する。'),
('estuary-tropical','Sillago sihama','モトギス','wrasse','bottomGlide',31,'標準体長',['seafood'],0xb5b7a1,'counter',0xd4cdb5,'インド西太平洋の砂浜・河口','砂底の近くを泳いで小動物を探す。','砂浜やマングローブの水路にも生息する。'),
('estuary-tropical','Pseudomugil signifer','パシフィック・ブルーアイ','medaka','school',7,'標準体長',['plankton'],0xaabcc1,'none',0x6d9eae,'オーストラリア東部の河口・川','小さな群れで水中を泳ぐ。','淡水の流れから汽水の河口まで見られる。'),
('estuary-north','Acanthopagrus australis','イエローフィン・ブリーム','grouper','roam',66,'標準体長',['seafood'],0x9caaa0,'counter',0xb9b298,'オーストラリア東部の温帯沿岸','河口や沿岸の岩場を泳ぐ。','汽水の河口から沿岸の湾まで生息する。'),
('estuary-north','Alosa maeotica','ブラックシー・シャッド','salmon','school',33.2,'全長',['plankton','seafood'],0x95aeb4,'counter',0xc6d3cc,'黒海とアゾフ海の沿岸','河口や沿岸で群れをつくる。','低水温にも耐え、汽水の潟に入る。'),
('estuary-north','Osmerus mordax','レインボー・スメルト','salmon','school',35.6,'全長',['plankton','seafood'],0xa3b8ae,'counter',0xd0d9c9,'北アメリカ北部の湖・沿岸','冷たい水の中を群れて泳ぐ。','海から川へ移動する個体群と湖で暮らす個体群がある。'),
('cold-sea','Lamna ditropis','ネズミザメ','shark','fast',305,'全長',['seafood'],0x617c89,'counter',0xc5d5d0,'北太平洋の寒帯〜冷温帯','流線形の体で冷たい海を回遊する。','沿岸から沖合まで広く移動する。'),
('warm-sea','Alopias pelagicus','ニタリ','shark','roam',428,'全長',['seafood'],0x6b8290,'counter',0xd3dad4,'インド太平洋の熱帯〜亜熱帯','長い尾びれの上葉が特徴。','尾を振って魚の群れをたたき、獲物を捕らえる。'),
('warm-sea','Thunnus atlanticus','ブラックフィン・ツナ','tuna','fast',108,'尾叉長',['seafood'],0x627d8a,'counter',0xc4cfbf,'西大西洋の暖かい海','外洋や沖合を群れて泳ぐ。','カツオなどと混じった大きな群れをつくることがある。'),
('warm-sea','Euthynnus lineatus','ブラック・スキップジャック','tuna','fast',84,'尾叉長',['seafood'],0x617d8a,'skipjackBack',0xc8d0c0,'東部太平洋の暖かい海','温かい海を群れて泳ぐ。','表層水温が低い海域ではあまり見られない。'),
('warm-sea','Exocoetus monocirrhus','バーベル・フライングフィッシュ','flyingFish','surface',20,'標準体長',['plankton'],0x7999aa,'counter',0xcdd7d1,'インド太平洋の熱帯〜亜熱帯','大きな胸びれを広げる。','水面から飛び出して滑空することがある。'),
]
base=json.loads((P/'data/real-catalog-data.json').read_text());first=json.loads((P/'data/expansion-216/curated-provisional.json').read_text()); used={x['scientific'] for x in base+first};rows=[]
for i,(hab,sci,name,shape,motion,cm,unit,food,tint,pattern,accent,natural,feature,trivia) in enumerate(S,11):
 e=evidence[sci];t=e['taxonomy'];assert sci not in used and e['identityInPage'] and (t['canonicalName'],t['status'],t['rank'],t['matchType'])==(sci,'ACCEPTED','SPECIES','EXACT'),sci;used.add(sci)
 water='fresh' if hab=='lake' else 'brackish' if hab.startswith('estuary-') else 'marine'; biome={'lake':'淡水','estuary-north':'淡水','estuary-tropical':'淡水','cold-sea':'外洋','warm-sea':'外洋','deep':'深海'}[hab]; room=('large-'+hab if hab in ('cold-sea','warm-sea') and cm>=300 else hab)
 size='small' if cm<30 else 'medium' if cm<100 else 'large' if cm<300 else 'giant' if cm<800 else 'colossal'
 rows.append(dict(id=f'exp_216_{i:03}',number=200+i,name=name,scientific=sci,kind='basic',biome=biome,location=hab,water=water,rarity='rare',rarityOriginal='レア',shape=shape,model=shape,motion=motion,motionLabel={'hover':'ゆっくり漂う','bottomGlide':'水底付近を泳ぐ','roam':'ゆっくり泳ぐ','school':'群れるように泳ぐ','surface':'水面近くを泳ぐ','fast':'速く回遊する'}[motion],sizeClass=size,referenceCm=cm,referenceUnit=unit,food=food,tag=None,tint=tint,design={'pattern':pattern,'accent':accent},status='実在の種',natural=natural,feature=feature,trivia=trivia,referenceUrl=e['referenceUrl'],referenceTitle=sci,taxonomyUrl=f"https://www.gbif.org/species/{t['usageKey']}",sourceTaxonKey=t['usageKey'],hue=0,candidateRooms=[room],nameReferenceUrl=None,reviewStatus='provisional'))
out=P/'data/expansion-216/curated-second-provisional.json';out.write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n');print(f'{len(rows)} individual candidates staged; not active in preview')

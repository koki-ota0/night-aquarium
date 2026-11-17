"""Individually sourced 2.17 candidates; original species IDs never reassigned."""
import json
from pathlib import Path
P=Path(__file__).resolve().parents[1]; ev={x['scientific']:x for x in json.loads((P/'data/expansion-216/evidence.json').read_text())}
S=[
('deep','Lophius vomerinus','ケープ・モンクフィッシュ','angler','sit',100,'全長',['seafood'],0x776658,'none',0xaca28a,'アフリカ南部の沖合','平たい頭と大きな口をもち、海底で待ち伏せる。','大陸棚の深い場所や斜面にすみ、底近くの魚を食べる。','https://www.nisc.co.za/products/abstracts/14803/journals/the-biology-and-distribution-of-the-monkfish-lophius-vomerinus-off-south-africa'),
('deep','Lophiodes mutilus','メダマアンコウ','angler','sit',45,'全長',['seafood'],0x695d55,'none',0x9c8b77,'インド洋〜西太平洋の深い海','平たい頭と誘引用の突起をもつ。','大陸棚の外側や斜面の海底に暮らす。','https://australian.museum/learn/animals/fishes/smooth-goosefish-lophiodes-mutilus-alcock-1893/'),
('deep','Stomias boa','ボア・ドラゴンフィッシュ','deepfish','vertical',32.2,'標準体長',['seafood'],0x485f68,'none',0x90babc,'大西洋などの温帯〜熱帯の深海','細長い体と、先端が光るあごひげが特徴。','夜に浅い層へ移動する個体もいる。','https://ocean.si.edu/ocean-life/fish/scaly-dragonfish'),
('deep','Parabrotula tanseimaru','パラブロトゥラ・タンセイマル','eel','hover',5,'標準体長',['plankton'],0x655b57,'none',0x93847b,'日本近海の深海','小さく細長い体で深い水中を漂う。','相模湾で記録され、主にカイアシ類を食べる。','https://www.fishbase.se/summary/Parabrotula-tanseimaru.html'),
('estuary-tropical','Hemitrygon fluviorum','エスチュアリー・スティングレイ','stingray','bottomGlide',130,'全長',['seafood'],0x8c8062,'none',0xc0ad87,'オーストラリア東部の河口','ひし形の体盤と長い尾をもつエイ。','マングローブや干潟で貝やカニなどを探す。','https://fishesofaustralia.net.au/home/species/3525'),
('estuary-tropical','Ambassis marianus','エスチュアリー・グラスフィッシュ','cichlid','school',10,'標準体長',['insects','plankton'],0xb8c7c0,'none',0x879c9d,'オーストラリア東部の河口','銀色がかった透明感のある小さな魚。','マングローブの根や水草の間で群れる。','https://www.fishbase.se/Summary/SpeciesSummary.php?ID=15129'),
('estuary-tropical','Sarotherodon melanotheron','ブラックチン・ティラピア','cichlid','school',28,'標準体長',['plants','plankton'],0xa5aa93,'none',0x3f4c46,'西アフリカの河口・潟','あごの下が暗い色になる個体がいる。','マングローブにすみ、雄が口の中で卵を守る。','https://www.fishbase.org.au/v4/summary/1412'),
('estuary-north','Girella tricuspidata','ルデリック','grouper','school',71,'尾叉長',['plants'],0x637461,'bands5',0x475448,'オーストラリア東部の温帯沿岸','暗い縦帯のある体で群れをつくる。','河口の海草や藻類を主に食べる。','https://www.dpird.nsw.gov.au/content/fisheries/recreational/saltwater/sw-species/luderick'),
('estuary-north','Cottus asper','プリックリー・スカルピン','goby','bottom',30,'全長',['insects','seafood'],0x766f5f,'mottled',0x454a3d,'北アメリカ西岸の川・河口','大きな頭と扇形の胸びれをもつ底生魚。','沿岸の個体群には汽水の河口に入るものもいる。','https://seagrant.oregonstate.edu/WRF/native-fishes/sculpin/prickly-sculpin'),
('estuary-north','Platichthys flesus','ヨーロッパ・フラウンダー','flatfish','bottomGlide',60,'全長',['seafood'],0x8d876b,'mottled',0xb09975,'ヨーロッパの沿岸・河口','平たい体で砂や泥の底に身を寄せる。','一年の多くを河口で過ごし、淡水にも入る。','https://www.fishbase.se/summary/Platichthys-flesus'),
]
active=[]
for name in ['data/real-catalog-data.json','data/expansion-216/curated-provisional.json','data/expansion-216/reviewed-second.json']:active+=json.loads((P/name).read_text())
used={r['scientific'] for r in active};rows=[]
for i,(hab,sci,name,shape,motion,cm,unit,food,tint,pat,accent,natural,feature,trivia,source) in enumerate(S,1):
 e=ev[sci];t=e['taxonomy'];assert sci not in used and e['identityInPage'] and (t['canonicalName'],t['status'],t['rank'],t['matchType'])==(sci,'ACCEPTED','SPECIES','EXACT'),sci;used.add(sci)
 water='marine' if hab=='deep' else 'brackish'; biome='深海' if hab=='deep' else '淡水';size='small' if cm<30 else 'medium' if cm<100 else 'large' if cm<300 else 'giant' if cm<800 else 'colossal';labels={'sit':'水底でじっと待つ','bottom':'水底近くで過ごす','bottomGlide':'水底付近を泳ぐ','school':'群れるように泳ぐ','hover':'ゆっくり漂う','vertical':'上下に移動する'}
 rows.append(dict(id=f'exp_217_{i:03}',number=231+i,name=name,scientific=sci,kind='basic',biome=biome,location=hab,water=water,rarity='rare',rarityOriginal='レア',shape=shape,model=shape,motion=motion,motionLabel=labels[motion],sizeClass=size,referenceCm=cm,referenceUnit=unit,food=food,tag=None,tint=tint,design={'pattern':pat,'accent':accent},status='実在の種',natural=natural,feature=feature,trivia=trivia,referenceUrl=e['referenceUrl'],referenceTitle=sci,taxonomyUrl=f"https://www.gbif.org/species/{t['usageKey']}",sourceTaxonKey=t['usageKey'],hue=0,candidateRooms=[hab],reviewSource=source,reviewStatus='game-reviewed'))
(P/'data/expansion-216/curated-217.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n'); print('Prepared 10 additional species')

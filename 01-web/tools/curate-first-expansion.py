"""Ten explicitly curated candidates for 2.16. Not activated in the public catalogue."""
import json
from pathlib import Path
root=Path(__file__).resolve().parents[1]
evidence={r['scientific']:r for r in json.loads((root/'data/expansion-216/evidence.json').read_text())}
# Scientific name, display name (standard Japanese where supported; otherwise
# a transliteration/common name), habitat, body, movement, cm, unit, food,
# palette, pattern, accent, scientifically grounded distribution and fact.
S=[
('Gigantura indica','コガシラボウエンギョ','deep','deepfish','hover',26,'全長',['seafood'],0x829fa4,'counter',0xc3d6d0,'熱帯〜亜熱帯の深海','筒状の眼を前に向ける。','通常、水深500〜2000mの深海に生息する。','https://www.godac.jamstec.go.jp/bismal/j/view/9016978'),
('Ceratias holboelli','ビワアンコウ','deep','angler','hover',120,'雌の全長',['seafood'],0x4d5051,'mottled',0x786b5a,'世界の熱帯〜温帯の深海','頭上に誘引用の突起をもつ。','雌は大きく、雄と雌で体の大きさが大きく異なる。','https://www.godac.jamstec.go.jp/bismal/j/view/9002949'),
('Caulophryne jordani','ジョルダンヒレナガチョウチンアンコウ','deep','angler','hover',20,'雌の全長',['seafood'],0x5d504d,'none',0xb2a594,'世界の深海','長く伸びたひれの軟条が特徴。','深海の水深100〜1510mで記録されている。','https://rium-data.com/taxa/detail/39132'),
('Mylochromis spilostichus','ミロクロミス・スピロスティクス','lake','cichlid','bottomGlide',22.2,'全長',['seafood'],0x8c9ba9,'spots',0x495968,'アフリカのマラウイ湖','砂底の近くで小魚を追う。','マラウイ湖に固有のシクリッド。',None),
('Copadichromis trewavasae','コパディクロミス・トレワヴァサエ','lake','cichlid','roam',10.5,'標準体長',['plankton'],0x6090a1,'spots',0x283b50,'アフリカのマラウイ湖','体側に3つの斑点がある。','湖の砂と岩の境界に生息する。',None),
('Selenotoca multifasciata','スポットバンド・スキャット','estuary-tropical','disc','school',40,'標準体長',['plants','seafood'],0xb3c2b7,'bands4',0x43504a,'インド西太平洋の熱帯河口','銀色の体に暗色の帯や斑点がある。','マングローブの水路や河口に生息する。',None),
('Toxotes chatareus','スポッテッド・アーチャーフィッシュ','estuary-tropical','archer','surface',40,'標準体長',['insects','seafood'],0xb9c7b5,'spots',0x3d4c42,'インド〜オーストラリア北部','水を吹きかけて水面上の獲物を落とす。','マングローブの汽水域から淡水の川にも入る。',None),
('Osmerus eperlanus','ヨーロピアン・スメルト','estuary-north','salmon','school',45,'全長',['plankton','seafood'],0x9eb5af,'counter',0xd6e2d4,'ヨーロッパ北部の沿岸・河口・湖','沿岸や湖の中層を群れで泳ぐ。','海と川を行き来する個体群と、湖に定着する個体群がある。',None),
('Paralichthys dentatus','ナツビラメ','estuary-north','flatfish','bottomGlide',94,'全長',['seafood'],0x817a69,'ocelli',0xbcae8c,'北西大西洋の沿岸・河口','平たい体で砂底に身をひそめる。','河口の砂底や海草帯などに生息する。',None),
('Thunnus alalunga','ビンナガ','cold-sea','tuna','fast',120,'全長',['seafood'],0x668c9b,'counter',0xd7d5bf,'世界の温帯〜熱帯の外洋','胸びれが長く、流線形の体をもつ。','大きな群れを作り、海を広く回遊する。','https://www.fisheries.noaa.gov/species/pacific-albacore-tuna')
]
rows=[]
for i,(sci,name,hab,shape,motion,cm,unit,food,tint,pattern,accent,natural,feature,trivia,name_ref) in enumerate(S,1):
 e=evidence[sci];t=e['taxonomy'];assert (t['canonicalName'],t['status'],t['rank'],t['matchType'])==(sci,'ACCEPTED','SPECIES','EXACT'),sci
 water='fresh' if hab=='lake' else 'brackish' if hab.startswith('estuary-') else 'marine'
 biome={'lake':'淡水','estuary-north':'淡水','estuary-tropical':'淡水','cold-sea':'外洋','deep':'深海'}[hab]
 size='small' if cm<30 else 'medium' if cm<100 else 'large' if cm<300 else 'giant' if cm<800 else 'colossal'
 row=dict(id=f'exp_216_{i:03}',number=200+i,name=name,scientific=sci,kind='basic',biome=biome,location=hab,water=water,rarity='rare',rarityOriginal='レア',shape=shape,model=shape,motion=motion,motionLabel={'hover':'ゆっくり漂う','bottomGlide':'水底付近を泳ぐ','roam':'ゆっくり泳ぐ','school':'群れるように泳ぐ','surface':'水面近くを泳ぐ','fast':'速く回遊する'}[motion],sizeClass=size,referenceCm=cm,referenceUnit=unit,food=food,tag=None,tint=tint,design={'pattern':pattern,'accent':accent},status='実在の種',natural=natural,feature=feature,trivia=trivia,referenceUrl=e['referenceUrl'],referenceTitle=sci,taxonomyUrl=f"https://www.gbif.org/species/{t['usageKey']}",sourceTaxonKey=t['usageKey'],hue=0,candidateRooms=[hab],nameReferenceUrl=name_ref,reviewStatus='provisional')
 rows.append(row)
out=root/'data/expansion-216/curated-provisional.json';out.write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n');print('staged',len(rows),'curated candidates, not published')

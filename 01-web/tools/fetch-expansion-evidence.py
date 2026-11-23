"""Gather candidate source excerpts, not an approval or game catalogue generator."""
import concurrent.futures, json, re, time
from pathlib import Path
from urllib.parse import quote
import requests
from bs4 import BeautifulSoup
root=Path(__file__).resolve().parents[1]
entries=[x.split('\t') for x in (root/'data/expansion-216/candidates.tsv').read_text().splitlines() if x.strip()]
def section(text,start,end):
 a=text.find(start)
 if a<0:return ''
 b=text.find(end,a+len(start));return text[a:b if b>=0 else a+700][:1100]
def get(item):
 habitat,name=item; slug=name.replace(' ','-'); url='https://www.fishbase.se/summary/'+quote(slug)+'.html'; out={'candidate_habitat':habitat,'scientific':name,'referenceUrl':url,'reviewed':False}
 try:
  gb=requests.get('https://api.gbif.org/v1/species/match',params={'name':name},timeout=30);gb.raise_for_status();j=gb.json();out['taxonomy']={k:j.get(k) for k in ['usageKey','canonicalName','status','rank','matchType','confidence']}
 except Exception as e:out['taxonomyError']=str(e)
 try:
  r=requests.get(url,timeout=35);r.raise_for_status();txt=BeautifulSoup(r.text,'html.parser').get_text(' ',strip=True);out['actualUrl']=r.url
  out['environment']=section(txt,'Environment: milieu','Distribution Territories')
  out['size']=section(txt,'Max length','Short description')[:350]
  out['biology']=section(txt,'Biology Glossary','Life cycle and mating behavior')
  out['identityInPage']=name.lower() in txt[:3000].lower()
 except Exception as e:out['referenceError']=str(e)
 return out
cachefile=root/'data/expansion-216/evidence.json'
cache={x['scientific']:x for x in json.loads(cachefile.read_text())} if cachefile.exists() else {}
missing=[x for x in entries if x[1] not in cache]
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool: fresh=list(pool.map(get,missing))
cache.update({x['scientific']:x for x in fresh});results=[cache[x[1]] for x in entries]
(root/'data/expansion-216/evidence.json').write_text(json.dumps(results,ensure_ascii=False,indent=2)+'\n')
print('candidates:',len(results),'exact accepted species:',sum(x.get('taxonomy',{}).get('matchType')=='EXACT' and x.get('taxonomy',{}).get('status')=='ACCEPTED' and x.get('taxonomy',{}).get('rank')=='SPECIES' for x in results),'fishbase sections:',sum(bool(x.get('environment')) for x in results))
for x in results:
 if not x.get('environment') or x.get('taxonomy',{}).get('status')!='ACCEPTED' or not x.get('identityInPage'):print('REVIEW',x['scientific'],x.get('taxonomy'),x.get('referenceError'),x.get('identityInPage'))

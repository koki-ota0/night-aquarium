// Optional single-user workspace preview server. The standalone HTML still
// runs offline without this service. Never place its private data in a ZIP.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {prepareImport,MAX_IMPORT_BYTES} from './save-transfer.js';

const ROOT=path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR=path.resolve(process.env.YORU_PREVIEW_DATA_DIR||path.join(ROOT,'preview-data'));
const SAVE=path.join(DATA_DIR,'current.json'),PREVIOUS=path.join(DATA_DIR,'previous.json');
const port=Number(process.env.PORT||3000),host=process.env.HOST||'0.0.0.0';
const API='/__yoru/preview-save';
const map=new Map([
 ['/','index.html'],['/index.html','index.html'],['/yoru-no-suizokukan.html','yoru-no-suizokukan.html'],
 ['/sw.js','sw.js'],['/manifest.webmanifest','manifest.webmanifest'],['/DESIGN_GALLERY.html','DESIGN_GALLERY.html'],
 ['/assets/icon-192.png','assets/icon-192.png'],['/assets/icon-512.png','assets/icon-512.png']
]);
function send(res,status,body){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store, private','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(body));}
function readRecord(){
 let raw;try{raw=fs.readFileSync(SAVE,'utf8');}catch(e){if(e.code==='ENOENT')return null;throw e;}
 const record=JSON.parse(raw),checked=prepareImport(record?.state);
 if(!Number.isSafeInteger(record?.revision)||record.revision<1||!Number.isFinite(record.savedAt)||!checked.ok)throw Error('Protected unreadable preview backup');
 return {revision:record.revision,savedAt:record.savedAt,state:checked.state};
}
function atomicWrite(file,text){
 fs.mkdirSync(DATA_DIR,{recursive:true,mode:0o700});
 const temp=path.join(DATA_DIR,`.tmp-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}`);
 let fd;try{fd=fs.openSync(temp,'wx',0o600);fs.writeFileSync(fd,text,'utf8');fs.fsyncSync(fd);fs.closeSync(fd);fd=undefined;fs.renameSync(temp,file);}finally{if(fd!==undefined)fs.closeSync(fd);try{fs.unlinkSync(temp);}catch{}}
}
function applySave(res,body){
 // POST reads avoid older service workers that cached every GET, including API data.
 if(body?.op==='read'){try{const r=readRecord();return send(res,200,r?{exists:true,...r}:{exists:false,revision:0});}catch{return send(res,503,{error:'protected-backup'});}}
 if(!body||!Number.isSafeInteger(body.baseRevision)||body.baseRevision<0)return send(res,400,{error:'invalid-revision'});
 const checked=prepareImport(body.state);if(!checked.ok)return send(res,400,{error:'invalid-save'});
 let current;try{current=readRecord();}catch{return send(res,503,{error:'protected-backup'});}
 const revision=current?.revision||0;
 if(body.baseRevision!==revision)return send(res,409,{exists:!!current,...(current||{revision:0})});
 const next={revision:revision+1,savedAt:Date.now(),state:checked.state};
 try{
  // Keep the actual previous version before replacing current. If anything
  // fails, current.json remains untouched and the client keeps its local save.
  if(current)atomicWrite(PREVIOUS,JSON.stringify(current));
  atomicWrite(SAVE,JSON.stringify(next));
 }catch(e){console.error('Preview save failed:',e.message);return send(res,503,{error:'write-failed'});}
 return send(res,200,{exists:true,revision:next.revision,savedAt:next.savedAt});
}
const server=http.createServer((req,res)=>{
 const pathname=new URL(req.url,'http://preview.invalid').pathname;
 if(pathname===API){
  // Non-simple header + no CORS prevents another site from issuing an API
  // request via a browser. The preview link itself remains private: don't share it.
  if(req.headers['x-yoru-preview']!=='1')return send(res,403,{error:'preview-only'});
  if(req.method==='GET'){
   try{const r=readRecord();return send(res,200,r?{exists:true,...r}:{exists:false,revision:0});}catch{return send(res,503,{error:'protected-backup'});}
  }
  if(req.method!=='POST'||!String(req.headers['content-type']||'').toLowerCase().startsWith('application/json'))return send(res,405,{error:'method'});
  let total=0,parts=[],done=false;
  req.on('data',chunk=>{if(done)return;total+=chunk.length;if(total>MAX_IMPORT_BYTES){done=true;parts=[];send(res,413,{error:'too-large'});return;}parts.push(chunk);});
  req.on('end',()=>{if(done)return;try{applySave(res,JSON.parse(Buffer.concat(parts).toString('utf8')));}catch{return send(res,400,{error:'invalid-json'});}});
  req.on('error',()=>{if(!res.headersSent)send(res,400,{error:'read-failed'});});return;
 }
 if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405).end();return;}
 const relative=map.get(pathname);if(!relative){res.writeHead(404,{'Cache-Control':'no-store'}).end('Not found');return;}
 const types={'.js':'text/javascript; charset=utf-8','.html':'text/html; charset=utf-8','.png':'image/png','.webmanifest':'application/manifest+json; charset=utf-8'};
 try{
  // Both generated HTML aliases have identical bytes. The standalone copy is
  // a safe fallback if an environment keeps only one of the generated files.
  const preferred=path.join(ROOT,relative),source=relative==='index.html'&&!fs.existsSync(preferred)?path.join(ROOT,'yoru-no-suizokukan.html'):preferred;
  const data=fs.readFileSync(source);res.writeHead(200,{'Content-Type':types[path.extname(relative)]||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(req.method==='HEAD'?undefined:data);
 }catch{res.writeHead(503,{'Cache-Control':'no-store'}).end('File not available');}
});
server.listen(port,host,()=>console.log(`Yoru preview listening on ${host}:${port}; private workspace backup: ${DATA_DIR}`));

import test from 'node:test';import assert from 'node:assert/strict';
import * as E from '../../engine.js';import {withRecovery} from '../../save-transfer.js';import {PreviewBackup,PREVIEW_META_KEY} from '../../preview-backup.js';
const now=1700000000000;
function storage(){const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),get:k=>m.get(k)};}
function response(body,status=200){return new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json'}});}
function server(){let record=null,offline=false;return {
 setOffline(x){offline=x;},get:()=>structuredClone(record),
 async fetch(_url,opts){if(offline)throw Error('offline');const body=JSON.parse(opts.body);if(body.op==='read')return response(record?{exists:true,...record}:{exists:false,revision:0});
  const rev=record?.revision||0;if(body.baseRevision!==rev)return response(record?{exists:true,...record}:{exists:false,revision:0},409);
  record={revision:rev+1,savedAt:now+rev,state:structuredClone(body.state)};return response({exists:true,revision:record.revision,savedAt:record.savedAt});}
 };}
function client(srv,initial,hasInitial=true){
 let state=initial,had=hasInitial;const ls=storage(),b=new PreviewBackup({getState:()=>state,hasLocal:()=>had,blocked:()=>false,storage:ls,fetcher:srv.fetch.bind(srv),replaceState:(incoming,opts)=>{state=opts.preserveCurrent?withRecovery(incoming,state):structuredClone(incoming);had=true;return true;}});
 return {b,ls,get:()=>state,set:s=>{state=s;had=true;b.changed();},stop:()=>clearTimeout(b.timer)};
}
function fish(name,id='real_170'){const s=E.createInitial(now);s.started=true;E.discover(s,id,'test',now,()=>.4);s.pending=[];s.fish_instances[0].nickname=name;return s;}

test('preview backup restores new origins and pauses safely when offline edits conflict with a newer backup',async()=>{
 const srv=server(),a=client(srv,fish('元の子'));await a.b.connect();await a.b.flush();assert.equal(srv.get().state.fish_instances[0].nickname,'元の子');
 const b=client(srv,E.createInitial(now),false);await b.b.connect();assert.equal(b.get().fish_instances[0].nickname,'元の子');assert.equal(b.b.revision,1);
 srv.setOffline(true);const offline=b.get();offline.fish_instances[0].nickname='オフラインの子';b.set(offline);await b.b.flush();assert.equal(b.b.status,'offline');assert.equal(JSON.parse(b.ls.get(PREVIEW_META_KEY)).dirty,true);
 srv.setOffline(false);const online=a.get();online.fish_instances[0].nickname='別の端末の子';a.set(online);await a.b.flush();assert.equal(srv.get().revision,2);
 await b.b.connect();assert.equal(b.b.status,'conflict');assert.equal(b.get().fish_instances[0].nickname,'オフラインの子');assert.equal(srv.get().state.fish_instances[0].nickname,'別の端末の子');
 assert.equal(b.b.chooseRemote(),true);assert.equal(b.get().fish_instances[0].nickname,'別の端末の子');assert.equal(b.get().importRecovery.original.fish_instances[0].nickname,'オフラインの子');
 a.stop();b.stop();
});

test('CAS conflict after another client writes never overwrites either state',async()=>{
 const srv=server(),a=client(srv,fish('最初'));await a.b.connect();await a.b.flush();const b=client(srv,E.createInitial(now),false);await b.b.connect();
 const first=a.get();first.fish_instances[0].nickname='先に更新';a.set(first);await a.b.flush();
 const second=b.get();second.fish_instances[0].nickname='あとから更新';b.set(second);await b.b.flush();assert.equal(b.b.status,'conflict');assert.equal(srv.get().state.fish_instances[0].nickname,'先に更新');assert.equal(b.get().fish_instances[0].nickname,'あとから更新');
 assert.equal(b.b.chooseLocal(),true);await b.b.flush();assert.equal(srv.get().state.fish_instances[0].nickname,'あとから更新');a.stop();b.stop();
});

test('writes that happen during a network request are sent in a subsequent revision',async()=>{
 const srv=server(),c=client(srv,fish('一回目'));await c.b.connect();let release;const original=c.b.fetcher;
 c.b.fetcher=async(url,opts)=>{const body=JSON.parse(opts.body);if(body.op!=='read'&&!release)await new Promise(r=>release=r);return original(url,opts);};
 const pending=c.b.flush();await Promise.resolve();const next=c.get();next.fish_instances[0].nickname='二回目';c.set(next);release();await pending;assert.equal(c.b.dirty,true);await c.b.flush();assert.equal(srv.get().state.fish_instances[0].nickname,'二回目');assert.equal(srv.get().revision,2);c.stop();
});

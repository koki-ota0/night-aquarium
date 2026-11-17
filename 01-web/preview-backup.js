// Optional, revision-checked backup for our single-user workspace preview.
// No endpoint means ordinary local/offline HTML; conflicting saves are never
// overwritten automatically. The separate metadata key is not game progress.
import {prepareImport,portableState} from './save-transfer.js';

export const PREVIEW_META_KEY='yoru_preview_backup_meta_v1';
const HEADER={'X-Yoru-Preview':'1'};
export class PreviewBackup{
 constructor({getState,replaceState,hasLocal,blocked,storage,fetcher,onChange,enabled=true}){
  this.getState=getState;this.replaceState=replaceState;this.hasLocal=hasLocal;this.blocked=blocked;this.storage=storage;this.fetcher=fetcher;this.onChange=onChange||(()=>{});this.enabled=enabled;
  this.status=enabled?'checking':'local';this.revision=null;this.remote=null;this.savedAt=null;this.dirty=false;this.seq=0;this.timer=null;this.busy=false;this.connecting=false;
  try{const m=JSON.parse(storage.getItem(PREVIEW_META_KEY)||'null');this.meta=Number.isSafeInteger(m?.revision)&&m.revision>=0?{revision:m.revision,dirty:!!m.dirty}:null;}catch{this.meta=null;}
 }
 emit(){this.onChange(this);}
 writeMeta(revision,dirty){this.meta={revision,dirty:!!dirty};try{this.storage.setItem(PREVIEW_META_KEY,JSON.stringify(this.meta));}catch{}}
 label(){
  if(this.status==='checking')return 'プレビューのバックアップを確認中…';
  if(this.status==='ready')return this.dirty||this.busy?'この端末に保存済み。プレビューにもバックアップ中…':this.revision===0?'操作を始めると自動保存します':'この端末とプレビューに自動保存済み';
  if(this.status==='conflict')return '端末とプレビューに異なるセーブがあります。選択するまで上書きしません。';
  if(this.status==='offline')return 'プレビューに接続できません。この端末に保存し、接続後に再確認します。';
  if(this.status==='blocked')return '既存データを保護するため、自動バックアップを停止しています。';
  return 'この端末に保存中。別のURLや端末への移行はセーブを書き出してください。';
 }
 async request(options={}){
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),3500);
  try{return await this.fetcher('./__yoru/preview-save',{...options,headers:{...HEADER,...options.headers},cache:'no-store',signal:controller.signal});}finally{clearTimeout(timeout);}
 }
 validateRemote(body){
  if(!body||body.exists!==true||!Number.isSafeInteger(body.revision)||body.revision<1||!Number.isFinite(body.savedAt))return null;
  const parsed=prepareImport(body.state);return parsed.ok?{revision:body.revision,savedAt:body.savedAt,state:parsed.state}:null;
 }
 async connect(){
  if(!this.enabled||this.connecting||this.busy)return;
  if(this.blocked()){this.status='blocked';this.emit();return;}
  this.connecting=true;this.status='checking';this.emit();
  try{
   const response=await this.request({method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({op:'read'})});
   if([404,405,501].includes(response.status)){this.status='local';this.emit();return;}
   if(!response.ok)throw Error('backup unavailable');
   const body=await response.json();
   if(body?.exists===false&&body.revision===0){
    this.revision=0;this.remote=null;this.dirty=!!this.hasLocal();this.writeMeta(0,this.dirty);this.status='ready';this.emit();if(this.dirty)this.schedule();return;
   }
   const remote=this.validateRemote(body);if(!remote)throw Error('invalid remote');
   if(!this.hasLocal()){
    // The callback writes localStorage atomically before replacing live state.
    if(!this.replaceState(remote.state,{preserveCurrent:false})){this.status='blocked';this.emit();return;}
    this.revision=remote.revision;this.savedAt=remote.savedAt;this.remote=null;this.dirty=false;this.writeMeta(this.revision,false);this.status='ready';this.emit();return;
   }
   const localJson=JSON.stringify(portableState(this.getState())),remoteJson=JSON.stringify(remote.state);
   if(localJson===remoteJson||this.meta?.revision===remote.revision){
    this.revision=remote.revision;this.savedAt=remote.savedAt;this.remote=null;this.dirty=localJson!==remoteJson;this.writeMeta(this.revision,this.dirty);this.status='ready';this.emit();if(this.dirty)this.schedule();return;
   }
   this.remote=remote;this.status='conflict';this.emit();
  }catch(_){this.status='offline';this.emit();}finally{this.connecting=false;}
 }
 changed(){
  if(!this.enabled||this.blocked())return;
  this.seq++;this.dirty=true;
  if(this.revision!==null)this.writeMeta(this.revision,true);else if(this.meta)this.writeMeta(this.meta.revision,true);
  this.emit();if(this.status==='ready')this.schedule();
 }
 schedule(delay=350){clearTimeout(this.timer);if(this.status==='ready')this.timer=setTimeout(()=>this.flush(),delay);}
 async flush(){
  clearTimeout(this.timer);this.timer=null;
  if(this.busy||this.status!=='ready'||!this.dirty||this.revision===null||this.blocked())return;
  const seq=this.seq,body=JSON.stringify({baseRevision:this.revision,state:portableState(this.getState())});
  this.busy=true;this.emit();
  try{
   const response=await this.request({method:'POST',headers:{'Content-Type':'application/json'},body,keepalive:new TextEncoder().encode(body).length<60000});
   if(response.status===409){const remote=this.validateRemote(await response.json());if(!remote)throw Error('invalid conflict');this.remote=remote;this.status='conflict';this.emit();return;}
   if(!response.ok)throw Error('backup write failed');
   const ack=await response.json();if(!Number.isSafeInteger(ack?.revision)||ack.revision!==this.revision+1||!Number.isFinite(ack.savedAt))throw Error('invalid ack');
   this.revision=ack.revision;this.savedAt=ack.savedAt;this.dirty=this.seq!==seq;this.writeMeta(this.revision,this.dirty);
  }catch(_){this.status='offline';}finally{this.busy=false;this.emit();if(this.status==='ready'&&this.dirty)this.schedule();}
 }
 chooseRemote(){
  if(this.status!=='conflict'||!this.remote||this.blocked())return false;
  const r=this.remote;if(!this.replaceState(r.state,{preserveCurrent:true}))return false;
  this.revision=r.revision;this.savedAt=r.savedAt;this.remote=null;this.dirty=false;this.seq++;this.writeMeta(this.revision,false);this.status='ready';this.emit();return true;
 }
 chooseLocal(){
  if(this.status!=='conflict'||!this.remote||this.blocked())return false;
  this.revision=this.remote.revision;this.savedAt=this.remote.savedAt;this.remote=null;this.dirty=true;this.seq++;this.writeMeta(this.revision,true);this.status='ready';this.emit();this.schedule(0);return true;
 }
}

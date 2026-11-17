import {dexGroup,groupLabel,compareDex} from './dex-order.js';
import {AWARD_THRESHOLDS,CATALOG,BY_ID,ARCHIVE_BY_ID,idOfScientific,EVOLUTIONS,POOLS,ROOMS,DESTINATIONS,RARITY,LIGHTS,DECORS,poolWeight,preferredRoom,compatibleRooms,parseTankId} from './catalog.js';
import * as E from './engine.js';
import * as P from './progress.js';
import {AquariumScene} from './aquarium-scene.js';
import {VoxelJourneyScene} from './voxel-journey-scene.js';
import {MAX_IMPORT_BYTES,prepareImport,withRecovery,portableState} from './save-transfer.js';
import {AUTO_FOOD,FOODS,FOOD_BY_ID,careProfile,canEat,canServe} from './care-profiles.js';
import {SIZE_CLASSES,sizeClass,sizeClassLabel,visualLength,visualIndividualScale,formatReference} from './size-classes.js';
import {journeyProgress,JOURNEY_STAGES} from './journey.js';
import {spotsFor,explorationSpot,explorationPool,explorationName,validExplorationSpot} from './exploration-spots.js';
import {personalityFor,speciesGesture} from './personality.js';
import * as L from './decor-layout.js';
import * as Demo from './demo-showcase.js';
import {PreviewBackup} from './preview-backup.js';

const $=s=>document.querySelector(s),thumbs=window.__MODEL_THUMBS__,shell=$('#game-shell'),app=$('#app'),layer=$('#modal-layer');
const ico=(name,size=18)=>{const paths={
 moon:'<path d="M19 14.3A8 8 0 0 1 9.7 5 8 8 0 1 0 19 14.3Z"/>',
 ticket:'<path d="M4 7h16v3a2 2 0 0 0 0 4v3H4v-3a2 2 0 0 0 0-4V7Z"/><path d="M12 7v10" stroke-dasharray="2 2"/>',
 home:'<path d="M3 11 12 4l9 7"/><path d="M5.5 10v10h13V10M10 20v-6h4v6"/>',
 explore:'<circle cx="12" cy="12" r="8.5"/><path d="m15.5 8.5-2.2 4.8-4.8 2.2 2.2-4.8 4.8-2.2Z"/>',
 dex:'<path d="M4.5 5.5c3.4-.8 5.8-.1 7.5 1.3 1.7-1.4 4.1-2.1 7.5-1.3v13c-3.4-.8-5.8-.1-7.5 1.3-1.7-1.4-4.1-2.1-7.5-1.3z"/><path d="M12 6.8v13"/>',
 settings:'<circle cx="12" cy="12" r="3"/><path d="M19.1 13.4 21 12l-1.9-1.4.1-2.4-2.4-.1-1.4-1.9L14 8.1l-2-.8-2 .8-1.4-1.9-1.4 1.9-2.4.1.1 2.4L3 12l1.9 1.4-.1 2.4 2.4.1 1.4 1.9 1.4-1.9 2 .8 2-.8 1.4 1.9 1.4-1.9 2.4-.1z"/>',
 arrow:'<path d="M5 12h14M14 7l5 5-5 5"/>',back:'<path d="M19 12H5m5-5-5 5 5 5"/>',
 lock:'<rect x="6" y="10" width="12" height="10" rx="2"/><path d="M8.5 10V7.5a3.5 3.5 0 0 1 7 0V10M12 14v2"/>',
 heart:'<path d="M20 8.5c0 4-8 9-8 9s-8-5-8-9a4.3 4.3 0 0 1 8-2.1 4.3 4.3 0 0 1 8 2.1Z"/>',
 close:'<path d="M6 6l12 12M18 6 6 18"/>',
 fish:'<path d="M3 12c2.5-4.6 8.4-6.4 12.8-2.3L21 7.5v9l-5.2-2.2C11.4 18.4 5.5 16.6 3 12Z"/><circle cx="8" cy="11" r=".8" fill="currentColor" stroke="none"/>',
 spark:'<path d="m12 3 1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3ZM19 16l.7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7L19 16Z"/>',
 sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M19 5l-1.5 1.5M6.5 17.5 5 19"/>',
 share:'<path d="M12 15V4m-4 4 4-4 4 4"/><path d="M5 14v5h14v-5"/>',
 drop:'<path d="M12 3s-6 7-6 11a6 6 0 0 0 12 0c0-4-6-11-6-11Z"/>',
 check:'<path d="m5 12 4 4L19 6"/>',
 leaf:'<path d="M5 20C5 9 10 5 20 4c0 10-4 15-15 16ZM5 20l10-10"/>',
 gift:'<rect x="4" y="10" width="16" height="10" rx="1"/><path d="M3 7h18v3H3zM12 7v13M12 7c-1-4-5-5-5-2 0 2 3 2 5 2Zm0 0c1-4 5-5 5-2 0 2-3 2-5 2Z"/>',
 search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.3 15.3 4.7 4.7"/>',
 info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>'};return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]||paths.spark}</svg>`;};
// A tangible, illustrated game item, backed by the unchanged numeric save field.
const CUBE_NAME='栄養キューブ';
const destIcon=id=>{
 const art={
 'cold-sea':'<path d="M12 3v18M5 7l14 10M19 7L5 17M12 3l-2 3m2-3 2 3M12 21l-2-3m2 3 2-3" /><path d="M3 15c2-1.6 4-1.6 6 0s4 1.6 6 0 4-1.6 6 0" />',
 'warm-sea':'<circle cx="12" cy="8" r="3.4"/><path d="M12 2v2M4.9 4.9l1.4 1.4M19.1 4.9l-1.4 1.4M2 8h2M20 8h2"/><path d="M3 16c2-1.6 4-1.6 6 0s4 1.6 6 0 4-1.6 6 0M3 20c2-1.6 4-1.6 6 0s4 1.6 6 0 4-1.6 6 0"/>',
 'beach':'<path d="M12 20c-4 0-7-2.8-7-6.4C5 9 8.4 5 12 5s7 4 7 8.6C19 17.2 16 20 12 20Z"/><path d="M12 5v15M8.5 7.5 10 19M15.5 7.5 14 19M6 12h12"/>',
 'reef':'<path d="M7 21v-6c0-2-1-3-3-3 1-3 4-4 6-2V6c0-2 1-3 2-3s2 1 2 3v4c2-2 5-1 6 2-2 0-3 1-3 3v6M7 15c-1.6.3-2.6 1.2-3 3M17 15c1.6.3 2.6 1.2 3 3"/>',
 'deep':'<path d="M7 15c-2 1-3 2.6-3 2.6s1.4.4 3-.4M7 13C8.5 9.5 12 7 16 7c2.5 0 5 1.7 5 5-2.8 2.3-6 3-9 2.4"/><circle cx="15.5" cy="11" r=".6" fill="currentColor"/><path d="M9 7c0-2 1-3 3-3"/><circle cx="12" cy="3.4" r=".9"/>',
 'river':'<path d="M7 3c6 4-4 6 2 9s-2 5-4 9M17 3c-4 5 3 6-1 10"/><path d="M5 21c2-1.4 4-1.4 6 0M13 21c2-1.4 4-1.4 6 0"/>',
 'lake':'<circle cx="12" cy="13" r="6.5"/><path d="M8 12c1.4-1.2 2.8-1.2 4.2 0M12 6.5V4M18 8c1-2 2.4-3 4-3-.4 2-1.4 3.4-3 4"/>',
 'estuary-tropical':'<path d="M12 3v8M12 7c-2.5 0-4-1.2-4.6-3.4C9.8 3.4 11.4 4.8 12 7Zm0 0c2.5 0 4-1.2 4.6-3.4C14.2 3.4 12.6 4.8 12 7ZM9 21c.6-3 .2-6-1.4-8M12 21c0-3.4 0-6.8 0-10M15 21c-.6-3-.2-6 1.4-8"/>',
 'estuary-north':'<path d="M6 21c.8-4 .4-8-1-11M10 21c.4-4.6 0-9-1.4-13M18 21c-.6-3.4-2.4-5.4-5-6.4M4 17c2-1.4 4-1.4 6 0s4 1.4 6 0 3-1.2 4-.6"/>'};
 art.penguin='<path d="M9 20c-2-4-1-11 3-14 4 3 5 10 3 14zM9 13h6M10 16h4M12 3v3M5 20h14"/>';art['sea-lion']='<path d="M3 18c3-5 6-7 10-6l3-4 2 1-1 4 4 3-4 3H8zM12 12l-1 5"/><circle cx="16.5" cy="10.5" r=".5"/>';art['otter-room']='<path d="M3 15c2-4 5-6 10-5l4-2 3 1-1 3 2 2-4 3H8l-5 3zM8 16l1 3m5-3 1 3"/><circle cx="17" cy="10.5" r=".5"/>';art['open-ocean']=art['warm-sea'];art.coastal=art.reef;art.estuary=art['estuary-tropical'];art['large-cold-sea']='<path d="M2 15c3-4 8-6 13-5 3 1 5 3 7 3-1 2-3 3-5 3H8l-4 3v-3Z"/><path d="M11 10l2-3 2 3M5 5h5M6 3v4"/><circle cx="18" cy="12.5" r=".6" fill="currentColor"/>';art['large-warm-sea']='<path d="M2 12c3-3 7-4 11-3l3-3 2 4 4 2-4 2-2 4-3-3c-4 1-8 0-11-3Z"/><circle cx="12" cy="11.5" r=".6" fill="currentColor"/><path d="M3 3h3M4.5 1.5v3M7 6h2"/>'; 
 return `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${art[id]||art['cold-sea']}</svg>`;};
const cubeIcon=(size=34)=>`<svg width="${size}" height="${size}" viewBox="0 0 64 64" aria-hidden="true" class="cube-icon"><path d="M32 5 55 17 32 29 9 17Z" fill="#e5d399"/><path d="M9 17 32 29v28L9 44Z" fill="#b69c62"/><path d="M55 17 32 29v28l23-13Z" fill="#8ba88a"/><path d="M32 5 55 17v27L32 57 9 44V17Z" fill="none" stroke="#f4e7be" stroke-width="2.2" stroke-linejoin="round"/><path d="M32 29v28M9 17l23 12 23-12" fill="none" stroke="#f4e7be" stroke-width="1.8"/><path d="M42 31c-6 1-7 6-7 10 5-1 8-4 7-10Zm-7 10 5-6" fill="none" stroke="#e9f0d4" stroke-width="1.8" stroke-linecap="round"/></svg>`;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const img=(sp,cl='')=>`<img class="${cl}" src="${thumbs[sp.id]||thumbs[sp.model]||''}" alt="" style="filter:drop-shadow(0 4px 10px rgba(0,0,0,.24))">`;
let storageOk=true,storageReadOnly=false,protectedRaw=null,hadLocalSave=false;
function protectRaw(raw,key){storageReadOnly=true;storageOk=false;if(typeof raw==='string')protectedRaw={raw,key};return E.createInitial();}
function load(){
 try{
  const raw=localStorage.getItem(E.SAVE_KEY);
  if(raw!==null){let parsed;try{parsed=JSON.parse(raw);}catch(_){return protectRaw(raw,E.SAVE_KEY);}
   if(!E.validSave(parsed)||!prepareImport(parsed).ok)return protectRaw(raw,E.SAVE_KEY);
   try{hadLocalSave=true;return E.normalizeSave(parsed);}catch(_){return protectRaw(raw,E.SAVE_KEY);}
  }
  const previousRaw=localStorage.getItem(E.PREVIOUS_SAVE_KEY);
  if(previousRaw!==null){let previous,migrated;try{previous=JSON.parse(previousRaw);if(!E.validPrevious(previous))return protectRaw(previousRaw,E.PREVIOUS_SAVE_KEY);migrated=E.migratePrevious(previous);if(!prepareImport(migrated).ok)return protectRaw(previousRaw,E.PREVIOUS_SAVE_KEY);}catch(_){return protectRaw(previousRaw,E.PREVIOUS_SAVE_KEY);}
   try{localStorage.setItem(E.SAVE_KEY,JSON.stringify(migrated));hadLocalSave=true;}catch(_){storageReadOnly=true;storageOk=false;protectedRaw={raw:previousRaw,key:E.PREVIOUS_SAVE_KEY};}return migrated;
  }
  const legacyRaw=localStorage.getItem(E.LEGACY_SAVE_KEY);
  if(legacyRaw!==null){let legacy,migrated;try{legacy=JSON.parse(legacyRaw);if(!E.validLegacy(legacy))return protectRaw(legacyRaw,E.LEGACY_SAVE_KEY);migrated=E.migrateLegacy(legacy);if(!prepareImport(migrated).ok)return protectRaw(legacyRaw,E.LEGACY_SAVE_KEY);}catch(_){return protectRaw(legacyRaw,E.LEGACY_SAVE_KEY);}
   try{localStorage.setItem(E.SAVE_KEY,JSON.stringify(migrated));hadLocalSave=true;}catch(_){storageReadOnly=true;storageOk=false;protectedRaw={raw:legacyRaw,key:E.LEGACY_SAVE_KEY};}return migrated;
  }
 }catch(_){storageReadOnly=true;storageOk=false;}
 return E.createInitial();
}
let state=load(),screen='title',lastRenderedScreen=null,currentRoom='current',currentWater='marine',currentSection=null,tankPage=0,dexFilter='すべて',dexStatus='all',dexSize='all',dexQuery='',modal=null,toastTimer=null,selectedFood='auto',breedingOpen=false,foodPickerOpen=false;
// Transient navigation choices never rewrite or migrate saved fish.
const rememberedSections={},selectedSpots={};
let lastTankRenderedRoom=null;
let lastSceneSignature=null,modalOpener=null,modalOpenerSelector=null,modalOpenerScreen=null;const modalScrolls=new Map(),modalDrafts=new Map();
let lastCareMinute=null,pendingImport=null,transferNotice='',importRequestSeq=0,dexComposing=false,dexRefreshPending=false;
// Presentation-only selections: never written to the player's save.
let feedReturn=null,dexSort='group',exploreHomeForced=false;
let layoutSelection=null,layoutDrag=null,layoutIgnoreClick=false,appBootstrapped=false,lastStoredJSON=null,backupStorage;
try{backupStorage=window.localStorage;lastStoredJSON=backupStorage.getItem(E.SAVE_KEY);}catch(_){backupStorage={getItem:()=>null,setItem:()=>{}};}
const backup=new PreviewBackup({getState:()=>state,hasLocal:()=>hadLocalSave,blocked:()=>storageReadOnly,storage:backupStorage,fetcher:window.fetch.bind(window),enabled:location.protocol==='http:'||location.protocol==='https:',onChange:()=>updateBackupUI(),replaceState:(incoming,{preserveCurrent})=>{
 const checked=prepareImport(incoming);if(storageReadOnly||!checked.ok)return false;
 if(preserveCurrent&&!prepareImport(state).ok)return false;
 const next=preserveCurrent?withRecovery(checked.state,state):checked.state,raw=JSON.stringify(next);
 try{localStorage.setItem(E.SAVE_KEY,raw);}catch(_){storageOk=false;return false;}
 state=next;hadLocalSave=true;lastStoredJSON=raw;storageOk=true;lastSceneSignature=null;
 if(appBootstrapped){sound.sync();render();if(modal&&modal.type!=='backup-conflict')renderModal();}
 return true;
}});
function save(){if(storageReadOnly)return;try{const raw=JSON.stringify(state);if(raw!==lastStoredJSON){localStorage.setItem(E.SAVE_KEY,raw);lastStoredJSON=raw;hadLocalSave=true;storageOk=true;backup.changed();}storageOk=true;}catch(e){storageOk=false;updateBackupUI();}}
function backupLabel(){return storageOk?backup.label():'この端末に保存できません。元のデータは自動で上書きしません。';}
function updateBackupUI(){
 document.querySelectorAll('[data-backup-message]').forEach(el=>el.textContent=backupLabel());
 document.querySelectorAll('[data-backup-conflict]').forEach(el=>el.hidden=backup.status!=='conflict');
 document.querySelectorAll('[data-backup-retry]').forEach(el=>el.hidden=!['offline','local'].includes(backup.status));
 const start=app.querySelector('[data-action=start]');if(start)start.disabled=backup.status==='checking'||backup.status==='conflict';
}
function conflictBanner(){return `<div class="backup-conflict-banner" data-backup-conflict ${backup.status==='conflict'?'':'hidden'}><strong>セーブの確認が必要です</strong><span>異なる保存データは自動で上書きしません。</span><button class="small-link" data-action="backup-conflict">内容を確認する →</button></div>`;}
function toast(message){const el=$('#toast');el.textContent=message;el.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('visible'),2600);}
class Sound {
 constructor(){this.ctx=null;this.timer=null;}
 init(){try{this.ctx??=new (window.AudioContext||window.webkitAudioContext)();if(this.ctx.state==='suspended')this.ctx.resume();}catch(e){}}
 note(freq,duration=.5,vol=.018){if(!this.ctx)return;const c=this.ctx,o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.setValueAtTime(freq,c.currentTime);g.gain.setValueAtTime(.0001,c.currentTime);g.gain.exponentialRampToValueAtTime(vol,c.currentTime+.035);g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+duration);o.connect(g);g.connect(c.destination);o.start();o.stop(c.currentTime+duration+.05);}
 tap(){if(!state.settings.sfx)return;this.init();this.note(620,.3,.012);setTimeout(()=>this.note(830,.35,.007),120);}
 ambience(){if(!state.settings.bgm)return;this.init();const hour=new Date().getHours();const chord=hour<17?[196,246.94,293.66]:hour<20?[174.61,220,261.63]:[164.81,196,246.94];chord.forEach((n,i)=>setTimeout(()=>this.note(n,3.2,.004),i*350));}
 sync(){clearInterval(this.timer);if(state.settings.bgm){this.ambience();this.timer=setInterval(()=>this.ambience(),6000);}}
}
const sound=new Sound();
function momentIsVisible(){
 if(screen!=='tank'||modal||document.hidden)return false;const stage=$('#room-scene'),container=$('#screen-content');if(!stage||!container)return false;
 const a=stage.getBoundingClientRect(),b=container.getBoundingClientRect();return Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>Math.min(100,a.height*.3);
}
const scene=new AquariumScene({onTap:(uid,x,y)=>petFish(uid,x,y),onHold:uid=>{const sample=Demo.showcaseByUid(state,uid);openModal(sample?{type:'species',id:sample.species_id}:{type:'fish',uid});},onZoom:z=>{const label=$('#zoom-level');if(label)label.textContent=z.toFixed(1)+'×';const hint=$('[data-camera-hint]');if(hint)hint.textContent=z>(scene.isWideHabitat()?.55:1)?'水槽にふれて動かせます':'＋で拡大すると、水槽にふれて動かせます';},
 onFeedingEnd:result=>finishFeedingUI(result),canShowMoment:momentIsVisible,onMoment:pair=>{
  if(E.recordSynergyMoment(state,pair.key))save();const caption=$('#moment-caption');if(caption){caption.textContent='✧ '+pair.caption;caption.hidden=false;}
  document.querySelectorAll('[data-moments-count]').forEach(el=>el.textContent=String(state.dex.moments.length));
 },onMomentEnd:()=>{const caption=$('#moment-caption');if(caption)caption.hidden=true;}});
const journeyScene=new VoxelJourneyScene(scene);
function finishFeedingUI(result){
 const previous=feedReturn;feedReturn=null;
 if(previous&&result.reason==='complete'&&!result.interrupted&&!modal&&screen==='tank'&&currentRoom===previous.room&&currentWater===previous.water&&currentSection===previous.section&&tankPage===previous.autoPage){
  tankPage=previous.page;scene.panX=previous.view.panX;scene.panY=previous.view.panY;scene.setViewMode(previous.view.mode,previous.view.uid);render();return;
 }
 updateFeedUI();
}
function updateFeedUI(){
 const button=app.querySelector('[data-action=feed]');
 if(button){const matches=E.fishInTank(state,currentRoom,currentWater,currentSection).some(f=>canServe(BY_ID[f.species_id],selectedFood));button.disabled=!!scene.feeding||!matches||!E.feedRemaining(state,currentRoom,currentWater);}
 const badge=app.querySelector('#feeding-caption');if(badge)badge.hidden=!scene.feeding;
}
function inventoryCard(){return `<button class="inventory-card" data-action="material-info" aria-label="${CUBE_NAME} ${state.materials}個、使い道を見る">${cubeIcon(30)}<span><strong>${CUBE_NAME}</strong><small>育成・交換に使う</small></span><b>${state.materials}<small> 個</small></b>${ico('arrow',14)}</button>`;}
function header(){return `<header class="topbar"><div class="brand"><span class="brand-emblem">${ico('moon',17)}</span><span><span class="brand-title">よるの水族館</span><span class="brand-sub">途中版 ${CATALOG.length} / 300種</span></span></div><div class="header-actions"><button class="ticket-pill" data-action="go" data-screen="explore" aria-label="探索券 ${state.exploration.stock}/3">${ico('ticket',15)} <span>${state.exploration.stock} / 3</span></button><button class="header-icon" data-action="open-light" aria-label="ライト ${esc(LIGHTS[state.tank.light])}、タップで切り替え" title="ライトを切り替える">${ico(state.tank.light==='warm'?'sun':'moon',19)}</button></div></header>`;}
function nav(){return `<nav class="bottom-nav" aria-label="メインメニュー">${[['home','home','館内'],['explore','explore','探索'],['dex','dex','図鑑'],['settings','settings','設定']].map(([id,icon,label])=>`<button class="nav-item ${(screen===id||(screen==='tank'&&id==='home'))?'active':''}" data-action="go" data-screen="${id}" aria-current="${(screen===id||(screen==='tank'&&id==='home'))?'page':'false'}">${ico(icon,20)}<span>${label}</span></button>`).join('')}</nav>`;}
function renderTitle(){return `<div class="title-screen"><div class="title-top"><div class="title-mark">✧</div><h1 class="title-name">よるの水族館</h1><div class="title-sub">一日の終わりに、ちいさな海を。</div></div><div id="title-fish-stage" class="title-fish-stage" aria-hidden="true"></div><div class="title-bottom"><div class="title-line">おかえりなさい。<br>ここでは、ゆっくりでいい。</div><button class="primary-btn title-button" data-action="start" ${['checking','conflict'].includes(backup.status)?'disabled':''}>${state.started?'つづける':'はじめる'} ${ico('arrow',15)}</button><div class="title-note">音は設定からいつでも変えられます</div><div class="title-backup"><span data-backup-message>${esc(backup.label())}</span><button class="small-link" data-action="backup-conflict" data-backup-conflict ${backup.status==='conflict'?'':'hidden'}>セーブを確認する →</button></div></div></div>`;}
function roomLandscape(id){
 const art={
  'cold-sea':'<path d="M0 90h160v32H0z" fill="#466779"/><path d="M7 90V58h5v32m7 0V69h5v21m110 0V57h5v33m6 0V68h5v22" stroke="#709f91" stroke-width="4"/><path d="M8 22h30l-4 7H12zm104 7h33l-6 8h-23z" fill="#cae8e8" opacity=".48"/>',
  'warm-sea':'<path d="M0 90h160v32H0z" fill="#bba67a"/><path d="M10 90V65h4v25m8 0V71h4v19m112 0V61h4v29" stroke="#8ebd91" stroke-width="4"/><path d="M33 13l-14 61M83 3 65 75M125 10l-17 65" stroke="#f4e3a3" stroke-width="5" opacity=".15"/>',
  'large-cold-sea':'<path d="M0 90h160v32H0z" fill="#3d5d70"/><path d="M8 72 22 44 31 60 43 39 61 72Zm79 0 15-23 12 14 13-29 26 38z" fill="#b6d6df" opacity=".45"/><path d="M10 25h20m82-5h25" stroke="#d4e8ec" stroke-width="2" opacity=".4"/>',
  'large-warm-sea':'<path d="M0 93h160v29H0z" fill="#6f8a81"/><path d="M22 5 3 86M70 0 48 90M118 0 96 90M153 5l-20 84" stroke="#f4df9c" stroke-width="8" opacity=".18"/><path d="M16 81h25m76 3h25" stroke="#c3dcbb" stroke-width="2" opacity=".4"/>',
  lake:'<path d="M0 94h160v28H0z" fill="#728a69"/><path d="M14 90V55h3v35m6 0V65h3v25m109 0V58h3v32" stroke="#b4b886" stroke-width="3"/><ellipse cx="52" cy="80" rx="13" ry="4" fill="#92ba88"/><ellipse cx="102" cy="87" rx="11" ry="3" fill="#bad294"/><path d="M48 78l4-7 4 7" fill="#eed8d7"/>',
  'estuary-tropical':'<path d="M13 5h9v50l-9 37H7l10-38V5zm8 44 14 44h-6L17 53zm126-44h-9v50l9 37h6l-10-38V5zm-8 44-14 44h6l12-40z" fill="#a98e68" opacity=".75"/><path d="M0 93h160v29H0z" fill="#777b5e" opacity=".7"/>',
  'estuary-north':'<path d="M0 95h160v27H0z" fill="#73827a"/><path d="M12 95V53h3v42m9 0V67h3v28m105 0V59h3v36m9 0V69h3v26" stroke="#c2c4a1" stroke-width="3"/><path d="M40 89h25l5 6H36zm64 3h18l4 5h-27z" fill="#aeb7ae"/><path d="M27 40h16m59-8h20" stroke="#c9dcdc" stroke-width="2" opacity=".3"/>',
  penguin:'<path d="M0 84 30 67 60 78 81 61 110 79 160 74v48H0z" fill="#b0b9b0"/><path d="M0 79h160" stroke="#d4efea" opacity=".7"/>',
  'sea-lion':'<path d="M0 90 26 65 54 80 83 58 111 79 160 69v53H0z" fill="#a3937d"/><path d="M0 81h160" stroke="#c5e5e4" opacity=".7"/>',
  'otter-room':'<path d="M0 91 30 70 62 81 90 68 160 89v33H0z" fill="#829474"/><path d="M15 90V47m8 40V63m115 27V53" stroke="#a9bd90" stroke-width="5"/>',
  current:'<path d="M6 42h20m20-12h28m-60 30h32m42-10h26" fill="none" stroke="#9ad8d1" stroke-width="2" opacity=".28"/><g fill="#c9e8db" opacity=".25"><rect x="29" y="20" width="3" height="3"/><rect x="103" y="27" width="3" height="3"/></g>',
  beach:'<path d="M0 87h160v35H0z" fill="#b6ab83" opacity=".68"/><path d="M19 87V62h3v25m4 0V69h3v18m97 0V61h4v26m4 0V70h4v17" stroke="#7ba78a" stroke-width="3"/><path d="M48 93h14m35-1h12" stroke="#e5d4aa" stroke-width="2"/>',
  reef:'<path d="M0 88h160v34H0z" fill="#4f7370" opacity=".55"/><path d="M16 89V55h7v12h7V48h6v41m8 0V73h5V62h6v27m65 0V65h6V54h6v16h7V59h6v30" fill="#d99885" opacity=".67"/>',
  deep:'<path d="M0 98 22 75 39 88 55 78 72 98 94 82 110 92 133 68 160 94v28H0Z" fill="#283c56"/><g fill="#a3d6da" opacity=".56"><rect x="19" y="37" width="3" height="3"/><rect x="54" y="24" width="2" height="2"/><rect x="130" y="38" width="3" height="3"/></g>',
  river:'<path d="M0 91h160v31H0z" fill="#71927c" opacity=".65"/><path d="M17 91V58h4v33m4 0V70h5v21m97 0V53h4v38m4 0V72h5v19" stroke="#9ac8a5" stroke-width="4"/><path d="M54 88h24v5H54zm38 2h19v5H92z" fill="#b0ba9a"/>',
  estuary:'<path d="M14 8h9v52l-9 30h-5l8-31V8zm8 45 13 37h-5L18 57zm117-45h-9v52l9 30h5l-8-31V8zm-8 45-13 37h5l12-33z" fill="#a18d69" opacity=".72"/><path d="M0 91h160v31H0z" fill="#827a5c" opacity=".52"/>'
 };
 return `<svg class="room-landscape" viewBox="0 0 160 122" preserveAspectRatio="none" aria-hidden="true">${art[id]||''}</svg>`;
}
function roomCard(room,index){
 const open=E.canEnterRoom(state,room.id),list=Demo.roomDisplay(state,room.id),samples=list.filter(f=>f.showcase).length,owned=list.length-samples;
 const featured=list.find(f=>BY_ID[f.species_id]?.scientific===room.featured)||list.find(f=>BY_ID[f.species_id]?.kind!=='environment')||list[0],sp=featured&&BY_ID[featured.species_id];
 const description=Demo.showcaseEnabled(state)?`${waterLabels[room.water]} · 仲間 ${owned} / 見本 ${samples}`:`${waterLabels[room.water]} · ${list.length?`仲間 ${list.length}体`:'まだ静かです'}`;
 return `<button class="room-card room-${room.id} ${open?'':'locked'}" data-action="room" data-room="${room.id}" aria-label="${room.name} ${open?esc(description):`図鑑${room.threshold}種で解放`}"><span class="room-number">0${index+1}</span><span class="room-icon">${open?ico('arrow',16):ico('lock',15)}</span>${roomLandscape(room.id)}<span class="room-habitat-symbol">${destIcon(room.id)}</span>${open&&sp?img(sp,'room-fish'):`<span class="room-empty-art">${open?'✧':'·'}</span>`}<span class="room-info"><strong>${room.short}</strong><span>${open?esc(description):`図鑑 ${room.threshold} 種で解放`}</span></span></button>`;
}
function tutorialCard(){const t=state.tutorial;if(t.explore&&t.discover&&t.pet)return '';
 let title='はじめての、海へ。',copy='探索に出かけて、最初の仲間に会いにいきましょう。',action='go',attr='data-screen="explore"',label='はじめての探索へ';
 if(t.explore&&!t.discover){title='もうすぐ、出会いの時間。';copy='探索から戻るのを、ゆっくり待ちましょう。';label='探索の様子を見る';}
 else if(t.discover&&!t.pet){title='仲間に、会いにいこう。';copy='水槽の魚をタップして、そっとなでてみましょう。';action='room';attr='data-room="current"';label='水槽をのぞく';}
 return `<section class="home-guide"><div class="guide-top">${ico('spark',13)} はじめての３ステップ</div><h3 class="guide-title">${title}</h3><p class="guide-copy">${copy}</p><div class="guide-steps"><span class="${t.explore?'done':''}">${t.explore?'✓':'01'} 探索</span><span class="${t.discover?'done':''}">${t.discover?'✓':'02'} 発見</span><span class="${t.pet?'done':''}">${t.pet?'✓':'03'} なでる</span></div><button class="primary-btn guide-button" data-action="${action}" ${attr}>${label} ${ico('arrow',14)}</button></section>`;}
function suggestionBody(now=Date.now()){
 const idea=P.nextSuggestion(state,now);let title='',copy='',action='',attrs='';
 if(idea.kind==='evolution'){const f=state.fish_instances.find(x=>x.uid===idea.uid);if(!f)return '';title=`${esc(displayName(f))}に、新しい可能性`;copy='進化の条件がそろいました。詳しく見てみましょう。';action='suggestion-evolution';attrs=`data-uid="${esc(f.uid)}"`;}
 else if(idea.kind==='care'){const room=ROOMS.find(r=>r.id===idea.room);title='おなかのすいた仲間がいます';copy=`${esc(room?.short||'展示室')}・${waterLabels[idea.water]}に${idea.count}匹。えさはあと${idea.remaining}回。`;action='suggestion-care';attrs=`data-room="${esc(idea.room)}" data-water="${esc(idea.water)}" data-section="${esc(idea.section||'')}"`;}
 else if(idea.kind==='collection'){title=`次の館長賞まで、あと${idea.remaining}種`;copy=idea.exploring?'探索から帰るのを、ゆっくり待ちましょう。':'探索で、まだ知らない仲間に会いにいきましょう。';action='go';attrs='data-screen="explore"';}
 else {title=`${CATALOG.length}種との出会いを、ありがとう`;copy='今夜は、好きな水槽をのんびり眺めましょう。';action='room';attrs='data-room="current"';}
 return `<button class="suggestion-card" data-action="${action}" ${attrs}><span class="suggestion-icon">${ico('spark',19)}</span><span class="suggestion-text"><small>今夜のおすすめ · お好みで</small><strong>${title}</strong><span>${copy}</span></span><span class="suggestion-arrow">${ico('arrow',15)}</span></button>`;
}
function welcomeItem(item){
 const f=item.uid?state.fish_instances.find(x=>x.uid===item.uid):null,sp=(item.species_id&&BY_ID[item.species_id])||(f&&BY_ID[f.species_id]);let text='';
 if(f&&!sp){text='前版の仲間に関する記録を保管しています';}
 else if(item.kind==='explore'){
  const base=DESTINATIONS.find(d=>d.id===item.destination)?.name||'海',focus=explorationName(item.destination,item.spot);const destination=focus?`${base}・${focus}`:base;
  if(item.result_type==='fish')text=`${destination}の探索で${sp?.name||'仲間'}をお迎えしました`;
  else if(item.result_type==='decor')text=`${destination}の探索で${DECORS[item.decor]||'かざり'}を発見しました`;
  else if(item.result_type==='material'||item.result_type==='duplicate')text=`${destination}の探索で${CUBE_NAME}を見つけました`;
  else text=`${destination}の探索から帰りました`;
 }else if(item.kind==='birth')text=`水槽にあかちゃんが${item.count}匹生まれました`;
 else if(item.kind==='growth')text=`${f?displayName(f):'仲間'}の育成度が${item.stage===2?'S':'A'}になりました`;
 return `<button class="welcome-item" data-action="welcome-go" data-uid="${esc(f?.uid||'')}" data-kind="${esc(item.kind)}"><span>${esc(text)}</span>${ico('arrow',14)}</button>`;
}
function welcomeCard(){const report=state.welcome_back;if(!report)return '';
 return `<section class="welcome-card" aria-label="おかえり記録"><div class="welcome-card-head"><span><strong>おかえりの、きろく</strong></span><button data-action="welcome-dismiss" aria-label="おかえり記録を閉じる">${ico('close',15)}</button></div>${report.items.length?`<div class="welcome-items">${report.items.map(welcomeItem).join('')}</div>`:'<div class="welcome-quiet">今夜も、なかまたちとひと息つきましょう。</div>'}</section>`;
}
function momentShortcut(){const active=E.activeSynergies(state).length;return `<button class="moment-shortcut" data-action="moments"><span class="moment-shortcut-icon">${ico('spark',17)}</span><span><strong>ふたりのワンシーン</strong><small>ゲーム内の共生 ${active}組 · 記録 <b data-moments-count>${state.dex.moments.length}</b> / 4</small></span>${ico('arrow',15)}</button>`;}
function archiveNotice(){const fish=E.archivedInstances(state).length,seen=E.archivedDiscoveryCount(state);if(!fish&&!seen)return '';return `<div class="archive-banner"><span><strong>前版の記録を保管中</strong><small>仲間 ${fish}体・発見記録 ${seen}件。新しい展示には含めていません。</small></span><button class="small-link" data-action="go" data-screen="settings">確認する →</button></div>`;}
function archiveSettings(){const fish=E.archivedInstances(state),seen=E.archivedDiscoveryCount(state);if(!fish.length&&!seen)return '';return `<div class="settings-title">前版の記録</div><div class="settings-group archive-box"><details><summary>保管中の仲間 ${fish.length}体・発見記録 ${seen}件</summary><p>旧来の創作種や、同じ実在種と確定できない旧個体は別の生物へ自動変換せず、このセーブにそのまま保管しています。水槽・現行図鑑・育成には含まれません。下のJSON書き出しに含まれます。</p>${fish.length?`<ul class="archive-list">${fish.map(f=>`<li><strong>${esc(f.nickname||ARCHIVE_BY_ID[f.species_id]?.name||'前版の仲間')}</strong><small>${esc(ARCHIVE_BY_ID[f.species_id]?.name||f.species_id)} · ${esc(f.uid)} · 育成 ${esc(f.growth??0)}</small></li>`).join('')}</ul>`:'<p>個体はなく、発見記録を保管しています。</p>'}</details></div>`;}
function speciesFacts(sp){return `<div class="facts-box species-facts"><div><b>学名</b> <i>${esc(sp.scientific)}</i></div><div><b>実際の生息</b> ${esc(sp.natural)}</div><div><b>見わける特徴</b> ${esc(sp.feature)}</div><div class="facts-sources"><a href="${esc(sp.referenceUrl)}" target="_blank" rel="noopener noreferrer">生態・形の資料 ↗</a> <a href="${esc(sp.taxonomyUrl)}" target="_blank" rel="noopener noreferrer">学名の資料 ↗</a></div></div>`;}
function home(){const a=state.exploration.active;return `<div class="page-head"><h2 class="page-heading">おかえりなさい。</h2><p class="page-copy">今夜も、あなたのペースで。</p></div>${welcomeCard()}${archiveNotice()}${storageOk?'':'<div class="storage-warning">保存できないか、読み取れないデータがあります。既存データを消さず、保存を停止しています。通常のブラウザで開いてください。</div>'}${state.previous?.notice?`<div class="storage-warning previous-notice"><strong>前の水槽を引き継ぎました</strong><br>元の記録を保ちました。新展示に出ない旧個体は設定で保管しています。元のセーブは変更せず、設定から保存できます。<br><button class="small-link" data-action="previous-ack">確認しました ${ico('check',13)}</button></div>`:''}${state.legacy?.notice?`<div class="storage-warning migration-notice"><strong>正式図鑑への移行</strong><br>旧図鑑の発見記録 ${state.legacy.originalDiscovered} 種を保持しています。旧個体 ${state.legacy.legacyInstances} 体は保管中です。新しい展示には出さず、元データは設定から書き出せます。<br><button class="small-link" data-action="migration-ack">確認しました ${ico('check',13)}</button></div>`:''}<div class="section-head"><span class="section-title">展示室</span></div><div class="room-grid">${ROOMS.map(roomCard).join('')}</div><section class="breeding-home" aria-labelledby="breeding-home-title"><div class="section-head"><span id="breeding-home-title" class="section-title">繁殖用水槽</span></div><p class="breeding-home-copy">同じ種類のなかまを移して、繁殖を見守れます。</p>${state.breeding_tanks.length?`<div class="breeding-tank-list">${state.breeding_tanks.map(t=>{const def=E.tankDefinition(state,t.id);return `<button class="secondary-btn" data-action="quick-room" data-room="${esc(t.id)}"><span>${esc(t.name)}<small>${esc(def?.theme||'')}</small></span>${ico('arrow',15)}</button>`}).join('')}</div>`:'<p class="breeding-home-empty">まだ繁殖用水槽はありません。</p>'}${state.breeding_tanks.length<E.MAX_BREEDING_TANKS?'<button class="primary-btn" data-action="open-breeding-create">＋ 繁殖用水槽を作る</button>':''}</section>${inventoryCard()}${tutorialCard()}${state.tutorial.explore&&state.tutorial.discover&&state.tutorial.pet?`<div id="home-suggestion">${suggestionBody()}</div>`:''}${a?`<button class="today-card" data-action="go" data-screen="explore"><span class="today-icon">${ico('explore',19)}</span><span class="today-text"><strong>海へ探索中</strong><small>帰館まで <span data-clock="active"></span></small></span><span class="arrow">${ico('arrow',15)}</span></button>`:`<button class="today-card" data-action="today" ${(!state.tutorial.discover||state.daily.today_fish_claimed)?'disabled':''}><span class="today-icon">${ico('gift',19)}</span><span class="today-text"><strong>今日の魚</strong><small>${!state.tutorial.discover?'最初の探索のあとに届きます':state.daily.today_fish_claimed?'今日は受け取りました':'1日1回、仲間が訪れます'}</small></span><span class="arrow">${ico('arrow',15)}</span></button>`}`;}
const waterLabels={marine:'海水',fresh:'淡水',brackish:'汽水'};
const displayName=f=>f.nickname||BY_ID[f.species_id]?.name||'なかま';
const sexLabel=f=>f.sex==='male'?'♂ オス':f.sex==='female'?'♀ メス':'—';
// Open-water pages with many very large specimens use fewer models so that
// the existing size ratios remain legible rather than stacking into one blob.
function tankPageSize(){return E.MAX_DISPLAY_PER_PAGE;}
function availableSections(){return [];}
function initialSection(){return null;}
function sceneHabitatFor(room){const def=E.tankDefinition(state,room);return def?.habitat||def?.id||room;}
function displayPagesFor(room,water){
 const fish=Demo.waterDisplay(state,room,water,null),animals=fish.filter(f=>BY_ID[f.species_id].kind!=='environment');
 const ownedPages=E.tankPages(state,room).map(pg=>pg.map(uid=>animals.find(f=>f.uid===uid)).filter(Boolean));
 const pages=ownedPages.length?ownedPages:[[]];
 for(const sample of animals.filter(f=>f.showcase)){let pg=pages.find(x=>x.length<E.MAX_DISPLAY_PER_PAGE);if(!pg){pg=[];pages.push(pg);}pg.push(sample);}
 return pages;
}
function currentDisplayPage(room,water){const pages=displayPagesFor(room,water);tankPage=Math.max(0,Math.min(tankPage,pages.length-1));return {pages,onPage:pages[tankPage]||[]};}
function quickRooms(){return `<div class="room-switch-label"><span>展示室を切り替え</span><small>横にスワイプ →</small></div><nav class="room-switcher" aria-label="展示室を切り替え">${E.allTanks(state).map(r=>{
 const unlocked=E.canEnterRoom(state,r.id),active=r.id===currentRoom;
 return `<button class="room-switch-chip ${active?'active':''}" data-action="quick-room" data-room="${r.id}" ${active?'aria-current="page"':''} ${unlocked?'':'disabled'} aria-label="${esc(r.name)}${unlocked?'':`（図鑑${r.threshold}種で解放）`}"><span class="switch-dot ${r.id}" aria-hidden="true"></span>${esc(r.short)}${unlocked?'':` <span aria-hidden="true">⌑</span>`}</button>`;
 }).join('')}</nav>`;}
function tank(){
 const room=E.tankDefinition(state,currentRoom)||ROOMS[0];currentRoom=room.id;currentSection=null;currentWater=room.water;
 const sceneHabitat=sceneHabitatFor(room.id);
 const fish=Demo.waterDisplay(state,room.id,currentWater,null),visible=fish.filter(f=>BY_ID[f.species_id].kind!=='environment'||f.placed!==false);
 const {pages,onPage}=currentDisplayPage(room.id,currentWater),animals=visible.filter(f=>BY_ID[f.species_id].kind!=='environment');
 if(scene.viewMode==='follow'&&!onPage.some(f=>f.uid===scene.followUid))scene.setViewMode('drag');
 const ownedAnimals=animals.filter(f=>!f.showcase),matches=onPage.filter(f=>!f.showcase&&canServe(BY_ID[f.species_id],selectedFood)).length,remaining=E.feedRemaining(state,currentRoom,currentWater);
 const isBreeding=!!room.breeding,statuses=isBreeding?E.breedingStatus(state,currentRoom,currentWater,Date.now(),null):[],pairs=statuses.filter(x=>x.pair),hungry=ownedAnimals.filter(f=>E.satietyAt(f)<20).length,occupied=E.tankOccupancy(state,room.id);
 return `<div class="page-title-row"><button class="back-button" data-action="go" data-screen="home" aria-label="館内に戻る">${ico('back',17)}</button><div><h2>${esc(room.name)}</h2><p>${fish.length}${Demo.showcaseEnabled(state)?'体（見本を含む）':'のなかま'}</p></div><button class="round-button" data-action="share" aria-label="水槽の画像を共有">${ico('share',16)}</button></div>
 ${quickRooms()}
 <div class="exhibit-meta"><span class="exhibit-water">${waterLabels[room.water]}</span><span>${esc(room.theme)}</span>${Demo.showcaseEnabled(state)?'<span class="showcase-legend">見本を含む</span>':''}</div>
 <div class="room-scene" id="room-scene" data-light="${state.tank.light}" data-water="${currentWater}" data-habitat="${esc(sceneHabitat)}" data-room="${esc(currentRoom)}"><div class="habitat-light" aria-hidden="true"></div><span class="water-count">${onPage.length}体を表示${pages.length>1?` · 水槽 ${tankPage+1}/${pages.length}`:''}</span>${visible.length?'<span class="water-hint">タップでなでる<br>長押しで詳細</span>':'<div class="water-empty">この水槽は、まだ静かです。<br>新しい仲間を探しにいきましょう。</div>'}<div class="feeding-caption" id="feeding-caption" role="status" hidden><span>✦</span> お食事のじかん</div><div class="zoom-controls" role="group" aria-label="水槽の拡大縮小"><button data-action="zoom" data-zoom="out" aria-label="縮小">−</button><button data-action="zoom" data-zoom="reset" aria-label="ズームをリセット"><span id="zoom-level">${scene.getZoom().toFixed(1)}×</span></button><button data-action="zoom" data-zoom="in" aria-label="拡大">＋</button></div></div>
 ${pages.length>1?`<div class="tank-pagination"><button data-action="tank-page" data-delta="-1" ${tankPage===0?'disabled':''}>← 前の水槽</button><span>${tankPage+1} / ${pages.length}</span><button data-action="tank-page" data-delta="1" ${tankPage>=pages.length-1?'disabled':''}>次の水槽 →</button></div>`:''}
 <div class="camera-bar"><span class="camera-title">水槽の見かた</span><div class="camera-modes" role="group" aria-label="水槽カメラの操作方法"><button data-action="view-mode" data-mode="drag" class="${scene.viewMode==='drag'?'on':''}" aria-pressed="${scene.viewMode==='drag'}">水槽を見わたす</button><button data-action="view-mode" data-mode="follow" class="${scene.viewMode==='follow'?'on':''}" aria-pressed="${scene.viewMode==='follow'}" ${onPage.length?'':'disabled'}>なかまを追いかける</button></div>${scene.viewMode==='follow'?`<label class="follow-select">追いかけるなかま <select id="follow-target" aria-label="追いかけるなかま">${onPage.map((f,i)=>`<option value="${esc(f.uid)}" ${scene.followUid===f.uid?'selected':''}>${esc(displayName(f))} · ${f.showcase?'見本':esc(sexLabel(f))} (${i+1})</option>`).join('')}</select></label>`:`<small data-camera-hint>${scene.getZoom()>(scene.isWideHabitat()?.55:1)?'水槽にふれて動かせます':'＋で拡大すると、水槽にふれて動かせます'}</small>`}</div>
 <div class="tank-primary-actions">
  <button class="primary-btn tank-primary-feed" data-action="feed" ${!matches||!remaining?'disabled':''}>${ico('drop',18)}<span><strong>えさをあげる</strong><small>${selectedFood==='auto'?'おまかせ':esc(FOOD_BY_ID[selectedFood]?.short||'おまかせ')} · あと ${remaining} 回</small></span></button>
  <button class="secondary-btn tank-primary-friends" data-action="open-collection">${ico('fish',19)}<span><strong>なかま配置</strong><small>${occupied} 体</small></span></button>
  <button class="secondary-btn tank-primary-decor" data-action="decor">${ico('leaf',17)}<span><strong>かざり配置</strong></span></button>
 </div>
 <div class="tank-under-actions"><button class="text-control" data-action="toggle-food-picker" aria-expanded="${foodPickerOpen}">えさの種類 ${foodPickerOpen?'−':'＋'}</button><span>${matches?`表示中の${matches}体がお食事できます`:'表示中の仲間はいません'}</span></div>
 ${foodPickerOpen?`<div class="food-section food-picker"><div class="food-choices" role="group" aria-label="えさの種類">${[AUTO_FOOD,...FOODS].map(food=>{const n=onPage.filter(f=>!f.showcase&&canServe(BY_ID[f.species_id],food.id)).length;return `<button class="food-chip ${selectedFood===food.id?'on':''}" data-action="select-food" data-food="${food.id}" aria-pressed="${selectedFood===food.id}"><strong>${esc(food.short)}</strong><small>${food.id==='auto'?'全員に合う':`${n}体が食べる`}</small></button>`}).join('')}</div></div>`:''}
 <button class="size-compare-open" data-action="open-size-compare">${ico('info',15)} <span>この水槽の大きさを比べる</span>${ico('arrow',14)}</button>

 <div class="tank-caption"><strong>今夜の${waterLabels[currentWater]}水槽</strong><small>好感度アップ あと <span id="pet-remain">${Math.max(0,10-state.daily.pet_count)}</span> 回</small></div>${ownedAnimals.length?`<div class="care-summary ${hungry?'needs-care':''}"><span>${hungry?`おなかが低い仲間 <b>${hungry}匹</b>`:'おなかが低い仲間はいません'}</span></div>`:''}
 ${isBreeding?`<button class="danger-btn" data-action="delete-breeding-tank" data-room="${esc(room.id)}">この繁殖用水槽を削除</button>`:''}
 ${isBreeding?`<div class="breeding-card"><button class="breed-heading" data-action="breed-panel" aria-expanded="${breedingOpen}"><span><strong>繁殖</strong><small>この水槽のペア</small></span><b>${pairs.length}組 ${breedingOpen?'−':'＋'}</b></button>${breedingOpen?breedingContent(statuses):''}</div>`:''}
 <div class="section-head"><span class="section-title">表示中のなかまたち</span></div>${onPage.length?`<div class="fish-list">${onPage.map(f=>{const sp=BY_ID[f.species_id];return `<button class="fish-chip ${f.showcase?'showcase-fish':''}" ${f.showcase?`data-action="species" data-id="${esc(sp.id)}"`:`data-action="fish" data-uid="${esc(f.uid)}"`} aria-label="${esc(displayName(f))}を詳しく見る">${img(sp)}<span>${esc(displayName(f))}</span>${f.showcase?'<small class="showcase-tag">デモ見本</small>':sp.kind==='environment'?'':`<small data-fish-care>${esc(sexLabel(f))} · おなか ${E.satietyAt(f)}</small>`}</button>`}).join('')}</div>`:'<button class="secondary-btn" data-action="go" data-screen="explore" style="width:100%">探索する '+ico('arrow',15)+'</button>'}
 `;
}
function breedingContent(statuses){
 const reasons={full:'同じ種類が6匹の上限です（別の展示室も含む）。',partner:'同じ水槽にお相手が必要です。',sex:'同じ水槽に♂と♀が必要です。',growth:'♂と♀の育成度をそれぞれA（40）以上にしましょう。',relatives:'親子・兄弟姉妹ではない♂♀の組合せが必要です。'};
 const outcomes={birth:'前回：赤ちゃんが誕生',rest:'前回：今回はお休み',hungry:'前回：おなかが低くお休み',full:'前回：同じ種類が上限'};
 const rows=statuses.map(info=>{
  const sp=BY_ID[info.speciesId];
  if(!info.pair)return `<div class="pair-row pair-unready"><span><strong>${esc(sp.name)}</strong><small>${esc(reasons[info.reason]||'条件を確認してください。')}</small></span><button class="small-link" data-action="fish" data-uid="${esc(info.subjectUid)}">詳細を見る →</button></div>`;
  const pair=info.pair,timer=state.breeding.timers[pair.key];
  return `<div class="pair-row"><span><strong>${esc(sp.name)}</strong><small>${esc(displayName(pair.male))} ♂ × ${esc(displayName(pair.female))} ♀</small><small class="pair-attention" data-breed-hunger="${esc(pair.key)}" ${info.reason==='hungry'?'':'hidden'}>おなか20未満のため、今は判定をお休み</small>${timer?.last_result?`<small>${esc(outcomes[timer.last_result]||'')}</small>`:''}</span><span class="pair-time">${timer?`次の判定まで <b data-clock="breed" data-breed-key="${esc(pair.key)}">${formatTime(timer.next_at-Date.now())}</b>`:'まもなく開始'}${timer?.demo&&state.settings.demo?`<button class="demo-skip" data-action="skip-breed" data-key="${esc(pair.key)}">デモ：1回判定</button>`:''}</span></div>`;
 }).join('');
 return `<div class="breed-content">${rows||'<p class="empty-pairs">この水槽に動物はいません。</p>'}<p class="breed-foot">${state.breeding.partnerGiftUsed?`次のお相手は${CUBE_NAME}1個で交換できます。`:'最初のお相手は無料です。'}</p></div>`;
}
function formatTime(ms){ms=Math.max(0,ms);const s=Math.ceil(ms/1000),h=Math.floor(s/3600),m=Math.floor(s%3600/60),sec=s%60;return h?`${h}時間 ${String(m).padStart(2,'0')}分`:`${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;}
function poolText(d,spot=null){
 const p=explorationPool(d.id,spot),total=p.reduce((n,id)=>n+E.explorationWeight(state,id),0);
 const first=!state.exploration.has_explored?'初回は行き先に関係なくクマノミが100%です。以下は2回目以降の抽選です。<br>':'';
 return `${first}生きもの抽選 80%・${CUBE_NAME} 15%・かざり 5%<br>候補 ${p.length}種と現在の全体確率：${p.map(id=>`${esc(BY_ID[id].name)} ${(80*E.explorationWeight(state,id)/total).toFixed(2)}%`).join('、')}<br>未発見の生きものは重みを1.5倍にしていますが、再会もあります。動物は同じ種類を6匹までお迎えでき、2匹目は別の性別です。上限の動物と発見済みの環境種・かざりは${CUBE_NAME}に変わります。`;
}
// Static voxel illustration is used only when WebGL is unavailable.
function voyageFallback(){return `<svg class="journey-fallback" viewBox="0 0 360 270" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
 <g class="voyage-bottom"><path fill="var(--voyage-rock)" d="M0 198h25v-22h21v-17h24v16h24v28h24v67H0Zm249 72v-55h24v-21h19v-29h26v16h23v19h19v70Z"/>
 <path fill="var(--voyage-sand)" d="M0 236h49v-17h31v13h22v14h42v24H0Zm211 34v-19h33v-16h34v-14h32v10h50v39Z"/>
 <path fill="var(--voyage-plant)" d="M18 223v-47h8v-15h8v37h8v-26h8v-13h8v53H34v11Zm293 10v-67h8v-20h8v41h8v-28h8v-12h8v69h-16v17Z"/>
 <path fill="var(--voyage-accent)" d="M66 226v-20h7v-22h7v22h7v-28h7v33h7v-18h7v33Zm191 17v-20h7v-20h7v20h7v-31h7v27h7v-14h7v38Z"/></g>
 <g fill="#d5b875"><path d="M109 116h9v-8h12v-8h77v8h12v8h9v30h-9v8h-12v8h-77v-8h-12v-8h-9Z"/><path d="M145 99V84h11v-6h33v6h7v15Zm18-22V65h6v-9h14v5h-9v16Zm66 43h12v12h-12Zm14-10h7v34h-7Zm-6 14h19v6h-19Z"/></g>
 <path fill="#997644" d="M118 150h101v8H130v-4h-12Zm27-50h51v6h-51Zm62 16h12v30h-12Z"/>
 <g fill="#795f3a"><path d="M131 119h30v25h-30Zm45 0h30v25h-30Z"/></g><g fill="#225863"><path d="M135 122h22v19h-22Zm45 0h22v19h-22Z"/></g><g fill="#b9e7d3"><path d="M138 124h8v4h-8Zm45 0h8v4h-8Z"/></g>
 <g fill="var(--voyage-fish)"><path d="M58 86h14v-4h12v4h5v10h-5v4H72v-4H58l-7 6V80Zm204 42h13v-4h11v4h5v9h-5v4h-11v-4h-13l-7 6v-21Z"/></g>
 <g fill="#cfebe0" opacity=".5"><path d="M30 54h4v4h-4Zm63 72h4v4h-4Zm145-59h4v4h-4Zm64 34h4v4h-4Zm27 45h3v3h-3ZM90 42h3v3h-3Z"/></g>
 </svg>`;}
function journeyView(a){
 const destination=DESTINATIONS.find(d=>d.id===a.destination)||DESTINATIONS[0],focus=explorationName(a.destination,a.spot),name=focus?`${destination.name}・${focus}`:destination.name;
 return `<div class="journey-heading"><div><h2>${esc(name)}を探索中</h2></div><span class="journey-heading-icon">${ico('explore',21)}</span></div>
 <section class="journey-panel" aria-label="探索の様子">
  <div class="journey-art" data-journey-scene data-destination="${esc(destination.id)}" data-spot="${esc(a.spot||'')}" aria-hidden="true">
   ${voyageFallback()}
   <div class="journey-art-top"><span>探索中</span><i></i></div>
   <div class="journey-art-caption"><strong data-journey-phase>出発</strong></div>
  </div>
  <div class="journey-progress-card"><div class="journey-progress-head"><span>水族館へ帰るまで</span><strong class="journey-clock" data-clock="active">--:--</strong></div>
   <div class="journey-progress-track" role="progressbar" aria-label="探索の進み具合" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" data-journey-progress><span></span></div>
   <div class="journey-steps">${JOURNEY_STAGES.map((stage,i)=>`<span data-journey-step="${i}">${stage.label}</span>`).join('')}</div>
  </div>
 </section>
 <div class="journey-foot"><button class="secondary-btn" data-action="journey-home">探索ホームに戻る</button>${(a.demo??state.settings.demo)?'<button class="demo-skip" data-action="skip">デモ：待ち時間をスキップ</button>':''}</div>`;
}
function explore(){
 const ex=state.exploration,a=ex.active;if(a&&!exploreHomeForced)return journeyView(a);
 return `<div class="page-head"><h2 class="page-heading">水辺を、探索へ。</h2><p class="page-copy">小さな出会いを、探しに。</p></div>${a?`<button class="today-card" data-action="journey-watch"><span class="today-icon">${ico('explore',19)}</span><span class="today-text"><strong>探索中</strong><small>帰館まで <span data-clock="active"></span></small></span><span class="arrow">${ico('arrow',15)}</span></button>`:''}<div class="ticket-box"><span class="ticket-symbol">${ico('ticket',22)}</span><span class="ticket-info"><strong>探索券</strong><small>${ex.stock===3?'満タンです':`次の1枚まで <span data-clock="stock"></span>`}</small></span><span class="ticket-count">${ex.stock} <span>/ 3</span></span></div><div class="section-head"><span class="section-title">行き先をえらぶ</span><span class="mode-badge">${state.settings.demo?'デモ時間':'リアル時間'}</span></div>${!ex.has_explored?'<p class="first-journey-note">最初の探索は、どこを選んでもクマノミに出会います。</p>':''}<div class="destination-list">${DESTINATIONS.map(d=>{
  const unlocked=E.canExplore(state,d.id),disabled=!unlocked||ex.stock<=0||!!a,pool=explorationPool(d.id,null);
  return `<article class="destination ${unlocked?'':'locked'}"><button class="destination-main" data-action="explore-start" data-id="${d.id}" ${disabled?'disabled':''} aria-label="${esc(d.name)}へ探索に出発"><span class="destination-art ${d.id}">${destIcon(d.id)}</span><span class="destination-info"><strong>${esc(d.name)}</strong><small>${unlocked?esc(d.subtitle):`図鑑 ${d.unlock} 種で解放`}</small><span class="destination-focus">候補 ${pool.length}種</span><span class="destination-time"><span>${state.settings.demo?Math.round(d.demo/1000)+'秒（デモ）':(d.time/3600000)+'時間'}</span><span aria-hidden="true">·</span><span>探索券 1枚</span></span></span><span class="destination-go">${ico(unlocked?'arrow':'lock',16)}</span></button><details class="pool-details"><summary>この場所の出現テーブルを見る ＋</summary><div class="pool-copy">${poolText(d,null)}</div></details></article>`;
 }).join('')}</div><p class="ad-note">探索券は${state.settings.demo?'5秒':'3時間'}ごとに回復（最大3枚）</p>`;
}
function dexResults(){
 let filtered=P.filterCatalog(state,{biome:dexFilter,status:dexStatus,query:dexQuery,size:'all'});
 if(dexSort==='group')filtered=[...filtered].sort(compareDex);
 else if(dexSort==='name')filtered=[...filtered].sort((a,b)=>a.name.localeCompare(b.name,'ja'));
 else if(dexSort==='found')filtered=[...filtered].sort((a,b)=>(state.dex.discovered.includes(b.id)-state.dex.discovered.includes(a.id))||a.number-b.number);
 const known=new Set(state.dex.discovered),showcase=Demo.showcaseEnabled(state);
 const active=[dexStatus!=='all',dexFilter!=='すべて',!!dexQuery].filter(Boolean).length;
 return `<p class="dex-result-count" role="status">${filtered.length}項目を表示${active?` · 条件 ${active}件`:''}${dexSort==='group'?' · 番号は従来のまま':''}</p>${filtered.length?`<div class="dex-grid">${filtered.map((sp,i)=>{const heading=dexSort==='group'&&(i===0||dexGroup(filtered[i-1])!==dexGroup(sp))?`<div class="dex-group-heading">${esc(groupLabel(dexGroup(sp)))}${dexGroup(sp)==='invertebrate-attached'?'<small style="display:block;font-weight:400;margin-top:4px">成体の普段の暮らし方による表示です。イソギンチャクなどはゆっくり移動することもあります。</small>':''}${dexGroup(sp)==='plant'?'<small style="display:block;font-weight:400;margin-top:4px">水草と海藻は植物・藻類の展示上のまとめです。</small>':''}</div>`:'';const found=known.has(sp.id),visible=found||showcase;return `${heading}<button class="dex-cell ${visible?'':'unknown'} ${visible&&!found?'showcase-cell':''}" data-action="species" data-id="${sp.id}" aria-label="${visible?esc(sp.name):`未発見 ${sp.number}番`} 種の詳細"><span class="number">${String(sp.number).padStart(3,'0')}</span>${visible?`${img(sp)}<span class="name">${esc(sp.name)}</span>${!found?'<span class="showcase-dex-tag">見本</span>':''}<span class="rarity-mark">${RARITY[sp.rarity].symbol}</span>`:`<span class="unknown-fish">${ico('fish',34)}</span><span class="qmark">?</span><span class="name">未発見</span>`}</button>`}).join('')}</div>`:'<div class="dex-empty">条件に合う仲間はいません。<br>検索や絞り込みを変えてみましょう。</div>'}`;
}
function updateDexResults(){const el=$('#dex-results');if(el)el.innerHTML=dexResults();}

function dex(){const n=E.currentDiscoveredCount(state),next=AWARD_THRESHOLDS.find(x=>x>n&&x<=CATALOG.length);return `<div class="page-head"><h2 class="page-heading">いきもの図鑑</h2><p class="page-copy">出会いを、ここに。</p></div>${Demo.showcaseEnabled(state)?'<p class="showcase-banner">デモ全公開中（見本は発見数に含みません）</p>':''}<div class="dex-progress"><div class="dex-progress-top"><strong>出会いのきろく</strong><span>${n} <small>/ ${CATALOG.length} 種</small></span></div><div class="progress-track"><div class="progress-fill" style="width:${100*n/CATALOG.length}%"></div></div><p>${next?`次の館長賞まで ${next-n} 種`:'すべての館長賞を達成'}</p></div>${momentShortcut()}
 <section class="dex-filter-panel" aria-label="図鑑の絞り込み"><label class="dex-search-label" for="dex-search">名前や番号でさがす</label><div class="dex-search-wrap">${ico('search',16)}<input id="dex-search" type="search" value="${esc(dexQuery)}" placeholder="名前・つけた名前・番号" autocomplete="off"><button data-action="clear-dex-search" aria-label="検索を消す" ${dexQuery?'':'hidden'}>×</button></div>
 <div class="dex-filter-grid"><label>状況 <select id="dex-status-select" data-dex-status-select>${[['all','すべて'],['known','出会った'],['unknown','未発見']].map(([id,label])=>`<option value="${id}" ${dexStatus===id?'selected':''}>${label}</option>`).join('')}</select></label><label>入れる水槽 <select id="dex-habitat-select" data-dex-habitat-select>${[['すべて','すべて'],...ROOMS.map(r=>[r.id,r.short])].map(([id,label])=>`<option value="${esc(id)}" ${dexFilter===id?'selected':''}>${esc(label)}</option>`).join('')}</select></label><label>並び替え <select id="dex-sort-select" data-dex-sort-select>${[['group','生きものの仲間順'],['number','番号順'],['name','名前順'],['found','出会った順']].map(([id,label])=>`<option value="${id}" ${dexSort===id?'selected':''}>${label}</option>`).join('')}</select></label></div>
 <div class="dex-filter-actions"><span>${dexStatus!=='all'||dexFilter!=='すべて'||dexQuery?'条件を設定中':'条件なし'}</span><button class="small-link" data-action="clear-dex-filters">条件をクリア</button></div></section><div id="dex-results">${dexResults()}</div>`;}

function switchRow(label,desc,key){const on=state.settings[key];return `<div class="setting-row"><span><strong>${label}</strong><small>${desc}</small></span><button class="switch ${on?'on':''}" data-action="toggle-setting" data-key="${key}" role="switch" aria-checked="${on}" aria-label="${label}"></button></div>`;}
function settings(){return `<div class="page-head"><h2 class="page-heading">設定</h2><p class="page-copy">心地よい過ごし方に整えましょう。</p></div><div class="settings-title">音とあかり</div><div class="settings-group">${switchRow('BGM','初期設定はオフ','bgm')}${switchRow('効果音','タップ音など','sfx')}<div class="setting-row"><span><strong>水槽の明るさ</strong><small>文字の明るさは変わりません</small></span><span class="segmented">${[['soft','控えめ'],['normal','標準'],['bright','明るめ']].map(([v,l])=>`<button class="${state.settings.brightness===v?'on':''}" data-action="set-setting" data-key="brightness" data-value="${v}">${l}</button>`).join('')}</span></div></div><div class="settings-title">表示</div><div class="settings-group"><div class="setting-row"><span><strong>文字サイズ</strong><small>3段階から選べます</small></span><span class="segmented">${[['normal','標準'],['large','大'],['larger','特大']].map(([v,l])=>`<button class="${state.settings.text_size===v?'on':''}" data-action="set-setting" data-key="text_size" data-value="${v}">${l}</button>`).join('')}</span></div>${switchRow('色覚サポート','レア度を記号でも表示します','colorblind')}</div><div class="settings-title">探索とデータ</div><div class="settings-group">${switchRow('デモ時間','券5秒・探索30〜60秒・繁殖1分','demo')}${switchRow('デモ全公開',`全${CATALOG.length}種と全水槽を公開。未獲得は見本`,'demo_showcase')}<div class="setting-row"><span><strong>自動セーブ</strong><small data-backup-message>${esc(backup.label())}</small></span><span class="mode-badge">自動</span></div><div class="backup-controls"><details class="compact-help"><summary>保存について</summary><p>プレビューはこのワークスペースにも保存します。別URL・端末への移動や消失に備え、JSONを書き出してください。共有URLを他の人に渡さないでください。</p></details><button class="small-link" data-action="backup-retry" data-backup-retry ${['offline','local'].includes(backup.status)?'':'hidden'}>バックアップを再確認 →</button><button class="small-link" data-action="backup-conflict" data-backup-conflict ${backup.status==='conflict'?'':'hidden'}>異なるセーブを確認 →</button></div></div>${archiveSettings()}<div class="settings-title">セーブを持ち運ぶ</div><div class="settings-group save-transfer"><p>JSONを使って別のURLやブラウザへ移せます。</p><div class="save-transfer-actions"><button class="secondary-btn" data-action="export-current">${ico('share',15)} 現在のセーブを書き出す</button><button class="secondary-btn" data-action="select-import" ${storageReadOnly?'disabled':''}>ファイルから読み込む</button></div><small>読込は現在の進行を上書きします。直前の状態には1回戻せます。</small>${state.importRecovery?.original?'<button class="small-link restore-link" data-action="restore-confirm">読み込み前の状態に戻す →</button>':''}${transferNotice?`<p class="transfer-notice" role="status">${esc(transferNotice)}</p>`:''}</div><p class="settings-note">単体HTMLは端末内に保存します。進行中の探索時間は設定変更後も変わりません。</p>${state.previous?.original?'<button class="secondary-btn backup-btn" data-action="export-previous">前の水槽のセーブを保存</button>':''}${state.legacy?.original?'<button class="secondary-btn backup-btn" data-action="export-legacy">さらに前のセーブを保存</button>':''}${protectedRaw?'<button class="secondary-btn backup-btn" data-action="export-protected">保護した元データを保存</button>':''}<button class="danger-btn" data-action="reset-confirm" ${storageReadOnly?'disabled':''}>セーブデータを初期化</button>`;}
// Stable selectors allow focus and horizontal scroll to survive an in-place update.
function focusSelector(el){
 if(!el||el===document.body)return null;
 if(el.id)return `#${CSS.escape(el.id)}`;
 if(!el.dataset?.action)return null;
 let selector=`[data-action="${CSS.escape(el.dataset.action)}"]`;
 for(const key of ['uid','id','index','delta','key','food','room','screen','mode','water','value','zoom','filter','status','size','preset','dir','spot','section'])if(el.dataset[key]!==undefined)selector+=`[data-${key}="${CSS.escape(el.dataset[key])}"]`;
 if(el.classList.contains('fish-chip'))selector+='.fish-chip';else if(el.classList.contains('nav-item'))selector+='.nav-item';else if(el.closest('.pair-unready'))selector='.pair-unready '+selector;
 return selector;
}
function restoreFocus(root,selector){if(!selector)return false;try{const target=root.querySelector(selector);if(target&&!target.disabled){target.focus({preventScroll:true});return document.activeElement===target;}}catch(_){}return false;}
function render(){
 if(screen!=='dex'&&dexComposing){dexComposing=false;dexRefreshPending=false;}
 if(screen==='dex'&&screen===lastRenderedScreen&&dexComposing&&!modal){dexRefreshPending=true;return;}
 const revealRoom=screen==='tank'&&(lastRenderedScreen!=='tank'||lastTankRenderedRoom!==currentRoom);
 const sameScreen=screen===lastRenderedScreen,previousScroll=sameScreen?($('#screen-content')?.scrollTop||0):0,foodScroll=sameScreen?($('.food-choices')?.scrollLeft||0):0,statusScroll=sameScreen?($('.dex-status-filters')?.scrollLeft||0):0,biomeScroll=sameScreen?($('.filters')?.scrollLeft||0):0,sizeScroll=sameScreen?($('.dex-size-filters')?.scrollLeft||0):0,roomScroll=sameScreen?($('.room-switcher')?.scrollLeft||0):0;
 const active=sameScreen&&app.contains(document.activeElement)?document.activeElement:null,focused=focusSelector(active),searchSelection=active?.id==='dex-search'?[active.selectionStart,active.selectionEnd]:null;
 if(lastRenderedScreen==='tank'&&screen!=='tank')scene.clearFood();
 journeyScene.detach();scene.detach();if(!state.exploration.active)journeyScene.disposeWorld();shell.dataset.text=state.settings.text_size;shell.dataset.brightness=state.settings.brightness;shell.dataset.colorblind=state.settings.colorblind?'on':'off';
 if(screen==='title'){
  app.innerHTML=renderTitle();const stage=$('#title-fish-stage');scene.attach(stage,'title');
  const preview=[idOfScientific('Amphiprion clarkii'),idOfScientific('Paracheirodon innesi'),idOfScientific('Aurelia coerulea'),idOfScientific('Hippocampus coronatus')].map((id,i)=>({uid:'preview_'+i,species_id:id,size:i===2?.85:1})),signature='title';
  if(signature!==lastSceneSignature){scene.setFish(preview,'title');lastSceneSignature=signature;}
 }else{
  const body=screen==='home'?home():screen==='tank'?tank():screen==='explore'?explore():screen==='dex'?dex():settings();
  app.innerHTML=`${header()}<main class="screen-content" id="screen-content">${conflictBanner()}${body}</main>${nav()}`;
  if(screen==='tank'){
   const fishes=Demo.waterDisplay(state,currentRoom,currentWater,null),env=fishes.filter(f=>BY_ID[f.species_id].kind==='environment'),{onPage}=currentDisplayPage(currentRoom,currentWater),shown=[...onPage,...env];
   scene.attach($('#room-scene'),'tank');scene.setHabitat(sceneHabitatFor(currentRoom));
   // Preserve the animated models when only controls change; rebuild on real
   // geometry/placement changes, including the growing size of born animals.
   const signature=JSON.stringify(['tank',...shown.map(f=>[f.uid,f.species_id,f.size,f.hue_shift,f.placed,f.parents?.length?f.growth:null])]);
   if(signature!==lastSceneSignature){scene.setFish(shown,'tank');lastSceneSignature=signature;}
   scene.setLight(state.tank.light);scene.setDecor(state.tank.decor,state.tank.quantities,L.visibleDecor(state,currentRoom,currentWater));
   scene.setMomentPairs([],`${currentRoom}:none`);
  }else if(screen==='explore'&&state.exploration.active&&!exploreHomeForced){
   journeyScene.attach($('[data-journey-scene]'),state.exploration.active);
  }
 }
 if($('#screen-content'))$('#screen-content').scrollTop=previousScroll;if($('.food-choices'))$('.food-choices').scrollLeft=foodScroll;if($('.dex-status-filters'))$('.dex-status-filters').scrollLeft=statusScroll;if($('.filters'))$('.filters').scrollLeft=biomeScroll;if($('.dex-size-filters'))$('.dex-size-filters').scrollLeft=sizeScroll;if($('.room-switcher')){$('.room-switcher').scrollLeft=roomScroll;const on=$('.room-switcher .active'),strip=$('.room-switcher');if(revealRoom&&on&&(on.offsetLeft<strip.scrollLeft||on.offsetLeft+on.offsetWidth>strip.scrollLeft+strip.clientWidth))strip.scrollLeft=Math.max(0,on.offsetLeft-strip.clientWidth/2+on.offsetWidth/2);}
 if(!modal&&restoreFocus(app,focused)&&searchSelection&&document.activeElement?.id==='dex-search')document.activeElement.setSelectionRange(...searchSelection);if(screen==='tank')lastTankRenderedRoom=currentRoom;lastRenderedScreen=screen;updateClocks();updateBackupUI();updateFeedUI();
}

function modalIdentity(m){return `${m?.type||''}:${m?.uid||m?.id||''}`;}
function openModal(m){
 clearTimeout(toastTimer);$('#toast').classList.remove('visible');
 if(!modal){modalScrolls.clear();modalDrafts.clear();modalOpener=document.activeElement;modalOpenerSelector=focusSelector(modalOpener);modalOpenerScreen=screen;}
 modal=m;app.inert=true;renderModal();
}
function endModal(restore=true){
 const opener=modalOpener,selector=modalOpenerSelector,openerScreen=modalOpenerScreen;if(modal?.type==='import-confirm')pendingImport=null;
 modal=null;layer.hidden=true;layer.innerHTML='';delete layer.dataset.modalKey;app.inert=false;modalScrolls.clear();modalDrafts.clear();modalOpener=null;modalOpenerSelector=null;modalOpenerScreen=null;
 if(restore&&screen===openerScreen){if(opener?.isConnected&&!opener.disabled)opener.focus({preventScroll:true});else restoreFocus(app,selector);}
}
function closeModal(){endModal();pumpPending();}
function modalWrap(content,close=true){const labels={pending:'お知らせ',fish:'仲間の詳細',roster:'同じ種類の個体一覧',collection:'なかま・配置',species:'図鑑の詳細',decor:'水槽のかざり',layout:'水槽の模様替え',moments:'ふたりのワンシーン','size-compare':'水槽の大きさ比べ',light:'水槽のあかり',move:'展示室を選ぶ',reset:'初期化の確認','import-confirm':'セーブの読み込み確認','restore-confirm':'読み込み前に戻す確認','backup-conflict':'セーブの確認','breeding-create':'繁殖用水槽を作る','material-info':CUBE_NAME};return `<div class="sheet ${close?'has-close':''}" role="dialog" aria-modal="true" aria-label="${esc(labels[modal?.type]||'詳細')}" tabindex="-1">${close?`<div class="sheet-bar"><button class="sheet-close" data-action="close-modal" aria-label="閉じる">${ico('close',16)}</button></div>`:''}${content}</div>`;}
function pendingBody(event){if(event.type==='award'){const previous=E.currentDiscoveredCount(state)<event.threshold;return `<div class="modal-center"><div class="modal-fish-frame" style="color:#e2c58b">${ico('spark',65)}</div><h2 class="modal-heading">${previous?'前版の館長賞':'館長賞'}</h2><p class="modal-copy">${previous?`前版の図鑑で ${event.threshold} 種を集めた記録です。新しい図鑑の進捗とは別に保存されています。`:`図鑑に ${event.threshold} 種が集まりました。<br>探索券とえさを、上限の範囲でお届けしました。`}</p><div class="modal-actions"><button class="primary-btn" data-action="ack-pending">ありがとう</button></div></div>`;}
 const r=event.result||{},sp=BY_ID[r.id],stored=!!(r.uid&&state.fish_instances.find(f=>f.uid===r.uid)?.placed===false&&sp?.kind!=='environment'),prefix=event.type==='birth'?'A LITTLE NEW LIFE':event.type==='today'?'TODAY’S FRIEND':event.type==='evolution'?'EARLIER RECORD':'WELCOME BACK';
 let title,copy,image;
 if(r.type==='fish'&&sp){title=event.type==='birth'?'赤ちゃんが生まれました':event.type==='evolution'?'前版の仲間の記録':r.known?'同じ種類の仲間がきました':'新しい仲間がきました';copy=stored?`${esc(sp.name)}は水槽がいっぱいのため、お迎え待ちです。空きのある水槽に配置できます。`:event.type==='birth'?`${esc(sp.name)}の小さな命が、水槽に加わりました。`:`${esc(sp.name)}が、水槽に加わりました。`;image=img(sp,'modal-fish');}
 else if(r.type==='duplicate'&&sp){title=CUBE_NAME+'を発見';copy=`${esc(sp.name)}は上限のため、${CUBE_NAME}1個になりました。`;image=cubeIcon(96);}
 else if(r.id&&!sp){title='前版の仲間を保管しています';copy='この記録は新しい展示には含めず、セーブと一緒に保管しています。設定で一覧と書き出しを確認できます。';image=ico('fish',64);}
 else if(r.type==='decor'){title='海のかざりを発見';copy=`「${DECORS[r.decor]}」が使えるようになりました。`;image=ico('leaf',64);}
 else if(r.type==='material'){title=CUBE_NAME+'を発見';copy='1個手に入れました';image=cubeIcon(96);}
 else {title='探索が終わりました';copy='水族館に戻りました。';image=ico('spark',64);}
 return `<div class="modal-center"><div class="modal-fish-frame">${image}</div><h2 class="modal-heading">${title}</h2><p class="modal-copy">${copy}</p>${event.type==='evolution'?'<p class="sheet-foot">前版で受け取ったお知らせです。記録はセーブに保管されています。</p>':''}<div class="modal-actions"><button class="primary-btn" data-action="ack-pending" data-route="${r.type==='fish'&&sp?(stored?'collection':'tank'):''}">${r.type==='fish'&&sp?(stored?'配置をえらぶ':'水槽で会う'):'確認する'} ${ico('arrow',15)}</button></div></div>`;}
function requirementLabel(item){
 if(item.type==='growth')return `育成度 ${item.current} / ${item.target}（${item.target===100?'S':'A'}）`;
 if(item.type==='light')return item.mode==='seen'?`ライト「${LIGHTS[item.id]}」を体験 · ${item.met?'体験済み':'未体験'}`:`ライト「${LIGHTS[item.id]}」 · 現在 ${LIGHTS[item.current]}`;
 if(item.type==='count')return `${DECORS[item.id]} ${item.current} / ${item.target}`;
 if(item.type==='tag')return `ゲーム属性「${item.id}」の環境種 · ${item.met?'展示中':'未展示'}`;
 if(item.type==='dex')return `図鑑 ${item.current} / ${item.target} 種`;
 if(item.type==='synergies')return `現在の共生 ${item.current} / ${item.target} 組`;
 return '条件';
}
function evolutionSection(f,opts){
 const needsLight=opts.some(o=>!o.already&&o.requirements.some(r=>r.type==='light'&&!r.met));
 const rows=opts.map(o=>{const done=o.requirements.filter(x=>x.met).length,total=o.requirements.length;return `<div class="evo-row ${o.ready&&!o.already?'evo-ready':''}" data-evolution-id="${esc(o.id)}"><div class="evo-row-head"><strong>${o.already?esc(o.name):'？？？'}</strong><span>${o.already?'✓ 発見済み':o.ready?'✦ 条件達成':`${done} / ${total} 達成`}</span></div><ul class="evo-checklist">${o.requirements.map(item=>`<li class="${item.met?'met':'unmet'}"><span class="evo-flag">${item.met?'✓ 達成':'○ 未達成'}</span><span>${esc(requirementLabel(item))}</span></li>`).join('')}</ul>${o.ready&&!o.already?`<button class="primary-btn" data-action="evolve" data-uid="${esc(f.uid)}" data-id="${esc(o.id)}">新しい姿を発見 ${ico('spark',13)}</button>`:''}</div>`;}).join('');
 return `<div class="evo-title" id="evo-title" tabindex="-1">進化のヒント</div><p class="sheet-foot">条件ごとに達成状況を表示します。かざりと同じ水槽に展示中の環境種を合算し、共生は現在成立している組数で判定します。</p>${needsLight?'<button class="small-link light-shortcut" data-action="open-light">ライトを1回切り替える →</button>':''}${rows||'<p class="sheet-foot">この仲間の分岐は、ここまでです。</p>'}`;
}
function placementLabel(f){
 const def=E.tankDefinition(state,E.displayRoom(f));
 return def?.name||'展示室';
}
function collectionBody(){
 const room=E.tankDefinition(state,currentRoom)||ROOMS[0],fish=Demo.waterDisplay(state,currentRoom,currentWater,null);
 const ownedPages=E.tankPages(state,currentRoom),active=Math.min(state.tank_views[currentRoom]?.active||0,Math.max(0,ownedPages.length-1));
 const pageOf=new Map();ownedPages.forEach((pg,i)=>pg.forEach(uid=>pageOf.set(uid,i)));
 const row=f=>{const sp=BY_ID[f.species_id],sample=!!f.showcase,detail=sample?'デモ見本':sp.kind==='environment'?(f.placed===false?'しまっています':'環境種'):`${sexLabel(f)} · おなか ${E.satietyAt(f)}`;
  const pageSelect=sample||sp.kind==='environment'?'':`<label class="page-assign">入れる水槽 <select data-page-select data-uid="${esc(f.uid)}">${ownedPages.map((pg,i)=>`<option value="${i}" ${pageOf.get(f.uid)===i?'selected':''}>水槽 ${i+1}</option>`).join('')}</select></label>`;
  return `<div class="collection-row"><button class="collection-subject" ${sample?`data-action="species" data-id="${esc(sp.id)}"`:`data-action="fish" data-uid="${esc(f.uid)}"`} aria-label="${esc(displayName(f))}の詳細と名前"><span class="collection-thumb">${img(sp)}</span><span><strong>${esc(displayName(f))}</strong><small>${esc(detail)}${f.nickname?` · ${esc(sp.name)}`:''}</small></span>${ico('arrow',14)}</button>${pageSelect}${sample?'':`<button class="collection-move" data-action="move-dialog" data-uid="${esc(f.uid)}" aria-label="${esc(displayName(f))}の配置を変える">配置</button>`}</div>`;};
 return `<h2 class="modal-heading">なかま・配置</h2><p class="modal-copy">${esc(room.name)} <b class="collection-cap">${E.tankOccupancy(state,currentRoom)} 体</b></p>
 <p class="modal-copy">同じ展示室の水槽を切り替えます。お世話とかざりは展示室で共通です。</p><div class="page-tabs" role="group" aria-label="水槽を選ぶ">${ownedPages.map((pg,i)=>`<button data-action="set-display-page" data-index="${i}" class="${i===active?'active':''}" aria-pressed="${i===active}">水槽 ${i+1}（${pg.length}体）</button>`).join('')}<button class="add-tank" data-action="add-display-page">＋ 水槽を追加</button></div>
 <div class="collection-section-title"><strong>この水槽</strong><span>${fish.length}体${Demo.showcaseEnabled(state)?'（見本を含む）':''}</span></div><div class="collection-list">${fish.length?fish.map(row).join(''):'<p class="collection-empty">まだ仲間はいません。</p>'}</div>`;
}
function moveBody(f){
 const sp=f&&BY_ID[f.species_id];if(!sp)return '';
 const tanks=E.allTanks(state).filter(t=>compatibleRooms(sp).includes(t.breeding?t.habitat:t.id));
 const options=tanks.map(t=>{const check=E.placementCheck(state,f,t.id),n=E.tankOccupancy(state,t.id),here=check.same;
   const status=!E.canEnterRoom(state,t.id)?`図鑑 ${t.threshold} 種で解放`:here?'いまの水槽':`${n} 体`;
   return `<button class="move-option" data-action="move" data-uid="${esc(f.uid)}" data-room="${esc(t.id)}" ${check.ok&&!here?'':'disabled'}><span>${esc(t.name)}</span><span>${esc(status)}</span></button>`;}).join('');
 return `<h2 class="modal-heading">水槽をえらぶ</h2><p class="modal-copy">${esc(displayName(f))}の配置先。</p><div class="move-list">${options||'<p class="modal-copy">移動できる水槽がありません。</p>'}</div>`;
}
function rosterBody(sp){
 const fish=state.fish_instances.filter(f=>f.species_id===sp.id);
 return `<div class="roster-header"><div><h2 class="modal-heading">${esc(sp.name)}のなかま</h2><p class="modal-copy">${fish.length}匹からえらぶ。</p></div>${img(sp,'roster-art')}</div><div class="roster-list">${fish.map((f,i)=>{const room=ROOMS.find(r=>r.id===E.displayRoom(f)),env=sp.kind==='environment',value=env?'環境種':`${sexLabel(f)} · 育成 ${f.growth}/100 · おなか ${E.satietyAt(f)}`;return `<button class="roster-item" data-action="fish" data-uid="${esc(f.uid)}" aria-label="${esc(displayName(f))} ${i+1}番を詳しく見る"><span><strong>${esc(displayName(f))} <small>0${i+1}</small></strong><small>${esc(room?.short||'展示室')} · ${waterLabels[E.waterGroup(sp)]}</small><small>${esc(value)}</small></span>${ico('arrow',15)}</button>`;}).join('')}</div>`;
}
function fishBody(f){
 const sp=BY_ID[f.species_id],opts=E.evolutionOptions(state,f),remaining=Math.max(0,10-state.daily.pet_count),env=sp.kind==='environment',profile=env?null:careProfile(sp);
 const label=sp.number?`NO. ${String(sp.number).padStart(3,'0')}`:'前バージョンのなかま';
 const traits=speciesFacts(sp);
 const partner=env?null:E.partnerCost(state,f.uid),notFoods=env?[]:FOODS.filter(x=>!profile.foods.includes(x.id)),parents=(f.parents||[]).map(uid=>state.fish_instances.find(x=>x.uid===uid)).filter(Boolean);
 const care=env?`<p class="sheet-foot">環境種は水底に展示します。しまうと共生の判定には使えません。魚と異なる生き物のため、このゲームでは餌・繁殖の対象外です。</p><button class="primary-btn" style="width:100%;margin-top:12px" data-action="toggle-env" data-uid="${esc(f.uid)}">${f.placed===false?'この水槽に展示する':'展示をしまう'}</button>`:`<div class="identity-line"><span>${esc(sexLabel(f))}</span><span>おなか <b data-detail-satiety="${esc(f.uid)}">${E.satietyAt(f)} / 100</b></span></div>
 <div class="stats-line"><span>育成度 <b>${f.growth} / 100</b></span><span>${f.growth>=100?'S':f.growth>=40?'A':'育成中'} · 好感度 ${f.affinity||0}</span></div><div class="growth-bar"><span style="width:${f.growth}%"></span></div>
 <div class="detail-controls"><button class="primary-btn" data-action="pet-modal" data-uid="${esc(f.uid)}">${ico('heart',15)} <span>なでる<br><small>好感度 あと${remaining}回</small></span></button><button class="secondary-btn" data-action="material" data-uid="${esc(f.uid)}" ${state.materials<1||f.growth>=100?'disabled':''}>${cubeIcon(22)} <span>栄養キューブ<br><small>育成＋10 · 1個（所持 ${state.materials}）</small></span></button></div>
 <div class="personality-note"><small>この子の性格</small><strong>${esc(personalityFor(f).label)}</strong><span>${esc(personalityFor(f).description)}</span></div>
 <div class="diet-box"><strong>この子のお食事</strong><div><b>好き</b> ${esc(FOOD_BY_ID[profile.favorite].label)}</div><div><b>食べられる</b> ${profile.foods.map(id=>esc(FOOD_BY_ID[id].short)).join('、')}</div></div>

 <div class="individual-actions"><button class="secondary-btn" data-action="follow-fish" data-uid="${esc(f.uid)}" ${f.placed===false?'disabled':''}>この子を水槽で追う</button>${partner!==null?`<button class="secondary-btn" data-action="invite-partner" data-uid="${esc(f.uid)}" ${state.materials<partner?'disabled':''}>お相手を迎える ${partner===0?'（最初は無料）':`（キューブ ${partner}個）`}</button>`:''}${state.settings.demo&&f.growth<40?`<button class="demo-skip" data-action="demo-grow" data-uid="${esc(f.uid)}">デモ：育成度をAまで進める</button>`:''}</div>
 ${parents.length?`<p class="sheet-foot">親：${parents.map(x=>esc(displayName(x))).join(' × ')}</p>`:''}
 <div class="journal"><strong>この子の観察ノート</strong>${(f.care?.journal||[]).length?(f.care.journal||[]).slice(0,5).map(item=>`<div><time>${esc(new Date(item.at).toLocaleDateString('ja-JP'))}</time> ${esc(item.text)}</div>`).join(''):'<small>これからの出来事を記録します。</small>'}</div>
 `;
 return `<button class="small-link roster-back" data-action="back-species" data-id="${esc(sp.id)}">← 図鑑のページに戻る</button>${modal?.fromCollection?'<button class="small-link roster-back" data-action="back-collection">← なかま・配置に戻る</button>':modal?.fromRoster?`<button class="small-link roster-back" data-action="back-roster" data-id="${esc(modal.fromRoster)}">← 個体一覧に戻る</button>`:''}<div class="detail-head"><div class="detail-number">${label}</div>${img(sp,'modal-fish')}<h2 class="detail-name">${esc(displayName(f))}</h2>${f.nickname?`<p class="detail-species">${esc(sp.name)}</p>`:''}<span class="rare-label">${RARITY[sp.rarity].symbol} ${RARITY[sp.rarity].name} · ${waterLabels[E.waterGroup(sp)]} · おすすめ ${esc(ROOMS.find(r=>r.id===preferredRoom(sp))?.short||'展示室')}</span></div>${!env?`<div class="name-edit name-edit-top"><label for="nickname-input">この子の名前</label><div><input id="nickname-input" maxlength="24" value="${esc(f.nickname||'')}" placeholder="名前をつける（12文字まで）"><button class="secondary-btn" data-action="rename" data-uid="${esc(f.uid)}">保存</button></div></div>`:''}<div class="detail-location"><span>${esc(placementLabel(f))}</span><button class="small-link" data-action="move-dialog" data-uid="${esc(f.uid)}">配置を変える →</button></div>${care}<details class="species-fold"><summary>生きものの特徴・資料</summary>${traits}</details>`;
}
function unknownBody(sp){
 const found=state.dex.discovered.includes(sp.id),showcase=Demo.showcaseEnabled(state),visible=found||showcase,sample=showcase&&Demo.showcaseSamples(state).find(f=>f.species_id===sp.id);
 const members=state.fish_instances.filter(f=>f.species_id===sp.id&&BY_ID[f.species_id]);
 const rooms=compatibleRooms(sp).map(id=>ROOMS.find(r=>r.id===id)?.short).filter(Boolean).join('・');
 return `<div class="modal-center"><div class="modal-fish-frame" style="color:#7ea6a1">${visible?img(sp,'modal-fish'):ico('fish',85)}</div><h2 class="modal-heading">${visible?esc(sp.name):'まだ出会っていない仲間'}</h2><p class="modal-copy">${visible?`入れる水槽：${esc(rooms)}`:'探索または今日の魚から出会えます。'}</p>${visible?speciesFacts(sp):''}${members.length?`<div class="species-individuals"><h3>この種の個体</h3>${members.map((f,i)=>`<button class="roster-item" data-action="fish" data-uid="${esc(f.uid)}"><span><strong>${esc(displayName(f))}</strong><small>${esc(placementLabel(f))} · ${esc(sexLabel(f))} · 育成 ${f.growth}/100</small></span>${ico('arrow',15)}</button>`).join('')}</div>`:''}${sample?`<div class="modal-actions"><button class="primary-btn" data-action="view-showcase" data-id="${esc(sp.id)}">水槽の見本を見る ${ico('arrow',15)}</button><button class="secondary-btn" data-action="adopt-showcase" data-id="${esc(sp.id)}">この見本をお迎え（デモ）</button></div>`:''}</div>`;
}
function sizeCompareBody(){
 const {onPage}=currentDisplayPage(currentRoom,currentWater);
 const fish=onPage.filter(f=>BY_ID[f.species_id]?.kind!=='environment');
 const items=fish.map(f=>{const sp=BY_ID[f.species_id];const value=(Number(sp.referenceCm)||0)*(Number.isFinite(f.size)?f.size:1);return {f,sp,value};}).sort((a,b)=>b.value-a.value);
 const max=Math.max(.001,...items.map(x=>x.value));
 return `<h2 class="modal-heading">この水槽の大きさ比べ</h2>
 <div class="compare-list">${items.map(({f,sp,value})=>`<div class="compare-row" data-compare-id="${esc(sp.id)}" data-comparison-value="${value.toFixed(4)}">${img(sp,'compare-icon')}<div class="compare-info"><div class="compare-name"><strong>${esc(displayName(f))}</strong></div><small>${esc(sp.referenceUnit)} 約 ${esc(formatReference(value))}${f.showcase?' · 見本':''}</small><div class="compare-track" aria-hidden="true"><span style="width:${Math.min(100,Math.max(0,value/max*100)).toFixed(3)}%"></span></div></div></div>`).join('')||'<p class="modal-copy">このページに動物はいません。</p>'}</div>`;
}
function layoutBody(){
 const items=L.visibleDecor(state,currentRoom,currentWater);if(!items.some(p=>p.type===layoutSelection?.type&&p.index===layoutSelection?.index))layoutSelection=items.length?{type:items[0].type,index:items[0].index}:null;
 const selected=items.find(p=>p.type===layoutSelection?.type&&p.index===layoutSelection?.index),bounds=L.LAYOUT_BOUNDS;
 const pct=(n,min,max)=>(7.5+85*(n-min)/(max-min)).toFixed(2);
 const map=items.map(p=>{const on=p.type===selected?.type&&p.index===selected?.index,name=DECORS[p.type]+' '+(p.index+1),symbol=p.type==='plants'?'♧':p.type==='rock'?'◆':'≈';
  return `<button class="layout-item layout-${p.type} ${on?'selected':''}" data-action="layout-select" data-layout-item data-id="${p.type}" data-index="${p.index}" style="left:${pct(p.x,bounds.minX,bounds.maxX)}%;top:${pct(p.z,bounds.minZ,bounds.maxZ)}%" aria-label="${name}、角度${p.rotation}度" aria-pressed="${on}"><span class="layout-symbol" style="transform:rotate(${p.rotation}deg)">${symbol}</span><small>${p.index+1}</small></button>`;
 }).join('');
 const name=selected?`${DECORS[selected.type]} ${selected.index+1}`:'選択できるかざりはありません';
 return `<h2 class="modal-heading">水槽の模様替え</h2><p class="modal-copy">上から見た図です。かざりをつまんで動かすか、矢印で調整できます。</p><div class="layout-scope">${esc(ROOMS.find(r=>r.id===currentRoom)?.short||'展示室')} · ${waterLabels[currentWater]}水槽だけの配置</div><div class="layout-map" id="layout-map" role="group" aria-label="水槽を上から見た配置図。上が奥、下が手前です"><span class="layout-back-label">奥</span><span class="layout-front-label">手前</span>${map||'<span class="layout-empty">先に、かざりの数を増やしましょう。</span>'}</div><div class="layout-item-list" role="group" aria-label="配置するかざりを選ぶ">${items.map(p=>`<button class="layout-chip ${p.type===selected?.type&&p.index===selected?.index?'selected':''}" data-action="layout-select" data-id="${p.type}" data-index="${p.index}" aria-pressed="${p.type===selected?.type&&p.index===selected?.index}">${DECORS[p.type]} ${p.index+1}</button>`).join('')}</div><div class="layout-selected"><span><small>選んだかざり</small><strong id="layout-selected-name">${esc(name)}</strong></span><span id="layout-selected-angle">${selected?`向き ${selected.rotation}°`:''}</span></div><div class="layout-controls" role="group" aria-label="かざりの移動と回転"><button data-action="layout-nudge" data-dir="left" ${selected?'':'disabled'} aria-label="左へ移動">←</button><button data-action="layout-nudge" data-dir="back" ${selected?'':'disabled'} aria-label="奥へ移動">↑</button><button data-action="layout-nudge" data-dir="front" ${selected?'':'disabled'} aria-label="手前へ移動">↓</button><button data-action="layout-nudge" data-dir="right" ${selected?'':'disabled'} aria-label="右へ移動">→</button><button data-action="layout-rotate" ${selected?'':'disabled'}>↻ 45°</button></div><p class="layout-help">選択中のかざりはキーボードの矢印でも移動できます。位置を変えても、かざりの数は変わりません。</p><div class="layout-presets"><span>見本に並べる</span><div><button data-action="layout-preset" data-preset="wide">ひろびろ</button><button data-action="layout-preset" data-preset="cluster">まとまり</button><button data-action="layout-preset" data-preset="default">初期配置</button></div></div><button class="secondary-btn layout-back" data-action="layout-back">かざりの数に戻る</button>`;
}
function momentsBody(){
 const items=E.SYNERGY_PAIRS.map(pair=>{const found=state.dex.synergies.includes(pair.key),memory=state.dex.moments.some(m=>m.key===pair.key),location=E.findSynergyLocation(state,pair.key),available=!!location&&E.canEnterRoom(state,location.room);
  if(!found)return `<div class="moment-entry unknown"><span class="moment-entry-mark">✧</span><span><strong>まだ知らない組み合わせ</strong><small>同じ展示室・水質で見つけられます。</small></span></div>`;
  return `<div class="moment-entry"><span class="moment-entry-mark">✧</span><span><strong>${esc(pair.label)}</strong><small>${memory?'ワンシーンを記録済み': '組み合わせを発見済み'} · ${esc(pair.caption)}</small><small>${available?'同じ水槽で再生できます':'もう一度見るには、2種を同じ水槽に展示してください。'}</small></span>${available?`<button class="small-link moment-play" data-action="moment-play" data-key="${pair.key}">${memory?'もう一度みる':'場面をみる'} →</button>`:''}</div>`;
 }).join('');
 return `<h2 class="modal-heading">ふたりのワンシーン</h2><p class="modal-copy">同じ水槽で出会った仲間たちの、静かなひととき。</p><div class="moment-list">${items}</div>`;
}
function updateLayoutPreview(){scene.setDecor(state.tank.decor,state.tank.quantities,L.visibleDecor(state,currentRoom,currentWater));}
function markLayoutSelection(){
 const items=L.visibleDecor(state,currentRoom,currentWater),p=items.find(x=>x.type===layoutSelection?.type&&x.index===layoutSelection?.index);
 layer.querySelectorAll('[data-action=layout-select]').forEach(el=>{const on=el.dataset.id===p?.type&&Number(el.dataset.index)===p?.index;el.classList.toggle('selected',on);el.setAttribute('aria-pressed',String(on));});
 const name=layer.querySelector('#layout-selected-name'),angle=layer.querySelector('#layout-selected-angle');if(name)name.textContent=p?`${DECORS[p.type]} ${p.index+1}`:'選択できるかざりはありません';if(angle)angle.textContent=p?`向き ${p.rotation}°`:'';
}
function changeSelectedLayout(dx=0,dz=0,dr=0){
 if(!layoutSelection)return false;const {type,index}=layoutSelection,p=L.getDecorPosition(state,currentRoom,currentWater,type,index);if(!p)return false;
 if(!L.setDecorPosition(state,currentRoom,currentWater,type,index,{x:p.x+dx,z:p.z+dz,rotation:p.rotation+dr}))return false;
 save();updateLayoutPreview();renderModal();return true;
}
function renderModal(options={}){if(!modal){endModal(false);return;}const oldSheet=layer.querySelector('.sheet'),oldKey=layer.dataset.modalKey,newKey=modalIdentity(modal),active=layer.contains(document.activeElement)?document.activeElement:null,focused=oldKey===newKey?focusSelector(active):null;
 if(oldSheet&&oldKey){modalScrolls.set(oldKey,oldSheet.scrollTop);const input=oldSheet.querySelector('#nickname-input');if(input&&!(options.discardDraft&&oldKey===newKey))modalDrafts.set(oldKey,{value:input.value,start:input.selectionStart,end:input.selectionEnd});}
 if(options.discardDraft)modalDrafts.delete(newKey);let content='',close=true;
 if(modal.type==='pending'){content=pendingBody(state.pending[0]||{});close=false;}
 else if(modal.type==='fish'){const f=state.fish_instances.find(x=>x.uid===modal.uid);if(!f){closeModal();return;}content=fishBody(f);}
 else if(modal.type==='roster'){const sp=BY_ID[modal.id];if(!sp){closeModal();return;}content=rosterBody(sp);}
 else if(modal.type==='collection'){content=collectionBody();}
 else if(modal.type==='species'){const sp=BY_ID[modal.id];content=unknownBody(sp);}
 else if(modal.type==='material-info'){content=`<div class="modal-center"><div class="modal-fish-frame">${cubeIcon(108)}</div><h2 class="modal-heading">${CUBE_NAME}</h2><p class="modal-copy">所持 ${state.materials}個</p><p class="modal-copy">1個で育成＋10。お相手・かざりの交換にも使えます。</p><p class="sheet-foot">ゲーム内アイテムで、実際のえさではありません。</p></div>`;}
 else if(modal.type==='decor'){content=`<h2 class="modal-heading">水槽のかざり</h2><p class="modal-copy">置く数を調整できます。すべての展示室に反映されます。${['current','deep'].includes(currentRoom)?' この展示では景観のため水草は表示せず、設定は保持します。':''}</p><div class="decor-list">${Object.entries(DECORS).map(([id,name])=>{const owned=state.tank.inventory.includes(id),count=state.tank.quantities[id]||0,max=id==='plants'?5:3;return `<div class="decor-option quantity-row"><span>${name}<small> ${count} / ${max}</small></span>${owned?`<span class="quantity-controls"><button data-action="decor-quantity" data-id="${id}" data-delta="-1" aria-label="${name}を減らす" ${count===0?'disabled':''}>−</button><b>${count}</b><button data-action="decor-quantity" data-id="${id}" data-delta="1" aria-label="${name}を増やす" ${count===max?'disabled':''}>＋</button></span>`:`<button class="small-link" data-action="unlock-decor" data-id="${id}" ${state.materials<1?'disabled':''}>キューブ1個で解放</button>`}</div>`}).join('')}</div><button class="primary-btn layout-open" data-action="layout">この水槽の配置を変える ${ico('arrow',14)}</button><details class="compact-help"><summary>かざりについて</summary><p>配置は展示室・水質ごと、数は全展示室共通です。環境種もゲーム内のかざりや共生条件に含まれます。</p></details>`;}
 else if(modal.type==='layout'){content=layoutBody();}
 else if(modal.type==='moments'){content=momentsBody();}
 else if(modal.type==='size-compare'){content=sizeCompareBody();}
 else if(modal.type==='light'){content=`<h2 class="modal-heading">水槽のあかり</h2><p class="modal-copy">今夜の気分に合わせて。複数のライトを求める条件は、同じ仲間で順に切り替えて体験します。</p><div class="decor-list">${Object.entries(LIGHTS).map(([id,name])=>`<button class="decor-option ${state.tank.light===id?'on':''}" data-action="set-light" data-id="${id}"><span>${id==='moon'?'☾':id==='warm'?'☼':'◇'}　${name}のライト</span><span>${state.tank.light===id?'選択中 ✓':'選ぶ'}</span></button>`).join('')}</div>`;}
 else if(modal.type==='breeding-create'){content=`<h2 class="modal-heading">繁殖用水槽を作る</h2><p class="modal-copy">環境を選んでください（${state.breeding_tanks.length} / ${E.MAX_BREEDING_TANKS}）。</p><div class="move-list">${ROOMS.map(r=>`<button class="move-option" data-action="create-breeding" data-habitat="${r.id}"><span>${esc(r.name)}</span><span>${esc(r.theme)}</span></button>`).join('')}</div>`;}
 else if(modal.type==='move'){const f=state.fish_instances.find(x=>x.uid===modal.uid);if(!f){closeModal();return;}content=moveBody(f);}
 else if(modal.type==='import-confirm'){
  const item=pendingImport;content=item?`<div class="modal-center"><h2 class="modal-heading">セーブを読み込む？</h2><p class="modal-copy">${esc(item.fileName)}<br>仲間 ${item.fish}体 ・ 図鑑 ${item.discovered}種 ・ ${esc(item.version)}</p>${item.unknown||item.archivedDiscovered?`<p class="transfer-notice">前版・未対応の仲間 ${item.unknown}体と発見記録 ${item.archivedDiscovered}件は、新しい展示や発見数には含めず、セーブに保管します。</p>`:''}<p class="modal-copy transfer-warning">現在の進行は読み込んだ内容に置き換わります。直前の状態は設定から1回だけ戻せます。戻すと読み込み後の進行は失われます。</p>${transferNotice?`<p class="transfer-notice" role="status">${esc(transferNotice)}</p>`:''}<div class="modal-actions"><button class="secondary-btn" data-action="export-current">先に現在のセーブを書き出す</button><button class="danger-btn" data-action="commit-import">置き換えて読み込む</button><button class="secondary-btn" data-action="close-modal">やめる</button></div></div>`:'';
 }
 else if(modal.type==='restore-confirm')content=`<div class="modal-center"><h2 class="modal-heading">読み込み前に戻す？</h2><p class="modal-copy">現在の進行は、読み込み直前の状態に置き換わります。読み込み後に進めた内容は失われるので、必要なら先に書き出してください。復元ポイントは1回分です。</p>${transferNotice?`<p class="transfer-notice" role="status">${esc(transferNotice)}</p>`:''}<div class="modal-actions"><button class="secondary-btn" data-action="export-current">現在のセーブを書き出す</button><button class="danger-btn" data-action="restore-import">読み込み前に戻す</button><button class="secondary-btn" data-action="close-modal">やめる</button></div></div>`;
 else if(modal.type==='backup-conflict'){
  const r=backup.remote,local=state;if(!r){endModal(false);render();return;}const stamp=new Date(r.savedAt).toLocaleString('ja-JP');
  content=`<div class="modal-center"><h2 class="modal-heading">どちらのセーブを使いますか？</h2><p class="modal-copy">異なる保存データが見つかりました。選ぶまでは、どちらも自動で上書きしません。</p><div class="backup-compare"><div><strong>この端末</strong><span>仲間 ${local.fish_instances.length}体・発見記録 ${local.dex.discovered.length}件（保管分を含む）</span><button class="small-link" data-action="export-current">端末分を保存</button></div><div><strong>プレビュー保管分</strong><span>仲間 ${r.state.fish_instances.length}体・発見記録 ${r.state.dex.discovered.length}件（保管分を含む）</span><small>${esc(stamp)} に保存</small><button class="small-link" data-action="backup-export-remote">保管分を保存</button></div></div><p class="sheet-foot">先に両方を保存できます。保管分を選んだ場合、端末の直前の状態は設定から1回だけ戻せます。端末分を選ぶとプレビュー保管分が更新されます。</p><div class="modal-actions"><button class="primary-btn" data-action="backup-choose-remote">プレビュー保管分を使う</button><button class="secondary-btn" data-action="backup-choose-local">この端末のセーブを使う</button><button class="secondary-btn" data-action="close-modal">あとで決める</button></div></div>`;
 }
 else if(modal.type==='reset'){content=`<div class="modal-center"><h2 class="modal-heading">初期化しますか？</h2><p class="modal-copy">この端末とプレビューの現在の魚・図鑑・探索記録が初期化されます。必要なら先にセーブを書き出してください。</p><div class="modal-actions"><button class="danger-btn" data-action="reset">初期化する</button><button class="secondary-btn" data-action="close-modal">やめる</button></div></div>`;}
 layer.innerHTML=modalWrap(content,close);layer.hidden=false;layer.dataset.modalKey=newKey;app.inert=true;const sheet=layer.querySelector('.sheet'),input=sheet.querySelector('#nickname-input'),draft=modalDrafts.get(newKey);if(input&&draft){input.value=draft.value;if(focused==='#nickname-input'&&draft.start!==null)input.setSelectionRange(draft.start,draft.end);}sheet.scrollTop=modalScrolls.get(newKey)||0;if(modal.jumpToEvolution){const target=sheet.querySelector('#evo-title');modal.jumpToEvolution=false;if(target){sheet.scrollTop=Math.max(0,target.offsetTop-(sheet.querySelector('.sheet-bar')?.offsetHeight||0)-10);target.focus({preventScroll:true});return;}}if(modal.focusUid){const uid=modal.focusUid;modal.focusUid=null;const target=[...sheet.querySelectorAll('.roster-item')].find(el=>el.dataset.uid===uid);if(target){target.focus({preventScroll:true});return;}}if(!restoreFocus(layer,focused)){const first=layer.querySelector('button:not(:disabled),input:not(:disabled),select:not(:disabled)');(first||sheet)?.focus({preventScroll:true});}}
function pumpPending(){if(!modal&&!dexComposing&&screen!=='title'&&state.pending.length)openModal({type:'pending'});}
function updateCareIndicators(now){
 const minute=Math.floor(now/60000);if(minute===lastCareMinute)return;lastCareMinute=minute;
 if(screen==='home'&&$('#home-suggestion')){const node=$('#home-suggestion'),html=suggestionBody(now);if(node._renderedSuggestion!==html){const focused=node.contains(document.activeElement)?focusSelector(document.activeElement):null;node.innerHTML=html;node._renderedSuggestion=html;restoreFocus(node,focused);}}
 if(screen==='tank'){
  const animals=E.fishInTank(state,currentRoom,currentWater,currentSection),low=animals.filter(f=>E.satietyAt(f,now)<20).length,summary=$('.care-summary');
  if(summary){summary.classList.toggle('needs-care',low>0);summary.innerHTML=`<span>${low?`おなかが低い仲間 <b>${low}匹</b>`:'おなかが低い仲間はいません'}</span>${low?'<small>20未満は成長・繁殖をお休み</small>':''}`;}
  app.querySelectorAll('.fish-chip[data-uid]').forEach(button=>{const f=state.fish_instances.find(x=>x.uid===button.dataset.uid),sp=f&&BY_ID[f.species_id],small=button.querySelector('[data-fish-care]');if(small&&sp&&sp.kind!=='environment'){const value=E.satietyAt(f,now);small.textContent=`${sexLabel(f)} · おなか ${value}${value<20?' （低い）':''}`;}});
  const statuses=new Map(E.breedingStatus(state,currentRoom,currentWater,now,currentSection).map(x=>[x.key,x]));app.querySelectorAll('[data-breed-hunger]').forEach(el=>{el.hidden=statuses.get(el.dataset.breedHunger)?.reason!=='hungry';});
 }
 layer.querySelectorAll('[data-detail-satiety]').forEach(el=>{const f=state.fish_instances.find(x=>x.uid===el.dataset.detailSatiety);if(f)el.textContent=`${E.satietyAt(f,now)} / 100`;});
}
function updateJourney(now){
 const active=state.exploration.active,root=document.querySelector('[data-journey-scene]');if(!active||!root)return;
 const {fraction,stage}=journeyProgress(active,now),phase=JOURNEY_STAGES[stage],pct=Math.round(fraction*100);
 const bar=document.querySelector('[data-journey-progress]');if(bar){bar.setAttribute('aria-valuenow',String(pct));bar.setAttribute('aria-valuetext',`${phase.label}、${pct}%、残り ${formatTime(active.ends_at-now)}`);bar.firstElementChild.style.width=`${fraction*100}%`;}
 journeyScene.setProgress(active,now);
 const heading=root.querySelector('[data-journey-phase]');if(heading)heading.textContent=phase.label;
 document.querySelectorAll('[data-journey-step]').forEach(el=>{const n=Number(el.dataset.journeyStep);el.classList.toggle('current',n===stage);el.classList.toggle('done',n<stage);});
}
function updateClocks(){const now=Date.now();updateCareIndicators(now);document.querySelectorAll('[data-clock="active"]').forEach(el=>el.textContent=state.exploration.active?formatTime(state.exploration.active.ends_at-now):'00:00');document.querySelectorAll('[data-clock="stock"]').forEach(el=>el.textContent=formatTime(E.nextStockMs(state,now)));document.querySelectorAll('[data-clock="breed"]').forEach(el=>{const timer=state.breeding.timers[el.dataset.breedKey];el.textContent=timer?formatTime(timer.next_at-now):'--:--';});updateJourney(now);}
function showHeart(x,y){const heart=document.createElement('span');heart.className='heart-float';heart.textContent='♥';heart.style.left=x+'px';heart.style.top=y+'px';document.body.appendChild(heart);setTimeout(()=>heart.remove(),1200);}
function petFish(uid,x,y){if(Demo.showcaseByUid(state,uid)){scene.reactToPet(uid);if(x!==undefined)showHeart(x,y);toast('デモの見本です。獲得や好感度の記録は変わりません');return;}const r=E.pet(state,uid);if(!r.ok&&r.reason!=='limit'){toast('魚が見つかりません');return;}if(r.ok)save();scene.reactToPet(uid);sound.tap();if(x!==undefined)showHeart(x,y);const remain=$('#pet-remain');if(remain)remain.textContent=String(Math.max(0,10-state.daily.pet_count));toast(r.ok?'なかよし度が少し上がりました':'ふれあいはいつでも。好感度アップは1日10回まで');if(modal?.type==='fish')renderModal();}
async function shareTank(){if(!scene.renderer){toast('この端末では水槽画像を作れません');return;}try{const source=scene.canvas,c=document.createElement('canvas');c.width=source.width;c.height=source.height;const ctx=c.getContext('2d'),g=ctx.createLinearGradient(0,0,0,c.height);const colors={current:['#236875','#0b3340'],beach:['#34737a','#2a5860'],reef:['#276577','#113e4b'],deep:['#121e36','#080e1e'],river:['#436f5a','#1a3d37'],estuary:['#526b50','#283f34'],'estuary-cool':['#5d7876','#263f42'],'current-cool':['#315b70','#102c43'],'current-large':['#1f6873','#082e40'],'river-lake':['#6a8b6d','#24483e']}[sceneHabitatFor(currentRoom,currentSection)]||['#236875','#0b3340'];g.addColorStop(0,colors[0]);g.addColorStop(1,colors[1]);ctx.fillStyle=g;ctx.fillRect(0,0,c.width,c.height);ctx.drawImage(source,0,0);ctx.fillStyle='rgba(245,235,208,.85)';ctx.font=`${Math.max(12,Math.floor(c.width*.022))}px serif`;ctx.fillText('よるの水族館',16,c.height-17);const blob=await new Promise(res=>c.toBlob(res,'image/png'));if(!blob)throw Error('empty');const file=new File([blob],'yoru-aquarium.png',{type:'image/png'});if(navigator.canShare?.({files:[file]})){await navigator.share({files:[file],title:'よるの水族館'});}else{const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='yoru-aquarium.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),4000);toast('水槽の画像を保存しました');}}catch(e){if(e?.name!=='AbortError')toast('この環境では画像を保存できません');}}
layer.addEventListener('pointerdown',e=>{
 if(modal?.type!=='layout'||layoutDrag||e.button!==0)return;const item=e.target.closest('[data-layout-item]');if(!item)return;
 const type=item.dataset.id,index=Number(item.dataset.index),original=L.getDecorPosition(state,currentRoom,currentWater,type,index);if(!original)return;
 e.preventDefault();layoutSelection={type,index};markLayoutSelection();item.focus({preventScroll:true});
 layoutDrag={pointerId:e.pointerId,type,index,original,startX:e.clientX,startY:e.clientY,moved:false,room:currentRoom,water:currentWater};try{item.setPointerCapture(e.pointerId);}catch(_){}
});
layer.addEventListener('pointermove',e=>{
 if(!layoutDrag||e.pointerId!==layoutDrag.pointerId)return;const map=layer.querySelector('#layout-map'),item=layer.querySelector(`[data-layout-item][data-id="${layoutDrag.type}"][data-index="${layoutDrag.index}"]`);if(!map||!item)return;
 if(Math.hypot(e.clientX-layoutDrag.startX,e.clientY-layoutDrag.startY)<3&&!layoutDrag.moved)return;layoutDrag.moved=true;e.preventDefault();
 const rect=map.getBoundingClientRect(),b=L.LAYOUT_BOUNDS,clamp=x=>Math.max(0,Math.min(1,x));
 const px=clamp(((e.clientX-rect.left)/rect.width-.075)/.85),pz=clamp(((e.clientY-rect.top)/rect.height-.075)/.85);
 const old=L.getDecorPosition(state,layoutDrag.room,layoutDrag.water,layoutDrag.type,layoutDrag.index);
 if(L.setDecorPosition(state,layoutDrag.room,layoutDrag.water,layoutDrag.type,layoutDrag.index,{x:b.minX+px*(b.maxX-b.minX),z:b.minZ+pz*(b.maxZ-b.minZ),rotation:old.rotation})){
  item.style.left=(7.5+85*px)+'%';item.style.top=(7.5+85*pz)+'%';updateLayoutPreview();
 }
});
function endLayoutDrag(e,cancel=false){
 if(!layoutDrag||e.pointerId!==layoutDrag.pointerId)return;const drag=layoutDrag;layoutDrag=null;
 if(cancel&&drag.moved)L.setDecorPosition(state,drag.room,drag.water,drag.type,drag.index,drag.original);
 if(drag.moved){save();updateLayoutPreview();layoutIgnoreClick=true;setTimeout(()=>{layoutIgnoreClick=false;},0);}
 if(modal?.type==='layout')renderModal();
}
layer.addEventListener('pointerup',e=>endLayoutDrag(e));layer.addEventListener('pointercancel',e=>endLayoutDrag(e,true));
app.addEventListener('click',handle);layer.addEventListener('click',handle);
app.addEventListener('input',e=>{if(e.target.id==='dex-search'){dexQuery=e.target.value;updateDexResults();const clear=app.querySelector('[data-action=clear-dex-search]');if(clear)clear.hidden=!dexQuery;}});
app.addEventListener('compositionstart',e=>{if(e.target.id==='dex-search')dexComposing=true;});
app.addEventListener('compositionend',e=>{if(e.target.id!=='dex-search')return;dexQuery=e.target.value;dexComposing=false;if(dexRefreshPending){dexRefreshPending=false;render();}else updateDexResults();pumpPending();});
app.addEventListener('change',e=>{
 if(e.target.id==='follow-target'){scene.setViewMode('follow',e.target.value);render();return;}
 if(e.target.hasAttribute?.('data-dex-status-select')){dexStatus=e.target.value;render();return;}
 if(e.target.hasAttribute?.('data-dex-habitat-select')){dexFilter=e.target.value;render();return;}
 if(e.target.hasAttribute?.('data-dex-sort-select')){dexSort=e.target.value;render();return;}
});
layer.addEventListener('change',e=>{
 const sel=e.target.closest?.('[data-page-select]');if(sel){const page=Number(sel.value);if(E.assignFishPage(state,sel.dataset.uid,currentRoom,page)){E.setActivePage(state,currentRoom,page);tankPage=page;save();render();renderModal();toast(`水槽 ${page+1}に移しました`);}else toast('水槽は20体までです');}
});
// Keep the actual input outside the re-rendered app: a refresh while the OS
// file picker is open must not detach it before the change event arrives.
$('#save-import-file').addEventListener('change',e=>{const file=e.target.files?.[0];e.target.value='';if(file)readImportFile(file);});
function downloadRaw(value,name){const blob=new Blob([value],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),4000);}
function downloadJSON(value,name){downloadRaw(JSON.stringify(value,null,2),name);}
async function readImportFile(file){
 const request=++importRequestSeq;transferNotice='';
 if(file.size>MAX_IMPORT_BYTES){transferNotice='ファイルは5MB以下にしてください。現在のセーブは変更していません。';render();toast(transferNotice);return;}
 let text;try{text=await file.text();}catch(_){if(request!==importRequestSeq||screen!=='settings'||modal)return;transferNotice='ファイルを読めませんでした。現在のセーブは変更していません。';render();toast(transferNotice);return;}
 if(request!==importRequestSeq||screen!=='settings'||modal)return;const prepared=prepareImport(text);if(!prepared.ok){transferNotice='対応するセーブを確認できません。現在のセーブは変更していません。';render();toast(transferNotice);return;}
 pendingImport={...prepared,fileName:file.name};openModal({type:'import-confirm'});
}
function commitImport(now){
 if(!pendingImport)return;
 // A recoverable copy of the actual destination state is mandatory.
 if(storageReadOnly||!prepareImport(state,now).ok){transferNotice='現在のセーブを安全に復元できないため、読み込みを中止しました。';renderModal();return;}
 const next=withRecovery(pendingImport.state,state,now);E.refresh(next,now);
 try{localStorage.setItem(E.SAVE_KEY,JSON.stringify(next));}catch(_){transferNotice='保存できませんでした。現在のセーブは変更していません。空き容量や保存権限を確認してください。';renderModal();return;}
 state=next;lastStoredJSON=JSON.stringify(next);hadLocalSave=true;backup.changed();storageOk=true;lastSceneSignature=null;transferNotice='セーブを読み込みました。読み込み前の状態は1回だけ戻せます。';endModal(false);sound.sync();render();pumpPending();
}
function restoreImport(now){
 if(storageReadOnly||!state.importRecovery?.original)return;
 const prepared=prepareImport(state.importRecovery.original,now);if(!prepared.ok){transferNotice='復元データを確認できません。現在のセーブは変更していません。';renderModal();return;}
 const next=prepared.state;E.refresh(next,now);
 try{localStorage.setItem(E.SAVE_KEY,JSON.stringify(next));}catch(_){transferNotice='復元を保存できませんでした。現在のセーブは変更していません。';renderModal();return;}
 state=next;lastStoredJSON=JSON.stringify(next);hadLocalSave=true;backup.changed();storageOk=true;lastSceneSignature=null;transferNotice='読み込み前の状態に戻しました。';endModal(false);sound.sync();render();pumpPending();
}
function handle(e){const b=e.target.closest('[data-action]');if(!b||b.disabled)return;const a=b.dataset.action;const now=Date.now();
 if(a==='start'){state.started=true;E.refresh(state,now);E.logEvent(state,'app_open',{},now);save();screen='home';sound.init();sound.sync();render();pumpPending();return;}
 if(a==='go'){if(modal)endModal(false);screen=b.dataset.screen;render();pumpPending();return;}
 if(a==='welcome-dismiss'){state.welcome_back=null;save();render();return;}
 if(a==='welcome-go'){const f=state.fish_instances.find(x=>x.uid===b.dataset.uid),sp=f&&BY_ID[f.species_id];
  if(f&&sp&&E.canEnterRoom(state,E.displayRoom(f))){currentRoom=E.displayRoom(f);currentWater=E.waterGroup(sp);currentSection=E.fishSection(f);const ix=E.fishInTank(state,currentRoom,currentWater,currentSection).findIndex(x=>x.uid===f.uid);tankPage=Math.floor(Math.max(0,ix)/tankPageSize());scene.resetView();screen='tank';render();if(f.placed===false)openModal({type:'collection'});}
  else{screen=f&&!sp?'settings':'explore';render();}return;}
 if(a==='room'||a==='quick-room'){
  const id=b.dataset.room,room=E.tankDefinition(state,id);if(!room||!E.canEnterRoom(state,id)){toast('図鑑を集めると開きます');return;}
  if(a==='quick-room'&&id===currentRoom&&screen==='tank')return;
  scene.clearFood();currentRoom=id;currentWater=E.tankDefinition(state,id)?.water||P.defaultWater(state,id);currentSection=null;tankPage=state.tank_views[id]?.active||0;scene.resetView();
  if(a==='quick-room'&&$('#screen-content'))$('#screen-content').scrollTop=0;
  screen='tank';render();return;
 }
 if(a==='suggestion-care'){const room=b.dataset.room,water=b.dataset.water;if(!E.canEnterRoom(state,room)||E.tankDefinition(state,room)?.water!==water)return;currentRoom=room;currentWater=water;currentSection=null;tankPage=0;scene.resetView();screen='tank';render();return;}
 if(a==='suggestion-evolution'){const fish=state.fish_instances.find(f=>f.uid===b.dataset.uid);if(fish)openModal({type:'fish',uid:fish.uid,jumpToEvolution:true});return;}
 if(a==='water'){if(ROOMS.find(r=>r.id===currentRoom)?.water!==b.dataset.water)return;scene.clearFood();currentWater=b.dataset.water;tankPage=0;scene.resetView();render();return;}
 if(a==='tank-page'){scene.clearFood();tankPage=Math.max(0,tankPage+Number(b.dataset.delta));if(tankPage<E.tankPages(state,currentRoom).length){E.setActivePage(state,currentRoom,tankPage);save();}render();return;}
 if(a==='zoom'){const z=b.dataset.zoom;if(z==='reset'){scene.resetView();render();}else scene.setZoom(scene.getZoom()+(z==='in'?.3:-.3));return;}
 if(a==='view-mode'){const mode=b.dataset.mode;if(mode==='follow'){const onPage=currentDisplayPage(currentRoom,currentWater).onPage;if(!onPage.length)return;scene.setViewMode('follow',onPage[0].uid);}else scene.setViewMode('drag');render();return;}
 if(a==='open-collection'||a==='back-collection'){openModal({type:'collection'});return;}
 if(a==='toggle-food-picker'){foodPickerOpen=!foodPickerOpen;render();return;}
 if(a==='select-food'){if(FOOD_BY_ID[b.dataset.food]||b.dataset.food===AUTO_FOOD.id){selectedFood=b.dataset.food;render();}return;}
 if(a==='breed-panel'){breedingOpen=!breedingOpen;E.refreshBreeding(state,now);save();render();return;}
 if(a==='skip-breed'){if(E.skipBreedCheck(state,b.dataset.key,now)){save();render();pumpPending();toast('デモの繁殖判定を1回行いました');}return;}
 if(a==='previous-ack'){state.previous.notice=false;save();render();return;}
 if(a==='migration-ack'){state.legacy.notice=false;save();render();return;}
 if(a==='journey-home'){exploreHomeForced=true;render();return;}
 if(a==='journey-watch'){exploreHomeForced=false;render();return;}
 if(a==='open-breeding-create'){openModal({type:'breeding-create'});return;}
 if(a==='create-breeding'){const t=E.createBreedingTank(state,b.dataset.habitat);if(t){save();endModal(false);currentRoom=t.id;currentWater=E.tankDefinition(state,t.id).water;currentSection=null;tankPage=0;screen='tank';render();toast('繁殖用水槽を作りました');}else toast('これ以上作れません');return;}
 if(a==='delete-breeding-tank'){const habitat=E.tankDefinition(state,b.dataset.room)?.habitat||'cold-sea';if(E.deleteBreedingTank(state,b.dataset.room)){save();currentRoom=habitat;currentWater=E.tankDefinition(state,habitat).water;tankPage=0;render();toast('繁殖用水槽を削除しました');}return;}
 if(a==='set-display-page'){if(E.setActivePage(state,currentRoom,Number(b.dataset.index))){tankPage=Number(b.dataset.index);save();render();renderModal();}return;}
 if(a==='add-display-page'){if(E.addTankPage(state,currentRoom)){tankPage=state.tank_views[currentRoom].active;save();render();renderModal();toast('水槽を追加しました');}else toast('これ以上水槽を追加できません');return;}
 if(a==='clear-dex-filters'){dexFilter='すべて';dexStatus='all';dexQuery='';dexSort='group';render();return;}
 if(a==='explore-start'){const r=E.startExplore(state,b.dataset.id,now,null);if(!r.ok){toast(r.reason==='stock'?'探索券が回復するまでお待ちください':'いまは探索に出られません');return;}exploreHomeForced=false;sound.tap();save();render();toast('探索に出かけました');return;}
 if(a==='skip'){if(state.exploration.active&&(state.exploration.active.demo??state.settings.demo)){state.exploration.active.ends_at=now;E.refresh(state,now);save();render();pumpPending();}return;}
 if(a==='today'){const r=E.todayFish(state,now);if(!r.ok){toast('今日の魚は受け取り済みです');return;}save();sound.tap();render();pumpPending();return;}
 if(a==='feed'){
  if(scene.feeding)return;const visibleUids=currentDisplayPage(currentRoom,currentWater).onPage.filter(f=>!f.showcase).map(f=>f.uid);const r=E.feed(state,now,currentRoom,currentWater,selectedFood,null,visibleUids);
  if(!r.ok){toast(r.reason==='limit'?'今日のえさはここまで':r.reason==='incompatible'?'このえさを食べる仲間はいません':'仲間をお迎えしてから、えさをあげましょう');return;}
  // If the current page contains no eligible animal, show an actual eater;
  // food still applies to every eligible resident in this water, as before.
  const previous={page:tankPage,room:currentRoom,water:currentWater,section:null,view:scene.getView()};
  const autoPage=false;E.refreshBreeding(state,now);save();sound.tap();render();
  $('#room-scene')?.scrollIntoView({behavior:window.matchMedia?.('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'center'});
  if(scene.startFeeding(r.fedUids,selectedFood,r.foods)){feedReturn=autoPage?{...previous,autoPage:tankPage}:null;updateFeedUI();}
  else {if(autoPage){tankPage=previous.page;scene.panX=previous.view.panX;scene.panY=previous.view.panY;scene.setViewMode(previous.view.mode,previous.view.uid);render();}toast(`${r.matched}匹にえさをあげました`);}return;
 }
 if(a==='filter'){dexFilter=b.dataset.filter;render();return;}
 if(a==='dex-status'){dexStatus=b.dataset.status;if(dexStatus==='unknown'&&!Demo.showcaseEnabled(state))dexSize='all';render();return;}
 if(a==='dex-size'){const value=b.dataset.size;dexSize=value==='all'||SIZE_CLASSES[value]?value:'all';if(dexSize!=='all'&&dexStatus==='unknown'&&!Demo.showcaseEnabled(state))dexStatus='all';render();return;}
 if(a==='clear-dex-search'){dexQuery='';const input=$('#dex-search');if(input){input.value='';input.focus({preventScroll:true});}updateDexResults();b.hidden=true;return;}
 if(a==='species'){openModal({type:'species',id:b.dataset.id});return;}
 if(a==='fish'||a==='exhibit-suggest-fish'){openModal({type:'fish',uid:b.dataset.uid,fromRoster:modal?.type==='roster'?modal.id:null,fromCollection:modal?.type==='collection'||modal?.fromCollection});return;}
 if(a==='view-showcase'){const f=Demo.showcaseSamples(state).find(x=>x.species_id===b.dataset.id),sp=f&&BY_ID[f.species_id];if(!f||!sp){toast('見本を表示できません');return;}currentRoom=f.room;currentWater=E.waterGroup(sp);currentSection=null;{const pages=displayPagesFor(currentRoom,currentWater);const index=pages.findIndex(pg=>pg.some(x=>x.uid===f.uid));tankPage=Math.max(0,index);}scene.resetView();screen='tank';endModal(false);render();toast('デモの見本を表示しています');return;}
 if(a==='adopt-showcase'){const sample=Demo.showcaseSamples(state).find(x=>x.species_id===b.dataset.id),sp=sample&&BY_ID[sample.species_id];if(!sample||!sp)return;const r=E.demoAdopt(state,sp.id,sample.room,now);if(!r.ok||r.type!=='fish'){toast('お迎えできませんでした');return;}save();currentRoom=sample.room;currentWater=E.waterGroup(sp);currentSection=null;tankPage=state.tank_views[currentRoom]?.active||0;scene.resetView();screen='tank';endModal(false);render();pumpPending();toast(`${sp.name}をお迎えしました`);return;}
 if(a==='back-roster'){openModal({type:'roster',id:b.dataset.id,focusUid:modal?.uid});return;}
 if(a==='back-species'){openModal({type:'species',id:b.dataset.id});return;}
 if(a==='rename'){if(E.renameFish(state,b.dataset.uid,layer.querySelector('#nickname-input')?.value||'',now)){save();renderModal({discardDraft:true});toast('名前を保存しました');}return;}
 if(a==='invite-partner'){const r=E.invitePartner(state,b.dataset.uid,now);if(r.ok){E.refreshBreeding(state,now);save();if(screen==='tank')render();renderModal();toast('お相手が水槽に加わりました');}else toast(r.reason==='materials'?`${CUBE_NAME}が足りません`:'お相手はすでにいます');return;}
 if(a==='demo-grow'){if(E.demoGrow(state,b.dataset.uid,now)){E.refreshBreeding(state,now);save();if(screen==='tank')render();renderModal();toast('デモで育成度をAまで進めました');}return;}
 if(a==='follow-fish'){const f=state.fish_instances.find(x=>x.uid===b.dataset.uid);if(f&&f.placed!==false){currentRoom=E.displayRoom(f);currentWater=E.waterGroup(BY_ID[f.species_id]);currentSection=null;{const pages=displayPagesFor(currentRoom,currentWater);const ix=pages.findIndex(pg=>pg.some(x=>x.uid===f.uid));tankPage=Math.max(0,ix);}screen='tank';endModal(false);scene.setViewMode('follow',f.uid);render();}return;}
 if(a==='pet-modal'){petFish(b.dataset.uid);return;}
 if(a==='material'){const r=E.useMaterial(state,b.dataset.uid,now);if(r.ok){save();sound.tap();renderModal();toast('育成度が上がりました');}return;}
 if(a==='evolve'){const r=E.evolve(state,b.dataset.uid,b.dataset.id,now);if(r.ok){save();sound.tap();endModal(false);render();pumpPending();}else toast('まだ進化の条件がそろっていません');return;}
 if(a==='moments'){openModal({type:'moments'});return;}
 if(a==='moment-play'){
  if(!scene.renderer){toast('この端末ではワンシーンの3D表示ができません');return;}
  const pair=E.findSynergyLocation(state,b.dataset.key);if(!pair||!E.canEnterRoom(state,pair.room)){toast('まず同じ水槽に展示しましょう');return;}
  currentRoom=pair.room;currentWater=pair.water;const subject=state.fish_instances.find(f=>f.uid===pair.fishUid);currentSection=null;{const pages=displayPagesFor(currentRoom,currentWater);const ix=pages.findIndex(pg=>pg.some(x=>x.uid===pair.fishUid));tankPage=Math.max(0,ix);}scene.resetView();screen='tank';endModal(false);render();
  $('#room-scene')?.scrollIntoView({behavior:'auto',block:'center'});requestAnimationFrame(()=>{scene.setMomentPairs([pair],`${currentRoom}:dex`);if(!scene.playMoment(pair.key))toast('えさの時間が終わってから、もう一度ご覧ください');});return;
 }
 if(a==='open-size-compare'){openModal({type:'size-compare'});return;}
 if(a==='material-info'){openModal({type:'material-info'});return;}
 if(a==='decor'){openModal({type:'decor'});return;}
 if(a==='layout'){layoutSelection=null;openModal({type:'layout'});return;}
 if(a==='layout-back'){openModal({type:'decor'});return;}
 if(a==='layout-select'){if(layoutIgnoreClick)return;layoutSelection={type:b.dataset.id,index:Number(b.dataset.index)};markLayoutSelection();return;}
 if(a==='layout-nudge'){const d={left:[-.4,0],right:[.4,0],back:[0,-.4],front:[0,.4]}[b.dataset.dir];if(d)changeSelectedLayout(d[0],d[1],0);return;}
 if(a==='layout-rotate'){changeSelectedLayout(0,0,45);return;}
 if(a==='layout-preset'){if(L.applyDecorPreset(state,currentRoom,currentWater,b.dataset.preset)){save();updateLayoutPreview();renderModal();toast(b.dataset.preset==='default'?'初期配置に戻しました':'見本の配置に並べました');}return;}

 if(a==='decor-quantity'){E.setDecorQuantity(state,b.dataset.id,Number(b.dataset.delta));save();scene.setDecor(state.tank.decor,state.tank.quantities,L.visibleDecor(state,currentRoom,currentWater));renderModal();return;}
 if(a==='unlock-decor'){if(E.unlockDecor(state,b.dataset.id)){save();renderModal();toast('かざりを解放しました');}return;}
 if(a==='toggle-env'){const before=state.dex.synergies.length;E.togglePlaced(state,b.dataset.uid);save();if(screen==='tank')render();renderModal();if(state.dex.synergies.length>before)toast('ゲーム上の共生を発見しました');return;}
 if(a==='open-light'){const order=['moon','warm','blue'],next=order[(order.indexOf(state.tank.light)+1)%order.length];E.setLight(state,next);save();render();if(modal&&modal.type!=='pending')renderModal();toast(`${LIGHTS[next]}のライトに切り替えました`);return;}
 if(a==='set-light'){E.setLight(state,b.dataset.id);save();if(screen==='tank')scene.setLight(state.tank.light);renderModal();return;}
 if(a==='move-dialog'){openModal({type:'move',uid:b.dataset.uid,fromRoster:modal?.fromRoster||null,fromCollection:modal?.type==='collection'||modal?.fromCollection});return;}
 if(a==='move'){if(E.moveFish(state,b.dataset.uid,b.dataset.room,b.dataset.section||null)){E.refreshBreeding(state,now);save();modal={type:'fish',uid:b.dataset.uid,fromRoster:modal?.fromRoster||null,fromCollection:modal?.fromCollection};if(screen==='tank')render();renderModal();toast('水槽に配置しました');}else toast('その水槽には配置できません');return;}
 if(a==='close-modal'){closeModal();return;}
 if(a==='ack-pending'){const event=state.pending.shift();save();endModal(false);if(['tank','collection'].includes(b.dataset.route)){const f=state.fish_instances.find(f=>f.uid===event?.result?.uid);currentRoom=f?E.displayRoom(f):'cold-sea';currentWater=f?E.waterGroup(BY_ID[f.species_id]):P.defaultWater(state,currentRoom);currentSection=null;tankPage=0;scene.resetView();screen='tank';}render();if(b.dataset.route==='collection')openModal({type:'collection'});else pumpPending();return;}
 if(a==='toggle-setting'){const k=b.dataset.key;if(!['bgm','sfx','colorblind','demo','demo_showcase'].includes(k))return;if(k==='demo'){E.refreshStock(state,now);const interval=E.stockInterval(state);const fraction=state.exploration.stock<3?Math.min(1,Math.max(0,(now-state.exploration.stock_updated_at)/interval)):0;state.settings[k]=!state.settings[k];state.exploration.stock_updated_at=now-fraction*E.stockInterval(state);}else state.settings[k]=!state.settings[k];save();if(k==='bgm')sound.sync();render();return;}
 if(a==='set-setting'){const k=b.dataset.key;if(!['brightness','text_size'].includes(k))return;state.settings[k]=b.dataset.value;save();render();return;}
 if(a==='backup-conflict'){if(backup.status==='conflict')openModal({type:'backup-conflict'});return;}
 if(a==='backup-retry'){backup.connect();return;}
 if(a==='backup-export-remote'){if(backup.remote)downloadJSON(backup.remote.state,'yoru-aquarium-preview-backup.json');return;}
 if(a==='backup-choose-local'){if(backup.chooseLocal()){endModal(false);render();toast('この端末のセーブを使用します');}return;}
 if(a==='backup-choose-remote'){if(backup.chooseRemote()){endModal(false);render();pumpPending();toast('プレビュー保管分を復元しました');}else toast('復元できません。先に両方を書き出してください');return;}
 if(a==='export-current'){downloadJSON(portableState(state),'yoru-aquarium-save.json');toast('現在のセーブを書き出しました');return;}
 if(a==='export-protected'){if(protectedRaw){downloadRaw(protectedRaw.raw,protectedRaw.key+'-protected.json');toast('保護した元データを保存しました');}return;}
 if(a==='select-import'){if(!storageReadOnly)$('#save-import-file')?.click();return;}
 if(a==='commit-import'){commitImport(now);return;}
 if(a==='restore-confirm'){transferNotice='';openModal({type:'restore-confirm'});return;}
 if(a==='restore-import'){restoreImport(now);return;}
 if(a==='reset-confirm'){openModal({type:'reset'});return;}
 if(a==='reset'){state=E.createInitial(now);lastSceneSignature=null;save();endModal(false);sound.sync();screen='title';render();return;}
 if(a==='export-previous'){if(state.previous?.original){const blob=new Blob([JSON.stringify(state.previous.original,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),el=document.createElement('a');el.href=url;el.download='yoru-aquarium-v4-backup.json';el.click();setTimeout(()=>URL.revokeObjectURL(url),4000);toast('前のセーブを書き出しました');}return;}
 if(a==='export-legacy'){if(state.legacy?.original){const blob=new Blob([JSON.stringify(state.legacy.original,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),el=document.createElement('a');el.href=url;el.download='yoru-aquarium-v3-backup.json';el.click();setTimeout(()=>URL.revokeObjectURL(url),4000);toast('旧セーブを書き出しました');}return;}
 if(a==='share'){shareTank();return;}
}
document.addEventListener('keydown',e=>{
 if(modal?.type==='layout'&&e.target.closest?.('[data-layout-item]')){const delta={ArrowLeft:[-.4,0],ArrowRight:[.4,0],ArrowUp:[0,-.4],ArrowDown:[0,.4]}[e.key];if(delta){e.preventDefault();layoutSelection={type:e.target.dataset.id,index:Number(e.target.dataset.index)};changeSelectedLayout(delta[0],delta[1],0);return;}}
 if(!modal)return;
 if(e.key==='Escape'&&modal.type!=='pending'){e.preventDefault();closeModal();return;}
 if(e.key==='Tab'){
  const sheet=layer.querySelector('.sheet'),items=[...sheet.querySelectorAll('button:not(:disabled),input:not(:disabled):not([type="hidden"]),select:not(:disabled),textarea:not(:disabled),a[href],[tabindex]:not([tabindex="-1"])')].filter(el=>el.getClientRects().length>0);
  if(!items.length){e.preventDefault();sheet.focus({preventScroll:true});return;}
  const first=items[0],last=items.at(-1),active=document.activeElement;
  if(!sheet.contains(active)||(e.shiftKey&&active===first)||(!e.shiftKey&&active===last)){e.preventDefault();(e.shiftKey?last:first).focus();}
 }
});
let lastSave=0,hiddenAt=null,lastBackupRetry=0;let refreshTimer;function startRefreshTimer(){refreshTimer=setInterval(()=>{if(document.hidden)return;const now=Date.now();if(backup.status==='offline'&&now-lastBackupRetry>=30000){lastBackupRetry=now;backup.connect();}const r=E.refresh(state,now);if(r.changed){save();if(screen!=='title'){render();if(modal&&modal.type!=='pending'&&!layoutDrag)renderModal();pumpPending();}}else if(now-lastSave>30000){save();lastSave=now;}updateClocks();},500);}
document.addEventListener('visibilitychange',()=>{
 if(!appBootstrapped)return;if(document.hidden){if(hiddenAt===null){hiddenAt=Date.now();state.last_seen=hiddenAt;}save();backup.flush();return;}
 const now=Date.now();if(hiddenAt!==null){state.last_seen=hiddenAt;hiddenAt=null;}const r=E.refreshForReturn(state,now);if(r.changed||r.welcomeCreated){save();render();if(modal&&modal.type!=='pending'&&!layoutDrag)renderModal();pumpPending();}
});
window.addEventListener('pagehide',()=>{if(!appBootstrapped)return;if(!document.hidden)state.last_seen=Date.now();save();backup.flush();});
window.addEventListener('online',()=>{if(['offline','local'].includes(backup.status))backup.connect();});
window.__game={getState:()=>structuredClone(state),getJourneyInfo:()=>journeyScene.info(),getBackupInfo:()=>({status:backup.status,revision:backup.revision,dirty:backup.dirty,remoteRevision:backup.remote?.revision||null}),getScreen:()=>screen,getZoom:()=>scene.getZoom(),getWater:()=>currentWater,getSceneInfo:()=>({room:currentRoom,section:currentSection,habitat:scene.habitat||null,habitatObjects:Object.entries(scene.habitatGroups||{}).filter(([,g])=>g.visible).map(([id,g])=>({id,blocks:g.children.reduce((n,o)=>n+(o.count||0),0)})),floorVisible:!!scene.sand?.visible,bubblesVisible:!!scene.bubbles?.visible,modelBuildCount:scene.modelBuildCount||0,zoom:scene.getZoom(),cameraZoom:scene.camera?.zoom,cameraQuaternion:scene.camera?.quaternion.toArray(),view:scene.getView(),feeding:scene.getFeedingInfo(),foodCount:scene.feeding?.items?.filter(x=>x.pellet.visible).length||0,moment:scene.activeMoment?{key:scene.activeMoment.key,fishUid:scene.activeMoment.fishUid,envUid:scene.activeMoment.envUid}:null,momentPairs:scene.momentPairs.map(p=>({key:p.key,fishUid:p.fishUid,envUid:p.envUid})),decor:L.visibleDecor(state,currentRoom,currentWater),decorRendered:[...(scene.plantGroups||[]).map((o,i)=>({type:'plants',index:i,visible:o.visible&&!!scene.plantsRoot?.visible,x:o.position.x,z:o.position.z,rotation:o.rotation.y*180/Math.PI})),...(scene.rockGroup?.children||[]).map((o,i)=>({type:'rock',index:i,visible:o.visible&&!!scene.rockGroup?.visible,x:o.position.x,z:o.position.z,rotation:o.rotation.y*180/Math.PI})),...(scene.sandPatches?.children||[]).map((o,i)=>({type:'sand',index:i,visible:o.visible,x:o.position.x,z:o.position.z,rotation:o.rotation.y*180/Math.PI}))],foodPositions:scene.feeding?.items?.map(x=>({x:x.pellet.position.x,y:x.pellet.position.y,uid:x.uid,food:x.food}))||[],entries:scene.entries.map(a=>({uid:a.fish.uid,shape:a.sp.shape,motion:a.sp.motion,motionLabel:a.sp.motionLabel,sizeClass:a.sizeClass,stationary:a.stationary,benthic:a.benthic,personality:a.personality.id,reaction:a.reactionAt!==null,scale:a.group.scale.x,rotationX:a.group.rotation.x,displayLength:a.displayLength,position:{x:a.group.position.x,y:a.group.position.y,z:a.group.position.z}}))}),getFishBounds:(uid)=>scene.getProjectedBounds(uid),getFishScreen:(uid)=>{const a=scene.entries.find(x=>x.fish.uid===uid);if(!a||!scene.stage)return null;const p=a.group.position.clone().project(scene.camera),r=scene.canvas.getBoundingClientRect();return {x:r.left+(p.x+1)*r.width/2,y:r.top+(1-p.y)*r.height/2};}};
if('serviceWorker'in navigator && location.protocol.startsWith('http'))navigator.serviceWorker.register('./sw.js').catch(()=>{});
render();
(async()=>{await backup.connect();appBootstrapped=true;const openingRefresh=E.refreshForReturn(state,Date.now());if(openingRefresh.changed||openingRefresh.welcomeCreated)save();render();startRefreshTimer();})();

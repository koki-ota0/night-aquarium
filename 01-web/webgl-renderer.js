// Renderer startup only: no storage, player state, network requests or WebGL1.
// Keep the published quality settings first. Retry only after a real failure,
// using a fresh canvas so a failed/locked context cannot poison the next try.
const PROFILES = [
 {id:'preferred',powerPreference:'high-performance',antialias:true},
 {id:'default-gpu',powerPreference:'default',antialias:true},
 {id:'compatible',powerPreference:'default',antialias:false}
];
const messageOf=value=>String(value?.message||value||'詳細なし').slice(0,1500);

export function createWebGLRenderer({createCanvas,createRenderer}){
 const attempts=[];let canvas;
 for(const profile of PROFILES){
  canvas=createCanvas();let context=null,renderer=null;
  const messages=[],onCreationError=event=>{
   const message=messageOf(event.statusMessage||'ブラウザがWebGL 2の作成を拒否しました。');
   if(!messages.includes(message)&&messages.length<3)messages.push(message);
  };
  canvas.addEventListener('webglcontextcreationerror',onCreationError);
  const options={alpha:true,depth:true,stencil:false,premultipliedAlpha:true,preserveDrawingBuffer:true,failIfMajorPerformanceCaveat:false,powerPreference:profile.powerPreference,antialias:profile.antialias};
  try{
   context=canvas.getContext('webgl2',options);
   if(!context)throw new Error('WebGL 2コンテキストを作成できませんでした。');
   renderer=createRenderer({canvas,context,...options});
   if(context.isContextLost())throw new Error('WebGL 2コンテキストが初期化中に失われました。');
   attempts.push({profile:profile.id,options,status:'ready',messages});
   return {canvas,renderer,diagnostics:{status:'ready',profile:profile.id,attempts}};
  }catch(error){
   const message=messageOf(error);if(!messages.includes(message))messages.push(message);
   attempts.push({profile:profile.id,options,status:'failed',messages});
   // A context can exist even if Three.js itself failed during initialization.
   // Release that failed attempt, but never dispose the successful renderer.
   try{renderer?.dispose();}catch(_){}
   try{context?.getExtension('WEBGL_lose_context')?.loseContext();}catch(_){}
  }finally{canvas.removeEventListener('webglcontextcreationerror',onCreationError);}
 }
 return {canvas,renderer:null,diagnostics:{status:'unavailable',profile:null,attempts}};
}

export function graphicsDiagnosticText(info){
 const status={ready:'描画器の初期化成功',unavailable:'描画器の初期化失敗',lost:'描画コンテキスト消失中'}[info.status]||info.status;
 const lines=['WebGL診断 1',`状態: ${status}`,`表示: ${info.embedded?'埋め込み画面':'独立したタブ／ウィンドウ'}`,`ブラウザ: ${info.browser||'不明'}`,`使用設定: ${info.profile||'なし'}`,`描画サイズ: ${info.width||0} × ${info.height||0}`];
 for(const [i,attempt] of info.attempts.entries()){
  lines.push(`試行${i+1}: ${attempt.profile} / powerPreference=${attempt.options.powerPreference} / antialias=${attempt.options.antialias} / ${attempt.status}`);
  lines.push(...attempt.messages.map(message=>`  ${message}`));
 }
 return lines.join('\n');
}

export function showWebGLFallback(stage,{compact=false}={}){
 const document=stage.ownerDocument,panel=document.createElement('div');panel.className='webgl-fallback';
 const heading=document.createElement('strong');heading.textContent='3D表示を開始できませんでした';panel.append(heading);
 const copy=document.createElement('p');copy.textContent=compact?'設定から失敗の詳細を確認できます。':'WebGL 2の初期化に失敗しました。埋め込み画面やGPUの状態によっても起こるため、ブラウザ非対応とは限りません。';panel.append(copy);
 if(!compact){
  const button=document.createElement('button');button.className='secondary-btn';button.type='button';button.dataset.action='graphics-info';button.textContent='3D表示の診断を見る';panel.append(button);
  const note=document.createElement('p');note.textContent='セーブの初期化・サイトデータの削除は不要です。';panel.append(note);
 }
 stage.replaceChildren(panel);
}

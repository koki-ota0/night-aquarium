import test from 'node:test';
import assert from 'node:assert/strict';
import {createWebGLRenderer,graphicsDiagnosticText} from '../../webgl-renderer.js';

function context({lost=false}={}){
 return {released:0,isContextLost:()=>lost,getExtension(name){assert.equal(name,'WEBGL_lose_context');return {loseContext:()=>this.released++};}};
}
function fixture(getContext,createRenderer=options=>({options})){
 const canvases=[],rendererCalls=[];
 const result=createWebGLRenderer({
  createCanvas(){
   const canvas=new EventTarget();canvas.listeners=0;canvas.calls=[];
   const add=canvas.addEventListener.bind(canvas),remove=canvas.removeEventListener.bind(canvas);
   canvas.addEventListener=(...args)=>{canvas.listeners++;add(...args);};
   canvas.removeEventListener=(...args)=>{canvas.listeners--;remove(...args);};
   canvas.getContext=(type,options)=>{canvas.calls.push({type,options});return getContext(canvas,type,options);};
   canvases.push(canvas);return canvas;
  },
  createRenderer(options){rendererCalls.push(options);return createRenderer(options);}
 });
 return {result,canvases,rendererCalls};
}

test('WebGL startup keeps published quality first and stops after success',()=>{
 const gl=context(),{result,canvases,rendererCalls}=fixture(()=>gl);
 assert.equal(result.diagnostics.profile,'preferred');assert.equal(canvases.length,1);assert.equal(rendererCalls.length,1);
 assert.deepEqual(canvases[0].calls,[{type:'webgl2',options:{alpha:true,depth:true,stencil:false,premultipliedAlpha:true,preserveDrawingBuffer:true,failIfMajorPerformanceCaveat:false,powerPreference:'high-performance',antialias:true}}]);
 assert.equal(rendererCalls[0].context,gl);assert.equal(result.canvas,canvases[0]);assert.equal(gl.released,0);assert.equal(canvases[0].listeners,0);
});

test('failed high-performance GPU selection retries on a fresh canvas without lowering quality',()=>{
 const gl=context(),{result,canvases}=fixture((canvas,type,options)=>{
  assert.equal(type,'webgl2');
  if(options.powerPreference==='high-performance'){
   const event=new Event('webglcontextcreationerror');event.statusMessage='GPU selection denied';canvas.dispatchEvent(event);return null;
  }
  return gl;
 });
 assert.equal(result.diagnostics.profile,'default-gpu');assert.equal(canvases.length,2);assert.notEqual(canvases[0],canvases[1]);
 assert.ok(result.diagnostics.attempts[0].messages.includes('GPU selection denied'));
 assert.equal(result.diagnostics.attempts[1].options.antialias,true);assert.equal(result.diagnostics.attempts[1].options.preserveDrawingBuffer,true);
 assert.ok(canvases.every(canvas=>canvas.listeners===0));
});

test('last bounded fallback changes antialiasing only, retaining image export buffers',()=>{
 const gl=context(),{result,canvases}=fixture((canvas,type,options)=>options.antialias?null:gl);
 assert.equal(result.diagnostics.profile,'compatible');assert.equal(canvases.length,3);
 assert.equal(result.diagnostics.attempts[2].options.antialias,false);
 assert.equal(result.diagnostics.attempts[2].options.preserveDrawingBuffer,true);
 assert.ok(canvases.every(canvas=>canvas.calls.length===1&&canvas.calls[0].type==='webgl2'));
});

test('all denied contexts return explicit diagnostics without constructing Three or retrying forever',()=>{
 const {result,canvases,rendererCalls}=fixture(()=>null);
 assert.equal(result.renderer,null);assert.equal(result.diagnostics.status,'unavailable');assert.equal(result.canvas,canvases[2]);
 assert.equal(canvases.length,3);assert.equal(rendererCalls.length,0);assert.equal(result.diagnostics.attempts.length,3);
 assert.ok(result.diagnostics.attempts.every(attempt=>attempt.status==='failed'&&attempt.messages.length>0));
 assert.ok(canvases.every(canvas=>canvas.listeners===0));
});

test('a context left by a failed Three initialization is released before retrying',()=>{
 const contexts=[];
 const {result}=fixture(()=>{const gl=context();contexts.push(gl);return gl;},options=>{
  if(options.powerPreference==='high-performance')throw new Error('Driver initialization failed');
  return {options};
 });
 assert.equal(result.diagnostics.profile,'default-gpu');assert.equal(contexts[0].released,1);assert.equal(contexts[1].released,0);
 assert.ok(result.diagnostics.attempts[0].messages.includes('Driver initialization failed'));
});

test('an immediately lost context disposes the failed renderer and preserves the next successful one',()=>{
 let count=0,disposed=0;
 const {result}=fixture(()=>context({lost:count++===0}),options=>({options,dispose(){disposed++;}}));
 assert.equal(result.diagnostics.profile,'default-gpu');assert.equal(disposed,1);
});

test('diagnostic text contains failures and browser context, never serializes player data or URLs',()=>{
 const {result}=fixture(()=>null);
 const text=graphicsDiagnosticText({...result.diagnostics,embedded:true,browser:'Test browser',width:300,height:150,state:{nickname:'private-fish'},url:'https://private.invalid/token'});
 assert.match(text,/WebGL診断 1/);assert.match(text,/初期化失敗/);assert.match(text,/埋め込み/);assert.match(text,/Test browser/);assert.match(text,/試行3/);
 assert.ok(!text.includes('private-fish'));assert.ok(!text.includes('private.invalid'));
});

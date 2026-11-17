// Render every *current* species model. The transient server exists only during
// this one-shot command and never touches the user's preview-save endpoint.
const {chromium}=require('playwright'),fs=require('fs'),http=require('http'),path=require('path'),{build}=require('esbuild');
(async()=>{
 await build({entryPoints:['tools/thumb-render.js'],bundle:true,format:'iife',outfile:'tools/thumb-render.bundle.js',target:['es2020'],legalComments:'none'});
 const server=http.createServer((req,res)=>{
  const files={'/':'tools/thumb-page.html','/thumb-render.bundle.js':'tools/thumb-render.bundle.js'};
  const file=files[new URL(req.url,'http://localhost').pathname];if(!file){res.writeHead(404).end();return;}
  res.writeHead(200,{'Content-Type':file.endsWith('.js')?'text/javascript':'text/html; charset=utf-8'});res.end(fs.readFileSync(file));
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-webgl']});
 try{
  const page=await browser.newPage({viewport:{width:240,height:200}});page.on('pageerror',e=>console.error(e));
  await page.goto(`http://127.0.0.1:${server.address().port}/`);await page.waitForFunction(()=>window.renderReady);
  const species=[...JSON.parse(fs.readFileSync('data/real-catalog-data.json','utf8')),...JSON.parse(fs.readFileSync('data/expansion-216/curated-provisional.json','utf8')),...JSON.parse(fs.readFileSync('data/expansion-216/reviewed-second.json','utf8')),...JSON.parse(fs.readFileSync('data/expansion-216/curated-217.json','utf8')),...JSON.parse(fs.readFileSync('data/expansion-216/curated-219.json','utf8')),...JSON.parse(fs.readFileSync('data/expansion-216/curated-220.json','utf8')),...JSON.parse(fs.readFileSync('data/expansion-216/curated-222.json','utf8')),...JSON.parse(fs.readFileSync('data/expansion-216/curated-223.json','utf8')),...JSON.parse(fs.readFileSync('data/expansion-216/curated-224.json','utf8')),...JSON.parse(fs.readFileSync('data/expansion-216/curated-226.json','utf8')),...JSON.parse(fs.readFileSync('data/expansion-216/curated-228.json','utf8')),...JSON.parse(fs.readFileSync('data/expansion-216/curated-229.json','utf8'))],thumbs={};
  for(let i=0;i<species.length;i++){thumbs[species[i].id]=await page.evaluate(n=>window.makeThumb(n),i);if((i+1)%25===0)console.log(`${i+1}/${species.length}`);}
  if(Object.keys(thumbs).length!==species.length)throw Error('Thumbnail count mismatch');
  fs.writeFileSync('model-thumbs.json',JSON.stringify(thumbs));console.log(`${Object.keys(thumbs).length} distinct ID thumbnails generated`);
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exit(1)});

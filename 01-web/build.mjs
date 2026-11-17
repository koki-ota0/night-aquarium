import { build } from 'esbuild';import {readFile,writeFile} from 'node:fs/promises';
await build({entryPoints:['main.js'],bundle:true,minify:true,format:'iife',outfile:'game.bundle.js',target:['es2020'],legalComments:'none'});
const template=await readFile('template.html','utf8');const license=await readFile('licenses/three-LICENSE.txt','utf8');const thumbs=await readFile('model-thumbs.json','utf8');const gallery=(await readFile('assets/night-gallery.webp')).toString('base64');const habitat=(await readFile('assets/reef-habitat.webp')).toString('base64');const app=(await readFile('game.bundle.js','utf8')).replaceAll('</script','<\\/script');
let result=template.replace('%%THREE_LICENSE%%',()=>license).replace('%%GALLERY_DATA%%',()=>`data:image/webp;base64,${gallery}`).replace('%%HABITAT_DATA%%',()=>`data:image/webp;base64,${habitat}`).replace('%%MODEL_THUMBS%%',()=>thumbs).replace('%%APP_BUNDLE%%',()=>app);
await writeFile('index.html',result);await writeFile('yoru-no-suizokukan.html',result);console.log('Built both offline-ready HTML files');await import('./tools/generate-gallery.mjs');

await import('./tools/generate-real-docs.mjs');

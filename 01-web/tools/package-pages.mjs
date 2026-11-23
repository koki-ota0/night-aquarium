// Publish a fixed allowlist, never the source tree or the preview backup folder.
import {lstat,realpath,readFile,writeFile,mkdir,rm} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';

export const PAGES_FILES=Object.freeze([
 'index.html','yoru-no-suizokukan.html','DESIGN_GALLERY.html',
 'sw.js','manifest.webmanifest','assets/icon-192.png','assets/icon-512.png',
 'SPECIES_REVIEW.md','CARE_AND_BREEDING.md','THIRD_PARTY_NOTICES.txt',
 'licenses/three-LICENSE.txt','licenses/esbuild-LICENSE.txt','licenses/playwright-LICENSE.txt'
]);
const ROOT=fileURLToPath(new URL('../',import.meta.url));

export async function packagePages(source=ROOT){
 const root=await realpath(source),destination=path.join(root,'dist');
 // Read and validate everything first: missing builds or symbolic links must
 // fail before replacing a previously valid output directory.
 const files=await Promise.all(PAGES_FILES.map(async relative=>{
  const file=path.join(root,relative),stat=await lstat(file);
  if(!stat.isFile()||await realpath(file)!==file)throw new Error(`Pages assets must be regular, non-symlinked files: ${relative}`);
  return {relative,data:await readFile(file)};
 }));
 await rm(destination,{recursive:true,force:true});
 for(const {relative,data} of files){
  const file=path.join(destination,relative);await mkdir(path.dirname(file),{recursive:true});await writeFile(file,data);
 }
 return destination;
}

if(process.argv[1]&&pathToFileURL(path.resolve(process.argv[1])).href===import.meta.url){
 console.log(`Packaged ${PAGES_FILES.length} public files for GitHub Pages: ${await packagePages()}`);
}

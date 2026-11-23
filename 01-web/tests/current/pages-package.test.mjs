import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,readdir,rm,symlink,rename} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {packagePages,PAGES_FILES} from '../../tools/package-pages.mjs';

async function fixture(t){
 const temporary=await mkdtemp(path.join(os.tmpdir(),'yoru-pages-package-')),root=path.join(temporary,'web');
 t.after(()=>rm(temporary,{recursive:true,force:true}));await mkdir(root);
 for(const file of PAGES_FILES){const target=path.join(root,file);await mkdir(path.dirname(target),{recursive:true});await writeFile(target,`public:${file}`);}
 return {temporary,root};
}
async function filesIn(root,prefix=''){
 const out=[];for(const entry of await readdir(root,{withFileTypes:true})){const relative=path.join(prefix,entry.name);if(entry.isDirectory())out.push(...await filesIn(path.join(root,entry.name),relative));else out.push(relative);}
 return out.sort();
}

test('Pages packages exactly the reviewed public files and required PWA assets',async t=>{
 const {root}=await fixture(t),destination=await packagePages(root);
 assert.equal(destination,path.join(root,'dist'));
 assert.deepEqual(await filesIn(destination),[...PAGES_FILES].sort());
 assert.equal(PAGES_FILES.length,13);
 for(const file of ['index.html','yoru-no-suizokukan.html','DESIGN_GALLERY.html','sw.js','manifest.webmanifest','assets/icon-192.png','assets/icon-512.png','licenses/three-LICENSE.txt'])assert.ok(PAGES_FILES.includes(file));
 for(const file of PAGES_FILES)assert.equal(await readFile(path.join(destination,file),'utf8'),`public:${file}`);
});

test('Pages omits source, saves, credentials, dependencies and stale output without changing them',async t=>{
 const {root}=await fixture(t);
 const privateFiles=['preview-data/current.json','preview-data/arena-preview/current.json','.env','node_modules/package/index.js','main.js','dist/stale-save.json'];
 for(const file of privateFiles){const target=path.join(root,file);await mkdir(path.dirname(target),{recursive:true});await writeFile(target,'private-sentinel');}
 const destination=await packagePages(root);assert.deepEqual(await filesIn(destination),[...PAGES_FILES].sort());
 for(const file of privateFiles.filter(file=>!file.startsWith('dist/')))assert.equal(await readFile(path.join(root,file),'utf8'),'private-sentinel');
 for(const file of await filesIn(destination))assert.ok(!(await readFile(path.join(destination,file),'utf8')).includes('private-sentinel'));
});

test('a missing generated HTML fails before replacing the previous Pages output',async t=>{
 const {root}=await fixture(t);await mkdir(path.join(root,'dist'));await writeFile(path.join(root,'dist','previous.html'),'previous');await rm(path.join(root,'index.html'));
 await assert.rejects(packagePages(root),{code:'ENOENT'});assert.equal(await readFile(path.join(root,'dist','previous.html'),'utf8'),'previous');
});

test('Pages refuses symbolic links masquerading as public files',async t=>{
 const {temporary,root}=await fixture(t),secret=path.join(temporary,'private.txt');await writeFile(secret,'private-sentinel');await rm(path.join(root,'index.html'));await symlink(secret,path.join(root,'index.html'));
 await assert.rejects(packagePages(root),/regular, non-symlinked/);
});

test('Pages also refuses symbolic links in parent asset directories',async t=>{
 const {temporary,root}=await fixture(t),external=path.join(temporary,'external-assets');await rename(path.join(root,'assets'),external);await symlink(external,path.join(root,'assets'),'dir');
 await assert.rejects(packagePages(root),/regular, non-symlinked/);
});

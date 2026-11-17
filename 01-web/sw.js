// The application is self-contained; cache the PWA shell after the first online visit.
const CACHE='night-aquarium-v31',PREFIX='night-aquarium-v';
self.addEventListener('install',event=>{
 event.waitUntil((async()=>{
  const cache=await caches.open(CACHE);
  await cache.addAll(['./','./manifest.webmanifest','./assets/icon-192.png','./assets/icon-512.png']);
  // These aliases are optional so installations that expose only the root still work.
  await Promise.all(['./index.html','./yoru-no-suizokukan.html'].map(async url=>{
   try{const response=await fetch(url);if(response.ok)await cache.put(url,response);}catch(_){}
  }));
  await self.skipWaiting();
 })());
});
self.addEventListener('activate',event=>{
 event.waitUntil((async()=>{const keys=await caches.keys();await Promise.all(keys.filter(key=>key.startsWith(PREFIX)&&key!==CACHE).map(key=>caches.delete(key)));await self.clients.claim();})());
});
self.addEventListener('fetch',event=>{
 // Backup data must always reach the server; never cache or replay it offline.
 if(event.request.method!=='GET'||new URL(event.request.url).pathname.includes('/__yoru/'))return;
 event.respondWith((async()=>{
  try{
   const response=await fetch(event.request);
   if(response.ok){try{const cache=await caches.open(CACHE);await cache.put(event.request,response.clone());}catch(_){}}
   return response;
  }catch(_){return await caches.match(event.request)||new Response('オフラインです。初回は接続して開いてください。',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}});}
 })());
});

import assert from 'node:assert/strict';
import {
 parseReleaseModule,releaseIsNewer,waitingWorker,releaseUrl,probeRemoteRelease,detectAppUpdate,applyAppUpdate
} from '../dist/sw-update.mjs';

let count=0;
async function atest(name,fn){await fn();count++;console.log('PASS '+name);}

await atest('parseReleaseModule reads the player-facing label',()=>{
 assert.equal(parseReleaseModule("export const RELEASE='2.15.6';\nexport const RELEASE_NAME='Fleet Atlas';"),'2.15.6');
 assert.equal(parseReleaseModule('nope'),'');
});

await atest('releaseIsNewer compares patch and letter suffixes',()=>{
 assert.equal(releaseIsNewer('2.15.6','2.15.5'),true);
 assert.equal(releaseIsNewer('2.15.5','2.15.6'),false);
 assert.equal(releaseIsNewer('2.15.5','2.15.5'),false);
 assert.equal(releaseIsNewer('2.16.0','2.15.9'),true);
 assert.equal(releaseIsNewer('2.1.1b','2.1.1'),true);
 assert.equal(releaseIsNewer('','2.15.5'),false);
});

await atest('waitingWorker prefers a waiting then installing worker',()=>{
 const waiting={state:'installed'};
 const installing={state:'installing'};
 assert.equal(waitingWorker({waiting,installing}),waiting);
 assert.equal(waitingWorker({installing}),installing);
 assert.equal(waitingWorker({active:{}}),null);
});

await atest('releaseUrl cache-busts against the game origin',()=>{
 assert.equal(releaseUrl({href:'https://gabetc99.github.io/Nullharbor/'},()=>99),'https://gabetc99.github.io/Nullharbor/release.mjs?t=99');
 assert.equal(releaseUrl({href:'https://gabetc99.github.io/Nullharbor/index.html'},()=>7),'https://gabetc99.github.io/Nullharbor/release.mjs?t=7');
});

await atest('probeRemoteRelease uses no-store and parses the module',async()=>{
 const calls=[];
 const remote=await probeRemoteRelease({
  location:{href:'https://game.example/'},
  now:()=>12,
  fetch:async(url,opts)=>{calls.push({url,opts});return {ok:true,text:async()=>"export const RELEASE='2.16.0';"};}
 });
 assert.equal(remote,'2.16.0');
 assert.equal(calls[0].url,'https://game.example/release.mjs?t=12');
 assert.equal(calls[0].opts.cache,'no-store');
});

await atest('detectAppUpdate flags a waiting worker or newer remote release',async()=>{
 const waiting=await detectAppUpdate({
  currentRelease:'2.15.6',
  serviceWorker:{getRegistration:async()=>({waiting:{}})},
  fetch:async()=>{throw Error('offline');}
 });
 assert.equal(waiting.waiting,true);
 assert.equal(waiting.available,true);

 const newer=await detectAppUpdate({
  currentRelease:'2.15.6',
  location:{href:'https://game.example/'},
  serviceWorker:{getRegistration:async()=>({})},
  fetch:async()=>({ok:true,text:async()=>"export const RELEASE='2.15.7';"})
 });
 assert.equal(newer.newer,true);
 assert.equal(newer.remoteRelease,'2.15.7');
 assert.equal(newer.available,true);

 const same=await detectAppUpdate({
  currentRelease:'2.15.6',
  location:{href:'https://game.example/'},
  serviceWorker:{getRegistration:async()=>({})},
  fetch:async()=>({ok:true,text:async()=>"export const RELEASE='2.15.6';"})
 });
 assert.equal(same.available,false);
});

await atest('applyAppUpdate skipWaiting, unregisters, clears farbound caches, then reloads',async()=>{
 const messages=[];
 const waiting={postMessage:msg=>messages.push(['waiting',msg])};
 const active={postMessage:msg=>messages.push(['active',msg])};
 const caches=new Map([['farbound-v2.15.5',1],['farbound-v2.15.6',1],['unrelated-cache',1]]);
 let reloaded=0;
 const result=await applyAppUpdate({
  currentRelease:'2.15.6',
  location:{href:'https://game.example/',reload:()=>{reloaded++;}},
  fetch:async()=>({ok:true,text:async()=>"export const RELEASE='2.15.7';"}),
  caches:{keys:async()=>[...caches.keys()],delete:async key=>caches.delete(key)},
  serviceWorker:{
   getRegistrations:async()=>[{
    update:async()=>{},
    unregister:async()=>true,
    waiting,active
   }]
  }
 });
 assert.equal(result.online,true);
 assert.equal(result.newer,true);
 assert.equal(result.waiting,true);
 assert.equal(result.unregistered,1);
 assert.deepEqual(result.cachesCleared,['farbound-v2.15.5','farbound-v2.15.6']);
 assert.equal(caches.has('unrelated-cache'),true);
 assert.equal(caches.has('farbound-v2.15.6'),false);
 assert.deepEqual(messages,[['waiting',{type:'SKIP_WAITING'}],['active',{type:'SKIP_WAITING'}]]);
 assert.equal(result.reloaded,true);
 assert.equal(reloaded,1);
});

await atest('applyAppUpdate keeps current caches when offline so play continues',async()=>{
 const caches=new Map([['farbound-v2.15.6',1]]);
 let unregistered=0,reloaded=0,updated=0;
 const result=await applyAppUpdate({
  currentRelease:'2.15.6',
  location:{href:'https://game.example/',reload:()=>{reloaded++;}},
  fetch:async()=>{throw Error('offline');},
  caches:{keys:async()=>[...caches.keys()],delete:async key=>caches.delete(key)},
  serviceWorker:{
   getRegistrations:async()=>[{
    update:async()=>{updated++;},
    unregister:async()=>{unregistered++;return true;},
    active:{postMessage(){}}
   }]
  }
 });
 assert.equal(result.online,false);
 assert.equal(result.waiting,false);
 assert.equal(updated,1);
 assert.equal(unregistered,0);
 assert.equal(result.cachesCleared.length,0);
 assert.equal(caches.has('farbound-v2.15.6'),true);
 assert.equal(result.reloaded,true);
 assert.equal(reloaded,1);
});

console.log(`PASS ${count} service-worker update helper checks`);

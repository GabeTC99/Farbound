import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile,readdir,stat} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
const root=path.resolve('dist'),handlers={},stores=new Map(),calls=[],origin='https://game.example/';let claimed=false,skip=false;
const caches={keys:async()=>[...stores.keys()],delete:async key=>stores.delete(key),open:async key=>{if(!stores.has(key))stores.set(key,new Map());const entries=stores.get(key);return{addAll:async requests=>{for(const request of requests){const url=new URL(request.url),file=path.join(root,url.pathname==='/'?'index.html':url.pathname.slice(1));assert.equal(request.cache,'reload');assert((await stat(file)).isFile());entries.set(url.href,{url:url.href});}},match:async request=>entries.get(typeof request==='string'?new URL(request,origin).href:request.href||request.url)}}};
stores.set('farbound-v1.0.0',new Map());stores.set('unrelated-cache',new Map());
const self={location:{origin:new URL(origin).origin},registration:{scope:origin},addEventListener:(name,fn)=>handlers[name]=fn,skipWaiting:async()=>{skip=true;},clients:{claim:async()=>{claimed=true;}}};
vm.runInNewContext(await readFile(path.join(root,'sw.js'),'utf8'),{self,caches,Request,URL,fetch:request=>{calls.push(request);throw Error('Offline network unavailable');}});
async function event(name,extra={}){let pending;handlers[name]({...extra,waitUntil:p=>pending=p,respondWith:p=>pending=p});return await pending;}
await event('install');assert(skip);await event('activate');assert(claimed);assert(!stores.has('farbound-v1.0.0'));assert(stores.has('unrelated-cache'));const cache=stores.get('farbound-v2.2.1');assert.equal(cache.size,32);
for(const url of cache.keys()){const response=await event('fetch',{request:new Request(url+'?reload=2')});assert.equal(response.url,url);}
assert.equal(calls.length,0);let status;await event('message',{data:{type:'CACHE_STATUS'},ports:[{postMessage:message=>status=message}]});assert(status.ready);assert.equal(status.release,'2.2.1');
console.log('PASS Offline cache serves all 32 release and classic assets without network');
console.log('PASS Service worker activates only after caching the release and reports offline readiness');
let checked=0;async function inspect(dir){for(const file of await readdir(dir,{withFileTypes:true})){const abs=path.join(dir,file.name);if(file.isDirectory()){await inspect(abs);continue;}if(/\.(mjs|js)$/.test(file.name)){execFileSync(process.execPath,['--check',abs]);const src=await readFile(abs,'utf8');for(const [,relative]of src.matchAll(/(?:from\s*|import\s*)['"](\.\.?\/[^'"]+)['"]/g))assert((await stat(path.resolve(dir,relative))).isFile(),relative);checked++;}if(file.name.endsWith('.webmanifest'))JSON.parse(await readFile(abs,'utf8'));}}
await inspect(root);const app=await readFile(path.join(root,'app.js'),'utf8'),views=await readFile(path.join(root,'frontier-views.mjs'),'utf8');const actions=new Set([...app.matchAll(/case '([^']+)'/g)].map(m=>m[1]));for(const [,action]of (app+views).matchAll(/data-action="([a-z-]+)"/g))assert(actions.has(action),'Missing UI action '+action);
console.log(`PASS ${checked} JavaScript files parse, their imports exist, and static panel actions have handlers`);

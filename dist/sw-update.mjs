/** Clean service-worker refresh for Pages beta builds. Update is a user action. */

export function parseReleaseModule(src){
  const m=String(src||'').match(/export const RELEASE='([^']+)'/);
  return m?m[1]:'';
}

export function releaseIsNewer(remote,current){
  if(!remote||!current||remote===current)return false;
  const parts=v=>String(v).replace(/[a-z]+$/i,'').split('.').map(n=>Number(n)||0);
  const a=parts(remote),b=parts(current),n=Math.max(a.length,b.length);
  for(let i=0;i<n;i++){
    const d=(a[i]||0)-(b[i]||0);
    if(d)return d>0;
  }
  return String(remote)>String(current);
}

export function waitingWorker(registration){
  return registration?.waiting||registration?.installing||null;
}

export function releaseUrl(location,now=Date.now){
  const href=location?.href||'https://example/';
  const url=new URL('release.mjs',href);
  url.searchParams.set('t',String(typeof now==='function'?now():now));
  return url.href;
}

export async function probeRemoteRelease(env={}){
  const fetchImpl=env.fetch??globalThis.fetch;
  const location=env.location??globalThis.location;
  if(typeof fetchImpl!=='function'||!location)return '';
  const res=await fetchImpl(releaseUrl(location,env.now),{cache:'no-store'});
  if(!res?.ok)return '';
  return parseReleaseModule(await res.text());
}

export async function detectAppUpdate(env={}){
  const serviceWorker=env.serviceWorker??globalThis.navigator?.serviceWorker;
  const currentRelease=env.currentRelease||'';
  const found={available:false,waiting:false,remoteRelease:'',newer:false};
  if(serviceWorker?.getRegistration){
    try{
      const reg=await serviceWorker.getRegistration();
      if(waitingWorker(reg)){found.waiting=true;found.available=true;}
    }catch{}
  }
  try{
    found.remoteRelease=await probeRemoteRelease(env);
    found.newer=releaseIsNewer(found.remoteRelease,currentRelease);
    if(found.newer)found.available=true;
  }catch{}
  return found;
}

export async function applyAppUpdate(env={}){
  const serviceWorker=env.serviceWorker??globalThis.navigator?.serviceWorker;
  const cacheStorage=env.caches??globalThis.caches;
  const location=env.location??globalThis.location;
  const currentRelease=env.currentRelease||'';
  const shouldReload=env.reload!==false;
  const result={remoteRelease:'',newer:false,waiting:false,updated:false,unregistered:0,cachesCleared:[],reloaded:false,online:false};

  try{
    result.remoteRelease=await probeRemoteRelease(env);
    result.newer=releaseIsNewer(result.remoteRelease,currentRelease);
    result.online=!!result.remoteRelease;
  }catch{}

  let regs=[];
  if(serviceWorker?.getRegistrations){
    try{regs=await serviceWorker.getRegistrations();}catch{regs=[];}
  }

  for(const reg of regs){
    try{await reg.update();}catch{}
    const worker=waitingWorker(reg);
    if(worker){
      result.waiting=true;
      try{worker.postMessage({type:'SKIP_WAITING'});}catch{}
    }
    try{reg.active?.postMessage({type:'SKIP_WAITING'});}catch{}
  }

  // Online or a waiting worker: drop the old SW and farbound caches so reload
  // fetches the new Pages build. Offline: keep the current cache so play continues.
  if(result.online||result.waiting){
    for(const reg of regs){
      try{if(await reg.unregister())result.unregistered++;}catch{}
    }
    if(cacheStorage?.keys){
      try{
        for(const key of await cacheStorage.keys()){
          if(String(key).startsWith('farbound-')){
            await cacheStorage.delete(key);
            result.cachesCleared.push(key);
          }
        }
      }catch{}
    }
  }

  result.updated=result.waiting||result.unregistered>0||result.cachesCleared.length>0||result.newer||result.online;
  if(shouldReload&&location){
    result.reloaded=true;
    if(typeof location.reload==='function')location.reload();
  }
  return result;
}

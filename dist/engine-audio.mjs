/** Fade both ends of a looping buffer so the wrap is not a click. */
export function fadeLoopBuffer(data, fadeSamples){
 if(!data||!data.length)return data;
 const n=data.length,f=Math.max(1,Math.min(fadeSamples|0,n>>3));
 for(let i=0;i<f;i++){
  const w=i/f;
  data[i]*=w;
  data[n-1-i]*=w;
 }
 return data;
}
/** Remove DC so gain changes do not thump. */
export function removeDc(data){
 if(!data||!data.length)return data;
 let s=0;for(let i=0;i<data.length;i++)s+=data[i];
 const mean=s/data.length;
 if(Math.abs(mean)<1e-12)return data;
 for(let i=0;i<data.length;i++)data[i]-=mean;
 return data;
}
export function prepareLoopSamples(data, sampleRate=48000){
 removeDc(data);
 fadeLoopBuffer(data, Math.max(64, Math.round((sampleRate||48000)*0.016)));
 return data;
}
function paramNow(param){
 const v=Number(param?.value);
 return Number.isFinite(v)?v:0;
}
/** Click-free gain change. Never setValueAtTime to a new level without a ramp. */
export function rampGain(param, value, t, seconds=0.04){
 if(!param)return;
 const dur=Math.max(0.018,seconds);
 const from=Math.max(0,paramNow(param));
 const to=Math.max(0,value);
 try{
  param.cancelScheduledValues(t);
  if(to<=0){
   const start=Math.max(from,1e-4);
   param.setValueAtTime(start,t);
   param.exponentialRampToValueAtTime(1e-4,t+dur);
   param.setValueAtTime(0,t+dur+0.001);
  }else if(from<=1e-5){
   param.setValueAtTime(1e-4,t);
   param.exponentialRampToValueAtTime(to,t+dur);
  }else{
   param.setValueAtTime(from,t);
   param.linearRampToValueAtTime(to,t+dur);
  }
 }catch{
  try{param.value=to;}catch{}
 }
}

/** Audio Designer MP3s. Stems match filenames under dist/assets/audio/planetary/. */
export const PLANETARY_AUDIO_DIR='assets/audio/planetary/';
export const PLANETARY_AMBIENT_KINDS=['earthlike','ocean','arid','ice','metal','mineral','volcanic','barren','toxic','gas','icegiant'];
export const PLANETARY_GRIT_KINDS=PLANETARY_AMBIENT_KINDS;
export const PLANETARY_AUDIO_STEMS=[
 ...PLANETARY_AMBIENT_KINDS.map(id=>'ambient_'+id),
 ...PLANETARY_GRIT_KINDS.map(id=>'grit_'+id),
 'pad_inspect_start','pad_inspect_loop','pad_inspect_stop','embark_whoosh'
];
export function planetaryAudioFile(stem){return PLANETARY_AUDIO_DIR+stem+'.mp3';}
/** Hull thruster loops and flyby/land oneshots. Stems match dist/assets/audio/ships/. */
export const SHIP_AUDIO_DIR='assets/audio/ships/';
export const SHIP_AUDIO_HULLS=['wren','sparrow','kestrel','mule','rook','tern','jackal','magpie','mole','osprey','falcon','albatross','ox','vulture','heron','badger','raptor','condor','goliath','eagle'];
export const SHIP_AUDIO_READY=['wren','sparrow','kestrel','mule','rook','tern','jackal','magpie','mole','osprey','falcon','albatross','ox','vulture','heron','badger','raptor','condor','goliath','eagle'];
export const SHIP_AUDIO_KINDS=['thruster','flyby','land'];
export const SHIP_AUDIO_STEMS=SHIP_AUDIO_READY.flatMap(hull=>SHIP_AUDIO_KINDS.map(kind=>kind+'_'+hull));
export function shipAudioFile(stem){return SHIP_AUDIO_DIR+stem+'.mp3';}
export function shipAudioCue(kind,hullId){
 const stem=kind+'_'+hullId;
 return SHIP_AUDIO_STEMS.includes(stem)?stem:null;
}
/** Plated hull cue, else null so thrust stays on the oscillator and flyby/land stay silent. A plated hull with a missing stem falls back to embark_whoosh. */
export function resolveShipCue(kind,hullId){
 const stem=shipAudioCue(kind,hullId);
 if(stem)return stem;
 if((kind==='flyby'||kind==='land')&&SHIP_AUDIO_HULLS.includes(hullId))return 'embark_whoosh';
 return null;
}
export function cueAssetUrl(file){
 try{
  const base=globalThis.location?.href||globalThis.document?.baseURI;
  if(base)return new URL(file,base).href;
 }catch{}
 return file;
}
export function surfaceAmbientCue(kindId){
 return PLANETARY_AMBIENT_KINDS.includes(kindId)?'ambient_'+kindId:null;
}
export function surfaceGritCue(kindId){
 return PLANETARY_GRIT_KINDS.includes(kindId)?'grit_'+kindId:null;
}
/** Crack-like beds. Longer gap and lower gain so ice does not read as gunfire. */
export const GRIT_HARSH_KINDS=['ice','icegiant','volcanic','metal'];
export function gritInterval(kindId,sprint=false){
 const harsh=GRIT_HARSH_KINDS.includes(kindId);
 if(sprint)return harsh?1.2:.75;
 return harsh?1.9:1.15;
}
/** Gain into the shared cue bus. Harsh kinds sit further under ambient. */
export function gritLevel(kindId){
 return GRIT_HARSH_KINDS.includes(kindId)?.22:.42;
}
/** Ship MP3s into the cue bus. Thruster loops sit under the sky bed; flyby/land are a step hotter. */
export const SHIP_THRUST_LEVEL=.30;
export const SHIP_SHOT_LEVEL=.42;
export const NPC_THRUSTER_CAP=3;
export const NPC_HEAR=780;
export const NPC_FLYBY=280;
/** Traffic roles are not plated hull ids. Map them onto READY stems for cues only. */
export const NPC_CUE_HULL={
 courier:'tern',freighter:'ox',tender:'rook',prospector:'mole',surveyor:'heron',security:'kestrel',pirate:'jackal'
};
export function cueHullId(hullId){
 if(SHIP_AUDIO_READY.includes(hullId))return hullId;
 return NPC_CUE_HULL[hullId]||null;
}
/** Patrols and pirates often have no hull string. Security voices kestrel; other hostiles voice jackal. */
export function npcCueHull(ship){
 if(!ship)return null;
 if(ship.hull)return cueHullId(ship.hull);
 const id=String(ship.id||'');
 const security=!!ship.response||id.startsWith('patrol-')||ship.type==='patrol';
 if(security)return cueHullId('security');
 if(ship.type==='enemy')return cueHullId('pirate');
 return null;
}
export function pickNpcThrusters(ships,listener,{cap=NPC_THRUSTER_CAP,hear=NPC_HEAR}={}){
 const ox=listener?.x||0,oy=listener?.y||0,ranked=[];
 for(const ship of ships||[]){
  if(!ship||!(ship.thrust>0.08))continue;
  const hull=npcCueHull(ship);
  if(!hull)continue;
  const d=Math.hypot((ship.x||0)-ox,(ship.y||0)-oy);
  if(d>hear)continue;
  ranked.push({id:ship.id,ship,hull,d,gain:Math.max(.18,1-d/hear)});
 }
 ranked.sort((a,b)=>a.d-b.d);
 return ranked.slice(0,cap);
}

/** Fired in-game ids stay surface.*; preferred stems are aliases + file: fields. */
export const SURFACE_AUDIO_CUES={
 embark:'surface.embark',
 takeoff:'surface.takeoff',
 embarkWhoosh:'embark_whoosh',
 inspectStart:'surface.inspect.start',
 inspectLoop:'surface.inspect.loop',
 inspectStop:'surface.inspect.stop',
 padInspectStart:'pad_inspect_start',
 padInspectLoop:'pad_inspect_loop',
 padInspectStop:'pad_inspect_stop'
};
const CUE_CANON={
 embark_whoosh:'surface.embark',
 pad_inspect_start:'surface.inspect.start',
 pad_inspect_loop:'surface.inspect.loop',
 pad_inspect_stop:'surface.inspect.stop'
};
function cueDef(type,stem,extra={}){return {type,file:planetaryAudioFile(stem),...extra};}
export const AUDIO_CUES={
 [SURFACE_AUDIO_CUES.embark]:cueDef('oneshot','embark_whoosh'),
 [SURFACE_AUDIO_CUES.takeoff]:cueDef('oneshot','embark_whoosh'),
 [SURFACE_AUDIO_CUES.embarkWhoosh]:cueDef('oneshot','embark_whoosh'),
 [SURFACE_AUDIO_CUES.inspectStart]:cueDef('oneshot','pad_inspect_start'),
 [SURFACE_AUDIO_CUES.inspectLoop]:cueDef('loop','pad_inspect_loop'),
 [SURFACE_AUDIO_CUES.inspectStop]:cueDef('oneshot','pad_inspect_stop',{stops:SURFACE_AUDIO_CUES.inspectLoop}),
 [SURFACE_AUDIO_CUES.padInspectStart]:cueDef('oneshot','pad_inspect_start'),
 [SURFACE_AUDIO_CUES.padInspectLoop]:cueDef('loop','pad_inspect_loop'),
 [SURFACE_AUDIO_CUES.padInspectStop]:cueDef('oneshot','pad_inspect_stop',{stops:SURFACE_AUDIO_CUES.inspectLoop}),
 ...Object.fromEntries(PLANETARY_AMBIENT_KINDS.flatMap(id=>[
  ['ambient_'+id,cueDef('loop','ambient_'+id)],
  ['grit_'+id,cueDef('oneshot','grit_'+id,{solo:true})]
 ])),
 ...Object.fromEntries(SHIP_AUDIO_STEMS.map(stem=>[stem,{type:stem.startsWith('thruster_')?'loop':'oneshot',file:shipAudioFile(stem)}]))
};
export function resolveAudioCue(name){return CUE_CANON[name]||name;}

export class EngineAudio{
 constructor(){this.context=null;this.humReady=false;this.ambReady=false;this.foldReady=false;this.lastCue=null;this.cueLog=[];this.loops=new Set();this.cueSources=new Map();this.cueGen=new Map();this.cueVolume=.35;}
 playCue(name){
  const canon=resolveAudioCue(name);
  const def=AUDIO_CUES[canon]||AUDIO_CUES[name];
  if(!def)return false;
  this.lastCue=name;
  this.cueLog.push(name);
  if(this.cueLog.length>24)this.cueLog.shift();
  if(def.type==='loop')this.loops.add(canon);
  if(def.stops)this.stopCue(def.stops);
  this.playCueFile(canon,def);
  return true;
 }
 isCueLooping(name){return this.loops.has(resolveAudioCue(name));}
 stopCue(name){
  const canon=resolveAudioCue(name);
  this.loops.delete(canon);
  this.stopCueFile(canon);
  return true;
 }
 playCueFile(canon,def){
  if(!def?.file)return;
  if(!this.context){try{this.unlock();}catch{}}
  if(!this.context)return;
  if(this.context.state==='suspended')this.context.resume?.().catch(()=>{});
  const gen=def.type==='loop'?(this.cueGen.set(canon,(this.cueGen.get(canon)||0)+1),this.cueGen.get(canon)):0;
  this.ensureCueBuffer(def.file).then(buffer=>{
   if(!buffer||!this.context)return;
   if(def.type==='loop'&&(!this.loops.has(canon)||this.cueGen.get(canon)!==gen))return;
   this.startCueSource(canon,def,buffer);
  }).catch(()=>{});
 }
 ensureGritGain(){
  this.ensureCueGain();
  if(this.gritGain||!this.context||!this.cueGain)return;
  const g=this.context.createGain();
  g.gain.value=.42;
  g.connect(this.cueGain);
  this.gritGain=g;
 }
 ensureShipGains(){
  this.ensureCueGain();
  if(!this.context||!this.cueGain)return;
  if(!this.shipThrustGain){
   const g=this.context.createGain();
   g.gain.value=SHIP_THRUST_LEVEL;
   g.connect(this.cueGain);
   this.shipThrustGain=g;
  }
  if(!this.shipShotGain){
   const g=this.context.createGain();
   g.gain.value=SHIP_SHOT_LEVEL;
   g.connect(this.cueGain);
   this.shipShotGain=g;
  }
 }
 gritKind(canon){return String(canon||'').startsWith('grit_')?canon.slice(5):null;}
 ensureCueGain(){
  if(this.cueGain||!this.context)return;
  const g=this.context.createGain();
  g.gain.value=this.cueVolume;
  g.connect(this.context.destination);
  this.cueGain=g;
 }
 ensureCueBuffer(file){
  this.cueBuffers||(this.cueBuffers=new Map());
  this.cueLoads||(this.cueLoads=new Map());
  if(this.cueBuffers.has(file))return Promise.resolve(this.cueBuffers.get(file));
  if(this.cueLoads.has(file))return this.cueLoads.get(file);
  const p=(async()=>{
   const res=await fetch(cueAssetUrl(file));
   if(!res.ok)throw new Error('cue '+res.status);
   const raw=await res.arrayBuffer();
   const audio=await this.context.decodeAudioData(raw.slice(0));
   this.cueBuffers.set(file,audio);
   return audio;
  })();
  this.cueLoads.set(file,p);
  p.finally(()=>this.cueLoads.delete(file));
  return p;
 }
 copyCueBuffer(buffer){
  const ctx=this.context;
  if(!ctx?.createBuffer||!buffer?.getChannelData||!buffer.numberOfChannels||!buffer.length)return buffer;
  try{
   const copy=ctx.createBuffer(buffer.numberOfChannels,buffer.length,buffer.sampleRate||ctx.sampleRate||44100);
   for(let c=0;c<buffer.numberOfChannels;c++)copy.getChannelData(c).set(buffer.getChannelData(c));
   return copy;
  }catch{return buffer;}
 }
 startCueSource(canon,def,buffer){
  this.ensureCueGain();
  if(!this.cueGain)return;
  if(def.type==='loop'||def.solo)this.stopCueFile(canon);
  const grit=def.solo?this.gritKind(canon):null;
  const name=String(canon||'');
  const shipKind=name.startsWith('thruster_')?'thrust':((name.startsWith('flyby_')||name.startsWith('land_'))?'shot':null);
  let bus=this.cueGain;
  if(grit){
   this.ensureGritGain();
   if(!this.gritGain)return;
   const level=gritLevel(grit);
   try{this.gritGain.gain.value=level;}catch{}
   bus=this.gritGain;
  }else if(shipKind){
   this.ensureShipGains();
   bus=shipKind==='thrust'?this.shipThrustGain:this.shipShotGain;
   if(!bus)return;
  }
  const src=this.context.createBufferSource();
  src.buffer=this.copyCueBuffer(buffer);
  src.loop=def.type==='loop';
  src.connect(bus);
  try{src.start(this.context.currentTime||0);}catch{return;}
  if(def.type==='loop'||def.solo)this.cueSources.set(canon,src);
 }
 stopCueFile(canon){
  const src=this.cueSources.get(canon);
  if(!src)return;
  this.cueSources.delete(canon);
  try{src.stop();}catch{}
 }
 preloadPlanetaryCues(){
  if(!this.context||this.cuePreloaded)return;
  this.cuePreloaded=true;
  for(const stem of PLANETARY_AUDIO_STEMS)this.ensureCueBuffer(planetaryAudioFile(stem)).catch(()=>{});
  for(const stem of SHIP_AUDIO_STEMS)this.ensureCueBuffer(shipAudioFile(stem)).catch(()=>{});
 }
 syncHullThruster({hull,thrust=0,live=false}={}){
  const want=live&&thrust>0.08?shipAudioCue('thruster',hull):null;
  this.hullThrusterOn=!!want;
  if(want&&want===this.hullThrusterCue){
   if(!this.isCueLooping(want))this.playCue(want);
   return;
  }
  if(this.hullThrusterCue)this.stopCue(this.hullThrusterCue);
  this.hullThrusterCue=want;
  if(want)this.playCue(want);
 }
 stopNpcLoop(id){
  const slot=this.npcLoops?.get(id);
  if(!slot)return;
  this.npcLoops.delete(id);
  try{slot.src?.stop();}catch{}
 }
 stopAllNpc(){
  if(!this.npcLoops)return;
  for(const id of [...this.npcLoops.keys()])this.stopNpcLoop(id);
 }
 startNpcLoop(id,stem,level){
  this.ensureShipGains();
  if(!this.shipThrustGain||!this.context)return;
  const def=AUDIO_CUES[stem];
  if(!def?.file)return;
  this.npcLoops||(this.npcLoops=new Map());
  const gen=(this.npcGen=(this.npcGen||0)+1);
  const g=this.context.createGain();
  try{g.gain.value=level;}catch{}
  g.connect(this.shipThrustGain);
  const slot={stem,src:null,gain:g,gen};
  this.npcLoops.set(id,slot);
  this.ensureCueBuffer(def.file).then(buffer=>{
   const cur=this.npcLoops.get(id);
   if(!buffer||!cur||cur.gen!==gen||!this.context)return;
   const src=this.context.createBufferSource();
   src.buffer=this.copyCueBuffer(buffer);
   src.loop=true;
   src.connect(g);
   try{src.start(this.context.currentTime||0);}catch{return;}
   cur.src=src;
  }).catch(()=>{});
 }
 playNpcShot(stem,level){
  this.ensureShipGains();
  if(!this.shipShotGain||!this.context)return;
  const def=AUDIO_CUES[stem];
  if(!def?.file)return;
  this.ensureCueBuffer(def.file).then(buffer=>{
   if(!buffer||!this.context||!this.shipShotGain)return;
   const g=this.context.createGain();
   try{g.gain.value=Math.max(0,Math.min(1,level));}catch{}
   g.connect(this.shipShotGain);
   const src=this.context.createBufferSource();
   src.buffer=this.copyCueBuffer(buffer);
   src.loop=false;
   src.connect(g);
   try{src.start(this.context.currentTime||0);}catch{}
  }).catch(()=>{});
 }
 syncNpcShots(ships,listener){
  this.npcNear||(this.npcNear=new Set());
  this.npcStatus||(this.npcStatus=new Map());
  const ox=listener?.x||0,oy=listener?.y||0,seen=new Set();
  for(const ship of ships||[]){
   if(!ship?.id)continue;
   seen.add(ship.id);
   const hull=npcCueHull(ship);
   const d=Math.hypot((ship.x||0)-ox,(ship.y||0)-oy);
   const near=d<=NPC_FLYBY;
   const was=this.npcNear.has(ship.id);
   if(hull&&ship.thrust>0.08&&near&&!was&&d<=NPC_HEAR){
    const stem=shipAudioCue('flyby',hull);
    if(stem)this.playNpcShot(stem,Math.max(.35,1-d/NPC_HEAR));
   }
   if(near)this.npcNear.add(ship.id);else this.npcNear.delete(ship.id);
   const status=ship.status||'';
   if(!this.npcStatus.has(ship.id))this.npcStatus.set(ship.id,status);
   else if(this.npcStatus.get(ship.id)!==status){
    this.npcStatus.set(ship.id,status);
    if(status==='DOCKED'&&hull&&d<=NPC_HEAR){
     const stem=shipAudioCue('land',hull);
     if(stem)this.playNpcShot(stem,Math.max(.35,1-d/NPC_HEAR));
    }
   }
  }
  for(const id of [...this.npcNear])if(!seen.has(id))this.npcNear.delete(id);
  for(const id of [...this.npcStatus.keys()])if(!seen.has(id))this.npcStatus.delete(id);
 }
 syncNpcShips({ships=[],x=0,y=0,live=false}={}){
  this.npcLoops||(this.npcLoops=new Map());
  if(!live){this.stopAllNpc();return;}
  const picked=pickNpcThrusters(ships,{x,y});
  const keep=new Set(picked.map(p=>p.id));
  for(const id of [...this.npcLoops.keys()])if(!keep.has(id))this.stopNpcLoop(id);
  for(const p of picked){
   const stem=shipAudioCue('thruster',p.hull);
   if(!stem)continue;
   const prev=this.npcLoops.get(p.id);
   if(prev&&prev.stem===stem){try{prev.gain.gain.value=p.gain;}catch{}continue;}
   if(prev)this.stopNpcLoop(p.id);
   this.startNpcLoop(p.id,stem,p.gain);
  }
  this.syncNpcShots(ships,{x,y});
 }
 setCueVolume(vol){
  this.cueVolume=Math.max(0,Math.min(1,Number(vol)||0));
  const g=this.cueGain?.gain;
  if(!g)return;
  try{
   if(this.context&&g.setTargetAtTime)g.setTargetAtTime(this.cueVolume,this.context.currentTime,.04);
   else g.value=this.cueVolume;
  }catch{try{g.value=this.cueVolume;}catch{}}
 }
 unlock(){
  if(!this.context){
   const Audio=globalThis.AudioContext||globalThis.webkitAudioContext;if(!Audio)return;
   const c=new Audio();this.context=c;
   this.low=c.createOscillator();this.mid=c.createOscillator();this.gain=c.createGain();this.filter=c.createBiquadFilter();
   this.low.type='sine';this.mid.type='triangle';this.gain.gain.value=0;this.filter.type='lowpass';this.filter.frequency.value=160;
   this.low.connect(this.filter);this.mid.connect(this.filter);this.filter.connect(this.gain);this.gain.connect(c.destination);
   this.low.start();this.mid.start();
  }
  this.ensureHum();
  this.ensureAmb();
  this.ensureFold();
  if(this.context.state==='suspended'){
   this.silenceInstant();
   this.context.resume().catch(()=>{});
  }
  this.preloadPlanetaryCues();
 }
 gains(){return [this.gain,this.humGain,this.noiseGain,this.ambGain,this.foldGain,this.foldNoiseGain];}
 silenceInstant(){
  if(!this.context)return;
  const t=this.context.currentTime;
  for(const g of this.gains()){
   if(!g)continue;
   try{g.gain.cancelScheduledValues(t);g.gain.setValueAtTime(0,t);}catch{try{g.gain.value=0;}catch{}}
  }
 }
 ensureHum(){
  if(!this.context||this.humReady)return;
  const c=this.context;
  // Fixed-pitch habitat bed. Do not retarget frequency each frame — that drifts and feels like speeding up.
  this.hum=c.createOscillator();this.hum2=c.createOscillator();
  this.humGain=c.createGain();this.humFilter=c.createBiquadFilter();
  this.hum.type='sine';this.hum2.type='sine';
  this.hum.frequency.value=88;this.hum2.frequency.value=132;
  this.humFilter.type='lowpass';this.humFilter.frequency.value=200;this.humFilter.Q.value=.45;
  this.humGain.gain.value=0;
  this.hum2Gain=c.createGain();this.hum2Gain.gain.value=.3;
  this.hum.connect(this.humFilter);
  this.hum2.connect(this.hum2Gain);this.hum2Gain.connect(this.humFilter);
  this.humFilter.connect(this.humGain);this.humGain.connect(c.destination);
  this.hum.start();this.hum2.start();
  const seconds=4,rate=c.sampleRate,buffer=c.createBuffer(1,rate*seconds,rate),data=buffer.getChannelData(0);
  let b0=0,b1=0,b2=0;
  for(let i=0;i<data.length;i++){
   const w=Math.random()*2-1;
   b0=.99886*b0+w*.0555179;b1=.99332*b1+w*.0750759;b2=.96900*b2+w*.1538520;
   data[i]=(b0+b1+b2)*.14;
  }
  prepareLoopSamples(data,rate);
  this.noise=c.createBufferSource();this.noise.buffer=buffer;this.noise.loop=true;
  this.noiseFilter=c.createBiquadFilter();this.noiseFilter.type='lowpass';this.noiseFilter.frequency.value=150;this.noiseFilter.Q.value=.4;
  this.noiseGain=c.createGain();this.noiseGain.gain.value=0;
  this.noise.connect(this.noiseFilter);this.noiseFilter.connect(this.noiseGain);this.noiseGain.connect(c.destination);
  this.noise.start();
  this.humReady=true;
 }
 ensureAmb(){
  if(!this.context||this.ambReady)return;
  const c=this.context;
  // Space / surface ambient — gain and filter only; pitch locked.
  const seconds=5,rate=c.sampleRate,buffer=c.createBuffer(1,rate*seconds,rate),data=buffer.getChannelData(0);
  let b0=0,b1=0,b2=0;
  for(let i=0;i<data.length;i++){
   const w=Math.random()*2-1;
   b0=.997*b0+w*.05;b1=.985*b1+w*.07;b2=.96*b2+w*.12;
   data[i]=(b0+b1+b2)*.11;
  }
  prepareLoopSamples(data,rate);
  this.amb=c.createBufferSource();this.amb.buffer=buffer;this.amb.loop=true;
  this.ambFilter=c.createBiquadFilter();this.ambFilter.type='lowpass';this.ambFilter.frequency.value=220;this.ambFilter.Q.value=.35;
  this.ambGain=c.createGain();this.ambGain.gain.value=0;
  this.amb.connect(this.ambFilter);this.ambFilter.connect(this.ambGain);this.ambGain.connect(c.destination);
  this.amb.start();
  this.ambReady=true;
 }
 update({moving=0,boost=false,volume=.35,enabled=true,paused=false,surface=false,station=false,sky='clear',surfaceKind='mineral',planetFeet=false,hull=null,thrust=0,ships=null,listenerX=0,listenerY=0}={}){
  const vol=Math.pow(Math.max(0,Math.min(1,volume)),1.15);
  const live=enabled&&!paused;
  this.setCueVolume(live?vol:0);
  if(!this.context)return;
  this.ensureHum();
  this.ensureAmb();
  const t=this.context.currentTime,n=Math.max(0,Math.min(1,moving));
  this.syncHullThruster({hull,thrust,live:live&&!station&&!surface&&!planetFeet});
  this.syncNpcShips({ships,x:listenerX,y:listenerY,live:live&&!surface&&!planetFeet});
  const hullTone=this.hullThrusterOn?0:1;
  this.gain.gain.setTargetAtTime(live&&!station&&!planetFeet?vol*n*hullTone*.32:0,t,.12);
  this.low.frequency.setTargetAtTime(38+n*24+(boost?14:0)+(surface?5:0),t,.18);
  this.mid.frequency.setTargetAtTime(77+n*45+(boost?19:0),t,.18);
  this.filter.frequency.setTargetAtTime(100+n*150+(boost?75:0),t,.2);
  const stationHum=live&&station&&!planetFeet;
  const bed=Math.max(vol,.25);
  if(this.humGain)this.humGain.gain.setTargetAtTime(stationHum?bed*.26:0,t,.4);
  if(this.noiseGain)this.noiseGain.gain.setTargetAtTime(stationHum?bed*.055:0,t,.45);

  // Ambient: space sky bed, or surface/planet wind. Filter cutoff locked per mode (no drift).
  let ambGain=0,ambCut=180;
  if(live&&!stationHum){
   if(surface||planetFeet){
    const wind={earthlike:.046,ocean:.045,arid:.055,ice:.038,metal:.05,mineral:.048,volcanic:.058,barren:.04,toxic:.05,gas:.05,icegiant:.042}[surfaceKind]||.048;
    ambGain=bed*(planetFeet?wind*.7:wind);
    ambCut={earthlike:175,ocean:160,arid:240,ice:140,metal:200,mineral:190,volcanic:260,barren:150,toxic:210,gas:210,icegiant:150}[surfaceKind]||190;
   }else{
    const skyBed={clear:.028,nebula:.034,storm:.05,ion:.036,dust:.032,deep:.014}[sky]||.028;
    ambGain=bed*skyBed;
    ambCut={clear:200,nebula:160,storm:320,ion:240,dust:180,deep:110}[sky]||200;
   }
  }
  if(this.ambFilter)this.ambFilter.frequency.setTargetAtTime(ambCut,t,.5);
  if(this.ambGain)this.ambGain.gain.setTargetAtTime(ambGain,t,.45);
 }
 mute(){
  if(!this.context)return;
  rampGain(this.gain.gain,0,this.context.currentTime,.05);
 }
 muteAll(){
  this.setCueVolume(0);
  for(const canon of [...this.cueSources.keys()])this.stopCueFile(canon);
  if(!this.context)return;
  const t=this.context.currentTime;
  for(const g of this.gains()){
   if(g)rampGain(g.gain,0,t,.05);
  }
 }
 ensureFold(){
  if(!this.context||this.foldReady)return;
  const c=this.context;
  this.foldOsc=c.createOscillator();this.foldOsc2=c.createOscillator();
  this.foldGain=c.createGain();this.foldFilter=c.createBiquadFilter();
  this.foldOsc.type='sawtooth';this.foldOsc2.type='sine';
  this.foldOsc.frequency.value=70;this.foldOsc2.frequency.value=105;
  this.foldFilter.type='lowpass';this.foldFilter.frequency.value=420;this.foldFilter.Q.value=.6;
  this.foldGain.gain.value=0;
  this.foldOsc2Gain=c.createGain();this.foldOsc2Gain.gain.value=.45;
  this.foldOsc.connect(this.foldFilter);this.foldOsc2.connect(this.foldOsc2Gain);this.foldOsc2Gain.connect(this.foldFilter);
  this.foldFilter.connect(this.foldGain);this.foldGain.connect(c.destination);
  this.foldOsc.start();this.foldOsc2.start();
  const seconds=2,rate=c.sampleRate,buffer=c.createBuffer(1,rate*seconds,rate),data=buffer.getChannelData(0);
  for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*.35;
  prepareLoopSamples(data,rate);
  this.foldNoise=c.createBufferSource();this.foldNoise.buffer=buffer;this.foldNoise.loop=true;
  this.foldNoiseFilter=c.createBiquadFilter();this.foldNoiseFilter.type='bandpass';this.foldNoiseFilter.frequency.value=900;this.foldNoiseFilter.Q.value=.8;
  this.foldNoiseGain=c.createGain();this.foldNoiseGain.gain.value=0;
  this.foldNoise.connect(this.foldNoiseFilter);this.foldNoiseFilter.connect(this.foldNoiseGain);this.foldNoiseGain.connect(c.destination);
  this.foldNoise.start();
  this.foldReady=true;
 }
 /** progress 0..1 while fold drive charges; 0 when idle. */
 setFoldCharge(progress=0,volume=.35,enabled=true){
  if(!this.context)return;
  this.ensureFold();
  const t=this.context.currentTime,p=Math.max(0,Math.min(1,progress)),vol=Math.pow(Math.max(0,Math.min(1,volume)),1.15);
  const live=enabled&&p>0;
  const tone=live?vol*(.04+.09*p):0;
  const hiss=live?vol*(.01+.045*p*p):0;
  this.foldGain.gain.setTargetAtTime(tone,t,.08);
  this.foldNoiseGain.gain.setTargetAtTime(hiss,t,.1);
  if(live){
   this.foldOsc.frequency.setTargetAtTime(68+p*210,t,.12);
   this.foldOsc2.frequency.setTargetAtTime(102+p*260,t,.12);
   this.foldFilter.frequency.setTargetAtTime(280+p*900,t,.14);
   this.foldNoiseFilter.frequency.setTargetAtTime(600+p*1400,t,.14);
  }
 }
 playFoldJump(volume=.35){
  if(!this.context)return;
  const c=this.context,t=c.currentTime,vol=Math.pow(Math.max(0,Math.min(1,volume)),1.15)*.55;
  const o=c.createOscillator(),g=c.createGain(),f=c.createBiquadFilter();
  o.type='sawtooth';o.frequency.setValueAtTime(180,t);o.frequency.exponentialRampToValueAtTime(42,t+.38);
  f.type='lowpass';f.frequency.setValueAtTime(1800,t);f.frequency.exponentialRampToValueAtTime(220,t+.4);
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+.04);g.gain.exponentialRampToValueAtTime(.001,t+.45);
  o.connect(f);f.connect(g);g.connect(c.destination);o.start(t);o.stop(t+.48);
  const seconds=.35,rate=c.sampleRate,buffer=c.createBuffer(1,rate*seconds,rate),data=buffer.getChannelData(0);
  for(let i=0;i<data.length;i++){const e=1-i/data.length;data[i]=(Math.random()*2-1)*e*e;}
  const n=c.createBufferSource();n.buffer=buffer;
  const ng=c.createGain(),nf=c.createBiquadFilter();
  nf.type='highpass';nf.frequency.value=400;
  ng.gain.setValueAtTime(0,t);ng.gain.linearRampToValueAtTime(vol*.7,t+.02);ng.gain.exponentialRampToValueAtTime(.001,t+.32);
  n.connect(nf);nf.connect(ng);ng.connect(c.destination);n.start(t);n.stop(t+.35);
 }
 playFoldArrive(volume=.35){
  if(!this.context)return;
  const c=this.context,t=c.currentTime,vol=Math.pow(Math.max(0,Math.min(1,volume)),1.15)*.4;
  const tones=[220,330,440];
  tones.forEach((hz,i)=>{
   const o=c.createOscillator(),g=c.createGain();
   o.type='sine';o.frequency.value=hz;
   const start=t+.05+i*.07;
   g.gain.setValueAtTime(0,start);g.gain.linearRampToValueAtTime(vol*(.7-i*.15),start+.03);g.gain.exponentialRampToValueAtTime(.001,start+.42);
   o.connect(g);g.connect(c.destination);o.start(start);o.stop(start+.45);
  });
 }
}

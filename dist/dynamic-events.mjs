/**
 * Modular Dynamic Events — ambient drama layered on existing NPC/security/wake systems.
 * Registry-driven: add defs to EVENT_DEFS without rewriting the manager.
 */
import {FACTIONS} from './catalog.mjs';
import {dist,clamp,jumpDistance,SYSTEMS,getStats,cargoUsed} from './core.mjs';
import {pickTradeDestination} from './atmosphere.mjs';

export const EVENT_CONFIG={
 checkInterval:18,
 cooldown:48,
 maxActive:2,
 baseChance:.32,
 spawnClearance:420,
 signalRange:1400,
 notifyRange:1100,
 maxEventShips:6,
 log:false
};

const log=(...a)=>{if(EVENT_CONFIG.log)console.log('[dyn]',...a);};
let seq=0;const uid=p=>`${p}-${++seq}-${Math.floor(Math.random()*1e5)}`;

function awayFrom(game,anchor,radius=620){
 const p=game.player;let best=null,bestD=-1;
 for(let i=0;i<8;i++){
  const a=Math.random()*6.28,x=anchor.x+Math.cos(a)*radius,y=anchor.y+Math.sin(a)*radius,d=Math.hypot(x-p.x,y-p.y);
  if(d>EVENT_CONFIG.spawnClearance&&d>bestD){bestD=d;best={x,y,angle:a+Math.PI};}
 }
 if(best)return best;
 const a=Math.atan2(anchor.y-p.y,anchor.x-p.x)+1.2;
 return{x:anchor.x+Math.cos(a)*radius,y:anchor.y+Math.sin(a)*radius,angle:a+Math.PI};
}

function pickTraffic(game,pred){
 const list=game.traffic.filter(t=>pred?pred(t):true);
 return list.length?list[Math.floor(Math.random()*list.length)]:null;
}

function pickPirate(game){
 const list=game.enemies.filter(e=>!e.response&&!e.eventOwned&&!String(e.id||'').startsWith('patrol-')&&!e.faction);
 return list.sort((a,b)=>dist(game.player,a)-dist(game.player,b))[0]||null;
}

function spawnPirate(game,at,{name='Raid craft',hp=85,bounty=380}={}){
 const cleared=game.s.cleared?.[game.s.system]||[],id=uid('pirate-evt');
 if(cleared.includes(id))return null;
 const e={id,name,type:'enemy',x:at.x,y:at.y,angle:at.angle||0,hp,max:hp,r:20,fire:.5,raidFire:.2,bounty,wanted:false,eventOwned:true,thrust:0};
 game.enemies.push(e);return e;
}

function spawnSignal(game,{x,y,kind,name,life=90,payload=null}){
 const s={id:uid('signal'),type:'signal',kind,name,x,y,r:36,life,scanned:false,payload,discovered:false};
 game.signals.push(s);return s;
}

function alive(game,ref){
 if(!ref)return false;
 if(ref.type==='traffic')return game.traffic.includes(ref);
 if(ref.type==='enemy'||ref.type==='faction')return game.enemies.includes(ref)||game.patrols.includes(ref);
 if(ref.type==='signal'||ref.type==='derelict')return game.signals.includes(ref)||game.derelicts.includes(ref);
 return false;
}

function nearbyPlayer(game,pos,range=EVENT_CONFIG.notifyRange){return dist(game.player,pos)<=range;}

function resolve(ev,reason){ev.state='resolved';ev.resolveReason=reason;ev.age=ev.age||0;}

function markBeacon(ev,pos){if(!pos)return;ev.beacon={x:pos.x,y:pos.y};}
function alertCombat(g,ev,pos,message,tone='bad'){
 markBeacon(ev,pos);
 if(ev.alerted||!nearbyPlayer(g,pos))return;
 ev.alerted=true;
 if(message)g.notify(message,tone);
}
function markAssist(ev,...ships){if(ships.flat().some(e=>e&&e.playerHit))ev.playerAssisted=true;}
function grantCargo(g,good,tons=1){
 const st=getStats(g.s),used=cargoUsed(g.s),free=st.cargo-used;
 if(free<=0){const cr=60+Math.floor(Math.random()*80);g.s.credits+=cr;return`hold full · +${cr} cr`;}
 const n=Math.min(tons,free);g.s.cargo[good]=(g.s.cargo[good]||0)+n;return`+${n} t ${good}`;
}
function bumpFaction(g,amount=3){
 const id=g.sys.faction;if(!id||g.s.reputation?.[id]==null)return;
 g.s.reputation[id]=clamp(g.s.reputation[id]+amount,-100,100);
}
function bumpLocalCompanies(g,amount=2){
 if(!g.s.companies)g.s.companies={};
 const sys=g.sys;if(!sys)return;
 for(const id of [`co-${sys.id}-a`,`co-${sys.id}-b`]){
  const rec=g.s.companies[id]||={standing:0,completed:0};
  rec.standing=Math.min(100,rec.standing+amount);
 }
}
function payIntervention(g,ev,{credits=400,rep=3,company=2,good=null,tons=1,label='Intervention rewarded'}={}){
 if(ev.rewarded)return;ev.rewarded=true;
 g.s.credits+=credits;bumpFaction(g,rep);bumpLocalCompanies(g,company);
 let extra='';if(good)extra=' · '+grantCargo(g,good,tons);
 g.s.metrics.interventions=(g.s.metrics.interventions||0)+1;
 g.notify(`${label} · +${credits.toLocaleString()} cr${extra}`,'good');
}
function payEventIfEarned(g,ev){
 if(ev.rewarded)return;
 const r=ev.resolveReason;
 if(ev.type==='pirateAttack'&&r==='pirate-down'&&ev.playerAssisted)payIntervention(g,ev,{credits:520,label:'Civilian defended',good:'food'});
 else if(ev.type==='freighterAmbush'&&(r==='pirates-cleared')&&ev.playerAssisted)payIntervention(g,ev,{credits:680,label:'Ambush broken',good:'tech',rep:4});
 else if(ev.type==='freighterAmbush'&&r==='freighter-escaped'&&ev.playerAssisted)payIntervention(g,ev,{credits:420,label:'Freighter escorted clear',good:'ore'});
 else if(ev.type==='miningIncident'&&r==='raid-ended'&&ev.playerAssisted)payIntervention(g,ev,{credits:480,label:'Claim jumper driven off',good:'ore'});
 else if(ev.type==='miningIncident'&&r==='accident-resolved'&&ev.playerAssisted)payIntervention(g,ev,{credits:360,label:'Miner assisted',good:'meds'});
 else if(ev.type==='distressSignal'&&r==='scanned')payIntervention(g,ev,{credits:380,label:'Distress answered',good:'meds',rep:4});
 else if(ev.type==='securityPursuit'&&r==='captured-or-killed'&&ev.playerAssisted)payIntervention(g,ev,{credits:550,label:'Fugitive stopped',rep:5,company:1});
 else if(ev.type==='factionSkirmish'&&(r==='skirmish-ended'||r==='timeout')&&ev.playerAssisted)payIntervention(g,ev,{credits:450,label:'Skirmish decided',rep:2});
}
/** One-line objective for the most urgent active event. */
export function eventObjective(game){
 const ev=(game.dyn?.active||[]).find(e=>e.state==='active'&&e.objective);
 return ev?{text:ev.objective,type:ev.type,id:ev.id}:null;
}

/** Known dynamic-event beacons for off-screen direction arrows (max 3). */
export function eventArrowTargets(game){
 const out=[];
 for(const s of game.signals||[]){
  if(!s.discovered||s.scanned)continue;
  out.push({x:s.x,y:s.y,color:s.kind==='distress'?'#efa778':'#8fd6c2',kind:s.kind||'signal',id:s.id});
 }
 for(const d of game.derelicts||[]){
  if(!d.discovered||d.scanned)continue;
  out.push({x:d.x,y:d.y,color:'#a8b4be',kind:'derelict',id:d.id});
 }
 for(const ev of game.dyn?.active||[]){
  if(!ev.alerted||!ev.beacon)continue;
  if(ev.signalId&&out.some(o=>o.id===ev.signalId))continue;
  if(ev.derelictId&&out.some(o=>o.id===ev.derelictId))continue;
  out.push({x:ev.beacon.x,y:ev.beacon.y,color:'#ee918b',kind:ev.type,id:ev.id});
 }
 return out.slice(0,3);
}

/** @type {Record<string,{id:string,label:string,weight:(g:any)=>number,canStart:(g:any)=>boolean,start:(g:any,ev:any)=>boolean,update:(g:any,ev:any,dt:number)=>void,cleanup:(g:any,ev:any)=>void}>} */
export const EVENT_DEFS={
 pirateAttack:{
  id:'pirateAttack',label:'Pirate attack',
  weight:g=>g.sys.uncharted?.15:(g.sys.danger>=2?.9:.45)+(g.sys.hasStation?.2:0),
  canStart:g=>!!(pickTraffic(g)||g.traffic.length)&&(!g.sys.uncharted||g.sys.danger>=2),
  start(g,ev){
   const victim=pickTraffic(g,t=>t.job?.includes('MINING')||t.canJump||t.hull==='courier')||pickTraffic(g);
   if(!victim)return false;
   let pirate=pickPirate(g);
   if(!pirate||dist(pirate,victim)>1600){
    const at=awayFrom(g,victim,480);pirate=spawnPirate(g,at);if(!pirate)return false;
   }else{pirate.x=victim.x+Math.cos(victim.angle+2)*420;pirate.y=victim.y+Math.sin(victim.angle+2)*420;}
   pirate.wanted=true;pirate.lastCrime=g.time;pirate.crimeX=victim.x;pirate.crimeY=victim.y;pirate.raidFire=0;pirate.eventFocus=victim.id;
   victim.underAttackUntil=g.time+14;ev.pirateId=pirate.id;ev.victimId=victim.id;ev.spawned=[pirate.id];
   ev.objective='Defend the civilian under attack';
   alertCombat(g,ev,victim,'Weapons fire detected. Intercept to earn a reward.');
   log('start pirateAttack',pirate.id,'→',victim.id);return true;
  },
  update(g,ev){
   const pirate=g.enemies.find(e=>e.id===ev.pirateId),victim=g.traffic.find(t=>t.id===ev.victimId);
   markAssist(ev,pirate);
   if(!pirate||pirate.hp<=0){resolve(ev,'pirate-down');return;}
   if(!victim){resolve(ev,'victim-lost');return;}
   if(ev.age>55){resolve(ev,'timeout');return;}
   pirate.eventFocus=victim.id;victim.underAttackUntil=Math.max(victim.underAttackUntil||0,g.time+4);
   alertCombat(g,ev,victim,'Weapons fire detected. Intercept to earn a reward.');
   if(victim.canJump&&victim.job==='DEPARTING FOR JUMP POINT'&&dist(victim,g.jumpAnchor())<80){g.departJump(victim);resolve(ev,'victim-jumped');}
  },
  cleanup(g,ev){/* keep ambient pirates; only remove unused eventOwned if event failed early */}
 },

 distressSignal:{
  id:'distressSignal',label:'Distress signal',
  weight:g=>g.sys.uncharted?.55:.4,
  canStart:g=>true,
  start(g,ev){
   const victim=pickTraffic(g)||null;
   let x,y,cause='damaged';
   if(victim){x=victim.x;y=victim.y;victim.hp=Math.max(8,victim.hp*.35);victim.underAttackUntil=g.time+6;cause=victim.job?.includes('MINING')?'mining-accident':'damaged';ev.victimId=victim.id;}
   else{const at=awayFrom(g,g.belt||g.star,900);x=at.x;y=at.y;cause='stranded';}
   const sig=spawnSignal(g,{x,y,kind:'distress',name:'Distress signal',life:100,payload:{cause}});
   ev.signalId=sig.id;ev.spawned=[];ev.objective='Locate and resolve the distress signal';
   if(nearbyPlayer(g,sig,EVENT_CONFIG.signalRange)){sig.discovered=true;g.notify('Distress signal detected. Resolve it for a reward.');}
   log('start distressSignal',cause);return true;
  },
  update(g,ev){
   const sig=g.signals.find(s=>s.id===ev.signalId);
   if(!sig){resolve(ev,'gone');return;}
   if(!sig.discovered&&nearbyPlayer(g,sig,EVENT_CONFIG.signalRange)){sig.discovered=true;g.notify('Distress signal detected. Resolve it for a reward.');}
   if(sig.scanned){ev.playerAssisted=true;resolve(ev,'scanned');return;}
   if(ev.age>sig.life){resolve(ev,'expired');}
  },
  cleanup(g,ev){g.signals=g.signals.filter(s=>s.id!==ev.signalId);if(g.target?.id===ev.signalId)g.target=g.station||g.star;}
 },

 securityPursuit:{
  id:'securityPursuit',label:'Security pursuit',
  weight:g=>g.sys.faction&&g.sys.hasStation?(g.sys.danger<=1?.85:.35):.05,
  canStart:g=>!!(g.sys.faction&&g.patrols.length&&(pickPirate(g)||g.enemies.some(e=>!e.response))),
  start(g,ev){
   let fugitive=pickPirate(g)||g.enemies.find(e=>!e.response&&!e.eventOwned);
   if(!fugitive){const at=awayFrom(g,g.station,700);fugitive=spawnPirate(g,at,{name:'Wanted runner',hp:95,bounty:520});if(!fugitive)return false;ev.spawned=[fugitive.id];}
   else ev.spawned=[];
   fugitive.wanted=true;fugitive.lastCrime=g.time;fugitive.crimeX=fugitive.x;fugitive.crimeY=fugitive.y;fugitive.fleeJump=true;fugitive.eventOwned=fugitive.eventOwned||false;
   ev.fugitiveId=fugitive.id;ev.objective='Stop the fugitive before they jump';
   const patrol=g.patrols[0];if(patrol){patrol.status='RESPONDING';patrol.responseTarget=fugitive.id;}
   alertCombat(g,ev,fugitive,'Security pursuit underway. Intercept for a reward.','info');
   log('start securityPursuit',fugitive.id);return true;
  },
  update(g,ev,dt){
   const f=g.enemies.find(e=>e.id===ev.fugitiveId);
   markAssist(ev,f);
   if(!f||f.hp<=0){resolve(ev,'captured-or-killed');return;}
   if(ev.age>70){resolve(ev,'timeout');return;}
   const jump=g.jumpAnchor((Math.random()-.5)*40);
   const a=Math.atan2(jump.y-f.y,jump.x-f.x),d=dist(f,jump);
   f.angle=a;f.thrust=.9;f.x+=Math.cos(a)*145*dt;f.y+=Math.sin(a)*145*dt;
   f.eventFlee=true;
   alertCombat(g,ev,f,'Security pursuit underway. Intercept for a reward.','info');
   if(d<70){
    const to=pickTradeDestination(g.s.system,SYSTEMS,jumpDistance)??1;
    const wake={id:uid('wake'),type:'wake',name:(f.name||'Fugitive')+' wake',x:f.x,y:f.y,r:30,from:g.s.system,to,shipName:f.name||'Fugitive',hull:'courier',color:'#ee918b',size:12,uid:uid('fug'),scanned:false,life:90};
    g.wakes.push(wake);g.burst(f.x,f.y,'#9be7ff',12);
    g.enemies=g.enemies.filter(e=>e!==f);
    if(g.target===f)g.target=wake;
    if(nearbyPlayer(g,wake))g.notify('Fugitive jumped — hyperspace wake left behind.');
    resolve(ev,'fugitive-jumped');
   }
  },
  cleanup(){}
 },

 freighterAmbush:{
  id:'freighterAmbush',label:'Freighter ambush',
  weight:g=>g.sys.hasStation&&!g.sys.uncharted?(g.sys.danger>=1?.75:.3):.08,
  canStart:g=>!!pickTraffic(g,t=>t.canJump||t.hull==='freighter'),
  start(g,ev){
   const freighter=pickTraffic(g,t=>t.hull==='freighter'||t.job==='DEPARTING FOR JUMP POINT')||pickTraffic(g,t=>t.canJump);
   if(!freighter)return false;
   // Nudge onto the station→jump corridor if possible
   if(freighter.canJump){freighter.job='DEPARTING FOR JUMP POINT';const jump=g.jumpAnchor();freighter.points=[{x:g.station.x,y:g.station.y,status:'DOCKED'},jump];freighter.target=1;freighter.pause=0;}
   const pirates=[];
   for(let i=0;i<1+(g.sys.danger>1?1:0);i++){
    const at=awayFrom(g,freighter,380+i*40);const p=spawnPirate(g,at,{name:'Ambush pirate',hp:80+g.sys.danger*10});
    if(p){p.wanted=true;p.lastCrime=g.time;p.crimeX=freighter.x;p.crimeY=freighter.y;p.raidFire=0;p.eventFocus=freighter.id;pirates.push(p.id);}
   }
   if(!pirates.length)return false;
   freighter.underAttackUntil=g.time+16;ev.victimId=freighter.id;ev.pirateIds=pirates;ev.spawned=pirates;
   ev.objective='Clear the ambush before the freighter jumps';
   alertCombat(g,ev,freighter,'Weapons fire detected. Break the ambush for a reward.');
   log('start freighterAmbush',freighter.id,pirates);return true;
  },
  update(g,ev){
   const freighter=g.traffic.find(t=>t.id===ev.victimId);
   const pirates=(ev.pirateIds||[]).map(id=>g.enemies.find(e=>e.id===id)).filter(Boolean);
   markAssist(ev,...pirates);
   if(!freighter){resolve(ev,pirates.length?'freighter-lost':'done');return;}
   if(!pirates.length){resolve(ev,'pirates-cleared');return;}
   if(ev.age>60){resolve(ev,'timeout');return;}
   freighter.underAttackUntil=Math.max(freighter.underAttackUntil||0,g.time+3);
   alertCombat(g,ev,freighter,'Weapons fire detected. Break the ambush for a reward.');
   if(freighter.canJump&&dist(freighter,g.jumpAnchor())<90){g.departJump(freighter);resolve(ev,'freighter-escaped');}
  },
  cleanup(g,ev){
   // Despawn leftover ambush-only pirates if event timed out and player never engaged
   for(const id of ev.spawned||[]){
    const e=g.enemies.find(x=>x.id===id);if(e&&e.eventOwned&&!e.playerHit&&ev.resolveReason==='timeout')g.enemies=g.enemies.filter(x=>x!==e);
   }
  }
 },

 miningIncident:{
  id:'miningIncident',label:'Mining incident',
  weight:g=>g.sys.hasStation?.65:g.sys.danger*.2,
  canStart:g=>!!pickTraffic(g,t=>t.job==='MINING RUN'||t.hull==='prospector'),
  start(g,ev){
   const miner=pickTraffic(g,t=>t.job==='MINING RUN'||t.hull==='prospector');
   if(!miner)return false;
   miner.pause=Math.max(miner.pause||0,4);miner.status='MINING RUN';
   const roll=Math.random();
   if(roll<.55){
    const at=awayFrom(g,miner,360);const p=spawnPirate(g,at,{name:'Claim jumper',hp:78});
    if(!p)return false;
    p.wanted=true;p.lastCrime=g.time;p.crimeX=miner.x;p.crimeY=miner.y;p.raidFire=0;p.eventFocus=miner.id;
    miner.underAttackUntil=g.time+12;ev.mode='raid';ev.pirateId=p.id;ev.spawned=[p.id];
    ev.objective='Drive off the claim jumper';
    alertCombat(g,ev,miner,'Weapons fire near the belt. Assist the prospector for a reward.');
   }else{
    miner.hp=Math.max(10,miner.hp*.4);miner.underAttackUntil=g.time+8;ev.mode='accident';ev.spawned=[];
    const sig=spawnSignal(g,{x:miner.x,y:miner.y,kind:'distress',name:'Mining distress',life:70,payload:{cause:'mining-accident'}});
    ev.signalId=sig.id;ev.objective='Resolve the mining distress signal';
    if(nearbyPlayer(g,miner)){sig.discovered=true;g.notify('Distress signal detected. Resolve it for a reward.');}
   }
   ev.victimId=miner.id;log('start miningIncident',ev.mode);return true;
  },
  update(g,ev){
   const miner=g.traffic.find(t=>t.id===ev.victimId);
   if(!miner){resolve(ev,'miner-lost');return;}
   if(ev.mode==='raid'){
    const p=g.enemies.find(e=>e.id===ev.pirateId);markAssist(ev,p);if(!p||p.hp<=0){resolve(ev,'raid-ended');return;}
    miner.underAttackUntil=Math.max(miner.underAttackUntil||0,g.time+3);
    alertCombat(g,ev,miner,'Weapons fire near the belt. Assist the prospector for a reward.');
   }else{
    const sig=ev.signalId&&g.signals.find(s=>s.id===ev.signalId);
    if(sig&&!sig.discovered&&nearbyPlayer(g,sig,EVENT_CONFIG.signalRange)){sig.discovered=true;g.notify('Distress signal detected. Resolve it for a reward.');}
    if(sig?.scanned){ev.playerAssisted=true;resolve(ev,'accident-resolved');}
    else if(ev.age>50)resolve(ev,'accident-resolved');
   }
   if(ev.age>55)resolve(ev,'timeout');
  },
  cleanup(g,ev){if(ev.signalId)g.signals=g.signals.filter(s=>s.id!==ev.signalId);}
 },

 factionSkirmish:{
  id:'factionSkirmish',label:'Faction skirmish',
  weight:g=>g.sys.faction&&!g.sys.uncharted?(g.sys.danger>=2?.7:.25):0,
  canStart:g=>!!g.sys.faction&&FACTIONS.length>=2,
  start(g,ev){
   const home=FACTIONS.find(f=>f.id===g.sys.faction)||FACTIONS[0],rival=FACTIONS.find(f=>f.id===home.rival)||FACTIONS.find(f=>f.id!==home.id);
   if(!rival)return false;
   const anchor=awayFrom(g,g.belt||{x:600,y:1200},750),spawned=[],sides=[];
   const mk=(faction,i,side)=>{
    const a=anchor.angle+side*1.2+i*.4,id=uid('pirate-evt');
    const e={id,name:faction.name+' interceptor',type:'enemy',faction:faction.id,skirmishSide:side,eventOwned:true,x:anchor.x+Math.cos(a)*180,y:anchor.y+Math.sin(a)*180,angle:a+Math.PI,hp:100,max:100,r:20,fire:.6+Math.random(),bounty:300,wanted:false,thrust:0};
    g.enemies.push(e);spawned.push(id);sides.push(e);return e;
   };
   const n=2+(g.sys.danger>=3?1:0);
   for(let i=0;i<n;i++)mk(home,i,0);for(let i=0;i<n;i++)mk(rival,i,1);
   if(spawned.length>EVENT_CONFIG.maxEventShips){while(spawned.length>EVENT_CONFIG.maxEventShips){const id=spawned.pop();g.enemies=g.enemies.filter(e=>e.id!==id);}}
   ev.spawned=spawned;ev.timer=0;ev.beacon={x:anchor.x,y:anchor.y};ev.objective='Engage the faction skirmish';
   alertCombat(g,ev,anchor,'Weapons fire detected. Intervene for standing.');
   log('start factionSkirmish',home.id,'vs',rival.id,spawned.length);return true;
  },
  update(g,ev,dt){
   const ships=g.enemies.filter(e=>ev.spawned?.includes(e.id));
   markAssist(ev,...ships);
   if(ships.length<2){resolve(ev,'skirmish-ended');return;}
   if(ev.age>75){resolve(ev,'timeout');return;}
   const cx=ships.reduce((s,e)=>s+e.x,0)/ships.length,cy=ships.reduce((s,e)=>s+e.y,0)/ships.length;
   alertCombat(g,ev,{x:cx,y:cy},'Weapons fire detected. Intervene for standing.');
   for(const e of ships){
    const foe=ships.filter(o=>o.skirmishSide!==e.skirmishSide).sort((a,b)=>dist(e,a)-dist(e,b))[0];
    if(!foe)continue;
    const a=Math.atan2(foe.y-e.y,foe.x-e.x),d=dist(e,foe);
    e.angle=a;e.eventFlee=true;const speed=d>160?110:d<70?-30:20;e.thrust=speed>0?.55:0;e.x+=Math.cos(a)*speed*dt;e.y+=Math.sin(a)*speed*dt;e.fire-=dt;
    if(d<580&&e.fire<0){e.fire=1.05;g.shots.push({x:e.x,y:e.y,vx:Math.cos(a)*400,vy:Math.sin(a)*400,life:1.6,enemy:true,trafficShot:false,skirmishShot:true,skirmishTarget:foe.id,damage:8});}
   }
   // Resolve skirmish shots against faction ships
   for(const b of g.shots){
    if(!b.skirmishShot||b.life<=0)continue;
    const t=g.enemies.find(e=>e.id===b.skirmishTarget);if(!t)continue;
    if(dist(b,t)<t.r+8){t.hp-=b.damage;b.life=0;g.burst(t.x,t.y,'#f8a77f',4);if(t.hp<=0){g.burst(t.x,t.y,'#ffd297',16);g.onDestroyed?.(t,!!t.playerHit);}}
   }
  },
  cleanup(g,ev){
   for(const id of ev.spawned||[]){
    const e=g.enemies.find(x=>x.id===id);if(e&&e.eventOwned&&!e.playerHit)g.enemies=g.enemies.filter(x=>x!==e);
   }
  }
 },

 derelictWreck:{
  id:'derelictWreck',label:'Derelict wreck',
  weight:g=>g.sys.uncharted?.9:(g.sys.danger>=2?.35:.15),
  canStart:g=>g.derelicts.length<2,
  start(g,ev){
   const at=awayFrom(g,g.star||{x:0,y:0},1400+(Math.random()*600));
   const d={id:uid('derelict'),type:'derelict',name:'Derelict hull',x:at.x,y:at.y,r:28,angle:Math.random()*6.28,scanned:false,discovered:false,life:180,lootChance:.55+Math.random()*.35,salvaged:false,eventOwned:true};
   g.derelicts.push(d);ev.derelictId=d.id;ev.spawned=[];ev.objective='Scan and salvage the derelict wreck';
   if(Math.random()<.4){const p=spawnPirate(g,awayFrom(g,d,520),{name:'Wreck scavenger',hp:70,bounty:300});if(p){ev.spawned=[p.id];ev.pirateId=p.id;}}
   if(nearbyPlayer(g,d,EVENT_CONFIG.signalRange+200)){d.discovered=true;g.notify('Unidentified contact detected.');}
   log('start derelictWreck',d.id);return true;
  },
  update(g,ev){
   const d=g.derelicts.find(x=>x.id===ev.derelictId);
   if(!d){resolve(ev,'gone');return;}
   if(!d.discovered&&nearbyPlayer(g,d,EVENT_CONFIG.signalRange+200)){d.discovered=true;g.notify('Unidentified contact detected.');}
   if(d.salvaged){ev.playerAssisted=true;resolve(ev,'salvaged');return;}
   if(d.scanned&&ev.age>d.life)resolve(ev,'expired');
   else if(!d.scanned&&ev.age>d.life)resolve(ev,'expired');
  },
  cleanup(g,ev){
   g.derelicts=g.derelicts.filter(d=>d.id!==ev.derelictId||((ev.resolveReason==='scanned'||ev.resolveReason==='salvaged')&&d.scanned));
   const d=g.derelicts.find(x=>x.id===ev.derelictId);if(d&&d.salvaged)d.life=Math.min(d.life||0,8);else if(d&&d.scanned)d.life=Math.min(d.life||0,40);
   for(const id of ev.spawned||[]){const e=g.enemies.find(x=>x.id===id);if(e&&e.eventOwned&&!e.playerHit&&ev.resolveReason==='expired')g.enemies=g.enemies.filter(x=>x!==e);}
   if(g.target?.id===ev.derelictId&&(!d||d.salvaged))g.target=g.station||g.star;
  }
 },

 anomalyActivity:{
  id:'anomalyActivity',label:'Space anomaly',
  weight:g=>g.sys.uncharted?.95:.3,
  canStart:g=>true,
  start(g,ev){
   const world=g.planets?.[0]||g.star;
   const at=awayFrom(g,{x:world.x,y:world.y+(world.r||200)+420},220);
   const roll=Math.random();
   // Weighted pick among three distinct anomaly kinds (FB-001).
   ev.anomalyKind=g.sys.uncharted
    ?(roll<.4?'gravityLens':roll<.75?'radioStorm':'silentRelic')
    :(roll<.35?'gravityLens':roll<.7?'radioStorm':'silentRelic');
   ev.spawned=[];
   if(ev.anomalyKind==='silentRelic'){
    const id=uid('relic');
    const d={id,type:'derelict',name:'Silent relic',x:at.x,y:at.y,r:28,angle:Math.random()*6.28,life:130,scanned:false,discovered:false,anomalyKind:'silentRelic',lootChance:.55,salvaged:false};
    g.derelicts.push(d);ev.derelictId=d.id;
    if(nearbyPlayer(g,d,EVENT_CONFIG.signalRange)){d.discovered=true;g.notify('Silent relic on sensors.');}
   }else{
    const names={gravityLens:'Gravity lens',radioStorm:'Radio storm'};
    const sig=spawnSignal(g,{x:at.x,y:at.y,kind:'anomaly',name:names[ev.anomalyKind],life:120,payload:{anomalyKind:ev.anomalyKind}});
    sig.anomalyKind=ev.anomalyKind;
    ev.signalId=sig.id;
    if(nearbyPlayer(g,sig,EVENT_CONFIG.signalRange)){sig.discovered=true;g.notify(names[ev.anomalyKind]+' detected.');}
   }
   log('start anomalyActivity',ev.anomalyKind);return true;
  },
  update(g,ev,dt){
   if(ev.anomalyKind==='silentRelic'){
    const d=g.derelicts.find(x=>x.id===ev.derelictId);
    if(!d){resolve(ev,'gone');return;}
    if(!d.discovered&&nearbyPlayer(g,d,EVENT_CONFIG.signalRange)){d.discovered=true;g.notify('Silent relic on sensors.');}
    if(d.scanned||ev.age>d.life)resolve(ev,d.scanned?'scanned':'expired');
    return;
   }
   const sig=g.signals.find(s=>s.id===ev.signalId);
   if(!sig){resolve(ev,'gone');return;}
   if(!sig.discovered&&nearbyPlayer(g,sig,EVENT_CONFIG.signalRange)){sig.discovered=true;g.notify(sig.name+' detected.');}
   // Radio storm: mild heat while inside the contact radius.
   if(ev.anomalyKind==='radioStorm'&&nearbyPlayer(g,sig,380))g.s.heat=Math.min(150,(g.s.heat||25)+2*dt);
   if(sig.scanned||ev.age>sig.life)resolve(ev,sig.scanned?'scanned':'expired');
  },
  cleanup(g,ev){
   if(ev.signalId)g.signals=g.signals.filter(s=>s.id!==ev.signalId);
   if(ev.derelictId){
    g.derelicts=g.derelicts.filter(d=>d.id!==ev.derelictId||(ev.resolveReason==='scanned'&&d.scanned));
    const d=g.derelicts.find(x=>x.id===ev.derelictId);if(d&&d.scanned)d.life=Math.min(d.life||0,12);
   }
   if(g.target?.id===ev.signalId||g.target?.id===ev.derelictId)g.target=g.station||g.star;
  }
 }
};

export const EVENT_IDS=Object.keys(EVENT_DEFS);

export class DynamicEventManager{
 constructor(game){
  this.game=game;
  this.active=[];
  this.cooldown=12+Math.random()*10;
  this.checkTimer=6+Math.random()*8;
  this.wave=0;
 }
 reset(){
  for(const ev of [...this.active])this.finish(ev,'system-reset');
  this.active=[];this.cooldown=10;this.checkTimer=8;this.game.signals=[];this.game.derelicts=[];
 }
 finish(ev,reason){
  if(ev.state==='resolved'||ev.state==='expired'){/* already */}
  else{ev.state=reason==='system-reset'?'expired':'resolved';ev.resolveReason=reason;}
  try{payEventIfEarned(this.game,ev);}catch(err){console.warn('[dyn] reward',err);}
  try{EVENT_DEFS[ev.type]?.cleanup?.(this.game,ev);}catch(err){console.warn('[dyn] cleanup',err);}
  log('resolved',ev.type,ev.resolveReason||reason);
  this.active=this.active.filter(e=>e!==ev);
  this.cooldown=Math.max(this.cooldown,EVENT_CONFIG.cooldown*(.7+Math.random()*.5));
 }
 candidates(game){
  return EVENT_IDS.map(id=>{
   const def=EVENT_DEFS[id];if(!def.canStart(game))return null;
   const w=Math.max(0,def.weight(game));return w>0?{id,w}:null;
  }).filter(Boolean);
 }
 pickType(game){
  const pool=this.candidates(game);if(!pool.length)return null;
  const sum=pool.reduce((s,c)=>s+c.w,0);let r=Math.random()*sum;
  for(const c of pool){r-=c.w;if(r<=0)return c.id;}
  return pool[pool.length-1].id;
 }
 start(type,{force=false}={}){
  const game=this.game,def=EVENT_DEFS[type];
  if(!def)return false;
  if(!force&&this.active.length>=EVENT_CONFIG.maxActive)return false;
  if(!force&&!def.canStart(game))return false;
  const ev={id:uid('ev'),type,state:'active',age:0,spawned:[],startedAt:game.time};
  if(!def.start(game,ev))return false;
  this.active.push(ev);this.wave++;
  log('active',type,'n='+this.active.length);return true;
 }
 trigger(type){return this.start(type,{force:true});}
 update(dt){
  const g=this.game;
  if(g.surface||g.jump)return;
  // Tick signals / derelicts
  for(const s of g.signals)s.life-=dt;g.signals=g.signals.filter(s=>s.life>0);
  for(const d of g.derelicts){d.life-=dt;d.angle=(d.angle||0)+dt*.05;}g.derelicts=g.derelicts.filter(d=>d.life>0);

  for(const ev of [...this.active]){
   ev.age+=dt;
   try{EVENT_DEFS[ev.type]?.update?.(g,ev,dt);}catch(err){console.warn('[dyn] update',err);resolve(ev,'error');}
   if(ev.state==='resolved'||ev.state==='expired')this.finish(ev,ev.resolveReason||ev.state);
  }

  this.cooldown=Math.max(0,this.cooldown-dt);
  this.checkTimer-=dt;
  if(this.checkTimer>0)return;
  this.checkTimer=EVENT_CONFIG.checkInterval*(.75+Math.random()*.5);
  if(this.cooldown>0||this.active.length>=EVENT_CONFIG.maxActive)return;
  if(Math.random()>EVENT_CONFIG.baseChance)return;
  const type=this.pickType(g);if(type)this.start(type);
 }
}

export function scanDynamicTarget(game){
 const t=game.target;if(!t)return false;
 if(t.type==='signal'){
  if(dist(game.player,t)>280){game.notify('Approach within 280 m to resolve the signal.');return false;}
  const speed=Math.hypot(game.player.vx,game.player.vy);
  const kind=t.anomalyKind||t.payload?.anomalyKind;
  const needSlow=kind==='radioStorm'?90:kind==='gravityLens'?110:140;
  if(speed>needSlow){game.notify(`Slow below ${needSlow} m/s to resolve the signal.`);return false;}
  if(kind==='gravityLens'||kind==='radioStorm'){
   if(game.dynScan)return false;
   const need=kind==='radioStorm'?3.2:2.5;
   game.dynScan={id:t.id,progress:0,need,kind};
   game.notify('Scanning '+t.name.toLowerCase()+'. Hold position.');
   return true;
  }
  t.scanned=true;
  if(t.kind==='distress'){
   const value=Math.round(120+Math.random()*180);game.s.data+=value;
   game.logExploration?.({id:t.id,type:'legacy',system:game.s.system,name:'Distress log · '+((t.payload&&t.payload.cause)||'unknown'),value});
   game.notify(`Distress log recovered · +${value} cr data`,'good');
  }else if(t.kind==='anomaly'){
   completeAnomalyScan(game,t);
  }else game.notify('Signal resolved.');
  return true;
 }
 if(t.type==='derelict'){
  if(t.scanned&&!t.salvaged)return salvageDerelict(game);
  if(dist(game.player,t)>260){game.notify('Approach the derelict to scan it.');return false;}
  if(Math.hypot(game.player.vx,game.player.vy)>120){game.notify('Slow below 120 m/s to scan the wreck.');return false;}
  t.scanned=true;t.life=Math.max(t.life||0,45);
  if(t.anomalyKind==='silentRelic'){
   completeAnomalyScan(game,t);
   game.notify('Relic surveyed. Approach again to salvage the hold.','good');
   return true;
  }
  const value=Math.round(180+Math.random()*320);game.s.data+=value;
  game.logExploration?.({id:t.id,type:'legacy',system:game.s.system,name:'Derelict survey',value});
  game.notify(`Derelict surveyed · +${value} cr data. Approach again to salvage.`,'good');
  return true;
 }
 return false;
}

/** Salvage a scanned derelict for cargo, credits, or a rare module fragment. */
export function salvageDerelict(game){
 const t=game.target;if(!t||t.type!=='derelict'||!t.scanned||t.salvaged)return false;
 if(dist(game.player,t)>200){game.notify('Close to within 200 m to salvage the wreck.');return false;}
 if(Math.hypot(game.player.vx,game.player.vy)>90){game.notify('Slow below 90 m/s to salvage.');return false;}
 t.salvaged=true;t.life=Math.min(t.life||0,12);
 game.s.metrics.salvages=(game.s.metrics.salvages||0)+1;
 const roll=Math.random(),parts=[];
 const goods=['ore','tech','crystal','meds'];
 const good=goods[Math.floor(Math.random()*goods.length)];
 const tons=1+(roll>.55?1:0)+(t.lootChance>.6&&roll>.8?1:0);
 parts.push(grantCargo(game,good,tons));
 const credits=140+Math.floor(Math.random()*220*(t.lootChance||.4));
 game.s.credits+=credits;parts.push('+'+credits+' cr');
 if((t.lootChance||0)>.5&&Math.random()<.28&&game.s.modules.length<85){
  const pool=['laser','shield','engine','cargo','drive'].filter(id=>!game.s.modules.some(m=>m.kind===id&&m.grade>=1)||true);
  const kind=pool[Math.floor(Math.random()*pool.length)];
  const item={uid:'m-'+game.s.nextModule++,kind,grade:1};
  game.s.modules.push(item);
  parts.push(kind+' module recovered');
 }
 // Contested salvage: chance to spawn a scavenger if none nearby.
 if(Math.random()<(t.lootChance||.4)*.45){
  const near=game.enemies.some(e=>!e.response&&dist(e,t)<700);
  if(!near){const p=spawnPirate(game,awayFrom(game,t,380),{name:'Wreck scavenger',hp:72,bounty:320});if(p){p.wanted=true;game.notify('Scavengers closing on the wreck.','bad');}}
 }
 bumpFaction(game,2);bumpLocalCompanies(game,1);
 game.notify('Salvage secured · '+parts.join(' · '),'good');
 return true;
}

/** Compact wreck interior pocket for deeper salvage. */
export function createWreckLayout(derelict){
 const W=720,H=520,cx=W/2,cy=H*.58;
 const zones=[
  {id:'airlock',label:'Airlock',service:'board',x:90,y:cy,r:48,icon:'ship',board:true},
  {id:'cache',label:'Cargo bay',service:'cache',x:cx+40,y:cy-30,r:46,icon:'market',cacheGood:['ore','tech','crystal','meds'][Math.floor(Math.random()*4)],wreckLoot:true},
  {id:'console',label:'Flight recorder',service:'inspect',x:cx+160,y:cy+70,r:40,icon:'data',anomalyId:derelict.id+'-log',anomalyKind:'signal'}
 ];
 return{
  kind:'wreck',title:derelict.name||'Derelict interior',role:'wreck',accent:'#a8b4be',floor:'#1a2228',
  width:W,height:H,hull:null,
  walls:[{x:200,y:80,w:40,h:140},{x:420,y:260,w:120,h:36},{x:300,y:120,w:50,h:90}],
  windows:[],signs:[],zones,npcs:[],
  spawn:{x:110,y:cy,facing:0},derelictId:derelict.id
 };
}

function completeAnomalyScan(game,t){
 const kind=t.anomalyKind||t.payload?.anomalyKind||'gravityLens';
 const ranges={gravityLens:[280,520],radioStorm:[320,600],silentRelic:[240,480]};
 const [lo,hi]=ranges[kind]||[240,480];
 const value=Math.round(lo+Math.random()*(hi-lo));
 game.s.data+=value;
 const labels={gravityLens:'Gravity lens survey',radioStorm:'Radio storm catalog',silentRelic:'Silent relic survey'};
 game.logExploration?.({id:t.id,type:'anomaly',system:game.s.system,name:labels[kind]||'Space anomaly',value});
 let extra='';
 if(kind==='silentRelic'&&Math.random()<.4){
  const goods=['ore','meds','tech'].filter(id=>game.s.cargo&&id in game.s.cargo);
  const good=goods[Math.floor(Math.random()*Math.max(1,goods.length))]||'ore';
  const st=getStats(game.s),used=cargoUsed(game.s);
  if(used>=st.cargo){const cr=80+Math.floor(Math.random()*61);game.s.credits+=cr;extra=` · hold full, +${cr} cr`;}
  else{game.s.cargo[good]=(game.s.cargo[good]||0)+1;extra=` · +1 t ${good}`;}
 }
 game.notify(`${labels[kind]||'Anomaly'} · +${value} cr data${extra}`,'good');
}

export function tickDynScan(game,dt){
 const scan=game.dynScan;if(!scan)return;
 const t=game.signals.find(s=>s.id===scan.id)||game.derelicts.find(d=>d.id===scan.id);
 if(!t||t.scanned||game.target?.id!==scan.id){game.dynScan=null;game.notify('Anomaly scan interrupted.');return;}
 const range=t.type==='derelict'?260:280;
 const needSlow=scan.kind==='radioStorm'?90:110;
 if(dist(game.player,t)>range||Math.hypot(game.player.vx,game.player.vy)>needSlow){game.dynScan=null;game.notify('Anomaly scan interrupted.');return;}
 scan.progress+=dt;
 if(scan.progress>=scan.need){
  t.scanned=true;game.dynScan=null;completeAnomalyScan(game,t);
 }
}


import {Game as FlightGame,newSave as v1Save,validateSave as v1Validate,SYSTEMS,SHIPS,GOODS,UPGRADES,getStats,cargoUsed,jumpDistance,dist,clamp,angleDiff,rng,shipRadius} from './core.mjs';
import {FACTIONS,GUILDS,MODULES,moduleSlots} from './catalog.mjs';
import {createSurface,nearestAnomaly,updateSurface,terrainAt} from './surface.mjs';
import {createOnFoot,nearestZone,updateOnFoot,onFootSave} from './onfoot.mjs';
import {createStationLayout} from './station-layout.mjs';
import {createPlanetLayout} from './planet-layout.mjs';
import {systemSky,wantedTier,pickTradeDestination} from './atmosphere.mjs';
import {DynamicEventManager,EVENT_IDS,EVENT_DEFS,EVENT_CONFIG,scanDynamicTarget,eventArrowTargets,tickDynScan} from './dynamic-events.mjs';
import {speakRobot,ensureRobotState} from './station-robot.mjs';
import {surveyWorldIds,systemLayoutMeta,isLandablePlanet} from './system-layout.mjs';
export * from './core.mjs';
export {FACTIONS,GUILDS,MODULES,moduleSlots} from './catalog.mjs';
export {nearestAnomaly,terrainAt,surfaceAltitude} from './surface.mjs';
export {nearestZone,createOnFoot,updateOnFoot,onFootSave} from './onfoot.mjs';
export {createStationLayout} from './station-layout.mjs';
export {createPlanetLayout} from './planet-layout.mjs';
export {systemSky,wantedTier} from './atmosphere.mjs';
export {EVENT_IDS,EVENT_DEFS,EVENT_CONFIG,eventArrowTargets} from './dynamic-events.mjs';
export {STATION_ROBOT,ROBOT_LINES,buildRobotContext,pickRobotLine,speakRobot,ensureRobotState} from './station-robot.mjs';
export {buildSystemLayout,surveyWorldIds,systemLayoutMeta,isLandablePlanet,PLANET_KINDS,STAR_TYPES} from './system-layout.mjs';
export const VERSION=2;
const shipIds=SHIPS.map(s=>s.id),factionIds=FACTIONS.map(f=>f.id),guildIds=GUILDS.map(g=>g.id),numeric=x=>Number.isFinite(x)&&x>=0&&x<=1e12;
const beamDistance=(p,a,b)=>{const dx=b.x-a.x,dy=b.y-a.y,l=dx*dx+dy*dy,t=l?clamp(((p.x-a.x)*dx+(p.y-a.y)*dy)/l,0,1):0;return Math.hypot(p.x-(a.x+t*dx),p.y-(a.y+t*dy));};
export function newSave(){return {...migrate(v1Save()),systemScans:[]};}
 function migrate(s){const modules=UPGRADES.filter(u=>s.upgrades[u.id]).map((u,i)=>({uid:'m-'+(i+1),kind:u.id,grade:s.upgrades[u.id]}));return{...s,version:2,systemScans:[...s.visited],heat:25,bounty:0,detained:false,dockId:null,stationPos:null,transit:[],explorationLog:s.data?[{id:'legacy-cache',type:'legacy',system:s.system,name:'Recovered exploration cache',value:s.data,sold:false}]:[],upgrades:Object.fromEntries(UPGRADES.map(u=>[u.id,0])),fleet:[s.ship],modules,nextModule:modules.length+1,loadouts:Object.fromEntries(shipIds.map(id=>[id,id===s.ship?modules.map(m=>m.uid):[]])),hangar:{},guilds:Object.fromEntries(guildIds.map(id=>[id,{joined:false,stage:0,active:false,baseline:0}])),reputation:Object.fromEntries(factionIds.map(id=>[id,0])),allegiance:null,records:[],surfaceScanned:[],surface:null,cleared:{},route:null,operations:[],nextOperation:1,engineVolume:.35,robotMet:false,metrics:{discoveries:s.visited.filter(i=>SYSTEMS[i].uncharted).length,anomalies:0,geology:0,deliveries:s.completed.filter(id=>id.endsWith('-0')).length,operations:0,pirates:s.kills,factionKills:Object.fromEntries(factionIds.map(id=>[id,0]))}};}
export function validateSave(x){
 if(!x||![1,2].includes(x.version))return null;const base=v1Validate({...x,version:1});if(!base)return null;if(x.version===1)return migrate(base);
 try{const s=migrate(base);
  if(x.systemScans!==undefined){if(!Array.isArray(x.systemScans)||x.systemScans.length>SYSTEMS.length||x.systemScans.some(id=>!Number.isInteger(id)||!SYSTEMS[id]||!s.visited.includes(id)))return null;s.systemScans=[...new Set(x.systemScans)];}
  if(x.heat!==undefined){if(!Number.isFinite(x.heat)||x.heat<0||x.heat>150)return null;s.heat=x.heat;}
  if(x.bounty!==undefined){if(!numeric(x.bounty))return null;s.bounty=x.bounty;}
  if(x.detained!==undefined){if(typeof x.detained!=='boolean')return null;s.detained=x.detained;}
  if(x.robotMet!==undefined){if(typeof x.robotMet!=='boolean')return null;s.robotMet=x.robotMet;}
  if(x.dockId!==undefined){if(x.dockId!=null&&(typeof x.dockId!=='string'||!/^station(-\d+)?$/.test(x.dockId)))return null;s.dockId=x.dockId;}
  if(x.transit!==undefined){
   if(!Array.isArray(x.transit)||x.transit.length>32||x.transit.some(t=>!t||typeof t.uid!=='string'||t.uid.length>40||typeof t.name!=='string'||!t.name.length||t.name.length>60||typeof t.hull!=='string'||!Number.isInteger(t.from)||!SYSTEMS[t.from]||!Number.isInteger(t.to)||!SYSTEMS[t.to]||!Number.isFinite(t.eta)))return null;
   s.transit=x.transit.map(t=>({uid:t.uid,name:t.name,hull:t.hull,color:t.color||'#7ec8d8',size:t.size||12,speed:t.speed||120,turn:t.turn||2.8,wait:t.wait||2.5,from:t.from,to:t.to,eta:t.eta}));
  }
  if(x.explorationLog!==undefined){
   if(!Array.isArray(x.explorationLog)||x.explorationLog.length>4096||x.explorationLog.some(e=>!e||typeof e.id!=='string'||e.id.length>80||!['system','world','surface','legacy','anomaly'].includes(e.type)||!Number.isInteger(e.system)||!SYSTEMS[e.system]||typeof e.name!=='string'||!e.name.length||e.name.length>100||!numeric(e.value)||e.value>100000||typeof e.sold!=='boolean'))return null;
   if(new Set(x.explorationLog.map(e=>e.id)).size!==x.explorationLog.length)return null;
   s.explorationLog=x.explorationLog.map(e=>({id:e.id,type:e.type,system:e.system,name:e.name,value:e.value,sold:e.sold}));
  }
  if(!Array.isArray(x.fleet)||!x.fleet.includes(s.ship)||x.fleet.some(id=>!shipIds.includes(id)))return null;s.fleet=[...new Set(x.fleet)];
  if(!Array.isArray(x.modules)||x.modules.length>100||x.modules.some(m=>!m||!/^m-\d+$/.test(m.uid)||!Object.hasOwn(MODULES,m.kind)||!Number.isInteger(m.grade)||m.grade<1||m.grade>(MODULES[m.kind].standard?3:1)))return null;s.modules=x.modules.map(m=>({uid:m.uid,kind:m.kind,grade:m.grade}));const ids=new Set(s.modules.map(m=>m.uid));if(ids.size!==s.modules.length)return null;const used=new Set();
  for(const id of shipIds){const a=x.loadouts?.[id];if(!Array.isArray(a)||a.length>moduleSlots(id)||(!s.fleet.includes(id)&&a.length))return null;const cat=new Set();for(const uid of a){if(!ids.has(uid)||used.has(uid))return null;const c=MODULES[s.modules.find(m=>m.uid===uid).kind].category;if(cat.has(c))return null;cat.add(c);used.add(uid);}s.loadouts[id]=[...a];}
  for(const id of factionIds){if(!Number.isFinite(x.reputation?.[id])||Math.abs(x.reputation[id])>100)return null;s.reputation[id]=x.reputation[id];}
  for(const id of guildIds){const g=x.guilds?.[id];if(!g||(!g.joined&&g.active)||!Number.isInteger(g.stage)||g.stage<0||g.stage>3||!numeric(g.baseline))return null;s.guilds[id]={joined:!!g.joined,stage:g.stage,active:!!g.active&&g.stage<3,baseline:g.baseline};}
  for(const [id,h]of Object.entries(x.hangar||{})){if(!shipIds.includes(id)||!h||!['hull','shield','fuel'].every(k=>numeric(h[k])))return null;s.hangar[id]={hull:h.hull,shield:h.shield,fuel:h.fuel};}
  const validId=id=>typeof id==='string'&&/^planet-\d+-\d+-a[0-5]$/.test(id)&&!!SYSTEMS[Number(id.split('-')[1])];
  if(!Array.isArray(x.surfaceScanned)||x.surfaceScanned.length>5760||x.surfaceScanned.some(id=>!validId(id)))return null;s.surfaceScanned=[...new Set(x.surfaceScanned)];
  if(!Array.isArray(x.records)||x.records.length>5760||x.records.some(r=>!r||!validId(r.id)||!numeric(r.value)||r.value>100000||!['geology','relic','biosignature','signal'].includes(r.kind)||!s.surfaceScanned.includes(r.id)))return null;s.records=x.records.map(r=>({id:r.id,kind:r.kind,value:r.value,system:Number(r.id.split('-')[1])}));if(new Set(s.records.map(r=>r.id)).size!==s.records.length)return null;
  for(const k of ['discoveries','anomalies','geology','deliveries','operations','pirates']){if(!numeric(x.metrics?.[k]))return null;s.metrics[k]=x.metrics[k];}for(const id of factionIds){if(!numeric(x.metrics?.factionKills?.[id]))return null;s.metrics.factionKills[id]=x.metrics.factionKills[id];}
  if(!Array.isArray(x.operations)||x.operations.length>3||x.operations.some(o=>!o||!/^op-\d+$/.test(o.uid)||!factionIds.includes(o.faction)||!['relief','combat'].includes(o.type)||!Number.isInteger(o.target)||!SYSTEMS[o.target]||!Number.isInteger(o.kills)||o.kills<0||o.kills>2))return null;s.operations=x.operations.map(o=>({uid:o.uid,faction:o.faction,type:o.type,target:o.target,kills:o.kills}));if(new Set(s.operations.map(o=>o.uid)).size!==s.operations.length||new Set(s.operations.map(o=>o.faction+o.type)).size!==s.operations.length)return null;
  for(const [id,list]of Object.entries(x.cleared||{})){if(!/^\d+$/.test(id)||!SYSTEMS[+id]||!Array.isArray(list)||list.length>500||list.some(v=>typeof v!=='string'||!/^(rock|pirate|patrol|op)-[a-z0-9-]+$/.test(v)))return null;s.cleared[id]=[...new Set(list)];}
  s.allegiance=factionIds.includes(x.allegiance)?x.allegiance:null;s.engineVolume=clamp(Number.isFinite(Number(x.engineVolume))?Number(x.engineVolume):.35,0,1);s.nextModule=Math.max(1,...s.modules.map(m=>+m.uid.slice(2)+1));s.nextOperation=Math.max(1,Number.isInteger(x.nextOperation)?x.nextOperation:1,...s.operations.map(o=>+o.uid.slice(3)+1));
  const st=getStats(s);s.hull=clamp(x.hull,1,st.hull);s.shield=clamp(x.shield,0,st.shield);s.fuel=clamp(x.fuel,0,st.fuel);if(cargoUsed(s)>st.cargo)return null;
  if(x.surface){const a=x.surface;if(!new RegExp('^planet-'+s.system+'-\\d+$').test(a.planetId)||!['x','y','integrity'].every(k=>Number.isFinite(a[k])))return null;s.surface={planetId:a.planetId,x:clamp(a.x,40,5960),y:clamp(a.y,55,850),integrity:clamp(a.integrity,1,100),recordStart:Number.isInteger(a.recordStart)?clamp(a.recordStart,0,s.records.length):s.records.length};if(a.foot!=null){if(!a.foot||!Number.isFinite(a.foot.x)||!Number.isFinite(a.foot.y))return null;s.surface.foot={x:clamp(a.foot.x,20,980),y:clamp(a.foot.y,20,720)};}s.docked=false;}
  if(x.stationPos!==undefined){if(x.stationPos==null)s.stationPos=null;else if(!x.stationPos||!Number.isFinite(x.stationPos.x)||!Number.isFinite(x.stationPos.y))return null;else s.stationPos={x:clamp(x.stationPos.x,20,1080),y:clamp(x.stationPos.y,20,1080)};}
  if(x.route&&Number.isInteger(x.route.destination)&&SYSTEMS[x.route.destination])s.route={destination:x.route.destination,path:findRoute(s.system,x.route.destination,st.range)||[]};return s;
 }catch{return null;}
}
export function systemName(sys,s){return sys.uncharted&&!s.visited.includes(sys.id)?'Uncharted '+sys.catalog:sys.name;}
export function findRoute(from,to,range){if(!SYSTEMS[from]||!SYSTEMS[to]||!Number.isFinite(range)||range<=0)return null;if(from===to)return[];const costs=SYSTEMS.map(()=>Infinity),previous=SYSTEMS.map(()=>-1),seen=new Set();costs[from]=0;for(let n=0;n<SYSTEMS.length;n++){let current=-1;for(let i=0;i<costs.length;i++)if(!seen.has(i)&&(current<0||costs[i]<costs[current]))current=i;if(current<0||!Number.isFinite(costs[current])||current===to)break;seen.add(current);for(const sys of SYSTEMS){if(seen.has(sys.id)||sys.id===current)continue;const d=jumpDistance(current,sys.id),c=costs[current]+1+d*.0001;if(d<=range&&c<costs[sys.id]){costs[sys.id]=c;previous[sys.id]=current;}}}if(previous[to]<0)return null;let cur=to;const path=[];while(cur!==from){path.unshift(cur);cur=previous[cur];if(cur<0)return null;}return path;}
export function missionDestination(s,m){return m.type==='delivery'?m.destination:m.type==='survey'&&!surveyWorldIds(m.destination,SYSTEMS[m.destination]).every(id=>s.scanned.includes(id))?m.destination:m.origin;}
const metric=(s,key)=>key==='surveys'?s.scanned.length:key==='sales'?s.trade:key==='mined'?s.mined:key==='contracts'?s.contracts:s.metrics[key]||0;
export function guildProgress(s,id){const state=s.guilds[id],q=GUILDS.find(g=>g.id===id).quests[state.stage];if(!q)return{done:true,ready:false};const n=q.good?s.cargo[q.good]:Math.max(0,metric(s,q.metric)-state.baseline);return{done:false,quest:q,current:Math.min(n,q.count),total:q.count,ready:state.active&&n>=q.count};}
function operationBase(s,o){const f=FACTIONS.find(f=>f.id===o.faction),sup=o.faction==='directorate'?{good:'ore',count:6}:o.faction==='freeholds'?{good:'food',count:8}:{good:'meds',count:4};return o.type==='relief'?{title:'Frontier relief',desc:`Bring ${sup.count} t of ${GOODS.find(g=>g.id===sup.good).name} to any ${f.name} station.`,...sup,current:s.cargo[sup.good],total:sup.count,reward:1400,ready:s.cargo[sup.good]>=sup.count&&SYSTEMS[s.system].faction===o.faction}:{title:'Disputed shipping lanes',desc:`Defeat 2 ${FACTIONS.find(g=>g.id===f.rival).name} ships in ${SYSTEMS[o.target].name}, then report at a ${f.name} station.`,current:o.kills,total:2,reward:2400,ready:o.kills>=2&&SYSTEMS[s.system].faction===o.faction};}
export function operationDetails(s,o){
 const d=operationBase(s,o),combat=o.type==='combat'&&o.kills<2;
 const port=SYSTEMS.filter(x=>x.hasStation&&x.faction===o.faction).sort((a,b)=>jumpDistance(s.system,a.id)-jumpDistance(s.system,b.id))[0];
 const destination=combat?o.target:port.id;
 const missing=d.good?Math.max(0,d.total-d.current):0;
 const next=combat?`Defeat ${2-o.kills} more rival ships in ${SYSTEMS[o.target].name}. Use Find target once there.`:missing?`Acquire ${missing} t more ${GOODS.find(g=>g.id===d.good).name} from a station market, then deliver to ${port.station} in ${port.name}.`:`Dock at ${port.station} in ${port.name}, then select Report success.`;
 return {...d,destination,next,ready:d.ready&&SYSTEMS[s.system].hasStation,navLabel:destination!==s.system?'Plot route':combat?'Find target':'Select station'};
}
export class Game extends FlightGame{
 constructor(save=newSave()){super(save.version===1?migrate(save):save);this.surface=null;this.onfoot=null;this.scooping=false;this.discoveryScan=null;this.dynScan=null;this.wakes=[];this.signals=[];this.derelicts=[];this.responseAt=null;this.responseWave=0;this.heatWanted=0;this.lastKnown=null;this.lastHitSecurity=false;this.dyn=new DynamicEventManager(this);this.s.heat??=25;this.s.bounty??=0;this.s.detained??=false;this.s.robotMet??=false;this.s.stationPos??=null;this.s.systemScans??=[...this.s.visited];this.s.explorationLog??=[];this.s.transit??=[];if(!Number.isFinite(this.s.engineVolume))this.s.engineVolume=.35;ensureRobotState(this);this.surfaceRecordsStart=this.s.records.length;if(this.s.surface){const p=this.planets.find(p=>p.id===this.s.surface.planetId);if(p){this.surface=createSurface(p,this.s.surfaceScanned,this.s.surface);this.surfaceRecordsStart=this.s.surface.recordStart;const ground=terrainAt(this.surface.x,this.surface.seed)-19;if(this.surface.y>=ground-2){this.surface.y=ground;this.surface.landed=true;}if(this.s.surface.foot&&this.surface.landed)this.onfoot=createOnFoot(createPlanetLayout(this.surface),this.s.surface.foot);}}else if(this.s.docked)this.enterStationDeck();}
 nearestPort(){return SYSTEMS.filter(s=>s.hasStation).sort((a,b)=>jumpDistance(this.s.system,a.id)-jumpDistance(this.s.system,b.id))[0].id;}
 nearestPrison(){const barges=SYSTEMS.filter(s=>s.prison&&s.hasStation);return (barges.sort((a,b)=>jumpDistance(this.s.system,a.id)-jumpDistance(this.s.system,b.id))[0]||SYSTEMS.find(s=>s.hasStation)).id;}
 makeSystem(){if(this.s.docked&&!SYSTEMS[this.s.system].hasStation)this.s.system=this.nearestPort();super.makeSystem();this.player.r=shipRadius(this.s.ship);const cleared=this.s.cleared?.[this.s.system]||[];this.asteroids=this.asteroids.filter(a=>!cleared.includes(a.id));this.enemies=this.enemies.filter(a=>!cleared.includes(a.id));this.scooping=false;this.scoopRate=0;this.discoveryScan=null;this.playerCrimeUntil=0;this.playerCrime=null;this.heatWanted=0;this.lastKnown=null;this.responseAt=null;this.wakes=[];this.signals=[];this.derelicts=[];this.dyn?.reset();this.traffic=this.makeTraffic();this.patrols=[];if(!this.sys.hasStation){this.station.type='beacon';this.target=this.star;this.traffic=[];}else if(this.s.dockId){const dock=this.stations.find(s=>s.id===this.s.dockId&&s.type==='station');if(dock)this.station=dock;}if(this.sys.faction){const f=FACTIONS.find(f=>f.id===this.sys.faction),anchor=this.station;for(let i=0;i<2;i++){const p={id:'patrol-'+f.id+'-'+i,name:f.name+' patrol',type:'faction',faction:f.id,x:anchor.x+850+i*180,y:anchor.y+400+i*250,angle:1,hp:105,max:105,r:20,fire:1,bounty:240,status:'PATROLLING'};if(cleared.includes(p.id))continue;if((this.s.reputation?.[f.id]||0)<=-20){p.type='enemy';this.enemies.push(p);}else this.patrols.push(p);}}this.spawnOperations();this.ingestTransitArrivals();}
 triggerDynamicEvent(type){if(this.s.docked)this.launch();EVENT_CONFIG.log=true;const ok=this.dyn.trigger(type);this.notify(ok?('DEV · dynamic event · '+type):('DEV · could not start '+type),ok?'good':'bad');return ok;}
 onCombatLoss(loss,{security}= {}){
  this.surface=null;this.s.surface=null;this.onfoot=null;this.s.stationPos=null;this.s.records=[];this.s.explorationLog=this.s.explorationLog.filter(e=>e.sold);this.s.heat=25;this.heatWanted=0;this.lastKnown=null;this.playerCrimeUntil=0;this.playerCrime=null;this.responseAt=null;
  if(security){
   const id=this.nearestPrison();
   this.s.system=id;if(!this.s.visited.includes(id))this.s.visited.push(id);this.s.route=null;this.s.detained=true;this.s.bounty=Math.max(this.s.bounty||0,500);
   this.makeSystem();this.enterStationDeck();
   this.notify(`Detained by system security. Transferred to ${this.sys.station} · lost cargo and ${loss.toLocaleString()} cr.`,'bad');
   return true;
  }
  this.makeSystem();this.enterStationDeck();
  this.notify(`Escape pod recovered. Lost cargo and ${loss.toLocaleString()} cr.`,'bad');
  return true;
 }
 launch(){if(this.s.detained){this.notify('Pay your fine at the detention desk before launch.','bad');return false;}const ok=super.launch();if(ok){this.onfoot=null;this.s.stationPos=null;}return ok;}
 enterStationDeck(){
  if(!this.s.docked||!this.sys.hasStation){this.onfoot=null;return null;}
  const dock=this.station||this.stations?.find(s=>s.type==='station');
  const layout=createStationLayout({
   name:dock?.name||this.sys.station,
   roleLabel:dock?.roleLabel||(this.sys.prison?'PRISON BARGE':'ORBITAL STATION'),
   prison:!!this.sys.prison,detained:!!this.s.detained,
   dockId:this.s.dockId||dock?.id||'station',
   seed:this.s.system*97+(this.s.dockId||'station').length*13
  });
  this.onfoot=createOnFoot(layout,this.s.stationPos);
  return this.onfoot;
 }
 interactStation(){
  if(!this.s.docked)return null;
  if(!this.onfoot)this.enterStationDeck();
  const z=nearestZone(this.onfoot);
  if(!z){this.notify('Walk to a service desk or the hangar bay.');return null;}
  if(z.launch){if(this.launch())return{launch:true};return{service:'detention',blocked:true};}
  return{service:z.service,zone:z};
 }
 markWanted(amount=35,at=null){
  const pos=at||{x:this.player.x,y:this.player.y};
  this.heatWanted=clamp(this.heatWanted+amount,0,100);
  this.lastKnown={x:pos.x,y:pos.y};
  this.playerCrime={x:pos.x,y:pos.y};
  this.playerCrimeUntil=this.time+18+this.heatWanted*.35;
 }
 securityFaction(){return this.sys.faction||this.s.allegiance||FACTIONS[0].id;}
 securityWatchers(){return [...this.patrols,...this.enemies.filter(e=>e.response||String(e.id||'').startsWith('patrol-'))];}
 jumpAnchor(lane=0){return{x:this.star.x+this.star.r+950,y:this.star.y+lane,status:'AT JUMP POINT'};}
 makeTraffic(){
  if(!this.sys.hasStation)return[];
  const r=rng(441+this.s.system*173),lane=span=>(r()-.5)*span;
  const home=this.stations.find(s=>s.type==='station')||this.station;
  const station={x:home.x,y:home.y,status:'DOCKED'},jump=this.jumpAnchor(lane(220)),scoop={x:this.star.x+this.star.r+430,y:this.star.y+lane(160),status:'FUEL SCOOPING'};
  const belt=this.belt||this.belts?.[0];
  const world=this.planets[0];
  const jobs=[
   {name:'Inbound courier',job:'ARRIVING FROM JUMP POINT',hull:'courier',color:'#7ec8d8',size:11,turn:3.4,points:[jump,station],speed:145,wait:2.2,canJump:true},
   {name:'Outbound freighter',job:'DEPARTING FOR JUMP POINT',hull:'freighter',color:'#d2b48c',size:17,turn:2.1,points:[station,jump],speed:95,wait:2.8,canJump:true,destination:pickTradeDestination(this.s.system,SYSTEMS,jumpDistance)},
   {name:'Scoop tender',job:'FUEL SCOOPING',hull:'tender',color:'#e0b07a',size:14,turn:2.6,points:[station,scoop],speed:112,wait:6.2}
  ];
  if(belt)jobs.splice(2,0,{name:'Prospector',job:'MINING RUN',hull:'prospector',color:'#d4a067',size:13,turn:2.8,points:[station,{x:belt.x+lane(280),y:belt.y+lane(220),status:'MINING RUN'}],speed:88,wait:7.5});
  if(world)jobs.push({name:'Survey vessel',job:'PLANETARY SURVEY',hull:'surveyor',color:'#8fd6c2',size:12,turn:3.1,points:[station,{x:world.x+lane(120),y:world.y+world.r+280+lane(80),status:'PLANETARY SURVEY'}],speed:128,wait:5.4});
  // Extra dock shuttle when multi-station
  const other=this.stations.find(s=>s.type==='station'&&s.id!==home.id);
  if(other)jobs.push({name:'Dock shuttle',job:'STATION TRANSFER',hull:'courier',color:'#9eb7bd',size:10,turn:3.6,points:[station,{x:other.x,y:other.y,status:'DOCKED'}],speed:150,wait:3.5});
  return jobs.map((j,i)=>{const start=j.points[0],next=j.points[1];return{...j,id:'traffic-'+i,uid:'tv-'+this.s.system+'-'+i+'-'+Math.floor(r()*1e6),type:'traffic',x:start.x,y:start.y,angle:Math.atan2(next.y-start.y,next.x-start.x),r:Math.max(11,j.size-1),hp:48+j.size*2,max:48+j.size*2,target:1,pause:i*.85+r()*1.2,thrust:0,status:start.status,underAttackUntil:0,phase:r()*6.28,work:0,trail:[]};});
 }
 ingestTransitArrivals(){
  if(!this.sys.hasStation)return;
  const due=this.s.transit.filter(t=>t.to===this.s.system&&t.eta<=this.s.playtime+1);
  this.s.transit=this.s.transit.filter(t=>!(t.to===this.s.system&&t.eta<=this.s.playtime+1));
  for(const t of due){
   const jump=this.jumpAnchor((Math.random()-.5)*180),station={x:this.station.x,y:this.station.y,status:'DOCKED'};
   this.traffic.push({id:'traffic-arr-'+t.uid,uid:t.uid,type:'traffic',name:t.name,job:'ARRIVING FROM JUMP POINT',hull:t.hull,color:t.color,size:t.size,turn:t.turn,speed:t.speed,wait:t.wait,canJump:true,points:[jump,station],x:jump.x,y:jump.y,angle:Math.atan2(station.y-jump.y,station.x-jump.x),r:Math.max(11,t.size-1),hp:48+t.size*2,max:48+t.size*2,target:1,pause:0.4,thrust:0,status:'AT JUMP POINT',underAttackUntil:0,phase:Math.random()*6,work:0,trail:[]});
  }
 }
 departJump(ship){
  const to=ship.destination??pickTradeDestination(this.s.system,SYSTEMS,jumpDistance);
  if(to==null){ship.target=ship.target?0:1;ship.pause=ship.wait;return;}
  const wake={id:'wake-'+ship.uid+'-'+Math.floor(this.time*10),type:'wake',name:ship.name+' wake',x:ship.x,y:ship.y,r:30,from:this.s.system,to,shipName:ship.name,hull:ship.hull,color:ship.color,size:ship.size,uid:ship.uid,scanned:false,life:90};
  this.wakes.push(wake);
  this.s.transit.push({uid:ship.uid,name:ship.name,hull:ship.hull,color:ship.color,size:ship.size,speed:ship.speed,turn:ship.turn,wait:ship.wait,from:this.s.system,to,eta:this.s.playtime+6+jumpDistance(this.s.system,to)*.2});
  if(this.s.transit.length>24)this.s.transit.shift();
  this.traffic=this.traffic.filter(t=>t!==ship);
  this.burst(ship.x,ship.y,'#9be7ff',14);
  if(this.target===ship)this.target=wake;
 }
 updateTraffic(dt){
  for(const w of this.wakes)w.life-=dt;
  this.wakes=this.wakes.filter(w=>w.life>0);
  if(this.target?.type==='wake'&&!this.wakes.includes(this.target))this.target=this.station;
  for(const ship of [...this.traffic]){
   ship.work=(ship.work||0)+dt;
   if(ship.underAttackUntil>this.time){
    ship.status='UNDER ATTACK';
    const threats=[...this.enemies.filter(e=>!e.response||e.wanted),this.player];
    const threat=threats.filter(t=>dist(ship,t)<1400).sort((a,b)=>dist(ship,a)-dist(ship,b))[0]||this.player;
    const flee=Math.atan2(ship.y-threat.y,ship.x-threat.x),turn=angleDiff(flee,ship.angle);
    ship.angle+=clamp(turn,-ship.turn*dt,ship.turn*dt);ship.thrust=.85;
    ship.x+=Math.cos(ship.angle)*ship.speed*1.15*dt;ship.y+=Math.sin(ship.angle)*ship.speed*1.15*dt;
    continue;
   }
   if(ship.pause>0){
    ship.pause-=dt;ship.thrust=0;
    const stop=ship.points[1-ship.target];
    if(dist(ship,stop)<18){
     ship.status=stop.status;
     ship.x=stop.x+Math.sin(this.time*1.4+ship.phase)*2.2;
     ship.y=stop.y+Math.cos(this.time*1.1+ship.phase)*1.6;
     if(stop.status==='MINING RUN'||stop.status==='PLANETARY SURVEY')ship.angle+=dt*.35;
     else if(stop.status==='FUEL SCOOPING')ship.angle=Math.atan2(this.star.y-ship.y,this.star.x-ship.x);
    }else ship.status='IN TRANSIT';
    if(ship.pause<=0&&ship.canJump&&stop.status==='AT JUMP POINT'&&ship.job==='DEPARTING FOR JUMP POINT'){this.departJump(ship);continue;}
    if(ship.pause<=0&&ship.canJump&&stop.status==='DOCKED'){
     const jump=this.jumpAnchor((Math.random()-.5)*160);
     ship.destination=pickTradeDestination(this.s.system,SYSTEMS,jumpDistance);
     ship.job='DEPARTING FOR JUMP POINT';
     ship.points=[{x:this.station.x,y:this.station.y,status:'DOCKED'},jump];
     ship.target=1;ship.pause=0.2;ship.status='DOCKED';
    }
   }else{
    const target=ship.points[ship.target],dx=target.x-ship.x,dy=target.y-ship.y,d=Math.hypot(dx,dy),desired=Math.atan2(dy,dx),turn=angleDiff(desired,ship.angle);
    ship.angle+=clamp(turn,-ship.turn*dt,ship.turn*dt);
    const aligned=1-Math.min(1,Math.abs(turn)/1.15);
    if(d<18&&Math.abs(turn)<.55){
     ship.x=target.x;ship.y=target.y;ship.pause=target.status==='DOCKED'?2+ship.phase*.2:ship.wait;ship.status=target.status;ship.target=ship.target?0:1;ship.thrust=0;
    }else{
     const approach=Math.min(ship.speed,Math.max(22,d*.5))*Math.max(.22,aligned);
     ship.x+=Math.cos(ship.angle)*approach*dt;ship.y+=Math.sin(ship.angle)*approach*dt;
     ship.thrust=Math.min(1,approach/ship.speed);ship.status='IN TRANSIT';
    }
   }
   if(ship.thrust>.08){
    ship.trail.push({x:ship.x-Math.cos(ship.angle)*ship.size,y:ship.y-Math.sin(ship.angle)*ship.size,life:.35});
    if(ship.trail.length>10)ship.trail.shift();
   }
   for(const t of ship.trail)t.life-=dt;ship.trail=ship.trail.filter(t=>t.life>0);
  }
 }
 reportSecurityIncident(offender,victim){
  victim.underAttackUntil=this.time+8;
  if(offender==='player'){const fresh=!victim.playerReported;victim.playerReported=true;this.markWanted(fresh?45:18,{x:victim.x,y:victim.y});if(fresh){this.s.bounty+=400;const faction=this.sys.faction;if(faction)this.s.reputation[faction]=clamp(this.s.reputation[faction]-8,-100,100);this.notify('Civilian assault reported · 400 cr bounty.','bad');}}
  else{offender.wanted=true;offender.lastCrime=this.time;offender.crimeX=victim.x;offender.crimeY=victim.y;}
  return !!this.patrols.length;
 }
 civilianLoot(ship){
  this.s.bounty+=600;this.markWanted(55,{x:ship.x,y:ship.y});const free=getStats(this.s).cargo-cargoUsed(this.s);if(free>0&&Math.random()<.45){const goods=['food','ore','tech','meds'],good=goods[Math.floor(Math.random()*goods.length)],amount=Math.min(free,1+Math.floor(Math.random()*3));this.s.cargo[good]+=amount;this.notify(`${ship.name} destroyed · ${amount} t ${GOODS.find(g=>g.id===good).name} recovered · bounty ${this.s.bounty.toLocaleString()} cr.`,'bad');return{good,amount};}this.notify(`${ship.name} destroyed · bounty ${this.s.bounty.toLocaleString()} cr. No cargo recovered.`,'bad');return null;
 }
 resolveTrafficShots(){
  for(const b of this.shots){if(!b.trafficShot&&!b.playerShot)continue;const candidates=b.trafficTarget?this.traffic.filter(t=>t.id===b.trafficTarget):this.traffic,from={x:b.previousX??b.x,y:b.previousY??b.y},ship=candidates.filter(t=>beamDistance(t,from,b)<t.r+6).sort((a,c)=>dist(from,a)-dist(from,c))[0];if(!ship)continue;ship.hp-=b.damage;b.life=0;ship.underAttackUntil=this.time+8;this.burst(ship.x,ship.y,'#8fc8d5',5);if(b.playerShot)this.reportSecurityIncident('player',ship);if(ship.hp<=0){this.traffic=this.traffic.filter(t=>t!==ship);this.burst(ship.x,ship.y,'#ffd297',18);if(b.playerShot)this.civilianLoot(ship);if(this.target===ship)this.target=this.station;}}
  this.shots=this.shots.filter(b=>b.life>0);
 }
 updateSecurity(dt){
  if(this.responseAt!=null&&this.time>=this.responseAt){this.responseAt=null;this.spawnResponseTeam();}
  if(this.heatWanted>0){
   this.heatWanted=Math.max(0,this.heatWanted-dt*(this.heatWanted>55?2.4:3.8));
   if(this.heatWanted<=0){this.heatWanted=0;this.lastKnown=null;this.playerCrimeUntil=0;this.playerCrime=null;}
   else if(this.securityWatchers().some(w=>dist(w,this.player)<780)){this.lastKnown={x:this.player.x,y:this.player.y};this.playerCrime={x:this.player.x,y:this.player.y};this.playerCrimeUntil=Math.max(this.playerCrimeUntil,this.time+10);}
  }
  for(const e of this.enemies){
   if(e.response||String(e.id||'').startsWith('patrol-'))continue;
   const victim=this.traffic.filter(t=>dist(e,t)<780).sort((a,b)=>dist(e,a)-dist(e,b))[0];e.raidFire=(e.raidFire??.4)-dt;if(victim&&e.raidFire<=0){e.raidFire=1.8+Math.random()*.8;const a=Math.atan2(victim.y-e.y,victim.x-e.x);this.shots.push({x:e.x,y:e.y,vx:Math.cos(a)*430,vy:Math.sin(a)*430,life:2.2,enemy:true,trafficShot:true,trafficTarget:victim.id,damage:7});this.reportSecurityIncident(e,victim);}
  }
  for(const p of [...this.patrols]){
   if(this.s.reputation[p.faction]<=-20){p.type='enemy';this.enemies.push(p);this.patrols=this.patrols.filter(q=>q!==p);continue;}
   const responseRange=1200+wantedTier(this.s.bounty).level*150,nearIncident=e=>Math.hypot(p.x-(e.crimeX??e.x),p.y-(e.crimeY??e.y))<=responseRange||dist(p,e)<=responseRange,threats=this.enemies.filter(e=>!e.response&&!String(e.id||'').startsWith('patrol-')&&(this.time-(e.lastCrime??-100)<18&&nearIncident(e)||p.faction===this.s.allegiance&&dist(p,e)<620));
   const hunting=this.heatWanted>0&&this.lastKnown,playerVisible=hunting&&dist(p,this.player)<780,aim=hunting?(playerVisible?this.player:this.lastKnown):null;
   const pirate=threats.sort((a,b)=>dist(p,a)-dist(p,b))[0],target=aim||pirate;
   if(target){
    const d=dist(p,target),a=Math.atan2(target.y-p.y,target.x-p.x);p.responseTarget=aim?(playerVisible?'player':'last-known'):target.id;p.status=aim?(playerVisible?'ENGAGING':'SEARCHING'):'RESPONDING';p.angle=a;
    const speed=d>90?125:d<40?-40:0;p.thrust=speed>0?.7:0;p.x+=Math.cos(a)*speed*dt;p.y+=Math.sin(a)*speed*dt;p.fire-=dt;
    if(playerVisible&&d<620&&p.fire<0){p.fire=1.15;this.shots.push({x:p.x,y:p.y,vx:Math.cos(a)*600,vy:Math.sin(a)*600,damage:9,enemy:true,ally:false,security:true,life:1.2});}
    else if(!aim&&pirate&&d<620&&p.fire<0){p.fire=1.15;this.shots.push({x:p.x,y:p.y,vx:Math.cos(a)*600,vy:Math.sin(a)*600,damage:9,enemy:false,ally:true,security:true,life:1.2});}
    if(aim&&!playerVisible&&d<55){p.angle+=dt*.9;p.thrust=.2;p.x+=Math.cos(p.angle)*28*dt;p.y+=Math.sin(p.angle)*28*dt;}
   }
   else{p.responseTarget=null;p.status='PATROLLING';p.thrust=.25;p.angle+=dt*.15;p.x+=Math.cos(p.angle)*30*dt;p.y+=Math.sin(p.angle)*30*dt;}
  }
  for(const e of this.enemies.filter(e=>e.response)){
   if(!(this.heatWanted>0&&this.lastKnown)){e.thrust=.2;e.angle+=dt*.2;e.x+=Math.cos(e.angle)*40*dt;e.y+=Math.sin(e.angle)*40*dt;e.status='PATROLLING';continue;}
   const playerVisible=dist(e,this.player)<900,aim=playerVisible?this.player:this.lastKnown,a=Math.atan2(aim.y-e.y,aim.x-e.x),d=dist(e,aim);
   e.angle=a;e.status=playerVisible?'ENGAGING':'SEARCHING';const speed=d>120?155:d<55?-25:40;e.thrust=speed>0?.9:0;e.x+=Math.cos(a)*speed*dt;e.y+=Math.sin(a)*speed*dt;e.fire-=dt;
   if(playerVisible&&d<780&&e.fire<0){e.fire=.85;this.shots.push({x:e.x,y:e.y,vx:Math.cos(a)*640,vy:Math.sin(a)*640,damage:12,enemy:true,security:true,life:1.3});}
   if(!playerVisible&&d<70){e.angle+=dt*1.1;e.x+=Math.cos(e.angle)*35*dt;e.y+=Math.sin(e.angle)*35*dt;}
  }
 }
 scheduleResponseTeam(delay=10){if(this.responseAt!=null)return false;if(!this.sys.hasStation&&!this.sys.faction){this.notify('No local security authority to scramble here.');return false;}this.responseAt=this.time+delay;this.notify('Local security is scrambling a response team.','bad');return true;}
 spawnResponseTeam(opts={}){
  const force=!!opts.force;
  if(!this.sys.hasStation&&!this.sys.faction&&!force){this.notify('No local security authority here to scramble.');return false;}
  const f=this.securityFaction(),cleared=this.s.cleared?.[this.s.system]||[];
  this.responseWave=(this.responseWave||0)+1;
  let spawned=0;
  for(let i=0;i<3;i++){
   const id='patrol-response-'+f+'-w'+this.responseWave+'-'+i;
   if(!force&&cleared.includes(id))continue;
   if(this.enemies.some(e=>e.id===id))continue;
   const a=(this.player.angle||0)+i*2.1,spawnAt=this.lastKnown||this.player;
   this.enemies.push({id,name:'Security response',type:'enemy',faction:f,response:true,x:spawnAt.x+Math.cos(a)*520,y:spawnAt.y+Math.sin(a)*520,angle:a+Math.PI,hp:145,max:145,r:22,fire:.4,bounty:420,wanted:false,status:'SEARCHING'});
   spawned++;
  }
  if(!spawned){this.notify('Response team could not launch — try again or clear the area.');return false;}
  this.s.bounty+=500;this.markWanted(70,this.lastKnown||this.player);
  this.notify('Security response team inbound · '+spawned+' ships!','bad');
  return true;
 }
 scanWake(){
  if(this.s.docked||this.surface||this.jump){this.notify('Launch into local space to scan wakes.');return false;}
  const wake=this.target?.type==='wake'?this.target:this.wakes.filter(w=>dist(this.player,w)<260).sort((a,b)=>dist(this.player,a)-dist(this.player,b))[0];
  if(!wake){this.notify('No hyperspace wake in range.');return false;}
  if(Math.hypot(this.player.vx,this.player.vy)>140){this.notify('Slow below 140 m/s to resolve a wake.');return false;}
  this.target=wake;wake.scanned=true;
  this.notify(`${wake.shipName} jumped toward ${systemName(SYSTEMS[wake.to],this.s)}.`,'good');
  return true;
 }
 followWake(){const wake=this.target?.type==='wake'?this.target:null;if(!wake){this.notify('Target a scanned wake first.');return false;}if(!wake.scanned)return this.scanWake();return this.setRoute(wake.to);}
 payBounty(){if(!this.s.docked||!(this.s.bounty||this.s.detained))return false;const fine=Math.max(this.s.bounty||0,this.s.detained?500:0);if(this.s.credits<fine){this.notify(this.s.detained?'Insufficient credits to clear the detention fine.':'Insufficient credits to clear the bounty.','bad');return false;}const paid=fine;this.s.credits-=paid;this.s.bounty=0;const wasDetained=this.s.detained;this.s.detained=false;this.heatWanted=0;this.lastKnown=null;this.playerCrimeUntil=0;this.playerCrime=null;if(wasDetained){this.s.stationPos=null;this.enterStationDeck();}this.notify((this.sys.prison?'Detention fine cleared':'Bounty cleared')+' · '+paid.toLocaleString()+' cr · standing CLEAN','good');return true;}
 teleportTo(systemId,{docked=false,credits=null,bounty=null,fuel=true,repair=true}={}){
  if(!SYSTEMS[systemId])return false;
  this.surface=null;this.s.surface=null;this.onfoot=null;this.s.stationPos=null;this.jump=null;this.s.system=systemId;if(!this.s.visited.includes(systemId))this.s.visited.push(systemId);this.s.docked=!!docked;if(credits!=null)this.s.credits=credits;if(bounty!=null)this.s.bounty=bounty;this.makeSystem();
  const st=getStats(this.s);if(fuel)this.s.fuel=st.fuel;if(repair){this.s.hull=st.hull;this.s.shield=st.shield;}
  if(!docked){this.player.x=this.star.x+this.star.r+950;this.player.y=this.star.y;this.player.vx=this.player.vy=0;}
  else this.enterStationDeck();
  this.notify('Dev teleport · '+systemName(this.sys,this.s)+(docked?' (docked)':''),'good');return true;
 }
 logExploration(entry){if(!this.s.explorationLog.some(e=>e.id===entry.id))this.s.explorationLog.push({...entry,sold:false});}
 sellExplorationData(){
  if(!this.s.docked)return false;const signals=this.s.records.reduce((sum,r)=>sum+r.value,0),total=this.s.data+signals;
  if(!total){this.notify('No unsold exploration data aboard.');return false;}
  this.s.credits+=total;this.s.data=0;this.s.records=[];for(const entry of this.s.explorationLog)if(!entry.sold)entry.sold=true;
  this.notify('Exploration data sold · +'+total.toLocaleString()+' cr','good');return true;
 }
 spawnOperations(){for(const op of this.s.operations||[]){if(op.type!=='combat'||op.target!==this.s.system||op.kills>=2)continue;const f=FACTIONS.find(f=>f.id===op.faction).rival,c=this.s.cleared[this.s.system]||[];for(let i=0;i<2;i++){const id=op.uid+'-'+i;if(c.includes(id)||this.enemies.some(e=>e.id===id))continue;this.enemies.push({id,type:'enemy',name:FACTIONS.find(fac=>fac.id===f).name+' interceptor',faction:f,x:600+i*300,y:1850+i*140,angle:0,hp:110,max:110,r:21,fire:1,bounty:300});}}}
 serialize(){const planetFoot=this.surface&&this.onfoot&&this.onfoot.kind==='planet'?onFootSave(this.onfoot):(this.s.surface?.foot||null);return{...super.serialize(),stationPos:this.onfoot&&this.s.docked?onFootSave(this.onfoot):(this.s.docked?this.s.stationPos:null),surface:this.surface?{planetId:this.surface.planetId,x:this.surface.x,y:this.surface.y,integrity:this.surface.integrity,recordStart:this.surfaceRecordsStart,foot:planetFoot}:null};}
 select(id){if(id.startsWith('planet-')&&!this.visiblePlanets.some(p=>p.id===id))return null;if(id==='star'||id.startsWith('star-')){const star=(this.stars||[this.star]).find(s=>s.id===id)||this.star;this.target=star;this.auto=null;return star;}const dock=(this.stations||[]).find(s=>s.id===id);if(dock){this.target=dock;if(dock.type==='station')this.station=dock;this.auto=null;return dock;}const beltBody=(this.belts||[]).find(b=>b.id===id);if(beltBody){this.target=beltBody;this.auto=null;return beltBody;}const wake=this.wakes.find(w=>w.id===id);if(wake){this.target=wake;this.auto=null;return wake;}const sig=this.signals.find(s=>s.id===id);if(sig){this.target=sig;this.auto=null;return sig;}const der=this.derelicts.find(d=>d.id===id);if(der){this.target=der;this.auto=null;return der;}const p=this.patrols.find(p=>p.id===id);if(p){this.target=p;this.auto=null;return p;}return super.select(id);}
 scanDynamic(){return scanDynamicTarget(this);}
 setRoute(destination){const path=findRoute(this.s.system,destination,getStats(this.s).range);if(!path){this.notify('No route within your drive range.');return false;}this.s.route={destination,path};this.notify(path.length?`Route plotted · ${path.length} jumps to ${systemName(SYSTEMS[destination],this.s)}`:'Destination is in this system.','good');return true;}
 routeContract(id){const m=this.s.missions.find(m=>m.id===id);if(!m)return false;const to=missionDestination(this.s,m);if(!this.setRoute(to))return false;if(to===this.s.system)this.target=m.type==='survey'?this.visiblePlanets.find(p=>!this.s.scanned.includes(p.id))||this.star:m.type==='mining'&&this.s.cargo.ore<m.tons||m.type==='bounty'&&this.s.metrics.pirates-m.startKills<2?(this.belt||this.star):this.station;return true;}
 routeOperation(uid){
  const o=this.s.operations.find(o=>o.uid===uid);if(!o)return false;
  const d=operationDetails(this.s,o);if(!this.setRoute(d.destination))return false;
  if(d.destination===this.s.system){this.auto=null;this.target=o.type==='combat'&&o.kills<2?this.enemies.find(e=>e.id.startsWith(o.uid+'-'))||this.enemies.find(e=>e.faction===FACTIONS.find(f=>f.id===o.faction).rival)||this.belt||this.star:this.station;this.notify(d.next);}
  return true;
 }
 refreshRoute(){if(this.s.route)this.s.route.path=findRoute(this.s.system,this.s.route.destination,getStats(this.s).range)||[];}
 jumpNext(){if(!this.s.route)return false;const path=findRoute(this.s.system,this.s.route.destination,getStats(this.s).range);if(!path?.length){this.notify('Route complete.');return false;}this.s.route.path=path;return this.jumpTo(path[0]);}
 jumpTo(id){if(this.surface){this.notify('Return to orbit before jumping.');return false;}const ok=super.jumpTo(id);if(ok){this.scooping=false;this.discoveryScan=null;}return ok;}
 dock(){if(this.jump){this.notify('Wait for the fold jump to finish.');return false;}if(this.surface){this.notify('Return to orbit first.');return false;}if(!this.sys.hasStation){this.notify('No station here. Scoop fuel at the star, or plot a route to a relay.');return false;}const wasDocked=this.s.docked,pending=this.s.data;this.s.data=0;const ok=super.dock();this.s.data=pending;if(ok&&!wasDocked){this.scooping=false;this.scoopRate=0;this.discoveryScan=null;this.s.heat=25;this.s.stationPos=null;this.enterStationDeck();this.notify(pending||this.s.records.length?'Exploration data ready for review at Cartographics. Walk the deck to Cartographics.':'Docking complete. Walk the station deck to visit services.');speakRobot(this,'greeting');}else if(ok&&!this.onfoot)this.enterStationDeck();return ok;}
 talkRobot(mode='talk'){if(!this.s.docked){this.notify('Dock before chatting with station services.');return null;}return speakRobot(this,mode==='tip'?'tip':mode==='greeting'?'greeting':'talk');}
 get visiblePlanets(){return this.planets.filter(p=>!this.sys.uncharted||this.s.systemScans?.includes(this.s.system)||this.s.scanned.includes(p.id));}
 discover(){
  if(this.s.docked||this.surface||this.jump){this.notify('Launch into local space to use the discovery scanner.');return false;}
  if(this.discoveryScan||this.scan){this.notify('Scanner already active.');return false;}
  if(this.s.systemScans.includes(this.s.system)){this.notify('System catalog complete. Approach a world for a detailed survey.');return false;}
  this.discoveryScan={progress:0};this.notify('Discovery pulse charging.');return true;
 }
 scanTarget(){if(this.surface)return this.scanSurface();if(this.discoveryScan||this.jump)return false;if(!this.visiblePlanets.length)return this.discover();if(!this.visiblePlanets.includes(this.target))this.target=this.visiblePlanets.reduce((a,b)=>dist(this.player,a)<dist(this.player,b)?a:b);return super.scanTarget();}

 land(){if(this.s.docked||this.jump)return false;if(!this.visiblePlanets.length){this.notify('Run a discovery scan to locate worlds first.');return false;}const candidates=this.visiblePlanets.filter(isLandablePlanet);if(!candidates.length){this.notify('No landable worlds here. Gas giants cannot be entered.');return false;}const p=candidates.includes(this.target)?this.target:candidates[0];this.target=p;if(!isLandablePlanet(p)){this.notify('Gas giants cannot be landed on. Select a solid world.');return false;}if(dist(this.player,p)>p.r+450){this.auto=p;this.notify('Approaching landing range. Tap LAND when you arrive.');return false;}if(Math.hypot(this.player.vx,this.player.vy)>100){this.notify('Slow below 100 m/s for atmospheric entry.');return false;}this.auto=null;this.scan=null;this.discoveryScan=null;this.scooping=false;this.shots=[];this.onfoot=null;this.surface=createSurface(p,this.s.surfaceScanned);this.surfaceRecordsStart=this.s.records.length;this.player.vx=this.player.vy=0;this.notify('Surface flight engaged. Soft-land, then disembark to inspect nearby signals.','good');return true;}
 takeoff(){if(!this.surface)return false;if(this.onfoot){this.notify('Board the skiff first.');return false;}const p=this.planets.find(p=>p.id===this.surface.planetId);this.surface=null;this.s.surface=null;this.onfoot=null;this.player.x=p.x;this.player.y=p.y+p.r+360;this.player.vx=this.player.vy=0;this.target=p;this.notify('Back in orbit. Dock to sell anomaly signals.');return true;}
 completeSurfaceRecord(a){
  if(!this.surface||!a)return false;
  if(this.s.surfaceScanned.includes(a.id)){a.scanned=true;return false;}
  a.scanned=true;
  this.s.surfaceScanned.push(a.id);
  const value=Math.round(a.value*getStats(this.s).signalMultiplier);
  this.s.records.push({id:a.id,kind:a.kind,value,system:this.s.system});
  this.logExploration({id:a.id,type:'surface',system:this.s.system,name:this.surface.planetName+' · '+a.name,value});
  this.s.metrics.anomalies++;if(a.kind==='geology')this.s.metrics.geology++;
  this.notify(a.name+' recorded. Sell the signal at a station.','good');
  return true;
 }
 disembark(){
  if(!this.surface||this.onfoot)return false;
  if(!this.surface.landed){this.notify('Touch down before leaving the skiff.');return false;}
  this.surface.scan=null;this.surface.vx=0;this.surface.vy=0;
  this.onfoot=createOnFoot(createPlanetLayout(this.surface),this.s.surface?.foot);
  this.notify('Disembarked. Walk to a signal pad, then board the skiff.','good');
  return true;
 }
 boardSkiff(){
  if(!this.surface||!this.onfoot||this.onfoot.kind!=='planet')return false;
  const foot=onFootSave(this.onfoot);
  this.s.surface={planetId:this.surface.planetId,x:this.surface.x,y:this.surface.y,integrity:this.surface.integrity,recordStart:this.surfaceRecordsStart,foot};
  this.onfoot=null;
  const ground=terrainAt(this.surface.x,this.surface.seed)-19;
  this.surface.y=ground;this.surface.vy=0;this.surface.vx*=.4;this.surface.landed=true;
  this.notify('Back aboard the skiff.');
  return true;
 }
 interactPlanet(){
  if(!this.surface||!this.onfoot||this.onfoot.kind!=='planet')return null;
  const z=nearestZone(this.onfoot);if(!z)return null;
  if(z.board||z.service==='board'){this.boardSkiff();return{board:true};}
  if(z.service==='cache'){
   if(z.looted){this.notify('Cache already emptied.');return{done:true};}
   const good=z.cacheGood||'ore';
   const st=getStats(this.s);
   if(cargoUsed(this.s)>=st.cargo){
    const cr=80+Math.floor(Math.random()*61);this.s.credits+=cr;z.looted=true;z.label='Emptied';z.service='done';
    this.notify(`Hold full · salvage sold · +${cr} cr`,'good');return{cache:true,credits:cr};
   }
   if(!(good in this.s.cargo)){const cr=100;this.s.credits+=cr;z.looted=true;z.label='Emptied';z.service='done';this.notify(`Salvage converted · +${cr} cr`,'good');return{cache:true,credits:cr};}
   this.s.cargo[good]+=1;z.looted=true;z.label='Emptied';z.service='done';
   this.notify(`Salvage recovered · +1 t ${good}`,'good');return{cache:true,good};
  }
  if(z.service==='inspect'&&z.anomalyId){
   const a=this.surface.anomalies.find(a=>a.id===z.anomalyId);
   if(!a){this.notify('Signal not found.');return null;}
   if(a.scanned){this.notify('Already recorded.');return{done:true};}
   if(!this.onfoot.footScan||this.onfoot.footScan.id!==z.id){
    this.onfoot.footScan={id:z.id,progress:0,need:1.4};
    this.notify('Surveying '+a.name.toLowerCase()+'. Hold position.');
    return{scanning:true};
   }
   return{scanning:true};
  }
  return null;
 }
 updatePlanetFootScan(dt){
  const scan=this.onfoot?.footScan;if(!scan||!this.onfoot)return;
  const z=this.onfoot.zones.find(z=>z.id===scan.id);
  if(!z||Math.hypot(z.x-this.onfoot.x,z.y-this.onfoot.y)>(z.r||40)+8){this.onfoot.footScan=null;this.notify('Survey interrupted.');return;}
  scan.progress+=dt;
  if(scan.progress<scan.need)return;
  this.onfoot.footScan=null;
  if(z.service!=='inspect'||!z.anomalyId)return;
  const a=this.surface.anomalies.find(a=>a.id===z.anomalyId);
  if(!a||a.scanned)return;
  this.completeSurfaceRecord(a);z.label='Recorded';z.service='done';
 }
 scanSurface(){const s=this.surface;if(!s||this.onfoot)return false;const a=nearestAnomaly(s);if(!a){this.notify('All anomalies here are recorded. Return to orbit.');return false;}if(Math.hypot(a.x-s.x,a.y-s.y)>230+getStats(this.s).surfaceRange){this.notify('Approach a signal to scan it.');return false;}if(Math.hypot(s.vx,s.vy)>85){this.notify('Release the stick and hover to scan.');return false;}if(s.scan)return false;s.scan={id:a.id,progress:0};this.notify('Scanning '+a.name.toLowerCase()+'.');return true;}
 pingSurface(){
  const s=this.surface;if(!s||this.onfoot)return false;
  if(s.pingCooldown>0){this.notify('Beacon recharging · '+Math.ceil(s.pingCooldown)+'s');return false;}
  const a=nearestAnomaly(s);if(!a){this.notify('No unscanned signals remain.');return false;}
  s.ping={x:a.x,y:a.y,life:4.5};s.pingCooldown=8;
  this.notify('Beacon ping · nearest '+a.kind+' · '+Math.round(Math.hypot(a.x-s.x,a.y-s.y))+' m','good');
  return true;
 }
 scoop(){
  if(this.scooping){this.scooping=false;this.scoopRate=0;this.notify('Fuel scoop retracted.');return true;}
  if(this.surface||this.s.docked||this.jump)return false;
  const star=this.nearestScoopStar();
  this.target=star;
  if(this.s.fuel>=getStats(this.s).fuel){this.notify('Fuel tank is full.');return false;}
  if(dist(this.player,star)>star.r+600){this.auto=star;this.notify('Approaching the star. Tap SCOOP when you arrive.');return false;}
  if(this.s.heat>=90){this.notify('Too hot to deploy the scoop. Move away to cool below 90%.');return false;}
  if(Math.hypot(this.player.vx,this.player.vy)>100){this.notify('Slow below 100 m/s to scoop fuel.');return false;}
  this.auto=null;this.scooping=true;this.notify('Fuel scoop deployed. Watch heat and hold position.');return true;
 }
 nearestScoopStar(){const list=this.stars||[this.star];return list.filter(s=>s.scoopable!==false).sort((a,b)=>dist(this.player,a)-dist(this.player,b))[0]||this.star;}
 // Only rocks and ships occupy the player's flight plane. Sweep the movement
 // segment so a boosted ship cannot skip through a small obstacle in one tick.
 resolveFlightCollisions(from){
  const p=this.player;
  const bodies=[...this.asteroids,...this.enemies,...this.traffic,...this.patrols].filter(b=>b.hp>0);
  for(const b of bodies){
   const radius=p.r+b.r,dx=p.x-from.x,dy=p.y-from.y,ox=from.x-b.x,oy=from.y-b.y;
   const a=dx*dx+dy*dy,c=ox*ox+oy*oy-radius*radius;
   let hit=null;
   if(c>=0&&a>0){const dot=ox*dx+oy*dy,disc=dot*dot-a*c;if(disc>=0){const t=(-dot-Math.sqrt(disc))/a;if(t>=0&&t<=1)hit={x:from.x+dx*t,y:from.y+dy*t};}}
   if(!hit&&dist(p,b)<radius)hit={x:p.x,y:p.y};
   if(!hit)continue;
   let nx=hit.x-b.x,ny=hit.y-b.y,length=Math.hypot(nx,ny);
   if(length<1e-8){nx=-Math.cos(p.angle);ny=-Math.sin(p.angle);length=1;}
   nx/=length;ny/=length;
   p.x=b.x+nx*(radius+.01);p.y=b.y+ny*(radius+.01);
   const inward=p.vx*nx+p.vy*ny;
   if(inward<0){p.vx-=inward*nx;p.vy-=inward*ny;}
  }
 }

 updateStellar(dt){
  const p=this.player,star=this.scooping?this.nearestScoopStar():this.nearestScoopStar();
  const d=dist(p,star),altitude=d-star.r,heatScale=star.heat||1;
  if(this.scooping&&(altitude>650||Math.hypot(p.vx,p.vy)>100)){this.scooping=false;this.notify('Scoop retracted. Stay in range and below 100 m/s.');}
  const equilibrium=25+125*heatScale*Math.pow(clamp((850-altitude)/850,0,1),2)+(this.scooping?8:0);
  const before=this.s.heat;this.s.heat=clamp(before+(equilibrium-before)*(1-Math.exp(-dt*.18)),0,150);
  if(before<80&&this.s.heat>=80)this.notify('Heat warning. Move away from the star to cool.','bad');
  if(this.scooping&&this.s.heat>=95){this.scooping=false;this.notify('Scoop emergency retraction: critical heat. Move away!','bad');}
  if(this.s.heat>100){this.s.hull-=dt*(this.s.heat-100)*.35;this.lastDamage=this.time;this.lastHitSecurity=false;}
  this.scoopRate=this.scooping?4+12*clamp((650-altitude)/500,0,1):0;
  if(this.scooping){this.s.fuel=Math.min(getStats(this.s).fuel,this.s.fuel+this.scoopRate*dt);if(this.s.fuel>=getStats(this.s).fuel){this.scooping=false;this.scoopRate=0;this.notify('Fuel tank full. Scoop retracted.','good');}}
 }

 claimMissions(){const done=this.s.missions.filter(m=>this.missionReady(m));super.claimMissions();if(this.s.docked)for(const m of done)if(m.type==='delivery')this.s.metrics.deliveries++;}
 buyShip(id){if(!this.s.docked||id===this.s.ship)return false;const b=SHIPS.find(b=>b.id===id);if(!b)return false;const owned=this.s.fleet.includes(id),cost=owned?0:b.price,st=getStats({...this.s,ship:id});if(this.s.credits<cost){this.notify('Insufficient credits.');return false;}if(cargoUsed(this.s)>st.cargo){this.notify('This ship cannot hold your cargo. Sell enough cargo to switch ships.');return false;}this.s.hangar[this.s.ship]={hull:this.s.hull,shield:this.s.shield,fuel:this.s.fuel};this.s.credits-=cost;this.s.ship=id;if(!owned)this.s.fleet.push(id);const h=this.s.hangar[id]||st;this.s.hull=clamp(h.hull,1,st.hull);this.s.shield=st.shield;this.s.fuel=clamp(h.fuel,0,st.fuel);this.player.r=shipRadius(id);this.refreshRoute();this.notify((owned?'Switched to ':'Purchased ')+b.name+'. Other ships remain in your hangar.','good');return true;}
 upgrade(kind){if(!this.s.docked||!MODULES[kind]?.standard)return false;const active=this.s.loadouts[this.s.ship],m=this.s.modules.find(m=>m.kind===kind&&active.includes(m.uid)),grade=m?.grade||0,cost=MODULES[kind].price*(grade+1);if(grade>=3||this.s.credits<cost)return false;if(!m&&this.s.modules.length>=85){this.notify('Module storage is full. Upgrade an existing module.');return false;}if(!m&&active.length>=moduleSlots(this.s.ship)){this.notify('Remove a module to free a slot.');return false;}this.s.credits-=cost;if(m)m.grade++;else{const item={uid:'m-'+this.s.nextModule++,kind,grade:1};this.s.modules.push(item);active.push(item.uid);}this.s.shield=getStats(this.s).shield;this.refreshRoute();this.notify(MODULES[kind].name+' fitted.','good');return true;}
 moduleLocation(uid){return shipIds.find(id=>this.s.loadouts[id].includes(uid))||null;}
 equip(uid){if(!this.s.docked)return false;const item=this.s.modules.find(m=>m.uid===uid);if(!item)return false;const a=this.s.loadouts[this.s.ship],source=this.moduleLocation(uid);if(source===this.s.ship)return false;if(a.length>=moduleSlots(this.s.ship)){this.notify('Remove a module to free a slot.');return false;}if(a.some(id=>MODULES[this.s.modules.find(m=>m.uid===id).kind].category===MODULES[item.kind].category)){this.notify('Remove the installed module in this category first.');return false;}if(source)this.s.loadouts[source]=this.s.loadouts[source].filter(id=>id!==uid);a.push(uid);this.s.shield=getStats(this.s).shield;this.refreshRoute();this.notify(MODULES[item.kind].name+' installed.','good');return true;}
 unequip(uid){if(!this.s.docked)return false;const src=this.moduleLocation(uid);if(!src)return false;const old=this.s.loadouts[src];this.s.loadouts[src]=old.filter(id=>id!==uid);if(cargoUsed(this.s)>getStats(this.s).cargo){this.s.loadouts[src]=old;this.notify('Sell cargo before removing this cargo module.');return false;}const st=getStats(this.s);this.s.hull=Math.min(this.s.hull,st.hull);this.s.shield=Math.min(this.s.shield,st.shield);this.s.fuel=Math.min(this.s.fuel,st.fuel);this.refreshRoute();this.notify('Module moved to storage.');return true;}
 joinGuild(id){if(!this.s.docked||!guildIds.includes(id))return false;this.s.guilds[id].joined=true;this.notify('Guild membership confirmed.','good');return true;}
 acceptGuild(id){const state=this.s.guilds[id],guild=GUILDS.find(g=>g.id===id);if(!this.s.docked||!state?.joined||state.active||state.stage>=3)return false;const q=guild.quests[state.stage];state.active=true;state.baseline=q.metric?metric(this.s,q.metric):0;this.notify('Commission accepted: '+q.name,'good');return true;}
 claimGuild(id){if(!this.s.docked||!guildIds.includes(id))return false;const p=guildProgress(this.s,id);if(!p.ready)return false;const q=p.quest;if(q.good)this.s.cargo[q.good]-=q.count;this.s.credits+=q.credits;this.s.modules.push({uid:'m-'+this.s.nextModule++,kind:q.reward,grade:1});this.s.guilds[id].stage++;this.s.guilds[id].active=false;this.notify('Reward: '+MODULES[q.reward].name+'. Fit it in Modules.','good');return true;}
 pledge(id){if(!factionIds.includes(id)&&id!==null)return false;this.s.allegiance=id;this.notify(id?'Supporting '+FACTIONS.find(f=>f.id===id).name+'.':'Flying independently.');return true;}
 acceptOperation(faction,type){if(!this.s.docked||!factionIds.includes(faction)||!['relief','combat'].includes(type)||this.s.operations.length>=3||this.s.operations.some(o=>o.faction===faction&&o.type===type))return false;const f=FACTIONS.find(f=>f.id===faction),target=SYSTEMS.filter(s=>s.faction===(type==='combat'?f.rival:faction)&&s.hasStation).sort((a,b)=>jumpDistance(this.s.system,a.id)-jumpDistance(this.s.system,b.id))[0];this.s.operations.push({uid:'op-'+this.s.nextOperation++,faction,type,target:target.id,kills:0});this.spawnOperations();this.notify(operationDetails(this.s,this.s.operations.at(-1)).next,'good');return true;}
 claimOperation(uid){const o=this.s.operations.find(o=>o.uid===uid);if(!this.s.docked||!o)return false;const d=operationDetails(this.s,o);if(!d.ready)return false;if(d.good)this.s.cargo[d.good]-=d.count;this.s.credits+=d.reward;this.s.reputation[o.faction]=clamp(this.s.reputation[o.faction]+15,-100,100);this.s.metrics.operations++;this.s.operations=this.s.operations.filter(op=>op.uid!==uid);this.notify('Operation complete · reputation +15 · '+d.reward+' cr','good');return true;}
 engageFaction(p){if(!p||p.type!=='faction')return false;this.patrols=this.patrols.filter(e=>e.id!==p.id);p.type='enemy';this.enemies.push(p);this.s.reputation[p.faction]=clamp(this.s.reputation[p.faction]-12,-100,100);this.notify('Weapons engaged against '+FACTIONS.find(f=>f.id===p.faction).name+'.','bad');return true;}
 shoot(){const civilian=this.target?.type==='traffic'?this.target:null;if(this.target?.type==='faction')this.engageFaction(this.target);const before=this.shots.length;super.shoot();if(this.shots.length===before)return;const b=this.shots.at(-1);b.playerShot=true;b.previousX=b.x;b.previousY=b.y;if(civilian&&dist(this.player,civilian)<700){const lead=dist(this.player,civilian)/820,moving=civilian.pause>0?0:civilian.speed,destination=civilian.points[civilian.target],course=Math.atan2(destination.y-civilian.y,destination.x-civilian.x),tx=civilian.x+Math.cos(course)*moving*lead,ty=civilian.y+Math.sin(course)*moving*lead,a=Math.atan2(ty-this.player.y,tx-this.player.x);b.vx=Math.cos(a)*820+this.player.vx;b.vy=Math.sin(a)*820+this.player.vy;b.trafficShot=true;b.trafficTarget=civilian.id;}}
 onHostileAttack(offender,victim){this.reportSecurityIncident(offender,victim);}
 onDestroyed(t,playerCredit=true){
  this.s.cleared[this.s.system]??=[];if(!this.s.cleared[this.s.system].includes(t.id))this.s.cleared[this.s.system].push(t.id);
  if(t.type!=='enemy'||!playerCredit)return;
  if(t.faction){
   this.s.metrics.factionKills[t.faction]++;this.s.reputation[t.faction]=clamp(this.s.reputation[t.faction]-10,-100,100);
   for(const o of this.s.operations)if(o.type==='combat'&&o.target===this.s.system&&FACTIONS.find(f=>f.id===o.faction).rival===t.faction)o.kills=Math.min(2,o.kills+1);
   if(String(t.id||'').startsWith('patrol-')||t.response){
    this.s.bounty+=t.response?800:400;this.markWanted(t.response?50:40,{x:t.x,y:t.y});
    const securityLeft=this.patrols.length+this.enemies.filter(e=>e!==t&&(e.response||String(e.id||'').startsWith('patrol-'))).length;
    if(securityLeft===0)this.scheduleResponseTeam(8);
    this.notify(`Security vessel destroyed · bounty ${wantedTier(this.s.bounty).label} · ${this.s.bounty.toLocaleString()} cr`,'bad');
   }
  }else{this.s.metrics.pirates++;if(this.s.allegiance)this.s.reputation[this.s.allegiance]=clamp(this.s.reputation[this.s.allegiance]+2,-100,100);}
 }
 rescue(){this.surface=null;this.s.surface=null;this.onfoot=null;this.s.stationPos=null;this.s.records=[];this.s.explorationLog=this.s.explorationLog.filter(e=>e.sold);this.s.system=this.nearestPort();this.s.route=null;super.rescue();this.s.heat=25;if(this.s.docked)this.enterStationDeck();}
 update(dt,input={}){
  dt=clamp(dt,0,.05);
  if(this.surface){
   this.time+=dt;this.s.playtime+=dt;
   if(this.onfoot&&this.onfoot.kind==='planet'){
    updateOnFoot(this.onfoot,dt,input);
    this.updatePlanetFootScan(dt);
    if(this.s.surface)this.s.surface.foot=onFootSave(this.onfoot);
    return;
   }
   const wasScan=!!this.surface.scan,result=updateSurface(this.surface,dt,input,getStats(this.s));
   if(result.completed)this.completeSurfaceRecord(result.completed);
   else if(wasScan&&!this.surface.scan)this.notify('Scan interrupted. Hover within range.');
   if(result.crashed){
    const lost=new Set(this.s.records.slice(this.surfaceRecordsStart).map(r=>r.id));
    this.s.records.splice(this.surfaceRecordsStart);this.s.explorationLog=this.s.explorationLog.filter(e=>!lost.has(e.id));
    this.s.hull=Math.max(1,this.s.hull-20);this.onfoot=null;
    this.takeoff();this.notify('Emergency ascent. This expedition’s signals were lost; hull damaged.','bad');
   }
   return;
  }
  const flightFrom={x:this.player.x,y:this.player.y};
  const previous=this.s.system,wasDocked=this.s.docked,wasJumping=!!this.jump,beforeScanned=new Set(this.s.scanned),beforeData=this.s.data;for(const b of this.shots)if(b.trafficShot||b.playerShot){b.previousX=b.x;b.previousY=b.y;}super.update(dt,input);this.resolveTrafficShots();if(!wasDocked&&this.s.docked){this.s.records=[];this.s.explorationLog=this.s.explorationLog.filter(e=>e.sold);this.enterStationDeck();}const added=this.s.scanned.find(id=>!beforeScanned.has(id));if(added){const planet=this.planets.find(p=>p.id===added),value=this.s.data-beforeData;this.logExploration({id:added,type:'world',system:this.s.system,name:planet?.name||added,value});}
  if(previous!==this.s.system){
   this.refreshRoute();
   if(wasJumping&&!this.s.docked){this.player.x=this.star.x+this.star.r+950;this.player.y=this.star.y;this.player.angle=0;this.player.vx=this.player.vy=0;this.target=this.star;this.notify('Arrived near the primary star. Run a discovery scan to catalog this system.');}
  }
  if(this.s.docked){
   this.s.heat=25;this.discoveryScan=null;this.scooping=false;this.scoopRate=0;this.s.playtime+=dt;
   if(!this.onfoot)this.enterStationDeck();
   if(this.onfoot){updateOnFoot(this.onfoot,dt,input);this.s.stationPos=onFootSave(this.onfoot);}
   // Station services leave local space running: traffic, patrols, and nearby drama continue.
   for(const b of this.shots){b.previousX=b.x;b.previousY=b.y;b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;}
   this.resolveTrafficShots();
   for(const e of this.enemies){e.thrust=.2;e.angle+=dt*.28;e.x+=Math.cos(e.angle)*26*dt;e.y+=Math.sin(e.angle)*26*dt;}
   this.updateTraffic(dt);this.updateSecurity(dt);this.dyn?.update(dt);this.shots=this.shots.filter(b=>b.life>0);
   return;
  }
  if(this.jump){this.scooping=false;this.scoopRate=0;return;}
  this.updateStellar(dt);
  this.updateTraffic(dt);
  this.updateSecurity(dt);
  this.dyn?.update(dt);
  tickDynScan(this,dt);
  // Gravity lens: slight velocity wobble while inside the contact radius.
  for(const s of this.signals){
   if((s.anomalyKind||s.payload?.anomalyKind)!=='gravityLens'||s.scanned)continue;
   if(dist(this.player,s)<420){this.player.vx+=(Math.random()-.5)*28*dt;this.player.vy+=(Math.random()-.5)*28*dt;}
  }
  if(!wasJumping)this.resolveFlightCollisions(flightFrom);
  if(this.s.hull<=0){super.update(0,{});this.s.records=[];this.s.explorationLog=this.s.explorationLog.filter(e=>e.sold);this.s.heat=25;return;}
  if(this.discoveryScan){
   this.discoveryScan.progress+=dt*(1+getStats(this.s).scanSpeed);
   if(this.discoveryScan.progress>=4){
    this.discoveryScan=null;
    if(!this.s.systemScans.includes(this.s.system)){this.s.systemScans.push(this.s.system);const value=Math.round((this.sys.uncharted?500:150)*getStats(this.s).dataMultiplier);this.s.data+=value;this.logExploration({id:'system-'+this.s.system,type:'system',system:this.s.system,name:this.sys.name+' system catalog',value});if(this.sys.uncharted)this.s.metrics.discoveries++;const stars=this.stars?.length||1;this.notify(`System cataloged · ${stars} star${stars>1?'s':''} · ${this.planets.length} world${this.planets.length===1?'':'s'} · +${value} cr data. Select Worlds to survey.`,'good');}
    if(this.sys.uncharted&&Math.random()<.25){
     const contacts=[...this.signals.filter(s=>s.kind==='anomaly'&&!s.scanned),...this.derelicts.filter(d=>d.anomalyKind&&!d.scanned)]
      .sort((a,b)=>dist(this.player,a)-dist(this.player,b));
     const hit=contacts[0];
     if(hit&&!hit.discovered){hit.discovered=true;this.target=hit;this.notify('Anomalous contact cataloged.','good');}
    }
   }
  }
 }
}

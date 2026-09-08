import {Game as FlightGame,newSave as v1Save,validateSave as v1Validate,SYSTEMS,SHIPS,GOODS,UPGRADES,getStats,cargoUsed,jumpDistance,dist,clamp} from './core.mjs';
import {FACTIONS,GUILDS,MODULES,moduleSlots} from './catalog.mjs';
import {createSurface,nearestAnomaly,updateSurface} from './surface.mjs';
export * from './core.mjs';
export {FACTIONS,GUILDS,MODULES,moduleSlots} from './catalog.mjs';
export {nearestAnomaly,terrainAt} from './surface.mjs';
export const VERSION=2;
const shipIds=SHIPS.map(s=>s.id),factionIds=FACTIONS.map(f=>f.id),guildIds=GUILDS.map(g=>g.id),numeric=x=>Number.isFinite(x)&&x>=0&&x<=1e12;
export function newSave(){return {...migrate(v1Save()),systemScans:[]};}
function migrate(s){const modules=UPGRADES.filter(u=>s.upgrades[u.id]).map((u,i)=>({uid:'m-'+(i+1),kind:u.id,grade:s.upgrades[u.id]}));return{...s,version:2,systemScans:[...s.visited],heat:25,explorationLog:s.data?[{id:'legacy-cache',type:'legacy',system:s.system,name:'Recovered exploration cache',value:s.data,sold:false}]:[],upgrades:Object.fromEntries(UPGRADES.map(u=>[u.id,0])),fleet:[s.ship],modules,nextModule:modules.length+1,loadouts:Object.fromEntries(shipIds.map(id=>[id,id===s.ship?modules.map(m=>m.uid):[]])),hangar:{},guilds:Object.fromEntries(guildIds.map(id=>[id,{joined:false,stage:0,active:false,baseline:0}])),reputation:Object.fromEntries(factionIds.map(id=>[id,0])),allegiance:null,records:[],surfaceScanned:[],surface:null,cleared:{},route:null,operations:[],nextOperation:1,engineVolume:.35,metrics:{discoveries:s.visited.filter(i=>SYSTEMS[i].uncharted).length,anomalies:0,geology:0,deliveries:s.completed.filter(id=>id.endsWith('-0')).length,operations:0,pirates:s.kills,factionKills:Object.fromEntries(factionIds.map(id=>[id,0]))}};}
export function validateSave(x){
 if(!x||![1,2].includes(x.version))return null;const base=v1Validate({...x,version:1});if(!base)return null;if(x.version===1)return migrate(base);
 try{const s=migrate(base);
  if(x.systemScans!==undefined){if(!Array.isArray(x.systemScans)||x.systemScans.length>SYSTEMS.length||x.systemScans.some(id=>!Number.isInteger(id)||!SYSTEMS[id]||!s.visited.includes(id)))return null;s.systemScans=[...new Set(x.systemScans)];}
  if(x.heat!==undefined){if(!Number.isFinite(x.heat)||x.heat<0||x.heat>150)return null;s.heat=x.heat;}
  if(x.explorationLog!==undefined){
   if(!Array.isArray(x.explorationLog)||x.explorationLog.length>4096||x.explorationLog.some(e=>!e||typeof e.id!=='string'||e.id.length>80||!['system','world','surface','legacy'].includes(e.type)||!Number.isInteger(e.system)||!SYSTEMS[e.system]||typeof e.name!=='string'||!e.name.length||e.name.length>100||!numeric(e.value)||e.value>100000||typeof e.sold!=='boolean'))return null;
   if(new Set(x.explorationLog.map(e=>e.id)).size!==x.explorationLog.length)return null;
   s.explorationLog=x.explorationLog.map(e=>({id:e.id,type:e.type,system:e.system,name:e.name,value:e.value,sold:e.sold}));
  }
  if(!Array.isArray(x.fleet)||!x.fleet.includes(s.ship)||x.fleet.some(id=>!shipIds.includes(id)))return null;s.fleet=[...new Set(x.fleet)];
  if(!Array.isArray(x.modules)||x.modules.length>100||x.modules.some(m=>!m||!/^m-\d+$/.test(m.uid)||!Object.hasOwn(MODULES,m.kind)||!Number.isInteger(m.grade)||m.grade<1||m.grade>(MODULES[m.kind].standard?3:1)))return null;s.modules=x.modules.map(m=>({uid:m.uid,kind:m.kind,grade:m.grade}));const ids=new Set(s.modules.map(m=>m.uid));if(ids.size!==s.modules.length)return null;const used=new Set();
  for(const id of shipIds){const a=x.loadouts?.[id];if(!Array.isArray(a)||a.length>moduleSlots(id)||(!s.fleet.includes(id)&&a.length))return null;const cat=new Set();for(const uid of a){if(!ids.has(uid)||used.has(uid))return null;const c=MODULES[s.modules.find(m=>m.uid===uid).kind].category;if(cat.has(c))return null;cat.add(c);used.add(uid);}s.loadouts[id]=[...a];}
  for(const id of factionIds){if(!Number.isFinite(x.reputation?.[id])||Math.abs(x.reputation[id])>100)return null;s.reputation[id]=x.reputation[id];}
  for(const id of guildIds){const g=x.guilds?.[id];if(!g||(!g.joined&&g.active)||!Number.isInteger(g.stage)||g.stage<0||g.stage>3||!numeric(g.baseline))return null;s.guilds[id]={joined:!!g.joined,stage:g.stage,active:!!g.active&&g.stage<3,baseline:g.baseline};}
  for(const [id,h]of Object.entries(x.hangar||{})){if(!shipIds.includes(id)||!h||!['hull','shield','fuel'].every(k=>numeric(h[k])))return null;s.hangar[id]={hull:h.hull,shield:h.shield,fuel:h.fuel};}
  const validId=id=>typeof id==='string'&&/^planet-\d+-[01]-a[0-5]$/.test(id)&&!!SYSTEMS[Number(id.split('-')[1])];
  if(!Array.isArray(x.surfaceScanned)||x.surfaceScanned.length>2304||x.surfaceScanned.some(id=>!validId(id)))return null;s.surfaceScanned=[...new Set(x.surfaceScanned)];
  if(!Array.isArray(x.records)||x.records.length>2304||x.records.some(r=>!r||!validId(r.id)||!numeric(r.value)||r.value>100000||!['geology','relic','biosignature','signal'].includes(r.kind)||!s.surfaceScanned.includes(r.id)))return null;s.records=x.records.map(r=>({id:r.id,kind:r.kind,value:r.value,system:Number(r.id.split('-')[1])}));if(new Set(s.records.map(r=>r.id)).size!==s.records.length)return null;
  for(const k of ['discoveries','anomalies','geology','deliveries','operations','pirates']){if(!numeric(x.metrics?.[k]))return null;s.metrics[k]=x.metrics[k];}for(const id of factionIds){if(!numeric(x.metrics?.factionKills?.[id]))return null;s.metrics.factionKills[id]=x.metrics.factionKills[id];}
  if(!Array.isArray(x.operations)||x.operations.length>3||x.operations.some(o=>!o||!/^op-\d+$/.test(o.uid)||!factionIds.includes(o.faction)||!['relief','combat'].includes(o.type)||!Number.isInteger(o.target)||!SYSTEMS[o.target]||!Number.isInteger(o.kills)||o.kills<0||o.kills>2))return null;s.operations=x.operations.map(o=>({uid:o.uid,faction:o.faction,type:o.type,target:o.target,kills:o.kills}));if(new Set(s.operations.map(o=>o.uid)).size!==s.operations.length||new Set(s.operations.map(o=>o.faction+o.type)).size!==s.operations.length)return null;
  for(const [id,list]of Object.entries(x.cleared||{})){if(!/^\d+$/.test(id)||!SYSTEMS[+id]||!Array.isArray(list)||list.length>500||list.some(v=>typeof v!=='string'||!/^(rock|pirate|patrol|op)-[a-z0-9-]+$/.test(v)))return null;s.cleared[id]=[...new Set(list)];}
  s.allegiance=factionIds.includes(x.allegiance)?x.allegiance:null;s.engineVolume=clamp(Number(x.engineVolume)||0,0,1);s.nextModule=Math.max(1,...s.modules.map(m=>+m.uid.slice(2)+1));s.nextOperation=Math.max(1,Number.isInteger(x.nextOperation)?x.nextOperation:1,...s.operations.map(o=>+o.uid.slice(3)+1));
  const st=getStats(s);s.hull=clamp(x.hull,1,st.hull);s.shield=clamp(x.shield,0,st.shield);s.fuel=clamp(x.fuel,0,st.fuel);if(cargoUsed(s)>st.cargo)return null;
  if(x.surface){const a=x.surface;if(!new RegExp('^planet-'+s.system+'-[01]$').test(a.planetId)||!['x','y','integrity'].every(k=>Number.isFinite(a[k])))return null;s.surface={planetId:a.planetId,x:clamp(a.x,40,5960),y:clamp(a.y,55,850),integrity:clamp(a.integrity,1,100),recordStart:Number.isInteger(a.recordStart)?clamp(a.recordStart,0,s.records.length):s.records.length};s.docked=false;}
  if(x.route&&Number.isInteger(x.route.destination)&&SYSTEMS[x.route.destination])s.route={destination:x.route.destination,path:findRoute(s.system,x.route.destination,st.range)||[]};return s;
 }catch{return null;}
}
export function systemName(sys,s){return sys.uncharted&&!s.visited.includes(sys.id)?'Uncharted '+sys.catalog:sys.name;}
export function findRoute(from,to,range){if(!SYSTEMS[from]||!SYSTEMS[to]||!Number.isFinite(range)||range<=0)return null;if(from===to)return[];const costs=SYSTEMS.map(()=>Infinity),previous=SYSTEMS.map(()=>-1),seen=new Set();costs[from]=0;for(let n=0;n<SYSTEMS.length;n++){let current=-1;for(let i=0;i<costs.length;i++)if(!seen.has(i)&&(current<0||costs[i]<costs[current]))current=i;if(current<0||!Number.isFinite(costs[current])||current===to)break;seen.add(current);for(const sys of SYSTEMS){if(seen.has(sys.id)||sys.id===current)continue;const d=jumpDistance(current,sys.id),c=costs[current]+1+d*.0001;if(d<=range&&c<costs[sys.id]){costs[sys.id]=c;previous[sys.id]=current;}}}if(previous[to]<0)return null;let cur=to;const path=[];while(cur!==from){path.unshift(cur);cur=previous[cur];if(cur<0)return null;}return path;}
export function missionDestination(s,m){return m.type==='delivery'?m.destination:m.type==='survey'&&![0,1].every(n=>s.scanned.includes(`planet-${m.destination}-${n}`))?m.destination:m.origin;}
const metric=(s,key)=>key==='surveys'?s.scanned.length:key==='sales'?s.trade:key==='mined'?s.mined:key==='contracts'?s.contracts:s.metrics[key]||0;
export function guildProgress(s,id){const state=s.guilds[id],q=GUILDS.find(g=>g.id===id).quests[state.stage];if(!q)return{done:true,ready:false};const n=q.good?s.cargo[q.good]:Math.max(0,metric(s,q.metric)-state.baseline);return{done:false,quest:q,current:Math.min(n,q.count),total:q.count,ready:state.active&&n>=q.count};}
export function operationDetails(s,o){const f=FACTIONS.find(f=>f.id===o.faction),sup=o.faction==='directorate'?{good:'ore',count:6}:o.faction==='freeholds'?{good:'food',count:8}:{good:'meds',count:4};return o.type==='relief'?{title:'Frontier relief',desc:`Bring ${sup.count} t of ${GOODS.find(g=>g.id===sup.good).name} to any ${f.name} station.`,...sup,current:s.cargo[sup.good],total:sup.count,reward:1400,ready:s.cargo[sup.good]>=sup.count&&SYSTEMS[s.system].faction===o.faction}:{title:'Disputed shipping lanes',desc:`Defeat 2 ${FACTIONS.find(g=>g.id===f.rival).name} ships in ${SYSTEMS[o.target].name}, then report at a ${f.name} station.`,current:o.kills,total:2,reward:2400,ready:o.kills>=2&&SYSTEMS[s.system].faction===o.faction};}
export class Game extends FlightGame{
 constructor(save=newSave()){super(save.version===1?migrate(save):save);this.surface=null;this.scooping=false;this.discoveryScan=null;this.s.heat??=25;this.s.systemScans??=[...this.s.visited];this.s.explorationLog??=[];this.surfaceRecordsStart=this.s.records.length;if(this.s.surface){const p=this.planets.find(p=>p.id===this.s.surface.planetId);if(p){this.surface=createSurface(p,this.s.surfaceScanned,this.s.surface);this.surfaceRecordsStart=this.s.surface.recordStart;}}}
 nearestPort(){return SYSTEMS.filter(s=>s.hasStation).sort((a,b)=>jumpDistance(this.s.system,a.id)-jumpDistance(this.s.system,b.id))[0].id;}
 makeSystem(){if(this.s.docked&&!SYSTEMS[this.s.system].hasStation)this.s.system=this.nearestPort();super.makeSystem();const cleared=this.s.cleared?.[this.s.system]||[];this.asteroids=this.asteroids.filter(a=>!cleared.includes(a.id));this.enemies=this.enemies.filter(a=>!cleared.includes(a.id));this.star={id:'star',name:this.sys.name+' primary',type:'star',x:-900,y:-1600,r:190};this.scooping=false;this.scoopRate=0;this.discoveryScan=null;this.traffic=this.makeTraffic();this.patrols=[];if(!this.sys.hasStation){this.station.type='beacon';this.target=this.star;this.traffic=[];}if(this.sys.faction){const f=FACTIONS.find(f=>f.id===this.sys.faction);for(let i=0;i<2;i++){const p={id:'patrol-'+f.id+'-'+i,name:f.name+' patrol',type:'faction',faction:f.id,x:850+i*180,y:400+i*250,angle:1,hp:105,max:105,r:20,fire:1,bounty:240};if(cleared.includes(p.id))continue;if((this.s.reputation?.[f.id]||0)<=-20){p.type='enemy';this.enemies.push(p);}else this.patrols.push(p);}}this.spawnOperations();}
 makeTraffic(){
  if(!this.sys.hasStation)return[];
  const station={x:this.station.x,y:this.station.y},jump={x:this.star.x+this.star.r+950,y:this.star.y},scoop={x:this.star.x+this.star.r+430,y:this.star.y},mine={x:this.belt.x,y:this.belt.y},world=this.planets[0];
  const jobs=[
   {name:'Inbound courier',job:'ARRIVING FROM JUMP POINT',points:[jump,station],speed:135,wait:2},
   {name:'Outbound freighter',job:'DEPARTING FOR JUMP POINT',points:[station,jump],speed:105,wait:2},
   {name:'Prospector',job:'MINING RUN',points:[station,mine],speed:90,wait:7},
   {name:'Scoop tender',job:'FUEL SCOOPING',points:[station,scoop],speed:115,wait:6},
   {name:'Survey vessel',job:'PLANETARY SURVEY',points:[station,{x:world.x,y:world.y+world.r+280}],speed:125,wait:5}
  ];
  return jobs.map((j,i)=>{const start=j.points[0],next=j.points[1];return{...j,id:'traffic-'+i,type:'traffic',x:start.x+i*18,y:start.y+i*12,angle:Math.atan2(next.y-start.y,next.x-start.x),r:12,target:1,pause:i*.7,thrust:0,status:'TRANSIT'};});
 }
 updateTraffic(dt){
  for(const ship of this.traffic){
   if(ship.pause>0){ship.pause-=dt;ship.thrust=0;ship.status=ship.target===0?ship.job:'DOCKED';continue;}
   const target=ship.points[ship.target],dx=target.x-ship.x,dy=target.y-ship.y,d=Math.hypot(dx,dy);
   if(d<18){ship.x=target.x;ship.y=target.y;ship.pause=ship.target===0?2:ship.wait;ship.status=ship.target===0?'DOCKED':ship.job;ship.target=ship.target?0:1;ship.thrust=0;continue;}
   ship.angle=Math.atan2(dy,dx);const speed=Math.min(ship.speed,Math.max(24,d*.55));ship.x+=Math.cos(ship.angle)*speed*dt;ship.y+=Math.sin(ship.angle)*speed*dt;ship.thrust=Math.min(1,speed/ship.speed);ship.status='IN TRANSIT';
  }
 }
 logExploration(entry){if(!this.s.explorationLog.some(e=>e.id===entry.id))this.s.explorationLog.push({...entry,sold:false});}
 sellExplorationData(){
  if(!this.s.docked)return false;const signals=this.s.records.reduce((sum,r)=>sum+r.value,0),total=this.s.data+signals;
  if(!total){this.notify('No unsold exploration data aboard.');return false;}
  this.s.credits+=total;this.s.data=0;this.s.records=[];for(const entry of this.s.explorationLog)if(!entry.sold)entry.sold=true;
  this.notify('Exploration data sold · +'+total.toLocaleString()+' cr','good');return true;
 }
 spawnOperations(){for(const op of this.s.operations||[]){if(op.type!=='combat'||op.target!==this.s.system||op.kills>=2)continue;const f=FACTIONS.find(f=>f.id===op.faction).rival,c=this.s.cleared[this.s.system]||[];for(let i=0;i<2;i++){const id=op.uid+'-'+i;if(c.includes(id)||this.enemies.some(e=>e.id===id))continue;this.enemies.push({id,type:'enemy',name:FACTIONS.find(fac=>fac.id===f).name+' interceptor',faction:f,x:600+i*300,y:1850+i*140,angle:0,hp:110,max:110,r:21,fire:1,bounty:300});}}}
 serialize(){return{...super.serialize(),surface:this.surface?{planetId:this.surface.planetId,x:this.surface.x,y:this.surface.y,integrity:this.surface.integrity,recordStart:this.surfaceRecordsStart}:null};}
 select(id){if(id.startsWith('planet-')&&!this.visiblePlanets.some(p=>p.id===id))return null;if(id==='star'){this.target=this.star;this.auto=null;return this.star;}const p=this.patrols.find(p=>p.id===id);if(p){this.target=p;this.auto=null;return p;}return super.select(id);}
 setRoute(destination){const path=findRoute(this.s.system,destination,getStats(this.s).range);if(!path){this.notify('No route within your drive range.');return false;}this.s.route={destination,path};this.notify(path.length?`Route plotted · ${path.length} jumps to ${systemName(SYSTEMS[destination],this.s)}`:'Destination is in this system.','good');return true;}
 routeContract(id){const m=this.s.missions.find(m=>m.id===id);if(!m)return false;const to=missionDestination(this.s,m);if(!this.setRoute(to))return false;if(to===this.s.system)this.target=m.type==='survey'?this.visiblePlanets.find(p=>!this.s.scanned.includes(p.id))||this.star:m.type==='mining'&&this.s.cargo.ore<m.tons||m.type==='bounty'&&this.s.metrics.pirates-m.startKills<2?this.belt:this.station;return true;}
 refreshRoute(){if(this.s.route)this.s.route.path=findRoute(this.s.system,this.s.route.destination,getStats(this.s).range)||[];}
 jumpNext(){if(!this.s.route)return false;const path=findRoute(this.s.system,this.s.route.destination,getStats(this.s).range);if(!path?.length){this.notify('Route complete.');return false;}this.s.route.path=path;return this.jumpTo(path[0]);}
 jumpTo(id){if(this.surface){this.notify('Return to orbit before jumping.');return false;}const ok=super.jumpTo(id);if(ok){this.scooping=false;this.discoveryScan=null;}return ok;}
 dock(){if(this.jump){this.notify('Wait for the fold jump to finish.');return false;}if(this.surface){this.notify('Return to orbit first.');return false;}if(!this.sys.hasStation){this.notify('No station here. Scoop fuel at the star, or plot a route to a relay.');return false;}if(!this.s.docked&&dist(this.player,this.station)>200){this.target=this.station;this.auto=this.station;this.notify('Autopilot set for the station.');return false;}const pending=this.s.data;this.s.data=0;const ok=super.dock();this.s.data=pending;if(ok){this.scooping=false;this.scoopRate=0;this.discoveryScan=null;this.s.heat=25;this.notify(pending||this.s.records.length?'Exploration data ready for review at Cartographics.':'No exploration data aboard.');}return ok;}
 get visiblePlanets(){return this.planets.filter(p=>!this.sys.uncharted||this.s.systemScans?.includes(this.s.system)||this.s.scanned.includes(p.id));}
 discover(){
  if(this.s.docked||this.surface||this.jump){this.notify('Launch into local space to use the discovery scanner.');return false;}
  if(this.discoveryScan||this.scan){this.notify('Scanner already active.');return false;}
  if(this.s.systemScans.includes(this.s.system)){this.notify('System catalog complete. Approach a world for a detailed survey.');return false;}
  this.discoveryScan={progress:0};this.notify('Discovery pulse charging.');return true;
 }
 scanTarget(){if(this.surface)return this.scanSurface();if(this.discoveryScan||this.jump)return false;if(!this.visiblePlanets.length)return this.discover();if(!this.visiblePlanets.includes(this.target))this.target=this.visiblePlanets.reduce((a,b)=>dist(this.player,a)<dist(this.player,b)?a:b);return super.scanTarget();}

 land(){if(this.s.docked||this.jump)return false;if(!this.visiblePlanets.length){this.notify('Run a discovery scan to locate worlds first.');return false;}const p=this.visiblePlanets.includes(this.target)?this.target:this.visiblePlanets[0];this.target=p;if(dist(this.player,p)>p.r+450){this.auto=p;this.notify('Approaching landing range. Tap LAND when you arrive.');return false;}if(Math.hypot(this.player.vx,this.player.vy)>100){this.notify('Slow below 100 m/s for atmospheric entry.');return false;}this.auto=null;this.scan=null;this.discoveryScan=null;this.scooping=false;this.shots=[];this.surface=createSurface(p,this.s.surfaceScanned);this.surfaceRecordsStart=this.s.records.length;this.player.vx=this.player.vy=0;this.notify('Surface flight engaged. Find signals and hover to scan.','good');return true;}
 takeoff(){if(!this.surface)return false;const p=this.planets.find(p=>p.id===this.surface.planetId);this.surface=null;this.s.surface=null;this.player.x=p.x;this.player.y=p.y+p.r+360;this.player.vx=this.player.vy=0;this.target=p;this.notify('Back in orbit. Dock to sell anomaly signals.');return true;}
 scanSurface(){const s=this.surface;if(!s)return false;const a=nearestAnomaly(s);if(!a){this.notify('All anomalies here are recorded. Return to orbit.');return false;}if(Math.hypot(a.x-s.x,a.y-s.y)>230+getStats(this.s).surfaceRange){this.notify('Approach a signal to scan it.');return false;}if(Math.hypot(s.vx,s.vy)>85){this.notify('Release the stick and hover to scan.');return false;}if(s.scan)return false;s.scan={id:a.id,progress:0};this.notify('Scanning '+a.name.toLowerCase()+'.');return true;}
 scoop(){
  if(this.scooping){this.scooping=false;this.scoopRate=0;this.notify('Fuel scoop retracted.');return true;}
  if(this.surface||this.s.docked||this.jump)return false;
  this.target=this.star;
  if(this.s.fuel>=getStats(this.s).fuel){this.notify('Fuel tank is full.');return false;}
  if(dist(this.player,this.star)>this.star.r+600){this.auto=this.star;this.notify('Approaching the star. Tap SCOOP when you arrive.');return false;}
  if(this.s.heat>=90){this.notify('Too hot to deploy the scoop. Move away to cool below 90%.');return false;}
  if(Math.hypot(this.player.vx,this.player.vy)>100){this.notify('Slow below 100 m/s to scoop fuel.');return false;}
  this.auto=null;this.scooping=true;this.notify('Fuel scoop deployed. Watch heat and hold position.');return true;
 }
 updateStellar(dt){
  const p=this.player,d=dist(p,this.star),altitude=d-this.star.r;
  if(this.scooping&&(altitude>650||Math.hypot(p.vx,p.vy)>100)){this.scooping=false;this.notify('Scoop retracted. Stay in range and below 100 m/s.');}
  const equilibrium=25+125*Math.pow(clamp((850-altitude)/850,0,1),2)+(this.scooping?8:0);
  const before=this.s.heat;this.s.heat=clamp(before+(equilibrium-before)*(1-Math.exp(-dt*.18)),0,150);
  if(before<80&&this.s.heat>=80)this.notify('Heat warning. Move away from the star to cool.','bad');
  if(this.scooping&&this.s.heat>=95){this.scooping=false;this.notify('Scoop emergency retraction: critical heat. Move away!','bad');}
  if(this.s.heat>100){this.s.hull-=dt*(this.s.heat-100)*.35;this.lastDamage=this.time;}
  // Exclusion zone prevents flying through the stellar surface.
  if(d<this.star.r+60){const a=Math.atan2(p.y-this.star.y,p.x-this.star.x);p.x=this.star.x+Math.cos(a)*(this.star.r+60);p.y=this.star.y+Math.sin(a)*(this.star.r+60);p.vx=p.vy=0;}
  this.scoopRate=this.scooping?4+12*clamp((650-altitude)/500,0,1):0;
  if(this.scooping){this.s.fuel=Math.min(getStats(this.s).fuel,this.s.fuel+this.scoopRate*dt);if(this.s.fuel>=getStats(this.s).fuel){this.scooping=false;this.scoopRate=0;this.notify('Fuel tank full. Scoop retracted.','good');}}
 }

 claimMissions(){const done=this.s.missions.filter(m=>this.missionReady(m));super.claimMissions();if(this.s.docked)for(const m of done)if(m.type==='delivery')this.s.metrics.deliveries++;}
 buyShip(id){if(!this.s.docked||id===this.s.ship)return false;const b=SHIPS.find(b=>b.id===id);if(!b)return false;const owned=this.s.fleet.includes(id),cost=owned?0:b.price,st=getStats({...this.s,ship:id});if(this.s.credits<cost){this.notify('Insufficient credits.');return false;}if(cargoUsed(this.s)>st.cargo){this.notify('This ship cannot hold your cargo. Sell enough cargo to switch ships.');return false;}this.s.hangar[this.s.ship]={hull:this.s.hull,shield:this.s.shield,fuel:this.s.fuel};this.s.credits-=cost;this.s.ship=id;if(!owned)this.s.fleet.push(id);const h=this.s.hangar[id]||st;this.s.hull=clamp(h.hull,1,st.hull);this.s.shield=st.shield;this.s.fuel=clamp(h.fuel,0,st.fuel);this.refreshRoute();this.notify((owned?'Switched to ':'Purchased ')+b.name+'. Other ships remain in your hangar.','good');return true;}
 upgrade(kind){if(!this.s.docked||!MODULES[kind]?.standard)return false;const active=this.s.loadouts[this.s.ship],m=this.s.modules.find(m=>m.kind===kind&&active.includes(m.uid)),grade=m?.grade||0,cost=MODULES[kind].price*(grade+1);if(grade>=3||this.s.credits<cost)return false;if(!m&&this.s.modules.length>=85){this.notify('Module storage is full. Upgrade an existing module.');return false;}if(!m&&active.length>=moduleSlots(this.s.ship)){this.notify('Remove a module to free a slot.');return false;}this.s.credits-=cost;if(m)m.grade++;else{const item={uid:'m-'+this.s.nextModule++,kind,grade:1};this.s.modules.push(item);active.push(item.uid);}this.s.shield=getStats(this.s).shield;this.refreshRoute();this.notify(MODULES[kind].name+' fitted.','good');return true;}
 moduleLocation(uid){return shipIds.find(id=>this.s.loadouts[id].includes(uid))||null;}
 equip(uid){if(!this.s.docked)return false;const item=this.s.modules.find(m=>m.uid===uid);if(!item)return false;const a=this.s.loadouts[this.s.ship],source=this.moduleLocation(uid);if(source===this.s.ship)return false;if(a.length>=moduleSlots(this.s.ship)){this.notify('Remove a module to free a slot.');return false;}if(a.some(id=>MODULES[this.s.modules.find(m=>m.uid===id).kind].category===MODULES[item.kind].category)){this.notify('Remove the installed module in this category first.');return false;}if(source)this.s.loadouts[source]=this.s.loadouts[source].filter(id=>id!==uid);a.push(uid);this.s.shield=getStats(this.s).shield;this.refreshRoute();this.notify(MODULES[item.kind].name+' installed.','good');return true;}
 unequip(uid){if(!this.s.docked)return false;const src=this.moduleLocation(uid);if(!src)return false;const old=this.s.loadouts[src];this.s.loadouts[src]=old.filter(id=>id!==uid);if(cargoUsed(this.s)>getStats(this.s).cargo){this.s.loadouts[src]=old;this.notify('Sell cargo before removing this cargo module.');return false;}const st=getStats(this.s);this.s.hull=Math.min(this.s.hull,st.hull);this.s.shield=Math.min(this.s.shield,st.shield);this.s.fuel=Math.min(this.s.fuel,st.fuel);this.refreshRoute();this.notify('Module moved to storage.');return true;}
 joinGuild(id){if(!this.s.docked||!guildIds.includes(id))return false;this.s.guilds[id].joined=true;this.notify('Guild membership confirmed.','good');return true;}
 acceptGuild(id){const state=this.s.guilds[id],guild=GUILDS.find(g=>g.id===id);if(!this.s.docked||!state?.joined||state.active||state.stage>=3)return false;const q=guild.quests[state.stage];state.active=true;state.baseline=q.metric?metric(this.s,q.metric):0;this.notify('Commission accepted: '+q.name,'good');return true;}
 claimGuild(id){if(!this.s.docked||!guildIds.includes(id))return false;const p=guildProgress(this.s,id);if(!p.ready)return false;const q=p.quest;if(q.good)this.s.cargo[q.good]-=q.count;this.s.credits+=q.credits;this.s.modules.push({uid:'m-'+this.s.nextModule++,kind:q.reward,grade:1});this.s.guilds[id].stage++;this.s.guilds[id].active=false;this.notify('Reward: '+MODULES[q.reward].name+'. Fit it in Modules.','good');return true;}
 pledge(id){if(!factionIds.includes(id)&&id!==null)return false;this.s.allegiance=id;this.notify(id?'Supporting '+FACTIONS.find(f=>f.id===id).name+'.':'Flying independently.');return true;}
 acceptOperation(faction,type){if(!this.s.docked||!factionIds.includes(faction)||!['relief','combat'].includes(type)||this.s.operations.length>=3||this.s.operations.some(o=>o.faction===faction&&o.type===type))return false;const f=FACTIONS.find(f=>f.id===faction),target=SYSTEMS.filter(s=>s.faction===(type==='combat'?f.rival:faction)&&s.hasStation).sort((a,b)=>jumpDistance(this.s.system,a.id)-jumpDistance(this.s.system,b.id))[0];this.s.operations.push({uid:'op-'+this.s.nextOperation++,faction,type,target:target.id,kills:0});this.spawnOperations();this.notify('Faction operation accepted.','good');return true;}
 claimOperation(uid){const o=this.s.operations.find(o=>o.uid===uid);if(!this.s.docked||!o)return false;const d=operationDetails(this.s,o);if(!d.ready)return false;if(d.good)this.s.cargo[d.good]-=d.count;this.s.credits+=d.reward;this.s.reputation[o.faction]=clamp(this.s.reputation[o.faction]+15,-100,100);this.s.metrics.operations++;this.s.operations=this.s.operations.filter(op=>op.uid!==uid);this.notify('Operation complete · reputation +15 · '+d.reward+' cr','good');return true;}
 engageFaction(p){if(!p||p.type!=='faction')return false;this.patrols=this.patrols.filter(e=>e.id!==p.id);p.type='enemy';this.enemies.push(p);this.s.reputation[p.faction]=clamp(this.s.reputation[p.faction]-12,-100,100);this.notify('Weapons engaged against '+FACTIONS.find(f=>f.id===p.faction).name+'.','bad');return true;}
 shoot(){if(this.target?.type==='faction')this.engageFaction(this.target);super.shoot();}
 onDestroyed(t){this.s.cleared[this.s.system]??=[];if(!this.s.cleared[this.s.system].includes(t.id))this.s.cleared[this.s.system].push(t.id);if(t.type!=='enemy')return;if(t.faction){this.s.metrics.factionKills[t.faction]++;this.s.reputation[t.faction]=clamp(this.s.reputation[t.faction]-10,-100,100);for(const o of this.s.operations)if(o.type==='combat'&&o.target===this.s.system&&FACTIONS.find(f=>f.id===o.faction).rival===t.faction)o.kills=Math.min(2,o.kills+1);}else{this.s.metrics.pirates++;if(this.s.allegiance)this.s.reputation[this.s.allegiance]=clamp(this.s.reputation[this.s.allegiance]+2,-100,100);}}
 rescue(){this.surface=null;this.s.surface=null;this.s.records=[];this.s.explorationLog=this.s.explorationLog.filter(e=>e.sold);this.s.system=this.nearestPort();this.s.route=null;super.rescue();this.s.heat=25;}
 update(dt,input={}){
  dt=clamp(dt,0,.05);
  if(this.surface){this.time+=dt;this.s.playtime+=dt;const wasScan=!!this.surface.scan,result=updateSurface(this.surface,dt,input,getStats(this.s));if(result.completed){const a=result.completed;if(!this.s.surfaceScanned.includes(a.id)){this.s.surfaceScanned.push(a.id);const value=Math.round(a.value*getStats(this.s).signalMultiplier);this.s.records.push({id:a.id,kind:a.kind,value,system:this.s.system});this.logExploration({id:a.id,type:'surface',system:this.s.system,name:this.surface.planetName+' · '+a.name,value});this.s.metrics.anomalies++;if(a.kind==='geology')this.s.metrics.geology++;this.notify(a.name+' recorded. Sell the signal at a station.','good');}}else if(wasScan&&!this.surface.scan)this.notify('Scan interrupted. Hover within range.');if(result.crashed){const lost=new Set(this.s.records.slice(this.surfaceRecordsStart).map(r=>r.id));this.s.records.splice(this.surfaceRecordsStart);this.s.explorationLog=this.s.explorationLog.filter(e=>!lost.has(e.id));this.s.hull=Math.max(1,this.s.hull-20);this.takeoff();this.notify('Emergency ascent. This expedition’s signals were lost; hull damaged.','bad');}return;}
  const previous=this.s.system,wasDocked=this.s.docked,wasJumping=!!this.jump,beforeScanned=new Set(this.s.scanned),beforeData=this.s.data;super.update(dt,input);if(!wasDocked&&this.s.docked){this.s.records=[];this.s.explorationLog=this.s.explorationLog.filter(e=>e.sold);}const added=this.s.scanned.find(id=>!beforeScanned.has(id));if(added){const planet=this.planets.find(p=>p.id===added),value=this.s.data-beforeData;this.logExploration({id:added,type:'world',system:this.s.system,name:planet?.name||added,value});}
  if(previous!==this.s.system){
   this.refreshRoute();
   if(wasJumping&&!this.s.docked){this.player.x=this.star.x+this.star.r+950;this.player.y=this.star.y;this.player.angle=0;this.player.vx=this.player.vy=0;this.target=this.star;this.notify('Arrived near the primary star. Run a discovery scan to catalog this system.');}
  }
  if(this.s.docked){this.s.heat=25;this.discoveryScan=null;this.scooping=false;this.scoopRate=0;return;}
  if(this.jump){this.scooping=false;this.scoopRate=0;return;}
  this.updateStellar(dt);
  this.updateTraffic(dt);
  if(this.s.hull<=0){super.update(0,{});this.s.records=[];this.s.explorationLog=this.s.explorationLog.filter(e=>e.sold);this.s.heat=25;return;}
  if(this.discoveryScan){
   this.discoveryScan.progress+=dt*(1+getStats(this.s).scanSpeed);
   if(this.discoveryScan.progress>=4){
    this.discoveryScan=null;
    if(!this.s.systemScans.includes(this.s.system)){this.s.systemScans.push(this.s.system);const value=Math.round((this.sys.uncharted?500:150)*getStats(this.s).dataMultiplier);this.s.data+=value;this.logExploration({id:'system-'+this.s.system,type:'system',system:this.s.system,name:this.sys.name+' system catalog',value});if(this.sys.uncharted)this.s.metrics.discoveries++;this.notify(`System cataloged · 1 star · ${this.planets.length} worlds · +${value} cr data. Select Worlds to survey.`,'good');}
   }
  }
  for(const p of [...this.patrols]){if(this.s.reputation[p.faction]<=-20){p.type='enemy';this.enemies.push(p);this.patrols=this.patrols.filter(q=>q!==p);continue;}p.thrust=.25;p.angle+=dt*.15;p.x+=Math.cos(p.angle)*30*dt;p.y+=Math.sin(p.angle)*30*dt;if(p.faction===this.s.allegiance){const e=this.enemies.find(e=>dist(p,e)<620);p.fire-=dt;if(e&&p.fire<0){p.fire=1.4;const a=Math.atan2(e.y-p.y,e.x-p.x);this.shots.push({x:p.x,y:p.y,vx:Math.cos(a)*600,vy:Math.sin(a)*600,damage:9,enemy:false,ally:true,life:1.2});}}}
 }
}

import {moduleBonuses,expandGalaxy,MODULES} from './catalog.mjs';
import {buildSystemLayout,surveyWorldIds} from './system-layout.mjs';
export const VERSION = 1;
export const GOODS = [
 {id:'food',name:'Food cultures',base:70,color:'#a6dba2',desc:'Grown on garden worlds. Needed by refineries.'},
 {id:'ore',name:'Titanium ore',base:145,color:'#d5b698',desc:'Mine it in asteroid fields. Industrial worlds pay well.'},
 {id:'tech',name:'Microprocessors',base:340,color:'#9fcafc',desc:'Made in high-tech systems. Scarce on the frontier.'},
 {id:'meds',name:'Med supplies',base:220,color:'#d8b1ed',desc:'Medical supplies for remote colonies.'},
 {id:'crystal',name:'Void crystals',base:480,color:'#6de7da',desc:'Rare asteroid finds sought by researchers.'}
];
export const ECONOMIES = {
 Agricultural:[.6,1.12,1.4,.9,1.05], Extraction:[1.42,.62,1.26,1.3,.72],
 Industrial:[1.15,1.45,.84,1.04,1.22], Research:[1.18,.95,.62,.72,1.52], Frontier:[1.38,1.12,1.48,1.46,1.1]
};
export const SHIPS = [
 {id:'wren',name:'Wren',class:'explorer',role:'Light explorer',price:0,hull:100,shield:80,cargo:18,fuel:100,range:14,speed:235,turn:3.5,damage:18,slots:6,size:18,radius:16,color:'#b7f0e4',accent:'#7ad9c8',desc:'Light on the stick. A little ship with a long horizon.'},
 {id:'sparrow',name:'Sparrow',class:'scout',role:'Fleet scout',price:4200,hull:85,shield:70,cargo:12,fuel:90,range:13,speed:270,turn:4.2,damage:16,slots:5,size:16,radius:14,color:'#c8e8a8',accent:'#9bc978',desc:'A dart for short hops. Tiny hold, eager engines.'},
 {id:'rook',name:'Rook',class:'miner',role:'Prospecting cutter',price:6800,hull:140,shield:90,cargo:28,fuel:120,range:14,speed:200,turn:3.0,damage:22,miningDamage:10,slots:6,size:20,radius:18,color:'#d4b896',accent:'#b8956a',desc:'First claim on the rocks. Tough enough for belt work.'},
 {id:'mule',name:'Mule',class:'trader',role:'Freight hauler',price:9500,hull:185,shield:105,cargo:48,fuel:140,range:16,speed:190,turn:2.9,damage:21,slots:7,size:26,radius:22,color:'#e0c79a',accent:'#c4a574',desc:'A broad hold and a forgiving hull. Built to make a living.'},
 {id:'tern',name:'Tern',class:'courier',role:'Express courier',price:11200,hull:110,shield:95,cargo:26,fuel:130,range:17,speed:275,turn:4.0,damage:18,slots:6,size:18,radius:16,color:'#a8e0f0',accent:'#6ebfd4',desc:'Contracts that cannot wait. Fast legs, honest hold.'},
 {id:'magpie',name:'Magpie',class:'trader',role:'Market runner',price:14500,hull:145,shield:110,cargo:38,fuel:135,range:16,speed:245,turn:3.4,damage:20,slots:7,size:21,radius:19,color:'#e8c4d4',accent:'#c992ad',desc:'Shiny margins and a hold that keeps up with the schedule.'},
 {id:'jackal',name:'Jackal',class:'combat',role:'Patrol cutter',price:16500,hull:130,shield:140,cargo:14,fuel:125,range:14,speed:255,turn:4.3,damage:34,weapon:'pulse',slots:6,size:19,radius:17,color:'#f0a898',accent:'#d47868',desc:'First dedicated fighter. Lean, mean, and short on patience.'},
 {id:'kestrel',name:'Kestrel',class:'explorer',role:'Strike explorer',price:18000,hull:160,shield:160,cargo:28,fuel:155,range:21,speed:285,turn:4.6,damage:30,slots:6,size:21,radius:18,color:'#9fd7ff',accent:'#6eb8f0',desc:'Long legs, quick engines, and a bite to match.'},
 {id:'mole',name:'Mole',class:'miner',role:'Ore barge',price:20500,hull:200,shield:120,cargo:42,fuel:145,range:15,speed:175,turn:2.6,damage:24,miningDamage:14,slots:7,size:25,radius:23,color:'#c4a882',accent:'#a88860',desc:'A tanky hold for the long dig. Slow, stubborn, profitable.'},
 {id:'osprey',name:'Osprey',class:'explorer',role:'Deep scout',price:22500,hull:140,shield:130,cargo:22,fuel:165,range:24,speed:250,turn:3.8,damage:22,slots:6,size:19,radius:17,color:'#9ee0c8',accent:'#6ec4a8',desc:'Jump legs for the Reach. See farther, carry less.'},
 {id:'falcon',name:'Falcon',class:'combat',role:'Interceptor',price:25500,hull:135,shield:155,cargo:16,fuel:130,range:15,speed:310,turn:4.8,damage:36,weapon:'beam',slots:6,size:18,radius:16,color:'#ffb088',accent:'#e88858',desc:'Speed is the weapon. Catch them before they fold.'},
 {id:'albatross',name:'Albatross',class:'explorer',role:'Foldliner',price:28500,hull:155,shield:140,cargo:24,fuel:190,range:26,speed:220,turn:3.2,damage:20,slots:6,size:22,radius:20,color:'#b8d4e8',accent:'#88b0c8',desc:'A deep tank and longer folds. Made for crossing empty dark.'},
 {id:'ox',name:'Ox',class:'trader',role:'Bulk freighter',price:32000,hull:230,shield:130,cargo:72,fuel:160,range:15,speed:165,turn:2.4,damage:22,slots:8,size:28,radius:26,color:'#d8c090',accent:'#b8a070',desc:'When the contract says tons, not haste. A moving warehouse.'},
 {id:'vulture',name:'Vulture',class:'combat',role:'Privateer',price:36000,hull:175,shield:170,cargo:30,fuel:140,range:16,speed:260,turn:3.9,damage:40,weapon:'missile',slots:6,size:21,radius:19,color:'#d8a0b0',accent:'#b87890',desc:'Bite enough for pirates, hold enough for salvage.'},
 {id:'heron',name:'Heron',class:'explorer',role:'Cartographic yacht',price:40000,hull:150,shield:175,cargo:26,fuel:170,range:23,speed:240,turn:3.7,damage:24,slots:7,size:20,radius:18,color:'#a0e8e0',accent:'#70c8c0',desc:'Quiet surveys in comfort. A yacht that still charts the map.'},
 {id:'badger',name:'Badger',class:'miner',role:'Excavator',price:44000,hull:240,shield:150,cargo:50,fuel:155,range:16,speed:185,turn:2.7,damage:28,miningDamage:18,slots:8,size:26,radius:24,color:'#c8b078',accent:'#a89058',desc:'End-mid excavator. Digs deep and brings the seam home.'},
 {id:'raptor',name:'Raptor',class:'combat',role:'Gunship',price:48000,hull:190,shield:210,cargo:18,fuel:145,range:15,speed:270,turn:4.1,damage:48,weapon:'pulse',slots:7,size:22,radius:20,color:'#f09888',accent:'#d07060',desc:'Dedicated firepower. The hangar that ends arguments.'},
 {id:'condor',name:'Condor',class:'explorer',role:'Expedition liner',price:56000,hull:180,shield:190,cargo:34,fuel:200,range:28,speed:230,turn:3.3,damage:26,slots:7,size:23,radius:21,color:'#88d0e8',accent:'#58b0c8',desc:'Endgame explorer. Far folds, room for the long survey.'},
 {id:'goliath',name:'Goliath',class:'trader',role:'Superhauler',price:65000,hull:280,shield:160,cargo:96,fuel:175,range:14,speed:150,turn:2.1,damage:24,slots:8,size:30,radius:28,color:'#e0c878',accent:'#c0a858',desc:'The frontier’s warehouse with engines. Slow wealth.'},
 {id:'eagle',name:'Eagle',class:'combat',role:'Battlecruiser',price:78000,hull:260,shield:240,cargo:22,fuel:165,range:17,speed:245,turn:3.5,damage:55,weapon:'beam',slots:8,size:26,radius:24,color:'#ff9080',accent:'#e06858',desc:'Endgame warship. Shields like a station, teeth to match.'}
];
export const shipRadius=id=>(SHIPS.find(s=>s.id===id)||SHIPS[0]).radius;
export const moduleSlots=id=>(SHIPS.find(s=>s.id===id)||SHIPS[0]).slots??6;
export const UPGRADES = [
 {id:'laser',name:'Pulse cannon',desc:'+7 damage per level',base:950},
 {id:'shield',name:'Shield matrix',desc:'+30 shield per level',base:800},
 {id:'engine',name:'Vector thrusters',desc:'+28 speed per level',base:700},
 {id:'drive',name:'Fold drive',desc:'+3 ly range per level',base:1000},
 {id:'cargo',name:'Cargo expansion',desc:'+6 tons per level',base:600}
];
export const WEAPONS={
 pulse:{id:'pulse',name:'Pulse cannon',interval:.24,speed:820,life:.85,cost:8,color:'#a4fff0',scale:1},
 beam:{id:'beam',name:'Beam lance',interval:.09,speed:2400,life:.11,cost:5,color:'#7ec8ff',scale:.4},
 missile:{id:'missile',name:'Seeker rack',interval:.9,speed:310,life:3.1,cost:26,color:'#ffb070',scale:1.85,seek:true,ammo:true},
 mining:{id:'mining',name:'Mining laser',interval:.2,speed:700,life:.7,cost:4,color:'#8dddcc',scale:1,mining:true}
};
export function fittedWeaponDef(s){for(const uid of s.loadouts?.[s.ship]||[]){const item=s.modules?.find(m=>m.uid===uid),def=item&&MODULES[item.kind];if(def?.category==='weapon')return def;}return null;}
export function resolveWeaponMode(s,mining=false){if(mining)return 'mining';const fit=fittedWeaponDef(s);if(fit?.bonus?.weapon)return fit.bonus.weapon;const hull=SHIPS.find(x=>x.id===s.ship)||SHIPS[0];return hull.weapon||'pulse';}

export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export const angleDiff=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
export function rng(seed){return()=>{let t=seed+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
const NAMES=['Solace','Kestrel Reach','Morrow','Pale Blue','Cinder','Orison','Aster','Vela Crossing','Emberfall','Nacre','Stillwater','Lacuna','Haven','Rook','Verdant','Sable','Meridian','Caldera','Ghostlight','Iona','Eidolon','Lumen','Wayfarer','Last Light'];
export const SYSTEMS=NAMES.map((name,i)=>{const r=rng(i*771+523);return {id:i,name,x:(i%6)*8+(r()-.5)*3,y:Math.floor(i/6)*9+(r()-.5)*3,eco:Object.keys(ECONOMIES)[i%5],danger:i===0?0:i%4,station:['Anchorage','Exchange','Outpost','Terminal'][i%4]+' '+String(i+1).padStart(2,'0'),color:['#ecc095','#a8d7fc','#f59c71','#ccbcff','#e9debb'][i%5],lore:[
 'A quiet harbor at the edge of charted space. Most journeys begin with an unremarkable departure.',
 'Freight beacons flicker between ice worlds. There is work here for pilots willing to travel.',
 'Old mining claims share an orbit with newer ambitions. Keep an eye on your scanner.',
 'The pale world below has never known a sunrise quite like home.',
 'Industry lights the dark side of a scorched planet. Cargo moves faster than rumors.'
 ][i%5]};});
expandGalaxy(SYSTEMS,rng);
export function basePrice(system,good){const idx=GOODS.findIndex(g=>g.id===good);return Math.round(GOODS[idx].base*ECONOMIES[system.eco][idx]*(.9+rng(system.id*97+idx*117+53)()*.2));}
export function price(system,good,buy=true,save=null){const m=save?moduleBonuses(save):{},rep=save?.reputation?.[system.faction]||0,standing=rep>=20?.025:rep<=-20?-.08:0,factor=buy?Math.max(1.01,1.08-(m.buyDiscount||0)-standing):Math.min(.99,.92+(m.sellBonus||0)+standing);return buy?Math.ceil(basePrice(system,good)*factor):Math.floor(basePrice(system,good)*factor);}
export function getStats(s){const b=SHIPS.find(x=>x.id===s.ship)||SHIPS[0],u=s.upgrades,m=moduleBonuses(s),fit=fittedWeaponDef(s),weapon=fit?.bonus?.weapon||b.weapon||'pulse',w=WEAPONS[weapon]||WEAPONS.pulse;return {...b,hull:b.hull+m.hull,damage:b.damage+u.laser*7+m.damage,shield:b.shield+u.shield*30+m.shield,speed:b.speed+u.engine*28+m.speed,range:b.range+u.drive*3+m.range,cargo:b.cargo+u.cargo*6+m.cargo,fuel:b.fuel+m.fuel,scanRange:650+m.scanRange,spectrumRange:4200+m.scanRange,scanSpeed:m.scanSpeed,dataMultiplier:1+m.dataBonus,signalMultiplier:1+m.signalBonus,surfaceRange:m.surfaceRange,fuelEfficiency:Math.min(.5,m.fuelEfficiency),miningYield:1+m.miningYield,miningDamage:(b.miningDamage||20)+m.miningDamage,weapon,weaponName:fit?.name||w.name,weaponColor:w.color,energyMax:100,missileMax:weapon==='missile'?6+(b.class==='combat'?2:0):0};}
export const cargoUsed=s=>Object.values(s.cargo).reduce((a,b)=>a+b,0)+s.missions.filter(m=>m.type==='delivery').reduce((a,m)=>a+m.tons,0);
export const jumpDistance=(a,b)=>dist(SYSTEMS[a],SYSTEMS[b]);
export const jumpCost=(a,b,s=null)=>Math.ceil((jumpDistance(a,b)*1.5+4)*(1-(s?getStats(s).fuelEfficiency:0)));
export function newSave(){return {version:VERSION,system:0,ship:'wren',credits:2400,hull:100,shield:80,fuel:100,cargo:{food:0,ore:0,tech:0,meds:0,crystal:0},upgrades:{laser:0,shield:0,engine:0,drive:0,cargo:0},visited:[0],scanned:[],data:0,kills:0,trade:0,contracts:0,mined:0,missions:[],completed:[],stock:{},sound:true,tutorial:0,playtime:0,docked:true,position:null};}
export function validateSave(x){
 if(!x||x.version!==VERSION||!Number.isInteger(x.system)||!SYSTEMS[x.system]||!SHIPS.some(s=>s.id===x.ship))return null;
 const base=newSave(); for(const key of ['credits','hull','shield','fuel','data','kills','trade','contracts','mined','playtime'])if(!Number.isFinite(x[key])||x[key]<0)return null;
 for(const g of GOODS)if(!Number.isInteger(x.cargo?.[g.id])||x.cargo[g.id]<0||x.cargo[g.id]>10000)return null;
 for(const u of UPGRADES)if(!Number.isInteger(x.upgrades?.[u.id])||x.upgrades[u.id]<0||x.upgrades[u.id]>3)return null;
 for(const k of ['visited','scanned','missions','completed'])if(!Array.isArray(x[k]))return null;
 if(x.visited.some(i=>!Number.isInteger(i)||!SYSTEMS[i])||x.scanned.some(id=>!/^(planet-\d+-\d+|moon-\d+-\d+-\d+)$/.test(id)))return null;
 if(x.missions.length>3||x.missions.some(m=>!m||!['delivery','survey','bounty','mining'].includes(m.type)||!SYSTEMS[m.origin]||!Number.isFinite(m.reward)||m.reward<0||!/^\d+-\d+$/.test(m.id)||typeof m.name!=='string'||(m.type==='delivery'&&(!SYSTEMS[m.destination]||!Number.isInteger(m.tons)||m.tons<1||m.tons>10))||(m.type==='survey'&&!SYSTEMS[m.destination])||(m.type==='bounty'&&!Number.isFinite(m.startKills))||(m.type==='mining'&&m.tons!==5)))return null;
 if(x.completed.some(id=>!/^\d+-\d+$/.test(id)))return null;
 if(x.missions.some(m=>!Number.isInteger(m.origin)||(m.destination!=null&&!Number.isInteger(m.destination))))return null;
 const stock={};for(const [key,val] of Object.entries(x.stock||{})){if(!/^\d+:(food|ore|tech|meds|crystal)$/.test(key)||!Number.isInteger(val)||val<0||val>100000)return null;stock[key]=val;}
 const s={};for(const key of Object.keys(base))s[key]=x[key]??base[key];s.stock=stock;s.sound=!!x.sound;s.docked=!!x.docked;s.position=null;s.tutorial=clamp(Number(x.tutorial)||0,0,2);
 if(x.position&&['x','y','angle'].every(k=>Number.isFinite(x.position[k]))&&Math.abs(x.position.x)<1e7&&Math.abs(x.position.y)<1e7)s.position={x:x.position.x,y:x.position.y,angle:x.position.angle};
 s.hull=clamp(s.hull,1,getStats(s).hull);s.shield=Math.min(s.shield,getStats(s).shield);s.fuel=Math.min(s.fuel,getStats(s).fuel);return s;
}
export function contractsFor(s){const here=SYSTEMS[s.system],all=SYSTEMS.filter(x=>x.id!==here.id).sort((a,b)=>dist(a,here)-dist(b,here)),near=all.filter(x=>dist(x,here)<=14),target=near.find(x=>x.hasStation!==false)||all.find(x=>x.hasStation!==false),dest=near[1]||near[0]||target;
 const worlds=surveyWorldIds(dest.id,dest),worldWord=worlds.length===1?'world':`all ${worlds.length} worlds`;
 return [
 {id:`${here.id}-0`,type:'delivery',name:`Supplies for ${target.name}`,desc:`Carry 3 t of sealed supplies to ${target.station}, ${target.name}.`,origin:here.id,destination:target.id,tons:3,reward:1000+Math.round(dist(here,target)*65)},
 {id:`${here.id}-1`,type:'survey',name:`Survey ${dest.name}`,desc:`Scan ${worldWord} in ${dest.name}, then return here.`,origin:here.id,destination:dest.id,worlds:worlds.length,reward:1700+Math.round(dist(here,dest)*55)+worlds.length*120},
 {id:`${here.id}-2`,type:'bounty',name:'Clear the shipping lanes',desc:'Destroy 2 pirates anywhere, then return here.',origin:here.id,required:2,startKills:s.metrics?.pirates??s.kills,reward:2200},
 {id:`${here.id}-3`,type:'mining',name:'A need for titanium',desc:'Bring 5 t of titanium ore to this station.',origin:here.id,tons:5,reward:1500}
 ].filter(m=>!s.completed.includes(m.id)&&!s.missions.some(a=>a.id===m.id));
}
export class Game {
 constructor(save=newSave()){this.s=save;this.events=[];this.time=0;this.shots=[];this.particles=[];this.effects=[];this.fireTimer=0;this.scan=null;this.spectrumScan=null;this.jump=null;this.auto=null;this.boost=0;this.lastDamage=-20;this.miningAt=-20;this.energy=100;this.missiles=0;this.lock=null;this.hitMarks=[];this.threat=0;this.fireMode=null;this._missileRegen=0;this.makeSystem();if(!this.s.docked&&this.s.position){this.player.x=this.s.position.x;this.player.y=this.s.position.y;this.player.angle=this.s.position.angle;}}
 notify(text,tone='info'){this.events.push({text,tone});if(this.events.length>12)this.events.shift();}
 makeSystem(){
  const id=this.s.system,r=rng(919+id*311);this.sys=SYSTEMS[id];
  const layout=buildSystemLayout(this.sys,r);
  this.stars=layout.stars;this.star=layout.primary;
  this.planets=[...layout.planets,...(layout.moons||[])];this.belts=layout.belts;this.belt=layout.belts[0]||null;
  this.asteroids=layout.asteroids;this.stations=layout.stations;
  this.station=layout.homeDock;this.enemies=layout.enemies;
  this.traffic=Array.from({length:4},(_,i)=>({x:this.station.x+(r()-.5)*1200,y:this.station.y+(r()-.5)*1100,phase:r()*6.28,name:['Courier','Prospector','Freighter','Patrol'][i]}));
  const dock=this.stations.find(s=>s.id===(this.s.dockId||'station')&&s.type==='station')||this.station;
  this.player={x:dock.x,y:dock.y+185,vx:0,vy:0,angle:-Math.PI/2,r:shipRadius(this.s.ship)};this.target=this.station;this.shots=[];this.auto=null;this.scan=null;this.spectrumScan=null;this.effects=[];this.particles=[];
 }
 serialize(){return {...this.s,position:{x:this.player.x,y:this.player.y,angle:this.player.angle}};}
 launch(){if(!this.s.docked)return false;this.s.docked=false;const dock=this.stations?.find(s=>s.id===(this.s.dockId||this.station?.id))||this.station;this.player.x=dock.x;this.player.y=dock.y+185;this.player.angle=Math.PI/2;this.player.vx=0;this.player.vy=0;const launchSt=getStats(this.s);this.energy=launchSt.energyMax;this.missiles=launchSt.missileMax;this.s.tutorial=Math.max(this.s.tutorial,1);this.notify('Departure cleared. Fly safe, pilot.');return true;}
 dock(){if(this.s.docked)return true;const docks=(this.stations||[this.station]).filter(s=>s.type==='station');const preferred=this.target?.type==='station'?this.target:null;const near=preferred&&dist(this.player,preferred)<=200?preferred:docks.sort((a,b)=>dist(this.player,a)-dist(this.player,b))[0];if(!near||dist(this.player,near)>200){this.target=near||this.station;this.autopilot();this.notify('Autopilot set for the station.');return false;}this.station=near;this.s.dockId=near.id;this.s.docked=true;this.auto=null;this.scan=null;this.player.vx=this.player.vy=0;const dockSt=getStats(this.s);this.s.shield=dockSt.shield;this.energy=dockSt.energyMax;this.missiles=dockSt.missileMax;if(this.s.data){this.notify(`Survey data sold: +${this.s.data.toLocaleString()} cr`,'good');this.s.credits+=this.s.data;this.s.data=0;}this.claimMissions();this.notify('Docking complete. Welcome aboard.');return true;}
 select(id){this.target=[...(this.stations||[this.station]),...(this.stars||[]),...this.planets,...(this.belts||(this.belt?[this.belt]:[])),...this.enemies,...this.asteroids].find(o=>o&&o.id===id)||this.station;this.auto=null;return this.target;}
 autopilot(){if(this.s.docked){this.notify('Launch before engaging autopilot.');return;}if(this.auto){this.auto=null;this.notify('Manual flight.');return;}this.auto=this.target;this.notify('Autopilot → '+this.target.name);}
  scanTarget(){if(this.scan||this.spectrumScan||this.jump)return false;if(this.s.docked){this.notify('Launch and approach a world to scan it.');return false;}const isBody=t=>t&&(t.type==='planet'||t.type==='moon');const st=getStats(this.s);const spectrumedOf=b=>(this.s.spectrumScanned||[]).includes(b.id);let p=isBody(this.target)?this.target:this.planets.reduce((a,b)=>dist(this.player,a)<dist(this.player,b)?a:b);
  // If the current target is already analyzed and we're not in close-survey range,
  // jump to the next body that still needs a spectrum pass (common player flow).
  if(p&&spectrumedOf(p)&&!this.s.scanned.includes(p.id)&&dist(this.player,p)>p.r+st.scanRange){
   const need=this.planets.filter(b=>!this.s.scanned.includes(b.id)&&!spectrumedOf(b));
   const near=need.filter(b=>dist(this.player,b)<=b.r+st.spectrumRange).sort((a,b)=>dist(this.player,a)-dist(this.player,b))[0];
   const next=near||need[0];
   if(next){p=next;this.notify('Next body · '+next.name);}
  }
  this.target=p;const d=dist(this.player,p);const spectrumed=spectrumedOf(p);if(this.s.scanned.includes(p.id)){this.notify(spectrumed?'Body dossier complete. Already surveyed.':'This world is already surveyed.');return false;}
  // Distant spectrum analysis (FSS-style) before close survey.
  if(!spectrumed&&d<=p.r+st.spectrumRange){this.auto=null;this.spectrumScan={id:p.id,progress:0};this.notify('Spectrum scanner locked. Hold for body analysis.');return true;}
  if(!spectrumed&&d>p.r+st.spectrumRange){this.auto=p;this.notify('Approaching spectrum range. Tap SCAN when you arrive.');return false;}
  if(Math.hypot(this.player.vx,this.player.vy)>100){this.notify('Slow below 100 m/s to survey a world.');return false;}
  if(d>p.r+st.scanRange){this.auto=p;this.notify('Already analyzed. Approach for detailed survey.');return false;}
  this.auto=null;this.scan={id:p.id,progress:0};this.notify('Survey array active. Hold position.');return true;}
 jumpTo(id){if(this.s.docked){this.notify('Launch before jumping.');return false;}if(this.jump)return false;if(id===this.s.system){this.notify('Already in this system.');return false;}if(!SYSTEMS[id])return false;const d=jumpDistance(this.s.system,id),cost=jumpCost(this.s.system,id,this.s);if(d>getStats(this.s).range){this.notify('Beyond fold-drive range. Choose a nearer system.');return false;}if(this.s.fuel<cost){this.notify('Not enough fuel. Refuel at the station.');return false;}this.auto=null;this.scan=null;this.spectrumScan=null;this.jump={id,progress:0,cost};this.notify('Fold drive charging.');return true;}
 buy(good,qty=1){if(!this.s.docked||!GOODS.some(g=>g.id===good)||![1,5].includes(qty))return false;const cost=price(this.sys,good,true,this.s)*qty,free=getStats(this.s).cargo-cargoUsed(this.s),stock=this.stock(good);if(this.s.credits<cost){this.notify('Insufficient credits.');return false;}if(free<qty){this.notify('Cargo hold is full.');return false;}if(stock<qty){this.notify('Station supply is too low.');return false;}this.s.credits-=cost;this.s.cargo[good]+=qty;this.s.stock[`${this.sys.id}:${good}`]=stock-qty;this.notify(`Bought ${qty} t · ${GOODS.find(g=>g.id===good).name}`);return true;}
 sell(good,qty=1){if(!this.s.docked||!GOODS.some(g=>g.id===good)||![1,5].includes(qty))return false;if(this.s.cargo[good]<qty){this.notify('Not enough cargo to sell.');return false;}const value=price(this.sys,good,false,this.s)*qty;this.s.cargo[good]-=qty;this.s.credits+=value;this.s.trade+=value;this.s.stock[`${this.sys.id}:${good}`]=this.stock(good)+qty;this.notify(`Sold ${qty} t · +${value.toLocaleString()} cr`,'good');return true;}
 stock(good){return this.s.stock[`${this.sys.id}:${good}`]??40;}
 service(kind){if(!this.s.docked)return false;const st=getStats(this.s),amount=kind==='fuel'?Math.ceil(st.fuel-this.s.fuel):Math.ceil(st.hull-this.s.hull),cost=kind==='fuel'?amount*2:amount*4;if(!amount){this.notify(kind==='fuel'?'Tank already full.':'Hull already repaired.');return false;}if(this.s.credits<cost){this.notify('Insufficient credits. Emergency assistance is available in the flight menu.');return false;}this.s.credits-=cost;if(kind==='fuel')this.s.fuel=st.fuel;else this.s.hull=st.hull;this.notify(kind==='fuel'?'Fuel tanks topped off.':'Hull integrity restored.','good');return true;}
 upgrade(id){if(!this.s.docked)return false;const u=UPGRADES.find(x=>x.id===id);if(!u)return false;const level=this.s.upgrades[id],cost=u.base*(level+1);if(level>=3||this.s.credits<cost)return false;this.s.credits-=cost;this.s.upgrades[id]++;if(id==='shield')this.s.shield=getStats(this.s).shield;this.notify(u.name+' upgraded.','good');return true;}
 buyShip(id){if(!this.s.docked)return false;const b=SHIPS.find(x=>x.id===id);if(!b||id===this.s.ship)return false;const trade=Math.floor(SHIPS.find(x=>x.id===this.s.ship).price*.5),cost=Math.max(0,b.price-trade);if(this.s.credits<cost){this.notify('Insufficient credits.');return false;}if(cargoUsed(this.s)>b.cargo+this.s.upgrades.cargo*6){this.notify('Sell cargo before changing to a smaller ship.');return false;}this.s.credits-=cost;this.s.ship=id;const st=getStats(this.s);this.s.hull=st.hull;this.s.shield=st.shield;this.s.fuel=st.fuel;this.notify('Your '+b.name+' is ready for departure.','good');return true;}
 accept(id){if(!this.s.docked)return false;const m=contractsFor(this.s).find(x=>x.id===id);if(!m)return false;if(this.s.missions.length>=3){this.notify('Finish a contract first. Maximum 3 active.');return false;}if(m.type==='delivery'&&getStats(this.s).cargo-cargoUsed(this.s)<m.tons){this.notify('Free up 3 t of cargo space first.');return false;}this.s.missions.push({...m});this.notify('Contract accepted: '+m.name,'good');return true;}
 abandon(id){const i=this.s.missions.findIndex(m=>m.id===id);if(i<0)return;this.s.missions.splice(i,1);this.notify('Contract released. Sealed cargo returned.');}
 missionReady(m){return m.type==='delivery'?this.s.system===m.destination:this.s.system===m.origin&&(m.type==='survey'?surveyWorldIds(m.destination,SYSTEMS[m.destination]).every(id=>this.s.scanned.includes(id)):m.type==='bounty'?(this.s.metrics?.pirates??this.s.kills)-m.startKills>=2:this.s.cargo.ore>=m.tons);}
 claimMissions(){if(!this.s.docked)return;const done=this.s.missions.filter(m=>this.missionReady(m));for(const m of done){this.s.credits+=m.reward;this.s.contracts++;if(m.type==='mining')this.s.cargo.ore-=m.tons;this.s.completed.push(m.id);this.notify(`Contract fulfilled · +${m.reward.toLocaleString()} cr`,'good');}this.s.missions=this.s.missions.filter(m=>!done.includes(m));}
 rescue(){this.s.credits=Math.max(0,this.s.credits-250);this.s.fuel=getStats(this.s).fuel;this.s.hull=getStats(this.s).hull;this.s.shield=getStats(this.s).shield;this.s.data=0;for(const g of GOODS)this.s.cargo[g.id]=0;this.s.missions=this.s.missions.filter(m=>m.type!=='delivery');this.s.docked=true;this.jump=null;this.makeSystem();this.notify('Recovery complete. Cargo and unsold survey data were lost.');}
 shoot(){const st=getStats(this.s);if(this.fireTimer>0)return;const p=this.player;let a=p.angle;
 const foes=this.enemies.filter(e=>dist(p,e)<620&&Math.abs(angleDiff(Math.atan2(e.y-p.y,e.x-p.x),a))<.44).sort((x,y)=>dist(p,x)-dist(p,y));
 const rocks=this.asteroids.filter(e=>dist(p,e)<620&&Math.abs(angleDiff(Math.atan2(e.y-p.y,e.x-p.x),a))<.44).sort((x,y)=>dist(p,x)-dist(p,y));
 const wantMine=this.target?.type==='asteroid'||(!foes.length&&!!rocks.length);
 const mode=resolveWeaponMode(this.s,wantMine),w=WEAPONS[mode]||WEAPONS.pulse;
 if(this.energy<w.cost){if(this.time-(this._energyWarn||0)>1.2){this.notify('Weapon capacitors low — ease off.');this._energyWarn=this.time;}return;}
 if(w.ammo&&this.missiles<=0){if(this.time-(this._ammoWarn||0)>1.2){this.notify('Seeker rack empty — restock when docked.');this._ammoWarn=this.time;}return;}
 this.fireTimer=w.interval;this.energy-=w.cost;if(w.ammo)this.missiles--;this.fireMode=mode;
 let aim=wantMine&&rocks[0]||foes[0]||rocks[0]||null;
 if(aim){a=Math.atan2(aim.y-p.y,aim.x-p.x);this.lock={id:aim.id,type:aim.type,x:aim.x,y:aim.y,until:this.time+.4};}
 const dmg=wantMine?st.miningDamage:Math.max(1,Math.round(st.damage*(w.scale||1)));
 this.shots.push({x:p.x+Math.cos(a)*25,y:p.y+Math.sin(a)*25,vx:Math.cos(a)*w.speed+p.vx,vy:Math.sin(a)*w.speed+p.vy,life:w.life,enemy:false,playerShot:true,damage:dmg,kind:mode,color:w.color,mining:!!w.mining,seek:w.seek&&aim&&aim.type==='enemy'?aim.id:null,speed:w.speed});
}
 burst(x,y,color,count=18){const g=this.s?.graphics||'high',lite=g==='performance',soft=g!=='high';if(soft)count=Math.max(2,Math.ceil(count*(lite?.35:.55)));for(let i=0;i<count;i++){let a=Math.random()*6.28,v=30+Math.random()*130;this.particles.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:.3+Math.random()*.8,color});}const cap=lite?70:soft?140:350;if(this.particles.length>cap)this.particles.splice(0,this.particles.length-cap);}
 update(dt,input={}){
  dt=clamp(dt,0,.05);this.time+=dt;this.fireTimer-=dt;
  for(const p of this.particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;}this.particles=this.particles.filter(p=>p.life>0);
  for(const f of this.effects)f.life-=dt;this.effects=this.effects.filter(f=>f.life>0);
  this.player.thrust=0;this.player.boost=false;
  if(this.s.docked)return;
  this.s.playtime+=dt;const p=this.player,st=getStats(this.s);
  if(this.jump){this.jump.progress+=dt;if(this.jump.progress>=3){const j=this.jump;this.s.fuel-=j.cost;this.s.system=j.id;if(!this.s.visited.includes(j.id))this.s.visited.push(j.id);this.jump=null;this.makeSystem();this.s.docked=false;this.player.y=650;this.notify('Arrived in '+this.sys.name+'.','good');}return;}
  let thrust=input.thrust||0,boost=!!input.boost,turn=input.turn||0;
  if(Math.abs(turn)>.05||thrust>.05||input.aim!=null)this.auto=null;
  if(input.aim!=null){turn=clamp(angleDiff(input.aim,p.angle)*4,-1,1);}
  if(this.auto){const t=this.auto,d=dist(p,t),stop=['planet','moon','star'].includes(t.type)?t.r+300:t.type==='station'?95:140,desired=Math.atan2(t.y-p.y,t.x-p.x);turn=clamp(angleDiff(desired,p.angle)*3,-1,1);thrust=Math.abs(angleDiff(desired,p.angle))<.9?clamp((d-stop)/340,0,1):0;boost=d>1500;if(d<stop+15){this.auto=null;p.vx*=.2;p.vy*=.2;this.notify(t.type==='station'?'Within docking range. Tap DOCK.':(t.type==='planet'||t.type==='moon')?'Within survey range. Tap SCAN.':t.type==='star'?'Within fuel-scoop range. Tap SCOOP.':'Arrived at asteroid field. Fire at rocks to mine.');}}
  p.angle+=turn*st.turn*dt;const max=st.speed*(boost?2.15:1);this.boost=boost&&thrust>.1?1:0;p.thrust=clamp(thrust,0,1);p.boost=!!this.boost;
  if(thrust){p.vx+=Math.cos(p.angle)*thrust*510*(boost?1.8:1)*dt;p.vy+=Math.sin(p.angle)*thrust*510*(boost?1.8:1)*dt;}const drag=input.brake?4.5:thrust?1.35:1.55;p.vx*=Math.exp(-drag*dt);p.vy*=Math.exp(-drag*dt);let v=Math.hypot(p.vx,p.vy);if(v>max){p.vx*=max/v;p.vy*=max/v;}p.x+=p.vx*dt;p.y+=p.vy*dt;
  this.energy=Math.min(st.energyMax,this.energy+(input.fire?6:28)*dt);if(st.missileMax&&this.missiles<st.missileMax){this._missileRegen+=dt;if(this._missileRegen>=10){this._missileRegen=0;this.missiles++;}}this.threat=Math.max(0,this.threat-dt);for(const h of this.hitMarks)h.life-=dt;this.hitMarks=this.hitMarks.filter(h=>h.life>0);if(this.lock&&this.time>this.lock.until)this.lock=null;if(input.fire)this.shoot();if(this.s.shield<st.shield&&this.time-this.lastDamage>4)this.s.shield=Math.min(st.shield,this.s.shield+8*dt);
  if(this.spectrumScan){const t=this.planets.find(b=>b.id===this.spectrumScan.id);if(!t||dist(p,t)>t.r+st.spectrumRange+80||input.fire){this.spectrumScan=null;this.notify('Spectrum scan interrupted.');}else{this.spectrumScan.progress+=dt*(1+st.scanSpeed);if(this.spectrumScan.progress>=2.5){this.s.spectrumScanned??=[];if(!this.s.spectrumScanned.includes(t.id))this.s.spectrumScanned.push(t.id);this.effects.push({x:t.x,y:t.y,r:t.r,color:'#9bc8ff',life:1.6});this.spectrumScan=null;this.notify(`${t.name} analyzed · ${t.kind}. Approach for detailed survey.`,'good');}}}
  if(this.scan){const t=this.planets.find(b=>b.id===this.scan.id);if(!t||dist(p,t)>t.r+st.scanRange+50||Math.hypot(p.vx,p.vy)>100||input.fire){this.scan=null;this.notify('Scan interrupted. Stay within range, below 100 m/s, and hold fire.');}else{this.scan.progress+=dt*(1+st.scanSpeed);if(this.scan.progress>=3){this.s.scanned.push(t.id);const boosted=(this.s.spectrumScanned||[]).includes(t.id)?1.15:1;const surveyValue=Math.round(t.value*st.dataMultiplier*boosted);this.s.data+=surveyValue;this.effects.push({x:t.x,y:t.y,r:t.r,color:'#84f3db',life:2});this.scan=null;this.s.tutorial=Math.max(this.s.tutorial,2);this.notify(`Survey complete · ${surveyValue.toLocaleString()} cr in data. Sell by docking.`,'good');}}}
  for(const e of this.enemies){if(e.response||e.eventFlee||e.skirmishSide!=null)continue;const d=dist(p,e);const safe=this.sys.hasStation!==false&&dist(p,this.station)<470;if(d<950&&!safe){e.angle=Math.atan2(p.y-e.y,p.x-e.x);const speed=d>210?100+this.sys.danger*10:d<150?-65:15;e.thrust=speed>0?.45:0;e.x+=Math.cos(e.angle)*speed*dt;e.y+=Math.sin(e.angle)*speed*dt;e.fire-=dt;if(e.fire<0&&d<600){e.fire=1.1+Math.random()*.6;this.shots.push({x:e.x,y:e.y,vx:Math.cos(e.angle)*330,vy:Math.sin(e.angle)*330,life:2,enemy:true,damage:9+this.sys.danger*2});this.onHostileAttack?.(e,p);}}else{e.thrust=.2;e.angle+=dt*.28;e.x+=Math.cos(e.angle)*26*dt;e.y+=Math.sin(e.angle)*26*dt;}}
  for(const b of this.shots){const from={x:b.x,y:b.y};if(b.seek){const tgt=this.enemies.find(e=>e.id===b.seek&&e.hp>0);if(tgt){const desired=Math.atan2(tgt.y-b.y,tgt.x-b.x),cur=Math.atan2(b.vy,b.vx),turn=angleDiff(desired,cur),maxTurn=2.8*dt,adj=Math.max(-maxTurn,Math.min(maxTurn,turn)),spd=b.speed||310,na=cur+adj;b.vx=Math.cos(na)*spd;b.vy=Math.sin(na)*spd;}}b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;if(b.trafficShot)continue;if(b.enemy){if(segmentDistance(p,from,b)<p.r+7){let dam=b.damage,absorb=Math.min(this.s.shield,dam);this.s.shield-=absorb;this.s.hull-=dam-absorb;this.lastDamage=this.time;this.lastHitSecurity=!!b.security;b.life=0;this.threat=1.6;this.burst(p.x,p.y,'#ef8b7f',6);}}else{const targets=b.playerShot?(b.mining?this.asteroids:this.enemies):this.enemies;for(const t of targets){if(t.hp>0&&segmentDistance(t,from,b)<t.r+5){if(t.type==='enemy'&&b.playerShot)t.playerHit=true;t.hp-=b.damage;b.life=0;if(b.playerShot)this.hitMarks.push({x:t.x,y:t.y-t.r-8,life:.55,text:String(Math.round(b.damage)),color:b.color||'#a4fff0'});this.burst(b.x,b.y,t.type==='enemy'?'#f8a77f':'#8dddcc',5);if(t.hp<=0){const playerCredit=t.type==='enemy'&&!!t.playerHit;this.burst(t.x,t.y,'#ffd297',24);this.onDestroyed?.(t,playerCredit);if(t.type==='enemy'){if(playerCredit){this.s.kills++;this.s.credits+=t.bounty;this.notify(`Bounty confirmed · +${t.bounty} cr`,'good');}}else if(b.playerShot){if(cargoUsed(this.s)<st.cargo){const amount=Math.min(st.miningYield,st.cargo-cargoUsed(this.s));this.s.cargo[t.ore]+=amount;this.s.mined+=amount;this.notify(`${t.ore==='ore'?'Titanium ore':'Void crystal'} collected · ${amount} t`,'good');}else this.notify('Hold full. Dock to sell your cargo.');}if(this.target?.id===t.id)this.target=this.belt;}break;}}}}
  this.shots=this.shots.filter(b=>b.life>0);this.enemies=this.enemies.filter(e=>e.hp>0);this.asteroids=this.asteroids.filter(e=>e.hp>0);
  if(this.s.hull<=0){const loss=Math.ceil(this.s.credits*.12);this.s.credits=Math.max(0,this.s.credits-loss);for(const g of GOODS)this.s.cargo[g.id]=0;this.s.data=0;this.s.missions=this.s.missions.filter(m=>m.type!=='delivery');this.s.hull=st.hull;this.s.shield=st.shield;this.s.fuel=st.fuel;this.s.docked=true;if(this.onCombatLoss?.(loss,{security:!!this.lastHitSecurity})){this.lastHitSecurity=false;return;}this.makeSystem();this.notify(`Escape pod recovered. Lost cargo and ${loss.toLocaleString()} cr.`,'bad');this.lastHitSecurity=false;}
 }
}
function segmentDistance(p,a,b){const dx=b.x-a.x,dy=b.y-a.y,l=dx*dx+dy*dy,t=l?clamp(((p.x-a.x)*dx+(p.y-a.y)*dy)/l,0,1):0;return Math.hypot(p.x-(a.x+t*dx),p.y-(a.y+t*dy));}

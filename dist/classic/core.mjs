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
 {id:'wren',name:'Wren',role:'Light explorer',price:0,hull:100,shield:80,cargo:18,fuel:100,range:14,speed:235,turn:3.5,damage:18,desc:'Light on the stick. A little ship with a long horizon.'},
 {id:'mule',name:'Mule',role:'Freight hauler',price:9500,hull:185,shield:105,cargo:48,fuel:140,range:16,speed:190,turn:2.9,damage:21,desc:'A broad hold and a forgiving hull. Built to make a living.'},
 {id:'kestrel',name:'Kestrel',role:'Strike explorer',price:18000,hull:160,shield:160,cargo:28,fuel:155,range:21,speed:285,turn:4.6,damage:30,desc:'Long legs, quick engines, and a bite to match.'}
];
export const UPGRADES = [
 {id:'laser',name:'Pulse cannon',desc:'+7 damage per level',base:950},
 {id:'shield',name:'Shield matrix',desc:'+30 shield per level',base:800},
 {id:'engine',name:'Vector thrusters',desc:'+28 speed per level',base:700},
 {id:'drive',name:'Fold drive',desc:'+3 ly range per level',base:1000},
 {id:'cargo',name:'Cargo expansion',desc:'+6 tons per level',base:600}
];
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
export function basePrice(system,good){const idx=GOODS.findIndex(g=>g.id===good);return Math.round(GOODS[idx].base*ECONOMIES[system.eco][idx]*(.9+rng(system.id*97+idx*117+53)()*.2));}
export function price(system,good,buy=true){return Math.round(basePrice(system,good)*(buy?1.08:.92));}
export function getStats(s){const b=SHIPS.find(x=>x.id===s.ship)||SHIPS[0],u=s.upgrades;return {...b,damage:b.damage+u.laser*7,shield:b.shield+u.shield*30,speed:b.speed+u.engine*28,range:b.range+u.drive*3,cargo:b.cargo+u.cargo*6};}
export const cargoUsed=s=>Object.values(s.cargo).reduce((a,b)=>a+b,0)+s.missions.filter(m=>m.type==='delivery').reduce((a,m)=>a+m.tons,0);
export const jumpDistance=(a,b)=>dist(SYSTEMS[a],SYSTEMS[b]);
export const jumpCost=(a,b)=>Math.ceil(jumpDistance(a,b)*1.5+4);
export function newSave(){return {version:VERSION,system:0,ship:'wren',credits:2400,hull:100,shield:80,fuel:100,cargo:{food:0,ore:0,tech:0,meds:0,crystal:0},upgrades:{laser:0,shield:0,engine:0,drive:0,cargo:0},visited:[0],scanned:[],data:0,kills:0,trade:0,contracts:0,mined:0,missions:[],completed:[],stock:{},sound:true,tutorial:0,playtime:0,docked:true,position:null};}
export function validateSave(x){
 if(!x||x.version!==VERSION||!Number.isInteger(x.system)||!SYSTEMS[x.system]||!SHIPS.some(s=>s.id===x.ship))return null;
 const base=newSave(); for(const key of ['credits','hull','shield','fuel','data','kills','trade','contracts','mined','playtime'])if(!Number.isFinite(x[key])||x[key]<0)return null;
 for(const g of GOODS)if(!Number.isInteger(x.cargo?.[g.id])||x.cargo[g.id]<0||x.cargo[g.id]>10000)return null;
 for(const u of UPGRADES)if(!Number.isInteger(x.upgrades?.[u.id])||x.upgrades[u.id]<0||x.upgrades[u.id]>3)return null;
 for(const k of ['visited','scanned','missions','completed'])if(!Array.isArray(x[k]))return null;
 if(x.visited.some(i=>!Number.isInteger(i)||!SYSTEMS[i])||x.scanned.some(id=>!/^planet-\d+-[01]$/.test(id)))return null;
 if(x.missions.length>3||x.missions.some(m=>!m||!['delivery','survey','bounty','mining'].includes(m.type)||!SYSTEMS[m.origin]||!Number.isFinite(m.reward)||m.reward<0||!/^\d+-\d+$/.test(m.id)||typeof m.name!=='string'||(m.type==='delivery'&&(!SYSTEMS[m.destination]||!Number.isInteger(m.tons)||m.tons<1||m.tons>10))||(m.type==='survey'&&!SYSTEMS[m.destination])||(m.type==='bounty'&&!Number.isFinite(m.startKills))||(m.type==='mining'&&m.tons!==5)))return null;
 if(x.completed.some(id=>!/^\d+-[0-3]$/.test(id)))return null;
 if(x.missions.some(m=>!Number.isInteger(m.origin)||(m.destination!=null&&!Number.isInteger(m.destination))))return null;
 const stock={};for(const [key,val] of Object.entries(x.stock||{})){if(!/^\d+:(food|ore|tech|meds|crystal)$/.test(key)||!Number.isInteger(val)||val<0||val>100000)return null;stock[key]=val;}
 const s={};for(const key of Object.keys(base))s[key]=x[key]??base[key];s.stock=stock;s.sound=!!x.sound;s.docked=!!x.docked;s.position=null;s.tutorial=clamp(Number(x.tutorial)||0,0,2);
 if(x.position&&['x','y','angle'].every(k=>Number.isFinite(x.position[k]))&&Math.abs(x.position.x)<1e7&&Math.abs(x.position.y)<1e7)s.position={x:x.position.x,y:x.position.y,angle:x.position.angle};
 s.hull=clamp(s.hull,1,getStats(s).hull);s.shield=Math.min(s.shield,getStats(s).shield);s.fuel=Math.min(s.fuel,getStats(s).fuel);return s;
}
export function contractsFor(s){const here=SYSTEMS[s.system],near=SYSTEMS.filter(x=>x.id!==here.id&&dist(x,here)<=14).sort((a,b)=>dist(a,here)-dist(b,here)),target=near[0]||SYSTEMS[(here.id+1)%24],dest=near[1]||target;
 return [
 {id:`${here.id}-0`,type:'delivery',name:`Supplies for ${target.name}`,desc:`Carry 3 t of sealed supplies to ${target.station}, ${target.name}.`,origin:here.id,destination:target.id,tons:3,reward:1000+Math.round(dist(here,target)*65)},
 {id:`${here.id}-1`,type:'survey',name:`Survey ${dest.name}`,desc:`Scan both worlds in ${dest.name}, then return here.`,origin:here.id,destination:dest.id,reward:1700+Math.round(dist(here,dest)*55)},
 {id:`${here.id}-2`,type:'bounty',name:'Clear the shipping lanes',desc:'Destroy 2 pirates anywhere, then return here.',origin:here.id,required:2,startKills:s.kills,reward:2200},
 {id:`${here.id}-3`,type:'mining',name:'A need for titanium',desc:'Bring 5 t of titanium ore to this station.',origin:here.id,tons:5,reward:1500}
 ].filter(m=>!s.completed.includes(m.id)&&!s.missions.some(a=>a.id===m.id));
}
export class Game {
 constructor(save=newSave()){this.s=save;this.events=[];this.time=0;this.shots=[];this.particles=[];this.effects=[];this.fireTimer=0;this.scan=null;this.jump=null;this.auto=null;this.boost=0;this.lastDamage=-20;this.miningAt=-20;this.makeSystem();if(!this.s.docked&&this.s.position){this.player.x=this.s.position.x;this.player.y=this.s.position.y;this.player.angle=this.s.position.angle;}}
 notify(text,tone='info'){this.events.push({text,tone});if(this.events.length>12)this.events.shift();}
 makeSystem(){
  const id=this.s.system,r=rng(919+id*311);this.sys=SYSTEMS[id];this.station={id:'station',type:'station',name:this.sys.station,x:0,y:0,r:65};
  this.planets=[0,1].map((n)=>({id:`planet-${id}-${n}`,type:'planet',name:this.sys.name+' '+(n?'II':'I'),x:n?-1800-r()*700:1400+r()*500,y:n?900+r()*500:-750-r()*400,r:160+r()*90,color:n?['#c68864','#aaa6c6','#bfa976'][id%3]:['#559dac','#9a8e70','#c5755f','#638577'][id%4],value:650+Math.round(r()*650),kind:n?'Mineral world':'Ocean candidate'}));
  this.belt={id:'belt',type:'belt',name:'Asteroid field',x:650,y:1400,r:180};this.asteroids=Array.from({length:24},(_,i)=>({id:'rock-'+i,type:'asteroid',name:'Mineral deposit',x:this.belt.x+(r()-.5)*1000,y:this.belt.y+(r()-.5)*750,r:15+r()*25,hp:36,ore:r()>.76?'crystal':'ore',shape:Array.from({length:9},()=>.72+r()*.35),rotation:r()*6.28}));
  this.enemies=Array.from({length:this.sys.danger===0?1:this.sys.danger+1},(_,i)=>({id:'pirate-'+i,type:'enemy',name:['Marauder','Rogue courier','Void raider'][i%3],x:800+(r()-.5)*950,y:1950+(r()-.5)*800,angle:0,vx:0,vy:0,hp:70+this.sys.danger*20,max:70+this.sys.danger*20,r:20,fire:r()*2,bounty:420+this.sys.danger*180,originX:800,originY:1900}));
  this.traffic=Array.from({length:4},(_,i)=>({x:(r()-.5)*1200,y:(r()-.5)*1100,phase:r()*6.28,name:['Courier','Prospector','Freighter','Patrol'][i]}));
  this.player={x:0,y:180,vx:0,vy:0,angle:-Math.PI/2,r:17};this.target=this.station;this.shots=[];this.auto=null;this.scan=null;this.effects=[];this.particles=[];
 }
 serialize(){return {...this.s,position:{x:this.player.x,y:this.player.y,angle:this.player.angle}};}
 launch(){if(!this.s.docked)return false;this.s.docked=false;this.player.x=0;this.player.y=185;this.player.angle=Math.PI/2;this.player.vx=0;this.player.vy=0;this.s.tutorial=Math.max(this.s.tutorial,1);this.notify('Departure cleared. Fly safe, pilot.');return true;}
 dock(){if(this.s.docked)return true;if(dist(this.player,this.station)>200){this.target=this.station;this.autopilot();this.notify('Autopilot set for the station.');return false;}this.s.docked=true;this.auto=null;this.scan=null;this.player.vx=this.player.vy=0;this.s.shield=getStats(this.s).shield;if(this.s.data){this.notify(`Survey data sold: +${this.s.data.toLocaleString()} cr`,'good');this.s.credits+=this.s.data;this.s.data=0;}this.claimMissions();this.notify('Docking complete. Welcome aboard.');return true;}
 select(id){this.target=[this.station,...this.planets,this.belt,...this.enemies,...this.asteroids].find(o=>o.id===id)||this.station;this.auto=null;return this.target;}
 autopilot(){if(this.s.docked){this.notify('Launch before engaging autopilot.');return;}if(this.auto){this.auto=null;this.notify('Manual flight.');return;}this.auto=this.target;this.notify('Autopilot → '+this.target.name);}
 scanTarget(){if(this.s.docked){this.notify('Launch and approach a world to scan it.');return false;}const p=this.target?.type==='planet'?this.target:this.planets.reduce((a,b)=>dist(this.player,a)<dist(this.player,b)?a:b);this.target=p;if(this.s.scanned.includes(p.id)){this.notify('This world is already surveyed.');return false;}if(dist(this.player,p)>p.r+650){this.auto=p;this.notify('Approaching scan range. Tap SCAN when you arrive.');return false;}this.scan={id:p.id,progress:0};this.notify('Survey array active. Hold position.');return true;}
 jumpTo(id){if(this.s.docked){this.notify('Launch before jumping.');return false;}if(this.jump)return false;if(id===this.s.system){this.notify('Already in this system.');return false;}if(!SYSTEMS[id])return false;const d=jumpDistance(this.s.system,id),cost=jumpCost(this.s.system,id);if(d>getStats(this.s).range){this.notify('Beyond fold-drive range. Choose a nearer system.');return false;}if(this.s.fuel<cost){this.notify('Not enough fuel. Refuel at the station.');return false;}this.auto=null;this.scan=null;this.jump={id,progress:0,cost};this.notify('Fold drive charging.');return true;}
 buy(good,qty=1){if(!this.s.docked||!GOODS.some(g=>g.id===good)||![1,5].includes(qty))return false;const cost=price(this.sys,good)*qty,free=getStats(this.s).cargo-cargoUsed(this.s),stock=this.stock(good);if(this.s.credits<cost){this.notify('Insufficient credits.');return false;}if(free<qty){this.notify('Cargo hold is full.');return false;}if(stock<qty){this.notify('Station supply is too low.');return false;}this.s.credits-=cost;this.s.cargo[good]+=qty;this.s.stock[`${this.sys.id}:${good}`]=stock-qty;this.notify(`Bought ${qty} t · ${GOODS.find(g=>g.id===good).name}`);return true;}
 sell(good,qty=1){if(!this.s.docked||!GOODS.some(g=>g.id===good)||![1,5].includes(qty))return false;if(this.s.cargo[good]<qty){this.notify('Not enough cargo to sell.');return false;}const value=price(this.sys,good,false)*qty;this.s.cargo[good]-=qty;this.s.credits+=value;this.s.trade+=value;this.s.stock[`${this.sys.id}:${good}`]=this.stock(good)+qty;this.notify(`Sold ${qty} t · +${value.toLocaleString()} cr`,'good');return true;}
 stock(good){return this.s.stock[`${this.sys.id}:${good}`]??40;}
 service(kind){if(!this.s.docked)return false;const st=getStats(this.s),amount=kind==='fuel'?Math.ceil(st.fuel-this.s.fuel):Math.ceil(st.hull-this.s.hull),cost=kind==='fuel'?amount*2:amount*4;if(!amount){this.notify(kind==='fuel'?'Tank already full.':'Hull already repaired.');return false;}if(this.s.credits<cost){this.notify('Insufficient credits. Emergency assistance is available in the flight menu.');return false;}this.s.credits-=cost;if(kind==='fuel')this.s.fuel=st.fuel;else this.s.hull=st.hull;this.notify(kind==='fuel'?'Fuel tanks topped off.':'Hull integrity restored.','good');return true;}
 upgrade(id){if(!this.s.docked)return false;const u=UPGRADES.find(x=>x.id===id);if(!u)return false;const level=this.s.upgrades[id],cost=u.base*(level+1);if(level>=3||this.s.credits<cost)return false;this.s.credits-=cost;this.s.upgrades[id]++;if(id==='shield')this.s.shield=getStats(this.s).shield;this.notify(u.name+' upgraded.','good');return true;}
 buyShip(id){if(!this.s.docked)return false;const b=SHIPS.find(x=>x.id===id);if(!b||id===this.s.ship)return false;const trade=Math.floor(SHIPS.find(x=>x.id===this.s.ship).price*.5),cost=Math.max(0,b.price-trade);if(this.s.credits<cost){this.notify('Insufficient credits.');return false;}if(cargoUsed(this.s)>b.cargo+this.s.upgrades.cargo*6){this.notify('Sell cargo before changing to a smaller ship.');return false;}this.s.credits-=cost;this.s.ship=id;const st=getStats(this.s);this.s.hull=st.hull;this.s.shield=st.shield;this.s.fuel=st.fuel;this.notify('Your '+b.name+' is ready for departure.','good');return true;}
 accept(id){if(!this.s.docked)return false;const m=contractsFor(this.s).find(x=>x.id===id);if(!m)return false;if(this.s.missions.length>=3){this.notify('Finish a contract first. Maximum 3 active.');return false;}if(m.type==='delivery'&&getStats(this.s).cargo-cargoUsed(this.s)<m.tons){this.notify('Free up 3 t of cargo space first.');return false;}this.s.missions.push({...m});this.notify('Contract accepted: '+m.name,'good');return true;}
 abandon(id){const i=this.s.missions.findIndex(m=>m.id===id);if(i<0)return;this.s.missions.splice(i,1);this.notify('Contract released. Sealed cargo returned.');}
 missionReady(m){return m.type==='delivery'?this.s.system===m.destination:this.s.system===m.origin&&(m.type==='survey'?[0,1].every(n=>this.s.scanned.includes(`planet-${m.destination}-${n}`)):m.type==='bounty'?this.s.kills-m.startKills>=2:this.s.cargo.ore>=m.tons);}
 claimMissions(){if(!this.s.docked)return;const done=this.s.missions.filter(m=>this.missionReady(m));for(const m of done){this.s.credits+=m.reward;this.s.contracts++;if(m.type==='mining')this.s.cargo.ore-=m.tons;this.s.completed.push(m.id);this.notify(`Contract fulfilled · +${m.reward.toLocaleString()} cr`,'good');}this.s.missions=this.s.missions.filter(m=>!done.includes(m));}
 rescue(){this.s.credits=Math.max(0,this.s.credits-250);this.s.fuel=getStats(this.s).fuel;this.s.hull=getStats(this.s).hull;this.s.shield=getStats(this.s).shield;this.s.data=0;for(const g of GOODS)this.s.cargo[g.id]=0;this.s.missions=this.s.missions.filter(m=>m.type!=='delivery');this.s.docked=true;this.jump=null;this.makeSystem();this.notify('Recovery complete. Cargo and unsold survey data were lost.');}
 shoot(){const st=getStats(this.s);if(this.fireTimer>0)return;this.fireTimer=.24;let a=this.player.angle;const p=this.player,candidates=[...this.enemies,...this.asteroids].filter(e=>dist(p,e)<620&&Math.abs(angleDiff(Math.atan2(e.y-p.y,e.x-p.x),a))<.44).sort((a,b)=>dist(p,a)-dist(p,b));if(candidates.length){const t=candidates[0];a=Math.atan2(t.y-p.y,t.x-p.x);}this.shots.push({x:p.x+Math.cos(a)*25,y:p.y+Math.sin(a)*25,vx:Math.cos(a)*820+p.vx,vy:Math.sin(a)*820+p.vy,life:.85,enemy:false,damage:st.damage});}
 burst(x,y,color,count=18){for(let i=0;i<count;i++){let a=Math.random()*6.28,v=30+Math.random()*130;this.particles.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:.3+Math.random()*.8,color});}if(this.particles.length>350)this.particles.splice(0,this.particles.length-350);}
 update(dt,input={}){
  dt=clamp(dt,0,.05);this.time+=dt;this.fireTimer-=dt;
  for(const p of this.particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;}this.particles=this.particles.filter(p=>p.life>0);
  for(const f of this.effects)f.life-=dt;this.effects=this.effects.filter(f=>f.life>0);
  if(this.s.docked)return;
  this.s.playtime+=dt;const p=this.player,st=getStats(this.s);
  if(this.jump){this.jump.progress+=dt;if(this.jump.progress>=3){const j=this.jump;this.s.fuel-=j.cost;this.s.system=j.id;if(!this.s.visited.includes(j.id))this.s.visited.push(j.id);this.jump=null;this.makeSystem();this.s.docked=false;this.player.y=650;this.notify('Arrived in '+this.sys.name+'.','good');}return;}
  let thrust=input.thrust||0,boost=!!input.boost,turn=input.turn||0;
  if(Math.abs(turn)>.05||thrust>.05||input.aim!=null)this.auto=null;
  if(input.aim!=null){turn=clamp(angleDiff(input.aim,p.angle)*4,-1,1);}
  if(this.auto){const t=this.auto,d=dist(p,t),stop=t.type==='planet'?t.r+350:t.type==='station'?95:140,desired=Math.atan2(t.y-p.y,t.x-p.x);turn=clamp(angleDiff(desired,p.angle)*3,-1,1);thrust=Math.abs(angleDiff(desired,p.angle))<.9?clamp((d-stop)/340,0,1):0;boost=d>1500;if(d<stop+15){this.auto=null;p.vx*=.2;p.vy*=.2;this.notify(t.type==='station'?'Within docking range. Tap DOCK.':t.type==='planet'?'Within survey range. Tap SCAN.':'Arrived at asteroid field. Fire at rocks to mine.');}}
  p.angle+=turn*st.turn*dt;const max=st.speed*(boost?2.15:1);this.boost=boost&&thrust>.1?1:0;
  if(thrust){p.vx+=Math.cos(p.angle)*thrust*510*dt;p.vy+=Math.sin(p.angle)*thrust*510*dt;}const drag=input.brake?4.5:thrust?1.35:1.55;p.vx*=Math.exp(-drag*dt);p.vy*=Math.exp(-drag*dt);let v=Math.hypot(p.vx,p.vy);if(v>max){p.vx*=max/v;p.vy*=max/v;}p.x+=p.vx*dt;p.y+=p.vy*dt;
  if(input.fire)this.shoot();if(this.s.shield<st.shield&&this.time-this.lastDamage>4)this.s.shield=Math.min(st.shield,this.s.shield+8*dt);
  if(this.scan){const t=this.planets.find(p=>p.id===this.scan.id);if(!t||dist(p,t)>t.r+700){this.scan=null;this.notify('Scan interrupted. Stay within range.');}else{this.scan.progress+=dt;if(this.scan.progress>=3){this.s.scanned.push(t.id);this.s.data+=t.value;this.effects.push({x:t.x,y:t.y,r:t.r,color:'#84f3db',life:2});this.scan=null;this.s.tutorial=Math.max(this.s.tutorial,2);this.notify(`Survey complete · ${t.value.toLocaleString()} cr in data. Sell by docking.`,'good');}}}
  for(const planet of this.planets){const d=dist(p,planet),min=planet.r+35;if(d<min){const a=Math.atan2(p.y-planet.y,p.x-planet.x);p.x=planet.x+Math.cos(a)*min;p.y=planet.y+Math.sin(a)*min;p.vx*=.2;p.vy*=.2;}}
  for(const e of this.enemies){const d=dist(p,e);const safe=dist(p,this.station)<470;if(d<950&&!safe){e.angle=Math.atan2(p.y-e.y,p.x-e.x);const speed=d>210?100+this.sys.danger*10:d<150?-65:15;e.x+=Math.cos(e.angle)*speed*dt;e.y+=Math.sin(e.angle)*speed*dt;e.fire-=dt;if(e.fire<0&&d<600){e.fire=1.1+Math.random()*.6;this.shots.push({x:e.x,y:e.y,vx:Math.cos(e.angle)*330,vy:Math.sin(e.angle)*330,life:2,enemy:true,damage:9+this.sys.danger*2});}}else{e.angle+=dt*.28;e.x+=Math.cos(e.angle)*26*dt;e.y+=Math.sin(e.angle)*26*dt;}}
  for(const b of this.shots){const from={x:b.x,y:b.y};b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;if(b.enemy){if(segmentDistance(p,from,b)<p.r+7){let dam=b.damage,absorb=Math.min(this.s.shield,dam);this.s.shield-=absorb;this.s.hull-=dam-absorb;this.lastDamage=this.time;b.life=0;this.burst(p.x,p.y,'#ef8b7f',6);}}else{for(const t of [...this.enemies,...this.asteroids]){if(t.hp>0&&segmentDistance(t,from,b)<t.r+5){t.hp-=b.damage;b.life=0;this.burst(b.x,b.y,t.type==='enemy'?'#f8a77f':'#8dddcc',5);if(t.hp<=0){this.burst(t.x,t.y,'#ffd297',24);if(t.type==='enemy'){this.s.kills++;this.s.credits+=t.bounty;this.notify(`Bounty confirmed · +${t.bounty} cr`,'good');}else{if(cargoUsed(this.s)<st.cargo){this.s.cargo[t.ore]++;this.s.mined++;this.notify(`${t.ore==='ore'?'Titanium ore':'Void crystal'} collected · 1 t`,'good');}else this.notify('Hold full. Dock to sell your cargo.');}if(this.target?.id===t.id)this.target=this.belt;}break;}}}}
  this.shots=this.shots.filter(b=>b.life>0);this.enemies=this.enemies.filter(e=>e.hp>0);this.asteroids=this.asteroids.filter(e=>e.hp>0);
  if(this.s.hull<=0){const loss=Math.ceil(this.s.credits*.12);this.s.credits=Math.max(0,this.s.credits-loss);for(const g of GOODS)this.s.cargo[g.id]=0;this.s.data=0;this.s.missions=this.s.missions.filter(m=>m.type!=='delivery');this.s.hull=st.hull;this.s.shield=st.shield;this.s.fuel=st.fuel;this.s.docked=true;this.makeSystem();this.notify(`Escape pod recovered. Lost cargo and ${loss.toLocaleString()} cr.`,'bad');}
 }
}
function segmentDistance(p,a,b){const dx=b.x-a.x,dy=b.y-a.y,l=dx*dx+dy*dy,t=l?clamp(((p.x-a.x)*dx+(p.y-a.y)*dy)/l,0,1):0;return Math.hypot(p.x-(a.x+t*dx),p.y-(a.y+t*dy));}

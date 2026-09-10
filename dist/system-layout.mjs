/**
 * Seeded local-space layout: stars, planets, moons, belts, stations.
 * Deterministic from sys.id via the caller’s rng (919+id*311).
 * Planetary Rework 2.8 — physics-constrained kinds, moons, orbital groundwork fields.
 */
export const PLANET_KINDS={
 earthlike:{label:'Earth-like world',class:'terrestrial',landable:true,colors:['#3a7a9a','#4a8f6a','#2f6f88','#5a9a78'],r:[150,215],value:[950,1700],density:[.95,1.2],atmosphere:'breathable',composition:['silicate','water','nitrogen'],temp:'temperate'},
 ocean:{label:'Ocean world',class:'terrestrial',landable:true,colors:['#3d7a9a','#559dac','#2f6f88','#4a8fb0'],r:[150,230],value:[700,1400],density:[.85,1.05],atmosphere:'dense',composition:['water','salt','silicate'],temp:'temperate'},
 arid:{label:'Arid world',class:'terrestrial',landable:true,colors:['#c5755f','#b8895a','#9a6b48','#d4a574'],r:[140,210],value:[650,1250],density:[.9,1.15],atmosphere:'thin',composition:['silicate','iron oxide'],temp:'hot'},
 ice:{label:'Ice world',class:'terrestrial',landable:true,colors:['#a8c4d8','#8eb0c8','#c5d8e6','#7a9bb0'],r:[130,200],value:[750,1350],density:[.7,.95],atmosphere:'thin',composition:['water ice','ammonia','silicate'],temp:'frozen'},
 metal:{label:'Metal-rich world',class:'terrestrial',landable:true,colors:['#8a9098','#6a7080','#a8a0a0','#5a6870'],r:[120,185],value:[900,1650],density:[1.35,1.9],atmosphere:'none',composition:['iron','nickel','heavy metals'],temp:'hot'},
 mineral:{label:'Mineral world',class:'terrestrial',landable:true,colors:['#c68864','#aaa6c6','#bfa976','#8a7a6a'],r:[145,220],value:[800,1500],density:[1.0,1.35],atmosphere:'thin',composition:['silicate','basalt','ore'],temp:'cool'},
 gas:{label:'Gas giant',class:'giant',landable:false,colors:['#c4a06a','#8b6fa8','#d4b896','#6a8a9a'],r:[240,360],value:[900,1600],density:[.12,.28],atmosphere:'hydrogen',composition:['hydrogen','helium','methane'],temp:'cold'},
 icegiant:{label:'Ice giant',class:'giant',landable:false,colors:['#6a9ab8','#7a88b0','#5a88a8','#88a8c0'],r:[210,300],value:[850,1500],density:[.2,.4],atmosphere:'hydrogen',composition:['hydrogen','helium','water ice','methane'],temp:'frozen'}
};

const MOON_KINDS=['mineral','ice','metal','arid'];
const MOON_LETTERS=['a','b','c'];

/** Spectral classes — weighted pick; colors + heat scale scoop/damage feel. */
export const STAR_TYPES={
 O:{label:'blue giant',colors:['#9ec8ff','#b8d8ff','#86b4f0'],heat:1.18,r:[190,250]},
 B:{label:'blue-white',colors:['#c5dcff','#a8c8f0','#d0e4ff'],heat:1.1,r:[175,230]},
 A:{label:'white',colors:['#f0f4ff','#dde8ff','#e8eef8'],heat:1.05,r:[165,215]},
 F:{label:'yellow-white',colors:['#fff4d0','#ffe8b0','#f5e6c0'],heat:1.02,r:[160,210]},
 G:{label:'yellow',colors:['#e9be82','#f0c898','#ffd4a0'],heat:1,r:[155,205]},
 K:{label:'orange',colors:['#e8a060','#d88848','#f0b070'],heat:.92,r:[140,190]},
 M:{label:'red dwarf',colors:['#e07050','#c05040','#d86858'],heat:.82,r:[110,165]}
};

const ROMAN=['I','II','III','IV','V'];

export function seedRng(id){
 let seed=919+id*311;
 return()=>{let t=seed+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};
}

/** Derived RNG from a string so moons never reshuffle planet draws. */
export function hashRng(str){
 let h=2166136261>>>0;
 for(let i=0;i<str.length;i++)h=Math.imul(h^str.charCodeAt(i),16777619)>>>0;
 let seed=(h^0x9e3779b9)>>>0||1;
 return()=>{let t=seed+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};
}

/** Peek layout counts without building full rock arrays (for contracts / chart). */
export function systemLayoutMeta(sys){
 const r=seedRng(sys.id);
 const starCount=pickStarCount(r);
 const planetCount=pickPlanetCount(r,sys);
 const beltCount=pickBeltCount(r,sys);
 const stationCount=pickStationCount(r,sys);
 return{starCount,planetCount,beltCount,stationCount};
}

/** Planet + moon body ids for survey contracts (matches buildSystemLayout). */
export function surveyWorldIds(systemId,sysRow=null){
 const sys=sysRow||{id:systemId,hasStation:true,uncharted:false,danger:1};
 const layout=buildSystemLayout(sys);
 return [...layout.planets,...(layout.moons||[])].map(p=>p.id);
}

export function isLandableBody(p){
 return !!(p&&p.landable!==false&&p.class!=='giant'&&p.kindId!=='gas'&&p.kindId!=='icegiant'&&p.kind!=='Gas giant'&&p.kind!=='Ice giant');
}
export const isLandablePlanet=isLandableBody;

function pickStarCount(r){
 const roll=r();
 if(roll<.05)return 3;
 if(roll<.25)return 2;
 return 1;
}

function pickPlanetCount(r,sys){
 const base=sys.uncharted?1+Math.floor(r()*5):1+Math.floor(r()*4);
 return Math.max(1,Math.min(5,base));
}

function pickBeltCount(r,sys){
 const roll=r();
 if(sys.uncharted&&roll<.22)return 0;
 if(roll<.12)return 0;
 if(roll<.78)return 1;
 return 2;
}

function pickStationCount(r,sys){
 if(!sys.hasStation)return 0;
 if(sys.prison)return 1;
 let n=1;
 if(r()<.28)n=2;
 if(!sys.uncharted&&(sys.danger||0)<=1&&r()<.08)n=3;
 return n;
}

/**
 * Physics-constrained kind pick from orbital index, star class, and RNG.
 * orbitFrac: 0 = innermost, 1 = outermost among this system's planets.
 */
function pickKind(r,index,count,spectral){
 const orbitFrac=count<=1?0.45:index/(count-1);
 const hotStar=spectral==='O'||spectral==='B'||spectral==='A';
 const mildStar=spectral==='F'||spectral==='G'||spectral==='K';
 const coolStar=spectral==='M';
 // Outer worlds: giants more likely
 if(count>1&&index===count-1&&r()<(mildStar?.32:coolStar?.38:.22)){
  return r()<.55?'gas':'icegiant';
 }
 if(orbitFrac>.72&&r()<.4)return r()<.5?'gas':'icegiant';
 // Inner: metal / arid / mineral
 if(orbitFrac<.28){
  const pool=hotStar?['metal','mineral','arid','arid']:['metal','mineral','arid','mineral'];
  return pool[Math.floor(r()*pool.length)];
 }
 // Habitable-band mid orbits near F/G/K
 if(orbitFrac>=.28&&orbitFrac<=.58&&mildStar&&r()<.62){
  return r()<.55?'earthlike':'ocean';
 }
 if(orbitFrac>=.28&&orbitFrac<=.58&&coolStar&&r()<.35)return r()<.5?'ocean':'ice';
 // Mid-outer rocky / ice
 if(orbitFrac>.55){
  const pool=['ice','mineral','arid','ice'];
  return pool[Math.floor(r()*pool.length)];
 }
 const mid=['mineral','arid','ocean','earthlike'];
 return mid[Math.floor(r()*mid.length)];
}

/** Collapse IEEE -0 so position asserts and physics stay stable. */
function nz(v){return v+0;}

function pickStarClass(r,isPrimary){
 const roll=r();
 if(isPrimary){
  if(roll<.03)return 'O';
  if(roll<.08)return 'B';
  if(roll<.18)return 'A';
  if(roll<.32)return 'F';
  if(roll<.52)return 'G';
  if(roll<.78)return 'K';
  return 'M';
 }
 if(roll<.12)return 'A';
 if(roll<.28)return 'F';
 if(roll<.48)return 'G';
 if(roll<.72)return 'K';
 return 'M';
}

function tempBandFor(kindId,def,orbitFrac){
 if(def.temp)return def.temp;
 if(orbitFrac<.25)return 'scorching';
 if(orbitFrac<.5)return 'hot';
 if(orbitFrac<.7)return 'temperate';
 return 'frozen';
}

function bodyPhysics(kindId,def,pr,r,orbitFrac){
 const density=+(def.density[0]+r()*(def.density[1]-def.density[0])).toFixed(3);
 const mass=+((density*Math.pow(pr/180,3))).toFixed(3);
 const gravity=+((mass/Math.pow(Math.max(pr,40)/180,2))).toFixed(2);
 const period=+(Math.sqrt(Math.pow(Math.max(orbitFrac,.05)*8,3))*365).toFixed(1); // fictional days; unused for motion
 return{
  class:def.class,
  density,
  mass,
  gravity,
  tempBand:tempBandFor(kindId,def,orbitFrac),
  atmosphere:def.atmosphere,
  composition:[...def.composition],
  period
 };
}

function makePlanetBody({id,type,name,host,orbit,ang,kindId,r,orbitFrac,parentId=null,seedStr}){
 const def=PLANET_KINDS[kindId];
 const radius=type==='moon'
  ?Math.max(36,Math.round(def.r[0]*.22+r()*(def.r[1]-def.r[0])*.18))
  :def.r[0]+r()*(def.r[1]-def.r[0]);
 const phys=bodyPhysics(kindId,def,radius,r,orbitFrac);
 const ring=type==='planet'&&(kindId==='gas'||kindId==='icegiant'?r()<.85:kindId==='ice'&&r()<.28);
 return{
  id,
  type,
  name,
  x:nz(host.x+Math.cos(ang)*orbit),
  y:nz(host.y+Math.sin(ang)*orbit),
  r:radius,
  color:def.colors[Math.floor(r()*def.colors.length)],
  value:Math.round((def.value[0]+r()*(def.value[1]-def.value[0]))*(type==='moon'?.45:1)),
  kind:type==='moon'?def.label.replace(' world',' moon'):def.label,
  kindId,
  landable:def.landable,
  ring,
  parentId,
  hostStarId:host.id,
  orbitRadius:orbit,
  orbitAngle:ang,
  seed:seedStr,
  moonCount:0,
  ...phys
 };
}

function spawnMoons(planet,systemId,planetIndex){
 const mr=hashRng(planet.id+':moons');
 const giant=planet.class==='giant';
 const chance=giant?.5:.32;
 if(mr()>chance)return[];
 const count=1+(mr()<.35?1:0);
 const moons=[];
 for(let m=0;m<count;m++){
  const kindId=MOON_KINDS[Math.floor(mr()*MOON_KINDS.length)];
  const sep=planet.r*(1.9+mr()*1.4)+40+m*55;
  const ang=mr()*6.28;
  const moon=makePlanetBody({
   id:`moon-${systemId}-${planetIndex}-${m}`,
   type:'moon',
   name:planet.name+' '+MOON_LETTERS[m],
   host:planet,
   orbit:sep,
   ang,
   kindId,
   r:mr,
   orbitFrac:.5,
   parentId:planet.id,
   seedStr:`${planet.id}-m${m}`
  });
  moon.x=nz(planet.x+Math.cos(ang)*sep);
  moon.y=nz(planet.y+Math.sin(ang)*sep);
  moon.hostStarId=planet.hostStarId;
  moon.orbitRadius=sep;
  moon.orbitAngle=ang;
  moons.push(moon);
  planet.moonCount++;
 }
 return moons;
}

/**
 * @param {object} sys catalog system row
 * @param {()=>number} [r] optional rng; defaults to seeded from sys.id
 */
export function buildSystemLayout(sys,r=seedRng(sys.id)){
 const id=sys.id;
 const starCount=pickStarCount(r);
 const planetCount=pickPlanetCount(r,sys);
 const beltCount=pickBeltCount(r,sys);
 const stationCount=pickStationCount(r,sys);
 // Per-system sprawl: some tight, many open so local space isn't always star-hugging.
 const scale=.9+r()*.75;

 const primaryAngle=r()*6.28;
 const stars=[];
 for(let i=0;i<starCount;i++){
  const isPrimary=i===0;
  const sep=isPrimary?0:(1500+r()*1700+(i===2?600:0))*scale;
  const ang=primaryAngle+(isPrimary?0:i===1?r()*6.28:primaryAngle+2.1+r()*.8);
  const cls=pickStarClass(r,isPrimary),def=STAR_TYPES[cls];
  const rad=def.r[0]+r()*(def.r[1]-def.r[0]);
  stars.push({
   id:i===0?'star':`star-${i}`,
   type:'star',
   name:isPrimary?sys.name+' primary':sys.name+(i===1?' companion':' tertiary'),
   x:nz(Math.cos(ang)*sep),
   y:nz(Math.sin(ang)*sep),
   r:rad,
   color:def.colors[Math.floor(r()*def.colors.length)],
   spectral:cls,
   spectralLabel:def.label,
   scoopable:true,
   heat:def.heat*(isPrimary?1:.88+r()*.12),
   primary:isPrimary
  });
 }
 const primary=stars[0];

 const planets=[];
 let orbitCursor=(1600+r()*900)*scale;
 for(let n=0;n<planetCount;n++){
  const orbitFrac=planetCount<=1?0.45:n/(planetCount-1);
  const host=stars.length>1&&r()<.28?stars[Math.floor(r()*stars.length)]:primary;
  const kindId=pickKind(r,n,planetCount,host.spectral||primary.spectral);
  const gap=(950+r()*850)*scale;
  const orbit=orbitCursor+r()*420*scale;
  orbitCursor=orbit+gap;
  const ang=r()*6.28;
  const planet=makePlanetBody({
   id:`planet-${id}-${n}`,
   type:'planet',
   name:sys.name+' '+ROMAN[n],
   host,
   orbit,
   ang,
   kindId,
   r,
   orbitFrac,
   seedStr:`planet-${id}-${n}`
  });
  planets.push(planet);
 }

 // Moons from derived seeds after all planet RNG draws are finished.
 const moons=[];
 for(let n=0;n<planets.length;n++)moons.push(...spawnMoons(planets[n],id,n));

 const belts=[];
 const asteroids=[];
 let rockSeq=0;
 for(let b=0;b<beltCount;b++){
  const ang=r()*6.28,d=(2400+b*1200+r()*1100)*scale;
  const cx=nz(primary.x+Math.cos(ang)*d),cy=nz(primary.y+Math.sin(ang)*d);
  const spread=(520+r()*320)*scale;
  const belt={id:b===0?'belt':`belt-${b}`,type:'belt',name:b===0?'Asteroid field':'Outer debris field',x:cx,y:cy,r:140+r()*80};
  belts.push(belt);
  const rocks=16+Math.floor(r()*14);
  for(let i=0;i<rocks;i++){
   asteroids.push({
    id:'rock-'+rockSeq++,
    type:'asteroid',
    name:'Mineral deposit',
    beltId:belt.id,
    x:nz(cx+(r()-.5)*spread*2.2),
    y:nz(cy+(r()-.5)*spread*1.7),
    r:15+r()*25,
    hp:36,
    ore:r()>.76?'crystal':'ore',
    shape:Array.from({length:9},()=>.72+r()*.35),
    rotation:r()*6.28
   });
  }
 }

 const stations=[];
 if(stationCount>0){
  const roles=[{suffix:'',label:'ORBITAL STATION'},{suffix:' · Mining',label:'MINING OUTPOST'},{suffix:' · Industrial',label:'INDUSTRIAL DOCK'}];
  for(let i=0;i<stationCount;i++){
   const ang=r()*6.28+(i*2.1),d=(i===0?1100+r()*900:2200+r()*1600)*scale;
   const role=roles[Math.min(i,roles.length-1)];
   stations.push({
    id:i===0?'station':`station-${i}`,
    type:'station',
    name:i===0?sys.station:(sys.station+role.suffix),
    roleLabel:role.label,
    x:nz(primary.x+Math.cos(ang)*d),
    y:nz(primary.y+Math.sin(ang)*d),
    r:i===0?65:48+r()*12
   });
  }
 }else{
  stations.push({id:'station',type:'beacon',name:sys.station||'Navigation beacon',roleLabel:'BEACON',x:nz(primary.x+900*scale),y:nz(primary.y+400*scale),r:40});
 }

 const pirateAnchor=belts[0]||{x:nz(primary.x+1600*scale),y:nz(primary.y+1800*scale)};
 const enemies=Array.from({length:sys.danger===0?1:sys.danger+1},(_,i)=>({
  id:'pirate-'+i,type:'enemy',name:['Marauder','Rogue courier','Void raider'][i%3],
  x:nz(pirateAnchor.x+(r()-.5)*950),y:nz(pirateAnchor.y+(r()-.5)*800),
  angle:0,vx:0,vy:0,hp:70+sys.danger*20,max:70+sys.danger*20,r:20,fire:r()*2,
  bounty:420+sys.danger*180,originX:pirateAnchor.x,originY:pirateAnchor.y
 }));

 return{stars,planets,moons,belts,asteroids,stations,enemies,primary:stars[0],homeDock:stations.find(s=>s.type==='station')||stations[0]};
}

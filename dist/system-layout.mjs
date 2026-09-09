/**
 * Seeded local-space layout: stars, planets, belts, stations.
 * Deterministic from sys.id via the caller’s rng (919+id*311).
 */
export const PLANET_KINDS={
 ocean:{label:'Ocean world',landable:true,colors:['#3d7a9a','#559dac','#2f6f88','#4a8fb0'],r:[150,230],value:[700,1400]},
 arid:{label:'Arid world',landable:true,colors:['#c5755f','#b8895a','#9a6b48','#d4a574'],r:[140,210],value:[650,1250]},
 ice:{label:'Ice world',landable:true,colors:['#a8c4d8','#8eb0c8','#c5d8e6','#7a9bb0'],r:[130,200],value:[750,1350]},
 mineral:{label:'Mineral world',landable:true,colors:['#c68864','#aaa6c6','#bfa976','#8a7a6a'],r:[145,220],value:[800,1500]},
 gas:{label:'Gas giant',landable:false,colors:['#c4a06a','#8b6fa8','#d4b896','#6a8a9a'],r:[240,360],value:[900,1600]}
};

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

/** Peek layout counts without building full rock arrays (for contracts / chart). */
export function systemLayoutMeta(sys){
 const r=seedRng(sys.id);
 const starCount=pickStarCount(r);
 const planetCount=pickPlanetCount(r,sys);
 const beltCount=pickBeltCount(r,sys);
 const stationCount=pickStationCount(r,sys);
 return{starCount,planetCount,beltCount,stationCount};
}

export function surveyWorldIds(systemId,sysRow=null){
 const sys=sysRow||{id:systemId,hasStation:true,uncharted:false,danger:1};
 const r=seedRng(systemId);
 pickStarCount(r); // keep draw order aligned with buildSystemLayout
 const count=pickPlanetCount(r,sys);
 return Array.from({length:count},(_,i)=>`planet-${systemId}-${i}`);
}

export function isLandablePlanet(p){return p&&p.landable!==false&&p.kindId!=='gas'&&p.kind!=='Gas giant';}

function seedRng(id){
 let seed=919+id*311;
 return()=>{let t=seed+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};
}

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

function pickKind(r,index,count){
 const landable=['ocean','arid','ice','mineral'];
 if(count>1&&index===count-1&&r()<.28)return 'gas';
 return landable[Math.floor(r()*landable.length)];
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
  const kindId=pickKind(r,n,planetCount),def=PLANET_KINDS[kindId];
  const gap=(950+r()*850)*scale;
  const orbit=orbitCursor+r()*420*scale;
  orbitCursor=orbit+gap;
  const ang=r()*6.28;
  const host=stars.length>1&&r()<.28?stars[Math.floor(r()*stars.length)]:primary;
  const pr=def.r[0]+r()*(def.r[1]-def.r[0]);
  planets.push({
   id:`planet-${id}-${n}`,
   type:'planet',
   name:sys.name+' '+ROMAN[n],
   x:nz(host.x+Math.cos(ang)*orbit),
   y:nz(host.y+Math.sin(ang)*orbit),
   r:pr,
   color:def.colors[Math.floor(r()*def.colors.length)],
   value:Math.round(def.value[0]+r()*(def.value[1]-def.value[0])),
   kind:def.label,
   kindId,
   landable:def.landable,
   ring:kindId==='gas'||(kindId==='ice'&&r()<.35)
  });
 }

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

 return{stars,planets,belts,asteroids,stations,enemies,primary:stars[0],homeDock:stations.find(s=>s.type==='station')||stations[0]};
}

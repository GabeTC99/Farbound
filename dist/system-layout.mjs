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

const ROMAN=['I','II','III','IV','V'];
const STAR_COLORS=['#e9be82','#f0c898','#ffd4a0','#d8a878'];
const COMPANION_COLORS=['#a8c8e8','#90b0d0','#c0d8f0','#7aa0c0','#e8a090'];

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

 const primaryAngle=r()*6.28;
 const stars=[];
 for(let i=0;i<starCount;i++){
  const isPrimary=i===0;
  const sep=isPrimary?0:900+r()*1300+(i===2?400:0);
  const ang=primaryAngle+(isPrimary?0:i===1?r()*6.28:primaryAngle+2.1+r()*.8);
  const rad=isPrimary?170+r()*50:95+r()*55;
  stars.push({
   id:i===0?'star':`star-${i}`,
   type:'star',
   name:isPrimary?sys.name+' primary':sys.name+(i===1?' companion':' tertiary'),
   x:nz(Math.cos(ang)*sep),
   y:nz(Math.sin(ang)*sep),
   r:rad,
   color:isPrimary?STAR_COLORS[id%STAR_COLORS.length]:COMPANION_COLORS[(id+i)%COMPANION_COLORS.length],
   scoopable:true,
   heat:isPrimary?1:.72+r()*.2,
   primary:isPrimary
  });
 }
 const primary=stars[0];

 const planets=[];
 for(let n=0;n<planetCount;n++){
  const kindId=pickKind(r,n,planetCount),def=PLANET_KINDS[kindId];
  const orbit=780+n*(520+r()*180)+r()*200;
  const ang=r()*6.28;
  const host=stars.length>1&&r()<.35?stars[Math.floor(r()*stars.length)]:primary;
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
  const ang=r()*6.28,d=1100+b*700+r()*500;
  const cx=nz(primary.x+Math.cos(ang)*d),cy=nz(primary.y+Math.sin(ang)*d);
  const spread=380+r()*220;
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
   const ang=r()*6.28+(i*2.1),d=i===0?420+r()*180:900+r()*700;
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
  stations.push({id:'station',type:'beacon',name:sys.station||'Navigation beacon',roleLabel:'BEACON',x:nz(primary.x+500),y:nz(primary.y+200),r:40});
 }

 const pirateAnchor=belts[0]||{x:nz(primary.x+800),y:nz(primary.y+1200)};
 const enemies=Array.from({length:sys.danger===0?1:sys.danger+1},(_,i)=>({
  id:'pirate-'+i,type:'enemy',name:['Marauder','Rogue courier','Void raider'][i%3],
  x:nz(pirateAnchor.x+(r()-.5)*950),y:nz(pirateAnchor.y+(r()-.5)*800),
  angle:0,vx:0,vy:0,hp:70+sys.danger*20,max:70+sys.danger*20,r:20,fire:r()*2,
  bounty:420+sys.danger*180,originX:pirateAnchor.x,originY:pirateAnchor.y
 }));

 return{stars,planets,belts,asteroids,stations,enemies,primary:stars[0],homeDock:stations.find(s=>s.type==='station')||stations[0]};
}

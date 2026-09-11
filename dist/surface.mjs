import {PLANET_KINDS} from './system-layout.mjs';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const rng=seed=>()=>{let t=seed+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};
export function terrainAt(x,seed){return 650+Math.sin(x*.003+seed)*70+Math.sin(x*.011+seed*.4)*27+Math.cos(x*.021+seed)*9;}
export function surfaceAltitude(s){return Math.max(0,terrainAt(s.x,s.seed)-19-s.y);}

const KIND_ANOMALIES={
 earthlike:['biosignature','geology','relic','biosignature','signal','geology'],
 ocean:['biosignature','signal','geology','biosignature','relic','signal'],
 arid:['relic','geology','signal','relic','geology','signal'],
 ice:['geology','signal','relic','geology','signal','relic'],
 metal:['geology','geology','signal','relic','geology','signal'],
 mineral:['geology','relic','biosignature','geology','signal','relic']
};
const KIND_NAMES={
 earthlike:{geology:'River-cut mineral bank',relic:'Overgrown survey ruin',biosignature:'Canopy biolume grove',signal:'Atmospheric radio bloom'},
 ocean:{geology:'Shelf mineral crust',relic:'Flooded beacon mast',biosignature:'Luminescent reef bloom',signal:'Sonar ghost return'},
 arid:{geology:'Wind-scoured ore scar',relic:'Buried desert outpost',biosignature:'Dormant spore field',signal:'Sandstorm echo'},
 ice:{geology:'Crevasse ore lens',relic:'Frozen landing frame',biosignature:'Subglacial colony',signal:'Ice-crack radio ping'},
 metal:{geology:'Native metal seam',relic:'Slag-field foundry husk',biosignature:'Heat-vent microbes',signal:'Magnetic interference'},
 mineral:{geology:'Resonant mineral vein',relic:'Buried artificial structure',biosignature:'Bioluminescent colony',signal:'Subsurface radio echo'}
};
const KIND_POI={
 earthlike:'Lush basin shelf',
 ocean:'Tidal shelf',
 arid:'Dune ruin',
 ice:'Ice crevasse',
 metal:'Exposed metal seam',
 mineral:'Basalt terrace'
};

export function createSurface(p,scanned=[],saved=null){
 const parts=p.id.split('-'),seed=+parts[1]*173+ +parts[2]*733+127,r=rng(seed);
 const kindId=p.kindId||'mineral';
 const kinds=KIND_ANOMALIES[kindId]||KIND_ANOMALIES.mineral;
 const names=KIND_NAMES[kindId]||KIND_NAMES.mineral;
 const def=PLANET_KINDS[kindId]||PLANET_KINDS.mineral;
 const anomalies=kinds.map((kind,i)=>{
  const x=850+i*800+r()*250,id=p.id+'-a'+i;
  return{id,kind,name:names[kind]||kind,x,y:terrainAt(x,seed)-10,value:550+Math.round(r()*650),scanned:scanned.includes(id)};
 });
 // Unique landmark POI for this kind (extra anomaly slot flavor, still scannable).
 const poiX=3200+r()*900,poiId=p.id+'-a6';
 anomalies.push({id:poiId,kind:kindId==='metal'||kindId==='mineral'?'geology':kindId==='earthlike'||kindId==='ocean'?'biosignature':'relic',name:KIND_POI[kindId]||'Surface landmark',x:poiX,y:terrainAt(poiX,seed)-10,value:700+Math.round(r()*500),scanned:scanned.includes(poiId),landmark:true});
 return{
  planetId:p.id,planetName:p.name,seed,width:6000,
  kindId,color:p.color||'#87b3ac',kind:p.kind||'Mineral world',
  gravity:p.gravity||1,atmosphere:p.atmosphere||def.atmosphere||'thin',tempBand:p.tempBand||def.temp||'cool',
  readout:`${p.kind||def.label} · g ${((p.gravity||1)).toFixed(2)} · ${(p.atmosphere||def.atmosphere||'thin')} air`,
  x:saved?.x??240,y:saved?.y??440,vx:0,vy:0,
  integrity:saved?.integrity??100,scan:null,throttle:0,landed:false,
  ping:null,pingCooldown:0,hardLand:0,
  anomalies
 };
}
export const nearestAnomaly=s=>s.anomalies.filter(a=>!a.scanned).sort((a,b)=>Math.hypot(a.x-s.x,a.y-s.y)-Math.hypot(b.x-s.x,b.y-s.y))[0]||null;
export function updateSurface(s,dt,input,stats){
 dt=clamp(dt,0,.05);
 let ax=input.surfaceX||0,ay=input.surfaceY||0;
 if(input.aim!=null){ax=Math.cos(input.aim)*(input.thrust||0);ay=Math.sin(input.aim)*(input.thrust||0);}
 else{ax+=input.turn||0;ay+=(input.brake?1:0)-(input.thrust||0);}
 const boost=input.boost?1.65:1;
 const g=clamp(s.gravity||1,.45,1.9);
 // Ice sink, thin-air skim, metal hard landings, arid heat haze feel.
 const ice=s.kindId==='ice',metal=s.kindId==='metal',arid=s.kindId==='arid',thin=s.atmosphere==='thin'||s.atmosphere==='none';
 const thrustScale=(thin?1.12:1)*(ice?.92:1)*(metal?.9:1);
 const drag=1.7*(ice?1.25:1)*(thin?.85:1);
 const liftDrag=2.2*(g*.55+.45);
 s.throttle=Math.min(1,Math.hypot(ax,ay));
 s.vx+=(ax*380*boost*thrustScale-s.vx*drag)*dt;
 s.vy+=(ay*310*boost*thrustScale-s.vy*liftDrag)*dt;
 // Extra downward pull on high-g / metal worlds; floatier skim on thin air.
 s.vy+=((g-1)*42+(metal?18:0)-(thin?12:0))*dt;
 if(arid)s.vx+=(Math.sin((s.x||0)*.01+s.seed)*.6)*dt*40; // heat-haze drift
 s.x=clamp(s.x+s.vx*dt,40,5960);s.y=clamp(s.y+s.vy*dt,55,880);
 const ground=terrainAt(s.x,s.seed)-19;
 const alt=ground-s.y;
 // Landing flare: damp sink rate in the last ~90 m so soft touchdowns are easier.
 const flareAlt=ice?110:90;
 if(alt>0&&alt<flareAlt&&s.vy>18){
  const flare=clamp((flareAlt-alt)/flareAlt,0,1);
  s.vy-=s.vy*flare*(ice?4.2:5.5)*dt;
 }
 if(s.hardLand>0)s.hardLand=Math.max(0,s.hardLand-dt);
 if(s.y>ground){
  const impact=Math.abs(s.vy);s.y=ground;s.vy=0;s.vx*=ice?.88:.96;s.landed=true;
  const threshold=metal?48:ice?58:65;
  if(impact>threshold){s.integrity-=(impact-threshold)*(metal?.16:.12);s.hardLand=.55;}
 }else s.landed=false;
 if(s.pingCooldown>0)s.pingCooldown=Math.max(0,s.pingCooldown-dt);
 if(s.ping){s.ping.life-=dt;if(s.ping.life<=0)s.ping=null;}
 let completed=null;
 if(s.scan){const a=s.anomalies.find(a=>a.id===s.scan.id);if(!a||Math.hypot(a.x-s.x,a.y-s.y)>230+stats.surfaceRange||Math.hypot(s.vx,s.vy)>85)s.scan=null;else{s.scan.progress+=dt*(1+stats.scanSpeed);if(s.scan.progress>=3){a.scanned=true;completed=a;s.scan=null;}}}
 return{completed,crashed:s.integrity<=0};
}

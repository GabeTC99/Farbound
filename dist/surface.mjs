const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const rng=seed=>()=>{let t=seed+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};
export function terrainAt(x,seed){return 650+Math.sin(x*.003+seed)*70+Math.sin(x*.011+seed*.4)*27+Math.cos(x*.021+seed)*9;}
export function surfaceAltitude(s){return Math.max(0,terrainAt(s.x,s.seed)-19-s.y);}
export function createSurface(p,scanned=[],saved=null){
 const parts=p.id.split('-'),seed=+parts[1]*173+ +parts[2]*733+127,r=rng(seed);
 const kinds=['geology','relic','biosignature','geology','signal','relic'];
 const names={geology:'Resonant mineral vein',relic:'Buried artificial structure',biosignature:'Bioluminescent colony',signal:'Subsurface radio echo'};
 return{
  planetId:p.id,planetName:p.name,seed,width:6000,
  kindId:p.kindId||'mineral',color:p.color||'#87b3ac',kind:p.kind||'Mineral world',
  x:saved?.x??240,y:saved?.y??440,vx:0,vy:0,
  integrity:saved?.integrity??100,scan:null,throttle:0,landed:false,
  ping:null,pingCooldown:0,hardLand:0,
  anomalies:kinds.map((kind,i)=>{const x=850+i*800+r()*250,id=p.id+'-a'+i;return{id,kind,name:names[kind],x,y:terrainAt(x,seed)-10,value:550+Math.round(r()*650),scanned:scanned.includes(id)};})
 };
}
export const nearestAnomaly=s=>s.anomalies.filter(a=>!a.scanned).sort((a,b)=>Math.hypot(a.x-s.x,a.y-s.y)-Math.hypot(b.x-s.x,b.y-s.y))[0]||null;
export function updateSurface(s,dt,input,stats){
 dt=clamp(dt,0,.05);
 let ax=input.surfaceX||0,ay=input.surfaceY||0;
 if(input.aim!=null){ax=Math.cos(input.aim)*(input.thrust||0);ay=Math.sin(input.aim)*(input.thrust||0);}
 else{ax+=input.turn||0;ay+=(input.brake?1:0)-(input.thrust||0);}
 const boost=input.boost?1.65:1;
 s.throttle=Math.min(1,Math.hypot(ax,ay));
 s.vx+=(ax*380*boost-s.vx*1.7)*dt;s.vy+=(ay*310*boost-s.vy*2.2)*dt;
 s.x=clamp(s.x+s.vx*dt,40,5960);s.y=clamp(s.y+s.vy*dt,55,880);
 const ground=terrainAt(s.x,s.seed)-19;
 const alt=ground-s.y;
 // Landing flare: damp sink rate in the last ~90 m so soft touchdowns are easier.
 if(alt>0&&alt<90&&s.vy>18){
  const flare=clamp((90-alt)/90,0,1);
  s.vy-=s.vy*flare*5.5*dt;
 }
 if(s.hardLand>0)s.hardLand=Math.max(0,s.hardLand-dt);
 if(s.y>ground){
  const impact=Math.abs(s.vy);s.y=ground;s.vy=0;s.vx*=.96;s.landed=true;
  if(impact>65){s.integrity-=(impact-65)*.12;s.hardLand=.55;}
 }else s.landed=false;
 if(s.pingCooldown>0)s.pingCooldown=Math.max(0,s.pingCooldown-dt);
 if(s.ping){s.ping.life-=dt;if(s.ping.life<=0)s.ping=null;}
 let completed=null;
 if(s.scan){const a=s.anomalies.find(a=>a.id===s.scan.id);if(!a||Math.hypot(a.x-s.x,a.y-s.y)>230+stats.surfaceRange||Math.hypot(s.vx,s.vy)>85)s.scan=null;else{s.scan.progress+=dt*(1+stats.scanSpeed);if(s.scan.progress>=3){a.scanned=true;completed=a;s.scan=null;}}}
 return{completed,crashed:s.integrity<=0};
}

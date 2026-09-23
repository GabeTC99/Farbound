/** Local on-foot pocket around a landed skiff for planetary space legs (FB-013). */
import {SURFACE_PALETTES} from './surface-render.mjs';

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const rng=seed=>()=>{let t=seed+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};

function zone(id,label,service,x,y,r,icon,extra={}){return{id,label,service,x,y,r,icon,...extra};}

const CACHE_GOOD={ocean:'meds',arid:'ore',ice:'tech',mineral:'ore',gas:'crystal'};

/** Nearby unscanned anomalies within world range become inspect pads. */
export function createPlanetLayout(surface){
 const W=980,H=720;
 const pal=SURFACE_PALETTES[surface.kindId]||SURFACE_PALETTES.mineral;
 const r=rng((surface.seed|0)^0x51f00d^(Math.round(surface.x)|0));
 const skiffX=170,skiffY=H*0.62;
 const nearby=surface.anomalies
  .filter(a=>!a.scanned&&Math.abs(a.x-surface.x)<=450)
  .sort((a,b)=>Math.abs(a.x-surface.x)-Math.abs(b.x-surface.x))
  .slice(0,3);
 const zones=[
  zone('skiff','Skiff','board',skiffX,skiffY,54,'ship',{board:true})
 ];
 nearby.forEach((a,i)=>{
  const span=W*0.42/450;
  const x=clamp(W*0.52+(a.x-surface.x)*span+(i-1)*18,210,W-90);
  const y=clamp(H*0.38+(i%2?70:-40)+((a.id.charCodeAt(a.id.length-1)%5)-2)*22,130,H-110);
  zones.push(zone(a.id,a.name,'inspect',x,y,46,'data',{anomalyId:a.id,anomalyKind:a.kind}));
 });
 const walls=[];
 for(let i=0;i<5;i++){
  const wx=90+r()* (W-220),wy=90+r()*(H-220),ww=36+r()*70,hh=28+r()*55;
  if(Math.hypot(wx+ww/2-skiffX,wy+hh/2-skiffY)<120)continue;
  if(zones.some(z=>Math.hypot(wx+ww/2-z.x,wy+hh/2-z.y)<z.r+40))continue;
  walls.push({x:wx,y:wy,w:ww,h:hh});
 }
 // ~50% of sites with rocks get a one-shot salvage cache.
 if(walls.length&&r()<.5){
  let placed=false;
  for(let tries=0;tries<8&&!placed;tries++){
   const cx=220+r()*(W-320),cy=140+r()*(H-260);
   if(Math.hypot(cx-skiffX,cy-skiffY)<130)continue;
   if(zones.some(z=>Math.hypot(cx-z.x,cy-z.y)<z.r+50))continue;
   zones.push(zone('cache','Salvage cache','cache',cx,cy,42,'market',{cacheGood:CACHE_GOOD[surface.kindId]||'ore'}));
   placed=true;
  }
 }
 const signs=nearby.map((a,i)=>{
  const z=zones.find(z=>z.anomalyId===a.id);if(!z)return null;
  const ang=Math.atan2(z.y-skiffY,z.x-skiffX);
  return{kind:'chevron',x:skiffX+Math.cos(ang)*90,y:skiffY+Math.sin(ang)*90,angle:ang,accent:i===0};
 }).filter(Boolean);
 return{
  kind:'planet',
  title:surface.planetName||'Surface site',
  role:'surface',
  accent:pal.accent||surface.color||'#87b3ac',
  floor:pal.floor||'#142c31',
  kindId:surface.kindId||'mineral',
  width:W,height:H,
  hull:null,
  walls,
  windows:[],
  signs,
  zones,
  spawn:{x:skiffX+70,y:skiffY-10,facing:0},
  npcs:[]
 };
}

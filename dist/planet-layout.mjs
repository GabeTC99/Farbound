/** Local on-foot pocket around a landed skiff for planetary space legs (FB-013). */
import {SURFACE_PALETTES} from './surface-render.mjs';

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const rng=seed=>()=>{let t=seed+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};

function zone(id,label,service,x,y,r,icon,extra={}){return{id,label,service,x,y,r,icon,...extra};}

const CACHE_GOOD={earthlike:'food',ocean:'meds',arid:'ore',ice:'tech',metal:'crystal',mineral:'ore',volcanic:'ore',barren:'ore',toxic:'meds',gas:'crystal',icegiant:'tech'};

/** Nearby unscanned anomalies within world range become inspect pads. */
export function createPlanetLayout(surface){
 const W=980,H=720;
 const pal=SURFACE_PALETTES[surface.kindId]||SURFACE_PALETTES.mineral;
 const r=rng((surface.seed|0)^0x51f00d^(Math.round(surface.x)|0));
 const skiffX=220,skiffY=H*0.58;
 const nearby=surface.anomalies
  .filter(a=>!a.scanned&&Math.abs(a.x-surface.x)<=450)
  .sort((a,b)=>Math.abs(a.x-surface.x)-Math.abs(b.x-surface.x))
  .slice(0,3);
 const zones=[
  zone('skiff','Skiff','board',skiffX,skiffY,58,'ship',{board:true})
 ];
 nearby.forEach((a,i)=>{
  const x=clamp(skiffX+175+i*155+(a.x-surface.x)*.05,skiffX+160,W-90);
  const y=skiffY+((i%2)?18:-16);
  zones.push(zone(a.id,a.name,'inspect',x,y,48,'data',{anomalyId:a.id,anomalyKind:a.kind}));
 });
 const walls=[];
 for(let i=0;i<5;i++){
  const along=120+r()*(W-260);
  const side=r()<.5?-1:1;
  const ww=26+r()*34,hh=20+r()*26;
  const wx=along-ww/2,wy=skiffY+side*(78+r()*70)-hh/2;
  if(wy<70||wy>H-80)continue;
  if(Math.hypot(wx+ww/2-skiffX,wy+hh/2-skiffY)<140)continue;
  if(zones.some(z=>Math.hypot(wx+ww/2-z.x,wy+hh/2-z.y)<z.r+52))continue;
  walls.push({x:wx,y:wy,w:ww,h:hh,rock:true});
 }
 if(walls.length&&r()<.5){
  let placed=false;
  for(let tries=0;tries<8&&!placed;tries++){
   const cx=skiffX+170+r()*420,cy=skiffY+((r()<.5)?-22:22);
   if(Math.hypot(cx-skiffX,cy-skiffY)<140)continue;
   if(zones.some(z=>Math.hypot(cx-z.x,cy-z.y)<z.r+52))continue;
   zones.push(zone('cache','Salvage cache','cache',cx,cy,42,'market',{cacheGood:CACHE_GOOD[surface.kindId]||'ore'}));
   placed=true;
  }
 }
 const signs=nearby.map((a,i)=>{
  const z=zones.find(z=>z.anomalyId===a.id);if(!z)return null;
  const ang=Math.atan2(z.y-skiffY,z.x-skiffX);
  return{kind:'chevron',x:skiffX+Math.cos(ang)*88,y:skiffY+Math.sin(ang)*88,angle:ang,accent:i===0};
 }).filter(Boolean);
 return{
  kind:'planet',
  title:surface.planetName||'Surface site',
  role:'surface',
  accent:pal.accent||surface.color||'#87b3ac',
  floor:pal.floor||'#142c31',
  kindId:surface.kindId||'mineral',
  seed:surface.seed??0,
  width:W,height:H,
  hull:null,
  walls,
  windows:[],
  signs,
  zones,
  spawn:{x:skiffX+70,y:skiffY,facing:0},
  npcs:[]
 };
}

import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SHIPS,SYSTEMS,Game} from '../dist/frontier.mjs';
import {HULL_DEFS,getHullDef,hullPreviewSvg as hullSvg} from '../dist/hull-defs.mjs';
import {CLASS_ART,HULL_CLASS,NPC_HULLS,NPC_KINDS,PLAYER_HULL_IDS,resolveHull,hullPreviewSvg,sampleShipColor,meanShipColor,colorDistance,shipLimb,drawCraft} from '../dist/ship-render.mjs';

assert.equal(SHIPS.length,20);
assert.equal(Object.keys(HULL_DEFS).length,20);
assert.equal(PLAYER_HULL_IDS.length,20);
for(const ship of SHIPS){
 assert.equal(HULL_CLASS[ship.id],ship.class,ship.id+' class map');
 assert(CLASS_ART[ship.class],ship.class+' needs class art');
 assert(Array.isArray(getHullDef(ship.id).body)&&getHullDef(ship.id).body.length>=5);
 const {def,classId}=resolveHull(ship.id);
 assert.equal(classId,ship.class);
 assert.equal(def,HULL_DEFS[ship.id]);
 const svg=hullPreviewSvg(ship);
 assert.match(svg,/ship-preview/);
 assert.match(svg,/<polygon /);
 assert.match(svg,/linearGradient/);
 assert.match(svg,/radialGradient/);
 assert.match(svg,/hull-thick/);
 assert.match(svg,/heat-tiles/);
 assert.match(svg,/engine-bell/);
 assert.match(svg,/canopy/);
 assert.match(svg,/<rect /);
 assert.doesNotMatch(svg,/#d8fff8/);
 if(ship.class==='explorer')assert.match(svg,/antenna|sensor|radiator/,ship.id+' explorer kit');
 if(ship.class==='trader')assert.match(svg,/cargo-bay|clamp/,ship.id+' trader kit');
 if(ship.class==='combat')assert.match(svg,/hardpoint/,ship.id+' combat kit');
 const fallback=hullSvg(ship);
 assert.match(fallback,/ship-preview/);
 assert.match(fallback,/<polygon /);
 assert.match(fallback,/hull-thick/);
 assert.doesNotMatch(fallback,/#d8fff8/);
}

for(const kind of NPC_KINDS){
 assert(NPC_HULLS[kind].body.length>=5,kind+' hull');
 assert(CLASS_ART[kind],kind+' needs art');
}

const pairs=[['explorer','combat'],['trader','scout'],['miner','courier'],['security','pirate'],['freighter','surveyor']];
const means=Object.fromEntries(Object.keys(CLASS_ART).map(id=>[id,meanShipColor(id)]));
for(const [a,b] of pairs){
 const d=colorDistance(means[a],means[b]);
 assert(d>12,a+' vs '+b+' materials too similar ('+d.toFixed(1)+')');
}
assert(means.combat[0]>means.explorer[0],'combat reads warmer than explorers');
assert(means.explorer[2]>means.miner[2],'explorers stay cooler than miners');
assert.notEqual(shipLimb('combat'),shipLimb('trader'));
assert.notEqual(sampleShipColor('pirate',-.4,-.4)[0],sampleShipColor('security',-.4,-.4)[0]);

const bodies=SHIPS.map(s=>JSON.stringify(HULL_DEFS[s.id].body));
assert.equal(new Set(bodies).size,20,'each player hull keeps a unique silhouette');

function hullHalfY(body,x){
 let max=0,hit=false;
 for(let i=0;i<body.length;i++){
  const a=body[i],b=body[(i+1)%body.length];
  const lo=Math.min(a[0],b[0]),hi=Math.max(a[0],b[0]);
  if(x+1e-5<lo||x-1e-5>hi)continue;
  hit=true;
  if(Math.abs(b[0]-a[0])<1e-5){max=Math.max(max,Math.abs(a[1]),Math.abs(b[1]));continue;}
  const t=(x-a[0])/(b[0]-a[0]);
  max=Math.max(max,Math.abs(a[1]+(b[1]-a[1])*t));
 }
 return hit?max:0;
}
function assertAttached(id,def){
 for(const [nx,ny] of def.nozzles||[]){
  const hy=hullHalfY(def.body,nx);
  assert(hy+0.06>=Math.abs(ny),id+' nozzle '+ny+' off hull (half='+hy.toFixed(3)+')');
 }
 for(const [hx,hy] of def.hardpoints||[]){
  const half=hullHalfY(def.body,hx);
  assert(half+0.05>=Math.abs(hy),id+' hardpoint off hull');
 }
 for(const p of def.parts||[]){
  if(p.type==='arc')assert(hullHalfY(def.body,p.x)+0.1>=Math.abs(p.y),id+' dish off hull');
 }
}
for(const ship of SHIPS)assertAttached(ship.id,HULL_DEFS[ship.id]);
for(const kind of NPC_KINDS)assertAttached(kind,NPC_HULLS[kind]);

let flames=0,grads=0;
const ctx=new Proxy({},{get:(_,key)=>key==='lineTo'?((x)=>{if(x<-31)flames++;}):key==='createLinearGradient'||key==='createRadialGradient'?(()=>{grads++;return{addColorStop(){}};}):()=>{},set:()=>true});
drawCraft(ctx,{kind:'eagle',size:26,thrust:0,lite:true,clock:0});
assert.equal(flames,0);
assert.equal(grads,0,'performance ship paint must not allocate gradients');
drawCraft(ctx,{kind:'eagle',size:26,thrust:1,lite:true,clock:0});
assert(flames>=1);
assert.equal(grads,0);
drawCraft(ctx,{kind:'eagle',size:26,thrust:0,lite:false,clock:0});
assert.ok(grads>=1,'high ship paint still uses lighting gradients');

const app=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
assert.match(app,/dev-ship/);
assert.match(app,/Fleet atlas/);
assert.match(app,/drawCraft/);
assert.match(app,/drawSecurityCraft/);
assert.match(app,/drawTrafficCraft/);
assert.match(app,/drawEnemyCraft/);
assert.match(app,/from '\.\/ship-render\.mjs'/);
assert.match(app,/pixelScale:worldPx\(\)/);

const g=new Game();
g.s.credits=250000;g.s.docked=true;
assert(g.buyShip('eagle'));
assert.equal(g.s.ship,'eagle');
assert.equal(g.player.r,24);
g.launch();
assert(!g.s.docked);

console.log('PASS Fleet atlas: 20 hulls, '+NPC_KINDS.length+' NPC kinds, grounded metal stays distinct');
console.log('PASS Hangar previews use class kits, framed canopies, and recessed bells');

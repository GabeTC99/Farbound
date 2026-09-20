import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Game,SYSTEMS,buildSystemLayout,isLandableBody,PLANET_KINDS,PLANET_KIND_IDS,pickPlanetKind,findBodyOfKind} from '../dist/frontier.mjs';
import {PLANET_ART,samplePlanetColor,meanPlanetColor,colorDistance,luma,planetLimb} from '../dist/planet-render.mjs';
import {SURFACE_PALETTES} from '../dist/surface-render.mjs';
import {createSurface} from '../dist/surface.mjs';

const ticks=(g,seconds,input={})=>{for(let t=0;t<seconds;t+=1/30)g.update(1/30,input);};

function seqRng(values){let i=0;return()=>values[Math.min(i++,values.length-1)];}

const kinds=new Set(),giants=new Set(),landables=new Set();
let earthlikeOnHotInner=0,giantLandable=0,earthlikeGiant=0;
for(const sys of SYSTEMS){
 const layout=buildSystemLayout(sys);
 const primary=layout.primary;
 for(const p of layout.planets){
  kinds.add(p.kindId);
  const def=PLANET_KINDS[p.kindId];
  assert(def,p.kindId+' missing from PLANET_KINDS');
  assert.equal(p.class,def.class);
  assert.equal(p.landable,def.landable);
  assert.equal(isLandableBody(p),def.landable);
  if(p.class==='giant'){
   giants.add(p.kindId);
   assert(['gas','icegiant'].includes(p.kindId));
   assert.equal(p.landable,false);
   assert(p.composition.includes('hydrogen'));
   if(p.kindId==='earthlike'||p.kind==='Earth-like world')earthlikeGiant++;
   if(p.landable)giantLandable++;
  }else{
   landables.add(p.kindId);
   assert.notEqual(p.kindId,'gas');
   assert.notEqual(p.kindId,'icegiant');
  }
  if(p.kindId==='earthlike'){
   assert.equal(p.atmosphere,'breathable');
   assert(p.composition.includes('water'));
   const host=layout.stars.find(s=>s.id===p.hostStarId)||primary;
   const hot=host.spectral==='O'||host.spectral==='B'||host.spectral==='A';
   const idx=layout.planets.indexOf(p);
   const frac=layout.planets.length<=1?0.45:idx/(layout.planets.length-1);
   if(hot&&frac<.28)earthlikeOnHotInner++;
  }
 }
 for(const m of layout.moons){
  kinds.add(m.kindId);
  assert(isLandableBody(m));
  assert.notEqual(m.kindId,'earthlike');
  assert.notEqual(m.kindId,'ocean');
  assert.notEqual(m.kindId,'gas');
 }
}

console.log('PASS Chart kinds stay physically typed: '+[...kinds].sort().join(', '));
assert.equal(earthlikeGiant,0,'no Earth-like gas giants');
assert.equal(giantLandable,0,'giants are never landable');
assert.equal(earthlikeOnHotInner,0,'no Earth-likes on hot inner orbits');
assert(kinds.has('volcanic')&&kinds.has('barren')&&kinds.has('toxic'),'new atlas kinds appear');
assert(kinds.has('earthlike')&&kinds.has('gas')&&kinds.has('icegiant'));
assert(kinds.size>=9,'expected a galaxy-atlas spread of kinds');
assert(giants.size===2);
assert(landables.size>=7);

assert.equal(pickPlanetKind(seqRng([0,0]),2,3,'G'),'gas');
assert.equal(pickPlanetKind(seqRng([0]),0,3,'A'),'volcanic');
assert.equal(pickPlanetKind(seqRng([.3,.2]),1,3,'G'),'earthlike');
assert.equal(pickPlanetKind(seqRng([.3,.8]),1,3,'G'),'ocean');
assert.notEqual(pickPlanetKind(seqRng([0]),0,3,'A'),'earthlike');

for(const id of PLANET_KIND_IDS){
 assert(PLANET_ART[id],id+' needs art features');
 assert(SURFACE_PALETTES[id],id+' needs a surface palette');
 assert(findBodyOfKind(id,SYSTEMS),id+' must exist somewhere on the chart');
}
assert.equal(PLANET_ART.earthlike.features.includes('continents'),true);
assert.equal(PLANET_ART.gas.features.includes('bands'),true);
assert.equal(PLANET_ART.volcanic.features.includes('lava'),true);
assert.equal(PLANET_ART.barren.haze,0);
assert.ok(PLANET_ART.toxic.haze>.7);
assert.ok(planetLimb('earthlike')!==planetLimb('arid'));

const means=Object.fromEntries(PLANET_KIND_IDS.map(id=>[id,meanPlanetColor(id,11)]));
const pairs=[['earthlike','arid'],['ocean','volcanic'],['ice','gas'],['barren','toxic'],['metal','earthlike'],['icegiant','arid']];
for(const [a,b] of pairs){
 const d=colorDistance(means[a],means[b]);
 assert(d>28,a+' vs '+b+' look too similar ('+d.toFixed(1)+')');
}
let latDiff=0,lngDiff=0;
for(const seed of [1,3,5,7,11]){
 const a=samplePlanetColor('gas',seed,0,-.42),b=samplePlanetColor('gas',seed,0,.18),c=samplePlanetColor('gas',seed,.22,-.42);
 latDiff+=colorDistance(a,b);lngDiff+=colorDistance(a,c);
}
assert(latDiff>lngDiff*1.15,'gas giants should band by latitude more than longitude');
const pole=samplePlanetColor('earthlike',7,0,-.92),eq=samplePlanetColor('earthlike',7,0,0);
assert(luma(pole)>luma(eq)-8,'earth-like poles read as ice');
let lava=0;
for(const seed of [2,5,9])for(let x=-.6;x<=.6;x+=.12)for(let y=-.6;y<=.6;y+=.12){
 const c=samplePlanetColor('volcanic',seed,x,y);if(c&&c[0]>c[2]+40&&c[0]>140)lava++;
}
assert(lava>=8,'volcanic worlds keep lava highlights');
const ocean=means.ocean,arid=means.arid;
assert(ocean[2]>ocean[0],'oceans stay blue-dominant');
assert(arid[0]>arid[2],'arid worlds stay rust-dominant');

const g=new Game();g.launch();
const giant=findBodyOfKind('gas',SYSTEMS)||findBodyOfKind('icegiant',SYSTEMS);
assert(giant);
g.teleportTo(giant.sys.id,{docked:false});
if(!g.s.systemScans.includes(giant.sys.id))g.s.systemScans.push(giant.sys.id);
const gp=g.planets.find(p=>p.id===giant.body.id);assert(gp);assert(!isLandableBody(gp));
g.target=gp;g.player.x=gp.x;g.player.y=gp.y+gp.r+300;g.player.vx=g.player.vy=0;
assert(!g.land());

const volcanic=findBodyOfKind('volcanic',SYSTEMS);assert(volcanic);
g.teleportTo(volcanic.sys.id,{docked:false});
if(!g.s.systemScans.includes(volcanic.sys.id))g.s.systemScans.push(volcanic.sys.id);
const vp=g.planets.find(p=>p.id===volcanic.body.id);assert(vp);assert(isLandableBody(vp));
g.target=vp;g.player.x=vp.x;g.player.y=vp.y+vp.r+300;g.player.vx=g.player.vy=0;
assert(g.land());
assert.equal(g.surface.kindId,'volcanic');
assert(createSurface(vp).anomalies.length>=6);
assert(g.takeoff());
assert(!g.surface);
g.player.x=g.station.x;g.player.y=g.station.y+40;
if(g.sys.hasStation)assert(g.dock());

const app=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
assert.match(app,/dev-planet/);
assert.match(app,/Planet atlas/);
assert.ok(!/function drawLandmasses/.test(app));

console.log('PASS Planet atlas kinds stay distinct, landable rules hold, and DEV hops work');
console.log('PASS '+PLANET_KIND_IDS.length+' kinds classified and painted without Earth-like giants');

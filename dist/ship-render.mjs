/**
 * Grounded spacecraft paint for local space and hangar.
 * Geometry stays in hull-defs; this module adds class kits, materials, and physical engines.
 */
import {HULL_DEFS,getHullDef} from './hull-defs.mjs';
import {worldStroke,strokeSilhouette} from './flight-loop.mjs';
let paintScale=1;
const lw=px=>worldStroke(px,paintScale);

export const CLASS_ART={
 explorer:{metal:[92,108,118],plate:[148,166,176],shadow:[30,36,42],glass:'#14343c',sheen:.42,rim:'#7ad9c8',heat:[108,68,50]},
 scout:{metal:[88,106,90],plate:[140,160,132],shadow:[28,34,26],glass:'#1a3820',sheen:.36,rim:'#9bc978',heat:[102,72,46]},
 trader:{metal:[108,96,78],plate:[168,148,116],shadow:[36,30,24],glass:'#2a2418',sheen:.28,rim:'#c4a574',heat:[118,80,50]},
 miner:{metal:[104,90,72],plate:[158,136,104],shadow:[34,28,22],glass:'#282018',sheen:.22,rim:'#b8956a',heat:[124,78,46]},
 courier:{metal:[84,106,118],plate:[136,166,180],shadow:[28,36,42],glass:'#123440',sheen:.4,rim:'#6ebfd4',heat:[100,70,52]},
 combat:{metal:[112,84,82],plate:[170,128,122],shadow:[38,26,26],glass:'#2a1818',sheen:.46,rim:'#d47868',heat:[132,72,48]},
 security:{metal:[80,96,114],plate:[128,150,172],shadow:[26,32,40],glass:'#142836',sheen:.38,rim:'#3b8cff',heat:[94,66,54]},
 pirate:{metal:[118,80,80],plate:[174,118,116],shadow:[40,24,26],glass:'#2c1416',sheen:.34,rim:'#ee918b',heat:[136,68,46]},
 freighter:{metal:[110,96,76],plate:[170,148,112],shadow:[36,30,24],glass:'#2a2216',sheen:.24,rim:'#d2b48c',heat:[120,82,52]},
 prospector:{metal:[106,90,70],plate:[164,138,100],shadow:[36,28,22],glass:'#2a2014',sheen:.2,rim:'#d4a067',heat:[128,80,46]},
 tender:{metal:[100,90,76],plate:[160,142,110],shadow:[34,28,24],glass:'#282016',sheen:.26,rim:'#e0b07a',heat:[124,82,52]},
 surveyor:{metal:[84,110,106],plate:[136,170,162],shadow:[28,38,36],glass:'#143832',sheen:.36,rim:'#8fd6c2',heat:[98,72,50]}
};

export const HULL_CLASS={
 wren:'explorer',sparrow:'scout',rook:'miner',mule:'trader',tern:'courier',
 magpie:'trader',jackal:'combat',kestrel:'explorer',mole:'miner',osprey:'explorer',
 falcon:'combat',albatross:'explorer',ox:'trader',vulture:'combat',heron:'explorer',
 badger:'miner',raptor:'combat',condor:'explorer',goliath:'trader',eagle:'combat'
};

const KIT={
 explorer:{antenna:1,radiators:1,rcs:1,clamps:1,sensors:1},
 scout:{antenna:1,rcs:1,nacelle:1},
 trader:{cargo:1,clamps:1,radiators:1,rcs:1},
 miner:{radiators:1,clamps:1,rcs:1},
 courier:{antenna:1,rcs:1,tanks:1},
 combat:{hardpoints:1,intakes:1,rcs:1},
 security:{antenna:1,hardpoints:1,rcs:1},
 pirate:{hardpoints:1,rcs:1,junk:1},
 freighter:{cargo:1,clamps:1,radiators:1},
 prospector:{radiators:1,rcs:1},
 tender:{clamps:1,rcs:1},
 surveyor:{antenna:1,sensors:1,rcs:1}
};

const stroke=(pts,alpha=.55)=>({type:'stroke',pts,alpha});
const rect=(x,y,w,h,alpha=.5)=>({type:'rect',x,y,w,h,alpha});
const boom=(pts)=>({type:'poly',pts,alpha:1});
const dish=(x,y,r)=>({type:'arc',x,y,r,alpha:.9});
const accentBar=(x,y,w,h)=>({type:'accent',x,y,w,h,alpha:.7});

export const NPC_HULLS={
 security:{
  body:[[1.18,0],[.32,.36],[-.12,.82],[-.42,.74],[-.28,.36],[-1.0,.36],[-1.12,.2],[-1.12,-.2],[-1.0,-.36],[-.28,-.36],[-.42,-.74],[-.12,-.82],[.32,-.36]],
  parts:[stroke([[.55,0],[-.25,0]]),rect(-.2,-.1,.5,.2),stroke([[-.1,.4],[.2,.15]]),stroke([[-.1,-.4],[.2,-.15]])],
  nozzles:[[-1.12,.14],[-1.12,-.14]],cockpit:{x:.35,rx:4.2,ry:2.8},lights:{y:.72,pair:['#ff3b4a','#3b8cff']},
  hardpoints:[[-.22,.66],[-.22,-.66]],
  accents:[accentBar(-.05,-.12,7,4.8)]
 },
 pirate:{
  body:[[1.26,0],[.28,.38],[-.14,.86],[-.44,.78],[-.3,.36],[-1.0,.38],[-1.12,.22],[-1.12,-.22],[-1.0,-.38],[-.3,-.36],[-.44,-.78],[-.14,-.86],[.28,-.38]],
  parts:[stroke([[.48,0],[-.22,0]]),rect(-.18,-.1,.48,.2),stroke([[.02,.52],[.26,.2]]),stroke([[.02,-.52],[.26,-.2]])],
  nozzles:[[-1.12,.16],[-1.12,-.16]],cockpit:{x:.42,rx:4.2,ry:2.6},lights:{y:.74},
  hardpoints:[[-.2,.7],[-.2,-.7]],
  accents:[accentBar(-.04,.72,6,1.8),accentBar(-.04,-.72-1.8/18,6,1.8)]
 },
 courier:{
  body:[[1.4,0],[.22,.32],[-.62,.24],[-1.08,.12],[-1.08,-.12],[-.62,-.24],[.22,-.32]],
  parts:[stroke([[.7,0],[-.3,0]]),rect(-.2,-.08,.55,.16)],
  nozzles:[[-1.08,0]],cockpit:{x:.48,rx:3.6,ry:2.2},lights:{y:.26},accents:[]
 },
 freighter:{
  body:[[.98,0],[.28,.7],[-.4,.84],[-.95,.66],[-1.12,.46],[-1.12,.2],[-.82,.08],[-.82,-.08],[-1.12,-.2],[-1.12,-.46],[-.95,-.66],[-.4,-.84],[.28,-.7]],
  parts:[stroke([[-.15,-.4],[-.15,.4]]),stroke([[.25,-.35],[.25,.35]]),rect(-.45,-.42,.55,.84)],
  nozzles:[[-1.12,.34],[-1.12,-.34]],cockpit:{x:.28,rx:5,ry:3.4},lights:{y:.62},accents:[]
 },
 prospector:{
  body:[[1.02,0],[.26,.62],[-.5,.7],[-.98,.5],[-1.1,.26],[-1.1,-.26],[-.98,-.5],[-.5,-.7],[.26,-.62]],
  parts:[boom([[.16,.24],[.58,.42],[.48,.56],[.08,.4]]),stroke([[-.2,0],[-.7,0]]),rect(-.25,-.12,.4,.24)],
  nozzles:[[-1.1,.16],[-1.1,-.16]],cockpit:{x:.22,rx:4.4,ry:3},lights:{y:.52},accents:[]
 },
 tender:{
  body:[[1.08,0],[.22,.52],[-.48,.64],[-1.0,.42],[-1.12,.18],[-1.12,-.18],[-1.0,-.42],[-.48,-.64],[.22,-.52]],
  parts:[stroke([[.2,0],[-.55,0]]),rect(-.15,-.1,.42,.2),{type:'scoop',alpha:.7}],
  nozzles:[[-1.12,.12],[-1.12,-.12]],cockpit:{x:.32,rx:4.6,ry:3},lights:{y:.5},accents:[]
 },
 surveyor:{
  body:[[1.18,0],[.22,.4],[-.1,.54],[-.06,.68],[-.32,.62],[-.36,.3],[-1.02,.28],[-1.12,.12],[-1.12,-.12],[-1.02,-.28],[-.36,-.3],[-.1,-.54],[.22,-.4]],
  parts:[stroke([[.55,0],[-.2,0]]),rect(-.15,-.08,.48,.16),dish(-.16,.5,.14)],
  nozzles:[[-1.12,.08],[-1.12,-.08]],cockpit:{x:.42,rx:4.4,ry:2.8},lights:{y:.5},accents:[]
 }
};

export const NPC_KINDS=Object.keys(NPC_HULLS);
export const PLAYER_HULL_IDS=Object.keys(HULL_DEFS);

function artOf(classId){return CLASS_ART[classId]||CLASS_ART.explorer;}
function kitOf(classId){return KIT[classId]||KIT.explorer;}

function hexRgb(h){
 const n=String(h||'#88a').replace('#','');
 const s=n.length===3?n.split('').map(c=>c+c).join(''):n.padEnd(6,'0');
 return[parseInt(s.slice(0,2),16)||0,parseInt(s.slice(2,4),16)||0,parseInt(s.slice(4,6),16)||0];
}
function rgbHex(r,g,b){return '#'+[r,g,b].map(v=>Math.max(0,Math.min(255,v|0)).toString(16).padStart(2,'0')).join('');}
function mix(A,B,t){t=t<0?0:t>1?1:t;return[A[0]+(B[0]-A[0])*t,A[1]+(B[1]-A[1])*t,A[2]+(B[2]-A[2])*t];}
function mixHex(a,b,t){return rgbHex(...mix(hexRgb(a),hexRgb(b),t));}
function rgbOf(c){return`rgb(${c[0]|0},${c[1]|0},${c[2]|0})`;}
function withAlpha(hex,a){
 const n=Math.round(Math.max(0,Math.min(1,a))*255).toString(16).padStart(2,'0');
 return (hex.length===7?hex:hex.slice(0,7))+n;
}
function rgba(c,a){return`rgba(${c[0]|0},${c[1]|0},${c[2]|0},${a})`;}

function pathBody(ctx,body,size,ox=0,oy=0){
 ctx.beginPath();
 body.forEach(([x,y],i)=>{const px=x*size+ox,py=y*size+oy;if(i)ctx.lineTo(px,py);else ctx.moveTo(px,py);});
 ctx.closePath();
}
function scaleBody(body,s){return body.map(([x,y])=>[x*s,y*s]);}
function hullHalfY(body,x){
 let max=0,hit=false;
 for(let i=0;i<body.length;i++){
  const a=body[i],b=body[(i+1)%body.length];
  const x0=a[0],x1=b[0],lo=Math.min(x0,x1),hi=Math.max(x0,x1);
  if(x+1e-5<lo||x-1e-5>hi)continue;
  hit=true;
  if(Math.abs(x1-x0)<1e-5){max=Math.max(max,Math.abs(a[1]),Math.abs(b[1]));continue;}
  const t=(x-x0)/(x1-x0);
  max=Math.max(max,Math.abs(a[1]+(b[1]-a[1])*t));
 }
 if(!hit){
  let best=1e9;
  for(const [px,py] of body){
   const d=Math.abs(px-x);
   if(d<best){best=d;max=Math.abs(py);}
   else if(Math.abs(d-best)<1e-6)max=Math.max(max,Math.abs(py));
  }
 }
 return max;
}
function wingMounts(def){
 if(def.hardpoints?.length)return def.hardpoints;
 let tip=def.body[0];
 for(const p of def.body)if(Math.abs(p[1])>Math.abs(tip[1]))tip=p;
 const y=Math.abs(tip[1])*.82,x=tip[0]*.55+(-.18);
 return[[x,y],[x,-y]];
}
function roundBox(ctx,x,y,w,h,r=1.6){
 ctx.beginPath();
 ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);
 ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
 ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);
 ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.closePath();
}

export function resolveHull(kind){
 if(kind&&NPC_HULLS[kind])return{def:NPC_HULLS[kind],classId:kind};
 if(kind&&HULL_DEFS[kind])return{def:HULL_DEFS[kind],classId:HULL_CLASS[kind]||'explorer'};
 return{def:HULL_DEFS.wren,classId:'explorer'};
}

function thickOf(size){return{x:Math.max(1.4,size*.07),y:Math.max(1.8,size*.1)};}

const beamGrads=new Map(),sunGrads=new Map();
const GRAD_MAX=64;
function cachedGrad(map,key,make){
 let g=map.get(key);
 if(g){map.delete(key);map.set(key,g);return g;}
 g=make();
 if(!g)return null;
 map.set(key,g);
 if(map.size>GRAD_MAX)map.delete(map.keys().next().value);
 return g;
}
function hullBeam(ctx,size,art,sheen,hull){
 const key=(size|0)+'|'+art.shadow[0]+'|'+art.plate[0]+'|'+(hull[0]|0)+'|'+((sheen*40)|0);
 return cachedGrad(beamGrads,key,()=>{
  const beam=ctx.createLinearGradient?.(0,-size,0,size);
  if(!beam?.addColorStop)return null;
  beam.addColorStop(0,rgba(art.shadow,.52));
  beam.addColorStop(.28,rgba(art.plate,.55+sheen*.16));
  beam.addColorStop(.52,rgba(hull,0));
  beam.addColorStop(1,rgba(art.shadow,.7));
  return beam;
 });
}
function hullSun(ctx,size,lx,ly,sheen){
 const ang=Math.atan2(ly,lx),q=Math.round(ang/(Math.PI/8));
 const a=q*(Math.PI/8),ux=Math.cos(a),uy=Math.sin(a);
 const key=(size|0)+'|'+q+'|'+((sheen*40)|0);
 return cachedGrad(sunGrads,key,()=>{
  const sun=ctx.createLinearGradient?.(-ux*size,-uy*size,ux*size,uy*size);
  if(!sun?.addColorStop)return null;
  sun.addColorStop(0,`rgba(255,255,255,${.24+sheen*.1})`);
  sun.addColorStop(.18,`rgba(255,255,255,.08)`);
  sun.addColorStop(.45,'rgba(0,0,0,0)');
  sun.addColorStop(1,`rgba(0,4,10,.38)`);
  return sun;
 });
}

function drawFlames(ctx,def,size,thrust,boost,lite){
 if(thrust<=.04)return;
 const len=(lite?9:(10+Math.random()*(boost?52:18)))*thrust;
 const core=boost?'#e8fff8':'#b8fff0',mid=boost?'#6ee8d4':'#4ec8b0';
 const scale=def.nozzles.length>1?.85:1;
 for(const [nx,ny] of def.nozzles){
  const x=nx*size-1.5,y=ny*size;
  ctx.fillStyle=mid;ctx.globalAlpha=.38;
  ctx.beginPath();ctx.moveTo(x,y-1.8);ctx.lineTo(x-len*scale,y);ctx.lineTo(x,y+1.8);ctx.fill();
  ctx.fillStyle=core;ctx.globalAlpha=.68;
  ctx.beginPath();ctx.moveTo(x,y-.9);ctx.lineTo(x-len*scale*.56,y);ctx.lineTo(x,y+.9);ctx.fill();
 }
 if(boost){ctx.globalAlpha=.16;ctx.fillStyle=core;ctx.beginPath();ctx.arc(-size-len*.3,0,6+thrust*7,0,6.28);ctx.fill();}
 ctx.globalAlpha=1;
}

function drawExtrusion(ctx,body,size,tx,ty,fill){
 ctx.fillStyle=fill;
 for(let i=0;i<body.length;i++){
  const a=body[i],b=body[(i+1)%body.length];
  ctx.beginPath();
  ctx.moveTo(a[0]*size,a[1]*size);
  ctx.lineTo(b[0]*size,b[1]*size);
  ctx.lineTo(b[0]*size+tx,b[1]*size+ty);
  ctx.lineTo(a[0]*size+tx,a[1]*size+ty);
  ctx.closePath();
  ctx.fill();
 }
}

function drawBells(ctx,def,size,art,thrust){
 const hot=art.heat||[96,60,42];
 for(const [nx,ny] of def.nozzles||[]){
  const face=nx*size,y=ny*size;
  const local=Math.max(3.2,hullHalfY(def.body,nx)*size*1.55);
  const hh=Math.min(Math.max(3.6,size*.14),local);
  const inset=Math.max(6.2,size*.28);
  ctx.fillStyle=rgbOf(mix(art.shadow,art.metal,.42));
  ctx.beginPath();
  ctx.moveTo(face+inset,y-hh*.32);
  ctx.lineTo(face+1.4,y-hh*.5);
  ctx.lineTo(face+1.4,y+hh*.5);
  ctx.lineTo(face+inset,y+hh*.32);
  ctx.closePath();ctx.fill();
  ctx.strokeStyle=rgbOf(art.shadow);ctx.lineWidth=lw(1);ctx.stroke();
  ctx.fillStyle=rgbOf(mix(art.metal,art.shadow,.2));
  ctx.fillRect(face-.55,y-hh*.46,Math.max(4.2,size*.16),hh*.92);
  ctx.strokeStyle=rgbOf(art.shadow);ctx.strokeRect(face-.55,y-hh*.46,Math.max(4.2,size*.16),hh*.92);
  ctx.fillStyle=rgba(art.shadow,.55);
  ctx.beginPath();ctx.ellipse(face,y,hh*.42,hh*.36,0,0,6.28);ctx.fill();
  ctx.fillStyle=rgbOf(mix(hot,art.shadow,.15));
  ctx.beginPath();ctx.ellipse(face,y,hh*.34,hh*.28,0,0,6.28);ctx.fill();
  ctx.strokeStyle=rgbOf(mix(hot,[200,140,90],.45));ctx.stroke();
  ctx.fillStyle='#080606';
  ctx.beginPath();ctx.ellipse(face-.55,y,hh*.18,hh*.14,0,0,6.28);ctx.fill();
  ctx.fillStyle=rgba([180,255,230],thrust>.04?.4+thrust*.3:.12);
  ctx.beginPath();ctx.ellipse(face-.35,y,hh*.1,hh*.08,0,0,6.28);ctx.fill();
 }
}

function drawParts(ctx,def,size,art){
 for(const p of def.parts||[]){
  ctx.globalAlpha=1;ctx.strokeStyle=rgbOf(mix(art.plate,art.shadow,.35));ctx.fillStyle=rgbOf(mix(art.metal,art.shadow,.15));
  if(p.type==='stroke'){ctx.globalAlpha=p.alpha??.4;ctx.lineWidth=lw(1);ctx.beginPath();p.pts.forEach(([x,y],i)=>{const px=x*size,py=y*size;if(i)ctx.lineTo(px,py);else ctx.moveTo(px,py);});ctx.stroke();}
  else if(p.type==='rect'){
   const x=p.x*size,y=p.y*size,w=p.w*size,h=p.h*size;
   ctx.fillStyle=rgbOf(art.shadow);ctx.fillRect(x+1.3,y+1.6,w,h);
   const g=ctx.createLinearGradient?.(x,y,x,y+h);
   if(g?.addColorStop){g.addColorStop(0,rgbOf(art.plate));g.addColorStop(.45,rgbOf(art.metal));g.addColorStop(1,rgbOf(art.shadow));ctx.fillStyle=g;}
   else ctx.fillStyle=rgbOf(art.metal);
   ctx.fillRect(x,y,w,h);
   ctx.strokeStyle=rgbOf(art.shadow);ctx.strokeRect(x,y,w,h);
   ctx.strokeStyle=rgba(art.shadow,.45);ctx.lineWidth=lw(.8);
   ctx.beginPath();ctx.moveTo(x+w*.5,y);ctx.lineTo(x+w*.5,y+h);ctx.moveTo(x,y+h*.5);ctx.lineTo(x+w,y+h*.5);ctx.stroke();
  }
  else if(p.type==='poly'){
   pathBody(ctx,p.pts,size,1.2,1.5);ctx.fillStyle=rgbOf(art.shadow);ctx.fill();
   pathBody(ctx,p.pts,size);ctx.fillStyle=rgbOf(mix(art.metal,art.plate,.25));ctx.fill();ctx.strokeStyle=rgbOf(art.shadow);ctx.stroke();
  }
  else if(p.type==='arc'){
   const ax=p.x*size,ay=p.y*size,r=p.r*size;
   const rootY=Math.sign(ay||1)*hullHalfY(def.body,p.x)*size*.72;
   ctx.strokeStyle=rgbOf(mix(art.metal,art.shadow,.25));ctx.lineWidth=lw(Math.max(1.6,size*.06));
   ctx.beginPath();ctx.moveTo(ax,rootY);ctx.lineTo(ax,ay);ctx.stroke();
   ctx.fillStyle=rgbOf(mix(art.metal,art.shadow,.15));
   ctx.beginPath();ctx.arc(ax,rootY,Math.max(1.4,r*.22),0,6.28);ctx.fill();
   ctx.beginPath();ctx.arc(ax+.8,ay+1.1,r,0,6.28);ctx.fillStyle=rgbOf(art.shadow);ctx.fill();
   ctx.beginPath();ctx.arc(ax,ay,r,0,6.28);ctx.fillStyle=rgbOf(mix(art.metal,art.plate,.35));ctx.fill();
   ctx.strokeStyle=rgbOf(art.shadow);ctx.stroke();
   ctx.beginPath();ctx.arc(ax-r*.22,ay-r*.28,r*.32,0,6.28);ctx.fillStyle=rgba([220,236,248],.16);ctx.fill();
   ctx.beginPath();ctx.arc(ax,ay,r*.18,0,6.28);ctx.fillStyle=rgbOf(art.shadow);ctx.fill();
  }
  else if(p.type==='scoop'){
   const sx=-size*.72,sy=size*.22;
   ctx.fillStyle=rgbOf(mix(art.metal,art.shadow,.2));
   ctx.beginPath();ctx.moveTo(-size*.2,sy);ctx.lineTo(sx,sy*.55);ctx.lineTo(sx,-sy*.55);ctx.lineTo(-size*.2,-sy);ctx.closePath();ctx.fill();
   ctx.strokeStyle=rgbOf(mix(art.heat,art.metal,.35));ctx.lineWidth=lw(1.4);
   ctx.beginPath();ctx.moveTo(-size*.18,sy);ctx.quadraticCurveTo(sx-size*.08,0,-size*.18,-sy);ctx.stroke();
  }
  ctx.globalAlpha=1;
 }
}

function drawPanels(ctx,def,size,art,lite){
 ctx.save();
 pathBody(ctx,def.body,size);ctx.clip();
 ctx.strokeStyle=rgba(art.shadow,.55);ctx.lineWidth=lw(1.15);
 ctx.beginPath();ctx.moveTo(size*.7,0);ctx.lineTo(-size*.48,0);ctx.stroke();
 if(!lite){
  ctx.strokeStyle=rgba(art.shadow,.38);ctx.lineWidth=lw(.8);
  ctx.beginPath();
  ctx.moveTo(size*.3,-size*.18);ctx.lineTo(-size*.3,-size*.14);
  ctx.moveTo(size*.3,size*.18);ctx.lineTo(-size*.3,size*.14);
  ctx.moveTo(size*.2,-size*.55);ctx.lineTo(size*.2,size*.55);
  ctx.moveTo(-size*.12,-size*.5);ctx.lineTo(-size*.12,size*.5);
  ctx.stroke();
  ctx.strokeStyle=rgba(art.plate,.16);ctx.lineWidth=lw(.6);
  for(let i=0;i<6;i++){
   const y=-size*.22+i*(size*.08);
   ctx.beginPath();ctx.moveTo(-size*.35,y);ctx.lineTo(size*.45,y);ctx.stroke();
  }
  for(let i=0;i<9;i++){
   ctx.fillStyle=rgba(art.shadow,.55);
   ctx.fillRect(-size*.3+i*(size*.09),-1.1,1.2,1.2);
   ctx.fillRect(-size*.3+i*(size*.09),size*.16,1.1,1.1);
  }
  const tw=size*.1,th=size*.14,x0=-size*.96,y0=-size*.42;
  for(let col=0;col<3;col++)for(let row=0;row<5;row++){
   ctx.fillStyle=rgba(art.heat,.26+(col+row)%2*.14);
   ctx.fillRect(x0+col*tw,y0+row*th,tw-0.7,th-0.7);
  }
 }
 else{
  ctx.fillStyle=rgba(art.heat,.3);
  ctx.fillRect(-size*1.02,-size*.5,size*.32,size);
 }
 ctx.restore();
}

function drawVolume(ctx,def,size,art,lx,ly,sheen,lite,hostile){
 const hull=hostile?mix(art.metal,[78,28,30],.28):art.metal;
 if(lite){
  // Performance LOD: fill + one device-locked hairline. Skip extrusion,
  // per-frame gradients, clip, and the 2.16.3 double silhouette stroke.
  ctx.fillStyle=rgba([0,0,0],.28);
  ctx.beginPath();ctx.ellipse(2,3,size*1.05,size*.32,0,0,6.28);ctx.fill();
  ctx.fillStyle=rgbOf(hull);
  pathBody(ctx,def.body,size);ctx.fill();
  ctx.strokeStyle=rgbOf(mix(art.shadow,hull,.18));
  ctx.lineWidth=lw(1.3);
  pathBody(ctx,def.body,size);ctx.stroke();
  return;
 }
 const {x:tx,y:ty}=thickOf(size);
 ctx.fillStyle=rgba([0,0,0],.34);
 ctx.beginPath();ctx.ellipse(2.4,ty+3,size*1.12,size*.38,0,0,6.28);ctx.fill();
 drawExtrusion(ctx,def.body,size,tx,ty,rgbOf(mix(art.shadow,[8,10,12],.22)));
 ctx.fillStyle=rgbOf(art.shadow);
 pathBody(ctx,def.body,size,tx,ty);ctx.fill();
 ctx.fillStyle=rgbOf(hull);
 pathBody(ctx,def.body,size);ctx.fill();
 ctx.save();
 pathBody(ctx,def.body,size);ctx.clip();
 const beam=hullBeam(ctx,size,art,sheen,hull);
 if(beam){ctx.fillStyle=beam;ctx.fill();}
 const sun=hullSun(ctx,size,lx,ly,sheen);
 if(sun){ctx.fillStyle=sun;ctx.fill();}
 ctx.strokeStyle=rgba([230,240,248],.2);
 ctx.lineWidth=lw(1.1);
 ctx.beginPath();ctx.moveTo(-size*.2,-size*.12);ctx.lineTo(size*.55,-size*.22);ctx.stroke();
 ctx.fillStyle=rgbOf(mix(hull,art.plate,.38));
 pathBody(ctx,scaleBody(def.body,.7),size,-.7,-1);ctx.globalAlpha=.42;ctx.fill();ctx.globalAlpha=1;
 ctx.restore();
 ctx.strokeStyle=rgbOf(mix(art.shadow,hull,.18));
 ctx.lineWidth=lw(1.3);
 pathBody(ctx,def.body,size);strokeSilhouette(ctx,paintScale);
}

function drawCanopy(ctx,def,size,art,lite){
 if(!def.cockpit)return;
 const c=def.cockpit,x=c.x*size,rx=Math.max(c.rx,size*.16),ry=Math.max(c.ry*.9,size*.09);
 if(lite){
  ctx.fillStyle=art.glass;
  ctx.beginPath();ctx.ellipse(x,0,rx,ry,0,0,6.28);ctx.fill();
  ctx.strokeStyle=rgbOf(art.shadow);ctx.lineWidth=lw(1.1);ctx.stroke();
  return;
 }
 const w=rx*2.35,h=ry*2.2;
 ctx.fillStyle=rgba(art.shadow,.55);
 ctx.beginPath();ctx.ellipse(x+1.4,1.8,rx+2.4,ry+2,0,0,6.28);ctx.fill();
 ctx.fillStyle=rgbOf(mix(art.plate,art.metal,.35));
 roundBox(ctx,x-w/2,-h/2,w,h,2);ctx.fill();
 ctx.strokeStyle=rgbOf(art.shadow);ctx.lineWidth=lw(1.25);ctx.stroke();
 ctx.fillStyle=art.glass;
 roundBox(ctx,x-w/2+2,-h/2+1.6,w-4,h-3.2,1.2);ctx.fill();
 ctx.fillStyle=rgba([8,16,20],.5);
 roundBox(ctx,x-w/2+3.2,-h/2+2.6,w-6.6,h-5,1);ctx.fill();
 ctx.strokeStyle=rgba(art.plate,.45);ctx.lineWidth=lw(.8);
 ctx.beginPath();ctx.moveTo(x-w*.1,-h/2+1.6);ctx.lineTo(x,h/2-1.6);
 ctx.moveTo(x+w*.2,-h/2+1.6);ctx.lineTo(x+w*.28,h/2-1.6);ctx.stroke();
 ctx.fillStyle=rgba([210,232,242],.28);
 ctx.beginPath();ctx.ellipse(x-w*.2,-h*.2,w*.18,h*.16,0,0,6.28);ctx.fill();
}

function drawKit(ctx,def,size,art,classId,lite){
 const kit=kitOf(classId);
 const plate=rgbOf(mix(art.metal,art.plate,.35)),shade=rgbOf(art.shadow);
 if(kit.radiators){
  const rx=-.22,w=size*.42,h=Math.max(2.4,size*.08);
  const hy=hullHalfY(def.body,rx)*size;
  for(const s of[-1,1]){
   const x=rx*size,y=s*(hy-h*.45);
   ctx.fillStyle=shade;ctx.fillRect(x+w*.32,y+(s>0?-1.6:h-.2),w*.22,1.8);
   ctx.fillStyle=shade;ctx.fillRect(x+1.1,y+s*1.1,w,h);
   ctx.fillStyle=rgbOf(mix(art.heat,art.metal,.45));ctx.fillRect(x,y,w,h);
   ctx.strokeStyle=shade;ctx.strokeRect(x,y,w,h);
   if(!lite){ctx.strokeStyle=rgba(art.shadow,.5);for(let i=1;i<5;i++){ctx.beginPath();ctx.moveTo(x+w*i/5,y);ctx.lineTo(x+w*i/5,y+h);ctx.stroke();}}
  }
 }
 if(kit.antenna){
  const bx=-.14,hy=hullHalfY(def.body,bx)*size;
  const tipY=-Math.min(hy*.82,size*.32);
  ctx.fillStyle=shade;ctx.beginPath();ctx.arc(bx*size+0.6,1.1,2.1,0,6.28);ctx.fill();
  ctx.fillStyle=plate;ctx.beginPath();ctx.arc(bx*size,0,2.2,0,6.28);ctx.fill();ctx.strokeStyle=shade;ctx.stroke();
  ctx.strokeStyle=rgbOf(mix(art.plate,art.shadow,.3));ctx.lineWidth=lw(1.4);
  ctx.beginPath();ctx.moveTo(bx*size,0);ctx.lineTo(bx*size,tipY);ctx.stroke();
  ctx.fillStyle=plate;ctx.beginPath();ctx.arc(bx*size,tipY,1.5,0,6.28);ctx.fill();
 }
 if(kit.sensors){
  const ax=.1,hy=hullHalfY(def.body,ax)*size,ay=-hy*.55,r=Math.max(2.4,size*.07);
  ctx.fillStyle=shade;ctx.beginPath();ctx.arc(ax*size+.6,ay+1,r,0,6.28);ctx.fill();
  ctx.fillStyle=plate;ctx.beginPath();ctx.arc(ax*size,ay,r,0,6.28);ctx.fill();ctx.strokeStyle=shade;ctx.stroke();
  ctx.fillStyle=rgba([200,230,240],.2);ctx.beginPath();ctx.arc(ax*size-r*.25,ay-r*.28,r*.35,0,6.28);ctx.fill();
 }
 if(kit.cargo){
  const hx=hullHalfY(def.body,-.2)*size;
  const h=Math.min(size*.5,hx*1.55),w=size*.48,x=-size*.4,y=-h/2;
  ctx.fillStyle=shade;ctx.fillRect(x+1.2,y+1.4,w,h);
  ctx.fillStyle=rgbOf(mix(art.metal,art.plate,.15));ctx.fillRect(x,y,w,h);
  ctx.strokeStyle=shade;ctx.strokeRect(x,y,w,h);
  ctx.strokeStyle=rgba(art.shadow,.55);
  ctx.beginPath();ctx.moveTo(x+w*.5,y);ctx.lineTo(x+w*.5,y+h);ctx.moveTo(x,y+h*.5);ctx.lineTo(x+w,y+h*.5);ctx.stroke();
  if(!lite){ctx.fillStyle=rgbOf(mix(art.shadow,art.metal,.4));ctx.fillRect(x+2,y-2.2,4,2.4);ctx.fillRect(x+w-6,y-2.2,4,2.4);}
 }
 if(kit.clamps&&!lite){
  const cx=.1,hy=hullHalfY(def.body,cx)*size;
  for(const s of[-1,1]){
   const x=cx*size,y=s*hy*.88;
   ctx.strokeStyle=plate;ctx.lineWidth=lw(1.4);
   ctx.beginPath();ctx.moveTo(x,y-s*2);ctx.lineTo(x-2,y-s*5);ctx.lineTo(x-5,y-s*2);ctx.stroke();
  }
 }
 if(kit.hardpoints){
  const mounts=wingMounts(def);
  const bh=Math.max(2.4,size*.08),bw=size*.22,bar=size*.18;
  for(const [mx,my] of mounts){
   const x=mx*size,y=my*size,inY=y*.58;
   ctx.fillStyle=rgbOf(mix(art.metal,art.shadow,.25));
   ctx.beginPath();ctx.moveTo(x+bw*.15,inY);ctx.lineTo(x-bw*.12,y-bh*.15);ctx.lineTo(x+bw*.55,y+bh*.15);ctx.closePath();ctx.fill();
   ctx.fillStyle=shade;ctx.fillRect(x-bw*.12+1,y-bh/2+1.1,bw,bh);
   ctx.fillStyle=rgbOf(mix(art.metal,art.shadow,.2));ctx.fillRect(x-bw*.15,y-bh/2,bw,bh);
   ctx.strokeStyle=shade;ctx.strokeRect(x-bw*.15,y-bh/2,bw,bh);
   ctx.fillStyle=plate;ctx.fillRect(x+bw*.55,y-Math.max(1.2,size*.03)/2,bar,Math.max(1.2,size*.035));
  }
 }
 if(kit.intakes&&!lite){
  const ix=.48,hy=hullHalfY(def.body,ix)*size;
  const h=Math.min(size*.08,hy*.45);
  ctx.fillStyle=rgba(art.shadow,.65);
  ctx.fillRect(ix*size,-h-1.2,size*.16,h);
  ctx.fillRect(ix*size,1.2,size*.16,h);
 }
 if(kit.rcs){
  const spots=[[.5,.22],[-.32,.24],[.5,-.22],[-.32,-.24]];
  for(const [nx,ny] of spots){
   const hy=hullHalfY(def.body,nx)*size*.82;
   const y=Math.sign(ny)*Math.min(Math.abs(ny)*size,hy);
   ctx.fillStyle='#1a2026';ctx.fillRect(nx*size-1.4,y-1.4,2.8,2.8);
   ctx.fillStyle=rgbOf(mix(art.plate,art.shadow,.4));ctx.fillRect(nx*size-1,y-1,2,2);
  }
 }
 if(kit.nacelle){
  ctx.fillStyle=shade;ctx.fillRect(-size*.25,1.2,size*.7,3.2);
  ctx.fillStyle=plate;ctx.fillRect(-size*.3,-1.6,size*.7,3.2);
  ctx.strokeStyle=shade;ctx.strokeRect(-size*.3,-1.6,size*.7,3.2);
 }
 if(kit.tanks&&!lite){
  const tx=-.4,hy=hullHalfY(def.body,tx)*size;
  for(const s of[-1,1]){
   const y=s*Math.min(size*.16,hy*.55);
   ctx.fillStyle=shade;ctx.fillRect(tx*size+1,y+1,size*.28,size*.1);
   ctx.fillStyle=rgbOf(mix(art.metal,art.plate,.2));ctx.fillRect(tx*size,y,size*.28,size*.1);
  }
 }
 if(kit.junk&&!lite){
  const hy=hullHalfY(def.body,-.05)*size;
  ctx.fillStyle=rgbOf(mix(art.heat,art.shadow,.4));
  ctx.fillRect(-size*.05,Math.min(size*.22,hy*.6),size*.18,size*.1);
 }
}

function drawNavLights(ctx,def,size,clock,opts){
 if(!def.lights)return;
 const ly2=def.lights.y*size,blink=((clock*2.6)%1)<.5,pair=def.lights.pair;
 ctx.fillStyle='#141a20';ctx.fillRect(-2.6,ly2-1.2,5,5);ctx.fillRect(-2.6,-ly2-3.8,5,5);
 if(pair){
  const flash=Math.floor(clock*(opts.alert?10:6))%2===0;
  ctx.fillStyle=flash?pair[0]:'#3a2024';ctx.fillRect(-1.6,ly2,2.6,2.6);
  ctx.fillStyle=flash?'#243038':pair[1];ctx.fillRect(-1.6,-ly2-2.6,2.6,2.6);
 }else{
  ctx.fillStyle=blink?'#b84444':'#322828';ctx.fillRect(-1.6,ly2,2.6,2.6);
  ctx.fillStyle=blink?'#243028':'#3d8a58';ctx.fillRect(-1.6,-ly2-2.6,2.6,2.6);
 }
}

export function drawCraft(ctx,opts={}){
 const kind=opts.kind||opts.id||'wren';
 const {def,classId}=resolveHull(kind);
 const art=artOf(opts.classId||classId);
 const size=opts.size||19,accent=opts.accent||art.rim;
 const thrust=opts.thrust||0,boost=!!opts.boost,clock=opts.clock||0,lite=!!opts.lite;
 const lx=opts.lightX??-1,ly=opts.lightY??-.75;
 paintScale=opts.pixelScale||1;
 ctx.lineJoin='round';ctx.lineCap='round';
 drawFlames(ctx,def,size,thrust,boost,lite);
 drawVolume(ctx,def,size,art,lx,ly,art.sheen,lite,!!opts.hostile);
 drawPanels(ctx,def,size,art,lite);
 if(!lite){
  drawParts(ctx,def,size,art);
  drawKit(ctx,def,size,art,opts.classId||classId,lite);
  drawBells(ctx,def,size,art,thrust);
 }
 if(opts.drawCockpit!==false)drawCanopy(ctx,def,size,art,lite);
 if(opts.drawLights!==false)drawNavLights(ctx,def,size,clock,opts);
 for(const a of def.accents||[]){
  if(def.lights?.pair&&a===def.accents[0])continue;
  ctx.fillStyle=withAlpha(accent,.35);ctx.fillRect(a.x*size,a.y*size,a.w,Math.max(1.2,a.h*.6));
 }
}

export function drawHullLit(ctx,def,size,color,accent,opts={}){
 drawCraft(ctx,{...opts,kind:opts.kind||opts.id,size,color,accent});
}
export function drawPlayerCraft(ctx,ship,opts={}){
 const id=ship.id||ship;
 drawCraft(ctx,{kind:id,size:opts.size||ship.size||19,color:opts.color||ship.color,accent:opts.accent||ship.accent,...opts});
}
export function drawSecurityCraft(ctx,opts={}){
 drawCraft(ctx,{kind:'security',size:opts.size||18,color:opts.color||'#9eb7bd',accent:opts.hostile?'#ee918b':'#3b8cff',hostile:!!opts.hostile,alert:!!opts.alert,...opts});
}
export function drawTrafficCraft(ctx,tr,opts={}){
 drawCraft(ctx,{kind:tr.hull||'courier',size:tr.size||12,color:tr.color||'#647d94',accent:tr.color,...opts,thrust:opts.thrust??tr.thrust??0});
}
export function drawEnemyCraft(ctx,opts={}){
 drawCraft(ctx,{kind:'pirate',size:opts.size||20,color:opts.color||'#ee918b',accent:'#d47868',hostile:true,...opts});
}

function kitSvg(def,art,classId,ox,oy,sc,metal,plate,shadow,heat){
 const kit=kitOf(classId);
 const bits=[];
 if(kit.radiators){
  const rx=-.22,w=sc*.42,h=Math.max(3.2,sc*.08),hy=hullHalfY(def.body,rx)*sc;
  for(const s of[-1,1]){
   const x=ox+rx*sc,y=oy+s*(hy-h*.45);
   bits.push(`<g class="radiator"><rect x="${(x+w*.32).toFixed(1)}" y="${(y+(s>0?-1.6:h-.2)).toFixed(1)}" width="${(w*.22).toFixed(1)}" height="1.8" fill="${shadow}"/><rect x="${(x+1).toFixed(1)}" y="${(y+s*1.2).toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" fill="${shadow}"/><rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" fill="${mixHex(heat,metal,.55)}" stroke="${shadow}" stroke-width=".7"/>${[1,2,3].map(i=>`<line x1="${(x+w*i/4).toFixed(1)}" y1="${y.toFixed(1)}" x2="${(x+w*i/4).toFixed(1)}" y2="${(y+h).toFixed(1)}" stroke="${shadow}" stroke-width=".6" opacity=".45"/>`).join('')}</g>`);
  }
 }
 if(kit.antenna){
  const bx=ox-sc*.14,hy=hullHalfY(def.body,-.14)*sc,tip=oy-Math.min(hy*.82,sc*.32);
  bits.push(`<g class="antenna"><circle cx="${(bx+.6).toFixed(1)}" cy="${oy+1.2}" r="2.3" fill="${shadow}"/><circle cx="${bx.toFixed(1)}" cy="${oy}" r="2.2" fill="${plate}" stroke="${shadow}"/><line x1="${bx.toFixed(1)}" y1="${oy}" x2="${bx.toFixed(1)}" y2="${tip.toFixed(1)}" stroke="${plate}" stroke-width="1.4"/><circle cx="${bx.toFixed(1)}" cy="${tip.toFixed(1)}" r="1.6" fill="${metal}" stroke="${shadow}"/></g>`);
 }
 if(kit.sensors){
  const hy=hullHalfY(def.body,.1)*sc,ax=ox+sc*.1,ay=oy-hy*.55,r=Math.max(3.2,sc*.08);
  bits.push(`<g class="sensor"><circle cx="${(ax+.8).toFixed(1)}" cy="${(ay+1.1).toFixed(1)}" r="${r.toFixed(1)}" fill="${shadow}"/><circle cx="${ax.toFixed(1)}" cy="${ay.toFixed(1)}" r="${r.toFixed(1)}" fill="${plate}" stroke="${shadow}"/><circle cx="${ax.toFixed(1)}" cy="${ay.toFixed(1)}" r="${(r*.2).toFixed(1)}" fill="${shadow}"/></g>`);
 }
 if(kit.cargo){
  const hx=hullHalfY(def.body,-.2)*sc,h=Math.min(sc*.5,hx*1.55),w=sc*.48,x=ox-sc*.4,y=oy-h/2;
  bits.push(`<g class="cargo-bay"><rect x="${(x+1.3).toFixed(1)}" y="${(y+1.5).toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" fill="${shadow}"/><rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" fill="${metal}" stroke="${shadow}" stroke-width="1"/><line x1="${(x+w/2).toFixed(1)}" y1="${y.toFixed(1)}" x2="${(x+w/2).toFixed(1)}" y2="${(y+h).toFixed(1)}" stroke="${shadow}" stroke-width="1"/><line x1="${x.toFixed(1)}" y1="${(y+h/2).toFixed(1)}" x2="${(x+w).toFixed(1)}" y2="${(y+h/2).toFixed(1)}" stroke="${shadow}" stroke-width=".8" opacity=".6"/><rect x="${(x+2).toFixed(1)}" y="${(y-2.4).toFixed(1)}" width="4.2" height="2.6" fill="${plate}" stroke="${shadow}"/><rect x="${(x+w-6.2).toFixed(1)}" y="${(y-2.4).toFixed(1)}" width="4.2" height="2.6" fill="${plate}" stroke="${shadow}"/></g>`);
 }
 if(kit.clamps){
  const hy=hullHalfY(def.body,.1)*sc;
  for(const s of[-1,1]){
   const x=ox+sc*.1,y=oy+s*hy*.88;
   bits.push(`<path class="clamp" d="M${x.toFixed(1)} ${(y-s*2).toFixed(1)} L${(x-2).toFixed(1)} ${(y-s*5).toFixed(1)} L${(x-5).toFixed(1)} ${(y-s*2).toFixed(1)}" fill="none" stroke="${plate}" stroke-width="1.4"/>`);
  }
 }
 if(kit.hardpoints){
  const bh=Math.max(3,sc*.08),bw=sc*.22,bar=sc*.18;
  for(const [mx,my] of wingMounts(def)){
   const x=ox+mx*sc,y=oy+my*sc,inY=oy+my*sc*.58;
   bits.push(`<g class="hardpoint"><polygon points="${(x+bw*.15).toFixed(1)},${inY.toFixed(1)} ${(x-bw*.12).toFixed(1)},${(y-bh*.15).toFixed(1)} ${(x+bw*.55).toFixed(1)},${(y+bh*.15).toFixed(1)}" fill="${shadow}"/><rect x="${(x-bw*.12+1).toFixed(1)}" y="${(y-bh/2+1).toFixed(1)}" width="${bw.toFixed(1)}" height="${bh.toFixed(1)}" fill="${shadow}"/><rect x="${(x-bw*.15).toFixed(1)}" y="${(y-bh/2).toFixed(1)}" width="${bw.toFixed(1)}" height="${bh.toFixed(1)}" fill="${metal}" stroke="${shadow}"/><rect x="${(x+bw*.55).toFixed(1)}" y="${(y-Math.max(1.4,sc*.03)/2).toFixed(1)}" width="${bar.toFixed(1)}" height="${Math.max(1.5,sc*.04).toFixed(1)}" fill="${plate}"/></g>`);
  }
 }
 if(kit.intakes){
  const hy=hullHalfY(def.body,.48)*sc,h=Math.min(sc*.08,hy*.45);
  bits.push(`<g class="intake"><rect x="${(ox+sc*.48).toFixed(1)}" y="${(oy-h-1.2).toFixed(1)}" width="${(sc*.16).toFixed(1)}" height="${h.toFixed(1)}" fill="${shadow}" rx="1"/><rect x="${(ox+sc*.48).toFixed(1)}" y="${(oy+1.2).toFixed(1)}" width="${(sc*.16).toFixed(1)}" height="${h.toFixed(1)}" fill="${shadow}" rx="1"/></g>`);
 }
 if(kit.rcs){
  for(const [nx,ny] of[[.5,.22],[-.32,.24],[.5,-.22],[-.32,-.24]]){
   const hy=hullHalfY(def.body,nx)*sc*.82,y=oy+Math.sign(ny)*Math.min(Math.abs(ny)*sc,hy);
   bits.push(`<g class="rcs"><rect x="${(ox+nx*sc-1.6).toFixed(1)}" y="${(y-1.6).toFixed(1)}" width="3.2" height="3.2" fill="#1a2026"/><rect x="${(ox+nx*sc-1.1).toFixed(1)}" y="${(y-1.1).toFixed(1)}" width="2.2" height="2.2" fill="${plate}"/></g>`);
  }
 }
 if(kit.nacelle){
  bits.push(`<g class="nacelle"><rect x="${(ox-sc*.25).toFixed(1)}" y="${oy+1.4}" width="${(sc*.7).toFixed(1)}" height="3.4" fill="${shadow}"/><rect x="${(ox-sc*.3).toFixed(1)}" y="${oy-1.7}" width="${(sc*.7).toFixed(1)}" height="3.4" rx="1.2" fill="${plate}" stroke="${shadow}"/></g>`);
 }
 if(kit.tanks){
  const hy=hullHalfY(def.body,-.4)*sc;
  for(const s of[-1,1])bits.push(`<rect class="tank" x="${(ox-sc*.4).toFixed(1)}" y="${(oy+s*Math.min(sc*.16,hy*.55)).toFixed(1)}" width="${(sc*.28).toFixed(1)}" height="${(sc*.1).toFixed(1)}" rx="1.4" fill="${metal}" stroke="${shadow}"/>`);
 }
 if(kit.junk)bits.push(`<rect class="junk" x="${(ox-sc*.05).toFixed(1)}" y="${(oy+Math.min(sc*.22,hullHalfY(def.body,-.05)*sc*.6)).toFixed(1)}" width="${(sc*.18).toFixed(1)}" height="${(sc*.1).toFixed(1)}" fill="${heat}" opacity=".7"/>`);
 return bits.join('');
}

export function hullPreviewSvg(ship){
 const id=ship.id||'wren';
 const {def,classId}=resolveHull(id);
 const art=artOf(ship.class||classId);
 const a=ship.accent||art.rim;
 const ox=70,oy=44,sc=32,tx=2.8,ty=3.8;
 const gid='h'+id.replace(/[^a-z0-9]/g,'');
 const metal=rgbHex(...art.metal),plate=rgbHex(...art.plate),shadow=rgbHex(...art.shadow),heat=rgbHex(...(art.heat||[96,60,42]));
 const pt=([x,y],dx=0,dy=0)=>`${(ox+x*sc+dx).toFixed(1)},${(oy+y*sc+dy).toFixed(1)}`;
 const poly=(pts,dx=0,dy=0)=>pts.map(p=>pt(p,dx,dy)).join(' ');
 const deck=scaleBody(def.body,.7);
 const walls=def.body.map((p,i)=>{
  const q=def.body[(i+1)%def.body.length];
  return `<polygon class="hull-wall" points="${pt(p)} ${pt(q)} ${pt(q,tx,ty)} ${pt(p,tx,ty)}" fill="${shadow}"/>`;
 }).join('');
 const cx=ox+(def.cockpit?.x||.4)*sc;
 const defs=`<defs>
  <linearGradient id="${gid}-cyl" x1="50%" y1="0%" x2="50%" y2="100%">
   <stop offset="0" stop-color="${shadow}"/>
   <stop offset=".26" stop-color="${plate}"/>
   <stop offset=".5" stop-color="${metal}"/>
   <stop offset="1" stop-color="${shadow}"/>
  </linearGradient>
  <linearGradient id="${gid}-sun" x1="8%" y1="4%" x2="92%" y2="96%">
   <stop offset="0" stop-color="#ffffff" stop-opacity=".34"/>
   <stop offset=".2" stop-color="#ffffff" stop-opacity=".1"/>
   <stop offset=".45" stop-color="#ffffff" stop-opacity="0"/>
   <stop offset="1" stop-color="#000810" stop-opacity=".42"/>
  </linearGradient>
  <linearGradient id="${gid}-spec" x1="20%" y1="30%" x2="80%" y2="20%">
   <stop offset="0" stop-color="#ffffff" stop-opacity="0"/>
   <stop offset=".4" stop-color="#ffffff" stop-opacity=".22"/>
   <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
  </linearGradient>
  <radialGradient id="${gid}-g" cx="32%" cy="26%" r="74%">
   <stop offset="0" stop-color="#9ec4d0" stop-opacity=".32"/>
   <stop offset=".4" stop-color="${art.glass}"/>
   <stop offset="1" stop-color="#061014"/>
  </radialGradient>
  <radialGradient id="${gid}-sh" cx="50%" cy="50%" r="50%">
   <stop offset=".35" stop-color="#000" stop-opacity=".42"/>
   <stop offset="1" stop-color="#000" stop-opacity="0"/>
  </radialGradient>
  <clipPath id="${gid}-hull"><polygon points="${poly(def.body)}"/></clipPath>
 </defs>`;
 const shadowEl=`<ellipse cx="${ox+4}" cy="${oy+13}" rx="${(sc*1.2).toFixed(1)}" ry="${(sc*.34).toFixed(1)}" fill="url(#${gid}-sh)"/>`;
 const thick=`<polygon class="hull-thick" points="${poly(def.body,tx,ty)}" fill="${shadow}"/>`;
 const body=`<polygon points="${poly(def.body)}" fill="url(#${gid}-cyl)" stroke="${shadow}" stroke-width="1.3"/>`;
 const wash=`<polygon points="${poly(def.body)}" fill="url(#${gid}-sun)"/>`;
 const spec=`<polyline points="${pt([-.15,-.1])} ${pt([.55,-.2])}" fill="none" stroke="url(#${gid}-spec)" stroke-width="1.6"/>`;
 const deckEl=`<polygon points="${poly(deck,-.7,-1)}" fill="${plate}" fill-opacity=".36"/>`;
 const spine=`<rect x="${ox-sc*.4}" y="${oy-2}" width="${(sc*1).toFixed(1)}" height="4" rx="1.2" fill="${metal}" stroke="${shadow}" stroke-width=".7"/>`;
 const seam=`<polyline points="${pt([.65,0])} ${pt([-.46,0])}" fill="none" stroke="${shadow}" stroke-width="1" opacity=".55"/>`;
 const rivets=Array.from({length:8},(_,i)=>{
  const x=ox-sc*.28+i*(sc*.1);
  return `<rect x="${x.toFixed(1)}" y="${oy-1.2}" width="1.3" height="1.3" fill="${shadow}" opacity=".55"/><rect x="${x.toFixed(1)}" y="${oy+sc*.16}" width="1.2" height="1.2" fill="${shadow}" opacity=".4"/>`;
 }).join('');
 const brush=`<g clip-path="url(#${gid}-hull)" opacity=".18">${Array.from({length:7},(_,i)=>`<line x1="${ox-sc*.4}" y1="${oy-sc*.2+i*(sc*.07)}" x2="${ox+sc*.5}" y2="${oy-sc*.24+i*(sc*.07)}" stroke="${plate}" stroke-width=".7"/>`).join('')}</g>`;
 const tiles=`<g clip-path="url(#${gid}-hull)" class="heat-tiles">
  ${[0,1,2].map(col=>[0,1,2,3,4].map(row=>{
   const x=ox-sc*.96+col*(sc*.1),y=oy-sc*.42+row*(sc*.14);
   return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${(sc*.09).toFixed(1)}" height="${(sc*.12).toFixed(1)}" fill="${heat}" fill-opacity="${(.26+(col+row)%2*.14).toFixed(2)}"/>`;
  }).join('')).join('')}
 </g>`;
 const parts=(def.parts||[]).map(p=>{
  if(p.type==='stroke')return `<polyline points="${poly(p.pts)}" fill="none" stroke="${mixHex(plate,shadow,.35)}" stroke-width="1.05" opacity=".5"/>`;
  if(p.type==='rect')return `<g><rect x="${(ox+p.x*sc+1.2).toFixed(1)}" y="${(oy+p.y*sc+1.5).toFixed(1)}" width="${(p.w*sc).toFixed(1)}" height="${(p.h*sc).toFixed(1)}" fill="${shadow}"/><rect x="${(ox+p.x*sc).toFixed(1)}" y="${(oy+p.y*sc).toFixed(1)}" width="${(p.w*sc).toFixed(1)}" height="${(p.h*sc).toFixed(1)}" fill="${metal}" stroke="${shadow}" stroke-width="1"/></g>`;
  if(p.type==='poly')return `<g><polygon points="${poly(p.pts,1.2,1.5)}" fill="${shadow}"/><polygon points="${poly(p.pts)}" fill="${metal}" stroke="${shadow}" stroke-width="1.1"/></g>`;
  if(p.type==='arc'){
   const ax=ox+p.x*sc,ay=oy+p.y*sc,r=p.r*sc,root=oy+Math.sign(p.y||1)*hullHalfY(def.body,p.x)*sc*.72;
   return `<g><line x1="${ax.toFixed(1)}" y1="${root.toFixed(1)}" x2="${ax.toFixed(1)}" y2="${ay.toFixed(1)}" stroke="${mixHex(metal,shadow,.25)}" stroke-width="${Math.max(1.6,sc*.06).toFixed(1)}"/><circle cx="${ax.toFixed(1)}" cy="${root.toFixed(1)}" r="${Math.max(1.4,r*.22).toFixed(1)}" fill="${metal}"/><circle cx="${(ax+.8).toFixed(1)}" cy="${(ay+1.1).toFixed(1)}" r="${r.toFixed(1)}" fill="${shadow}"/><circle cx="${ax.toFixed(1)}" cy="${ay.toFixed(1)}" r="${r.toFixed(1)}" fill="${plate}" stroke="${shadow}" stroke-width="1.1"/><circle cx="${ax.toFixed(1)}" cy="${ay.toFixed(1)}" r="${(r*.18).toFixed(1)}" fill="${shadow}"/></g>`;
  }
  if(p.type==='scoop')return `<g><polygon points="${(ox-.2*sc).toFixed(1)},${(oy+.22*sc).toFixed(1)} ${(ox-.72*sc).toFixed(1)},${(oy+.12*sc).toFixed(1)} ${(ox-.72*sc).toFixed(1)},${(oy-.12*sc).toFixed(1)} ${(ox-.2*sc).toFixed(1)},${(oy-.22*sc).toFixed(1)}" fill="${metal}"/><path d="M${(ox-.18*sc).toFixed(1)} ${(oy+.22*sc).toFixed(1)} Q${(ox-.8*sc).toFixed(1)} ${oy} ${(ox-.18*sc).toFixed(1)} ${(oy-.22*sc).toFixed(1)}" fill="none" stroke="${heat}" stroke-width="1.3"/></g>`;
  return '';
 }).join('');
 const kit=kitSvg(def,art,ship.class||classId,ox,oy,sc,metal,plate,shadow,heat);
 const flames=(def.nozzles||[]).map(([nx,ny],i)=>{
  const x=ox+nx*sc-2,y=oy+ny*sc;
  return `<path d="M${x.toFixed(1)} ${(y-2).toFixed(1)} L${(x-10).toFixed(1)} ${y.toFixed(1)} L${x.toFixed(1)} ${(y+2).toFixed(1)}Z" fill="${mixHex(a,'#4a6a68',.5)}" opacity="${i?'.2':'.3'}"/>`;
 }).join('');
 const bells=(def.nozzles||[]).map(([nx,ny])=>{
  const face=ox+nx*sc,y=oy+ny*sc;
  const local=Math.max(3.4,hullHalfY(def.body,nx)*sc*1.45);
  const hh=Math.min(Math.max(4.2,sc*.12),local),inset=Math.max(7.2,sc*.26);
  return `<g class="engine-bell"><polygon points="${(face+inset).toFixed(1)},${(y-hh*.3).toFixed(1)} ${(face+1.4).toFixed(1)},${(y-hh*.48).toFixed(1)} ${(face+1.4).toFixed(1)},${(y+hh*.48).toFixed(1)} ${(face+inset).toFixed(1)},${(y+hh*.3).toFixed(1)}" fill="${metal}" stroke="${shadow}" stroke-width=".6"/><rect x="${(face-1.2).toFixed(1)}" y="${(y-hh*.44).toFixed(1)}" width="${Math.max(4.4,sc*.14).toFixed(1)}" height="${(hh*.88).toFixed(1)}" rx="1.2" fill="${metal}" stroke="${shadow}" stroke-width=".7"/><ellipse cx="${face.toFixed(1)}" cy="${y.toFixed(1)}" rx="${(hh*.36).toFixed(1)}" ry="${(hh*.3).toFixed(1)}" fill="${shadow}"/><ellipse cx="${face.toFixed(1)}" cy="${y.toFixed(1)}" rx="${(hh*.28).toFixed(1)}" ry="${(hh*.22).toFixed(1)}" fill="${heat}" stroke="${mixHex(heat,'#f0c090',.3)}"/><ellipse cx="${(face-.5).toFixed(1)}" cy="${y.toFixed(1)}" rx="1.2" ry=".85" fill="#080606"/><ellipse cx="${(face-.3).toFixed(1)}" cy="${y.toFixed(1)}" rx=".65" ry=".4" fill="#b8fff0" opacity=".35"/></g>`;
 }).join('');
 const cw=20,ch=12;
 const cockpit=def.cockpit?`<g class="canopy"><ellipse cx="${(cx+1.5).toFixed(1)}" cy="${oy+2.2}" rx="10" ry="6.4" fill="${shadow}" opacity=".5"/><rect x="${(cx-cw/2).toFixed(1)}" y="${(oy-ch/2).toFixed(1)}" width="${cw}" height="${ch}" rx="2.4" fill="${plate}" stroke="${shadow}" stroke-width="1.2"/><rect x="${(cx-cw/2+2).toFixed(1)}" y="${(oy-ch/2+1.7).toFixed(1)}" width="${cw-4}" height="${ch-3.4}" rx="1.4" fill="url(#${gid}-g)"/><rect x="${(cx-cw/2+3.4).toFixed(1)}" y="${(oy-ch/2+2.8).toFixed(1)}" width="${cw-7.2}" height="${ch-5.4}" rx="1" fill="#061014" opacity=".4"/><path d="M${(cx-2).toFixed(1)} ${(oy-ch/2+1.7).toFixed(1)} L${(cx-.2).toFixed(1)} ${(oy+ch/2-1.7).toFixed(1)}" stroke="${plate}" stroke-width=".8" opacity=".55"/><path d="M${(cx+3.6).toFixed(1)} ${(oy-ch/2+1.7).toFixed(1)} L${(cx+5).toFixed(1)} ${(oy+ch/2-1.7).toFixed(1)}" stroke="${plate}" stroke-width=".75" opacity=".45"/><ellipse cx="${(cx-4).toFixed(1)}" cy="${(oy-1.8).toFixed(1)}" rx="3.6" ry="2" fill="#c8e0ea" opacity=".28"/></g>`:'';
 const accents=(def.accents||[]).map(bar=>`<rect x="${(ox+bar.x*sc).toFixed(1)}" y="${(oy+bar.y*sc).toFixed(1)}" width="${bar.w}" height="${Math.max(1.2,bar.h*.6)}" fill="${a}" opacity=".32"/>`).join('');
 return `<svg class="ship-preview" viewBox="0 0 140 88" aria-hidden="true">${defs}${shadowEl}${flames}${walls}${thick}${body}${wash}${spec}${deckEl}${spine}${seam}${brush}${rivets}${tiles}${parts}${kit}${bells}${cockpit}${accents}</svg>`;
}

export function sampleShipColor(classId,nx=0,ny=0){
 const art=artOf(classId);
 const beam=Math.max(0,1-Math.abs(ny)*.7);
 const sun=Math.max(0,1-(nx+1)*.22);
 return mix(mix(art.shadow,art.metal,.4+beam*.35),art.plate,sun*.35);
}

export function meanShipColor(classId){
 let r=0,g=0,b=0,n=0;
 for(let y=-.8;y<=.8;y+=.2)for(let x=-.8;x<=.8;x+=.2){
  const c=sampleShipColor(classId,x,y);r+=c[0];g+=c[1];b+=c[2];n++;
 }
 return[r/n,g/n,b/n];
}

export function colorDistance(a,b){
 const dr=a[0]-b[0],dg=a[1]-b[1],db=a[2]-b[2];
 return Math.sqrt(dr*dr+dg*dg+db*db);
}

export function shipLimb(classId){return artOf(classId).rim;}

export {getHullDef,HULL_DEFS};

/**
 * Grounded spacecraft paint for local space and hangar.
 * Geometry stays in hull-defs; this module adds volume, plates, and physical engines.
 */
import {HULL_DEFS,getHullDef} from './hull-defs.mjs';

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

const stroke=(pts,alpha=.55)=>({type:'stroke',pts,alpha});
const rect=(x,y,w,h,alpha=.5)=>({type:'rect',x,y,w,h,alpha});
const boom=(pts)=>({type:'poly',pts,alpha:1});
const dish=(x,y,r)=>({type:'arc',x,y,r,alpha:.9});
const accentBar=(x,y,w,h)=>({type:'accent',x,y,w,h,alpha:.7});

export const NPC_HULLS={
 security:{
  body:[[1.15,0],[.35,.38],[-.15,.88],[.05,.32],[-.85,.48],[-1,.18],[-.55,0],[-1,-.18],[-.85,-.48],[.05,-.32],[-.15,-.88],[.35,-.38]],
  parts:[stroke([[.55,0],[-.25,0]]),rect(-.2,-.1,.5,.2),stroke([[-.1,.4],[.2,.15]]),stroke([[-.1,-.4],[.2,-.15]])],
  nozzles:[[-1,.22],[-1,-.22]],cockpit:{x:.35,rx:4.2,ry:2.8},lights:{y:.5,pair:['#ff3b4a','#3b8cff']},
  accents:[accentBar(-.05,-.12,7,4.8)]
 },
 pirate:{
  body:[[1.28,0],[.22,.42],[-.18,.9],[-.02,.3],[-1,.48],[-.52,0],[-1,-.48],[-.02,-.3],[-.18,-.9],[.22,-.42]],
  parts:[stroke([[.48,0],[-.22,0]]),rect(-.18,-.1,.48,.2),stroke([[.02,.52],[.26,.2]]),stroke([[.02,-.52],[.26,-.2]])],
  nozzles:[[-1,.22],[-1,-.22]],cockpit:{x:.42,rx:4.2,ry:2.6},lights:{y:.55},
  accents:[accentBar(.04,.68,6,1.8),accentBar(.04,-.68-1.8/18,6,1.8)]
 },
 courier:{
  body:[[1.35,0],[-.15,.42],[-1,.28],[-.45,0],[-1,-.28],[-.15,-.42]],
  parts:[stroke([[.7,0],[-.3,0]]),rect(-.2,-.08,.55,.16)],
  nozzles:[[-1,0]],cockpit:{x:.48,rx:3.6,ry:2.2},lights:{y:.36},accents:[]
 },
 freighter:{
  body:[[1.05,0],[.2,.72],[-1,.78],[-.7,0],[-1,-.78],[.2,-.72]],
  parts:[stroke([[-.15,-.4],[-.15,.4]]),stroke([[.25,-.35],[.25,.35]]),rect(-.45,-.42,.55,.84)],
  nozzles:[[-1,.32],[-1,-.32]],cockpit:{x:.28,rx:5,ry:3.4},lights:{y:.55},accents:[]
 },
 prospector:{
  body:[[1,0],[-.15,.68],[-1,.4],[-.55,0],[-1,-.4],[-.15,-.68]],
  parts:[boom([[.2,.28],[.58,.42],[.48,.58],[.12,.48]]),stroke([[-.2,0],[-.7,0]]),rect(-.25,-.12,.4,.24)],
  nozzles:[[-1,.2],[-1,-.2]],cockpit:{x:.22,rx:4.4,ry:3},lights:{y:.5},accents:[]
 },
 tender:{
  body:[[1.1,0],[.15,.55],[-.75,.68],[-1,0],[-.75,-.68],[.15,-.55]],
  parts:[stroke([[.2,0],[-.55,0]]),rect(-.15,-.1,.42,.2),{type:'scoop',alpha:.7}],
  nozzles:[[-1,.18],[-1,-.18]],cockpit:{x:.32,rx:4.6,ry:3},lights:{y:.48},accents:[]
 },
 surveyor:{
  body:[[1.15,0],[-.15,.62],[-1,.35],[-.5,0],[-1,-.35],[-.15,-.62]],
  parts:[stroke([[.55,0],[-.2,0]]),rect(-.15,-.08,.48,.16),dish(-.05,-.95,.4)],
  nozzles:[[-1,.14],[-1,-.14]],cockpit:{x:.42,rx:4.4,ry:2.8},lights:{y:.42},accents:[]
 }
};

export const NPC_KINDS=Object.keys(NPC_HULLS);
export const PLAYER_HULL_IDS=Object.keys(HULL_DEFS);

function artOf(classId){return CLASS_ART[classId]||CLASS_ART.explorer;}

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

export function resolveHull(kind){
 if(kind&&NPC_HULLS[kind])return{def:NPC_HULLS[kind],classId:kind};
 if(kind&&HULL_DEFS[kind])return{def:HULL_DEFS[kind],classId:HULL_CLASS[kind]||'explorer'};
 return{def:HULL_DEFS.wren,classId:'explorer'};
}

function thickOf(size){return{x:Math.max(1.4,size*.07),y:Math.max(1.8,size*.1)};}

function drawFlames(ctx,def,size,thrust,boost,lite){
 if(thrust<=.04)return;
 const len=(lite?9:(10+Math.random()*(boost?52:18)))*thrust;
 const core=boost?'#e8fff8':'#b8fff0',mid=boost?'#6ee8d4':'#4ec8b0';
 const scale=def.nozzles.length>1?.85:1;
 for(const [nx,ny] of def.nozzles){
  const x=nx*size-1.5,y=ny*size;
  ctx.fillStyle=mid;ctx.globalAlpha=.42;
  ctx.beginPath();ctx.moveTo(x,y-2.2);ctx.lineTo(x-len*scale,y);ctx.lineTo(x,y+2.2);ctx.fill();
  ctx.fillStyle=core;ctx.globalAlpha=.7;
  ctx.beginPath();ctx.moveTo(x,y-1.1);ctx.lineTo(x-len*scale*.58,y);ctx.lineTo(x,y+1.1);ctx.fill();
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
 const hw=Math.max(5.2,size*.22),hh=Math.max(5.6,size*.24);
 for(const [nx,ny] of def.nozzles||[]){
  const x=nx*size+(nx<0?1.2:0),y=ny*size;
  ctx.fillStyle=rgbOf(mix(art.shadow,art.metal,.35));
  ctx.fillRect(x,y-hh*.5,hw,hh);
  ctx.strokeStyle=rgbOf(art.shadow);ctx.lineWidth=1;
  ctx.strokeRect(x,y-hh*.5,hw,hh);
  ctx.fillStyle=rgbOf(mix(art.metal,art.plate,.4));
  ctx.fillRect(x+.6,y-hh*.5+.6,hw-1.2,1.3);
  ctx.fillStyle=rgbOf(mix(hot,art.shadow,.2));
  ctx.beginPath();ctx.ellipse(x,y,hw*.52,hh*.42,0,0,6.28);ctx.fill();
  ctx.strokeStyle=rgbOf(mix(hot,[190,130,88],.4));ctx.stroke();
  ctx.fillStyle='#0a0808';
  ctx.beginPath();ctx.ellipse(x-.5,y,hw*.28,hh*.22,0,0,6.28);ctx.fill();
  if(thrust>.04){
   ctx.fillStyle=rgba([180,255,230],.4+thrust*.28);
   ctx.beginPath();ctx.ellipse(x-.3,y,hw*.16,hh*.12,0,0,6.28);ctx.fill();
  }
 }
}

function drawParts(ctx,def,size,art){
 for(const p of def.parts||[]){
  ctx.globalAlpha=1;ctx.strokeStyle=rgbOf(mix(art.plate,art.shadow,.35));ctx.fillStyle=rgbOf(mix(art.metal,art.shadow,.15));
  if(p.type==='stroke'){ctx.globalAlpha=p.alpha??.4;ctx.lineWidth=1;ctx.beginPath();p.pts.forEach(([x,y],i)=>{const px=x*size,py=y*size;if(i)ctx.lineTo(px,py);else ctx.moveTo(px,py);});ctx.stroke();}
  else if(p.type==='rect'){
   const x=p.x*size,y=p.y*size,w=p.w*size,h=p.h*size;
   ctx.fillStyle=rgbOf(art.shadow);ctx.fillRect(x+1.3,y+1.6,w,h);
   const g=ctx.createLinearGradient?.(x,y,x,y+h);
   if(g?.addColorStop){g.addColorStop(0,rgbOf(art.plate));g.addColorStop(.45,rgbOf(art.metal));g.addColorStop(1,rgbOf(art.shadow));ctx.fillStyle=g;}
   else ctx.fillStyle=rgbOf(art.metal);
   ctx.fillRect(x,y,w,h);
   ctx.strokeStyle=rgbOf(art.shadow);ctx.strokeRect(x,y,w,h);
   ctx.strokeStyle=rgba(art.shadow,.4);ctx.lineWidth=.8;
   ctx.beginPath();ctx.moveTo(x+w*.5,y);ctx.lineTo(x+w*.5,y+h);ctx.stroke();
  }
  else if(p.type==='poly'){
   pathBody(ctx,p.pts,size,1.2,1.5);ctx.fillStyle=rgbOf(art.shadow);ctx.fill();
   pathBody(ctx,p.pts,size);ctx.fillStyle=rgbOf(mix(art.metal,art.plate,.25));ctx.fill();ctx.strokeStyle=rgbOf(art.shadow);ctx.stroke();
  }
  else if(p.type==='arc'){
   const ax=p.x*size,ay=p.y*size,r=p.r*size;
   ctx.beginPath();ctx.arc(ax+.8,ay+1.1,r,0,6.28);ctx.fillStyle=rgbOf(art.shadow);ctx.fill();
   ctx.beginPath();ctx.arc(ax,ay,r,0,6.28);ctx.fillStyle=rgbOf(mix(art.metal,art.plate,.35));ctx.fill();
   ctx.strokeStyle=rgbOf(art.shadow);ctx.stroke();
   ctx.beginPath();ctx.arc(ax-r*.22,ay-r*.28,r*.32,0,6.28);ctx.fillStyle=rgba([220,236,248],.16);ctx.fill();
   ctx.beginPath();ctx.arc(ax,ay,r*.18,0,6.28);ctx.fillStyle=rgbOf(art.shadow);ctx.fill();
  }
  else if(p.type==='scoop'){ctx.strokeStyle=rgbOf(mix(art.heat,art.metal,.35));ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(-size*.05,size*.32);ctx.quadraticCurveTo(-size*1.35,0,-size*.05,-size*.32);ctx.stroke();}
  ctx.globalAlpha=1;
 }
}

function drawPanels(ctx,def,size,art,lite){
 ctx.save();
 pathBody(ctx,def.body,size);ctx.clip();
 ctx.strokeStyle=rgba(art.shadow,.5);ctx.lineWidth=1;
 ctx.beginPath();ctx.moveTo(size*.68,0);ctx.lineTo(-size*.5,0);ctx.stroke();
 if(!lite){
  ctx.beginPath();
  ctx.moveTo(size*.28,-size*.2);ctx.lineTo(-size*.32,-size*.16);
  ctx.moveTo(size*.28,size*.2);ctx.lineTo(-size*.32,size*.16);
  ctx.moveTo(size*.18,-size*.58);ctx.lineTo(size*.18,size*.58);
  ctx.moveTo(-size*.16,-size*.52);ctx.lineTo(-size*.16,size*.52);
  ctx.stroke();
  const tw=size*.11,th=size*.16,x0=-size*.98,y0=-size*.48;
  for(let col=0;col<3;col++)for(let row=0;row<5;row++){
   const shade=.28+(col+row)%2*.12;
   ctx.fillStyle=rgba(art.heat,shade);
   ctx.fillRect(x0+col*tw,y0+row*th,tw-0.6,th-0.6);
  }
  ctx.strokeStyle=rgba(art.shadow,.45);ctx.lineWidth=.7;
  for(let i=0;i<4;i++){
   const x=x0+i*tw;
   ctx.beginPath();ctx.moveTo(x,y0);ctx.lineTo(x,y0+th*5);ctx.stroke();
  }
 }
 else{
  ctx.fillStyle=rgba(art.heat,.32);
  ctx.fillRect(-size*1.05,-size*.55,size*.36,size*1.1);
 }
 ctx.restore();
}

function drawVolume(ctx,def,size,art,lx,ly,sheen,lite,hostile){
 const {x:tx,y:ty}=thickOf(size);
 ctx.fillStyle=rgba([0,0,0],.3);
 ctx.beginPath();ctx.ellipse(2,ty+2,size*1.08,size*.4,0,0,6.28);ctx.fill();
 drawExtrusion(ctx,def.body,size,tx,ty,rgbOf(mix(art.shadow,[8,10,12],.25)));
 ctx.fillStyle=rgbOf(art.shadow);
 pathBody(ctx,def.body,size,tx,ty);ctx.fill();
 const hull=hostile?mix(art.metal,[78,28,30],.28):art.metal;
 ctx.fillStyle=rgbOf(hull);
 pathBody(ctx,def.body,size);ctx.fill();
 ctx.save();
 pathBody(ctx,def.body,size);ctx.clip();
 const beam=ctx.createLinearGradient?.(0,-size,0,size);
 if(beam?.addColorStop){
  beam.addColorStop(0,rgba(art.shadow,.58));
  beam.addColorStop(.3,rgba(art.plate,.5+sheen*.18));
  beam.addColorStop(.52,rgba(hull,0));
  beam.addColorStop(1,rgba(art.shadow,.74));
  ctx.fillStyle=beam;ctx.fill();
 }
 const len=Math.hypot(lx,ly)||1,ux=lx/len,uy=ly/len;
 const sun=ctx.createLinearGradient?.(-ux*size,-uy*size,ux*size,uy*size);
 if(sun?.addColorStop){
  sun.addColorStop(0,`rgba(255,255,255,${lite?.12:.2+sheen*.1})`);
  sun.addColorStop(.42,'rgba(0,0,0,0)');
  sun.addColorStop(1,`rgba(0,4,10,${lite?.28:.4})`);
  ctx.fillStyle=sun;ctx.fill();
 }
 const ao=ctx.createLinearGradient?.(0,0,tx*2,ty*2);
 if(ao?.addColorStop){
  ao.addColorStop(0,'rgba(0,0,0,0)');
  ao.addColorStop(1,'rgba(0,0,0,.12)');
  ctx.fillStyle=ao;ctx.fill();
 }
 ctx.fillStyle=rgbOf(mix(hull,art.plate,.4));
 pathBody(ctx,scaleBody(def.body,.72),size,-.8,-1.1);ctx.globalAlpha=.5;ctx.fill();ctx.globalAlpha=1;
 ctx.restore();
 ctx.strokeStyle=rgbOf(mix(art.shadow,hull,.2));
 ctx.lineWidth=1.35;
 pathBody(ctx,def.body,size);ctx.stroke();
 ctx.save();
 pathBody(ctx,def.body,size);ctx.clip();
 ctx.strokeStyle=rgba(art.plate,.32+sheen*.08);ctx.lineWidth=1;
 ctx.beginPath();
 const rim=scaleBody(def.body,.9);
 rim.forEach(([x,y],i)=>{const px=x*size-1.2,py=y*size-1.5;if(i)ctx.lineTo(px,py);else ctx.moveTo(px,py);});
 ctx.closePath();ctx.stroke();
 ctx.restore();
}

function drawCanopy(ctx,def,size,art){
 if(!def.cockpit)return;
 const c=def.cockpit,x=c.x*size,rx=c.rx,ry=c.ry;
 ctx.fillStyle=rgbOf(mix(art.metal,art.plate,.35));
 ctx.beginPath();ctx.ellipse(x,0,rx+1.6,ry+1.35,0,0,6.28);ctx.fill();
 ctx.strokeStyle=rgbOf(art.shadow);ctx.lineWidth=1.1;ctx.stroke();
 ctx.fillStyle=art.glass;
 ctx.beginPath();ctx.ellipse(x,0,rx,ry,0,0,6.28);ctx.fill();
 ctx.fillStyle=rgba([8,14,18],.45);
 ctx.beginPath();ctx.ellipse(x+rx*.12,ry*.12,rx*.82,ry*.72,0,0,6.28);ctx.fill();
 ctx.fillStyle=rgba([210,232,242],.2);
 ctx.beginPath();ctx.ellipse(x-rx*.28,-ry*.32,rx*.38,ry*.28,0,0,6.28);ctx.fill();
 ctx.strokeStyle=rgba(art.shadow,.55);ctx.lineWidth=.8;
 ctx.beginPath();ctx.moveTo(x-rx*.15,-ry*.85);ctx.lineTo(x+rx*.05,ry*.85);ctx.stroke();
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

/**
 * Draw a hull in local ship space (nose +X). Caller handles translate/rotate.
 */
export function drawCraft(ctx,opts={}){
 const kind=opts.kind||opts.id||'wren';
 const {def,classId}=resolveHull(kind);
 const art=artOf(opts.classId||classId);
 const size=opts.size||19,accent=opts.accent||art.rim;
 const thrust=opts.thrust||0,boost=!!opts.boost,clock=opts.clock||0,lite=!!opts.lite;
 const lx=opts.lightX??-1,ly=opts.lightY??-.75;
 drawFlames(ctx,def,size,thrust,boost,lite);
 drawVolume(ctx,def,size,art,lx,ly,art.sheen,lite,!!opts.hostile);
 drawPanels(ctx,def,size,art,lite);
 drawParts(ctx,def,size,art);
 drawBells(ctx,def,size,art,thrust);
 if(opts.drawCockpit!==false)drawCanopy(ctx,def,size,art);
 if(opts.drawLights!==false)drawNavLights(ctx,def,size,clock,opts);
 for(const a of def.accents||[]){
  if(def.lights?.pair&&a===def.accents[0])continue;
  ctx.fillStyle=withAlpha(accent,.4);ctx.fillRect(a.x*size,a.y*size,a.w,Math.max(1.2,a.h*.65));
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

/** Hangar SVG — extruded hull, deck, heat tiles, ceramic bells, framed glass. */
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
 const deck=scaleBody(def.body,.72);
 const walls=def.body.map((p,i)=>{
  const q=def.body[(i+1)%def.body.length];
  return `<polygon class="hull-wall" points="${pt(p)} ${pt(q)} ${pt(q,tx,ty)} ${pt(p,tx,ty)}" fill="${shadow}"/>`;
 }).join('');
 const defs=`<defs>
  <linearGradient id="${gid}-cyl" x1="50%" y1="0%" x2="50%" y2="100%">
   <stop offset="0" stop-color="${shadow}"/>
   <stop offset=".28" stop-color="${plate}"/>
   <stop offset=".52" stop-color="${metal}"/>
   <stop offset="1" stop-color="${shadow}"/>
  </linearGradient>
  <linearGradient id="${gid}-sun" x1="10%" y1="6%" x2="90%" y2="94%">
   <stop offset="0" stop-color="#ffffff" stop-opacity=".32"/>
   <stop offset=".4" stop-color="#ffffff" stop-opacity="0"/>
   <stop offset="1" stop-color="#000810" stop-opacity=".4"/>
  </linearGradient>
  <radialGradient id="${gid}-g" cx="34%" cy="28%" r="72%">
   <stop offset="0" stop-color="#8eb8c4" stop-opacity=".28"/>
   <stop offset=".42" stop-color="${art.glass}"/>
   <stop offset="1" stop-color="#061014"/>
  </radialGradient>
  <radialGradient id="${gid}-sh" cx="50%" cy="50%" r="50%">
   <stop offset=".38" stop-color="#000" stop-opacity=".38"/>
   <stop offset="1" stop-color="#000" stop-opacity="0"/>
  </radialGradient>
  <clipPath id="${gid}-hull"><polygon points="${poly(def.body)}"/></clipPath>
 </defs>`;
 const shadowEl=`<ellipse cx="${ox+3}" cy="${oy+12}" rx="${(sc*1.18).toFixed(1)}" ry="${(sc*.36).toFixed(1)}" fill="url(#${gid}-sh)"/>`;
 const thick=`<polygon class="hull-thick" points="${poly(def.body,tx,ty)}" fill="${shadow}"/>`;
 const body=`<polygon points="${poly(def.body)}" fill="url(#${gid}-cyl)" stroke="${shadow}" stroke-width="1.35"/>`;
 const wash=`<polygon points="${poly(def.body)}" fill="url(#${gid}-sun)"/>`;
 const deckEl=`<polygon points="${poly(deck,-.8,-1.1)}" fill="${plate}" fill-opacity=".42"/>`;
 const spine=`<rect x="${ox-sc*.42}" y="${oy-2}" width="${(sc*1.02).toFixed(1)}" height="4" rx="1.3" fill="${metal}" stroke="${shadow}" stroke-width=".7"/>`;
 const seam=`<polyline points="${pt([.62,0])} ${pt([-.48,0])}" fill="none" stroke="${shadow}" stroke-width="0.85" opacity=".55"/>`;
 const tiles=`<g clip-path="url(#${gid}-hull)" class="heat-tiles">
  <rect x="${ox-sc*1.02}" y="${oy-sc*.5}" width="${(sc*.38).toFixed(1)}" height="${(sc*1).toFixed(1)}" fill="${heat}" fill-opacity=".22"/>
  ${[0,1,2].map(col=>[0,1,2,3,4].map(row=>{
   const x=ox-sc*.98+col*(sc*.11),y=oy-sc*.46+row*(sc*.16);
   const op=.28+(col+row)%2*.12;
   return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${(sc*.1).toFixed(1)}" height="${(sc*.14).toFixed(1)}" fill="${heat}" fill-opacity="${op.toFixed(2)}"/>`;
  }).join('')).join('')}
 </g>`;
 const parts=(def.parts||[]).map(p=>{
  if(p.type==='stroke')return `<polyline points="${poly(p.pts)}" fill="none" stroke="${mixHex(plate,shadow,.35)}" stroke-width="1.05" opacity=".5"/>`;
  if(p.type==='rect')return `<g><rect x="${(ox+p.x*sc+1.2).toFixed(1)}" y="${(oy+p.y*sc+1.5).toFixed(1)}" width="${(p.w*sc).toFixed(1)}" height="${(p.h*sc).toFixed(1)}" fill="${shadow}"/><rect x="${(ox+p.x*sc).toFixed(1)}" y="${(oy+p.y*sc).toFixed(1)}" width="${(p.w*sc).toFixed(1)}" height="${(p.h*sc).toFixed(1)}" fill="${metal}" stroke="${shadow}" stroke-width="1"/></g>`;
  if(p.type==='poly')return `<g><polygon points="${poly(p.pts,1.2,1.5)}" fill="${shadow}"/><polygon points="${poly(p.pts)}" fill="${metal}" stroke="${shadow}" stroke-width="1.1"/></g>`;
  if(p.type==='arc')return `<g><circle cx="${(ox+p.x*sc+.8).toFixed(1)}" cy="${(oy+p.y*sc+1.1).toFixed(1)}" r="${(p.r*sc).toFixed(1)}" fill="${shadow}"/><circle cx="${(ox+p.x*sc).toFixed(1)}" cy="${(oy+p.y*sc).toFixed(1)}" r="${(p.r*sc).toFixed(1)}" fill="${plate}" stroke="${shadow}" stroke-width="1.1"/><circle cx="${(ox+p.x*sc).toFixed(1)}" cy="${(oy+p.y*sc).toFixed(1)}" r="${(p.r*sc*.18).toFixed(1)}" fill="${shadow}"/></g>`;
  if(p.type==='scoop')return `<path d="M${(ox-.05*sc).toFixed(1)} ${(oy+.32*sc).toFixed(1)} Q${(ox-1.35*sc).toFixed(1)} ${oy} ${(ox-.05*sc).toFixed(1)} ${(oy-.32*sc).toFixed(1)}" fill="none" stroke="${heat}" stroke-width="1.3"/>`;
  return '';
 }).join('');
 const flames=(def.nozzles||[]).map(([nx,ny],i)=>{
  const x=ox+nx*sc-2,y=oy+ny*sc;
  return `<path d="M${x.toFixed(1)} ${(y-2.4).toFixed(1)} L${(x-11).toFixed(1)} ${y.toFixed(1)} L${x.toFixed(1)} ${(y+2.4).toFixed(1)}Z" fill="${mixHex(a,'#4a6a68',.45)}" opacity="${i?'.22':'.32'}"/>`;
 }).join('');
 const bells=(def.nozzles||[]).map(([nx,ny])=>{
  const x=ox+nx*sc+1.1,y=oy+ny*sc;
  return `<g class="engine-bell"><rect x="${x.toFixed(1)}" y="${(y-4.2).toFixed(1)}" width="7.4" height="8.4" fill="${metal}" stroke="${shadow}" stroke-width=".8"/><rect x="${(x+.5).toFixed(1)}" y="${(y-3.6).toFixed(1)}" width="6.4" height="1.3" fill="${plate}" opacity=".7"/><ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="3.8" ry="2.7" fill="${heat}" stroke="${mixHex(heat,'#f0c090',.28)}" stroke-width=".8"/><ellipse cx="${(x-.5).toFixed(1)}" cy="${y.toFixed(1)}" rx="1.8" ry="1.2" fill="#0a0808"/></g>`;
 }).join('');
 const cockpit=def.cockpit?`<g class="canopy"><ellipse cx="${(ox+def.cockpit.x*sc).toFixed(1)}" cy="${oy}" rx="6.4" ry="4.4" fill="${metal}" stroke="${shadow}" stroke-width="1.1"/><ellipse cx="${(ox+def.cockpit.x*sc).toFixed(1)}" cy="${oy}" rx="5.1" ry="3.4" fill="url(#${gid}-g)"/><path d="M${(ox+def.cockpit.x*sc-1).toFixed(1)} ${(oy-3.2).toFixed(1)} L${(ox+def.cockpit.x*sc+.4).toFixed(1)} ${(oy+3.2).toFixed(1)}" stroke="${shadow}" stroke-width=".7" opacity=".45"/></g>`:'';
 const accents=(def.accents||[]).map(bar=>`<rect x="${(ox+bar.x*sc).toFixed(1)}" y="${(oy+bar.y*sc).toFixed(1)}" width="${bar.w}" height="${Math.max(1.2,bar.h*.65)}" fill="${a}" opacity=".38"/>`).join('');
 return `<svg class="ship-preview" viewBox="0 0 140 88" aria-hidden="true">${defs}${shadowEl}${flames}${walls}${thick}${body}${wash}${deckEl}${spine}${seam}${tiles}${parts}${bells}${cockpit}${accents}</svg>`;
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

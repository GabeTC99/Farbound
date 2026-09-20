/**
 * Class-driven ship artwork for local space and hangar.
 * Geometry stays in hull-defs; this module paints materials, lighting, and NPC craft.
 */
import {HULL_DEFS,getHullDef} from './hull-defs.mjs';

export const CLASS_ART={
 explorer:{metal:[20,40,52],plate:[38,68,82],shadow:[8,16,24],glass:'#d8fff8',sheen:.58,rim:'#7ad9c8'},
 scout:{metal:[22,42,30],plate:[42,74,50],shadow:[8,16,12],glass:'#e8ffd0',sheen:.48,rim:'#9bc978'},
 trader:{metal:[44,36,24],plate:[74,60,38],shadow:[16,12,8],glass:'#fff0d0',sheen:.3,rim:'#c4a574'},
 miner:{metal:[42,34,22],plate:[68,54,34],shadow:[16,12,8],glass:'#f0e0c0',sheen:.2,rim:'#b8956a'},
 courier:{metal:[18,40,52],plate:[34,70,86],shadow:[8,16,22],glass:'#d0f4ff',sheen:.52,rim:'#6ebfd4'},
 combat:{metal:[42,24,28],plate:[72,38,42],shadow:[16,8,10],glass:'#ffd8d0',sheen:.64,rim:'#d47868'},
 security:{metal:[16,28,42],plate:[28,50,72],shadow:[6,12,20],glass:'#d7f7ff',sheen:.5,rim:'#3b8cff'},
 pirate:{metal:[48,20,24],plate:[78,32,36],shadow:[18,8,10],glass:'#ffc8c0',sheen:.42,rim:'#ee918b'},
 freighter:{metal:[46,38,26],plate:[78,64,40],shadow:[16,12,8],glass:'#ffe8c8',sheen:.26,rim:'#d2b48c'},
 prospector:{metal:[44,34,20],plate:[76,58,32],shadow:[16,12,6],glass:'#f4d8a8',sheen:.18,rim:'#d4a067'},
 tender:{metal:[40,32,22],plate:[70,54,34],shadow:[14,12,8],glass:'#ffe0b8',sheen:.28,rim:'#e0b07a'},
 surveyor:{metal:[18,42,40],plate:[32,72,68],shadow:[8,16,16],glass:'#d4fff4',sheen:.46,rim:'#8fd6c2'}
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
  parts:[stroke([[.55,0],[-.25,0]]),stroke([[-.1,.4],[.2,.15]]),stroke([[-.1,-.4],[.2,-.15]])],
  nozzles:[[-1,.22],[-1,-.22]],cockpit:{x:.35,rx:4.2,ry:2.8},lights:{y:.5,pair:['#ff3b4a','#3b8cff']},
  accents:[accentBar(-.05,-.12,7,4.8)]
 },
 pirate:{
  body:[[1.28,0],[.22,.42],[-.18,.9],[-.02,.3],[-1,.48],[-.52,0],[-1,-.48],[-.02,-.3],[-.18,-.9],[.22,-.42]],
  parts:[stroke([[.48,0],[-.22,0]]),stroke([[.02,.52],[.26,.2]]),stroke([[.02,-.52],[.26,-.2]])],
  nozzles:[[-1,.22],[-1,-.22]],cockpit:{x:.42,rx:4.2,ry:2.6},lights:{y:.55},
  accents:[accentBar(.04,.68,6,1.8),accentBar(.04,-.68-1.8/18,6,1.8)]
 },
 courier:{
  body:[[1.35,0],[-.15,.42],[-1,.28],[-.45,0],[-1,-.28],[-.15,-.42]],
  parts:[stroke([[.7,0],[-.3,0]])],
  nozzles:[[-1,0]],cockpit:{x:.48,rx:3.6,ry:2.2},lights:{y:.36},accents:[]
 },
 freighter:{
  body:[[1.05,0],[.2,.72],[-1,.78],[-.7,0],[-1,-.78],[.2,-.72]],
  parts:[stroke([[-.15,-.4],[-.15,.4]]),stroke([[.25,-.35],[.25,.35]]),rect(-.45,-.42,.55,.84)],
  nozzles:[[-1,.32],[-1,-.32]],cockpit:{x:.28,rx:5,ry:3.4},lights:{y:.55},accents:[]
 },
 prospector:{
  body:[[1,0],[-.15,.68],[-1,.4],[-.55,0],[-1,-.4],[-.15,-.68]],
  parts:[boom([[.2,.28],[.58,.42],[.48,.58],[.12,.48]]),stroke([[-.2,0],[-.7,0]])],
  nozzles:[[-1,.2],[-1,-.2]],cockpit:{x:.22,rx:4.4,ry:3},lights:{y:.5},accents:[]
 },
 tender:{
  body:[[1.1,0],[.15,.55],[-.75,.68],[-1,0],[-.75,-.68],[.15,-.55]],
  parts:[stroke([[.2,0],[-.55,0]]),{type:'scoop',alpha:.7}],
  nozzles:[[-1,.18],[-1,-.18]],cockpit:{x:.32,rx:4.6,ry:3},lights:{y:.48},accents:[]
 },
 surveyor:{
  body:[[1.15,0],[-.15,.62],[-1,.35],[-.5,0],[-1,-.35],[-.15,-.62]],
  parts:[stroke([[.55,0],[-.2,0]]),dish(-.05,-.95,.4)],
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

function pathBody(ctx,body,size){
 ctx.beginPath();
 body.forEach(([x,y],i)=>{const px=x*size,py=y*size;if(i)ctx.lineTo(px,py);else ctx.moveTo(px,py);});
 ctx.closePath();
}

export function resolveHull(kind){
 if(kind&&NPC_HULLS[kind])return{def:NPC_HULLS[kind],classId:kind};
 if(kind&&HULL_DEFS[kind])return{def:HULL_DEFS[kind],classId:HULL_CLASS[kind]||'explorer'};
 return{def:HULL_DEFS.wren,classId:'explorer'};
}

function drawFlames(ctx,def,size,thrust,boost,lite){
 if(thrust<=.04)return;
 const len=(lite?9:(10+Math.random()*(boost?52:18)))*thrust;
 const flame=boost?'#9bfff0':'#76efdb';
 ctx.fillStyle=flame;ctx.globalAlpha=.7;
 const scale=def.nozzles.length>1?.85:1;
 for(const [nx,ny] of def.nozzles){
  const x=nx*size+(nx<0?2:0),y=ny*size;
  ctx.beginPath();ctx.moveTo(x,y-3.5);ctx.lineTo(x-len*scale,y);ctx.lineTo(x,y+3.5);ctx.fill();
 }
 if(boost){ctx.globalAlpha=.28;ctx.beginPath();ctx.arc(-size-len*.35,0,8+thrust*10,0,6.28);ctx.fill();}
 ctx.globalAlpha=1;
}

function drawBells(ctx,def,size,art){
 ctx.fillStyle=rgbOf(mix(art.shadow,art.metal,.35));
 ctx.strokeStyle=rgbOf(mix(art.plate,art.shadow,.4));
 ctx.lineWidth=1;
 for(const [nx,ny] of def.nozzles||[]){
  const x=nx*size+(nx<0?1.2:0),y=ny*size;
  ctx.beginPath();ctx.ellipse(x,y,3.1,2.2,0,0,6.28);ctx.fill();ctx.stroke();
 }
}

function drawParts(ctx,def,size,color,art){
 for(const p of def.parts||[]){
  ctx.globalAlpha=p.alpha??.55;ctx.strokeStyle=color;ctx.fillStyle=rgbOf(art.metal);
  if(p.type==='stroke'){ctx.beginPath();p.pts.forEach(([x,y],i)=>{const px=x*size,py=y*size;if(i)ctx.lineTo(px,py);else ctx.moveTo(px,py);});ctx.stroke();}
  else if(p.type==='rect'){ctx.beginPath();ctx.rect(p.x*size,p.y*size,p.w*size,p.h*size);ctx.stroke();ctx.globalAlpha=(p.alpha??.5)*.35;ctx.fill();ctx.globalAlpha=p.alpha??.55;}
  else if(p.type==='poly'){pathBody(ctx,p.pts,size);ctx.fill();ctx.stroke();}
  else if(p.type==='arc'){ctx.beginPath();ctx.arc(p.x*size,p.y*size,p.r*size,0,6.28);ctx.stroke();ctx.globalAlpha=(p.alpha??.55)*.4;ctx.fillStyle=withAlpha(color,.22);ctx.fill();ctx.globalAlpha=p.alpha??.55;}
  else if(p.type==='scoop'){ctx.beginPath();ctx.moveTo(-size*.05,size*.32);ctx.quadraticCurveTo(-size*1.35,0,-size*.05,-size*.32);ctx.stroke();}
  ctx.globalAlpha=1;
 }
}

function drawClassCues(ctx,classId,def,size,color,accent){
 ctx.save();
 if(classId==='combat'||classId==='pirate'){
  ctx.strokeStyle=withAlpha(accent||color,.75);ctx.lineWidth=1.4;
  ctx.beginPath();ctx.moveTo(size*.2,size*.42);ctx.lineTo(size*.55,size*.58);ctx.moveTo(size*.2,-size*.42);ctx.lineTo(size*.55,-size*.58);ctx.stroke();
 }else if(classId==='trader'||classId==='freighter'){
  ctx.strokeStyle=withAlpha(color,.35);ctx.lineWidth=1.1;
  ctx.beginPath();ctx.moveTo(-size*.35,-size*.28);ctx.lineTo(-size*.35,size*.28);ctx.moveTo(-size*.05,-size*.24);ctx.lineTo(-size*.05,size*.24);ctx.stroke();
 }else if(classId==='courier'||classId==='scout'){
  ctx.strokeStyle=withAlpha(accent||color,.8);ctx.lineWidth=1.6;
  ctx.beginPath();ctx.moveTo(size*.7,0);ctx.lineTo(-size*.15,0);ctx.stroke();
 }else if(classId==='explorer'||classId==='surveyor'){
  ctx.strokeStyle=withAlpha(color,.4);ctx.fillStyle=withAlpha(color,.12);
  ctx.beginPath();ctx.arc(-size*.05,-size*.78,size*.16,0,6.28);ctx.fill();ctx.stroke();
 }else if(classId==='miner'||classId==='prospector'){
  ctx.fillStyle=withAlpha(accent||color,.35);
  ctx.beginPath();ctx.moveTo(size*.18,size*.22);ctx.lineTo(size*.62,size*.4);ctx.lineTo(size*.18,size*.3);ctx.fill();
 }
 ctx.restore();
}

function applyLighting(ctx,size,lx,ly,sheen,lite){
 const len=Math.hypot(lx,ly)||1;
 const ux=lx/len,uy=ly/len;
 const g=ctx.createLinearGradient?.(-ux*size,-uy*size,ux*size,uy*size);
 if(!g?.addColorStop)return;
 g.addColorStop(0,`rgba(255,255,255,${lite?.12:.16+sheen*.2})`);
 g.addColorStop(.38,'rgba(0,0,0,0)');
 g.addColorStop(.7,`rgba(0,4,12,${lite?.35:.48})`);
 g.addColorStop(1,`rgba(0,4,12,${lite?.55:.78})`);
 ctx.fillStyle=g;ctx.fill();
 if(lite)return;
 const hx=-ux*size*.35,hy=-uy*size*.35;
 const spec=ctx.createRadialGradient?.(hx,hy,0,hx,hy,size*.7);
 if(!spec?.addColorStop)return;
 spec.addColorStop(0,`rgba(255,255,255,${.1+sheen*.16})`);
 spec.addColorStop(.5,'rgba(255,255,255,0.03)');
 spec.addColorStop(1,'rgba(0,0,0,0)');
 ctx.fillStyle=spec;ctx.fill();
}

/**
 * Draw a hull in local ship space (nose +X). Caller handles translate/rotate.
 * opts: {kind,size,color,accent,thrust,boost,clock,lightX,lightY,lite,hostile,drawCockpit,drawLights}
 */
export function drawCraft(ctx,opts={}){
 const kind=opts.kind||opts.id||'wren';
 const {def,classId}=resolveHull(kind);
 const art=artOf(opts.classId||classId);
 const size=opts.size||19,color=opts.color||art.rim,accent=opts.accent||color;
 const thrust=opts.thrust||0,boost=!!opts.boost,clock=opts.clock||0,lite=!!opts.lite;
 const lx=opts.lightX??-1,ly=opts.lightY??-.75;
 const hostile=!!opts.hostile;
 drawFlames(ctx,def,size,thrust,boost,lite);
 const fill=hostile?mix(art.metal,[70,20,28],.45):art.metal;
 ctx.fillStyle=rgbOf(fill);
 ctx.strokeStyle=color;
 ctx.lineWidth=1.8;
 pathBody(ctx,def.body,size);ctx.fill();
 ctx.save();
 pathBody(ctx,def.body,size);ctx.clip();
 ctx.fillStyle=rgbOf(mix(fill,art.plate,.55));
 ctx.globalAlpha=.35;
 ctx.fillRect(-size*.2,-size,size*.55,size*2);
 ctx.globalAlpha=1;
 applyLighting(ctx,size,lx,ly,art.sheen,lite);
 ctx.restore();
 pathBody(ctx,def.body,size);ctx.stroke();
 drawParts(ctx,def,size,color,art);
 drawClassCues(ctx,opts.classId||classId,def,size,color,accent);
 drawBells(ctx,def,size,art);
 if((opts.drawCockpit!==false)&&def.cockpit){
  const c=def.cockpit;
  const pulse=.82+.18*Math.sin(clock*4);
  ctx.fillStyle=art.glass;ctx.globalAlpha=pulse;
  ctx.beginPath();ctx.ellipse(c.x*size,0,c.rx,c.ry,0,0,6.28);ctx.fill();
  ctx.globalAlpha=.45;ctx.fillStyle='#fff';
  ctx.beginPath();ctx.ellipse(c.x*size-c.rx*.25,-c.ry*.28,c.rx*.45,c.ry*.35,0,0,6.28);ctx.fill();
  ctx.globalAlpha=1;
 }
 if((opts.drawLights!==false)&&def.lights){
  const ly2=def.lights.y*size,blink=((clock*2.6)%1)<.5;
  const pair=def.lights.pair;
  if(pair){
   const flash=Math.floor(clock*(opts.alert?10:6))%2===0;
   ctx.fillStyle=flash?pair[0]:'#243038';ctx.fillRect(-2,ly2,3.4,3.4);
   ctx.fillStyle=flash?'#243038':pair[1];ctx.fillRect(-2,-ly2-3.4,3.4,3.4);
   ctx.globalAlpha=.9;ctx.fillStyle=flash?pair[0]:pair[1];ctx.fillRect(-size*.05,-2.4,7,4.8);ctx.globalAlpha=1;
  }else{
   ctx.fillStyle=blink?'#ff6b6b':'#31414a';ctx.fillRect(-2,ly2,3.2,3.2);
   ctx.fillStyle=blink?'#31414a':'#7dffb8';ctx.fillRect(-2,-ly2-3.2,3.2,3.2);
  }
 }
 for(const a of def.accents||[]){
  if(def.lights?.pair&&a===def.accents[0])continue;
  ctx.fillStyle=accent;ctx.globalAlpha=a.alpha??.7;
  ctx.fillRect(a.x*size,a.y*size,a.w,a.h);ctx.globalAlpha=1;
 }
}

export function drawHullLit(ctx,def,size,color,accent,opts={}){
 const kind=opts.kind||opts.id;
 drawCraft(ctx,{...opts,kind,size,color,accent});
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

/** Hangar SVG preview — same geometry, lit metal, class cues. */
export function hullPreviewSvg(ship){
 const id=ship.id||'wren';
 const {def,classId}=resolveHull(id);
 const art=artOf(ship.class||classId);
 const c=ship.color||art.rim,a=ship.accent||c;
 const ox=62,oy=36,sc=26;
 const gid='h'+id.replace(/[^a-z0-9]/g,'');
 const metal=rgbHex(...art.metal),plate=rgbHex(...art.plate),shadow=rgbHex(...art.shadow);
 const hi=mixHex(c,'#ffffff',.35);
 const pt=([x,y])=>`${(ox+x*sc).toFixed(1)},${(oy+y*sc).toFixed(1)}`;
 const poly=pts=>pts.map(pt).join(' ');
 const defs=`<defs>
  <linearGradient id="${gid}-m" x1="12%" y1="8%" x2="92%" y2="92%">
   <stop offset="0" stop-color="${hi}"/>
   <stop offset=".38" stop-color="${plate}"/>
   <stop offset="1" stop-color="${shadow}"/>
  </linearGradient>
  <radialGradient id="${gid}-g" cx="38%" cy="32%" r="70%">
   <stop offset="0" stop-color="#ffffff"/>
   <stop offset=".4" stop-color="${art.glass}"/>
   <stop offset="1" stop-color="${mixHex(art.glass,'#082028',.45)}"/>
  </radialGradient>
 </defs>`;
 const body=`<polygon points="${poly(def.body)}" fill="url(#${gid}-m)" stroke="${c}" stroke-width="2"/>`;
 const spine=`<polyline points="${pt([.55,0])} ${pt([-.25,0])}" fill="none" stroke="${withAlpha(c,.4)}" stroke-width="1.2"/>`;
 const parts=(def.parts||[]).map(p=>{
  if(p.type==='stroke')return `<polyline points="${poly(p.pts)}" fill="none" stroke="${a}" stroke-width="1.4" opacity="${p.alpha??.55}"/>`;
  if(p.type==='rect')return `<rect x="${(ox+p.x*sc).toFixed(1)}" y="${(oy+p.y*sc).toFixed(1)}" width="${(p.w*sc).toFixed(1)}" height="${(p.h*sc).toFixed(1)}" fill="${metal}" fill-opacity=".35" stroke="${a}" stroke-width="1.3" opacity="${p.alpha??.5}"/>`;
  if(p.type==='poly')return `<polygon points="${poly(p.pts)}" fill="${metal}" stroke="${c}" stroke-width="1.5"/>`;
  if(p.type==='arc')return `<circle cx="${(ox+p.x*sc).toFixed(1)}" cy="${(oy+p.y*sc).toFixed(1)}" r="${(p.r*sc).toFixed(1)}" fill="${c}" fill-opacity=".22" stroke="${a}" stroke-width="1.3"/>`;
  if(p.type==='scoop')return `<path d="M${(ox-.05*sc).toFixed(1)} ${(oy+.32*sc).toFixed(1)} Q${(ox-1.35*sc).toFixed(1)} ${oy} ${(ox-.05*sc).toFixed(1)} ${(oy-.32*sc).toFixed(1)}" fill="none" stroke="${a}" stroke-width="1.3"/>`;
  return '';
 }).join('');
 const cockpit=def.cockpit?`<ellipse cx="${(ox+def.cockpit.x*sc).toFixed(1)}" cy="${oy}" rx="5.2" ry="3.6" fill="url(#${gid}-g)"/>`:'';
 const flames=(def.nozzles||[]).map(([nx,ny],i)=>{
  const x=ox+nx*sc,y=oy+ny*sc,op=i?'.4':'.65';
  return `<path d="M${x.toFixed(1)} ${(y-5).toFixed(1)} L${(x-14).toFixed(1)} ${y.toFixed(1)} L${x.toFixed(1)} ${(y+5).toFixed(1)}Z" fill="${a}" opacity="${op}"/>`;
 }).join('');
 const bells=(def.nozzles||[]).map(([nx,ny])=>{
  const x=ox+nx*sc+1,y=oy+ny*sc;
  return `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="3.2" ry="2.2" fill="${shadow}" stroke="${c}" stroke-width="0.8"/>`;
 }).join('');
 const accents=(def.accents||[]).map(bar=>`<rect x="${(ox+bar.x*sc).toFixed(1)}" y="${(oy+bar.y*sc).toFixed(1)}" width="${bar.w}" height="${bar.h}" fill="${a}" opacity=".75"/>`).join('');
 return `<svg class="ship-preview" viewBox="0 0 120 72" aria-hidden="true">${defs}${flames}${body}${spine}${parts}${bells}${cockpit}${accents}</svg>`;
}

export function sampleShipColor(classId,nx=0,ny=0){
 const art=artOf(classId);
 const lit=Math.max(0,1-(nx+1)*.28-(ny+1)*.18);
 return mix(mix(art.shadow,art.metal,.55+lit*.3),art.plate,lit*.45);
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

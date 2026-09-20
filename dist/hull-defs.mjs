/** Data-driven player hull silhouettes. Shared by flight canvas and hangar SVG previews. */
const stroke=(pts,alpha=.55)=>({type:'stroke',pts,alpha});
const rect=(x,y,w,h,alpha=.5)=>({type:'rect',x,y,w,h,alpha});
const accentBar=(x,y,w,h)=>({type:'accent',x,y,w,h,alpha:.7});
const boom=(pts)=>({type:'poly',pts,alpha:1});
const dish=(x,y,r)=>({type:'arc',x,y,r,alpha:.9});

export const HULL_DEFS={
 wren:{
  body:[[1.3,0],[-.1,.48],[-1,.32],[-.45,0],[-1,-.32],[-.1,-.48]],
  parts:[stroke([[.7,0],[-.35,0]]),rect(-.22,-.1,.62,.2)],
  nozzles:[[-1,0]],cockpit:{x:.4,rx:4.5,ry:3},lights:{y:.48},accents:[]
 },
 mule:{
  body:[[1.05,0],[.35,.78],[-.85,.9],[-1,.35],[-.7,0],[-1,-.35],[-.85,-.9],[.35,-.78]],
  parts:[rect(-.55,-.45,.7,.9),stroke([[-.2,-.45],[-.2,.45]]),stroke([[.05,-.4],[.05,.4]])],
  nozzles:[[-1,.38],[-1,-.38]],cockpit:{x:.35,rx:5.5,ry:4.2},lights:{y:.48},accents:[]
 },
 kestrel:{
  body:[[1.35,0],[.15,.42],[-.35,.95],[-.15,.35],[-1,.48],[-.55,0],[-1,-.48],[-.15,-.35],[-.35,-.95],[.15,-.42]],
  parts:[stroke([[.55,0],[-.2,0]]),stroke([[-.05,.55],[.2,.2]]),stroke([[-.05,-.55],[.2,-.2]])],
  nozzles:[[-1,.28],[-1,-.28]],cockpit:{x:.55,rx:5,ry:3.2},lights:{y:.48},
  accents:[accentBar(.1,.62,7,2),accentBar(.1,-.62-2/18,7,2)]
 },
 sparrow:{
  body:[[1.4,0],[.05,.36],[-.95,.22],[-.5,0],[-.95,-.22],[.05,-.36]],
  parts:[stroke([[.75,0],[-.25,0]]),rect(-.18,-.08,.52,.16)],
  nozzles:[[-1,0]],cockpit:{x:.5,rx:3.8,ry:2.4},lights:{y:.36},accents:[]
 },
 rook:{
  body:[[1.1,0],[.2,.62],[-.9,.7],[-1,.28],[-.55,0],[-1,-.28],[-.9,-.7],[.2,-.62]],
  parts:[boom([[.15,.25],[.55,.4],[.45,.55],[.08,.42]]),stroke([[-.1,0],[-.7,0]])],
  nozzles:[[-1,.22],[-1,-.22]],cockpit:{x:.3,rx:4.5,ry:3.2},lights:{y:.55},accents:[]
 },
 tern:{
  body:[[1.45,0],[.1,.38],[-.85,.3],[-1.05,.08],[-.4,0],[-1.05,-.08],[-.85,-.3],[.1,-.38]],
  parts:[stroke([[.6,0],[-.3,0]]),stroke([[-.2,.22],[.15,.12]]),stroke([[-.2,-.22],[.15,-.12]]),rect(-.18,-.08,.48,.16)],
  nozzles:[[-1.05,0]],cockpit:{x:.55,rx:4.2,ry:2.6},lights:{y:.38},accents:[]
 },
 magpie:{
  body:[[1.2,0],[.4,.58],[-.7,.72],[-1.05,.3],[-.65,0],[-1.05,-.3],[-.7,-.72],[.4,-.58]],
  parts:[rect(-.4,-.35,.55,.7),stroke([[0,-.35],[0,.35]])],
  nozzles:[[-1.05,.3],[-1.05,-.3]],cockpit:{x:.4,rx:5,ry:3.4},lights:{y:.5},accents:[]
 },
 jackal:{
  body:[[1.25,0],[.25,.4],[-.2,.85],[-.05,.32],[-1,.42],[-.5,0],[-1,-.42],[-.05,-.32],[-.2,-.85],[.25,-.4]],
  parts:[stroke([[.5,0],[-.25,0]]),stroke([[.05,.5],[.25,.22]]),stroke([[.05,-.5],[.25,-.22]])],
  nozzles:[[-1,.2],[-1,-.2]],cockpit:{x:.45,rx:4.4,ry:2.8},lights:{y:.55},
  accents:[accentBar(.05,.7,6,1.8),accentBar(.05,-.7-1.8/18,6,1.8)]
 },
 mole:{
  body:[[.95,0],[.25,.85],[-.95,.95],[-1.1,.4],[-.75,0],[-1.1,-.4],[-.95,-.95],[.25,-.85]],
  parts:[rect(-.6,-.55,.75,1.1),stroke([[-.25,-.55],[-.25,.55]]),stroke([[.1,-.5],[.1,.5]]),boom([[.2,.35],[.65,.5],[.55,.65],[.15,.52]])],
  nozzles:[[-1.1,.42],[-1.1,-.42]],cockpit:{x:.25,rx:5.2,ry:4},lights:{y:.6},accents:[]
 },
 osprey:{
  body:[[1.35,0],[.2,.45],[-.45,.78],[-.2,.3],[-1.05,.38],[-.55,0],[-1.05,-.38],[-.2,-.3],[-.45,-.78],[.2,-.45]],
  parts:[stroke([[.65,0],[-.15,0]]),dish(-.15,-.85,.32)],
  nozzles:[[-1.05,.18],[-1.05,-.18]],cockpit:{x:.5,rx:4.8,ry:3},lights:{y:.5},accents:[]
 },
 falcon:{
  body:[[1.5,0],[.2,.32],[-.5,.88],[-.15,.28],[-1.05,.35],[-.45,0],[-1.05,-.35],[-.15,-.28],[-.5,-.88],[.2,-.32]],
  parts:[stroke([[.7,0],[-.1,0]]),stroke([[0,.55],[.3,.18]]),stroke([[0,-.55],[.3,-.18]])],
  nozzles:[[-1.05,.22],[-1.05,-.22]],cockpit:{x:.6,rx:4.5,ry:2.6},lights:{y:.55},
  accents:[accentBar(.15,.72,8,1.6),accentBar(.15,-.72-1.6/18,8,1.6)]
 },
 albatross:{
  body:[[1.15,0],[.55,.42],[-.35,.55],[-1.15,.48],[-.85,0],[-1.15,-.48],[-.35,-.55],[.55,-.42]],
  parts:[stroke([[.4,0],[-.6,0]]),rect(-.7,-.28,.55,.56),dish(.15,.7,.28)],
  nozzles:[[-1.15,.28],[-1.15,-.28]],cockpit:{x:.45,rx:5.5,ry:3.5},lights:{y:.42},accents:[]
 },
 ox:{
  body:[[.9,0],[.15,.88],[-1,.98],[-1.15,.42],[-.8,0],[-1.15,-.42],[-1,-.98],[.15,-.88]],
  parts:[rect(-.7,-.65,.85,1.3),stroke([[-.35,-.65],[-.35,.65]]),stroke([[0,-.6],[0,.6]]),stroke([[.25,-.55],[.25,.55]])],
  nozzles:[[-1.15,.48],[-1.15,0],[-1.15,-.48]],cockpit:{x:.2,rx:5.8,ry:4.5},lights:{y:.65},accents:[]
 },
 vulture:{
  body:[[1.3,0],[.15,.48],[-.55,.82],[-.25,.35],[-1.1,.55],[-.6,0],[-1.1,-.55],[-.25,-.35],[-.55,-.82],[.15,-.48]],
  parts:[stroke([[.45,0],[-.3,0]]),rect(-.55,-.25,.4,.5)],
  nozzles:[[-1.1,.32],[-1.1,-.32]],cockpit:{x:.4,rx:4.6,ry:3},lights:{y:.55},
  accents:[accentBar(.0,.68,7,2),accentBar(.0,-.68-2/18,7,2)]
 },
 heron:{
  body:[[1.4,0],[.35,.35],[-.25,.62],[-.1,.25],[-1,.32],[-.5,0],[-1,-.32],[-.1,-.25],[-.25,-.62],[.35,-.35]],
  parts:[stroke([[.7,0],[-.2,0]]),dish(-.05,-.9,.38),dish(-.05,.9,.28)],
  nozzles:[[-1,.15],[-1,-.15]],cockpit:{x:.55,rx:5,ry:3.1},lights:{y:.45},accents:[]
 },
 badger:{
  body:[[1.0,0],[.3,.78],[-.85,.92],[-1.15,.45],[-.7,0],[-1.15,-.45],[-.85,-.92],[.3,-.78]],
  parts:[rect(-.55,-.6,.7,1.2),boom([[.25,.4],[.7,.55],[.6,.72],[.18,.58]]),stroke([[-.15,-.6],[-.15,.6]])],
  nozzles:[[-1.15,.38],[-1.15,-.38]],cockpit:{x:.28,rx:5.4,ry:4},lights:{y:.6},accents:[]
 },
 raptor:{
  body:[[1.35,0],[.3,.42],[-.15,.95],[.05,.35],[-.95,.55],[-.5,0],[-.95,-.55],[.05,-.35],[-.15,-.95],[.3,-.42]],
  parts:[stroke([[.55,0],[-.15,0]]),stroke([[.1,.6],[.35,.25]]),stroke([[.1,-.6],[.35,-.25]])],
  nozzles:[[-1,.35],[-1,0],[-1,-.35]],cockpit:{x:.5,rx:5,ry:3.2},lights:{y:.55},
  accents:[accentBar(.1,.78,9,2.2),accentBar(.1,-.78-2.2/18,9,2.2)]
 },
 condor:{
  body:[[1.25,0],[.45,.5],[-.4,.68],[-1.2,.52],[-.9,0],[-1.2,-.52],[-.4,-.68],[.45,-.5]],
  parts:[stroke([[.5,0],[-.55,0]]),rect(-.75,-.32,.6,.64),dish(.2,.78,.35)],
  nozzles:[[-1.2,.35],[-1.2,-.35]],cockpit:{x:.4,rx:5.6,ry:3.8},lights:{y:.48},accents:[]
 },
 goliath:{
  body:[[.85,0],[.1,.95],[-1.05,1.05],[-1.25,.5],[-.85,0],[-1.25,-.5],[-1.05,-1.05],[.1,-.95]],
  parts:[rect(-.85,-.75,1.0,1.5),stroke([[-.5,-.75],[-.5,.75]]),stroke([[-.15,-.7],[-.15,.7]]),stroke([[.2,-.65],[.2,.65]])],
  nozzles:[[-1.25,.55],[-1.25,.18],[-1.25,-.18],[-1.25,-.55]],cockpit:{x:.15,rx:6,ry:4.8},lights:{y:.7},accents:[]
 },
 eagle:{
  body:[[1.4,0],[.35,.48],[-.2,1.05],[.05,.38],[-1.05,.62],[-.55,0],[-1.05,-.62],[.05,-.38],[-.2,-1.05],[.35,-.48]],
  parts:[stroke([[.6,0],[-.2,0]]),stroke([[.05,.7],[.35,.3]]),stroke([[.05,-.7],[.35,-.3]])],
  nozzles:[[-1.05,.4],[-1.05,.12],[-1.05,-.12],[-1.05,-.4]],cockpit:{x:.5,rx:5.5,ry:3.5},lights:{y:.6},
  accents:[accentBar(.15,.88,10,2.4),accentBar(.15,-.88-2.4/18,10,2.4)]
 }
};

export function getHullDef(id){return HULL_DEFS[id]||HULL_DEFS.wren;}

function pathBody(ctx,body,size,ox=0,oy=0){
 ctx.beginPath();
 body.forEach(([x,y],i)=>{const px=x*size+ox,py=y*size+oy;if(i)ctx.lineTo(px,py);else ctx.moveTo(px,py);});
 ctx.closePath();
}

/** Fallback painter — ship-render.mjs is the live path. Keep this grounded, not neon. */
export function drawHullDef(ctx,def,size,color,accent,opts={}){
 const {thrust=0,boost=false,clock=0,drawCockpit=true,drawLights=true}=opts;
 if(thrust>.04){
  const len=(10+Math.random()*(boost?52:18))*thrust,flame=boost?'#9bfff0':'#76efdb';
  ctx.fillStyle=flame;ctx.globalAlpha=.45;
  const scale=def.nozzles.length>1?.85:1;
  for(const [nx,ny] of def.nozzles){
   const x=nx*size+(nx<0?2:0),y=ny*size;
   ctx.beginPath();ctx.moveTo(x,y-2.4);ctx.lineTo(x-len*scale,y);ctx.lineTo(x,y+2.4);ctx.fill();
  }
  if(boost){ctx.globalAlpha=.2;ctx.beginPath();ctx.arc(-size-len*.35,0,8+thrust*10,0,6.28);ctx.fill();}
  ctx.globalAlpha=1;
 }
 const metal=opts.metal||'#2a3840';
 const tx=Math.max(1.4,size*.07),ty=Math.max(1.8,size*.1);
 ctx.fillStyle='#14181c';
 pathBody(ctx,def.body,size,tx,ty);ctx.fill();
 ctx.fillStyle=metal;ctx.strokeStyle='#12181c';ctx.lineWidth=1.4;
 pathBody(ctx,def.body,size);ctx.fill();
 ctx.save();pathBody(ctx,def.body,size);ctx.clip();
 const lx=opts.lightX??-1,ly=opts.lightY??-.7,len=Math.hypot(lx,ly)||1;
 const g=ctx.createLinearGradient(-lx/len*size,-ly/len*size,lx/len*size,ly/len*size);
 g.addColorStop(0,'#ffffff24');g.addColorStop(.4,'#0000');g.addColorStop(.72,'#00040c66');g.addColorStop(1,'#00040cc4');
 ctx.fillStyle=g;ctx.fill();ctx.restore();
 pathBody(ctx,def.body,size);ctx.stroke();
 for(const p of def.parts||[]){
  ctx.globalAlpha=p.alpha??.55;ctx.strokeStyle='#1a242c';ctx.fillStyle='#243038';
  if(p.type==='stroke'){ctx.beginPath();p.pts.forEach(([x,y],i)=>{const px=x*size,py=y*size;if(i)ctx.lineTo(px,py);else ctx.moveTo(px,py);});ctx.stroke();}
  else if(p.type==='rect'){ctx.fillRect(p.x*size,p.y*size,p.w*size,p.h*size);ctx.strokeRect(p.x*size,p.y*size,p.w*size,p.h*size);}
  else if(p.type==='poly'){pathBody(ctx,p.pts,size);ctx.fill();ctx.stroke();}
  else if(p.type==='arc'){ctx.beginPath();ctx.arc(p.x*size,p.y*size,p.r*size,0,6.28);ctx.stroke();ctx.globalAlpha=(p.alpha??.55)*.45;ctx.fill();ctx.globalAlpha=p.alpha??.55;}
  ctx.globalAlpha=1;
 }
 for(const [nx,ny] of def.nozzles||[]){
  const x=nx*size+(nx<0?1.2:0),y=ny*size;
  ctx.fillStyle='#243038';ctx.fillRect(x,y-3.2,6,6.4);
  ctx.fillStyle='#5a3828';ctx.beginPath();ctx.ellipse(x,y,3.2,2.4,0,0,6.28);ctx.fill();
  ctx.fillStyle='#0a0808';ctx.beginPath();ctx.ellipse(x-.4,y,1.6,1.1,0,0,6.28);ctx.fill();
 }
 if(drawCockpit&&def.cockpit){
  const c=def.cockpit;
  ctx.fillStyle='#2a3840';ctx.beginPath();ctx.ellipse(c.x*size,0,c.rx+1.4,c.ry+1.2,0,0,6.28);ctx.fill();
  ctx.fillStyle='#14343c';ctx.beginPath();ctx.ellipse(c.x*size,0,c.rx,c.ry,0,0,6.28);ctx.fill();
 }
 if(drawLights&&def.lights){
  const ly=def.lights.y*size,blink=((clock*2.6)%1)<.5;
  ctx.fillStyle=blink?'#b84444':'#322828';ctx.fillRect(-2,ly,2.8,2.8);
  ctx.fillStyle=blink?'#243028':'#3d8a58';ctx.fillRect(-2,-ly-2.8,2.8,2.8);
 }
 for(const a of def.accents||[]){
  ctx.fillStyle=accent;ctx.globalAlpha=.4;
  ctx.fillRect(a.x*size,a.y*size,a.w,Math.max(1.2,a.h*.65));ctx.globalAlpha=1;
 }
}

function hexRgb(h){
 const n=String(h||'#88a').replace('#','');
 const s=n.length===3?n.split('').map(ch=>ch+ch).join(''):n;
 return[parseInt(s.slice(0,2),16)||0,parseInt(s.slice(2,4),16)||0,parseInt(s.slice(4,6),16)||0];
}
function rgbHex(r,g,b){return '#'+[r,g,b].map(v=>Math.max(0,Math.min(255,v|0)).toString(16).padStart(2,'0')).join('');}
function mixHex(a,b,t){const A=hexRgb(a),B=hexRgb(b);return rgbHex(A[0]+(B[0]-A[0])*t,A[1]+(B[1]-A[1])*t,A[2]+(B[2]-A[2])*t);}

/** Fallback hangar SVG — live hangar uses ship-render.mjs. */
export function hullPreviewSvg(ship){
 const def=getHullDef(ship.id),c=ship.color||'#b7f0e4',a=ship.accent||c;
 const ox=68,oy=40,sc=25,gid='p'+(ship.id||'wren');
 const metal=mixHex(c,'#1a242c',.82),hi=mixHex(c,'#8a9aa4',.35),lo='#12181c';
 const pt=([x,y],dx=0,dy=0)=>`${(ox+x*sc+dx).toFixed(1)},${(oy+y*sc+dy).toFixed(1)}`;
 const poly=(pts,dx=0,dy=0)=>pts.map(p=>pt(p,dx,dy)).join(' ');
 const defs=`<defs><linearGradient id="${gid}" x1="50%" y1="0%" x2="50%" y2="100%"><stop offset="0" stop-color="${lo}"/><stop offset=".3" stop-color="${hi}"/><stop offset="1" stop-color="${lo}"/></linearGradient></defs>`;
 const thick=`<polygon class="hull-thick" points="${poly(def.body,2.4,3.4)}" fill="${lo}"/>`;
 const body=`<polygon points="${poly(def.body)}" fill="url(#${gid})" stroke="${lo}" stroke-width="1.4"/>`;
 const parts=(def.parts||[]).map(p=>{
  if(p.type==='stroke')return `<polyline points="${poly(p.pts)}" fill="none" stroke="${lo}" stroke-width="1.1" opacity=".5"/>`;
  if(p.type==='rect')return `<rect x="${(ox+p.x*sc).toFixed(1)}" y="${(oy+p.y*sc).toFixed(1)}" width="${(p.w*sc).toFixed(1)}" height="${(p.h*sc).toFixed(1)}" fill="${metal}" stroke="${lo}" stroke-width="1"/>`;
  if(p.type==='poly')return `<polygon points="${poly(p.pts)}" fill="${metal}" stroke="${lo}" stroke-width="1.2"/>`;
  if(p.type==='arc')return `<circle cx="${(ox+p.x*sc).toFixed(1)}" cy="${(oy+p.y*sc).toFixed(1)}" r="${(p.r*sc).toFixed(1)}" fill="${metal}" stroke="${lo}" stroke-width="1.1"/>`;
  return '';
 }).join('');
 const cockpit=def.cockpit?`<g><ellipse cx="${(ox+def.cockpit.x*sc).toFixed(1)}" cy="${oy}" rx="6" ry="4.2" fill="${metal}"/><ellipse cx="${(ox+def.cockpit.x*sc).toFixed(1)}" cy="${oy}" rx="4.8" ry="3.2" fill="#14343c"/></g>`:'';
 const flames=(def.nozzles||[]).map(([nx,ny],i)=>{
  const x=ox+nx*sc,y=oy+ny*sc;
  return `<path d="M${x.toFixed(1)} ${(y-2.4).toFixed(1)} L${(x-11).toFixed(1)} ${y.toFixed(1)} L${x.toFixed(1)} ${(y+2.4).toFixed(1)}Z" fill="${a}" opacity="${i?'.22':'.32'}"/>`;
 }).join('');
 const bells=(def.nozzles||[]).map(([nx,ny])=>{
  const x=ox+nx*sc+1,y=oy+ny*sc;
  return `<g><rect x="${x.toFixed(1)}" y="${(y-4).toFixed(1)}" width="7" height="8" fill="${metal}" stroke="${lo}"/><ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="3.4" ry="2.5" fill="#5a3828"/><ellipse cx="${(x-.4).toFixed(1)}" cy="${y.toFixed(1)}" rx="1.6" ry="1.1" fill="#0a0808"/></g>`;
 }).join('');
 const accents=(def.accents||[]).map(bar=>`<rect x="${(ox+bar.x*sc).toFixed(1)}" y="${(oy+bar.y*sc).toFixed(1)}" width="${bar.w}" height="${Math.max(1.2,bar.h*.65)}" fill="${a}" opacity=".38"/>`).join('');
 return `<svg class="ship-preview" viewBox="0 0 136 84" aria-hidden="true">${defs}${flames}${thick}${body}${parts}${bells}${cockpit}${accents}</svg>`;
}

/** Data-driven player hull silhouettes. Shared by flight canvas and hangar SVG previews. */
/** Scenario redesign batch 1 side plates. Alts stay out of dist. Missing file falls back to procedural paint. */
export const SHIP_PLATES={
 wren:'assets/ships/wren.png',
 sparrow:'assets/ships/sparrow.png',
 kestrel:'assets/ships/kestrel.png',
 mule:'assets/ships/mule.png',
 rook:'assets/ships/rook.png',
 tern:'assets/ships/tern.png',
 jackal:'assets/ships/jackal.png'
};
export function shipPlateUrl(id){return SHIP_PLATES[id]||null;}
const stroke=(pts,alpha=.55)=>({type:'stroke',pts,alpha});
const rect=(x,y,w,h,alpha=.5)=>({type:'rect',x,y,w,h,alpha});
const accentBar=(x,y,w,h)=>({type:'accent',x,y,w,h,alpha:.7});
const boom=(pts)=>({type:'poly',pts,alpha:1});
const dish=(x,y,r)=>({type:'arc',x,y,r,alpha:.9});

export const HULL_DEFS={
 wren:{
  body:[[1.3,0],[.32,.4],[-.38,.42],[-.88,.3],[-1.16,.16],[-1.16,-.16],[-.88,-.3],[-.38,-.42],[.32,-.4]],
  parts:[stroke([[.68,0],[-.32,0]]),rect(-.2,-.1,.58,.2)],
  nozzles:[[-1.16,0]],cockpit:{x:.4,rx:4.5,ry:3},lights:{y:.36},accents:[]
 },
 mule:{
  body:[[1.0,0],[.42,.7],[-.42,.86],[-.9,.7],[-1.14,.5],[-1.14,.24],[-.86,.1],[-.86,-.1],[-1.14,-.24],[-1.14,-.5],[-.9,-.7],[-.42,-.86],[.42,-.7]],
  parts:[rect(-.5,-.42,.68,.84),stroke([[-.18,-.42],[-.18,.42]]),stroke([[.08,-.38],[.08,.38]])],
  nozzles:[[-1.14,.38],[-1.14,-.38]],cockpit:{x:.32,rx:5.2,ry:3.8},lights:{y:.62},accents:[]
 },
 kestrel:{
  body:[[1.34,0],[.28,.4],[-.18,.86],[-.48,.78],[-.32,.4],[-1.0,.4],[-1.14,.26],[-1.14,-.26],[-1.0,-.4],[-.32,-.4],[-.48,-.78],[-.18,-.86],[.28,-.4]],
  parts:[stroke([[.55,0],[-.2,0]]),stroke([[-.05,.5],[.2,.18]]),stroke([[-.05,-.5],[.2,-.18]])],
  nozzles:[[-1.14,.18],[-1.14,-.18]],cockpit:{x:.52,rx:5,ry:3.2},lights:{y:.78},
  hardpoints:[[-.24,.7],[-.24,-.7]],
  accents:[accentBar(-.08,.74,7,2),accentBar(-.08,-.74-2/18,7,2)]
 },
 sparrow:{
  body:[[1.44,0],[.3,.28],[-.58,.24],[-1.06,.12],[-1.06,-.12],[-.58,-.24],[.3,-.28]],
  parts:[stroke([[.75,0],[-.25,0]]),rect(-.18,-.08,.52,.16)],
  nozzles:[[-1.06,0]],cockpit:{x:.5,rx:3.8,ry:2.4},lights:{y:.22},accents:[]
 },
 rook:{
  body:[[1.08,0],[.28,.58],[-.48,.66],[-.95,.5],[-1.1,.26],[-1.1,-.26],[-.95,-.5],[-.48,-.66],[.28,-.58]],
  parts:[boom([[.12,.22],[.5,.36],[.4,.5],[.05,.38]]),stroke([[-.1,0],[-.7,0]])],
  nozzles:[[-1.1,.16],[-1.1,-.16]],cockpit:{x:.3,rx:4.5,ry:3.2},lights:{y:.52},accents:[]
 },
 tern:{
  body:[[1.46,0],[.24,.32],[-.64,.26],[-1.1,.12],[-1.1,-.12],[-.64,-.26],[.24,-.32]],
  parts:[stroke([[.6,0],[-.3,0]]),stroke([[-.2,.2],[.15,.1]]),stroke([[-.2,-.2],[.15,-.1]]),rect(-.18,-.08,.48,.16)],
  nozzles:[[-1.1,0]],cockpit:{x:.55,rx:4.2,ry:2.6},lights:{y:.24},accents:[]
 },
 magpie:{
  body:[[1.18,0],[.46,.54],[-.38,.66],[-.92,.5],[-1.1,.32],[-1.1,.1],[-.78,0],[-1.1,-.1],[-1.1,-.32],[-.92,-.5],[-.38,-.66],[.46,-.54]],
  parts:[rect(-.38,-.32,.52,.64),stroke([[.02,-.32],[.02,.32]])],
  nozzles:[[-1.1,.22],[-1.1,-.22]],cockpit:{x:.4,rx:5,ry:3.4},lights:{y:.5},accents:[]
 },
 jackal:{
  body:[[1.24,0],[.3,.38],[-.16,.8],[-.46,.72],[-.3,.36],[-1.0,.36],[-1.12,.2],[-1.12,-.2],[-1.0,-.36],[-.3,-.36],[-.46,-.72],[-.16,-.8],[.3,-.38]],
  parts:[stroke([[.5,0],[-.25,0]]),stroke([[.05,.48],[.25,.2]]),stroke([[.05,-.48],[.25,-.2]])],
  nozzles:[[-1.12,.14],[-1.12,-.14]],cockpit:{x:.45,rx:4.4,ry:2.8},lights:{y:.72},
  hardpoints:[[-.22,.64],[-.22,-.64]],
  accents:[accentBar(-.06,.68,6,1.8),accentBar(-.06,-.68-1.8/18,6,1.8)]
 },
 mole:{
  body:[[.92,0],[.3,.8],[-.48,.9],[-.98,.7],[-1.16,.44],[-1.16,.18],[-.86,.06],[-.86,-.06],[-1.16,-.18],[-1.16,-.44],[-.98,-.7],[-.48,-.9],[.3,-.8]],
  parts:[rect(-.55,-.5,.7,1.0),stroke([[-.22,-.5],[-.22,.5]]),stroke([[.1,-.46],[.1,.46]]),boom([[.18,.32],[.6,.46],[.5,.6],[.12,.48]])],
  nozzles:[[-1.16,.32],[-1.16,-.32]],cockpit:{x:.24,rx:5.2,ry:4},lights:{y:.68},accents:[]
 },
 osprey:{
  body:[[1.34,0],[.24,.4],[-.1,.56],[-.06,.7],[-.34,.64],[-.38,.34],[-1.02,.3],[-1.14,.14],[-1.14,-.14],[-1.02,-.3],[-.38,-.34],[-.1,-.56],[.24,-.4]],
  parts:[stroke([[.65,0],[-.15,0]]),dish(-.18,.52,.16)],
  nozzles:[[-1.14,.1],[-1.14,-.1]],cockpit:{x:.5,rx:4.8,ry:3},lights:{y:.54},accents:[]
 },
 falcon:{
  body:[[1.48,0],[.28,.3],[-.22,.82],[-.52,.74],[-.32,.32],[-1.02,.32],[-1.14,.18],[-1.14,-.18],[-1.02,-.32],[-.32,-.32],[-.52,-.74],[-.22,-.82],[.28,-.3]],
  parts:[stroke([[.7,0],[-.1,0]]),stroke([[0,.5],[.28,.16]]),stroke([[0,-.5],[.28,-.16]])],
  nozzles:[[-1.14,.12],[-1.14,-.12]],cockpit:{x:.58,rx:4.5,ry:2.6},lights:{y:.74},
  hardpoints:[[-.26,.66],[-.26,-.66]],
  accents:[accentBar(-.04,.7,8,1.6),accentBar(-.04,-.7-1.6/18,8,1.6)]
 },
 albatross:{
  body:[[1.14,0],[.55,.4],[-.26,.5],[-.2,.64],[-.48,.56],[-1.08,.4],[-1.16,.2],[-1.16,-.2],[-1.08,-.4],[-.48,-.56],[-.2,-.64],[-.26,-.5],[.55,-.4]],
  parts:[stroke([[.4,0],[-.55,0]]),rect(-.65,-.26,.5,.52),dish(-.3,.48,.14)],
  nozzles:[[-1.16,.14],[-1.16,-.14]],cockpit:{x:.42,rx:5.5,ry:3.5},lights:{y:.48},accents:[]
 },
 ox:{
  body:[[.88,0],[.2,.84],[-.45,.96],[-1.0,.78],[-1.18,.52],[-1.18,-.52],[-1.0,-.78],[-.45,-.96],[.2,-.84]],
  parts:[rect(-.68,-.6,.82,1.2),stroke([[-.32,-.6],[-.32,.6]]),stroke([[.02,-.56],[.02,.56]]),stroke([[.28,-.5],[.28,.5]])],
  nozzles:[[-1.18,.34],[-1.18,0],[-1.18,-.34]],cockpit:{x:.2,rx:5.8,ry:4.5},lights:{y:.72},accents:[]
 },
 vulture:{
  body:[[1.28,0],[.22,.44],[-.28,.76],[-.55,.68],[-.38,.38],[-1.04,.42],[-1.16,.26],[-1.16,-.26],[-1.04,-.42],[-.38,-.38],[-.55,-.68],[-.28,-.76],[.22,-.44]],
  parts:[stroke([[.45,0],[-.3,0]]),rect(-.5,-.22,.38,.44)],
  nozzles:[[-1.16,.18],[-1.16,-.18]],cockpit:{x:.4,rx:4.6,ry:3},lights:{y:.68},
  hardpoints:[[-.28,.6],[-.28,-.6]],
  accents:[accentBar(-.08,.64,7,2),accentBar(-.08,-.64-2/18,7,2)]
 },
 heron:{
  body:[[1.38,0],[.38,.32],[-.08,.48],[-.04,.66],[-.32,.6],[-.36,.28],[-1.0,.26],[-1.12,.12],[-1.12,-.12],[-1.0,-.26],[-.36,-.28],[-.04,-.66],[-.08,-.48],[.38,-.32]],
  parts:[stroke([[.7,0],[-.2,0]]),dish(-.16,.5,.14),dish(-.16,-.5,.12)],
  nozzles:[[-1.12,.08],[-1.12,-.08]],cockpit:{x:.52,rx:5,ry:3.1},lights:{y:.5},accents:[]
 },
 badger:{
  body:[[.98,0],[.32,.74],[-.48,.88],[-.98,.7],[-1.16,.44],[-1.16,.18],[-.82,.06],[-.82,-.06],[-1.16,-.18],[-1.16,-.44],[-.98,-.7],[-.48,-.88],[.32,-.74]],
  parts:[rect(-.52,-.55,.66,1.1),boom([[.22,.36],[.64,.5],[.54,.66],[.14,.52]]),stroke([[-.12,-.55],[-.12,.55]])],
  nozzles:[[-1.16,.32],[-1.16,-.32]],cockpit:{x:.26,rx:5.4,ry:4},lights:{y:.66},accents:[]
 },
 raptor:{
  body:[[1.34,0],[.32,.4],[-.12,.9],[-.42,.82],[-.28,.4],[-.92,.48],[-1.14,.36],[-1.14,-.36],[-.92,-.48],[-.28,-.4],[-.42,-.82],[-.12,-.9],[.32,-.4]],
  parts:[stroke([[.55,0],[-.15,0]]),stroke([[.08,.55],[.32,.22]]),stroke([[.08,-.55],[.32,-.22]])],
  nozzles:[[-1.14,.24],[-1.14,0],[-1.14,-.24]],cockpit:{x:.48,rx:5,ry:3.2},lights:{y:.82},
  hardpoints:[[-.22,.74],[-.22,-.74]],
  accents:[accentBar(-.04,.78,9,2.2),accentBar(-.04,-.78-2.2/18,9,2.2)]
 },
 condor:{
  body:[[1.24,0],[.48,.46],[-.26,.6],[-.2,.7],[-.5,.62],[-1.08,.44],[-1.18,.22],[-1.18,-.22],[-1.08,-.44],[-.5,-.62],[-.2,-.7],[-.26,-.6],[.48,-.46]],
  parts:[stroke([[.5,0],[-.5,0]]),rect(-.7,-.28,.55,.56),dish(-.32,.52,.14)],
  nozzles:[[-1.18,.16],[-1.18,-.16]],cockpit:{x:.4,rx:5.6,ry:3.8},lights:{y:.56},accents:[]
 },
 goliath:{
  body:[[.82,0],[.14,.9],[-.5,1.02],[-1.05,.82],[-1.22,.54],[-1.22,-.54],[-1.05,-.82],[-.5,-1.02],[.14,-.9]],
  parts:[rect(-.8,-.7,.95,1.4),stroke([[-.48,-.7],[-.48,.7]]),stroke([[-.12,-.65],[-.12,.65]]),stroke([[.2,-.6],[.2,.6]])],
  nozzles:[[-1.22,.38],[-1.22,.14],[-1.22,-.14],[-1.22,-.38]],cockpit:{x:.14,rx:6,ry:4.8},lights:{y:.78},accents:[]
 },
 eagle:{
  body:[[1.36,0],[.5,.36],[.14,.68],[-.16,1.0],[-.48,.92],[-.36,.5],[-.88,.52],[-1.16,.42],[-1.16,-.42],[-.88,-.52],[-.36,-.5],[-.48,-.92],[-.16,-1.0],[.14,-.68],[.5,-.36]],
  parts:[stroke([[.58,0],[-.2,0]]),stroke([[.04,.62],[.32,.28]]),stroke([[.04,-.62],[.32,-.28]])],
  nozzles:[[-1.16,.3],[-1.16,.12],[-1.16,-.12],[-1.16,-.3]],cockpit:{x:.48,rx:5.4,ry:3.4},lights:{y:.88},
  hardpoints:[[-.28,.82],[-.28,-.82]],
  accents:[accentBar(-.06,.86,8,2),accentBar(-.06,-.86-2/18,8,2)]
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
  const face=nx*size,y=ny*size;
  ctx.fillStyle='#243038';
  ctx.beginPath();ctx.moveTo(face+7,y-2);ctx.lineTo(face+1.2,y-3.2);ctx.lineTo(face+1.2,y+3.2);ctx.lineTo(face+7,y+2);ctx.closePath();ctx.fill();
  ctx.fillRect(face-1.1,y-3.1,4.2,6.2);
  ctx.fillStyle='#5a3828';ctx.beginPath();ctx.ellipse(face,y,2.8,2.2,0,0,6.28);ctx.fill();
  ctx.fillStyle='#0a0808';ctx.beginPath();ctx.ellipse(face-.5,y,1.4,1,0,0,6.28);ctx.fill();
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
  const face=ox+nx*sc,y=oy+ny*sc;
  return `<g><polygon points="${(face+7).toFixed(1)},${(y-2).toFixed(1)} ${(face+1.2).toFixed(1)},${(y-3.2).toFixed(1)} ${(face+1.2).toFixed(1)},${(y+3.2).toFixed(1)} ${(face+7).toFixed(1)},${(y+2).toFixed(1)}" fill="${metal}"/><rect x="${(face-1.1).toFixed(1)}" y="${(y-3.1).toFixed(1)}" width="4.2" height="6.2" fill="${metal}" stroke="${lo}"/><ellipse cx="${face.toFixed(1)}" cy="${y.toFixed(1)}" rx="2.8" ry="2.2" fill="#5a3828"/><ellipse cx="${(face-.5).toFixed(1)}" cy="${y.toFixed(1)}" rx="1.4" ry="1" fill="#0a0808"/></g>`;
 }).join('');
 const accents=(def.accents||[]).map(bar=>`<rect x="${(ox+bar.x*sc).toFixed(1)}" y="${(oy+bar.y*sc).toFixed(1)}" width="${bar.w}" height="${Math.max(1.2,bar.h*.65)}" fill="${a}" opacity=".38"/>`).join('');
 return `<svg class="ship-preview" viewBox="0 0 136 84" aria-hidden="true">${defs}${flames}${thick}${body}${parts}${bells}${cockpit}${accents}</svg>`;
}

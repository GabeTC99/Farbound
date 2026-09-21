/**
 * Kind-driven planet artwork for local space.
 * Albedo is seeded once per body and cached; lighting/atmosphere composite each frame.
 */
import {PLANET_KINDS} from './system-layout.mjs';

export const PLANET_ART={
 earthlike:{limb:'#7ec8ff',haze:.58,features:['continents','clouds','ice-caps','ocean']},
 ocean:{limb:'#5ad4ec',haze:.62,features:['islands','clouds','ocean']},
 arid:{limb:'#e8b070',haze:.3,features:['dunes','canyons']},
 ice:{limb:'#c8e4ff',haze:.38,features:['cracks','ice-caps']},
 metal:{limb:'#b0c0cc',haze:.1,features:['craters','specular']},
 mineral:{limb:'#c4a070',haze:.22,features:['veins','craters']},
 volcanic:{limb:'#ff7040',haze:.42,features:['lava','ash']},
 barren:{limb:null,haze:0,features:['craters']},
 toxic:{limb:'#d4e060',haze:.86,features:['clouds','haze']},
 gas:{limb:'#e8d4a0',haze:.48,features:['bands','storm']},
 icegiant:{limb:'#98c8e0',haze:.52,features:['bands','methane']}
};

const cache=new Map();
const MAX_CACHE=28;

function hashu(n){n=Math.imul(n^(n>>>16),2246822519);n=Math.imul(n^(n>>>13),3266489917);return(n^(n>>>16))>>>0;}
function n2(x,y,seed){
 const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy;
 const u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy);
 const s=seed|0;
 const a=hashu(ix*374761393+iy*668265263+s)/4294967296;
 const b=hashu((ix+1)*374761393+iy*668265263+s)/4294967296;
 const c=hashu(ix*374761393+(iy+1)*668265263+s)/4294967296;
 const d=hashu((ix+1)*374761393+(iy+1)*668265263+s)/4294967296;
 return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v;
}
function fbm(x,y,seed,oct=5){
 let sum=0,amp=1,freq=1,norm=0;
 for(let i=0;i<oct;i++){sum+=n2(x*freq,y*freq,seed+i*19)*amp;norm+=amp;amp*=.5;freq*=2.03;}
 return sum/norm;
}
function mix(A,B,t){t=t<0?0:t>1?1:t;return[A[0]+(B[0]-A[0])*t,A[1]+(B[1]-A[1])*t,A[2]+(B[2]-A[2])*t];}
function add(A,k){return[A[0]+k,A[1]+k,A[2]+k];}
function clamp8(v){return v<0?0:v>255?255:v;}
function luma(c){return c[0]*0.3+c[1]*0.59+c[2]*0.11;}

function craterShade(nx,ny,seed,count=7){
 let s=0;
 for(let i=0;i<count;i++){
  const cx=((hashu(seed+i*13)&1023)/1023)*1.7-.85;
  const cy=((hashu(seed+i*29)&1023)/1023)*1.7-.85;
  const cr=.07+((hashu(seed+i*47)&255)/255)*.14;
  const d=Math.hypot(nx-cx,ny-cy);
  if(d<cr){const u=d/cr;s+=u>.76?(u-.76)/.24*.4:-.32*(1-u*u);}
 }
 return s;
}

function seedNum(seed){
 if(typeof seed==='number'&&Number.isFinite(seed))return seed|0;
 const s=String(seed||'0');
 let h=2166136261;
 for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619);
 return h>>>0;
}

/** RGB 0–255 for a unit-disk sample. Null outside the disk. */
export function samplePlanetColor(kindId,seed,nx,ny){
 const d2=nx*nx+ny*ny;
 if(d2>1)return null;
 return colorAt(kindId||'mineral',seedNum(seed),nx,ny,Math.sqrt(d2));
}

function colorAt(kindId,seed,nx,ny,d){
 const wrap=.55+.45*Math.sqrt(Math.max(0,1-d*d));
 let c;
 switch(kindId){
  case 'earthlike':c=earthlikeAt(seed,nx,ny);break;
  case 'ocean':c=oceanAt(seed,nx,ny);break;
  case 'arid':c=aridAt(seed,nx,ny);break;
  case 'ice':c=iceAt(seed,nx,ny);break;
  case 'metal':c=metalAt(seed,nx,ny);break;
  case 'mineral':c=mineralAt(seed,nx,ny);break;
  case 'volcanic':c=volcanicAt(seed,nx,ny);break;
  case 'barren':c=barrenAt(seed,nx,ny);break;
  case 'toxic':c=toxicAt(seed,nx,ny);break;
  case 'gas':c=gasAt(seed,nx,ny,false);break;
  case 'icegiant':c=gasAt(seed,nx,ny,true);break;
  default:c=mineralAt(seed,nx,ny);
 }
 return[clamp8(c[0]*wrap),clamp8(c[1]*wrap),clamp8(c[2]*wrap)];
}

function earthlikeAt(seed,nx,ny){
 const elev=fbm(nx*2.4,ny*2.2,seed,5);
 const lat=Math.abs(ny);
 const ocean=[18,78,118],deep=[10,48,86],land=[46,118,72],highland=[92,130,74],ice=[232,242,252],cloud=[236,246,252];
 let c;
 if(lat>.8+elev*.08)c=mix(land,ice,.75+lat*.2);
 else if(elev>.54)c=mix(land,highland,(elev-.54)*2.2);
 else c=mix(deep,ocean,elev/.54);
 const cloudN=fbm(nx*3.1+8,ny*1.8,seed+11,4);
 if(cloudN>.64)c=mix(c,cloud,(cloudN-.64)*2.4);
 if(lat>.9)c=mix(c,ice,.7);
 return c;
}
function oceanAt(seed,nx,ny){
 const elev=fbm(nx*3.2,ny*2.8,seed,5);
 const deep=[8,52,92],shelf=[22,96,128],island=[48,110,88],cloud=[230,246,250];
 let c=elev>.78?island:mix(deep,shelf,elev);
 const cloudN=fbm(nx*2.6,ny*1.6,seed+9,4);
 if(cloudN>.6)c=mix(c,cloud,(cloudN-.6)*2.1);
 return c;
}
function aridAt(seed,nx,ny){
 const dune=Math.sin((nx*7+ny*1.4+fbm(nx*3,ny*3,seed,3)*2.4)*3.2);
 const rust=[176,108,58],duneC=[214,162,92],rock=[92,62,40],canyon=[58,36,24];
 const n=fbm(nx*2.1,ny*2.4,seed,4);
 let c=mix(rust,duneC,.45+dune*.28);
 if(n<.32)c=mix(c,canyon,(.32-n)*2.2);
 if(n>.72)c=mix(c,rock,(n-.72)*2);
 return c;
}
function iceAt(seed,nx,ny){
 const n=fbm(nx*2.6,ny*2.8,seed,5);
 const sheet=[214,232,244],blue=[148,186,214],rock=[86,102,118],crack=[62,86,108];
 let c=mix(blue,sheet,n);
 if(Math.abs(ny)>.78)c=mix(c,[240,248,255],.55);
 const ridge=Math.abs(fbm(nx*6,ny*6,seed+4,3)-.5);
 if(ridge<.04)c=mix(c,crack,1-ridge/.04);
 if(n<.28)c=mix(c,rock,(.28-n)*1.6);
 return c;
}
function metalAt(seed,nx,ny){
 const n=fbm(nx*3.4,ny*3.2,seed,4);
 const base=[78,86,96],bright=[176,186,196],dark=[42,46,52];
 let c=mix(dark,base,n);
 c=mix(c,bright,Math.max(0,(n-.7)*1.8));
 c=add(c,craterShade(nx,ny,seed,8)*70);
 return c;
}
function mineralAt(seed,nx,ny){
 const n=fbm(nx*2.5,ny*2.6,seed,4);
 const rust=[168,108,70],basalt=[86,78,72],vein=[196,176,120];
 let c=mix(basalt,rust,n);
 const v=Math.abs(fbm(nx*8,ny*2.2,seed+6,3)-.5);
 if(v<.05)c=mix(c,vein,1-v/.05);
 c=add(c,craterShade(nx,ny,seed+2,5)*40);
 return c;
}
function volcanicAt(seed,nx,ny){
 const n=fbm(nx*2.8,ny*2.6,seed,5);
 const rock=[36,22,20],ash=[72,48,42],lava=[255,92,28],glow=[255,168,52];
 let c=mix(rock,ash,n);
 const flow=fbm(nx*4.6,ny*1.2,seed+8,3);
 const crack=Math.abs(fbm(nx*7,ny*2.2,seed+2,3)-.5);
 if(crack<.045)c=mix(c,lava,1-crack/.045);
 if(n>.62||flow>.7)c=mix(c,n>.78?glow:lava,Math.min(1,(Math.max(n,flow)-.62)*2.4));
 return c;
}
function barrenAt(seed,nx,ny){
 const n=fbm(nx*2.2,ny*2.2,seed,4);
 const dust=[150,142,132],rock=[96,92,88],dark=[62,60,58];
 let c=mix(rock,dust,n);
 if(n<.3)c=mix(c,dark,(.3-n)*1.4);
 c=add(c,craterShade(nx,ny,seed,11)*90);
 return c;
}
function toxicAt(seed,nx,ny){
 const swirl=fbm(nx*1.6+Math.sin(ny*3)*.4,ny*2.2,seed,5);
 const a=[132,148,42],b=[196,186,78],c=[88,110,48],haze=[210,220,120];
 let col=mix(mix(c,a,swirl),b,fbm(nx*2.8,ny*1.4,seed+3,3));
 if(swirl>.62)col=mix(col,haze,(swirl-.62)*2);
 return col;
}
function gasAt(seed,nx,ny,ice){
 const turb=fbm(nx*1.1,ny*3.2,seed,3);
 const band=Math.sin(ny*14+turb*1.05);
 const storm=Math.hypot(nx-.36,(ny-(ice?-.08:.14))*1.4);
 const warmA=[210,150,70],warmB=[120,72,40],warmC=[232,198,132],spot=[204,64,40];
 const coolA=[64,128,168],coolB=[168,206,224],coolC=[48,88,128],cspot=[230,242,248];
 const A=ice?coolA:warmA,B=ice?coolB:warmB,C=ice?coolC:warmC;
 let col=mix(mix(A,B,.5+band*.48),C,turb*.45);
 if(storm<.2)col=mix(col,ice?cspot:spot,1-storm/.2);
 return col;
}

function artOf(kindId){return PLANET_ART[kindId]||PLANET_ART.mineral;}

export function planetLimb(kindId){
 const art=artOf(kindId),def=PLANET_KINDS[kindId];
 return art.limb||(def&&def.colors[0])||'#87b3ac';
}

function makeCanvas(size){
 if(typeof OffscreenCanvas!=='undefined')return new OffscreenCanvas(size,size);
 if(typeof document!=='undefined'){const c=document.createElement('canvas');c.width=c.height=size;return c;}
 return null;
}

function paintAlbedo(canvas,kindId,seed,size){
 const ctx=canvas.getContext('2d');
 const img=ctx.createImageData(size,size);
 const data=img.data,cx=size*.5,r=size*.5-1;
 for(let y=0;y<size;y++){
  for(let x=0;x<size;x++){
   const nx=(x-cx)/r,ny=(y-cx)/r,d2=nx*nx+ny*ny,i=(y*size+x)*4;
   if(d2>1){data[i+3]=0;continue;}
   const d=Math.sqrt(d2);
   const c=colorAt(kindId,seed,nx,ny,d);
   const edge=d>.97?Math.max(0,(1-d)/.03):1;
   data[i]=c[0];data[i+1]=c[1];data[i+2]=c[2];data[i+3]=(255*edge)|0;
  }
 }
 ctx.putImageData(img,0,0);
 return canvas;
}

function textureFor(p,lite){
 const kindId=p.kindId||'mineral';
 const seed=seedNum(p.seed||p.id);
 const size=lite?96:192;
 const key=kindId+'|'+seed+'|'+size;
 const hit=cache.get(key);
 if(hit){cache.delete(key);cache.set(key,hit);return hit;}
 const canvas=makeCanvas(size);
 if(!canvas)return null;
 paintAlbedo(canvas,kindId,seed,size);
 cache.set(key,canvas);
 if(cache.size>MAX_CACHE)cache.delete(cache.keys().next().value);
 return canvas;
}

export function clearPlanetTextures(){cache.clear();}

/** Paint a body's albedo off the hot path (after a jump or on launch). */
export function warmPlanetTexture(p,lite=false){
 if(!p)return null;
 return textureFor(p,!!lite);
}

function drawRings(ctx,p,front){
 const col=p.color||'#c8b898';
 ctx.save();
 ctx.translate(p.x,p.y);
 ctx.rotate(-.4);
 ctx.beginPath();
 ctx.rect(-p.r*2.2,front?0:-p.r*1.2,p.r*4.4,p.r*1.2);
 ctx.clip();
 ctx.strokeStyle=col+(front?'99':'55');
 ctx.lineWidth=Math.max(2.5,p.r*.07);
 ctx.beginPath();ctx.ellipse(0,0,p.r*1.72,p.r*.4,0,0,6.28);ctx.stroke();
 ctx.strokeStyle=col+(front?'66':'33');
 ctx.lineWidth=Math.max(1.4,p.r*.035);
 ctx.beginPath();ctx.ellipse(0,0,p.r*1.48,p.r*.34,0,0,6.28);ctx.stroke();
 ctx.strokeStyle='#0a121866';
 ctx.lineWidth=Math.max(2,p.r*.04);
 ctx.beginPath();ctx.ellipse(0,0,p.r*1.6,p.r*.37,0,0,6.28);ctx.stroke();
 ctx.restore();
}

function drawAtmosphere(ctx,p,art,lite){
 if(!art.limb||art.haze<=0)return;
 const span=p.r*(1.08+art.haze*(lite?.1:.2));
 const g=ctx.createRadialGradient(p.x,p.y,p.r*.86,p.x,p.y,span);
 const a0=Math.floor(20+art.haze*30).toString(16).padStart(2,'0');
 const a1=Math.floor(70+art.haze*80).toString(16).padStart(2,'0');
 g.addColorStop(0,art.limb+'00');
 g.addColorStop(.62,art.limb+a0);
 g.addColorStop(.86,art.limb+a1);
 g.addColorStop(1,art.limb+'00');
 ctx.fillStyle=g;ctx.beginPath();ctx.arc(p.x,p.y,span,0,6.28);ctx.fill();
}

/** Draw a body at world coords. opts: {lite, lightX, lightY} */
export function drawPlanetBody(ctx,p,opts={}){
 if(!p||!ctx)return;
 const lite=!!opts.lite;
 const kindId=p.kindId||'mineral';
 const art=artOf(kindId);
 const lx=opts.lightX??-1,ly=opts.lightY??-.8;
 if(p.ring)drawRings(ctx,p,false);
 if(!lite)drawAtmosphere(ctx,p,art,lite);
 else if(art.limb&&art.haze>0){ctx.strokeStyle=art.limb+'66';ctx.lineWidth=Math.max(1.2,p.r*.04);ctx.beginPath();ctx.arc(p.x,p.y,p.r+1.5,0,6.28);ctx.stroke();}
 const tex=textureFor(p,lite);
 ctx.save();
 ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,6.28);ctx.clip();
 if(tex)ctx.drawImage(tex,p.x-p.r,p.y-p.r,p.r*2,p.r*2);
 else{ctx.fillStyle=p.color||'#6a8890';ctx.fill();}
 if(!lite){
  const len=Math.hypot(lx,ly)||1,ux=lx/len,uy=ly/len;
  const gx0=p.x-ux*p.r,gy0=p.y-uy*p.r,gx1=p.x+ux*p.r,gy1=p.y+uy*p.r;
  const shade=ctx.createLinearGradient(gx0,gy0,gx1,gy1);
  shade.addColorStop(0,'#ffffff14');
  shade.addColorStop(.42,'#00000000');
  shade.addColorStop(.7,'#00040c77');
  shade.addColorStop(1,'#00040cf2');
  ctx.fillStyle=shade;ctx.fillRect(p.x-p.r,p.y-p.r,p.r*2,p.r*2);
  const hx=p.x-ux*p.r*.45,hy=p.y-uy*p.r*.45;
  const spec=ctx.createRadialGradient(hx,hy,0,hx,hy,p.r*.5);
  spec.addColorStop(0,kindId==='metal'||kindId==='ice'?'#ffffff66':'#ffffff33');
  spec.addColorStop(.4,'#ffffff10');spec.addColorStop(1,'#0000');
  ctx.fillStyle=spec;ctx.fillRect(p.x-p.r,p.y-p.r,p.r*2,p.r*2);
 }
 ctx.restore();
 if(p.ring)drawRings(ctx,p,true);
 ctx.lineWidth=1;ctx.strokeStyle=(art.limb||p.color||'#88a')+'55';
 ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,6.28);ctx.stroke();
}

export function meanPlanetColor(kindId,seed=1,step=.18){
 let r=0,g=0,b=0,n=0;
 for(let y=-.9;y<=.9;y+=step)for(let x=-.9;x<=.9;x+=step){
  const c=samplePlanetColor(kindId,seed,x,y);if(!c)continue;
  r+=c[0];g+=c[1];b+=c[2];n++;
 }
 return n?[r/n,g/n,b/n]:[0,0,0];
}

export function colorDistance(a,b){
 const dr=a[0]-b[0],dg=a[1]-b[1],db=a[2]-b[2];
 return Math.sqrt(dr*dr+dg*dg+db*db);
}

export {luma};

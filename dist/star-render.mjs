/**
 * Spectral-class star artwork for local space.
 * Photosphere is seeded once per class+seed and cached; corona/limb composite each frame.
 * Disk textures stay high-res so game zoom does not upscale a muddy 160px splat.
 */
import {STAR_TYPES} from './system-layout.mjs';

export const STAR_ART={
 O:{core:[248,252,255],hot:[198,226,255],photo:[110,168,255],limb:[64,118,220],spot:[36,64,120],corona:'#6a9cff',chromo:'#c8e4ff',coronaScale:1.72,flare:1,gran:.55,spots:0},
 B:{core:[244,248,255],hot:[210,228,255],photo:[150,190,255],limb:[88,140,220],spot:[48,72,128],corona:'#8ab4ff',chromo:'#d8ecff',coronaScale:1.62,flare:.7,gran:.5,spots:0},
 A:{core:[255,255,255],hot:[244,248,255],photo:[226,234,248],limb:[168,184,214],spot:[96,108,140],corona:'#d0dcff',chromo:'#f4f7ff',coronaScale:1.52,flare:.35,gran:.42,spots:1},
 F:{core:[255,252,236],hot:[255,244,210],photo:[255,228,168],limb:[214,176,96],spot:[140,104,48],corona:'#ffe08a',chromo:'#fff4c8',coronaScale:1.44,flare:.15,gran:.48,spots:2},
 G:{core:[255,236,186],hot:[255,214,140],photo:[232,176,88],limb:[176,112,48],spot:[110,64,28],corona:'#f0b45a',chromo:'#ffe2a0',coronaScale:1.38,flare:0,gran:.52,spots:3},
 K:{core:[255,198,140],hot:[255,160,88],photo:[232,128,56],limb:[168,72,32],spot:[96,40,22],corona:'#e88848',chromo:'#ffc080',coronaScale:1.32,flare:0,gran:.58,spots:5},
 M:{core:[255,168,120],hot:[255,112,72],photo:[200,68,48],limb:[128,32,28],spot:[72,18,16],corona:'#d05840',chromo:'#ff8868',coronaScale:1.26,flare:0,gran:.62,spots:7}
};

export const STAR_CLASS_IDS=Object.keys(STAR_ART);
export const STAR_TEX={lite:128,full:384};

const cache=new Map();
const MAX_CACHE=24;

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
function fbm(x,y,seed,oct=4){
 let sum=0,amp=1,freq=1,norm=0;
 for(let i=0;i<oct;i++){sum+=n2(x*freq,y*freq,seed+i*19)*amp;norm+=amp;amp*=.5;freq*=2.07;}
 return sum/norm;
}
/** Cellular granules: bright cell centers, hard dark lanes. */
function granule(nx,ny,seed,freq){
 const x=nx*freq,y=ny*freq;
 const ix=Math.floor(x),iy=Math.floor(y);
 let min=4;
 for(let oy=-1;oy<=1;oy++)for(let ox=-1;ox<=1;ox++){
  const jx=ix+ox,jy=iy+oy;
  const hx=hashu(jx*374761393+jy*668265263+seed)/4294967296;
  const hy=hashu(jx*1274126177+jy*3346424281+seed+19)/4294967296;
  const dx=x-(jx+hx),dy=y-(jy+hy);
  const d=dx*dx+dy*dy;
  if(d<min)min=d;
 }
 const v=Math.max(0,1-Math.sqrt(min)*1.55);
 return v*v*(3-2*v);
}
function mix(A,B,t){t=t<0?0:t>1?1:t;return[A[0]+(B[0]-A[0])*t,A[1]+(B[1]-A[1])*t,A[2]+(B[2]-A[2])*t];}
function clamp8(v){return v<0?0:v>255?255:v;}
function luma(c){return c[0]*0.3+c[1]*0.59+c[2]*0.11;}
function seedNum(seed){
 if(typeof seed==='number'&&Number.isFinite(seed))return seed|0;
 const s=String(seed||'0');
 let h=2166136261;
 for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619);
 return h>>>0;
}
function hexOf(c){return '#'+[c[0],c[1],c[2]].map(v=>clamp8(v).toString(16).padStart(2,'0')).join('');}
function withAlpha(hex,a){
 const n=Math.round(Math.max(0,Math.min(1,a))*255).toString(16).padStart(2,'0');
 return (hex.length===7?hex:hex.slice(0,7))+n;
}

export function artOfStar(spectral){return STAR_ART[spectral]||STAR_ART.G;}

/** RGB 0–255 for a unit-disk sample. Null outside the disk. */
export function sampleStarColor(spectral,seed,nx,ny){
 const d2=nx*nx+ny*ny;
 if(d2>1)return null;
 return colorAt(spectral||'G',seedNum(seed),nx,ny,Math.sqrt(d2));
}

function colorAt(spectral,seed,nx,ny,d){
 const art=artOfStar(spectral);
 const mu=Math.sqrt(Math.max(0,1-d*d));
 // Darken late so granulation stays readable; the rim still drops.
 const limb=.40+.60*Math.pow(mu,art.gran>.55?.58:.72);
 let c=mix(art.photo,art.hot,fbm(nx*6.8,ny*6.8,seed,3));
 const cells=granule(nx,ny,seed+11,8.4+art.gran*6.2);
 const wrinkle=fbm(nx*(18+art.gran*8),ny*(18+art.gran*8),seed+9,2);
 const gran=cells*.78+wrinkle*.22;
 c=mix(c,art.core,Math.max(0,gran-.36)*1.18);
 c=mix(c,art.limb,Math.max(0,.46-gran)*1.22);
 if(art.spots){
  for(let i=0;i<art.spots;i++){
   const cx=((hashu(seed+i*31)&1023)/1023)*1.5-.75;
   const cy=((hashu(seed+i*47)&1023)/1023)*1.5-.75;
   const cr=.055+((hashu(seed+i*59)&255)/255)*.08;
   const dist=Math.hypot(nx-cx,ny-cy);
   if(dist<cr){
    const u=dist/cr;
    const k=u<.48?1:Math.pow(1-(u-.48)/.52,2.4);
    c=mix(c,art.spot,k*.96);
   }
  }
 }
 const coreGlow=Math.max(0,1-d*1.4);
 c=mix(c,art.core,coreGlow*.12);
 return[clamp8(c[0]*limb),clamp8(c[1]*limb),clamp8(c[2]*limb)];
}

function makeCanvas(size){
 if(typeof OffscreenCanvas!=='undefined')return new OffscreenCanvas(size,size);
 if(typeof document!=='undefined'){const c=document.createElement('canvas');c.width=c.height=size;return c;}
 return null;
}

function paintPhotosphere(canvas,spectral,seed,size){
 const ctx=canvas.getContext('2d',{willReadFrequently:true});
 const img=ctx.createImageData(size,size);
 const data=img.data,cx=size*.5,r=size*.5-0.5;
 const aa=1.15/r;
 for(let y=0;y<size;y++){
  for(let x=0;x<size;x++){
   const nx=(x-cx)/r,ny=(y-cx)/r,d2=nx*nx+ny*ny,i=(y*size+x)*4;
   if(d2>1){data[i+3]=0;continue;}
   const d=Math.sqrt(d2);
   const c=colorAt(spectral,seed,nx,ny,d);
   const edge=d>1-aa?Math.max(0,(1-d)/aa):1;
   data[i]=c[0];data[i+1]=c[1];data[i+2]=c[2];data[i+3]=(255*edge)|0;
  }
 }
 ctx.putImageData(img,0,0);
 return canvas;
}

export function texSizeFor(p,lite,pixelScale){
 // pixelScale is kept for callers (game zoom * dpr). Size is stable so a
 // fold resize or approach no longer rebakes 192→256→384→512 mid-flight.
 if(lite)return STAR_TEX.lite;
 return STAR_TEX.full;
}

function cacheKey(spectral,seed,size){return spectral+'|'+seed+'|'+size;}

function cachedTex(spectral,seed,size){
 const exact=cache.get(cacheKey(spectral,seed,size));
 if(exact){cache.delete(cacheKey(spectral,seed,size));cache.set(cacheKey(spectral,seed,size),exact);return exact;}
 let best=null;
 for(const [k,tex] of cache){
  if(!k.startsWith(spectral+'|'+seed+'|'))continue;
  if(!best||tex.width>best.width)best=tex;
 }
 return best;
}

function bakeTex(spectral,seed,size){
 const key=cacheKey(spectral,seed,size);
 const hit=cache.get(key);
 if(hit)return hit;
 const canvas=makeCanvas(size);
 if(!canvas)return null;
 paintPhotosphere(canvas,spectral,seed,size);
 cache.set(key,canvas);
 if(cache.size>MAX_CACHE)cache.delete(cache.keys().next().value);
 return canvas;
}

function textureFor(p,lite,pixelScale){
 const spectral=p.spectral||'G';
 const seed=seedNum(p.seed||p.id||spectral);
 const size=texSizeFor(p,lite,pixelScale);
 const have=cachedTex(spectral,seed,size);
 if(have&&have.width>=size)return have;
 return bakeTex(spectral,seed,size)||have;
}

/** Paint a star's photosphere off the hot path (after a jump or on launch). */
export function warmStarTexture(p,lite=false){
 if(!p)return null;
 return textureFor(p,!!lite,1);
}

export function clearStarTextures(){cache.clear();}

export function starLimb(spectral){
 const art=artOfStar(spectral);
 return hexOf(art.limb);
}

export function starCorona(spectral){
 return artOfStar(spectral).corona;
}

function drawFlares(ctx,p,art,lite){
 if(!art.flare||lite)return;
 const n=art.flare>0.6?6:4;
 ctx.save();
 ctx.translate(p.x,p.y);
 ctx.strokeStyle=withAlpha(art.chromo,.42+art.flare*.22);
 ctx.lineWidth=Math.max(.85,p.r*.016);
 ctx.lineCap='butt';
 for(let i=0;i<n;i++){
  const a=i*(Math.PI/n);
  ctx.rotate(a);
  ctx.beginPath();
  ctx.moveTo(p.r*.96,0);
  ctx.lineTo(p.r*(1.22+art.flare*.28),0);
  ctx.stroke();
 }
 ctx.restore();
}

function drawCorona(ctx,p,art,lite){
 const span=p.r*art.coronaScale*(lite?.82:1);
 const inner=p.r*.97;
 const g=ctx.createRadialGradient(p.x,p.y,inner,p.x,p.y,span);
 g.addColorStop(0,withAlpha(art.chromo,lite?.16:.26));
 g.addColorStop(.2,withAlpha(art.corona,lite?.1:.15));
 g.addColorStop(.52,withAlpha(art.corona,.05));
 g.addColorStop(1,withAlpha(art.corona,0));
 ctx.fillStyle=g;ctx.beginPath();ctx.arc(p.x,p.y,span,0,6.28);ctx.fill();
 if(lite)return;
 const ring=ctx.createRadialGradient(p.x,p.y,p.r*.985,p.x,p.y,p.r*1.045);
 ring.addColorStop(0,withAlpha(art.chromo,0));
 ring.addColorStop(.45,withAlpha(art.chromo,.58));
 ring.addColorStop(1,withAlpha(art.corona,0));
 ctx.fillStyle=ring;ctx.beginPath();ctx.arc(p.x,p.y,p.r*1.045,0,6.28);ctx.fill();
}

/** Draw a star disc at world coords. opts: {lite, clock, pixelScale} */
export function drawStarBody(ctx,p,opts={}){
 if(!p||!ctx)return;
 const lite=!!opts.lite;
 const spectral=p.spectral||'G';
 const art=artOfStar(spectral);
 if(!lite)drawFlares(ctx,p,art,lite);
 drawCorona(ctx,p,art,lite);
 const tex=textureFor(p,lite,opts.pixelScale);
 ctx.save();
 ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,6.28);ctx.clip();
 if(tex){
  const dest=p.r*2;
  const smooth=dest>tex.width*1.06;
  ctx.imageSmoothingEnabled=smooth;
  if(smooth&&'imageSmoothingQuality'in ctx)ctx.imageSmoothingQuality='high';
  ctx.drawImage(tex,p.x-p.r,p.y-p.r,dest,dest);
 }
 else{
  const g=ctx.createRadialGradient(p.x-p.r*.18,p.y-p.r*.16,p.r*.08,p.x,p.y,p.r);
  g.addColorStop(0,hexOf(art.core));
  g.addColorStop(.45,p.color||hexOf(art.photo));
  g.addColorStop(1,hexOf(art.limb));
  ctx.fillStyle=g;ctx.fill();
 }
 if(!lite){
  const hx=p.x-p.r*.3,hy=p.y-p.r*.28;
  const spec=ctx.createRadialGradient(hx,hy,0,hx,hy,p.r*.28);
  spec.addColorStop(0,withAlpha(hexOf(art.core),.22));
  spec.addColorStop(.55,withAlpha(hexOf(art.hot),.06));
  spec.addColorStop(1,'#0000');
  ctx.fillStyle=spec;ctx.fillRect(p.x-p.r,p.y-p.r,p.r*2,p.r*2);
 }
 ctx.restore();
 ctx.lineWidth=Math.max(.7,p.r*.009);
 ctx.strokeStyle=withAlpha(hexOf(art.limb),.78);
 ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,6.28);ctx.stroke();
}

export function meanStarColor(spectral,seed=1,step=.18){
 let r=0,g=0,b=0,n=0;
 for(let y=-.9;y<=.9;y+=step)for(let x=-.9;x<=.9;x+=step){
  const c=sampleStarColor(spectral,seed,x,y);if(!c)continue;
  r+=c[0];g+=c[1];b+=c[2];n++;
 }
 return n?[r/n,g/n,b/n]:[0,0,0];
}

export function colorDistance(a,b){
 const dr=a[0]-b[0],dg=a[1]-b[1],db=a[2]-b[2];
 return Math.sqrt(dr*dr+dg*dg+db*db);
}

export {luma,STAR_TYPES};

/**
 * 3.0 New Frontier — shared lighting helpers and optional art hooks.
 * Procedural Canvas 2D stays the renderer. External PNGs under
 * assets/new-frontier/ are optional overlays and never block a frame.
 */
export const FRONTIER_EDITION='New Frontier';
export const FRONTIER_ASSET_DIR='assets/new-frontier/';

export function qualityOf(mode){
 if(mode==='performance'||mode==='balanced')return mode;
 return 'high';
}

/** Albedo cache size. Bake is once per body, not per frame. */
export function planetTexSize(quality,lite){
 if(lite||quality==='performance')return 96;
 if(quality==='balanced')return 192;
 return 256;
}

export function surfaceStep(quality,lite){
 if(lite||quality==='performance')return 16;
 if(quality==='balanced')return 10;
 return 6;
}

export function lightDir(lx=-1,ly=-.8){
 const len=Math.hypot(lx,ly)||1;
 return {x:lx/len,y:ly/len,len};
}

export function hexRgb(h){
 h=String(h||'#29434f').replace('#','');
 if(h.length===3)h=h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
 if(h.length<6)h='29434f';
 return [parseInt(h.slice(0,2),16)||0,parseInt(h.slice(2,4),16)||0,parseInt(h.slice(4,6),16)||0];
}

export function rgbHex(r,g,b){
 return '#'+[r,g,b].map(v=>Math.max(0,Math.min(255,v+.5|0)).toString(16).padStart(2,'0')).join('');
}

export function mixHex(a,b,t){
 t=t<0?0:t>1?1:t;
 const A=hexRgb(a),B=hexRgb(b);
 return rgbHex(A[0]+(B[0]-A[0])*t,A[1]+(B[1]-A[1])*t,A[2]+(B[2]-A[2])*t);
}

export function fadeHex(h,a){
 const [r,g,b]=hexRgb(h);
 return `rgba(${r},${g},${b},${a<0?0:a>1?1:a})`;
}

export function shadeHex(h,k){
 const [r,g,b]=hexRgb(h);
 return rgbHex(r*k,g*k,b*k);
}

/** Seeded sun azimuth for surfaces that do not know the host star. */
export function surfaceSun(seed=1){
 const a=-.85+((seed>>>8)%40)/200;
 return {x:Math.cos(a),y:Math.sin(a),az:a};
}

/**
 * Terminator stops for a planet or station disk.
 * Day → twilight → night, aimed along the star vector.
 */
export function terminatorStops(kindId='mineral'){
 const warm=kindId==='volcanic'||kindId==='arid'||kindId==='gas';
 const ice=kindId==='ice'||kindId==='icegiant'||kindId==='ocean';
 const twilight=warm?'#ffb07044':ice?'#9ad4ff33':'#c8e0ff28';
 return [
  [0,'#fff6e828'],
  [.32,'#00000000'],
  [.52,twilight],
  [.68,'#00040c99'],
  [1,'#000208f8']
 ];
}

export function atmosphereRimAlpha(haze,lite){
 if(!(haze>0))return 0;
 return lite?.22:.34+haze*.28;
}

const assetCache=new Map();

export function frontierAssetUrl(name){
 if(!name)return '';
 const base=typeof import.meta!=='undefined'&&import.meta.url?import.meta.url:'';
 try{return new URL(FRONTIER_ASSET_DIR+String(name).replace(/^\/+/,''),base).href;}
 catch{return FRONTIER_ASSET_DIR+name;}
}

/**
 * Optional Scenario / PNG hook. Returns a cached Image or null.
 * Missing files fail silently so procedural art always paints.
 * First call starts the load and returns null; later frames peek the Image.
 */
export const FRONTIER_SURFACE_A='planet-surface-a.png';
export const FRONTIER_SURFACE_B='planet-surface-b.png';
export const FRONTIER_PLATE_A='landing-a.png';
export const FRONTIER_PLATE_B='landing-b.png';
export const FRONTIER_SHIPPED_ASSETS=[FRONTIER_SURFACE_A,FRONTIER_SURFACE_B,FRONTIER_PLATE_A,FRONTIER_PLATE_B];

/** SURFACE_PALETTES kindIds — each may later drop landing-{id}.png + surface-{id}.png. */
export const FRONTIER_KIND_IDS=[
 'earthlike','ocean','arid','ice','metal','mineral','volcanic','barren','toxic','gas','icegiant'
];

export function kindPlateName(kindId){return 'landing-'+String(kindId||'mineral')+'.png';}
export function kindSurfaceName(kindId){return 'surface-'+String(kindId||'mineral')+'.png';}

export const FRONTIER_KIND_ASSETS=FRONTIER_KIND_IDS.flatMap(id=>[kindPlateName(id),kindSurfaceName(id)]);
/** Phase 1b Scenario plates/surfaces that actually ship (must be in sw.js FILES). */
export const FRONTIER_KIND_SHIPPED=[
 'landing-volcanic.png','landing-earthlike.png','landing-arid.png','landing-ice.png',
 'landing-ocean.png','landing-toxic.png','landing-barren.png','landing-gas.png',
 'surface-volcanic.png','surface-earthlike.png','surface-arid.png','surface-ice.png',
 'surface-toxic.png','surface-barren.png'
];
export const FRONTIER_PREFETCH_ASSETS=[...FRONTIER_SHIPPED_ASSETS,...FRONTIER_KIND_ASSETS];

const WARM_SURFACE=new Set(['volcanic','arid','gas','mineral','metal']);
const WARM_PLATE=new Set(['volcanic','arid','gas','mineral']);
/** Manifest: barren landing + surface also cover metal/mineral biomes. */
const KIND_PLATE_ALIAS={metal:'barren',mineral:'barren'};
const KIND_SURFACE_ALIAS={metal:'barren',mineral:'barren'};

export function fallbackSurfaceName(kindId){
 return WARM_SURFACE.has(kindId)?FRONTIER_SURFACE_A:FRONTIER_SURFACE_B;
}

export function fallbackPlateName(kindId){
 return WARM_PLATE.has(kindId)?FRONTIER_PLATE_A:FRONTIER_PLATE_B;
}

export function resolveFrontierName(preferred,fallback){
 if(preferred&&peekFrontierImage(preferred))return preferred;
 return fallback;
}

function resolveKindAsset(kindId,nameOf,aliasMap,fallbackOf){
 const kind=nameOf(kindId);
 if(peekFrontierImage(kind))return kind;
 const alias=aliasMap[kindId];
 if(alias){
  const aliased=nameOf(alias);
  if(peekFrontierImage(aliased))return aliased;
 }
 return fallbackOf(kindId);
}

export function surfaceTextureName(kindId){
 return resolveKindAsset(kindId,kindSurfaceName,KIND_SURFACE_ALIAS,fallbackSurfaceName);
}

export function landingPlateName(kindId){
 return resolveKindAsset(kindId,kindPlateName,KIND_PLATE_ALIAS,fallbackPlateName);
}

/**
 * Source crop. Shipped a/b plates are cinematic stills with title chrome —
 * take a tall horizon band. Phase 1b kind plates are clean landscapes
 * (no HUD) so we take a fuller-bleed sky-to-fog band.
 */
export function plateCrop(name){
 if(name===FRONTIER_PLATE_A)return {sx:.28,sy:.06,sw:.70,sh:.50};
 if(name===FRONTIER_PLATE_B)return {sx:.34,sy:.05,sw:.64,sh:.48};
 return {sx:.0,sy:.05,sw:1,sh:.58};
}

/** Screen-space dest height for the cinematic plate (fuller-bleed horizon). */
export function vistaDestHeight(height,quality){
 return height*(quality==='balanced'?.56:.68);
}

/** World-Y the farthest ridges lock to so climb/descent does not drag them. */
export const VISTA_LOCK_Y=400;

export function ridgeCameraY(cameraY,vParallax=1,refY=VISTA_LOCK_Y){
 const v=vParallax<0?0:vParallax>1?1:vParallax;
 return refY+(cameraY-refY)*v;
}

/**
 * Screen-locked cinematic plate. Horizontal parallax stays subtle;
 * there is no cameraY — the vista does not climb or sink with the skiff.
 */
export function drawFrontierVista(ctx,width,height,img,name,pal,cameraX,quality){
 if(!ctx||!img||!img.width)return;
 const crop=plateCrop(name);
 const sx=img.width*crop.sx,sy=img.height*crop.sy,sw=img.width*crop.sw,sh=img.height*crop.sh;
 const destH=vistaDestHeight(height,quality);
 const shift=((cameraX*.012)%56+56)%56;
 ctx.save();
 ctx.globalAlpha=quality==='balanced'?.52:.7;
 ctx.drawImage(img,sx,sy,sw,sh,-18-shift*.18,0,width+36,destH);
 ctx.globalCompositeOperation='multiply';
 ctx.globalAlpha=quality==='balanced'?.2:.3;
 ctx.fillStyle=mixHex(pal.sky1||'#183141',pal.terrain||'#2e5858',.42);
 ctx.fillRect(0,0,width,destH);
 ctx.globalCompositeOperation='source-over';
 ctx.globalAlpha=1;
 const top=ctx.createLinearGradient(0,0,0,destH*.24);
 top.addColorStop(0,pal.sky0);
 top.addColorStop(.45,fadeHex(pal.sky0,.42));
 top.addColorStop(1,'#0000');
 ctx.fillStyle=top;ctx.fillRect(0,0,width,destH*.24);
 const fade=ctx.createLinearGradient(0,destH*.28,0,destH);
 fade.addColorStop(0,'#0000');
 fade.addColorStop(.38,fadeHex(pal.sky2,.22));
 fade.addColorStop(.7,fadeHex(mixHex(pal.sky2,pal.terrain,.18),.68));
 fade.addColorStop(1,mixHex(pal.sky2,pal.terrain,.3));
 ctx.fillStyle=fade;ctx.fillRect(0,destH*.28,width,destH*.72);
 const sides=ctx.createLinearGradient(0,0,width,0);
 sides.addColorStop(0,pal.sky0);sides.addColorStop(.1,'#0000');sides.addColorStop(.9,'#0000');sides.addColorStop(1,pal.sky0);
 ctx.globalAlpha=.38;ctx.fillStyle=sides;ctx.fillRect(0,0,width,destH);
 ctx.restore();
}

/** Bake resolution for the tile atlas. Not the on-screen repeat. */
export function tileBakeSize(quality,lite){
 if(lite||quality==='performance')return 192;
 if(quality==='balanced')return 256;
 return 384;
}

/**
 * On-screen pattern repeat in CSS pixels.
 * ~4.5× smaller than the old bake-as-repeat (512 / 384 / 192).
 */
export function tileScreenRepeat(quality,lite){
 if(lite||quality==='performance')return 56;
 if(quality==='balanced')return 80;
 return 112;
}

/** @deprecated Bake size only. Use tileScreenRepeat for pattern scale. */
export function tileSizeForQuality(quality,lite){
 return tileBakeSize(quality,lite);
}

export function loadFrontierImage(name){
 if(!name)return null;
 if(assetCache.has(name))return assetCache.get(name);
 if(typeof Image==='undefined'){assetCache.set(name,null);return null;}
 const img=new Image();
 img.decoding='async';
 img.onload=()=>assetCache.set(name,img);
 img.onerror=()=>assetCache.set(name,null);
 assetCache.set(name,null);
 try{img.src=frontierAssetUrl(name);}catch{return null;}
 return null;
}

export function peekFrontierImage(name){
 return assetCache.get(name)||null;
}

export function prefetchFrontierArt(){
 for(const n of FRONTIER_PREFETCH_ASSETS)loadFrontierImage(n);
}

/** Test hook — remember a loaded (or fake) image so kind mapping can resolve. */
export function rememberFrontierImage(name,img){
 if(!name)return;
 assetCache.set(name,img||null);
}

const tileCache=new Map();

export function frontierTile(img,size){
 if(!img||!img.width||!size)return null;
 const key=(img.src||img)+'|'+size;
 const hit=tileCache.get(key);
 if(hit)return hit;
 if(typeof document==='undefined')return img;
 const c=document.createElement('canvas');
 c.width=c.height=size;
 const x=c.getContext('2d');
 if(!x)return img;
 x.imageSmoothingEnabled=true;
 x.drawImage(img,0,0,size,size);
 tileCache.set(key,c);
 if(tileCache.size>12)tileCache.delete(tileCache.keys().next().value);
 return c;
}

export function clearFrontierAssets(){assetCache.clear();tileCache.clear();}

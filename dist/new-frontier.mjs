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

const WARM_SURFACE=new Set(['volcanic','arid','gas','mineral','metal']);
const WARM_PLATE=new Set(['volcanic','arid','gas','mineral']);

export function surfaceTextureName(kindId){
 return WARM_SURFACE.has(kindId)?FRONTIER_SURFACE_A:FRONTIER_SURFACE_B;
}

export function landingPlateName(kindId){
 return WARM_PLATE.has(kindId)?FRONTIER_PLATE_A:FRONTIER_PLATE_B;
}

/** Source crop that drops title/HUD chrome. Fractions of the plate. */
export function plateCrop(name){
 if(name===FRONTIER_PLATE_A)return {sx:.30,sy:.10,sw:.68,sh:.26};
 return {sx:.34,sy:.07,sw:.64,sh:.24};
}

export function tileSizeForQuality(quality,lite){
 if(lite||quality==='performance')return 192;
 if(quality==='balanced')return 384;
 return 512;
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
 for(const n of FRONTIER_SHIPPED_ASSETS)loadFrontierImage(n);
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

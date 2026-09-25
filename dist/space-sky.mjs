/**
 * Outer-space plates for the flight view. Procedural sky stays the fallback
 * until starfield_far has decoded. On-foot and landing vistas do not use this.
 */
export const SPACE_DIR='assets/space/';
export const SPACE_PLATES=['starfield_far','starfield_mid','nebula_soft_a','nebula_soft_b','dust_parallax','station_approach','station_exterior','dock_bay','sun_disc','sun_bloom','lens_streak'];
export const STATION_LIVE_DIR='assets/space/station_live/';
export const STATION_ROT=['station_rot_00','station_rot_01','station_rot_02','station_rot_03','station_rot_04','station_rot_05','station_rot_06','station_rot_07'];
export const STATION_LIGHTS=['lights_bay_idle','lights_bay_flash','lights_beacon_a','lights_beacon_b','lights_nav_pulse','window_glow'];
/** Relative drift from NOTES: far 0.1 → dust 1.0, scaled into world units. */
export const SPACE_DRIFT={far:.1,nebula:.2,mid:.35,station:.62,dust:1};
const DRIFT_SCALE=.08;
const plates=new Map();

export function spaceAssetUrl(name){return SPACE_DIR+name+'.png';}

export function nebulaPlate(kind){
 if(kind==='dust'||kind==='storm'||kind==='nebula'||kind==='ion')return 'nebula_soft_a';
 return 'nebula_soft_b';
}

/** Dock range is 200. Hangar mouth, hero exterior, then approach silhouette. */
export function stationPlateRole(dist){
 if(!(dist>=0)||dist>2400)return null;
 if(dist<=260)return 'dock_bay';
 if(dist<=900)return 'station_exterior';
 return 'station_approach';
}

/** 45° steps. High spins about every 0.75s; performance holds longer. One frame at a time. */
export function stationRotFrame(time,lite=false){
 const step=lite?1.6:.75;
 const f=Math.max(0,time||0)/step;
 const i=Math.floor(f)%STATION_ROT.length;
 const frac=f-Math.floor(f);
 const fade=frac>0.72?(frac-.72)/.28:0;
 return {index:i,next:(i+1)%STATION_ROT.length,fade};
}
/** Additive blinks. Performance skips overlays. */
export function stationLightPhase(time,lite=false){
 if(lite)return {bay:null,beacon:null,nav:false,window:false};
 const t=Math.max(0,time||0);
 return {
  bay:Math.floor(t/1)%2?'lights_bay_flash':'lights_bay_idle',
  beacon:Math.floor(t/.9)%2?'lights_beacon_b':'lights_beacon_a',
  nav:(t%2.6)<.18,
  window:true
 };
}
/** Hangar fills the viewport. Exterior and approach stay world sprites. */
export function stationPlateBox(role,w,h,iw=1920,ih=1080){
 const aspect=(ih||1080)/(iw||1920);
 if(role==='dock_bay'){
  const bleed=1.18;
  const s=Math.max((w||1)/(iw||1920),(h||1)/(ih||1080))*bleed;
  return {dw:(iw||1920)*s,dh:(ih||1080)*s,cover:true};
 }
 const fit=role==='station_exterior'?Math.min(w*.96,h*1.15):Math.min(w,h)*.78;
 return {dw:fit,dh:fit*aspect,cover:false};
}
/** Slide a cover plate with the station, but not so far that a side gutter opens. */
export function coverAnchor(cx,cy,dw,dh,w,h){
 const x=dw>=w?Math.min(dw/2,Math.max(w-dw/2,cx)):cx;
 const y=dh>=h?Math.min(dh/2,Math.max(h-dh/2,cy)):cy;
 return {x,y};
}
export function stationPlateAlpha(dist,role){
 if(role==='dock_bay')return .78;
 if(role==='station_exterior')return .72;
 const t=Math.min(1,Math.max(0,(2400-dist)/1500));
 return .28+t*.36;
}

export function spaceParallax(camX,camY,name,span){
 const k=(SPACE_DRIFT[name]||0)*DRIFT_SCALE;
 const s=span||1;
 return {x:-((camX||0)*k)%s,y:-((camY||0)*k)%s};
}

export function sunScreen(star,camX,camY,width,height,zoom){
 if(!star)return null;
 const z=zoom||1;
 return {x:(star.x-(camX||0))*z+(width||0)/2,y:(star.y-(camY||0))*z+(height||0)/2};
}

export function sunInView(pos,width,height,margin){
 if(!pos)return false;
 const m=margin??Math.min(width||0,height||0)*.35;
 return pos.x>-m&&pos.x<(width||0)+m&&pos.y>-m&&pos.y<(height||0)+m;
}

export function nearestStation(stations,player){
 let best=null,bestD=Infinity;
 for(const s of stations||[]){
  if(!s||s.type==='beacon')continue;
  const d=Math.hypot((s.x||0)-(player?.x||0),(s.y||0)-(player?.y||0));
  if(d<bestD){best=s;bestD=d;}
 }
 return best?{station:best,dist:bestD}:null;
}

export function spaceSkyReady(){
 const img=plates.get('starfield_far');
 return !!(img&&(img.naturalWidth||img.width));
}

export function peekSpacePlate(name){
 const img=plates.get(name);
 return img&&(img.naturalWidth||img.width)?img:null;
}

function loadPlate(name,url){
 if(plates.has(name)||typeof Image==='undefined')return;
 const img=new Image();
 img.decoding='async';
 img.src=url;
 plates.set(name,img);
}
export function prefetchSpacePlates(){
 for(const name of SPACE_PLATES)loadPlate(name,spaceAssetUrl(name));
 for(const name of [...STATION_ROT,...STATION_LIGHTS])loadPlate(name,STATION_LIVE_DIR+name+'.png');
}

function blitCover(ctx,img,ox,oy,w,h,alpha,op){
 if(!img)return;
 const iw=img.naturalWidth||img.width,ih=img.naturalHeight||img.height;
 if(!iw||!ih)return;
 const bleed=1.04;
 const scale=Math.max(w/iw,h/ih)*bleed;
 const dw=iw*scale,dh=ih*scale;
 const stepX=dw/bleed,stepY=dh/bleed;
 const x=((ox%stepX)+stepX)%stepX-stepX,y=((oy%stepY)+stepY)%stepY-stepY;
 ctx.save();
 ctx.globalAlpha=alpha==null?1:alpha;
 ctx.globalCompositeOperation=op||'source-over';
 for(let iy=y;iy<h;iy+=stepY)for(let ix=x;ix<w;ix+=stepX)ctx.drawImage(img,ix,iy,dw,dh);
 ctx.restore();
}

function blitSprite(ctx,img,x,y,dw,dh,alpha,op){
 if(!img)return;
 ctx.save();
 ctx.globalAlpha=alpha==null?1:alpha;
 ctx.globalCompositeOperation=op||'source-over';
 ctx.drawImage(img,x-dw/2,y-dh/2,dw,dh);
 ctx.restore();
}

/**
 * Screen-space flight sky. Returns false until the opaque far plate is ready.
 * opts: width, height, camX, camY, zoom, skyKind, lite, soft, stations, player, star
 */
export function drawSpaceSky(ctx,opts={}){
 if(!spaceSkyReady()||!ctx)return false;
 const w=Math.max(1,opts.width|0),h=Math.max(1,opts.height|0);
 const lite=!!opts.lite,soft=!!opts.soft||lite;
 const span=Math.max(w,h);
 const far=spaceParallax(opts.camX,opts.camY,'far',span);
 const neb=spaceParallax(opts.camX,opts.camY,'nebula',span);
 const mid=spaceParallax(opts.camX,opts.camY,'mid',span);
 const dust=spaceParallax(opts.camX,opts.camY,'dust',span);
 ctx.save();
 ctx.fillStyle='#05070c';
 ctx.fillRect(0,0,w,h);
 blitCover(ctx,peekSpacePlate('starfield_far'),far.x,far.y,w,h,1,'source-over');
 if(!lite){
  const nebula=peekSpacePlate(nebulaPlate(opts.skyKind));
  blitCover(ctx,nebula,neb.x,neb.y,w,h,.55,'screen');
 }
 blitCover(ctx,peekSpacePlate('starfield_mid'),mid.x,mid.y,w,h,.92,'source-over');
 const near=nearestStation(opts.stations,opts.player);
 if(near){
  const role=stationPlateRole(near.dist);
  const zoom=opts.zoom||1;
  const sx=(near.station.x-(opts.camX||0))*zoom+w/2;
  const sy=(near.station.y-(opts.camY||0))*zoom+h/2;
  const spin=role&&role!=='dock_bay'?stationRotFrame(opts.clock,lite):null;
  const rot=spin&&peekSpacePlate(STATION_ROT[spin.index]);
  const plate=rot||(role&&peekSpacePlate(role));
  if(plate){
   const iw=plate.naturalWidth||plate.width||1920,ih=plate.naturalHeight||plate.height||1080;
   const box=stationPlateBox(role,w,h,iw,ih);
   const dw=box.dw,dh=box.dh;
   const pin=box.cover?coverAnchor(sx,sy,dw,dh,w,h):{x:sx,y:sy};
   const alpha=stationPlateAlpha(near.dist,role);
   blitSprite(ctx,plate,pin.x,pin.y,dw,dh,alpha,'source-over');
   if(rot){
    const lights=stationLightPhase(opts.clock,lite);
    const glow=(name,a)=>{const img=name&&peekSpacePlate(name);if(img)blitSprite(ctx,img,pin.x,pin.y,dw,dh,a,'lighter');};
    glow(lights.bay,.8);
    glow(lights.beacon,.72);
    if(lights.nav)glow('lights_nav_pulse',.68);
    if(lights.window)glow('window_glow',.32);
   }
  }
 }
 if(!lite)blitCover(ctx,peekSpacePlate('dust_parallax'),dust.x,dust.y,w,h,.4,'screen');
 const sun=sunScreen(opts.star,opts.camX,opts.camY,w,h,opts.zoom);
 if(sunInView(sun,w,h)){
  const disc=Math.min(w,h)*.46;
  blitSprite(ctx,peekSpacePlate('sun_disc'),sun.x,sun.y,disc,disc,.9,'lighter');
  if(!lite)blitSprite(ctx,peekSpacePlate('sun_bloom'),sun.x,sun.y,disc*1.85,disc*1.85,.42,'lighter');
  if(!soft)blitSprite(ctx,peekSpacePlate('lens_streak'),sun.x,sun.y,Math.max(w*.72,disc*2.4),disc*.42,.28,'lighter');
 }
 ctx.restore();
 return true;
}

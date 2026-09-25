/**
 * Outer-space plates for the flight view. Procedural sky stays the fallback
 * until starfield_far has decoded. On-foot and landing vistas do not use this.
 */
export const SPACE_DIR='assets/space/';
export const SPACE_PLATES=['starfield_far','starfield_mid','nebula_soft_a','nebula_soft_b','dust_parallax','station_approach','station_exterior','dock_bay','sun_disc','sun_bloom','lens_streak'];
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

export function prefetchSpacePlates(){
 if(typeof Image==='undefined')return;
 for(const name of SPACE_PLATES){
  if(plates.has(name))continue;
  const img=new Image();
  img.decoding='async';
  img.src=spaceAssetUrl(name);
  plates.set(name,img);
 }
}

function blitCover(ctx,img,ox,oy,w,h,alpha,op){
 if(!img)return;
 const iw=img.naturalWidth||img.width,ih=img.naturalHeight||img.height;
 if(!iw||!ih)return;
 const scale=Math.max(w/iw,h/ih);
 const dw=iw*scale,dh=ih*scale;
 const x=((ox%dw)+dw)%dw-dw,y=((oy%dh)+dh)%dh-dh;
 ctx.save();
 ctx.globalAlpha=alpha==null?1:alpha;
 ctx.globalCompositeOperation=op||'source-over';
 for(let iy=y;iy<h;iy+=dh)for(let ix=x;ix<w;ix+=dw)ctx.drawImage(img,ix,iy,dw,dh);
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
  const plate=role&&peekSpacePlate(role);
  if(plate){
   const zoom=opts.zoom||1;
   const sx=(near.station.x-(opts.camX||0))*zoom+w/2;
   const sy=(near.station.y-(opts.camY||0))*zoom+h/2;
   const iw=plate.naturalWidth||plate.width||1920,ih=plate.naturalHeight||plate.height||1080;
   const fit=role==='dock_bay'?w*1.08:role==='station_exterior'?Math.min(w*.96,h*1.15):Math.min(w,h)*.78;
   const dw=fit,dh=dw*(ih/iw);
   blitSprite(ctx,plate,sx,sy,dw,dh,stationPlateAlpha(near.dist,role),'source-over');
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

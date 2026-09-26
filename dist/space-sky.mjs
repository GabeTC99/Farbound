/**
 * Outer-space plates for the flight view. Procedural sky stays the fallback
 * until starfield_far has decoded. On-foot and landing vistas do not use this.
 */
export const SPACE_DIR='assets/space/';
export const SPACE_PLATES=['starfield_far','starfield_mid','nebula_soft_a','nebula_soft_b','dust_parallax','station_approach','station_exterior','dock_bay','sun_disc','sun_bloom','lens_streak'];
export const STATION_SPIN_DIR='assets/space/station_spin/';
export const STATION_ORTHO='station_ortho';
/** Alt silhouette. Prefetched, not swapped in. */
export const STATION_ORTHO_ALT='station_ortho_b';
/** Relative drift from NOTES: far 0.1 → dust 1.0, scaled into world units. */
export const SPACE_DRIFT={far:.1,nebula:.2,mid:.35,station:.62,dust:1};
const DRIFT_SCALE=.08;
const plates=new Map();

export function spaceAssetUrl(name){return SPACE_DIR+name+'.png';}

export function nebulaPlate(kind){
 if(kind==='dust'||kind==='storm'||kind==='nebula'||kind==='ion')return 'nebula_soft_a';
 return 'nebula_soft_b';
}

/** Dock range is 200. The hull stays a world sprite all the way in; no hangar plate swap in flight. */
export function stationPlateRole(dist){
 if(!(dist>=0)||dist>2400)return null;
 if(dist<=900)return 'station_exterior';
 return 'station_approach';
}

/** Continuous spin. Performance turns slower. One ortho sprite, no plate swap. */
export function stationSpinAngle(time,lite=false){
 const rate=lite?.12:.35;
 return Math.max(0,time||0)*rate;
}
/** World span of the ortho hull (65 = standard station radius). Scales with camera zoom like ships do. */
export const STATION_WORLD_SPAN=300;
export function stationWorldSize(r,zoom){
 return STATION_WORLD_SPAN*((r||65)/65)*(zoom||1);
}
/** Square screen size for the ortho hull. Exterior reads larger than approach. */
export function stationOrthoSize(role,w,h){
 const span=Math.min(w||1,h||1);
 return span*(role==='station_exterior'?.62:.36);
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
/** Solid hull. Only the far edge of the approach band fades in so the sprite does not pop. */
export function stationPlateAlpha(dist,role){
 if(role==='dock_bay'||role==='station_exterior')return 1;
 const t=Math.min(1,Math.max(0,(2400-dist)/350));
 return .28+t*.72;
}

/** Raw drift offset. blitCover wraps it against the real tile size, so there is no jump when the camera crosses a span. */
export function spaceParallax(camX,camY,name,_span){
 const k=(SPACE_DRIFT[name]||0)*DRIFT_SCALE;
 return {x:-(camX||0)*k,y:-(camY||0)*k};
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
/** True once every named plate has decoded. */
/** True once every named plate has fully loaded (naturalWidth alone arrives with the header, before the pixels). */
export function spacePlatesReady(names){
 return (names||[]).every(n=>{const img=plates.get(n);return !!(img&&img.complete&&(img.naturalWidth||img.width));});
}
export function stationOrthoReady(){
 return !!peekSpacePlate(STATION_ORTHO);
}
export function prefetchSpacePlates(){
 for(const name of SPACE_PLATES)loadPlate(name,spaceAssetUrl(name));
 for(const name of [STATION_ORTHO,STATION_ORTHO_ALT])loadPlate(name,STATION_SPIN_DIR+name+'.png');
}

/** Cover-tile a plate. Tiles butt edge to edge (no overlap, so translucent layers never double into a stripe) and alternate tiles are mirrored so their edges always match. */
function blitCover(ctx,img,ox,oy,w,h,alpha,op){
 if(!img)return;
 const iw=img.naturalWidth||img.width,ih=img.naturalHeight||img.height;
 if(!iw||!ih)return;
 const scale=Math.max(w/iw,h/ih)*1.04;
 const dw=Math.ceil(iw*scale),dh=Math.ceil(ih*scale);
 const kx=Math.floor(-(ox||0)/dw),ky=Math.floor(-(oy||0)/dh);
 const x0=Math.round((ox||0)+kx*dw),y0=Math.round((oy||0)+ky*dh);
 for(let j=0;y0+j*dh<h;j++)for(let i=0;x0+i*dw<w;i++){
  const fx=((kx+i)&1)?-1:1,fy=((ky+j)&1)?-1:1;
  ctx.save();
  ctx.globalAlpha=alpha==null?1:alpha;
  ctx.globalCompositeOperation=op||'source-over';
  ctx.translate(x0+i*dw+(fx<0?dw:0),y0+j*dh+(fy<0?dh:0));
  ctx.scale(fx,fy);
  ctx.drawImage(img,0,0,dw,dh);
  ctx.restore();
 }
}

/** One oversized draw for vignetted plates (nebula, mid stars, dust). Their soft edges would tile into dark bands, so the drift eases toward the margin instead of ever exposing an edge. */
function blitWide(ctx,img,ox,oy,w,h,alpha,op,over=1.5){
 if(!img)return;
 const iw=img.naturalWidth||img.width,ih=img.naturalHeight||img.height;
 if(!iw||!ih)return;
 const scale=Math.max(w/iw,h/ih)*over;
 const dw=iw*scale,dh=ih*scale;
 const mx=Math.max(0,(dw-w)/2-2),my=Math.max(0,(dh-h)/2-2);
 const x=(w-dw)/2+(mx?mx*Math.tanh((ox||0)/mx):0),y=(h-dh)/2+(my?my*Math.tanh((oy||0)/my):0);
 ctx.save();
 ctx.globalAlpha=alpha==null?1:alpha;
 ctx.globalCompositeOperation=op||'source-over';
 ctx.drawImage(img,x,y,dw,dh);
 ctx.restore();
}

function blitSpin(ctx,img,x,y,size,angle,alpha){
 if(!img||!(size>0))return;
 ctx.save();
 ctx.translate(x,y);
 ctx.rotate(angle||0);
 ctx.globalAlpha=alpha==null?1:alpha;
 ctx.globalCompositeOperation='source-over';
 ctx.drawImage(img,-size/2,-size/2,size,size);
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
  blitWide(ctx,nebula,neb.x,neb.y,w,h,.55,'screen',1.6);
 }
 blitWide(ctx,peekSpacePlate('starfield_mid'),mid.x,mid.y,w,h,.92,'source-over',1.5);
 if(!lite)blitWide(ctx,peekSpacePlate('dust_parallax'),dust.x,dust.y,w,h,.4,'screen',1.4);
 // Station hulls sit above the dust so nothing washes through them.
 const ortho=peekSpacePlate(STATION_ORTHO),zoom=opts.zoom||1;
 if(ortho)for(const st of opts.stations||[]){
  if(!st||st.type==='beacon')continue;
  const d=Math.hypot((st.x||0)-(opts.player?.x||0),(st.y||0)-(opts.player?.y||0));
  const role=stationPlateRole(d);
  if(!role)continue;
  const size=stationWorldSize(st.r,zoom);
  const sx=(st.x-(opts.camX||0))*zoom+w/2,sy=(st.y-(opts.camY||0))*zoom+h/2;
  if(sx<-size||sx>w+size||sy<-size||sy>h+size)continue;
  blitSpin(ctx,ortho,sx,sy,size,stationSpinAngle(opts.clock,lite),stationPlateAlpha(d,role));
 }
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

/**
 * Shared local-space frame pacing.
 * Physics steps at a fixed 60 Hz; the display interpolates and follows the
 * camera in real time so 30 / 60 / 120 Hz panels (and hitchy frames) do not
 * change how far the ship sits on screen.
 */
export const FIXED_DT=1/60;
export const MAX_FRAME_DT=.1;
export const MAX_STEPS=5;
/** Matches the old per-frame 0.09 lerp at 60 Hz: 1-exp(-k/60) ≈ 0.09. */
export const CAM_FOLLOW=5.66;
export const PIXEL_BUDGET={high:6.2e6,highHuge:3.8e6,balanced:3.2e6,performance:1.8e6};
/** CSS area that counts as Fold/tablet-inner. High uses the tighter 120 Hz budget. */
export const HUGE_CSS=2.2e6;
/** Mode floors. High stays ≥0.75 so Fold High is not Performance-soft. */
export const SCALE_FLOOR={high:.75,balanced:.6,performance:.5};
export const STAR_LAYER_SPLITS=[.045,.07];
export const STAR_LAYER_DEPTHS=[.032,.058,.086];

export function pixelBudget(graphics='high',cssW=1,cssH=1){
 const mode=graphics==='performance'||graphics==='balanced'?graphics:'high';
 const huge=(cssW||1)*(cssH||1)>=HUGE_CSS;
 if(mode==='high'&&huge)return PIXEL_BUDGET.highHuge;
 return PIXEL_BUDGET[mode];
}

/** True when a world-space ring (orbit, scoop zone) crosses the view. */
export function ringInView(x,y,r,camX,camY,viewR){
 const d=Math.hypot((x||0)-(camX||0),(y||0)-(camY||0));
 return Math.abs(d-(r||0))<(viewR||0);
}

export function starLayerIndex(depth){
 const d=depth||.05;
 if(d<STAR_LAYER_SPLITS[0])return 0;
 if(d<STAR_LAYER_SPLITS[1])return 1;
 return 2;
}

export function starLayerOffset(camX,camY,depth,width,height){
 return {
  x:wrapUnit(-(camX||0)*(depth||0),width||1),
  y:wrapUnit(-(camY||0)*(depth||0),height||1)
 };
}

/** Tile a baked star/galaxy layer so wrap-around parallax stays one blit set. */
export function blitWrapped(ctx,layer,ox,oy,w,h){
 if(!ctx||!layer)return;
 const width=w||layer.width||1,height=h||layer.height||1;
 const x=wrapUnit(ox,width),y=wrapUnit(oy,height);
 ctx.drawImage(layer,x-width,y-height);
 ctx.drawImage(layer,x,y-height);
 ctx.drawImage(layer,x-width,y);
 ctx.drawImage(layer,x,y);
}

export function createFrameClock(now=0){
 return {last:now,acc:0,ready:false};
}

export function resetFrameClock(clock,now=0){
 clock.last=now;clock.acc=0;clock.ready=false;
 return clock;
}

export function beginFrame(clock,now){
 if(!clock.ready){
  clock.last=now;clock.ready=true;clock.acc=0;
  return {frameDt:0,steps:0,alpha:1,simDt:0,hitch:false};
 }
 let frameDt=(now-clock.last)/1000;
 clock.last=now;
 if(!Number.isFinite(frameDt)||frameDt<0)frameDt=0;
 if(frameDt>MAX_FRAME_DT){
  clock.acc=0;
  return {frameDt:FIXED_DT,steps:1,alpha:1,simDt:FIXED_DT,hitch:true};
 }
 clock.acc+=frameDt;
 let steps=0;
 while(clock.acc>=FIXED_DT&&steps<MAX_STEPS){
  clock.acc-=FIXED_DT;
  steps++;
 }
 if(steps>=MAX_STEPS)clock.acc=0;
 return {frameDt,steps,alpha:clock.acc/FIXED_DT,simDt:steps*FIXED_DT,hitch:false};
}

export function expSmooth(current,target,dt,k=CAM_FOLLOW){
 if(!(dt>0))return current;
 const t=1-Math.exp(-k*dt);
 return current+(target-current)*t;
}

export function followCam(cam,targetX,targetY,dt,k=CAM_FOLLOW){
 cam.x=expSmooth(cam.x,targetX,dt,k);
 cam.y=expSmooth(cam.y,targetY,dt,k);
 return cam;
}

/**
 * Device-pixel-lock a chase camera so world-space ships/stations land on whole
 * backing pixels. Starfield stays on the unsapped cam (continuous parallax);
 * snapping stars was 2.15.7's stair-step.
 */
export function snapWorldCam(camX,camY,width,height,dpr,zoom){
 const z=zoom||1,s=dpr||1;
 if(!(z>0)||!(s>0)||!Number.isFinite(camX)||!Number.isFinite(camY))return {x:camX||0,y:camY||0};
 const tx=Math.round(s*((width||0)*.5-camX*z));
 const ty=Math.round(s*((height||0)*.5-camY*z));
 return {x:((width||0)*.5-tx/s)/z,y:((height||0)*.5-ty/s)/z};
}

/**
 * Minimum device-pixel width for world-space strokes. Fold clip (Anchorage 01
 * spokes, NPC hulls, player chevron) crawls because filled 1 CSS-px edges
 * stair-step at backing×zoom < 1 device pixel.
 */
export const HAIRLINE_DEVICE=2;
/** Wider fringe so filled silhouettes keep an AA band while the camera pans. */
export const SILHOUETTE_DEVICE=3.2;
export function hairline(pixelScale,minDevice=HAIRLINE_DEVICE){
 const s=pixelScale||1;
 return (s>0)?minDevice/s:minDevice;
}
export function worldStroke(px,pixelScale,minDevice=HAIRLINE_DEVICE){
 return Math.max(Number(px)||0,hairline(pixelScale,minDevice));
}
/** Soft under-stroke then a device-locked outline. Path must already be current. */
export function strokeSilhouette(ctx,pixelScale){
 if(!ctx)return;
 const prevW=ctx.lineWidth,prevA=ctx.globalAlpha;
 ctx.lineJoin='round';ctx.lineCap='round';
 ctx.lineWidth=hairline(pixelScale,SILHOUETTE_DEVICE);
 ctx.globalAlpha=prevA*.4;
 ctx.stroke();
 ctx.globalAlpha=prevA;
 ctx.lineWidth=Math.max(prevW||0,hairline(pixelScale,HAIRLINE_DEVICE));
 ctx.stroke();
 ctx.lineWidth=prevW;
}
/**
 * Thick rounded band (station spokes): soft fringe, rim, then core.
 * A filled rect's long edges stair-step every frame when the camera or
 * the station rotates; a stroked capsule keeps canvas AA on the silhouette.
 */
export function strokeBand(ctx,pixelScale,corePx,coreStyle,rimStyle){
 if(!ctx)return;
 const core=worldStroke(corePx,pixelScale);
 const rim=core+hairline(pixelScale);
 const fringe=core+hairline(pixelScale,SILHOUETTE_DEVICE);
 const prevA=ctx.globalAlpha,prevW=ctx.lineWidth,prevS=ctx.strokeStyle;
 ctx.lineJoin='round';ctx.lineCap='round';
 ctx.strokeStyle=rimStyle;
 ctx.globalAlpha=prevA*.4;
 ctx.lineWidth=fringe;ctx.stroke();
 ctx.globalAlpha=prevA;
 ctx.lineWidth=rim;ctx.stroke();
 ctx.strokeStyle=coreStyle;
 ctx.lineWidth=core;ctx.stroke();
 ctx.strokeStyle=prevS;ctx.lineWidth=prevW;
}

export function lerp(a,b,t){
 t=t<0?0:t>1?1:t;
 return a+(b-a)*t;
}

export function lerpAngle(a,b,t){
 let d=b-a;
 while(d>Math.PI)d-=Math.PI*2;
 while(d<-Math.PI)d+=Math.PI*2;
 return a+d*(t<0?0:t>1?1:t);
}

/** Screen-space wrap used by distant stars / sky tiles. */
export function wrapUnit(v,span){
 if(!(span>0))return 0;
 v=v%span;
 return v<0?v+span:v;
}

/** Distant-star parallax depths stay in this band (slow drift, not world-locked). */
export const STAR_DEPTH_MIN=.02;
export const STAR_DEPTH_MAX=.11;
/** Milky Way / sky-band drift vs interpolated camera. */
export const SKY_PARALLAX=.012;
export const SPACE_CLEAR='#060c16';
/**
 * Transparent so an uninitialized swap composites over `#space` CSS (`#060c16`)
 * instead of paper-white. Opaque (`alpha:false`) 2D buffers initialize to #fff
 * on Android Chrome / Fold GPUs; 2.15.7's immediate fill could not win that
 * race when a hitch (sky bake, first NPC cluster) stalled the next GPU submit.
 *
 * Independent Fold clip review (Solace / Anchorage 01): leftover artifact is
 * pixel crawl / shimmer on hard un-antialiased edges — Anchorage spokes,
 * NPC hulls, player chevron — as the camera pans. World strokes keep a
 * device hairline plus a silhouette fringe. Synchronized presents stay off
 * as extra lock against front-buffer shear on a 120 Hz Fold panel.
 * Transparency stays so a rare uninitialized present is still dark CSS.
 */
export const SPACE_CONTEXT={alpha:true,desynchronized:false};
/** Ignore 1–2 device-pixel visualViewport jitter so Fold chrome does not reset the buffer every frame. */
export const BACKING_SLACK=2;

export function backingSize(cssW,cssH,dpr){
 const scale=dpr||1;
 return {w:Math.max(1,Math.round((cssW||1)*scale)),h:Math.max(1,Math.round((cssH||1)*scale))};
}

export function backingNeedsReset(curW,curH,nextW,nextH,slack=BACKING_SLACK){
 if(!(curW>0)||!(curH>0))return true;
 return Math.abs((curW||0)-(nextW||0))>slack||Math.abs((curH||0)-(nextH||0))>slack;
}

export function skyParallax(camX,camY,k=SKY_PARALLAX){
 return {x:(camX||0)*k,y:(camY||0)*k};
}

/** Continuous star position — do not snap to integers or the field stair-steps while the ship interpolates. */
export function starScreenPos(star,camX,camY,width,height){
 return {
  x:wrapUnit((star.x||0)*width-(camX||0)*(star.depth||0),width),
  y:wrapUnit((star.y||0)*height-(camY||0)*(star.depth||0),height)
 };
}

/** Sky wash cache is static per system/size/quality. Camera and clock must not be in the key. */
export function skyCacheKey(sky,width,height,lite,soft){
 return (sky?.seed||0)+'|'+(sky?.kind||'')+'|'+(width|0)+'|'+(height|0)+'|'+(lite?1:0)+'|'+(soft?1:0);
}

/** Immediate dark fill after a resize or GPU-buffer eviction so the compositor never presents white. */
export function fillSpaceClear(ctx,dpr,width,height,color=SPACE_CLEAR){
 if(!ctx)return;
 ctx.setTransform(dpr||1,0,0,dpr||1,0,0);
 ctx.fillStyle=color;
 ctx.fillRect(0,0,width,height);
}

export function canvasScale({cssW,cssH,dpr,graphics='high'}={}){
 const w=Math.max(1,cssW||1),h=Math.max(1,cssH||1);
 const raw=Math.max(1,dpr||1);
 const cap=Math.min(raw,2);
 const mode=graphics==='performance'||graphics==='balanced'?graphics:'high';
 const budget=pixelBudget(mode,w,h);
 const floor=SCALE_FLOOR[mode];
 const full=w*h*cap*cap;
 if(full<=budget)return cap;
 const scale=Math.sqrt(budget/(w*h));
 return Math.max(floor,Math.min(cap,scale));
}

export function viewportSize(win=globalThis){
 const vv=win.visualViewport;
 if(vv&&vv.width>0&&vv.height>0)return {width:vv.width,height:vv.height};
 return {width:win.innerWidth||1,height:win.innerHeight||1};
}

/**
 * Screen-space ship offset for a constant-velocity chase camera.
 * Frame-rate dependent follow makes this jump when dt changes; time-based
 * follow keeps it near v/k regardless of refresh.
 */
export function chaseOffset(speed,dt,follow,k=CAM_FOLLOW){
 let offset=0,cam=0,x=0;
 const n=Math.max(1,Math.round(.8/dt));
 for(let i=0;i<n;i++){
  x+=speed*dt;
  if(follow==='frame')cam+=(x-cam)*.09;
  else cam=expSmooth(cam,x,dt,k);
  offset=x-cam;
 }
 return offset;
}

export function createPacer(windowSize=120){
 const samples=new Float64Array(windowSize);
 let i=0,n=0,sum=0,max=0;
 return {
  record(ms){
   if(!(ms>=0))return;
   if(n===windowSize)sum-=samples[i];
   else n++;
   samples[i]=ms;sum+=ms;
   if(ms>max)max=ms;
   i=(i+1)%windowSize;
  },
  stats(){
   if(!n)return {avg:0,max:0,p95:0,over20:0,n:0};
   const copy=Array.from(samples.subarray(0,n)).sort((a,b)=>a-b);
   let over=0;for(let k=0;k<n;k++)if(samples[k]>20)over++;
   return {avg:sum/n,max,p95:copy[Math.min(n-1,Math.floor(n*.95))],over20:over,n};
  }
 };
}

/**
 * RAF display-rate meter. Record only while the overlay is on.
 * Samples requestAnimationFrame intervals (not CPU work time).
 * Stalls over 250 ms (tab hide, first hitch after resume) are ignored
 * so a Fold cover measurement is not pinned by one pause.
 */
export const FPS_STALL_MS=250;
export function createFpsMeter(windowSize=120){
 const times=new Float64Array(windowSize);
 let i=0,n=0,last=0,ema=0,ready=false;
 return {
  reset(){i=0;n=0;last=0;ema=0;ready=false;},
  record(now){
   if(!ready){last=now;ready=true;return null;}
   const dt=now-last;
   last=now;
   if(!(dt>0)||dt>FPS_STALL_MS)return null;
   if(n<windowSize)n++;
   times[i]=dt;i=(i+1)%windowSize;
   const fps=1000/dt;
   ema=ema?ema*.9+fps*.1:fps;
   return fps;
  },
  snapshot(){
   if(!n)return {fps:0,ms:0,low1:0,n:0};
   let sum=0;
   for(let k=0;k<n;k++)sum+=times[k];
   const copy=Array.from(times.subarray(0,n)).sort((a,b)=>a-b);
   const p99=copy[Math.min(n-1,Math.max(0,Math.ceil(n*.99)-1))];
   return {fps:ema,ms:sum/n,low1:p99>0?1000/p99:0,n};
  }
 };
}

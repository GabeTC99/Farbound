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
export const PIXEL_BUDGET={high:6.2e6,balanced:3.2e6,performance:1.8e6};

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

/** Immediate opaque fill so a resize or desynchronized swap never presents an uninitialized (white) buffer. */
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
 const budget=PIXEL_BUDGET[mode];
 const full=w*h*cap*cap;
 if(full<=budget)return cap;
 const scale=Math.sqrt(budget/(w*h));
 // Stay at least 0.75 so huge fold/tablet CSS sizes still paint, just softer.
 return Math.max(.75,Math.min(cap,scale));
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

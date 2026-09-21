import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 FIXED_DT,MAX_FRAME_DT,MAX_STEPS,CAM_FOLLOW,PIXEL_BUDGET,
 createFrameClock,resetFrameClock,beginFrame,expSmooth,followCam,
 lerp,lerpAngle,canvasScale,viewportSize,chaseOffset,createPacer,
 wrapUnit,starScreenPos,skyParallax,skyCacheKey,fillSpaceClear,snapWorldCam,
 hairline,worldStroke,HAIRLINE_DEVICE,SILHOUETTE_DEVICE,strokeSilhouette,
 SKY_PARALLAX,SPACE_CLEAR,SPACE_CONTEXT,BACKING_SLACK,backingSize,backingNeedsReset
} from '../dist/flight-loop.mjs';
import {texSizeFor,STAR_TEX} from '../dist/star-render.mjs';

assert.equal(FIXED_DT,1/60);
assert.ok(CAM_FOLLOW>5&&CAM_FOLLOW<7);
assert.equal(PIXEL_BUDGET.high,6.2e6);

const clock=createFrameClock(0);
const first=beginFrame(clock,0);
assert.equal(first.steps,0);
assert.equal(first.hitch,false);

// 120 Hz panel: one 60 Hz physics step every other frame, leftover alpha.
const a=beginFrame(clock,1000+8.333);
const b=beginFrame(clock,1000+16.666);
assert.equal(a.steps+b.steps,1,'120 Hz should run one physics step per two frames');
assert.ok(b.alpha>=0&&b.alpha<=1);

// Long hitch does not dump 6+ steps (spiral of death).
const hitch=beginFrame(clock,1000+16.666+400);
assert.equal(hitch.hitch,true);
assert.equal(hitch.steps,1);
assert.ok(hitch.frameDt<=MAX_FRAME_DT+1e-9);

resetFrameClock(clock,0);
beginFrame(clock,0);
let stepped=0;
for(let t=16.7;t<=16.7*8;t+=16.7)stepped+=beginFrame(clock,t).steps;
assert.ok(stepped>=7&&stepped<=9,'60 Hz run stays near 1:1');
assert.ok(MAX_STEPS>=4);

const cam={x:0,y:0};
followCam(cam,100,50,1/60);
assert.ok(cam.x>8&&cam.x<12,'60 Hz follow matches the old ~0.09 step');
assert.ok(Math.abs(cam.y/cam.x-0.5)<1e-6);

assert.equal(expSmooth(0,10,0),0);
assert.ok(Math.abs(lerp(0,10,.25)-2.5)<1e-9);
assert.ok(Math.abs(lerpAngle(3,-3,.5))<1e-6||Math.abs(Math.abs(lerpAngle(3,-3,.5))-Math.PI)<.2);

const phone=canvasScale({cssW:390,cssH:844,dpr:3,graphics:'high'});
assert.ok(phone<=2&&phone>=1.5,'typical phone keeps a high-DPR canvas');
const desktop=canvasScale({cssW:1440,cssH:900,dpr:2,graphics:'high'});
assert.equal(desktop,2,'typical laptop retina stays at 2x');
const foldInner=canvasScale({cssW:1800,cssH:2200,dpr:3,graphics:'high'});
assert.ok(foldInner<2,'huge fold CSS sizes drop below 2x');
assert.ok(foldInner*1800*foldInner*2200<=PIXEL_BUDGET.high*1.05,'huge CSS viewports stay on budget');
const lite=canvasScale({cssW:1280,cssH:800,dpr:2,graphics:'performance'});
assert.ok(lite<2,'performance mode scales a 2x laptop canvas');

assert.deepEqual(viewportSize({innerWidth:800,innerHeight:600}),{width:800,height:600});
assert.deepEqual(viewportSize({innerWidth:800,innerHeight:600,visualViewport:{width:390,height:700}}),{width:390,height:700});

// Measurable smoothness: screen-space ship offset under mixed 120 Hz + hitch.
const speed=220;
const offset60=chaseOffset(speed,1/60,'time');
const offset120=chaseOffset(speed,1/120,'time');
const offset30=chaseOffset(speed,1/30,'time');
const old60=chaseOffset(speed,1/60,'frame');
const old120=chaseOffset(speed,1/120,'frame');
const old30=chaseOffset(speed,1/30,'frame');
const timeSpread=Math.max(offset60,offset120,offset30)-Math.min(offset60,offset120,offset30);
const frameSpread=Math.max(old60,old120,old30)-Math.min(old60,old120,old30);
assert.ok(timeSpread<frameSpread*.35,'time-based camera lag stays stable across refresh rates');
assert.ok(Math.abs(offset120-speed/CAM_FOLLOW)<8);
assert.ok(frameSpread>12,'old per-frame 0.09 lerp really did jump with dt (regression guard)');

const pacer=createPacer(8);
for(const ms of[8.2,8.4,16.8,8.3,8.1,8.5,8.2,8.4])pacer.record(ms);
const stats=pacer.stats();
assert.equal(stats.n,8);
assert.ok(stats.avg>8&&stats.avg<11);
assert.ok(stats.max>=16.8);

// Photospheres stay sharp (384) but no longer rebuild 192→512 when zoom/DPR changes.
assert.equal(texSizeFor({r:40},true,1),STAR_TEX.lite);
assert.equal(texSizeFor({r:40},false,.6),STAR_TEX.full);
assert.equal(texSizeFor({r:180},false,2),STAR_TEX.full);
assert.equal(texSizeFor({r:180},false,1.5),texSizeFor({r:80},false,.8));

const app=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
assert.match(app,/from '\.\/flight-loop\.mjs'/);
assert.match(app,/beginFrame\(/);
assert.match(app,/followCam\(/);
assert.match(app,/canvasScale\(/);
assert.match(app,/starScreenPos\(/);
assert.match(app,/skyParallax\(/);
assert.match(app,/skyCacheKey\(/);
assert.match(app,/fillSpaceClear\(/);
assert.match(app,/paintGalaxyBand\(/);
assert.match(app,/SPACE_CONTEXT/);
assert.match(app,/getContext\('2d',SPACE_CONTEXT\)/);
assert.match(app,/snapWorldCam\(/);
assert.match(app,/worldStroke\(/);
assert.match(app,/strokeSilhouette\(/);
assert.match(app,/roundRect\(35,-9,45,18,3\)/);
assert.match(app,/pixelScale:worldPx\(\)/);
assert.match(app,/backingNeedsReset\(/);
assert.match(app,/warmLocalArt\(/);
assert.match(app,/warmPlanetTexture/);
assert.match(app,/warmStarTexture/);
const loopSrc=readFileSync(new URL('../dist/flight-loop.mjs',import.meta.url),'utf8');
assert.match(loopSrc,/desynchronized:\s*false/);
assert.match(loopSrc,/alpha:\s*true/);
assert.ok(!/desynchronized:\s*true/.test(loopSrc),'desync presents tear ship/station edges under the HUD');
assert.ok(!/getContext\('2d',\{alpha:\s*false/.test(app),'opaque space context is the Fold white-flash path');
assert.ok(!/function circle\([^)]*\)\{[^}]*ctx\.lineWidth=1;/.test(app),'station/ship circles no longer force a 1 CSS-px stroke');
const worldXf=app.slice(app.indexOf('drawSkyBackdrop();'),app.indexOf('if(!softFX()){const orbitColor'));
assert.ok(worldXf.includes('snapWorldCam(')&&worldXf.includes('translate(-view.x,-view.y)'),'world layer uses the pixel-locked camera');
assert.ok(!worldXf.includes('translate(-cam.x,-cam.y)'),'unsapped cam must not drive ship/station edges');
const skyFn=app.slice(app.indexOf('function drawSkyBackdrop'),app.indexOf('function drawEdgeArrow'));
assert.ok(skyFn.includes('ensureSkyLayer(')&&skyFn.includes('fillSpaceClear('));
assert.ok(skyFn.indexOf('ensureSkyLayer(')<skyFn.indexOf('fillSpaceClear('),'sky bake must finish before the main-buffer fill');
assert.ok(!/cam\.x\+=\(desiredX-cam\.x\)\*\.09/.test(app),'old frame-rate camera lerp is gone');
assert.ok(!/Math\.round\(\(\(s\.x\*width/.test(app),'starfield no longer snaps to whole pixels');
assert.ok(!/Math\.floor\(clock\*4\),cx=Math\.round\(cam\.x/.test(app),'sky cache no longer rebakes on cam/4Hz');
assert.ok(!/cam\.x\*\.012/.test(app),'galaxy band uses skyParallax, not a baked cam*.012');

const style=readFileSync(new URL('../dist/style.css',import.meta.url),'utf8');
assert.match(style,/#space\{[^}]*background:#060c16/);

const sw=readFileSync(new URL('../dist/sw.js',import.meta.url),'utf8');
assert.match(sw,/flight-loop\.mjs/);
assert.match(sw,/farbound-v2\.16\.3/);

// Camera-linked star offsets: leftover display alpha interpolates stars with the ship pose.
const star={x:.4,y:.35,depth:.05};
const s0=starScreenPos(star,0,0,800,600);
const s1=starScreenPos(star,120,40,800,600);
assert.ok(Math.abs((s0.x-s1.x)-120*star.depth)<1e-9);
assert.ok(Math.abs((s0.y-s1.y)-40*star.depth)<1e-9);
const midCam=lerp(80,180,.25);
const p0=starScreenPos(star,80,0,800,600);
const p1=starScreenPos(star,180,0,800,600);
const pi=starScreenPos(star,midCam,0,800,600);
assert.ok(Math.abs(pi.x-lerp(p0.x,p1.x,.25))<1e-9,'interpolated cam interpolates star x');
assert.ok(Math.abs(pi.x-Math.round(pi.x))>1e-9,'fractional leftover is not snapped away');
assert.equal(wrapUnit(-20,800),780);
const par=skyParallax(200,-50);
assert.ok(Math.abs(par.x-200*SKY_PARALLAX)<1e-12);
assert.ok(Math.abs(par.y+50*SKY_PARALLAX)<1e-12);
const k0=skyCacheKey({seed:1,kind:'clear'},800,600,false,false);
assert.equal(k0,skyCacheKey({seed:1,kind:'clear'},800,600,false,false));
assert.equal(k0,skyCacheKey({seed:1,kind:'clear'},800,600,false,false));
assert.notEqual(skyCacheKey({seed:1,kind:'nebula'},800,600,false,false),k0);
assert.ok(!Object.values({cam:999,clock:12.5}).some(v=>String(k0).split('|').includes(String(v))),'cache key ignores cam/clock');
const fills=[];
fillSpaceClear({setTransform(){},fillRect(x,y,w,h){fills.push({x,y,w,h,color:this.fillStyle});},fillStyle:''},2,400,300);
assert.equal(fills[0].color,SPACE_CLEAR);
assert.deepEqual(fills[0],{x:0,y:0,w:400,h:300,color:SPACE_CLEAR});

assert.equal(SPACE_CONTEXT.alpha,true);
assert.equal(SPACE_CONTEXT.desynchronized,false);
assert.equal(BACKING_SLACK,2);
assert.deepEqual(backingSize(400,300,2),{w:800,h:600});
assert.equal(backingNeedsReset(800,600,800,600),false);
assert.equal(backingNeedsReset(800,600,801,601),false,'1px Fold chrome jitter must not reset the buffer');
assert.equal(backingNeedsReset(800,600,804,600),true);
assert.equal(backingNeedsReset(0,0,800,600),true);

const snap=snapWorldCam(100.37,50.19,800,600,2,.75);
const snapTx=2*(400-snap.x*.75),snapTy=2*(300-snap.y*.75);
assert.ok(Math.abs(snapTx-Math.round(snapTx))<1e-9,'snapped view translation is a whole device pixel');
assert.ok(Math.abs(snapTy-Math.round(snapTy))<1e-9);
const rawTx=2*(400-100.37*.75);
assert.ok(Math.abs(snapTx-rawTx)<=.5+1e-9,'snap stays within half a device pixel of the chase cam');
assert.deepEqual(snapWorldCam(0,0,800,600,2,1),{x:0,y:0});
const mid=snapWorldCam(10.01,0,801,600,1.5,.54);
const midTx=1.5*(801*.5-mid.x*.54);
assert.ok(Math.abs(midTx-Math.round(midTx))<1e-9,'odd CSS widths still lock to backing pixels');
assert.equal(HAIRLINE_DEVICE,1.6);
assert.equal(SILHOUETTE_DEVICE,2.4);
assert.ok(Math.abs(hairline(1)-1.6)<1e-12);
assert.ok(Math.abs(hairline(2)-.8)<1e-12);
assert.ok(Math.abs(hairline(1,SILHOUETTE_DEVICE)-2.4)<1e-12);
const foldPx=.75*1.1;
assert.ok(worldStroke(1,foldPx)>1,'Fold-scale 1px hull strokes must thicken past a device hairline');
assert.ok(worldStroke(1,foldPx)*foldPx>=HAIRLINE_DEVICE-1e-9);
assert.equal(worldStroke(2,2),2,'desktop 2x already-thick strokes stay put');
const strokes=[];
strokeSilhouette({
 lineWidth:1,globalAlpha:1,lineJoin:'',lineCap:'',
 stroke(){strokes.push({w:this.lineWidth,a:this.globalAlpha});}
},foldPx);
assert.equal(strokes.length,2,'silhouette is a soft under-stroke then a locked outline');
assert.ok(strokes[0].w*foldPx>=SILHOUETTE_DEVICE-1e-9);
assert.ok(Math.abs(strokes[0].a-.4)<1e-12);
assert.ok(strokes[1].w*foldPx>=HAIRLINE_DEVICE-1e-9);
assert.equal(strokes[1].a,1);
const shipSrc=readFileSync(new URL('../dist/ship-render.mjs',import.meta.url),'utf8');
assert.match(shipSrc,/worldStroke/);
assert.match(shipSrc,/strokeSilhouette/);
assert.match(shipSrc,/pixelScale/);
assert.match(shipSrc,/lineJoin='round'/);
assert.ok(!/ctx\.lineWidth=\.6/.test(shipSrc),'panel hairlines go through worldStroke');

const cruise=[];
let cx=0;
for(let i=0;i<8;i++){
 cx+=220/60;
 const v=snapWorldCam(cx,0,800,600,2,.75);
 cruise.push(2*(400-v.x*.75));
}
for(let i=1;i<cruise.length;i++){
 assert.ok(Number.isInteger(cruise[i])||Math.abs(cruise[i]-Math.round(cruise[i]))<1e-9);
 assert.ok(cruise[i]<=cruise[i-1],'locked cam steps monotonically as the chase cam advances');
}

console.log('PASS Fixed 60 Hz steps, hitch clamp, and leftover alpha');
console.log('PASS Time-based camera lag is stable at 30/60/120 Hz (old lerp is not)');
console.log(`PASS Camera offset spread time=${timeSpread.toFixed(2)} vs frame-lerp=${frameSpread.toFixed(2)}`);
console.log('PASS Pixel budget caps huge fold CSS sizes without dropping typical phones');
console.log('PASS Star photosphere size no longer tracks zoom/DPR on the hot path');
console.log('PASS Starfield and sky parallax track interpolated camera without 4 Hz wash rebake');
console.log('PASS Space canvas stays transparent and synchronized; world cam locks to backing pixels');
console.log('PASS Fold-scale hull/station strokes stay at least a 1.6 device-pixel hairline with silhouette AA');

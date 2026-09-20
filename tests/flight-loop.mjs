import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 FIXED_DT,MAX_FRAME_DT,MAX_STEPS,CAM_FOLLOW,PIXEL_BUDGET,
 createFrameClock,resetFrameClock,beginFrame,expSmooth,followCam,
 lerp,lerpAngle,canvasScale,viewportSize,chaseOffset,createPacer
} from '../dist/flight-loop.mjs';
import {texSizeFor,STAR_TEX} from '../dist/star-render.mjs';

assert.equal(FIXED_DT,1/60);
assert.ok(CAM_FOLLOW>5&&CAM_FOLLOW<7);
assert.equal(PIXEL_BUDGET.high,3.6e6);

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
assert.ok(desktop>=1.7,'1080p-class desktop stays near 2x');
const foldInner=canvasScale({cssW:1800,cssH:2200,dpr:3,graphics:'high'});
assert.ok(foldInner*1800*foldInner*2200<=PIXEL_BUDGET.high*1.05,'huge CSS viewports stay on budget');
const lite=canvasScale({cssW:1280,cssH:800,dpr:2,graphics:'performance'});
assert.ok(lite<desktop||lite<=Math.sqrt(PIXEL_BUDGET.performance/(1280*800))+1e-6);

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
assert.match(app,/desynchronized:\s*true/);
assert.match(app,/warmStarTexture/);
assert.ok(!/cam\.x\+=\(desiredX-cam\.x\)\*\.09/.test(app),'old frame-rate camera lerp is gone');

const sw=readFileSync(new URL('../dist/sw.js',import.meta.url),'utf8');
assert.match(sw,/flight-loop\.mjs/);
assert.match(sw,/farbound-v2\.15\.5/);

console.log('PASS Fixed 60 Hz steps, hitch clamp, and leftover alpha');
console.log('PASS Time-based camera lag is stable at 30/60/120 Hz (old lerp is not)');
console.log(`PASS Camera offset spread time=${timeSpread.toFixed(2)} vs frame-lerp=${frameSpread.toFixed(2)}`);
console.log('PASS Pixel budget caps huge fold CSS sizes without dropping typical phones');
console.log('PASS Star photosphere size no longer tracks zoom/DPR on the hot path');

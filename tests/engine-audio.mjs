import assert from 'node:assert/strict';
import {fadeLoopBuffer,removeDc,prepareLoopSamples,rampGain} from '../dist/engine-audio.mjs';

const wrap=new Float32Array([0.9,0.4,-0.2,-0.8]);
fadeLoopBuffer(wrap,2);
assert.ok(Math.abs(wrap[0])<1e-9,'loop start fades to 0');
assert.ok(Math.abs(wrap[3])<1e-9,'loop end fades to 0');
assert.ok(Math.abs(wrap[1])>0.1);
assert.ok(Math.abs(wrap[2])>0.1);

const dc=new Float32Array([0.5,0.5,0.5,0.5]);
removeDc(dc);
assert.ok([...dc].every(v=>Math.abs(v)<1e-9));

const loop=new Float32Array(200);
for(let i=0;i<loop.length;i++)loop[i]=((i%7)-3)/3;
prepareLoopSamples(loop,8000);
assert.ok(Math.abs(loop[0])<0.05);
assert.ok(Math.abs(loop[loop.length-1])<0.05);
const mean=loop.reduce((a,b)=>a+b,0)/loop.length;
assert.ok(Math.abs(mean)<0.02,'loop bed has no loud DC');

const calls=[];
const param={
 value:0.2,
 cancelScheduledValues(t){calls.push(['cancel',t]);},
 setValueAtTime(v,t){calls.push(['set',v,t]);this.value=v;},
 exponentialRampToValueAtTime(v,t){calls.push(['exp',v,t]);this.value=v;},
 linearRampToValueAtTime(v,t){calls.push(['lin',v,t]);this.value=v;}
};
rampGain(param,0,1,.05);
assert.equal(calls[0][0],'cancel');
assert.ok(calls.some(c=>c[0]==='exp'&&c[1]<=1e-4),'silence uses a ramp, not a hard jump to 0');
assert.ok(calls.some(c=>c[0]==='set'&&c[1]===0));

const up={...param,value:0,cancelScheduledValues(t){calls.push(['cancel',t]);},setValueAtTime(v,t){calls.push(['up-set',v,t]);this.value=v;},exponentialRampToValueAtTime(v,t){calls.push(['up-exp',v,t]);},linearRampToValueAtTime(v,t){calls.push(['up-lin',v,t]);}};
rampGain(up,0.3,2,.04);
assert.ok(calls.some(c=>c[0]==='up-exp'||c[0]==='up-lin'),'attack from silence ramps');

console.log('PASS Loop beds fade at the wrap and drop DC');
console.log('PASS Gain ramps never jump from a playing level to 0');

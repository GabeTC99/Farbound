import assert from 'node:assert/strict';
import {fadeLoopBuffer,removeDc,prepareLoopSamples,rampGain,EngineAudio,SURFACE_AUDIO_CUES,cueAssetUrl} from '../dist/engine-audio.mjs';

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

const plays=[],stops=[];
class FakeCtx{
 constructor(){this.currentTime=0;this.state='running';this.destination={};}
 resume(){this.state='running';return Promise.resolve();}
 createGain(){return {gain:{value:1,setTargetAtTime(v){this.value=v;}},connect(){}};}
 createBuffer(ch,len,rate){return {numberOfChannels:ch,length:len,sampleRate:rate,duration:len/rate,getChannelData:()=>new Float32Array(len)};}
 createBufferSource(){const s={buffer:null,loop:false,connect(){},start(){if(s.buffer?.used)throw new Error('buffer already started');if(s.buffer)s.buffer.used=true;plays.push(s);},stop(){stops.push(s);}};return s;}
 decodeAudioData(){const data=new Float32Array(8);return Promise.resolve({duration:.4,numberOfChannels:1,length:8,sampleRate:8000,getChannelData:()=>data});}
}
const audio=new EngineAudio();
audio.context=new FakeCtx();
const fetched=[];
globalThis.fetch=async url=>{fetched.push(String(url));return {ok:true,arrayBuffer:async()=>new ArrayBuffer(8)};};
assert.match(cueAssetUrl('assets/audio/planetary/pad_inspect_start.mp3'),/pad_inspect_start\.mp3$/);
assert.ok(audio.playCue(SURFACE_AUDIO_CUES.inspectStart));
assert.ok(audio.playCue(SURFACE_AUDIO_CUES.inspectLoop));
await new Promise(r=>setTimeout(r,20));
assert.equal(plays.length,2,'inspect start and loop start buffers');
assert.equal(plays[0].loop,false);
assert.equal(plays[1].loop,true);
assert.ok(fetched.some(u=>u.includes('pad_inspect_start.mp3')));
assert.ok(fetched.some(u=>u.includes('pad_inspect_loop.mp3')));
assert.ok(audio.playCue(SURFACE_AUDIO_CUES.inspectStop));
await new Promise(r=>setTimeout(r,20));
assert.ok(stops.length>=1,'inspect stop kills the working loop');
assert.ok(plays.some(s=>s.buffer&&!s.loop&&plays.indexOf(s)>1)||plays.length>=3);
assert.ok(audio.playCue(SURFACE_AUDIO_CUES.embark));
assert.ok(audio.playCue(SURFACE_AUDIO_CUES.inspectStart));
await new Promise(r=>setTimeout(r,20));
assert.ok(audio.playCue(SURFACE_AUDIO_CUES.embark));
assert.ok(audio.playCue(SURFACE_AUDIO_CUES.takeoff));
assert.ok(audio.playCue(SURFACE_AUDIO_CUES.inspectStart));
await new Promise(r=>setTimeout(r,20));
const whoosh=plays.filter(s=>!s.loop&&s.buffer?.sampleRate===8000);
assert.ok(whoosh.length>=4,'embark and inspect start each replay on a fresh buffer');
assert.ok(fetched.some(u=>u.includes('embark_whoosh.mp3')));
console.log('PASS Planetary cues decode through AudioContext and replay oneshots');

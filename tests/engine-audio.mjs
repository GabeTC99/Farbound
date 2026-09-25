import assert from 'node:assert/strict';
import {fadeLoopBuffer,removeDc,prepareLoopSamples,rampGain,EngineAudio,SURFACE_AUDIO_CUES,cueAssetUrl,SHIP_AUDIO_STEMS,AUDIO_CUES,shipAudioCue,resolveShipCue,gritInterval,gritLevel,SHIP_THRUST_LEVEL,SHIP_SHOT_LEVEL,pickNpcThrusters,cueHullId,SPACE_AUDIO_STEMS,SPACE_BED_LEVEL,SPACE_RADIO_LEVEL,SPACE_DOCK_LEVEL,spaceApproachGain,SPACE_RADIO_GAP} from '../dist/engine-audio.mjs';

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

assert.equal(SHIP_AUDIO_STEMS.length,60);
for(const stem of SHIP_AUDIO_STEMS){
 assert.equal(AUDIO_CUES[stem].file,'assets/audio/ships/'+stem+'.mp3');
 assert.equal(AUDIO_CUES[stem].type,stem.startsWith('thruster_')?'loop':'oneshot');
}
assert.equal(shipAudioCue('thruster','wren'),'thruster_wren');
assert.equal(shipAudioCue('flyby','sparrow'),'flyby_sparrow');
assert.equal(shipAudioCue('land','kestrel'),'land_kestrel');
assert.equal(shipAudioCue('thruster','mule'),'thruster_mule');
assert.equal(shipAudioCue('thruster','jackal'),'thruster_jackal');
assert.equal(resolveShipCue('land','mule'),'land_mule');
assert.equal(resolveShipCue('flyby','rook'),'flyby_rook');
assert.equal(resolveShipCue('thruster','tern'),'thruster_tern');
assert.equal(resolveShipCue('land','jackal'),'land_jackal');
assert.equal(resolveShipCue('flyby','wren'),'flyby_wren');
assert.equal(resolveShipCue('land','eagle'),'land_eagle');
assert.equal(shipAudioCue('thruster','eagle'),'thruster_eagle');
assert.equal(shipAudioCue('flyby','condor'),'flyby_condor');
assert.equal(shipAudioCue('land','goliath'),'land_goliath');
assert.equal(resolveShipCue('land','courier'),null);
audio.syncHullThruster({hull:'wren',thrust:1,live:true});
audio.playCue('flyby_wren');
audio.playCue('land_kestrel');
await new Promise(r=>setTimeout(r,30));
assert.ok(fetched.some(u=>u.includes('thruster_wren.mp3')));
assert.ok(fetched.some(u=>u.includes('flyby_wren.mp3')));
assert.ok(fetched.some(u=>u.includes('land_kestrel.mp3')));
assert.ok(plays.some(s=>s.loop),'thruster loop starts while thrusting');
const loopsBefore=plays.filter(s=>s.loop).length;
audio.syncHullThruster({hull:'wren',thrust:0,live:true});
assert.ok(stops.length>=1,'thruster loop stops when thrust ends');
audio.playCue('flyby_wren');
await new Promise(r=>setTimeout(r,20));
assert.ok(plays.filter(s=>!s.loop).length>=3,'flyby and land replay as oneshots');
assert.equal(plays.filter(s=>s.loop).length,loopsBefore);
audio.syncHullThruster({hull:'courier',thrust:1,live:true});
assert.equal(audio.hullThrusterOn,false,'hulls without a thruster file keep the oscillator bed');
audio.syncHullThruster({hull:'eagle',thrust:1,live:true});
await new Promise(r=>setTimeout(r,20));
assert.equal(audio.hullThrusterOn,true);
assert.ok(fetched.some(u=>u.includes('thruster_eagle.mp3')));
assert.ok(Math.abs(audio.shipThrustGain.gain.value-SHIP_THRUST_LEVEL)<1e-6,'thruster bus is a fraction of the cue bus');
assert.ok(Math.abs(audio.shipShotGain.gain.value-SHIP_SHOT_LEVEL)<1e-6,'flyby and land sit hotter than thrust');
assert.ok(SHIP_THRUST_LEVEL>=.25&&SHIP_THRUST_LEVEL<=.4);
assert.ok(SHIP_SHOT_LEVEL>SHIP_THRUST_LEVEL&&SHIP_SHOT_LEVEL<1);
console.log('PASS Ship thruster loops and flyby/land oneshots resolve by hull');
assert.ok(gritInterval('ice',false)>gritInterval('earthlike',false));
assert.ok(gritInterval('ice',true)<gritInterval('ice',false));
assert.ok(gritInterval('earthlike',true)<gritInterval('earthlike',false));
assert.ok(gritInterval('ice',false)>=1.07,'ice gap covers the crack length');
assert.ok(gritLevel('ice')<gritLevel('earthlike'));
assert.ok(gritLevel('earthlike')<1);
const gritStops=stops.length;
audio.playCue('grit_ice');
await new Promise(r=>setTimeout(r,20));
audio.playCue('grit_ice');
await new Promise(r=>setTimeout(r,20));
assert.ok(stops.length>gritStops,'a new grit oneshot stops the one already playing');
assert.ok(Math.abs(audio.gritGain.gain.value-gritLevel('ice'))<1e-6);
audio.playCue('grit_mineral');
await new Promise(r=>setTimeout(r,20));
assert.ok(Math.abs(audio.gritGain.gain.value-gritLevel('mineral'))<1e-6);
console.log('PASS Grit oneshots replace the previous crack and sit under the cue bus');

assert.equal(cueHullId('courier'),'tern');
assert.equal(cueHullId('wren'),'wren');
assert.equal(cueHullId('freighter'),'ox');
const fleet=[
 {id:'a',hull:'courier',thrust:1,x:10,y:0},
 {id:'b',hull:'freighter',thrust:1,x:40,y:0},
 {id:'c',hull:'tender',thrust:1,x:80,y:0},
 {id:'d',hull:'prospector',thrust:1,x:120,y:0},
 {id:'far',hull:'surveyor',thrust:1,x:2000,y:0},
 {id:'idle',hull:'courier',thrust:0,x:5,y:0}
];
const picked=pickNpcThrusters(fleet,{x:0,y:0});
assert.equal(picked.length,3);
assert.deepEqual(picked.map(p=>p.id),['a','b','c']);
assert.equal(picked[0].hull,'tern');
assert.equal(audio.hullThrusterCue,'thruster_eagle');
const playerSrc=audio.cueSources.get('thruster_eagle');
audio.syncNpcShips({ships:fleet,x:0,y:0,live:true});
await new Promise(r=>setTimeout(r,30));
assert.equal(audio.npcLoops.size,3);
assert.equal(audio.cueSources.get('thruster_eagle'),playerSrc,'npc loops do not stop the player thruster');
assert.ok([...audio.npcLoops.values()].every(s=>s.src&&s.src.loop));
const npcStops=stops.length;
audio.syncNpcShips({ships:[{id:'a',hull:'courier',thrust:1,x:900,y:0}],x:0,y:0,live:true});
await new Promise(r=>setTimeout(r,10));
assert.equal(audio.npcLoops.size,0);
assert.ok(stops.length>npcStops,'npc thrusters stop when they leave range');
const shotsBefore=plays.filter(s=>!s.loop).length;
const passer={id:'pass',hull:'courier',thrust:1,x:400,y:0,status:'IN TRANSIT'};
audio.syncNpcShips({ships:[passer],x:0,y:0,live:true});
passer.x=100;
audio.syncNpcShips({ships:[passer],x:0,y:0,live:true});
await new Promise(r=>setTimeout(r,30));
assert.ok(plays.filter(s=>!s.loop).length>shotsBefore,'a near pass plays a flyby');
assert.ok(fetched.some(u=>u.includes('flyby_tern.mp3')));
const docked={id:'dock',hull:'freighter',thrust:0,x:40,y:0,status:'IN TRANSIT'};
audio.syncNpcShips({ships:[docked],x:0,y:0,live:true});
const landBefore=plays.filter(s=>!s.loop).length;
docked.status='DOCKED';
audio.syncNpcShips({ships:[docked],x:0,y:0,live:true});
await new Promise(r=>setTimeout(r,30));
assert.ok(plays.filter(s=>!s.loop).length>landBefore,'docking plays a land cue');
assert.ok(fetched.some(u=>u.includes('land_ox.mp3')));
assert.ok(Math.abs(audio.gritGain.gain.value-gritLevel('mineral'))<1e-6,'ship buses leave grit alone');
console.log('PASS Nearby NPC hulls play capped thruster, flyby, and land cues');

assert.equal(SPACE_AUDIO_STEMS.length,4);
for(const stem of SPACE_AUDIO_STEMS)assert.equal(AUDIO_CUES[stem].file,'assets/audio/space/'+stem+'.mp3');
assert.equal(AUDIO_CUES.vacuum_bed.type,'loop');
assert.equal(AUDIO_CUES.vacuum_radio.type,'oneshot');
assert.equal(AUDIO_CUES.station_approach.type,'loop');
assert.equal(AUDIO_CUES.station_dock.type,'oneshot');
assert.ok(SPACE_BED_LEVEL<SHIP_THRUST_LEVEL);
assert.ok(SPACE_RADIO_LEVEL<SPACE_BED_LEVEL);
assert.ok(SPACE_DOCK_LEVEL<SHIP_SHOT_LEVEL);
assert.equal(spaceApproachGain(3000),0);
assert.ok(spaceApproachGain(2000)>0);
assert.ok(spaceApproachGain(200)<spaceApproachGain(0));
assert.ok(spaceApproachGain(0)<=.20);
audio.syncSpaceAudio({live:true,docked:false,stationDist:3000,now:1});
await new Promise(r=>setTimeout(r,30));
assert.ok(audio.isCueLooping('vacuum_bed'));
assert.ok(Math.abs(audio.spaceBedGain.gain.value-SPACE_BED_LEVEL)<1e-6);
assert.equal(audio.isCueLooping('station_approach'),false);
audio.syncSpaceAudio({live:true,docked:false,stationDist:400,now:1});
await new Promise(r=>setTimeout(r,20));
assert.ok(audio.isCueLooping('station_approach'));
assert.ok(Math.abs(audio.spaceApproachGain.gain.value-spaceApproachGain(400))<1e-6);
const radioBefore=plays.filter(s=>!s.loop).length;
audio.syncSpaceAudio({live:true,docked:false,stationDist:400,now:1+SPACE_RADIO_GAP});
await new Promise(r=>setTimeout(r,20));
assert.ok(plays.filter(s=>!s.loop).length>radioBefore,'radio chirps on a long gap');
assert.ok(Math.abs(audio.spaceRadioGain.gain.value-SPACE_RADIO_LEVEL)<1e-6);
audio.syncSpaceAudio({live:true,docked:true,stationDist:80,now:30});
await new Promise(r=>setTimeout(r,20));
assert.equal(audio.isCueLooping('vacuum_bed'),false,'docked flight drops the vacuum bed');
assert.equal(audio.isCueLooping('station_approach'),false);
assert.ok(fetched.some(u=>u.includes('station_dock.mp3')));
audio.syncSpaceAudio({live:true,docked:true,stationDist:80,now:40});
const dockPlays=audio.cueLog.filter(n=>n==='station_dock').length;
audio.syncSpaceAudio({live:true,docked:true,stationDist:80,now:41});
assert.equal(audio.cueLog.filter(n=>n==='station_dock').length,dockPlays,'dock confirm does not repeat');
assert.ok(Math.abs(audio.gritGain.gain.value-gritLevel('mineral'))<1e-6);
assert.ok(Math.abs(audio.shipThrustGain.gain.value-SHIP_THRUST_LEVEL)<1e-6);
console.log('PASS Space bed, sparse radio, approach hum, and one dock confirm');

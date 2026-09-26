/** Ship audio: Scenario-generated engine/boost loops layered with a live airy synth (noise whoosh + chorused pad), plus sampled effects. Falls back to soft synth tones until samples decode. */
const SAMPLES={engine:'audio/engine-loop.mp3',boost:'audio/boost-loop.mp3',fire:'audio/laser.mp3',click:'audio/blip.mp3',good:'audio/chime.mp3',jump:'audio/jump.mp3'};
const SFX_GAIN={fire:.2,click:.22,good:.3,jump:.42};
export const AUDIO_FILES=Object.values(SAMPLES);
const MIX=2.4,clamp01=v=>Math.max(0,Math.min(1,v));

export class EngineAudio{
 constructor(base=new URL('./',import.meta.url)){this.context=null;this.base=base;this.buffers={};this.loops={};}
 unlock(){
  if(!this.context){
   const Audio=globalThis.AudioContext||globalThis.webkitAudioContext;if(!Audio)return;
   const c=new Audio();this.context=c;
   this.master=c.createDynamicsCompressor();this.master.threshold.value=-14;this.master.ratio.value=4;this.master.connect(c.destination);
   this.sfx=c.createGain();this.sfx.gain.value=1;this.sfx.connect(this.master);
   this.gain=c.createGain();this.gain.gain.value=0;this.gain.connect(this.master);
   // Airy whoosh: looping soft noise through a drifting band-pass.
   const len=c.sampleRate*2,noise=c.createBuffer(1,len,c.sampleRate),d=noise.getChannelData(0);let b0=0,b1=0;
   for(let i=0;i<len;i++){const w=Math.random()*2-1;b0=.97*b0+w*.03;b1=.6*b1+w*.4;d[i]=(b0*3+b1*.35)*.8;}
   this.noise=c.createBufferSource();this.noise.buffer=noise;this.noise.loop=true;
   this.band=c.createBiquadFilter();this.band.type='bandpass';this.band.Q.value=1.1;this.band.frequency.value=500;
   this.whoosh=c.createGain();this.whoosh.gain.value=.3;
   this.noise.connect(this.band);this.band.connect(this.whoosh);this.whoosh.connect(this.gain);
   // Slow phasing shimmer on the whoosh band.
   this.lfo=c.createOscillator();this.lfo.frequency.value=.23;this.lfoDepth=c.createGain();this.lfoDepth.gain.value=160;this.lfo.connect(this.lfoDepth);this.lfoDepth.connect(this.band.frequency);
   // Chorused mid pad so the engine carries on phone speakers.
   this.pad=c.createGain();this.pad.gain.value=.16;this.padFilter=c.createBiquadFilter();this.padFilter.type='lowpass';this.padFilter.frequency.value=900;this.padFilter.connect(this.pad);this.pad.connect(this.gain);
   this.voices=[[1,'sine',.5],[1.004,'sine',.5],[1.5,'sine',.28],[2.003,'triangle',.12]].map(([ratio,type,level])=>{const o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.value=110*ratio;g.gain.value=level;o.connect(g);g.connect(this.padFilter);return{o,ratio};});
   // Sampled loops, faded in once decoded.
   this.engineBed=c.createGain();this.engineBed.gain.value=.75;this.engineBed.connect(this.gain);
   this.boostBed=c.createGain();this.boostBed.gain.value=0;this.boostBed.connect(this.gain);
   this.noise.start();this.lfo.start();for(const v of this.voices)v.o.start();
   this.load();
  }
  if(this.context.state==='suspended')this.context.resume().catch(()=>{});
 }
 load(){
  for(const [kind,file] of Object.entries(SAMPLES))fetch(new URL(file,this.base)).then(r=>{if(!r.ok)throw Error(file);return r.arrayBuffer();}).then(data=>new Promise((ok,fail)=>this.context.decodeAudioData(data,ok,fail))).then(buffer=>{this.buffers[kind]=buffer;if(kind==='engine'||kind==='boost')this.startLoop(kind);}).catch(()=>{});
 }
 startLoop(kind){
  const c=this.context,buffer=this.buffers[kind],src=c.createBufferSource(),d=buffer.getChannelData(0);
  // Skip MP3 encoder padding so the loop point is seamless.
  let a=0,b=d.length-1;while(a<b&&Math.abs(d[a])<1e-4)a++;while(b>a&&Math.abs(d[b])<1e-4)b--;
  src.buffer=buffer;src.loop=true;src.loopStart=a/buffer.sampleRate;src.loopEnd=(b+1)/buffer.sampleRate;
  src.connect(kind==='engine'?this.engineBed:this.boostBed);src.start(0,src.loopStart);this.loops[kind]=src;
 }
 update({moving=0,boost=false,volume=.35,enabled=true,paused=false,surface=false}={}){
  if(!this.context)return;const t=this.context.currentTime,n=clamp01(moving),level=.14+.86*n;
  this.gain.gain.setTargetAtTime(enabled&&!paused?Math.pow(clamp01(volume),1.25)*level*.32*MIX:0,t,.18);
  const base=(surface?98:82)+n*38+(boost?22:0);for(const v of this.voices)v.o.frequency.setTargetAtTime(base*v.ratio,t,.25);
  this.padFilter.frequency.setTargetAtTime(600+n*900+(boost?700:0),t,.2);
  this.band.frequency.setTargetAtTime(380+n*1300+(boost?1500:0),t,.2);this.band.Q.setTargetAtTime(boost?.8:1.1,t,.3);
  this.whoosh.gain.setTargetAtTime(.18+n*.5+(boost?.25:0),t,.2);
  const rate=.82+n*.32+(boost?.08:0);for(const src of Object.values(this.loops))src.playbackRate.setTargetAtTime(rate,t,.3);
  this.engineBed.gain.setTargetAtTime(this.loops.engine?.75:0,t,.3);
  this.boostBed.gain.setTargetAtTime(boost&&n>.05?.85:0,t,boost?.12:.35);
 }
 play(kind='click'){
  this.unlock();const c=this.context;if(!c)return;const t=c.currentTime,buffer=this.buffers[kind];
  if(buffer){const src=c.createBufferSource(),g=c.createGain();src.buffer=buffer;src.playbackRate.value=kind==='fire'?.94+Math.random()*.12:1;g.gain.value=SFX_GAIN[kind]??.22;src.connect(g);g.connect(this.sfx);src.start(t);return;}
  // Fallback while samples load: soft sine sweeps instead of harsh triangle buzz.
  const o=c.createOscillator(),g=c.createGain(),f=kind==='fire'?1200:kind==='good'?660:kind==='jump'?140:520;
  o.type='sine';o.frequency.setValueAtTime(f,t);o.frequency.exponentialRampToValueAtTime(kind==='fire'?260:kind==='jump'?900:f*1.5,t+(kind==='jump'?.6:.12));
  g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.06,t+.01);g.gain.exponentialRampToValueAtTime(.0001,t+(kind==='jump'?.7:.16));
  o.connect(g);g.connect(this.sfx);o.start(t);o.stop(t+(kind==='jump'?.75:.2));
 }
 mute(){if(this.context)this.gain.gain.setTargetAtTime(0,this.context.currentTime,.05);}
}

export class EngineAudio{
 constructor(){this.context=null;this.humReady=false;}
 unlock(){
  if(!this.context){
   const Audio=globalThis.AudioContext||globalThis.webkitAudioContext;if(!Audio)return;
   const c=new Audio();this.context=c;
   this.low=c.createOscillator();this.mid=c.createOscillator();this.gain=c.createGain();this.filter=c.createBiquadFilter();
   this.low.type='sine';this.mid.type='triangle';this.gain.gain.value=0;this.filter.type='lowpass';this.filter.frequency.value=160;
   this.low.connect(this.filter);this.mid.connect(this.filter);this.filter.connect(this.gain);this.gain.connect(c.destination);
   this.low.start();this.mid.start();
  }
  this.ensureHum();
  if(this.context.state==='suspended')this.context.resume().catch(()=>{});
 }
 ensureHum(){
  if(!this.context||this.humReady)return;
  const c=this.context;
  // Fixed-pitch habitat bed. Do not retarget frequency each frame — that drifts and feels like speeding up.
  this.hum=c.createOscillator();this.hum2=c.createOscillator();
  this.humGain=c.createGain();this.humFilter=c.createBiquadFilter();
  this.hum.type='sine';this.hum2.type='sine';
  this.hum.frequency.value=88;this.hum2.frequency.value=132;
  this.humFilter.type='lowpass';this.humFilter.frequency.value=200;this.humFilter.Q.value=.45;
  this.humGain.gain.value=0;
  this.hum2Gain=c.createGain();this.hum2Gain.gain.value=.3;
  this.hum.connect(this.humFilter);
  this.hum2.connect(this.hum2Gain);this.hum2Gain.connect(this.humFilter);
  this.humFilter.connect(this.humGain);this.humGain.connect(c.destination);
  this.hum.start();this.hum2.start();
  const seconds=4,rate=c.sampleRate,buffer=c.createBuffer(1,rate*seconds,rate),data=buffer.getChannelData(0);
  let b0=0,b1=0,b2=0;
  for(let i=0;i<data.length;i++){
   const w=Math.random()*2-1;
   b0=.99886*b0+w*.0555179;b1=.99332*b1+w*.0750759;b2=.96900*b2+w*.1538520;
   data[i]=(b0+b1+b2)*.14;
  }
  this.noise=c.createBufferSource();this.noise.buffer=buffer;this.noise.loop=true;
  this.noiseFilter=c.createBiquadFilter();this.noiseFilter.type='lowpass';this.noiseFilter.frequency.value=150;this.noiseFilter.Q.value=.4;
  this.noiseGain=c.createGain();this.noiseGain.gain.value=0;
  this.noise.connect(this.noiseFilter);this.noiseFilter.connect(this.noiseGain);this.noiseGain.connect(c.destination);
  this.noise.start();
  this.humReady=true;
 }
 update({moving=0,boost=false,volume=.35,enabled=true,paused=false,surface=false,station=false}={}){
  if(!this.context)return;
  this.ensureHum();
  const t=this.context.currentTime,n=Math.max(0,Math.min(1,moving)),vol=Math.pow(Math.max(0,Math.min(1,volume)),1.15);
  const live=enabled&&!paused;
  this.gain.gain.setTargetAtTime(live&&!station?vol*n*.32:0,t,.12);
  this.low.frequency.setTargetAtTime(38+n*24+(boost?14:0)+(surface?5:0),t,.18);
  this.mid.frequency.setTargetAtTime(77+n*45+(boost?19:0),t,.18);
  this.filter.frequency.setTargetAtTime(100+n*150+(boost?75:0),t,.2);
  const humOn=live&&station;
  const bed=Math.max(vol,.25);
  // Gain only — pitch stays locked.
  if(this.humGain)this.humGain.gain.setTargetAtTime(humOn?bed*.26:0,t,.4);
  if(this.noiseGain)this.noiseGain.gain.setTargetAtTime(humOn?bed*.055:0,t,.45);
 }
 mute(){
  if(!this.context)return;
  this.gain.gain.setTargetAtTime(0,this.context.currentTime,.05);
 }
 muteAll(){
  if(!this.context)return;
  const t=this.context.currentTime;
  this.gain.gain.setTargetAtTime(0,t,.05);
  if(this.humGain)this.humGain.gain.setTargetAtTime(0,t,.05);
  if(this.noiseGain)this.noiseGain.gain.setTargetAtTime(0,t,.05);
 }
}

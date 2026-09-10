export class EngineAudio{
 constructor(){this.context=null;this.humReady=false;this.ambReady=false;}
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
  this.ensureAmb();
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
 ensureAmb(){
  if(!this.context||this.ambReady)return;
  const c=this.context;
  // Space / surface ambient — gain and filter only; pitch locked.
  const seconds=5,rate=c.sampleRate,buffer=c.createBuffer(1,rate*seconds,rate),data=buffer.getChannelData(0);
  let b0=0,b1=0,b2=0;
  for(let i=0;i<data.length;i++){
   const w=Math.random()*2-1;
   b0=.997*b0+w*.05;b1=.985*b1+w*.07;b2=.96*b2+w*.12;
   data[i]=(b0+b1+b2)*.11;
  }
  this.amb=c.createBufferSource();this.amb.buffer=buffer;this.amb.loop=true;
  this.ambFilter=c.createBiquadFilter();this.ambFilter.type='lowpass';this.ambFilter.frequency.value=220;this.ambFilter.Q.value=.35;
  this.ambGain=c.createGain();this.ambGain.gain.value=0;
  this.amb.connect(this.ambFilter);this.ambFilter.connect(this.ambGain);this.ambGain.connect(c.destination);
  this.amb.start();
  this.ambReady=true;
 }
 update({moving=0,boost=false,volume=.35,enabled=true,paused=false,surface=false,station=false,sky='clear',surfaceKind='mineral',planetFeet=false}={}){
  if(!this.context)return;
  this.ensureHum();
  this.ensureAmb();
  const t=this.context.currentTime,n=Math.max(0,Math.min(1,moving)),vol=Math.pow(Math.max(0,Math.min(1,volume)),1.15);
  const live=enabled&&!paused;
  this.gain.gain.setTargetAtTime(live&&!station&&!planetFeet?vol*n*.32:0,t,.12);
  this.low.frequency.setTargetAtTime(38+n*24+(boost?14:0)+(surface?5:0),t,.18);
  this.mid.frequency.setTargetAtTime(77+n*45+(boost?19:0),t,.18);
  this.filter.frequency.setTargetAtTime(100+n*150+(boost?75:0),t,.2);
  const stationHum=live&&station&&!planetFeet;
  const bed=Math.max(vol,.25);
  if(this.humGain)this.humGain.gain.setTargetAtTime(stationHum?bed*.26:0,t,.4);
  if(this.noiseGain)this.noiseGain.gain.setTargetAtTime(stationHum?bed*.055:0,t,.45);

  // Ambient: space sky bed, or surface/planet wind. Filter cutoff locked per mode (no drift).
  let ambGain=0,ambCut=180;
  if(live&&!stationHum){
   if(surface||planetFeet){
    const wind={earthlike:.046,ocean:.045,arid:.055,ice:.038,metal:.05,mineral:.048,gas:.05,icegiant:.042}[surfaceKind]||.048;
    ambGain=bed*(planetFeet?wind*.7:wind);
    ambCut={earthlike:175,ocean:160,arid:240,ice:140,metal:200,mineral:190,gas:210,icegiant:150}[surfaceKind]||190;
   }else{
    const skyBed={clear:.028,nebula:.034,storm:.05,ion:.036,dust:.032,deep:.014}[sky]||.028;
    ambGain=bed*skyBed;
    ambCut={clear:200,nebula:160,storm:320,ion:240,dust:180,deep:110}[sky]||200;
   }
  }
  if(this.ambFilter)this.ambFilter.frequency.setTargetAtTime(ambCut,t,.5);
  if(this.ambGain)this.ambGain.gain.setTargetAtTime(ambGain,t,.45);
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
  if(this.ambGain)this.ambGain.gain.setTargetAtTime(0,t,.05);
 }
}

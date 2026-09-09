export class EngineAudio{
 constructor(){this.context=null;}
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
  if(!this.context||this.humGain)return;
  const c=this.context;
  // Quiet deep space drone — pure low sines only (no noise bed; noise read as rotor roar).
  this.hum=c.createOscillator();this.hum2=c.createOscillator();
  this.humGain=c.createGain();this.humFilter=c.createBiquadFilter();
  this.hum.type='sine';this.hum2.type='sine';
  this.hum.frequency.value=38;this.hum2.frequency.value=57;
  this.humFilter.type='lowpass';this.humFilter.frequency.value=70;this.humFilter.Q.value=.4;
  this.humGain.gain.value=0;
  // Blend second partial quietly
  this.hum2Gain=c.createGain();this.hum2Gain.gain.value=.22;
  this.hum.connect(this.humFilter);
  this.hum2.connect(this.hum2Gain);this.hum2Gain.connect(this.humFilter);
  this.humFilter.connect(this.humGain);this.humGain.connect(c.destination);
  this.hum.start();this.hum2.start();
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
  // Soft habitat pressure tone — felt more than heard.
  const humOn=live&&station;
  const bed=Math.max(0,Math.min(1,volume));
  this.humGain.gain.setTargetAtTime(humOn?bed*.09:0,t,.6);
  if(humOn){
   this.hum.frequency.setTargetAtTime(36+Math.sin(t*.11)*.6,t,1.2);
   this.hum2.frequency.setTargetAtTime(54+Math.sin(t*.08)*.8,t,1.2);
  }
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
 }
}

/** Xbox-focused Standard Gamepad helpers for Farbound (Chrome/Edge on PC + gamepads). */

export const XB={
 A:0,B:1,X:2,Y:3,
 LB:4,RB:5,LT:6,RT:7,
 VIEW:8,MENU:9,
 LS:10,RS:11,
 UP:12,DOWN:13,LEFT:14,RIGHT:15
};

const DEAD=.22;
const STICK_UI=.55;
let prevButtons=new Array(17).fill(false);
let connected=false;
let padIndex=-1;
let lastId='';
let seenPress=false;

function axis(v){return Math.abs(v)<DEAD?0:v;}
function pressed(pad,i){const b=pad.buttons?.[i];return !!(b&&(b.pressed||b.value>.5));}
function value(pad,i){const b=pad.buttons?.[i];return b?clamp01(Number(b.value)||(b.pressed?1:0)):0;}
function clamp01(n){return Math.max(0,Math.min(1,n));}

function looksXbox(id=''){return /xbox|xinput|x-box|045e|microsoft/i.test(id);}

/** Chrome only fills getGamepads() after the pad reports a press. Scan every frame. */
function pickPad(){
 if(typeof navigator==='undefined'||!navigator.getGamepads)return null;
 let pads;
 try{pads=navigator.getGamepads();}catch{return null;}
 if(!pads)return null;
 if(padIndex>=0){
  const keep=pads[padIndex];
  if(keep&&keep.connected)return keep;
  padIndex=-1;
 }
 // Prefer standard-mapping Xbox pads; fall back to any connected pad.
 let fallback=null;
 for(let i=0;i<pads.length;i++){
  const p=pads[i];
  if(!p||!p.connected)continue;
  if(p.mapping==='standard'||looksXbox(p.id)){padIndex=i;return p;}
  if(!fallback)fallback=p;
 }
 if(fallback){padIndex=fallback.index??[...pads].indexOf(fallback);return fallback;}
 return null;
}

export function gamepadConnected(){return connected&&padIndex>=0;}

export function bindGamepadListeners({onConnect,onDisconnect}={}){
 if(typeof window==='undefined')return ()=>{};
 const up=e=>{
  connected=true;
  if(e.gamepad)padIndex=e.gamepad.index;
  lastId=e.gamepad?.id||lastId;
  onConnect?.(e.gamepad);
 };
 const down=e=>{
  if(e.gamepad&&e.gamepad.index===padIndex){padIndex=-1;prevButtons=new Array(17).fill(false);seenPress=false;}
  let any=false;
  try{any=[...(navigator.getGamepads?.()||[])].some(p=>p&&p.connected);}catch{}
  connected=any;
  if(!any)onDisconnect?.(e.gamepad);
 };
 // Wiggle getGamepads after a page gesture — helps some Chromium builds notice an already-on pad.
 const poke=()=>{try{navigator.getGamepads?.();}catch{}};
 window.addEventListener('gamepadconnected',up);
 window.addEventListener('gamepaddisconnected',down);
 window.addEventListener('pointerdown',poke,{passive:true});
 window.addEventListener('keydown',poke,{passive:true});
 try{
  const existing=[...(navigator.getGamepads?.()||[])].filter(p=>p&&p.connected);
  if(existing.length){connected=true;padIndex=existing[0].index;lastId=existing[0].id||'';}
 }catch{}
 return ()=>{
  window.removeEventListener('gamepadconnected',up);
  window.removeEventListener('gamepaddisconnected',down);
  window.removeEventListener('pointerdown',poke);
  window.removeEventListener('keydown',poke);
 };
}

/**
 * Poll once per frame.
 * Returns flight overlay, edge actions, and UI stick nudge for menus.
 * Important: call every frame even before gamepadconnected — Chrome wakes the pad on first button.
 */
export function pollGamepad(){
 const pad=pickPad();
 if(!pad){
  connected=false;
  prevButtons=new Array(17).fill(false);
  return {active:false,aim:null,thrust:0,turn:0,fire:false,boost:false,brake:false,edges:[],uiX:0,uiY:0,id:'',fresh:false};
 }
 connected=true;
 lastId=pad.id||lastId;
 const lx=axis(pad.axes[0]||0),ly=axis(pad.axes[1]||0);
 const rx=axis(pad.axes[2]||0),ry=axis(pad.axes[3]||0);
 const mag=Math.min(1,Math.hypot(lx,ly));
 const aim=mag>.08?Math.atan2(ly,lx):null;
 const thrust=mag;
 const turn=lx;
 const fire=pressed(pad,XB.A)||pressed(pad,XB.RT)||value(pad,XB.RT)>.35;
 const boost=pressed(pad,XB.RB)||pressed(pad,XB.LT)||value(pad,XB.LT)>.35;
 const brake=pressed(pad,XB.B);
 const edges=[];
 let anyDown=false;
 for(let i=0;i<16;i++){
  const now=pressed(pad,i)||(i===XB.RT&&value(pad,i)>.6)||(i===XB.LT&&value(pad,i)>.6);
  if(now)anyDown=true;
  if(now&&!prevButtons[i])edges.push(i);
  prevButtons[i]=now;
 }
 const fresh=!seenPress&&(anyDown||mag>.25||Math.hypot(rx,ry)>.25);
 if(fresh)seenPress=true;
 const named=[];
 for(const i of edges){
  if(i===XB.X)named.push('interact');
  else if(i===XB.Y)named.push('scan');
  else if(i===XB.LB)named.push('discover');
  else if(i===XB.VIEW)named.push('map');
  else if(i===XB.MENU)named.push('menu');
  else if(i===XB.UP)named.push('focus-up');
  else if(i===XB.DOWN)named.push('focus-down');
  else if(i===XB.LEFT)named.push('focus-prev');
  else if(i===XB.RIGHT)named.push('focus-next');
  else if(i===XB.A)named.push('confirm');
  else if(i===XB.B)named.push('cancel');
  else if(i===XB.RB)named.push('missions');
  else if(i===XB.RS)named.push('ship');
 }
 // Hold-to-repeat friendly UI axes (left stick + dpad already edges).
 const uiX=Math.abs(lx)>=STICK_UI?Math.sign(lx):(pressed(pad,XB.RIGHT)?1:pressed(pad,XB.LEFT)?-1:0);
 const uiY=Math.abs(ly)>=STICK_UI?Math.sign(ly):(pressed(pad,XB.DOWN)?1:pressed(pad,XB.UP)?-1:0);
 return {
  active:true,id:pad.id||lastId,aim,thrust,turn,fire,boost,brake,
  lx,ly,rx,ry,mag,edges:named,rawEdges:edges,uiX,uiY,fresh,xbox:looksXbox(pad.id)
 };
}

export function xbIcon(code){
 const map={
  A:['a','A'],B:['b','B'],X:['x','X'],Y:['y','Y'],
  LB:['bump','LB'],RB:['bump','RB'],LT:['trig','LT'],RT:['trig','RT'],
  MENU:['sys','Menu'],VIEW:['sys','View'],
  LS:['stick','L'],RS:['stick','R'],
  UP:['dpad','↑'],DOWN:['dpad','↓'],LEFT:['dpad','←'],RIGHT:['dpad','→']
 };
 const [kind,label]=map[code]||['sys',code];
 return `<span class="xb xb-${kind}" title="Xbox ${label}"><i>${label}</i></span>`;
}

export function xboxHelpRow(){
 return `<div class="help-pad"><h3>Xbox controller</h3>
<p class="detail-text">On PC (Chrome/Edge): plug in or pair the pad, then press any button once so the browser wakes it.</p>
<p>${xbIcon('LS')} aim &amp; thrust · ${xbIcon('A')} / ${xbIcon('RT')} fire · ${xbIcon('RB')} / ${xbIcon('LT')} boost · ${xbIcon('B')} brake</p>
<p>${xbIcon('X')} dock / interact · ${xbIcon('Y')} scan · ${xbIcon('LB')} discovery pulse · ${xbIcon('VIEW')} galaxy · ${xbIcon('MENU')} flight menu</p>
<p>${xbIcon('RB')} contracts · click ${xbIcon('RS')} ship · ${xbIcon('UP')}${xbIcon('DOWN')}${xbIcon('LEFT')}${xbIcon('RIGHT')} / ${xbIcon('LS')} move menu focus · right ${xbIcon('RS')} scroll menus · ${xbIcon('A')} confirm · ${xbIcon('B')} back</p>
<p>${xbIcon('UP')} autopilot (in flight) · ${xbIcon('DOWN')} land / launch (in flight)</p></div>`;
}

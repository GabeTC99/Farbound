/** Xbox-focused Standard Gamepad helpers for Farbound flight + menus. */

export const XB={
 A:0,B:1,X:2,Y:3,
 LB:4,RB:5,LT:6,RT:7,
 VIEW:8,MENU:9,
 LS:10,RS:11,
 UP:12,DOWN:13,LEFT:14,RIGHT:15
};

const DEAD=.22;
let prevButtons=new Array(17).fill(false);
let connected=false;
let padIndex=-1;
let edgeQueue=[];

function axis(v){return Math.abs(v)<DEAD?0:v;}
function pressed(pad,i){const b=pad.buttons?.[i];return !!(b&&(b.pressed||b.value>.5));}
function value(pad,i){const b=pad.buttons?.[i];return b?clamp01(b.value||(b.pressed?1:0)):0;}
function clamp01(n){return Math.max(0,Math.min(1,n));}

function pickPad(){
 if(typeof navigator==='undefined'||!navigator.getGamepads)return null;
 const pads=navigator.getGamepads();
 if(padIndex>=0){
  const keep=pads[padIndex];
  if(keep)return keep;
  padIndex=-1;
 }
 for(let i=0;i<pads.length;i++){
  const p=pads[i];
  if(!p||!p.connected)continue;
  // Prefer standard mapping (Xbox / DualSense via Chrome remap).
  if(p.mapping==='standard'||/xbox|xinput|045e/i.test(p.id)){padIndex=i;return p;}
 }
 for(let i=0;i<pads.length;i++)if(pads[i]?.connected){padIndex=i;return pads[i];}
 return null;
}

export function gamepadConnected(){return connected&&padIndex>=0;}

export function bindGamepadListeners({onConnect,onDisconnect}={}){
 if(typeof window==='undefined')return ()=>{};
 const up=e=>{
  connected=true;padIndex=e.gamepad?.index??padIndex;
  onConnect?.(e.gamepad);
 };
 const down=e=>{
  if(e.gamepad?.index===padIndex){padIndex=-1;prevButtons=new Array(17).fill(false);}
  const any=[...(navigator.getGamepads?.()||[])].some(p=>p&&p.connected);
  connected=any;
  if(!any)onDisconnect?.(e.gamepad);
 };
 window.addEventListener('gamepadconnected',up);
 window.addEventListener('gamepaddisconnected',down);
 // Already-connected pads (page refresh while pad is on).
 try{if([...(navigator.getGamepads?.()||[])].some(p=>p&&p.connected))connected=true;}catch{}
 return ()=>{window.removeEventListener('gamepadconnected',up);window.removeEventListener('gamepaddisconnected',down);};
}

/** Poll once per frame. Returns flight overlay + edge-triggered actions. */
export function pollGamepad(){
 const pad=pickPad();
 if(!pad){
  if(connected)connected=false;
  prevButtons=new Array(17).fill(false);
  return {active:false,aim:null,thrust:0,turn:0,fire:false,boost:false,brake:false,edges:[]};
 }
 connected=true;
 const lx=axis(pad.axes[0]||0),ly=axis(pad.axes[1]||0);
 const mag=Math.min(1,Math.hypot(lx,ly));
 const aim=mag>.08?Math.atan2(ly,lx):null;
 const thrust=mag;
 // Stick also feeds turn for keyboard-style assist when magnitude is low-ish.
 const turn=lx;
 const fire=pressed(pad,XB.A)||pressed(pad,XB.RT)||value(pad,XB.RT)>.35;
 const boost=pressed(pad,XB.RB)||pressed(pad,XB.LT)||value(pad,XB.LT)>.35;
 const brake=pressed(pad,XB.B);
 const edges=[];
 for(let i=0;i<16;i++){
  const now=pressed(pad,i)||(i===XB.RT&&value(pad,i)>.6)||(i===XB.LT&&value(pad,i)>.6);
  if(now&&!prevButtons[i])edges.push(i);
  prevButtons[i]=now;
 }
 // Map edges to named actions (Xbox layout).
 const named=[];
 for(const i of edges){
  if(i===XB.X)named.push('interact');
  else if(i===XB.Y)named.push('scan');
  else if(i===XB.LB)named.push('discover');
  else if(i===XB.VIEW)named.push('map');
  else if(i===XB.MENU)named.push('menu');
  else if(i===XB.UP)named.push('autopilot');
  else if(i===XB.DOWN)named.push('land');
  else if(i===XB.LEFT)named.push('focus-prev');
  else if(i===XB.RIGHT)named.push('focus-next');
  else if(i===XB.A)named.push('confirm');
  else if(i===XB.B)named.push('cancel');
 }
 return {active:true,id:pad.id,aim,thrust,turn,fire,boost,brake,lx,ly,mag,edges:named,rawEdges:edges};
}

/** Tiny Xbox face-button / bumper chips for help + HUD. */
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
<p>${xbIcon('LS')} aim &amp; thrust · ${xbIcon('A')} / ${xbIcon('RT')} fire · ${xbIcon('RB')} / ${xbIcon('LT')} boost · ${xbIcon('B')} brake</p>
<p>${xbIcon('X')} dock / interact · ${xbIcon('Y')} scan · ${xbIcon('LB')} discovery pulse · ${xbIcon('VIEW')} galaxy · ${xbIcon('MENU')} flight menu</p>
<p>${xbIcon('UP')} autopilot · ${xbIcon('DOWN')} land / launch · ${xbIcon('LEFT')}${xbIcon('RIGHT')} move menu focus · ${xbIcon('A')} confirm · ${xbIcon('B')} back</p></div>`;
}

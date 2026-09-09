import {nearestZone} from './onfoot.mjs';
import {SURFACE_PALETTES} from './surface-render.mjs';

function drawSpaceBackdrop(ctx,width,height,clock,accent){
 // Calm open space — fewer stars, lighter wash so the deck can read clearly.
 const g=ctx.createRadialGradient(width*.5,height*.42,30,width*.5,height*.5,Math.max(width,height)*.9);
 g.addColorStop(0,'#152838');g.addColorStop(.55,'#0e1a26');g.addColorStop(1,'#0a131c');
 ctx.fillStyle=g;ctx.fillRect(0,0,width,height);
 const neb=ctx.createRadialGradient(width*.72,height*.28,20,width*.7,height*.35,width*.4);
 neb.addColorStop(0,accent+'18');neb.addColorStop(1,'#0000');
 ctx.fillStyle=neb;ctx.fillRect(0,0,width,height);
 ctx.fillStyle='#d8e8f0';
 for(let i=0;i<36;i++){
  const x=((i*97.3)%width+width)%width;
  const y=((i*53.1+Math.sin(i)*2)%height+height)%height;
  ctx.globalAlpha=.18+(i%5)*.06;ctx.fillRect(x,y,1,1);
 }
 ctx.globalAlpha=1;
}

function iHash(str,n){let h=n|0;for(let i=0;i<str.length;i++)h=(h*31+str.charCodeAt(i))|0;return ((h>>>0)%1000)/1000;}

function drawPlanetBackdrop(ctx,width,height,s){
 const pal=SURFACE_PALETTES[s.kindId]||SURFACE_PALETTES.mineral;
 const sky=ctx.createLinearGradient(0,0,0,height);
 sky.addColorStop(0,pal.sky0);sky.addColorStop(.45,pal.sky1);sky.addColorStop(1,pal.sky2);
 ctx.fillStyle=sky;ctx.fillRect(0,0,width,height);
 ctx.fillStyle=pal.dust;
 for(let i=0;i<40;i++){const x=((i*131.7)%width),y=((i*71.3)%(height*.42));ctx.fillRect(x,y,1+(i%4===0?1:0),1);}
 ctx.fillStyle=pal.terrain+'ee';
 ctx.beginPath();ctx.moveTo(0,height*.72);
 for(let x=0;x<=width;x+=24)ctx.lineTo(x,height*.68+Math.sin(x*.02+iHash(s.title||'',x))*18);
 ctx.lineTo(width,height);ctx.lineTo(0,height);ctx.closePath();ctx.fill();
}

function drawLandedSkiff(ctx,x,y,scale,accent){
 ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);
 ctx.fillStyle='#00000055';ctx.beginPath();ctx.ellipse(0,14,34,8,0,0,Math.PI*2);ctx.fill();
 ctx.fillStyle='#1a3038';ctx.strokeStyle=accent||'#87b3ac';ctx.lineWidth=1.6;
 ctx.beginPath();ctx.moveTo(-28,4);ctx.lineTo(-18,-8);ctx.lineTo(2,-12);ctx.lineTo(22,-6);ctx.lineTo(30,4);ctx.lineTo(14,10);ctx.lineTo(-16,10);ctx.closePath();ctx.fill();ctx.stroke();
 ctx.fillStyle='#94d8db';ctx.fillRect(-2,-8,12,4);
 ctx.strokeStyle=accent||'#87b3ac';ctx.beginPath();ctx.moveTo(-14,10);ctx.lineTo(-18,16);ctx.moveTo(12,10);ctx.lineTo(16,16);ctx.stroke();
 ctx.restore();
}

function drawIcon(ctx,x,y,s,kind,color){
 ctx.save();ctx.translate(x,y);ctx.strokeStyle=color;ctx.fillStyle=color;ctx.lineWidth=Math.max(1.4,s*.12);ctx.lineCap='round';ctx.lineJoin='round';
 const u=s*.38;
 if(kind==='market'){
  ctx.strokeRect(-u,-u*.2,u*2,u*1.4);ctx.beginPath();ctx.moveTo(-u,-u*.2);ctx.lineTo(-u*.7,-u*1.1);ctx.lineTo(u*.7,-u*1.1);ctx.lineTo(u,-u*.2);ctx.stroke();
  ctx.beginPath();ctx.moveTo(0,-u*.9);ctx.lineTo(0,u*.9);ctx.stroke();
 }else if(kind==='data'){
  ctx.beginPath();ctx.arc(0,0,u*1.05,0,Math.PI*2);ctx.stroke();
  ctx.beginPath();ctx.ellipse(0,0,u*1.05,u*.4,0,0,Math.PI*2);ctx.stroke();
  ctx.beginPath();ctx.moveTo(0,-u*1.05);ctx.lineTo(0,u*1.05);ctx.stroke();
 }else if(kind==='contracts'){
  ctx.strokeRect(-u*.85,-u*1.1,u*1.7,u*2.2);
  ctx.beginPath();ctx.moveTo(-u*.45,-u*.45);ctx.lineTo(u*.45,-u*.45);ctx.moveTo(-u*.45,0);ctx.lineTo(u*.35,0);ctx.moveTo(-u*.45,u*.45);ctx.lineTo(u*.25,u*.45);ctx.stroke();
 }else if(kind==='modules'){
  ctx.beginPath();ctx.arc(0,0,u*.55,0,Math.PI*2);ctx.stroke();
  for(let i=0;i<6;i++){const a=i*Math.PI/3;ctx.beginPath();ctx.moveTo(Math.cos(a)*u*.55,Math.sin(a)*u*.55);ctx.lineTo(Math.cos(a)*u*1.15,Math.sin(a)*u*1.15);ctx.stroke();}
 }else if(kind==='guilds'){
  ctx.beginPath();ctx.arc(-u*.45,0,u*.55,0,Math.PI*2);ctx.arc(u*.45,0,u*.55,0,Math.PI*2);ctx.stroke();
 }else if(kind==='factions'){
  ctx.beginPath();ctx.moveTo(0,-u*1.1);ctx.lineTo(u*.95,u*.9);ctx.lineTo(-u*.95,u*.9);ctx.closePath();ctx.stroke();
 }else if(kind==='ship'||kind==='launch'){
  ctx.beginPath();ctx.moveTo(u*1.2,0);ctx.lineTo(-u*.9,u*.7);ctx.lineTo(-u*.45,0);ctx.lineTo(-u*.9,-u*.7);ctx.closePath();ctx.stroke();
  if(kind==='launch'){ctx.beginPath();ctx.moveTo(-u*1.05,0);ctx.lineTo(-u*1.55,0);ctx.stroke();}
 }else if(kind==='detention'){
  ctx.strokeRect(-u,-u,u*2,u*2);
  ctx.beginPath();ctx.moveTo(-u*.35,-u*.2);ctx.lineTo(-u*.35,u*.5);ctx.lineTo(u*.35,u*.5);ctx.lineTo(u*.35,-u*.2);ctx.stroke();
  ctx.beginPath();ctx.arc(0,-u*.2,u*.35,Math.PI,0);ctx.stroke();
 }else{
  ctx.beginPath();ctx.arc(0,0,u,0,Math.PI*2);ctx.stroke();
 }
 ctx.restore();
}

function drawCharacter(ctx,x,y,scale,facing,walk,color,suit,clock,player=false){
 // True bird's-eye crew: head + shoulders from above, feet as small pads — no side-view swim pose.
 const stride=Math.sin(walk*Math.PI*2);
 const moving=Math.abs(stride)>.02;
 ctx.save();
 ctx.translate(x,y);
 ctx.rotate(facing-Math.PI/2); // local +Y = travel / facing
 // Ground shadow
 ctx.fillStyle='#00000048';
 ctx.beginPath();ctx.ellipse(0,1.2*scale,8.5*scale,6.2*scale,0,0,Math.PI*2);ctx.fill();
 // Feet peeking at the facing edge (pads, not legs)
 ctx.fillStyle='#141c24';
 const foot=moving?2.4*scale:1.1*scale;
 ctx.beginPath();ctx.ellipse(-3.4*scale,4.2*scale+stride*foot,2.6*scale,3.4*scale,0,0,Math.PI*2);ctx.fill();
 ctx.beginPath();ctx.ellipse(3.4*scale,4.2*scale-stride*foot,2.6*scale,3.4*scale,0,0,Math.PI*2);ctx.fill();
 // Shoulder / torso disc
 ctx.fillStyle=suit;ctx.strokeStyle=color;ctx.lineWidth=Math.max(1.1,1.3*scale);
 ctx.beginPath();ctx.ellipse(0,.6*scale,7.4*scale,6.2*scale,0,0,Math.PI*2);ctx.fill();ctx.stroke();
 // Arm pads at the sides
 ctx.fillStyle=suit;
 ctx.beginPath();ctx.ellipse(-7.6*scale,.4*scale+stride*.35*scale,2.4*scale,3*scale,0,0,Math.PI*2);ctx.fill();
 ctx.beginPath();ctx.ellipse(7.6*scale,.4*scale-stride*.35*scale,2.4*scale,3*scale,0,0,Math.PI*2);ctx.fill();
 // Suit stripe across shoulders
 ctx.fillStyle=color;ctx.globalAlpha=.88;ctx.fillRect(-4.2*scale,-.4*scale,8.4*scale,1.5*scale);ctx.globalAlpha=1;
 // Head — centered on body (looking down onto the crown)
 ctx.fillStyle='#d7b99a';ctx.strokeStyle=color;ctx.lineWidth=Math.max(1,1.15*scale);
 ctx.beginPath();ctx.arc(0,-.2*scale,4.6*scale,0,Math.PI*2);ctx.fill();ctx.stroke();
 if(player){
  // Helmet crown + forward visor wedge
  ctx.fillStyle='#1a3340';
  ctx.beginPath();ctx.arc(0,-.2*scale,4.6*scale,Math.PI*.15,Math.PI*.85,true);ctx.fill();
  ctx.fillStyle='#9ff0e0cc';
  ctx.beginPath();ctx.ellipse(0,1.6*scale,2.6*scale,1.8*scale,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=color;ctx.globalAlpha=.45+.2*Math.sin(clock*4);
  ctx.beginPath();ctx.arc(.9*scale,1.5*scale,.9*scale,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
 }else{
  // Hair on the back half of the crown
  ctx.fillStyle=color;
  ctx.beginPath();ctx.ellipse(0,-2.4*scale,4*scale,2.6*scale,0,Math.PI,0);ctx.fill();
 }
 // Facing tick on the crown (toward +Y)
 ctx.fillStyle=player?'#b8f0e8':color;ctx.globalAlpha=.9;
 ctx.beginPath();ctx.moveTo(0,3.4*scale);ctx.lineTo(-1.6*scale,1.4*scale);ctx.lineTo(1.6*scale,1.4*scale);ctx.closePath();ctx.fill();
 ctx.globalAlpha=1;
 ctx.restore();
}

function drawWheelDeck(ctx,sx,sy,scale,s){
 const h=s.hull;if(!h||h.kind!=='wheel')return false;
 // Palette locked to exterior drawStation()
 const rim='#527d8c',body='#29434f',arm='#18303e',armStroke='#6a94a3',core='#132833',coreLine='#7db9bd',tip='#82d7c2';
 const accent=s.accent||'#7ec8c0';
 const cx=sx(h.cx),cy=sy(h.cy);
 const hubR=h.hubR*scale,rimR=(h.rimR||h.hubR*1.25)*scale,coreR=(h.coreR||h.hubR*.43)*scale;

 // Approach rings (same cue as local-space docking circle)
 ctx.strokeStyle=rim+'55';ctx.lineWidth=1.4;
 ctx.beginPath();ctx.arc(cx,cy,rimR,0,Math.PI*2);ctx.stroke();
 ctx.setLineDash([7*scale,9*scale]);ctx.strokeStyle=accent+'35';ctx.lineWidth=1.2;
 ctx.beginPath();ctx.arc(cx,cy,rimR+18*scale,0,Math.PI*2);ctx.stroke();
 ctx.setLineDash([]);

 // Solid mid body — the filled disk you see from outside
 ctx.fillStyle=body;ctx.strokeStyle=rim;ctx.lineWidth=2;
 ctx.beginPath();ctx.arc(cx,cy,hubR,0,Math.PI*2);ctx.fill();ctx.stroke();

 // Six docking arms
 for(let i=0;i<h.spokes;i++){
  const a=h.baseAngle+i*(Math.PI*2/h.spokes);
  const c=Math.cos(a),sn=Math.sin(a),px=-sn,py=c,half=h.spokeHalf*scale;
  const x0=cx+c*h.spokeStart*scale,y0=cy+sn*h.spokeStart*scale;
  const x1=cx+c*h.spokeEnd*scale,y1=cy+sn*h.spokeEnd*scale;
  ctx.fillStyle=arm;ctx.strokeStyle=armStroke;ctx.lineWidth=1.6;
  ctx.beginPath();
  ctx.moveTo(x0+px*half,y0+py*half);ctx.lineTo(x1+px*half,y1+py*half);ctx.lineTo(x1-px*half,y1-py*half);ctx.lineTo(x0-px*half,y0-py*half);
  ctx.closePath();ctx.fill();ctx.stroke();
  // Tip lamp
  ctx.fillStyle=tip;
  const tx=cx+c*(h.spokeEnd-12)*scale,ty=cy+sn*(h.spokeEnd-12)*scale;
  ctx.fillRect(tx-3*scale,ty-2.5*scale,6*scale,5*scale);
 }

 // Core
 ctx.fillStyle=core;ctx.strokeStyle=coreLine;ctx.lineWidth=1.6;
 ctx.beginPath();ctx.arc(cx,cy,coreR,0,Math.PI*2);ctx.fill();ctx.stroke();
 return true;
}

function drawSigns(ctx,sx,sy,scale,s){
 const accent=s.accent||'#7ec8c0';
 for(const sign of s.signs||[]){
  if(sign.kind!=='chevron'||!Number.isFinite(sign.angle))continue;
  const x=sx(sign.x),y=sy(sign.y);
  ctx.save();ctx.translate(x,y);ctx.rotate(sign.angle);
  ctx.globalAlpha=sign.accent?0.38:0.18;
  ctx.fillStyle=sign.accent?accent:'#8eb4b8';
  ctx.beginPath();ctx.moveTo(9*scale,0);ctx.lineTo(-5*scale,-5.5*scale);ctx.lineTo(-5*scale,5.5*scale);ctx.closePath();ctx.fill();
  ctx.globalAlpha=1;ctx.restore();
 }
}

export function renderOnFoot(ctx,width,height,s,clock){
 // Follow camera, zoomed in so walking feels lively.
 const scale=width<650?1.05:height<520?1.1:1.28;
 const cameraX=s.x-width*.5/scale,cameraY=s.y-height*.48/scale;
 const sx=x=>(x-cameraX)*scale,sy=y=>(y-cameraY)*scale;
 const planet=s.kind==='planet';

 if(planet)drawPlanetBackdrop(ctx,width,height,s);
 else drawSpaceBackdrop(ctx,width,height,clock,s.accent||'#7ec8c0');

 ctx.save();
 const wheeled=drawWheelDeck(ctx,sx,sy,scale,s);
 if(!wheeled){
  const padX=sx(-30),padY=sy(-30),padW=(s.width+60)*scale,padH=(s.height+60)*scale;
  if(planet){
   ctx.fillStyle=(s.floor||'#142c31')+'dd';ctx.strokeStyle=(s.accent||'#87b3ac')+'55';ctx.lineWidth=2;
   ctx.beginPath();ctx.rect(sx(0),sy(0),s.width*scale,s.height*scale);ctx.fill();ctx.stroke();
   ctx.beginPath();ctx.rect(sx(0),sy(0),s.width*scale,s.height*scale);ctx.clip();
   const wash=ctx.createRadialGradient(sx(s.width*.45),sy(s.height*.5),40*scale,sx(s.width*.5),sy(s.height*.55),s.width*.55*scale);
   wash.addColorStop(0,(s.accent||'#87b3ac')+'22');wash.addColorStop(1,'#0000');
   ctx.fillStyle=wash;ctx.fillRect(sx(0),sy(0),s.width*scale,s.height*scale);
  }else{
   ctx.fillStyle='#0a121899';ctx.strokeStyle=(s.accent||'#7ec8c0')+'66';ctx.lineWidth=3;
   ctx.beginPath();ctx.rect(padX,padY,padW,padH);ctx.fill();ctx.stroke();
   ctx.beginPath();ctx.rect(sx(0),sy(0),s.width*scale,s.height*scale);ctx.clip();
   const floor=ctx.createLinearGradient(sx(0),sy(0),sx(s.width),sy(s.height));
   floor.addColorStop(0,s.floor||'#172430');floor.addColorStop(1,'#121c26');
   ctx.fillStyle=floor;ctx.fillRect(sx(0),sy(0),s.width*scale,s.height*scale);
  }
 }

 drawSigns(ctx,sx,sy,scale,s);

 // Zone pads + icons
 for(const z of s.zones){
  const near=Math.hypot(z.x-s.x,z.y-s.y)<(z.r||40)+24;
  const zx=sx(z.x),zy=sy(z.y),zr=(z.r||40)*scale;
  const pulse=near?0.12*Math.sin(clock*4):0;
  const board=!!(z.board||z.launch);
  ctx.fillStyle=board?(near?s.accent+'70':s.accent+'38'):(near?s.accent+'55':'#2a4455bb');
  ctx.beginPath();ctx.arc(zx,zy,zr,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle=near?s.accent:'#8aa8b4aa';ctx.lineWidth=near?2.2:1.1;
  ctx.beginPath();ctx.arc(zx,zy,zr+pulse*10,0,Math.PI*2);ctx.stroke();
  if(board&&planet)drawLandedSkiff(ctx,zx,zy+2*scale,scale*.9,s.accent);
  else{
   ctx.fillStyle='#1a3040f0';ctx.beginPath();ctx.arc(zx,zy-3*scale,14*scale,0,Math.PI*2);ctx.fill();
   ctx.strokeStyle=near?s.accent:'#a8c4cc';ctx.lineWidth=1.3;ctx.stroke();
   drawIcon(ctx,zx,zy-3*scale,24*scale,z.icon||z.service,near?s.accent:'#c5dce2');
  }
  if(near){
   ctx.fillStyle='#eef8f6';ctx.font=`${Math.max(11,12.5*Math.min(1.1,scale))}px system-ui`;ctx.textAlign='center';ctx.textBaseline='alphabetic';
   ctx.fillText(z.label,zx,zy+zr+14);
  }
 }

 // Legacy AABB bulkheads if present
 for(const w of s.walls||[]){
  const x=sx(w.x),y=sy(w.y),ww=w.w*scale,hh=w.h*scale;
  ctx.fillStyle=planet?'#1a1410':'#0d1620';ctx.fillRect(x,y,ww,hh);
  ctx.strokeStyle=(s.accent||'#7ec8c0')+'66';ctx.lineWidth=1.4;ctx.strokeRect(x+.5,y+.5,ww-1,hh-1);
 }

 for(const n of s.npcs){
  drawCharacter(ctx,sx(n.x),sy(n.y),scale*.95,n.facing||0,n.walk||0,n.color||'#8aa3b0','#2a3d48',clock,false);
 }
 drawCharacter(ctx,sx(s.x),sy(s.y),scale*1.05,s.facing,s.walk||0,s.accent||'#7ec8c0','#1d3844',clock,true);

 const zone=nearestZone(s);
 if(zone){
  ctx.strokeStyle=s.accent;ctx.globalAlpha=.6+.25*Math.sin(clock*4);ctx.lineWidth=2.2;ctx.setLineDash([6,5]);
  ctx.beginPath();ctx.arc(sx(zone.x),sy(zone.y),(zone.r||40)*scale+8+Math.sin(clock*3)*3,0,Math.PI*2);ctx.stroke();
  ctx.setLineDash([]);ctx.globalAlpha=1;
 }
 ctx.restore();

 if(zone){
  ctx.fillStyle=s.accent;ctx.font='13px system-ui';ctx.textAlign='center';
  const board=!!(zone.board||zone.launch);
  const label=board?(planet?'INTERACT · BOARD SKIFF':'INTERACT · LAUNCH'):zone.service==='inspect'?'INTERACT · INSPECT':'INTERACT · '+zone.label.toUpperCase();
  ctx.fillText(label,width/2,Math.max(140,height*.24));
 }
}


import {nearestZone} from './onfoot.mjs';

function drawSpaceBackdrop(ctx,width,height,clock,accent){
 const g=ctx.createRadialGradient(width*.55,height*.35,20,width*.5,height*.45,Math.max(width,height)*.85);
 g.addColorStop(0,'#0c1a28');g.addColorStop(.45,'#071018');g.addColorStop(1,'#03060c');
 ctx.fillStyle=g;ctx.fillRect(0,0,width,height);
 // Nebula wash
 const neb=ctx.createRadialGradient(width*.75,height*.25,10,width*.7,height*.35,width*.45);
 neb.addColorStop(0,accent+'33');neb.addColorStop(.5,accent+'12');neb.addColorStop(1,'#0000');
 ctx.fillStyle=neb;ctx.fillRect(0,0,width,height);
 const neb2=ctx.createRadialGradient(width*.2,height*.7,8,width*.25,height*.65,width*.35);
 neb2.addColorStop(0,'#4a6a9030');neb2.addColorStop(1,'#0000');
 ctx.fillStyle=neb2;ctx.fillRect(0,0,width,height);
 // Stars
 ctx.fillStyle='#d8e8f0';
 for(let i=0;i<90;i++){
  const x=((i*97.3+clock*3*(.2+(i%5)*.05))%width+width)%width;
  const y=((i*53.1+Math.sin(clock*.15+i)*.8)%height+height)%height;
  const a=.25+(i%7)*.1;ctx.globalAlpha=a;ctx.fillRect(x,y,(i%11===0?2:1),(i%11===0?2:1));
 }
 ctx.globalAlpha=1;
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
 // Top-down crew: feet stride along facing, light bob — not a side-view swim.
 const stride=Math.sin(walk*Math.PI*2);
 const bob=Math.abs(Math.sin(walk*Math.PI*2))*.22*scale;
 ctx.save();ctx.translate(x,y+bob);ctx.rotate(facing+Math.PI/2);
 // Soft shadow under boots
 ctx.fillStyle='#00000050';ctx.beginPath();ctx.ellipse(0,3.5*scale,7.2*scale,3.4*scale,0,0,Math.PI*2);ctx.fill();
 // Boots / feet along facing (local +Y)
 ctx.fillStyle=player?'#152830':suit;
 ctx.beginPath();ctx.ellipse(-2.6*scale,3.2*scale+stride*2.6*scale,2.1*scale,3.4*scale,0,0,Math.PI*2);ctx.fill();
 ctx.beginPath();ctx.ellipse(2.6*scale,3.2*scale-stride*2.6*scale,2.1*scale,3.4*scale,0,0,Math.PI*2);ctx.fill();
 // Torso — rounded capsule
 ctx.fillStyle=suit;ctx.strokeStyle=color;ctx.lineWidth=Math.max(1.1,1.35*scale);
 ctx.beginPath();ctx.ellipse(0,.6*scale,5.4*scale,6.2*scale,0,0,Math.PI*2);ctx.fill();ctx.stroke();
 // Chest stripe
 ctx.fillStyle=color;ctx.globalAlpha=.9;ctx.fillRect(-2.8*scale,-.2*scale,5.6*scale,1.5*scale);ctx.globalAlpha=1;
 // Shoulders / arms tucked — tiny swing, not flailing
 const arm=stride*.7*scale;
 ctx.strokeStyle=suit;ctx.lineWidth=Math.max(1.5,2.1*scale);ctx.lineCap='round';
 ctx.beginPath();ctx.moveTo(-5.2*scale,.2*scale);ctx.lineTo(-7.2*scale,2.4*scale+arm);ctx.stroke();
 ctx.beginPath();ctx.moveTo(5.2*scale,.2*scale);ctx.lineTo(7.2*scale,2.4*scale-arm);ctx.stroke();
 // Head toward facing
 ctx.fillStyle='#e8d5c4';ctx.strokeStyle=color;ctx.lineWidth=Math.max(1,1.15*scale);
 ctx.beginPath();ctx.arc(0,-5.8*scale,3.8*scale,0,Math.PI*2);ctx.fill();ctx.stroke();
 if(player){
  ctx.fillStyle='#9ff0e0cc';ctx.beginPath();ctx.ellipse(0,-5.6*scale,2.9*scale,2*scale,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=color;ctx.globalAlpha=.5+.2*Math.sin(clock*4);ctx.beginPath();ctx.arc(1.1*scale,-5.6*scale,1*scale,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
 }else{
  ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(0,-7.2*scale,3.1*scale,1.4*scale,0,Math.PI,0);ctx.fill();
 }
 ctx.restore();
}

function drawWheelDeck(ctx,sx,sy,scale,s){
 const h=s.hull;if(!h||h.kind!=='wheel')return false;
 const accent=s.accent||'#7ec8c0';
 const cx=sx(h.cx),cy=sy(h.cy);
 const hubR=h.hubR*scale,ringIn=h.ringInner*scale,ringOut=h.ringOuter*scale;
 // Soft outer silhouette (matches orbital station rim)
 ctx.fillStyle='#0a1218cc';ctx.beginPath();ctx.arc(cx,cy,ringOut+28*scale,0,Math.PI*2);ctx.fill();
 ctx.strokeStyle=accent+'55';ctx.lineWidth=3;ctx.beginPath();ctx.arc(cx,cy,ringOut+18*scale,0,Math.PI*2);ctx.stroke();

 const floor=ctx.createRadialGradient(cx,cy,hubR*.2,cx,cy,ringOut);
 floor.addColorStop(0,'#1e3340');floor.addColorStop(.45,s.floor||'#172430');floor.addColorStop(1,'#121c26');
 ctx.fillStyle=floor;
 // Hub
 ctx.beginPath();ctx.arc(cx,cy,hubR,0,Math.PI*2);ctx.fill();
 // Ring corridor
 ctx.beginPath();ctx.arc(cx,cy,ringOut,0,Math.PI*2);ctx.arc(cx,cy,ringIn,0,Math.PI*2,true);ctx.fill('evenodd');
 // Six arms — same geometry as the orbital station sprite
 for(let i=0;i<h.spokes;i++){
  const a=h.baseAngle+i*(Math.PI*2/h.spokes);
  const c=Math.cos(a),sn=Math.sin(a),px=-sn,py=c,half=h.spokeHalf*scale;
  const x0=cx+c*h.spokeStart*scale,y0=cy+sn*h.spokeStart*scale;
  const x1=cx+c*h.spokeEnd*scale,y1=cy+sn*h.spokeEnd*scale;
  ctx.beginPath();
  ctx.moveTo(x0+px*half,y0+py*half);ctx.lineTo(x1+px*half,y1+py*half);ctx.lineTo(x1-px*half,y1-py*half);ctx.lineTo(x0-px*half,y0-py*half);
  ctx.closePath();ctx.fill();
 }
 // Deck plating
 ctx.strokeStyle='#ffffff0d';ctx.lineWidth=1;
 for(let r=hubR;r<ringOut;r+=36*scale){ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.stroke();}
 ctx.strokeStyle=accent+'28';ctx.lineWidth=5;
 ctx.beginPath();ctx.arc(cx,cy,(ringIn+ringOut)/2,0,Math.PI*2);ctx.stroke();

 // Hull edges / bulkheads
 ctx.strokeStyle='#6a94a3';ctx.lineWidth=2.2;
 ctx.beginPath();ctx.arc(cx,cy,hubR,0,Math.PI*2);ctx.stroke();
 ctx.beginPath();ctx.arc(cx,cy,ringIn,0,Math.PI*2);ctx.stroke();
 ctx.beginPath();ctx.arc(cx,cy,ringOut,0,Math.PI*2);ctx.stroke();
 ctx.fillStyle='#132833';ctx.beginPath();ctx.arc(cx,cy,hubR*.42,0,Math.PI*2);ctx.fill();
 ctx.strokeStyle=accent;ctx.lineWidth=1.6;ctx.beginPath();ctx.arc(cx,cy,hubR*.42,0,Math.PI*2);ctx.stroke();
 for(let i=0;i<h.spokes;i++){
  const a=h.baseAngle+i*(Math.PI*2/h.spokes);
  const c=Math.cos(a),sn=Math.sin(a),px=-sn,py=c,half=h.spokeHalf*scale;
  const x0=cx+c*h.spokeStart*scale,y0=cy+sn*h.spokeStart*scale;
  const x1=cx+c*h.spokeEnd*scale,y1=cy+sn*h.spokeEnd*scale;
  ctx.strokeStyle='#6a94a3';ctx.lineWidth=1.6;
  ctx.beginPath();
  ctx.moveTo(x0+px*half,y0+py*half);ctx.lineTo(x1+px*half,y1+py*half);ctx.lineTo(x1-px*half,y1-py*half);ctx.lineTo(x0-px*half,y0-py*half);
  ctx.closePath();ctx.stroke();
  ctx.fillStyle=accent;ctx.globalAlpha=.85;
  ctx.fillRect(cx+c*(h.spokeEnd-10)*scale-3*scale,cy+sn*(h.spokeEnd-10)*scale-3*scale,6*scale,6*scale);
  ctx.globalAlpha=1;
 }
 for(const w of (s.windows||[])){
  const wx=sx(w.x+w.w/2),wy=sy(w.y+w.h/2);
  ctx.fillStyle='#081420';ctx.strokeStyle=accent+'99';ctx.lineWidth=1;
  ctx.beginPath();ctx.arc(wx,wy,6*scale,0,Math.PI*2);ctx.fill();ctx.stroke();
  ctx.fillStyle='#e8f4ff';ctx.globalAlpha=.35;ctx.fillRect(wx-1,wy-1,2,2);ctx.globalAlpha=1;
 }
 return true;
}

export function renderOnFoot(ctx,width,height,s,clock){
 // Follow camera, zoomed in so walking feels lively.
 const scale=width<650?1.05:height<520?1.1:1.28;
 const cameraX=s.x-width*.5/scale,cameraY=s.y-height*.48/scale;
 const sx=x=>(x-cameraX)*scale,sy=y=>(y-cameraY)*scale;

 drawSpaceBackdrop(ctx,width,height,clock,s.accent||'#7ec8c0');

 ctx.save();
 const wheeled=drawWheelDeck(ctx,sx,sy,scale,s);
 if(!wheeled){
  // Fallback rectangular deck
  const padX=sx(-30),padY=sy(-30),padW=(s.width+60)*scale,padH=(s.height+60)*scale;
  ctx.fillStyle='#0a121899';ctx.strokeStyle=(s.accent||'#7ec8c0')+'66';ctx.lineWidth=3;
  ctx.beginPath();ctx.rect(padX,padY,padW,padH);ctx.fill();ctx.stroke();
  ctx.beginPath();ctx.rect(sx(0),sy(0),s.width*scale,s.height*scale);ctx.clip();
  const floor=ctx.createLinearGradient(sx(0),sy(0),sx(s.width),sy(s.height));
  floor.addColorStop(0,s.floor||'#172430');floor.addColorStop(1,'#121c26');
  ctx.fillStyle=floor;ctx.fillRect(sx(0),sy(0),s.width*scale,s.height*scale);
 }

 // Zone pads + icons
 for(const z of s.zones){
  const near=Math.hypot(z.x-s.x,z.y-s.y)<(z.r||40)+24;
  const zx=sx(z.x),zy=sy(z.y),zr=(z.r||40)*scale;
  const pulse=near?.12*Math.sin(clock*4):0;
  ctx.fillStyle=z.launch?(near?s.accent+'66':s.accent+'30'):(near?s.accent+'50':'#1e3140cc');
  ctx.beginPath();ctx.arc(zx,zy,zr,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle=near?s.accent:'#6a8794';ctx.lineWidth=near?2.4:1.3;
  ctx.beginPath();ctx.arc(zx,zy,zr+pulse*10,0,Math.PI*2);ctx.stroke();
  ctx.fillStyle='#0c1822ee';ctx.beginPath();ctx.arc(zx,zy-4*scale,16*scale,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle=near?s.accent:'#8aa8b4';ctx.lineWidth=1.5;ctx.stroke();
  drawIcon(ctx,zx,zy-4*scale,28*scale,z.icon||z.service,near?s.accent:'#b7d0d8');
  ctx.fillStyle=near?'#eef8f6':'#a8c0c8';ctx.font=`${Math.max(11,13*Math.min(1.1,scale))}px system-ui`;ctx.textAlign='center';ctx.textBaseline='alphabetic';
  ctx.fillText(z.label,zx,zy+zr+16);
 }

 // Legacy AABB bulkheads if present
 for(const w of s.walls||[]){
  const x=sx(w.x),y=sy(w.y),ww=w.w*scale,hh=w.h*scale;
  ctx.fillStyle='#0d1620';ctx.fillRect(x,y,ww,hh);
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

 ctx.fillStyle='#c5dbe0';ctx.font='12px system-ui';ctx.textAlign='center';
 ctx.fillText((s.title||'STATION DECK').toUpperCase()+'  ·  WALK THE RING TO A SERVICE PAD',width/2,Math.max(132,height*.24));
 if(zone){
  ctx.fillStyle=s.accent;ctx.font='13px system-ui';
  ctx.fillText(zone.launch?'INTERACT · LAUNCH':'INTERACT · '+zone.label.toUpperCase(),width/2,Math.max(152,height*.24+20));
 }
}


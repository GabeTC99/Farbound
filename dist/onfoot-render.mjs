import {nearestZone,STATION_ISO} from './onfoot.mjs';
import {SURFACE_PALETTES} from './surface-render.mjs';

function rr(ctx,x,y,w,h,r){
 if(typeof ctx.roundRect==='function')ctx.roundRect(x,y,w,h,r);
 else ctx.rect(x,y,w,h);
}

function hexRgb(h){
 h=String(h||'#29434f').replace('#','');
 if(h.length===3)h=h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
 if(h.length<6)h='29434f';
 return [parseInt(h.slice(0,2),16)||0,parseInt(h.slice(2,4),16)||0,parseInt(h.slice(4,6),16)||0];
}
function rgbHex(r,g,b){
 return '#'+[r,g,b].map(v=>Math.max(0,Math.min(255,v+.5|0)).toString(16).padStart(2,'0')).join('');
}
function mix(a,b,t){
 const A=hexRgb(a),B=hexRgb(b);
 return rgbHex(A[0]+(B[0]-A[0])*t,A[1]+(B[1]-A[1])*t,A[2]+(B[2]-A[2])*t);
}
function fade(h,a){
 const [r,g,b]=hexRgb(h);
 return `rgba(${r},${g},${b},${a})`;
}

function drawSpaceBackdrop(ctx,width,height,clock,accent){
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

function drawOverheadCharacter(ctx,x,y,scale,facing,walk,color,suit,clock,player=false){
 const stride=Math.sin(walk*Math.PI*2);
 const moving=Math.abs(stride)>.02;
 ctx.save();
 ctx.translate(x,y);
 ctx.rotate(facing-Math.PI/2);
 ctx.fillStyle='#00000048';
 ctx.beginPath();ctx.ellipse(0,1.2*scale,8.5*scale,6.2*scale,0,0,Math.PI*2);ctx.fill();
 ctx.fillStyle='#141c24';
 const foot=moving?2.4*scale:1.1*scale;
 ctx.beginPath();ctx.ellipse(-3.4*scale,4.2*scale+stride*foot,2.6*scale,3.4*scale,0,0,Math.PI*2);ctx.fill();
 ctx.beginPath();ctx.ellipse(3.4*scale,4.2*scale-stride*foot,2.6*scale,3.4*scale,0,0,Math.PI*2);ctx.fill();
 ctx.fillStyle=suit;ctx.strokeStyle=color;ctx.lineWidth=Math.max(1.1,1.3*scale);
 ctx.beginPath();ctx.ellipse(0,.6*scale,7.4*scale,6.2*scale,0,0,Math.PI*2);ctx.fill();ctx.stroke();
 ctx.fillStyle=suit;
 ctx.beginPath();ctx.ellipse(-7.6*scale,.4*scale+stride*.35*scale,2.4*scale,3*scale,0,0,Math.PI*2);ctx.fill();
 ctx.beginPath();ctx.ellipse(7.6*scale,.4*scale-stride*.35*scale,2.4*scale,3*scale,0,0,Math.PI*2);ctx.fill();
 ctx.fillStyle=color;ctx.globalAlpha=.88;ctx.fillRect(-4.2*scale,-.4*scale,8.4*scale,1.5*scale);ctx.globalAlpha=1;
 ctx.fillStyle='#d7b99a';ctx.strokeStyle=color;ctx.lineWidth=Math.max(1,1.15*scale);
 ctx.beginPath();ctx.arc(0,-.2*scale,4.6*scale,0,Math.PI*2);ctx.fill();ctx.stroke();
 if(player){
  ctx.fillStyle='#1a3340';
  ctx.beginPath();ctx.arc(0,-.2*scale,4.6*scale,Math.PI*.15,Math.PI*.85,true);ctx.fill();
  ctx.fillStyle='#9ff0e0cc';
  ctx.beginPath();ctx.ellipse(0,1.6*scale,2.6*scale,1.8*scale,0,0,Math.PI*2);ctx.fill();
 }else{
  ctx.fillStyle=color;
  ctx.beginPath();ctx.ellipse(0,-2.4*scale,4*scale,2.6*scale,0,Math.PI,0);ctx.fill();
 }
 ctx.fillStyle=player?'#b8f0e8':color;ctx.globalAlpha=.9;
 ctx.beginPath();ctx.moveTo(0,3.4*scale);ctx.lineTo(-1.6*scale,1.4*scale);ctx.lineTo(1.6*scale,1.4*scale);ctx.closePath();ctx.fill();
 ctx.globalAlpha=1;
 ctx.restore();
}

function isoOctant(facing){
 const tau=Math.PI*2;
 const a=((facing%tau)+tau)%tau;
 return Math.round(a/(Math.PI/4))%8;
}

function drawStandingCrew(ctx,x,y,scale,facing,walk,color,suit,opts={}){
 const player=!!opts.player,sit=!!opts.sit,stride=sit?0:Math.sin((walk||0)*Math.PI*2);
 const oct=isoOctant(facing||0);
 const toward=oct<=2||oct===7;
 const flip=oct>=2&&oct<=4;
 ctx.save();ctx.translate(x,y);
 ctx.fillStyle='#00000058';
 ctx.beginPath();ctx.ellipse(1.4*scale,2.6*scale,8.2*scale,3.5*scale,0,0,Math.PI*2);ctx.fill();
 if(flip)ctx.scale(-1,1);
 const bodyY=sit?-3.6*scale:-9.2*scale,headY=sit?-7.2*scale:-13.4*scale;
 const leg=stride*1.7*scale;
 ctx.fillStyle='#141c24';
 if(sit){
  ctx.fillRect(-5.2*scale,1.4*scale,4.4*scale,2.2*scale);
  ctx.fillRect(.8*scale,1.4*scale,4.4*scale,2.2*scale);
 }else{
  ctx.fillRect(-3.6*scale,.4*scale+leg,2.8*scale,5.6*scale);
  ctx.fillRect(.8*scale,.4*scale-leg,2.8*scale,5.6*scale);
 }
 ctx.fillStyle=suit||'#1d3844';ctx.strokeStyle=mix(color||'#7ec8c0','#0b161c',.35);ctx.lineWidth=Math.max(1,1.15*scale);
 ctx.beginPath();rr(ctx,-5.6*scale,bodyY,11.2*scale,sit?8.4*scale:12.4*scale,2.6*scale);ctx.fill();ctx.stroke();
 ctx.fillStyle=color;ctx.globalAlpha=.88;ctx.fillRect(-4.6*scale,bodyY+scale,9.2*scale,2.2*scale);ctx.globalAlpha=1;
 ctx.fillStyle=suit||'#1d3844';
 if(!sit){
  ctx.fillRect(-7.6*scale,-7.2*scale+stride*.55*scale,2.5*scale,7.4*scale);
  ctx.fillRect(5.1*scale,-7.2*scale-stride*.55*scale,2.5*scale,7.4*scale);
 }
 ctx.fillStyle='#d7b99a';ctx.strokeStyle=mix(color||'#7ec8c0','#1a1010',.4);ctx.lineWidth=Math.max(1,1.1*scale);
 ctx.beginPath();ctx.arc(0,headY,4.6*scale,0,Math.PI*2);ctx.fill();ctx.stroke();
 if(player){
  ctx.fillStyle='#1a3340';
  ctx.beginPath();ctx.arc(0,headY-.3*scale,4.6*scale,Math.PI,0);ctx.fill();
  if(toward){
   ctx.fillStyle='#9ff0e0cc';
   ctx.beginPath();ctx.ellipse(0,headY+1.1*scale,2.9*scale,2.2*scale,0,0,Math.PI*2);ctx.fill();
  }
 }else{
  ctx.fillStyle=color;
  ctx.beginPath();ctx.ellipse(0,headY-2.3*scale,4.1*scale,2.5*scale,0,Math.PI,0);ctx.fill();
  if(toward){
   ctx.fillStyle='#3a2418';
   ctx.beginPath();ctx.ellipse(0,headY+.7*scale,2.3*scale,1.15*scale,0,0,Math.PI*2);ctx.fill();
  }
 }
 if(opts.crate){
  ctx.fillStyle='#6b5340';ctx.strokeStyle='#c9a46a';ctx.lineWidth=1;
  ctx.beginPath();rr(ctx,-4.6*scale,-2.4*scale,9.2*scale,6.2*scale,1.2*scale);ctx.fill();ctx.stroke();
 }
 ctx.restore();
}

function drawRobotUnit(ctx,x,y,scale,color,clock){
 ctx.save();ctx.translate(x,y);
 ctx.fillStyle='#00000055';
 ctx.beginPath();ctx.ellipse(1.2*scale,3.2*scale,8.4*scale,3.4*scale,0,0,Math.PI*2);ctx.fill();
 ctx.fillStyle='#0d1a22';ctx.strokeStyle=color||'#7ec8c0';ctx.lineWidth=1.3*scale;
 ctx.beginPath();rr(ctx,-6.4*scale,-11.2*scale,12.8*scale,13.4*scale,2.4*scale);ctx.fill();ctx.stroke();
 ctx.fillStyle='#102834';
 ctx.beginPath();rr(ctx,-4.8*scale,-8.8*scale,9.6*scale,6.4*scale,1.4*scale);ctx.fill();
 const glow=.55+.25*Math.sin((clock||0)*5);
 ctx.fillStyle=color||'#90efdc';ctx.globalAlpha=glow;
 ctx.fillRect(-3.2*scale,-7.4*scale,2.5*scale,2.5*scale);
 ctx.fillRect(.8*scale,-7.4*scale,2.5*scale,2.5*scale);
 ctx.globalAlpha=1;
 ctx.fillRect(-2.2*scale,-3.8*scale,4.4*scale,1.3*scale);
 ctx.strokeStyle=color||'#7ec8c0';ctx.beginPath();ctx.moveTo(0,-11.2*scale);ctx.lineTo(0,-15.2*scale);ctx.stroke();
 ctx.beginPath();ctx.arc(0,-15.6*scale,1.3*scale,0,Math.PI*2);ctx.fill();
 ctx.restore();
}

function drawSpeech(ctx,x,y,scale,text){
 if(!text)return;
 ctx.save();
 ctx.font=`${Math.max(10,11*Math.min(1.15,scale))}px system-ui`;
 ctx.textAlign='center';ctx.textBaseline='bottom';
 const w=Math.min(160,ctx.measureText(text).width+14);
 const h=18;
 const bx=x-w/2,by=y-26*scale-h;
 ctx.fillStyle='#0c1822ee';ctx.strokeStyle='#6db6ad99';ctx.lineWidth=1;
 ctx.beginPath();rr(ctx,bx,by,w,h,6);ctx.fill();ctx.stroke();
 ctx.beginPath();ctx.moveTo(x-5,by+h);ctx.lineTo(x,by+h+6);ctx.lineTo(x+5,by+h);ctx.fill();
 ctx.fillStyle='#e7f6f2';ctx.fillText(text,x,by+h-4);
 ctx.restore();
}

function drawNameplate(ctx,x,y,scale,name){
 if(!name)return;
 ctx.save();
 ctx.font=`${Math.max(9,9.5*Math.min(1.1,scale))}px system-ui`;
 ctx.textAlign='center';ctx.textBaseline='top';
 const w=Math.min(96,ctx.measureText(name).width+10);
 ctx.fillStyle='#0c1822cc';
 ctx.beginPath();rr(ctx,x-w/2,y+7*scale,w,13,4);ctx.fill();
 ctx.fillStyle='#dceeea';ctx.fillText(name,x,y+8.5*scale);
 ctx.restore();
}

const DECK_H=36,CORE_H=28,RAIL_H=14;

export function makeStationProjector(s,width,height){
 const zoom=width<650?1.58:height<520?1.78:2.02;
 const ix=zoom*STATION_ISO.ix,iy=zoom*STATION_ISO.iy,iz=zoom*.9;
 const camX=(s.x-s.y)*ix,camY=(s.x+s.y)*iy;
 const ox=width*.5,oy=height*.52;
 return{
  zoom,ix,iy,iz,
  p(wx,wy,wz=0){
   return{x:(wx-wy)*ix-camX+ox,y:(wx+wy)*iy-wz*iz-camY+oy};
  },
  depth(wx,wy){return wx+wy;},
  radii(r){return{rx:r*ix*Math.SQRT2,ry:r*iy*Math.SQRT2};}
 };
}

function drawIsoDisc(ctx,proj,cx,cy,r,h,colors){
 const top=proj.p(cx,cy,h),bot=proj.p(cx,cy,0),{rx,ry}=proj.radii(r);
 ctx.fillStyle='#00000055';
 ctx.beginPath();ctx.ellipse(bot.x+6,bot.y+10,rx*1.05,ry*1.12,0,0,Math.PI*2);ctx.fill();
 const side=ctx.createLinearGradient(bot.x-rx,bot.y,bot.x+rx,bot.y);
 side.addColorStop(0,colors.left);side.addColorStop(1,colors.right);
 ctx.fillStyle=side;ctx.strokeStyle=colors.edge;ctx.lineWidth=1.4;
 ctx.beginPath();
 ctx.moveTo(top.x-rx,top.y);
 ctx.lineTo(bot.x-rx,bot.y);
 ctx.ellipse(bot.x,bot.y,rx,ry,0,Math.PI,0);
 ctx.lineTo(top.x+rx,top.y);
 ctx.closePath();ctx.fill();ctx.stroke();
 ctx.beginPath();ctx.ellipse(top.x,top.y,rx,ry,0,0,Math.PI*2);
 ctx.fillStyle=colors.top;ctx.fill();ctx.stroke();
}

function drawIsoPrism(ctx,proj,corners,h,colors){
 if(!corners?.length)return;
 const cx=corners.reduce((n,p)=>n+p[0],0)/corners.length;
 const cy=corners.reduce((n,p)=>n+p[1],0)/corners.length;
 const floor=corners.map(([x,y])=>({...proj.p(x,y,0),wx:x,wy:y}));
 const ceil=corners.map(([x,y])=>({...proj.p(x,y,h),wx:x,wy:y}));
 const faces=[];
 for(let i=0;i<corners.length;i++){
  const j=(i+1)%corners.length;
  const mx=(corners[i][0]+corners[j][0])/2,my=(corners[i][1]+corners[j][1])/2;
  const ox=mx-cx,oy=my-cy;
  faces.push({
   visible:ox+oy>0,
   depth:mx+my,
   left:ox-oy<0,
   pts:[floor[i],floor[j],ceil[j],ceil[i]]
  });
 }
 faces.sort((a,b)=>a.depth-b.depth);
 ctx.lineJoin='round';
 for(const f of faces){
  if(!f.visible)continue;
  ctx.beginPath();
  ctx.moveTo(f.pts[0].x,f.pts[0].y);
  for(let k=1;k<4;k++)ctx.lineTo(f.pts[k].x,f.pts[k].y);
  ctx.closePath();
  ctx.fillStyle=f.left?colors.left:colors.right;
  ctx.strokeStyle=colors.edge;ctx.lineWidth=1.15;
  ctx.fill();ctx.stroke();
 }
 ctx.beginPath();
 ctx.moveTo(ceil[0].x,ceil[0].y);
 for(let i=1;i<ceil.length;i++)ctx.lineTo(ceil[i].x,ceil[i].y);
 ctx.closePath();
 ctx.fillStyle=colors.top;ctx.strokeStyle=colors.edge;ctx.lineWidth=1.2;
 ctx.fill();ctx.stroke();
}

function rotatedRect(x,y,hw,hd,yaw){
 const c=Math.cos(yaw||0),s=Math.sin(yaw||0);
 return[[-hw,-hd],[hw,-hd],[hw,hd],[-hw,hd]].map(([px,py])=>[x+px*c-py*s,y+px*s+py*c]);
}

function spokeCorners(hull,i){
 const a=hull.baseAngle+i*(Math.PI*2/hull.spokes);
 const c=Math.cos(a),sn=Math.sin(a),px=-sn,py=c,half=hull.spokeHalf;
 return[
  [hull.cx+c*hull.spokeStart+px*half,hull.cy+sn*hull.spokeStart+py*half],
  [hull.cx+c*hull.spokeEnd+px*half,hull.cy+sn*hull.spokeEnd+py*half],
  [hull.cx+c*hull.spokeEnd-px*half,hull.cy+sn*hull.spokeEnd-py*half],
  [hull.cx+c*hull.spokeStart-px*half,hull.cy+sn*hull.spokeStart-py*half]
 ];
}

function stationColors(s){
 const floor=s.floor||'#29434f',accent=s.accent||'#7ec8c0';
 return{
  floor,accent,
  hubTop:mix(floor,'#4a7380',.18),
  hubLeft:mix(floor,'#0b141a',.42),
  hubRight:mix(floor,'#1b2f38',.18),
  armTop:mix(floor,'#132028',.22),
  armLeft:mix(floor,'#070d12',.5),
  armRight:mix(floor,'#15232c',.12),
  edge:mix(accent,'#527d8c',.45),
  core:mix('#132833',accent,.08)
 };
}

function fillHubTop(ctx,proj,hull,h,colors,s){
 const top=proj.p(hull.cx,hull.cy,h),{rx,ry}=proj.radii(hull.hubR);
 const g=ctx.createRadialGradient(top.x-rx*.22,top.y-ry*.48,rx*.08,top.x,top.y,rx);
 g.addColorStop(0,mix(colors.hubTop,'#8ec8c2',.2));
 g.addColorStop(.42,colors.hubTop);
 g.addColorStop(1,mix(colors.hubTop,'#0c161c',.38));
 ctx.beginPath();ctx.ellipse(top.x,top.y,rx,ry,0,0,Math.PI*2);
 ctx.fillStyle=g;ctx.fill();
 ctx.strokeStyle=colors.edge;ctx.lineWidth=1.6;ctx.stroke();
 ctx.save();ctx.beginPath();ctx.ellipse(top.x,top.y,rx-1,ry-1,0,0,Math.PI*2);ctx.clip();
 ctx.strokeStyle=fade('#7db9bd',.16);ctx.lineWidth=1;
 for(let i=1;i<=4;i++){
  const rad=proj.radii(hull.hubR*(i/5));
  ctx.beginPath();ctx.ellipse(top.x,top.y,rad.rx,rad.ry,0,0,Math.PI*2);ctx.stroke();
 }
 for(let i=0;i<12;i++){
  const a=i*(Math.PI*2/12);
  const p0=proj.p(hull.cx+Math.cos(a)*hull.coreR*.8,hull.cy+Math.sin(a)*hull.coreR*.8,h);
  const p1=proj.p(hull.cx+Math.cos(a)*hull.hubR,hull.cy+Math.sin(a)*hull.hubR,h);
  ctx.beginPath();ctx.moveTo(p0.x,p0.y);ctx.lineTo(p1.x,p1.y);ctx.stroke();
 }
 ctx.restore();
}

function drawIsoDeck(ctx,proj,s,clock){
 const hull=s.hull;if(!hull||hull.kind!=='wheel')return;
 const colors=stationColors(s),h=DECK_H,accent=s.accent||'#7ec8c0';
 const arms=[...Array(hull.spokes)].map((_,i)=>({i,depth:hull.cx+hull.cy+Math.cos(hull.baseAngle+i*(Math.PI*2/hull.spokes))*hull.spokeEnd+Math.sin(hull.baseAngle+i*(Math.PI*2/hull.spokes))*hull.spokeEnd}));
 arms.sort((a,b)=>a.depth-b.depth);
 const far=arms.slice(0,Math.ceil(arms.length/2));
 const near=arms.slice(Math.ceil(arms.length/2));
 const paintArm=item=>{
  const cols={
   top:item.i===0?mix(colors.armTop,'#c9a46a',.08):colors.armTop,
   left:colors.armLeft,right:colors.armRight,edge:colors.edge
  };
  drawIsoPrism(ctx,proj,spokeCorners(hull,item.i),h,cols);
  if(item.i===0){
   const a=hull.baseAngle,c=Math.cos(a),sn=Math.sin(a);
   const mid=hull.spokeStart+(hull.spokeEnd-hull.spokeStart)*.55;
   const p0=proj.p(hull.cx+c*(hull.spokeStart+18),hull.cy+sn*(hull.spokeStart+18),h+.2);
   const p1=proj.p(hull.cx+c*hull.spokeEnd,hull.cy+sn*hull.spokeEnd,h+.2);
   ctx.strokeStyle='#c9a46a66';ctx.lineWidth=Math.max(2,proj.zoom*2.2);ctx.setLineDash([7*proj.zoom,6*proj.zoom]);
   ctx.beginPath();ctx.moveTo(p0.x,p0.y);ctx.lineTo(p1.x,p1.y);ctx.stroke();ctx.setLineDash([]);
  }
 };
 for(const arm of far)paintArm(arm);
 drawIsoDisc(ctx,proj,hull.cx,hull.cy,hull.hubR,h,{
  top:colors.hubTop,left:colors.hubLeft,right:colors.hubRight,edge:colors.edge
 });
 fillHubTop(ctx,proj,hull,h,colors,s);
 for(const arm of near)paintArm(arm);
 const pulse=.5+.5*Math.sin((clock||0)*1.6);
 const faction=s.factionColor||accent;
 drawIsoDisc(ctx,proj,hull.cx,hull.cy,hull.coreR,h+CORE_H,{
  top:mix(colors.core,faction,.12),left:mix('#0b171e',faction,.1),right:mix('#16303a',faction,.08),edge:mix('#7db9bd',faction,.25)
 });
 const coreTop=proj.p(hull.cx,hull.cy,h+CORE_H);
 const cr=proj.radii(hull.coreR);
 ctx.strokeStyle=faction;ctx.globalAlpha=.3+.22*pulse;ctx.lineWidth=2.4;
 ctx.beginPath();ctx.ellipse(coreTop.x,coreTop.y,cr.rx*.62,cr.ry*.62,0,0,Math.PI*2);ctx.stroke();
 ctx.globalAlpha=.16;ctx.fillStyle=faction;
 ctx.beginPath();ctx.ellipse(coreTop.x,coreTop.y,cr.rx*.4,cr.ry*.4,0,0,Math.PI*2);ctx.fill();
 ctx.globalAlpha=1;
 const mouths=hull.spokes;
 for(let i=0;i<24;i++){
  const a=i*(Math.PI*2/24);
  let skip=false;
  for(let k=0;k<mouths;k++){
   let d=Math.abs(a-(hull.baseAngle+k*(Math.PI*2/mouths)));
   d=Math.min(d,Math.PI*2-d);
   if(d<.28){skip=true;break;}
  }
  if(skip)continue;
  const r0=hull.hubR-3,r1=hull.hubR+2;
  const c=Math.cos(a),sn=Math.sin(a),px=-sn,py=c,half=6;
  drawIsoPrism(ctx,proj,[
   [hull.cx+c*r0+px*half,hull.cy+sn*r0+py*half],
   [hull.cx+c*r1+px*half,hull.cy+sn*r1+py*half],
   [hull.cx+c*r1-px*half,hull.cy+sn*r1-py*half],
   [hull.cx+c*r0-px*half,hull.cy+sn*r0-py*half]
  ],h+RAIL_H,{top:mix(colors.hubTop,'#7db9bd',.12),left:colors.hubLeft,right:colors.hubRight,edge:fade(accent,.45)});
 }
}

function drawIsoEllipse(ctx,proj,wx,wy,wz,r,stroke,dash,fill){
 const p=proj.p(wx,wy,wz),{rx,ry}=proj.radii(r);
 if(fill){ctx.fillStyle=fill;ctx.beginPath();ctx.ellipse(p.x,p.y,rx,ry,0,0,Math.PI*2);ctx.fill();}
 if(stroke){
  ctx.strokeStyle=stroke;ctx.lineWidth=dash?1.8:1.2;
  if(dash)ctx.setLineDash(dash);
  ctx.beginPath();ctx.ellipse(p.x,p.y,rx,ry,0,0,Math.PI*2);ctx.stroke();
  ctx.setLineDash([]);
 }
}

function drawKiosk(ctx,proj,prop,s,near,clock){
 const accent=s.accent||'#7ec8c0';
 const yaw=(prop.facing||0)+Math.PI/2;
 const h=DECK_H+22;
 drawIsoPrism(ctx,proj,rotatedRect(prop.x,prop.y,11,8,yaw),h,{
  top:mix('#1e333e',accent,.08),left:'#101c24',right:'#1a2c36',edge:near?accent:'#6a94a3'
 });
 const screen=proj.p(prop.x,prop.y,h-8);
 ctx.fillStyle=accent;ctx.globalAlpha=.2+.08*Math.sin((clock||0)*3);
 ctx.beginPath();ctx.ellipse(screen.x,screen.y,10*proj.zoom,5*proj.zoom,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
 const sign=proj.p(prop.x,prop.y,h+16);
 ctx.fillStyle='#102028f0';ctx.strokeStyle=near?accent:'#a8c4cc';ctx.lineWidth=1.2;
 ctx.beginPath();rr(ctx,sign.x-12*proj.zoom,sign.y-9*proj.zoom,24*proj.zoom,16*proj.zoom,3);ctx.fill();ctx.stroke();
 drawIcon(ctx,sign.x,sign.y-1*proj.zoom,15*proj.zoom,prop.icon||prop.service,near?accent:'#c5dce2');
}

function drawCrate(ctx,proj,prop){
 drawIsoPrism(ctx,proj,rotatedRect(prop.x,prop.y,7,6,prop.facing||0),DECK_H+11,{
  top:'#6b5340',left:'#3a2d22',right:'#5d4634',edge:'#c9a46a'
 });
}

function drawBollard(ctx,proj,prop,accent){
 drawIsoDisc(ctx,proj,prop.x,prop.y,3.2,DECK_H+12,{
  top:mix('#1b2c36',accent,.15),left:'#101820',right:'#1b2c36',edge:accent||'#7ec8c0'
 });
}

function drawBench(ctx,proj,prop,accent){
 drawIsoPrism(ctx,proj,rotatedRect(prop.x,prop.y,12,4.5,prop.facing||0),DECK_H+6,{
  top:'#243440',left:'#141c22',right:'#1d2c34',edge:accent||'#7ec8c0'
 });
}

function drawLightPole(ctx,proj,prop,accent,clock){
 const on=!prop.blink||Math.sin((clock||0)*6)>0;
 drawIsoPrism(ctx,proj,rotatedRect(prop.x,prop.y,1.4,1.4,0),DECK_H+28,{
  top:'#2a3c46',left:'#101820',right:'#1b2c36',edge:accent||'#7ec8c0'
 });
 const cap=proj.p(prop.x,prop.y,DECK_H+30);
 ctx.fillStyle=on?(accent||'#82d7c2'):'#355056';ctx.globalAlpha=on?.92:.35;
 ctx.beginPath();ctx.arc(cap.x,cap.y,3.2*proj.zoom,0,Math.PI*2);ctx.fill();
 if(on)drawIsoEllipse(ctx,proj,prop.x,prop.y,DECK_H+.4,16,null,null,fade(accent||'#82d7c2',.1));
 ctx.globalAlpha=1;
}

function drawAwning(ctx,proj,prop,accent){
 drawIsoPrism(ctx,proj,rotatedRect(prop.x,prop.y,16,10,prop.facing||0),DECK_H+18,{
  top:fade(accent||'#7ec8c0',.35),left:fade('#102028',.55),right:fade(accent||'#7ec8c0',.18),edge:accent||'#7ec8c0'
 });
}

function drawShuttlePad(ctx,proj,prop,accent){
 drawIsoEllipse(ctx,proj,prop.x,prop.y,DECK_H+.4,28,fade('#c9a46a',.55),[6*proj.zoom,5*proj.zoom],fade('#18303e',.35));
 const yaw=prop.facing||Math.PI/2;
 drawIsoPrism(ctx,proj,rotatedRect(prop.x,prop.y,22,9,yaw),DECK_H+10,{
  top:'#1d3844',left:'#101c24',right:'#243844',edge:'#6a94a3'
 });
 const canopy=proj.p(prop.x,prop.y,DECK_H+14);
 ctx.fillStyle='#82d7c2aa';
 ctx.beginPath();ctx.ellipse(canopy.x,canopy.y,8*proj.zoom,3.2*proj.zoom,0,0,Math.PI*2);ctx.fill();
}

function drawPlanter(ctx,proj,prop,accent){
 drawIsoPrism(ctx,proj,rotatedRect(prop.x,prop.y,6,5,0),DECK_H+6,{
  top:'#3a3228',left:'#241c16',right:'#4a4030',edge:'#c9a46a'
 });
 const leaf=proj.p(prop.x,prop.y,DECK_H+14);
 ctx.fillStyle='#2f6b52';
 ctx.beginPath();ctx.ellipse(leaf.x-2*proj.zoom,leaf.y,3.4*proj.zoom,4.4*proj.zoom,0,0,Math.PI*2);ctx.fill();
 ctx.beginPath();ctx.ellipse(leaf.x+2.2*proj.zoom,leaf.y-1.2*proj.zoom,2.8*proj.zoom,4.8*proj.zoom,0,0,Math.PI*2);ctx.fill();
 ctx.fillStyle=fade(accent||'#7ec8c0',.35);
 ctx.beginPath();ctx.ellipse(leaf.x,leaf.y-2.4*proj.zoom,1.7*proj.zoom,2.6*proj.zoom,0,0,Math.PI*2);ctx.fill();
}

function drawHolo(ctx,proj,prop,accent,clock){
 drawIsoPrism(ctx,proj,rotatedRect(prop.x,prop.y,4,4,0),DECK_H+7,{
  top:'#15232c',left:'#0c161c',right:'#1b2c36',edge:accent||'#7ec8c0'
 });
 const p=proj.p(prop.x,prop.y,DECK_H+18);
 ctx.strokeStyle=accent||'#7ec8c0';ctx.globalAlpha=.45+.25*Math.sin((clock||0)*3);ctx.lineWidth=1.4;
 ctx.beginPath();ctx.ellipse(p.x,p.y,6*proj.zoom,8.5*proj.zoom,0,0,Math.PI*2);ctx.stroke();
 ctx.fillStyle=fade(accent||'#7ec8c0',.16);
 ctx.beginPath();ctx.ellipse(p.x,p.y,5*proj.zoom,7.2*proj.zoom,0,0,Math.PI*2);ctx.fill();
 ctx.globalAlpha=1;
}

function drawWindowPort(ctx,proj,prop,clock){
 const yaw=prop.facing||0;
 const ox=Math.cos(yaw)*2,oy=Math.sin(yaw)*2;
 const left=proj.p(prop.x+Math.cos(yaw+1.15)*4+ox,prop.y+Math.sin(yaw+1.15)*4+oy,DECK_H*.28);
 const right=proj.p(prop.x+Math.cos(yaw-1.15)*4+ox,prop.y+Math.sin(yaw-1.15)*4+oy,DECK_H*.28);
 const topL=proj.p(prop.x+Math.cos(yaw+1.15)*4+ox,prop.y+Math.sin(yaw+1.15)*4+oy,DECK_H*.82);
 const topR=proj.p(prop.x+Math.cos(yaw-1.15)*4+ox,prop.y+Math.sin(yaw-1.15)*4+oy,DECK_H*.82);
 ctx.fillStyle='#071018';ctx.strokeStyle='#7db9bd88';ctx.lineWidth=1.1;
 ctx.beginPath();ctx.moveTo(topL.x,topL.y);ctx.lineTo(topR.x,topR.y);ctx.lineTo(right.x,right.y);ctx.lineTo(left.x,left.y);ctx.closePath();ctx.fill();ctx.stroke();
 ctx.fillStyle='#d8e8f0';ctx.globalAlpha=.28+.22*Math.sin((clock||0)*2+prop.x);
 ctx.beginPath();ctx.moveTo((topL.x+topR.x)/2,(topL.y+topR.y)/2);ctx.lineTo((right.x+left.x)/2,(right.y+left.y)/2);ctx.stroke();
 ctx.globalAlpha=1;
}

function drawProp(ctx,proj,prop,s,clock,nearId){
 const accent=s.accent||'#7ec8c0';
 if(prop.kind==='crate')drawCrate(ctx,proj,prop);
 else if(prop.kind==='bollard')drawBollard(ctx,proj,prop,accent);
 else if(prop.kind==='bench')drawBench(ctx,proj,prop,accent);
 else if(prop.kind==='light')drawLightPole(ctx,proj,prop,accent,clock);
 else if(prop.kind==='awning')drawAwning(ctx,proj,prop,accent);
 else if(prop.kind==='kiosk')drawKiosk(ctx,proj,prop,s,nearId&&prop.service===nearId,clock);
 else if(prop.kind==='shuttle')drawShuttlePad(ctx,proj,prop,accent);
 else if(prop.kind==='window')drawWindowPort(ctx,proj,prop,clock);
 else if(prop.kind==='planter')drawPlanter(ctx,proj,prop,accent);
 else if(prop.kind==='holo')drawHolo(ctx,proj,prop,s.factionColor||accent,clock);
}

function drawSigns(ctx,proj,s){
 const accent=s.accent||'#7ec8c0';
 for(const sign of s.signs||[]){
  if(sign.kind!=='chevron'||!Number.isFinite(sign.angle))continue;
  const a=sign.angle,c=Math.cos(a),sn=Math.sin(a);
  const tip=proj.p(sign.x+c*8,sign.y+sn*8,DECK_H+.5);
  const l=proj.p(sign.x-c*5+sn*6,sign.y-sn*5-c*6,DECK_H+.5);
  const r=proj.p(sign.x-c*5-sn*6,sign.y-sn*5+c*6,DECK_H+.5);
  ctx.globalAlpha=sign.accent?0.4:0.2;
  ctx.fillStyle=sign.accent?accent:'#8eb4b8';
  ctx.beginPath();ctx.moveTo(tip.x,tip.y);ctx.lineTo(l.x,l.y);ctx.lineTo(r.x,r.y);ctx.closePath();ctx.fill();
  ctx.globalAlpha=1;
 }
}

function drawWheelDeck(ctx,sx,sy,scale,s,clock){
 const h=s.hull;if(!h||h.kind!=='wheel')return false;
 const rim='#527d8c',body='#29434f',arm='#18303e',armStroke='#6a94a3',core='#132833',coreLine='#7db9bd',tip='#82d7c2';
 const accent=s.accent||'#7ec8c0';
 const cx=sx(h.cx),cy=sy(h.cy);
 const hubR=h.hubR*scale,rimR=(h.rimR||h.hubR*1.25)*scale,coreR=(h.coreR||h.hubR*.43)*scale;
 ctx.strokeStyle=rim+'55';ctx.lineWidth=1.4;
 ctx.beginPath();ctx.arc(cx,cy,rimR,0,Math.PI*2);ctx.stroke();
 ctx.setLineDash([7*scale,9*scale]);ctx.strokeStyle=accent+'35';ctx.lineWidth=1.2;
 ctx.beginPath();ctx.arc(cx,cy,rimR+18*scale,0,Math.PI*2);ctx.stroke();
 ctx.setLineDash([]);
 ctx.fillStyle=body;ctx.strokeStyle=rim;ctx.lineWidth=2;
 ctx.beginPath();ctx.arc(cx,cy,hubR,0,Math.PI*2);ctx.fill();ctx.stroke();
 ctx.save();ctx.beginPath();ctx.arc(cx,cy,hubR-2,0,Math.PI*2);ctx.clip();
 ctx.strokeStyle='#7db9bd14';ctx.lineWidth=1;
 for(let i=0;i<12;i++){
  const a=i*(Math.PI*2/12);
  ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+Math.cos(a)*hubR,cy+Math.sin(a)*hubR);ctx.stroke();
 }
 ctx.strokeStyle='#82d7c218';
 for(let i=1;i<4;i++){ctx.beginPath();ctx.arc(cx,cy,hubR*(i/4),0,Math.PI*2);ctx.stroke();}
 ctx.restore();
 for(let i=0;i<h.spokes;i++){
  const a=h.baseAngle+i*(Math.PI*2/h.spokes);
  const c=Math.cos(a),sn=Math.sin(a),px=-sn,py=c,half=h.spokeHalf*scale;
  const x0=cx+c*h.spokeStart*scale,y0=cy+sn*h.spokeStart*scale;
  const x1=cx+c*h.spokeEnd*scale,y1=cy+sn*h.spokeEnd*scale;
  ctx.fillStyle=arm;ctx.strokeStyle=armStroke;ctx.lineWidth=1.6;
  ctx.beginPath();
  ctx.moveTo(x0+px*half,y0+py*half);ctx.lineTo(x1+px*half,y1+py*half);ctx.lineTo(x1-px*half,y1-py*half);ctx.lineTo(x0-px*half,y0-py*half);
  ctx.closePath();ctx.fill();ctx.stroke();
  ctx.strokeStyle=accent+'22';ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(x1,y1);ctx.stroke();
  ctx.fillStyle=tip;
  const tx=cx+c*(h.spokeEnd-12)*scale,ty=cy+sn*(h.spokeEnd-12)*scale;
  ctx.fillRect(tx-3*scale,ty-2.5*scale,6*scale,5*scale);
  if(i===0){
   ctx.strokeStyle='#c9a46a55';ctx.lineWidth=2.4*scale;ctx.setLineDash([5*scale,4*scale]);
   ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(x1,y1);ctx.stroke();
   ctx.setLineDash([]);
  }
 }
 const pulse=.5+.5*Math.sin((clock||0)*1.6);
 const faction=s.factionColor||accent;
 ctx.fillStyle=core;ctx.strokeStyle=coreLine;ctx.lineWidth=1.6;
 ctx.beginPath();ctx.arc(cx,cy,coreR,0,Math.PI*2);ctx.fill();ctx.stroke();
 ctx.strokeStyle=faction;ctx.globalAlpha=.28+.22*pulse;ctx.lineWidth=2.4;
 ctx.beginPath();ctx.arc(cx,cy,coreR*(.55+.08*pulse),0,Math.PI*2);ctx.stroke();
 ctx.globalAlpha=.14;ctx.fillStyle=faction;
 ctx.beginPath();ctx.arc(cx,cy,coreR*.42,0,Math.PI*2);ctx.fill();
 ctx.globalAlpha=1;
 ctx.fillStyle='#cfeff0';ctx.font=`${Math.max(9,10*scale)}px system-ui`;ctx.textAlign='center';ctx.textBaseline='middle';
 ctx.globalAlpha=.7;ctx.fillText(s.title||'CONCOURSE',cx,cy);ctx.globalAlpha=1;
 return true;
}

function renderStationConcourse(ctx,width,height,s,clock){
 const proj=makeStationProjector(s,width,height);
 const accent=s.accent||'#7ec8c0';
 const zone=nearestZone(s);
 const spriteScale=proj.zoom*1.08;
 drawSpaceBackdrop(ctx,width,height,clock,accent);
 ctx.save();
 drawIsoDeck(ctx,proj,s,clock);
 drawSigns(ctx,proj,s);
 for(const z of s.zones){
  const near=zone&&zone.id===z.id;
  drawIsoEllipse(ctx,proj,z.x,z.y,DECK_H+.6,z.r||40,near?accent:'#8aa8b455',near?[5,4]:[3,6],near?fade(accent,.1):null);
  if(near){
   const p=proj.p(z.x,z.y,DECK_H);
   const {ry}=proj.radii(z.r||40);
   ctx.fillStyle='#eef8f6';ctx.font=`${Math.max(11,12.5*Math.min(1.1,proj.zoom))}px system-ui`;
   ctx.textAlign='center';ctx.textBaseline='alphabetic';
   ctx.fillText(z.label,p.x,p.y+ry+16);
  }
 }
 const sprites=[];
 const overlays=[];
 for(const prop of s.props||[])sprites.push({depth:proj.depth(prop.x,prop.y)+(prop.kind==='window'?-120:prop.kind==='awning'?-8:0),draw:()=>drawProp(ctx,proj,prop,s,clock,zone?.service)});
 for(const n of s.npcs||[]){
  sprites.push({depth:proj.depth(n.x,n.y),draw:()=>{
   const p=proj.p(n.x,n.y,DECK_H);
   if(n.role==='robot')drawRobotUnit(ctx,p.x,p.y,spriteScale*1.02,n.color||accent,clock);
   else drawStandingCrew(ctx,p.x,p.y,spriteScale,n.facing||0,n.walk||0,n.color||'#8aa3b0',n.suit||'#2a3d48',{crate:n.role==='hauler',sit:!!n.sit||n.role==='sitter'});
   if(n.line)overlays.push(()=>drawSpeech(ctx,p.x,p.y,spriteScale,n.line));
   else if(Math.hypot(n.x-s.x,n.y-s.y)<78&&Math.hypot(n.x-s.x,n.y-s.y)>18)overlays.push(()=>drawNameplate(ctx,p.x,p.y,spriteScale,n.name));
  }});
 }
 sprites.push({depth:proj.depth(s.x,s.y),draw:()=>{
  const p=proj.p(s.x,s.y,DECK_H);
  drawStandingCrew(ctx,p.x,p.y,spriteScale*1.14,s.facing,s.walk||0,accent,'#1d3844',{player:true});
 }});
 sprites.sort((a,b)=>a.depth-b.depth);
 for(const spr of sprites)spr.draw();
 for(const fn of overlays)fn();
 if(zone){
  const pulse=8+Math.sin(clock*3)*3;
  ctx.globalAlpha=.55+.2*Math.sin(clock*4);
  drawIsoEllipse(ctx,proj,zone.x,zone.y,DECK_H+.8,(zone.r||40)+pulse/proj.zoom,accent,[6,5],null);
  ctx.globalAlpha=1;
 }
 ctx.restore();
 if(zone){
  ctx.fillStyle=accent;ctx.font='13px system-ui';ctx.textAlign='center';
  const board=!!(zone.board||zone.launch);
  const label=board?'INTERACT · LAUNCH':zone.service==='inspect'?'INTERACT · INSPECT · HOLD':zone.service==='cache'?'INTERACT · SALVAGE CACHE':'INTERACT · '+zone.label.toUpperCase();
  ctx.fillText(label,width/2,Math.max(140,height*.24));
 }
}

export function renderOnFoot(ctx,width,height,s,clock){
 if(s.kind==='station'){renderStationConcourse(ctx,width,height,s,clock);return;}
 const scale=width<650?1.05:height<520?1.1:1.28;
 const cameraX=s.x-width*.5/scale,cameraY=s.y-height*.48/scale;
 const sx=x=>(x-cameraX)*scale,sy=y=>(y-cameraY)*scale;
 const planet=s.kind==='planet';

 if(planet)drawPlanetBackdrop(ctx,width,height,s);
 else drawSpaceBackdrop(ctx,width,height,clock,s.accent||'#7ec8c0');

 ctx.save();
 const wheeled=drawWheelDeck(ctx,sx,sy,scale,s,clock);
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

 for(const sign of s.signs||[]){
  if(sign.kind!=='chevron'||!Number.isFinite(sign.angle))continue;
  const x=sx(sign.x),y=sy(sign.y);
  ctx.save();ctx.translate(x,y);ctx.rotate(sign.angle);
  ctx.globalAlpha=sign.accent?0.38:0.18;
  ctx.fillStyle=sign.accent?(s.accent||'#7ec8c0'):'#8eb4b8';
  ctx.beginPath();ctx.moveTo(9*scale,0);ctx.lineTo(-5*scale,-5.5*scale);ctx.lineTo(-5*scale,5.5*scale);ctx.closePath();ctx.fill();
  ctx.globalAlpha=1;ctx.restore();
 }

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

 for(const w of s.walls||[]){
  const x=sx(w.x),y=sy(w.y),ww=w.w*scale,hh=w.h*scale;
  ctx.fillStyle=planet?'#1a1410':'#0d1620';ctx.fillRect(x,y,ww,hh);
  ctx.strokeStyle=(s.accent||'#7ec8c0')+'66';ctx.lineWidth=1.4;ctx.strokeRect(x+.5,y+.5,ww-1,hh-1);
 }

 for(const n of s.npcs){
  drawOverheadCharacter(ctx,sx(n.x),sy(n.y),scale*.95,n.facing||0,n.walk||0,n.color||'#8aa3b0','#2a3d48',clock,false);
 }
 drawOverheadCharacter(ctx,sx(s.x),sy(s.y),scale*1.05,s.facing,s.walk||0,s.accent||'#7ec8c0','#1d3844',clock,true);

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
  let label=board?(planet?'INTERACT · BOARD SKIFF':'INTERACT · LAUNCH'):zone.service==='inspect'?'INTERACT · INSPECT · HOLD':zone.service==='cache'?'INTERACT · SALVAGE CACHE':'INTERACT · '+zone.label.toUpperCase();
  ctx.fillText(label,width/2,Math.max(140,height*.24));
  if(s.footScan&&s.footScan.id===zone.id){
   const pct=Math.min(1,s.footScan.progress/s.footScan.need);
   ctx.fillStyle='#0a1820cc';ctx.fillRect(width/2-60,Math.max(155,height*.24+12),120,8);
   ctx.fillStyle=s.accent;ctx.fillRect(width/2-60,Math.max(155,height*.24+12),120*pct,8);
  }
 }
}

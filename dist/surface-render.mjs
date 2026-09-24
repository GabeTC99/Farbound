import {terrainAt,terrainSlope,nearestAnomaly,surfaceAltitude} from './surface.mjs';
import {samplePlanetColor} from './planet-render.mjs';
import {
 surfaceStep,surfaceSun,mixHex,fadeHex,shadeHex,
 prefetchFrontierArt,peekFrontierImage,loadFrontierImage,frontierTile,
 surfaceTextureName,landingPlateName,kindPlateName,drawFrontierVista,
 ridgeCameraY,RIDGE_VERTICAL_PARALLAX,
 tileBakeSize,tileScreenRepeat
} from './new-frontier.mjs';

export const SURFACE_PALETTES={
 earthlike:{sky0:'#041820',sky1:'#0d3a48',sky2:'#2a5a58',terrain:'#2a6854',stroke:'#6ec4a0',hills:['#163848','#2e5c50'],dust:'#9ad4c066',skiff:'#1a4a45',skiffLine:'#a8f0d8',floor:'#2a6854',accent:'#6ec4a0',sun:'#d8f4e8',haze:'#6ec4a044'},
 ocean:{sky0:'#041820',sky1:'#0d3a48',sky2:'#1a5a5e',terrain:'#1e5460',stroke:'#6ec4c8',hills:['#163848','#245860'],dust:'#9ad4d866',skiff:'#1a4a55',skiffLine:'#a8f0ea',floor:'#1e5460',accent:'#6ec4c8',sun:'#c8f0f4',haze:'#6ec4c844'},
 arid:{sky0:'#1a1008',sky1:'#3a2814',sky2:'#6a4a28',terrain:'#5a3c22',stroke:'#d4a86a',hills:['#3a2814','#6a4a28'],dust:'#e8c48a55',skiff:'#3a2a18',skiffLine:'#f0d4a0',floor:'#5a3c22',accent:'#d4a86a',sun:'#ffd080',haze:'#e8b07033'},
 ice:{sky0:'#0a1420',sky1:'#1a3048',sky2:'#4a6a80',terrain:'#3a5878',stroke:'#c8e0f0',hills:['#1e3858','#4a6a88'],dust:'#d8ecff66',skiff:'#1a2838',skiffLine:'#d0e8f8',floor:'#3a5878',accent:'#c8e0f0',sun:'#e8f4ff',haze:'#c8e0f044'},
 metal:{sky0:'#0a0c10',sky1:'#1a2030',sky2:'#3a4450',terrain:'#3a4652',stroke:'#a8b0b8',hills:['#242c38','#4a5460'],dust:'#c8d0d866',skiff:'#2a3038',skiffLine:'#d0d8e0',floor:'#3a4652',accent:'#a8b0b8',sun:'#e0e8f0',haze:'#a8b0b833'},
 mineral:{sky0:'#07131f',sky1:'#183141',sky2:'#3a4545',terrain:'#2e5858',stroke:'#87b3ac',hills:['#2a4a54','#3e6468'],dust:'#bbd5e066',skiff:'#25444f',skiffLine:'#b7eee0',floor:'#2e5858',accent:'#87b3ac',sun:'#c8efe4',haze:'#87b3ac33'},
 volcanic:{sky0:'#180808',sky1:'#3a1810',sky2:'#6a2a18',terrain:'#5a2a1c',stroke:'#ff7040',hills:['#3a1810','#6a3018'],dust:'#ff8a4055',skiff:'#3a2018',skiffLine:'#ffb080',floor:'#5a2a1c',accent:'#ff7040',sun:'#ffb070',haze:'#ff704033'},
 barren:{sky0:'#080808',sky1:'#141414',sky2:'#2a2824',terrain:'#3a3630',stroke:'#b0a898',hills:['#242220','#4a4640'],dust:'#c8c0b055',skiff:'#2a2824',skiffLine:'#d0c8bc',floor:'#3a3630',accent:'#b0a898',sun:'#e0d8c8',haze:'#b0a89822'},
 toxic:{sky0:'#101408',sky1:'#2a3010',sky2:'#4a5820',terrain:'#3e4c18',stroke:'#d4e060',hills:['#2a3414','#4e5820'],dust:'#d8e07066',skiff:'#2a3018',skiffLine:'#e8f090',floor:'#3e4c18',accent:'#d4e060',sun:'#e8f090',haze:'#d4e06033'},
 gas:{sky0:'#120818',sky1:'#2a1840',sky2:'#4a3860',terrain:'#3a2c50',stroke:'#b8a0d8',hills:['#2a2040','#4a3860'],dust:'#d0b8f055',skiff:'#2a2038',skiffLine:'#e0d0f8',floor:'#3a2c50',accent:'#b8a0d8',sun:'#e0d0f8',haze:'#b8a0d833'},
 icegiant:{sky0:'#081018',sky1:'#183048',sky2:'#3a5870',terrain:'#2e4c68',stroke:'#88b8d0',hills:['#1e3850','#3a5c78'],dust:'#a8d0e066',skiff:'#1a2838',skiffLine:'#c0e0f0',floor:'#2e4c68',accent:'#88b8d0',sun:'#c8e8f8',haze:'#88b8d033'}
};

function rr(ctx,x,y,w,h,r){
 if(typeof ctx.roundRect==='function')ctx.roundRect(x,y,w,h,r);
 else ctx.rect(x,y,w,h);
}

const tintCache=new Map();
function groundTint(kindId,seed,wx){
 const bucket=((wx/48)|0);
 const key=kindId+'|'+seed+'|'+bucket;
 const hit=tintCache.get(key);
 if(hit)return hit;
 const nx=((wx%2400)+2400)%2400/1200-1;
 const c=samplePlanetColor(kindId,seed,nx*.7,.18);
 const hex=c?'#'+[c[0],c[1],c[2]].map(v=>Math.max(0,Math.min(255,v|0)).toString(16).padStart(2,'0')).join(''):null;
 tintCache.set(key,hex);
 if(tintCache.size>240)tintCache.delete(tintCache.keys().next().value);
 return hex;
}

function fillRidge(ctx,width,height,sy,cameraX,scale,seed,offset,parallax,color,step,lit,sunX,tex,quality,lite){
 const pts=[];
 for(let x=0;x<=width+step;x+=step){
  const wx=cameraX*parallax+(x-width/2)/scale;
  pts.push({x,y:sy(terrainAt(wx,seed+offset)+offset),wx});
 }
 ctx.beginPath();ctx.moveTo(0,height);
 for(const p of pts)ctx.lineTo(p.x,p.y);
 ctx.lineTo(width,height);ctx.closePath();
 if(lit){
  const fromLeft=sunX<0;
  const fill=ctx.createLinearGradient(fromLeft?0:width,0,fromLeft?width:0,0);
  fill.addColorStop(0,mixHex(color,'#fff6e8',.2));
  fill.addColorStop(.42,color);
  fill.addColorStop(1,shadeHex(color,.62));
  ctx.fillStyle=fill;
 }else ctx.fillStyle=color;
 ctx.fill();
 if(tex)paintRidgeTexture(ctx,width,height,pts,tex,cameraX,scale*parallax,quality,lite,lit?.55:.28,color);
 if(!lit)return;
 shadeRidge(ctx,width,height,pts,sunX,seed,offset);
}

function shadeFaces(ctx,pts,seed,offset,sunX){
 let run=null;
 const flush=()=>{
  if(!run||run.pts.length<2){run=null;return;}
  const a=Math.min(.3,run.face*1.7);
  ctx.fillStyle=run.lit?`rgba(255,246,232,${a})`:`rgba(0,6,12,${a})`;
  ctx.beginPath();
  ctx.moveTo(run.pts[0].x,run.pts[0].y);
  for(let i=1;i<run.pts.length;i++)ctx.lineTo(run.pts[i].x,run.pts[i].y);
  for(let i=run.pts.length-1;i>=0;i--)ctx.lineTo(run.pts[i].x,run.pts[i].y+20);
  ctx.closePath();ctx.fill();
  run=null;
 };
 for(const p of pts){
  const face=terrainSlope(p.wx,seed+(offset||0))*sunX;
  const lit=face>.045,shade=face<-.045;
  if(!lit&&!shade){flush();continue;}
  if(!run||run.lit!==lit){flush();run={lit,face:Math.abs(face),pts:[p]};}
  else{run.pts.push(p);run.face=Math.max(run.face,Math.abs(face));}
 }
 flush();
}

function shadeRidge(ctx,width,height,pts,sunX,seed,offset){
 ctx.save();
 ctx.beginPath();ctx.moveTo(0,height);
 for(const p of pts)ctx.lineTo(p.x,p.y);
 ctx.lineTo(width,height);ctx.closePath();ctx.clip();
 const fromLeft=sunX<0;
 const sun=ctx.createLinearGradient(fromLeft?0:width,0,fromLeft?width:0,0);
 sun.addColorStop(0,'rgba(255,246,232,0.28)');
 sun.addColorStop(.38,'rgba(0,0,0,0)');
 sun.addColorStop(1,'rgba(0,8,16,0.36)');
 ctx.fillStyle=sun;ctx.fillRect(0,0,width,height);
 const down=ctx.createLinearGradient(0,0,0,height);
 down.addColorStop(0,'rgba(0,0,0,0)');
 down.addColorStop(.55,'rgba(0,8,16,0.1)');
 down.addColorStop(1,'rgba(0,8,16,0.38)');
 ctx.fillStyle=down;ctx.fillRect(0,0,width,height);
 if(seed!=null)shadeFaces(ctx,pts,seed,offset,sunX);
 ctx.restore();
}

function paintRidgeTexture(ctx,width,height,pts,img,cameraX,scrollScale,quality,lite,alpha,tint){
 if(!img||!ctx.createPattern)return;
 const bake=tileBakeSize(quality,lite);
 const repeat=tileScreenRepeat(quality,lite);
 const tile=frontierTile(img,bake);
 if(!tile)return;
 const pat=ctx.createPattern(tile,'repeat');
 if(!pat)return;
 const k=repeat/bake;
 ctx.save();
 ctx.beginPath();ctx.moveTo(0,height);
 for(const p of pts)ctx.lineTo(p.x,p.y);
 ctx.lineTo(width,height);ctx.closePath();ctx.clip();
 const scroll=((cameraX*scrollScale)%repeat+repeat)%repeat;
 ctx.translate(-scroll,height*.12);
 ctx.scale(k,k);
 ctx.globalAlpha=alpha;
 ctx.globalCompositeOperation='source-over';
 ctx.fillStyle=pat;
 const rx=scroll/k-8,ry=-height/k,rw=(width+repeat)/k+16,rh=height*2.4/k;
 ctx.fillRect(rx,ry,rw,rh);
 if(tint){
  ctx.globalAlpha=lite?.4:.5;
  ctx.globalCompositeOperation='multiply';
  ctx.fillStyle=tint;
  ctx.fillRect(rx,ry,rw,rh);
 }
 ctx.restore();
}

function drawPlateVista(ctx,width,height,pal,kind,cameraX,lite,quality){
 if(lite||quality==='performance')return;
 loadFrontierImage(kindPlateName(kind));
 const name=landingPlateName(kind);
 const img=peekFrontierImage(name)||loadFrontierImage(name);
 if(!img||!img.width)return;
 drawFrontierVista(ctx,width,height,img,name,pal,cameraX,quality);
}

function drawSky(ctx,width,height,pal,kind,sun,lite,clock,cameraX,quality){
 const sky=ctx.createLinearGradient(0,0,0,height);
 sky.addColorStop(0,pal.sky0);
 sky.addColorStop(.42,pal.sky1);
 sky.addColorStop(.78,pal.sky2);
 sky.addColorStop(1,mixHex(pal.sky2,pal.terrain,.28));
 ctx.fillStyle=sky;ctx.fillRect(0,0,width,height);
 drawPlateVista(ctx,width,height,pal,kind,cameraX,lite,quality);
 const sx=width*(.18+sun.x*.12),sy=height*(.16-sun.y*.05);
 const glow=ctx.createRadialGradient(sx,sy,8,sx,sy,width*(lite?.28:.42));
 glow.addColorStop(0,fadeHex(pal.sun||pal.accent,.55));
 glow.addColorStop(.35,fadeHex(pal.sun||pal.accent,.16));
 glow.addColorStop(1,'#0000');
 ctx.fillStyle=glow;ctx.fillRect(0,0,width,height);
 if(!lite){
  ctx.fillStyle=pal.sun||'#f4f0e0';
  ctx.beginPath();ctx.arc(sx,sy,kind==='volcanic'?7:5.5,0,6.28);ctx.fill();
  const bloom=ctx.createRadialGradient(sx,sy,0,sx,sy,22);
  bloom.addColorStop(0,fadeHex(pal.sun||pal.accent,.45));bloom.addColorStop(1,'#0000');
  ctx.fillStyle=bloom;ctx.beginPath();ctx.arc(sx,sy,22,0,6.28);ctx.fill();
 }
 ctx.fillStyle=pal.dust;
 const dust=lite?36:70;
 for(let i=0;i<dust;i++){
  const x=((i*173.91)%width+width)%width,y=(i*63.73)%Math.max(90,height*.42);
  ctx.fillRect(x,y,1+(i%3===0?1:0),1);
 }
 if(kind==='toxic'){
  const fog=ctx.createLinearGradient(0,0,0,height);
  fog.addColorStop(0,'#d4e06018');fog.addColorStop(1,'#8a9a4028');
  ctx.fillStyle=fog;ctx.fillRect(0,0,width,height);
 }else if(kind==='volcanic'){
  const ember=ctx.createRadialGradient(width*.5,height*.92,20,width*.5,height,width*.7);
  ember.addColorStop(0,'#ff4a1828');ember.addColorStop(1,'#0000');
  ctx.fillStyle=ember;ctx.fillRect(0,0,width,height);
 }
 const haze=ctx.createLinearGradient(0,height*.32,0,height*.58);
 haze.addColorStop(0,'#0000');haze.addColorStop(.5,pal.haze||pal.sky2+'33');haze.addColorStop(1,'#0000');
 ctx.fillStyle=haze;ctx.fillRect(0,0,width,height);
}

function drawKindCues(ctx,width,height,s,sx,sy,pal,cameraX,scale){
 if(s.kindId==='volcanic'){
  ctx.strokeStyle='#ff6a2888';ctx.lineWidth=1.6;
  for(let i=0;i<5;i++){const wx=cameraX+(i/4-.1)*width/scale+((s.seed+i*31)%60);const gx=sx(wx),gy=sy(terrainAt(wx,s.seed));ctx.beginPath();ctx.moveTo(gx-18,gy-2);ctx.lineTo(gx+4,gy-16);ctx.lineTo(gx+22,gy);ctx.stroke();}
  const glow=ctx.createLinearGradient(0,height*.55,0,height);glow.addColorStop(0,'#0000');glow.addColorStop(1,'#ff4a1822');ctx.fillStyle=glow;ctx.fillRect(0,0,width,height);
 }else if(s.kindId==='arid'){
  ctx.strokeStyle=pal.stroke+'55';ctx.lineWidth=1.2;
  for(let i=0;i<7;i++){const y=height*.62+i*10;ctx.beginPath();for(let x=0;x<=width;x+=18)ctx.lineTo(x,y+Math.sin(x*.03+i+s.seed)*3);ctx.stroke();}
 }else if(s.kindId==='ice'){
  ctx.fillStyle='#e8f4ff55';
  for(let i=0;i<8;i++){const wx=cameraX+(i/7-.05)*width/scale+((s.seed+i*17)%40);const gx=sx(wx),gy=sy(terrainAt(wx,s.seed));ctx.beginPath();ctx.moveTo(gx,gy);ctx.lineTo(gx-5,gy-14-(i%3)*4);ctx.lineTo(gx+6,gy);ctx.fill();}
 }else if(s.kindId==='ocean'){
  const sheen=ctx.createLinearGradient(0,height*.38,0,height*.52);sheen.addColorStop(0,'#0000');sheen.addColorStop(.5,'#9ad4d828');sheen.addColorStop(1,'#0000');ctx.fillStyle=sheen;ctx.fillRect(0,0,width,height);
 }else if(s.kindId==='toxic'){
  const fog=ctx.createLinearGradient(0,0,0,height);fog.addColorStop(0,'#d4e06014');fog.addColorStop(1,'#8a9a4022');ctx.fillStyle=fog;ctx.fillRect(0,0,width,height);
 }else if(s.kindId==='barren'||s.kindId==='metal'){
  ctx.strokeStyle=pal.stroke+'66';ctx.lineWidth=1.3;
  for(let i=0;i<6;i++){const wx=cameraX+(i/5-.08)*width/scale+((s.seed+i*41)%50);const gx=sx(wx),gy=sy(terrainAt(wx,s.seed));ctx.beginPath();ctx.ellipse(gx,gy-2,10+(i%3)*3,4,0,0,Math.PI*2);ctx.stroke();}
 }
}

function drawNearTerrain(ctx,width,height,s,sx,sy,pal,cameraX,scale,step,lite,sunX,quality){
 const pts=[];
 for(let x=0;x<=width+step;x+=step){
  const wx=cameraX+(x-width/2)/scale;
  pts.push({x,y:sy(terrainAt(wx,s.seed)),wx});
 }
 ctx.beginPath();ctx.moveTo(0,height);
 for(const p of pts)ctx.lineTo(p.x,p.y);
 ctx.lineTo(width,height);ctx.closePath();
 const tint=groundTint(s.kindId,s.seed,s.x)||pal.terrain;
 const ground=mixHex(mixHex(pal.terrain,tint,.45),pal.stroke,.22);
 if(lite)ctx.fillStyle=ground;
 else{
  const fromLeft=sunX<0;
  const fill=ctx.createLinearGradient(fromLeft?0:width,0,fromLeft?width:0,0);
  fill.addColorStop(0,mixHex(ground,pal.sun||'#fff6e8',.24));
  fill.addColorStop(.4,ground);
  fill.addColorStop(1,shadeHex(ground,.55));
  ctx.fillStyle=fill;
 }
 ctx.fill();
 const tex=peekFrontierImage(surfaceTextureName(s.kindId));
 if(tex)paintRidgeTexture(ctx,width,height,pts,tex,cameraX,scale,quality,lite,lite?.7:.95,ground);
 if(!lite)shadeRidge(ctx,width,height,pts,sunX,s.seed,0);
 ctx.strokeStyle=pal.stroke;ctx.lineWidth=lite?2:2.8;ctx.lineJoin='round';
 ctx.beginPath();
 for(let i=0;i<pts.length;i++){if(i===0)ctx.moveTo(pts[i].x,pts[i].y);else ctx.lineTo(pts[i].x,pts[i].y);}
 ctx.stroke();
 if(!lite){
  ctx.strokeStyle=fadeHex(pal.stroke,.16);ctx.lineWidth=1;
  for(let k=1;k<=3;k++){
   ctx.beginPath();
   for(let i=0;i<pts.length;i++){
    const y=pts[i].y+k*11;
    if(i===0)ctx.moveTo(pts[i].x,y);else ctx.lineTo(pts[i].x,y);
   }
   ctx.stroke();
  }
  ctx.strokeStyle=fadeHex(pal.sun||pal.accent,.32);ctx.lineWidth=1.3;
  ctx.beginPath();
  for(let i=0;i<pts.length;i++){
   const face=terrainSlope(pts[i].wx,s.seed)*sunX;
   const y=pts[i].y-(face>0?1.8:0);
   if(i===0)ctx.moveTo(pts[i].x,y);else ctx.lineTo(pts[i].x,y);
  }
  ctx.stroke();
 }
}

function drawSkiff(ctx,s,x,y,pal,clock,nearGround,lite,sunX){
 ctx.save();ctx.translate(x,y);ctx.rotate(Math.max(-.18,Math.min(.18,s.vx/1000)));
 if(s.throttle>.05){
  ctx.fillStyle='#90efd9';ctx.globalAlpha=.55+.2*s.throttle;
  for(const side of [-1,1]){
   const len=18+Math.sin(clock*28+side)*4*s.throttle+13*s.throttle;
   ctx.beginPath();ctx.moveTo(side*15-5,9);ctx.lineTo(side*16,9+len);ctx.lineTo(side*15+5,9);ctx.fill();
  }
  ctx.globalAlpha=1;
 }
 const body=ctx.createLinearGradient(-20,-16,18,12);
 body.addColorStop(0,mixHex(pal.skiff,'#fff6e8',sunX>0?.08:.22));
 body.addColorStop(.45,pal.skiff);
 body.addColorStop(1,shadeHex(pal.skiff,.55));
 ctx.fillStyle=body;ctx.strokeStyle=pal.skiffLine;ctx.lineWidth=1.7;
 ctx.beginPath();ctx.moveTo(-32,5);ctx.lineTo(-22,-8);ctx.lineTo(0,-15);ctx.lineTo(24,-7);ctx.lineTo(35,5);ctx.lineTo(18,11);ctx.lineTo(-19,11);ctx.closePath();ctx.fill();ctx.stroke();
 if(!lite){
  ctx.fillStyle='#0a1014aa';
  ctx.beginPath();ctx.moveTo(-26,5);ctx.lineTo(-16,11);ctx.lineTo(16,11);ctx.lineTo(28,5);ctx.closePath();ctx.fill();
  ctx.strokeStyle=fadeHex(pal.skiffLine,.45);ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(-18,-6);ctx.lineTo(16,-4);ctx.stroke();
 }
 ctx.fillStyle='#0c1820aa';ctx.fillRect(-14,2,28,5);
 const glass=ctx.createLinearGradient(-1,-10,15,-5);
 glass.addColorStop(0,'#c8f4f8');glass.addColorStop(1,'#3a7080');
 ctx.fillStyle=glass;ctx.fillRect(-1,-10,16,5);
 ctx.strokeStyle=pal.skiffLine+'99';ctx.lineWidth=1;ctx.strokeRect(-1,-10,16,5);
 if(nearGround){
  ctx.strokeStyle=pal.skiffLine;ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(-18,11);ctx.lineTo(-24,18);ctx.lineTo(-10,18);ctx.moveTo(16,11);ctx.lineTo(22,18);ctx.lineTo(8,18);ctx.stroke();
 }
 ctx.restore();
}

function drawLandingHud(ctx,width,height,s,pal,alt,sink,traveled){
 const panelW=Math.min(460,width-28),panelH=52;
 const x=(width-panelW)/2,y=Math.max(56,Math.min(height*.12,96));
 ctx.save();
 ctx.fillStyle='#061018d4';
 ctx.strokeStyle=fadeHex(pal.accent,.55);
 ctx.lineWidth=1.4;
 ctx.beginPath();rr(ctx,x,y,panelW,panelH,8);ctx.fill();ctx.stroke();
 ctx.fillStyle=fadeHex(pal.accent,.12);
 ctx.fillRect(x,y,4,panelH);
 const col=panelW/3;
 const rows=[
  ['ALT',s.landed?'0 m':Math.round(alt)+' m',s.landed?pal.accent:alt<70?'#e8c48a':'#d8ecec'],
  ['SINK',s.landed?'HOLD':sink+' m/s',sink>70?'#fa8d8d':sink>40?'#e8c48a':pal.accent],
  ['SIGNALS',traveled+' / 6',traveled>=6?pal.accent:'#d8ecec']
 ];
 ctx.textAlign='center';
 rows.forEach(([k,v,c],i)=>{
  const cx=x+col*(i+.5);
  ctx.font='10px system-ui';ctx.fillStyle='#8aa4ae';ctx.fillText(k,cx,y+16);
  ctx.font='700 15px system-ui';ctx.fillStyle=c;ctx.fillText(v,cx,y+36);
 });
 ctx.restore();
 const statusY=y+panelH+16;
 ctx.textAlign='center';ctx.font='12px system-ui';
 ctx.fillStyle='#b1c9ca';
 ctx.fillText((s.kind?s.kind.toUpperCase()+'  ·  ':'')+(s.readout||'SURFACE SURVEY'),width/2,statusY);
 ctx.fillStyle=s.landed?'#9ff0e0':'#c8dce0';
 ctx.font='600 13px system-ui';
 ctx.fillText(s.landed?'LANDED · DISBARK TO INSPECT':alt<90?'FLARE · HOLD FOR TOUCHDOWN':'APPROACH',width/2,statusY+18);
 if(s.pingCooldown>0&&!s.ping){ctx.fillStyle='#9aabaf';ctx.font='12px system-ui';ctx.fillText('BEACON '+Math.ceil(s.pingCooldown)+'s',width/2,statusY+34);}
}

export function renderSurface(ctx,width,height,s,clock,stats,opts={}){
 const pal=SURFACE_PALETTES[s.kindId]||SURFACE_PALETTES.mineral;
 const lite=!!opts.lite;
 const quality=opts.quality||(lite?'performance':'high');
 const step=surfaceStep(quality,lite);
 const scale=width<650?.62:.86,cameraX=s.x-width*.08/scale,cameraY=s.y-40;
 const sx=x=>(x-cameraX)*scale+width/2,sy=y=>(y-cameraY)*scale+height/2;
 const ridgeCy=ridgeCameraY(cameraY,RIDGE_VERTICAL_PARALLAX);
 const ridgeSy=y=>(y-ridgeCy)*scale+height/2;
 prefetchFrontierArt();
 const sun=surfaceSun(s.seed);
 const sunX=sun.x|| -1;
 const groundTex=peekFrontierImage(surfaceTextureName(s.kindId));
 drawSky(ctx,width,height,pal,s.kindId,sun,lite,clock,cameraX,quality);
 const layers=lite
  ?[[-150,shadeHex(pal.hills[0],.75),.55,false],[-40,pal.hills[1],.78,true]]
  :[[-260,shadeHex(pal.hills[0],.62),.32,false],[-180,pal.hills[0],.48,true],[-105,mixHex(pal.hills[1],pal.sky2,.18),.72,true],[-28,mixHex(pal.hills[1],pal.terrain,.18),.9,true]];
 for(const [offset,color,parallax,lit] of layers){
  fillRidge(ctx,width,height,ridgeSy,cameraX,scale,s.seed,offset,parallax,color,step+(lite?4:0),lit&&!lite,sunX,groundTex,quality,lite);
 }
 const sponge=ctx.createLinearGradient(0,height*.34,0,height*.7);
 sponge.addColorStop(0,'#0000');
 sponge.addColorStop(.4,fadeHex(pal.sky2,.18));
 sponge.addColorStop(1,fadeHex(mixHex(pal.sky2,pal.terrain,.35),.1));
 ctx.fillStyle=sponge;ctx.fillRect(0,0,width,height);
 drawNearTerrain(ctx,width,height,s,sx,sy,pal,cameraX,scale,step,lite,sunX,quality);
 drawKindCues(ctx,width,height,s,sx,sy,pal,cameraX,scale);
 ctx.fillStyle=pal.stroke+'88';
 const rocks=lite?5:9;
 for(let i=0;i<rocks;i++){
  const wx=cameraX+(i/(rocks-1)-0.15)*width/scale+((s.seed*13+i*97)%80);
  const gx=sx(wx),gy=sy(terrainAt(wx,s.seed));
  if(gx<-20||gx>width+20)continue;
  const face=terrainSlope(wx,s.seed)*sunX;
  ctx.fillStyle=face>0?mixHex(pal.stroke,'#fff6e8',.25):pal.stroke+'88';
  ctx.beginPath();ctx.moveTo(gx-6,gy);ctx.lineTo(gx-2,gy-10-(i%3)*3);ctx.lineTo(gx+7,gy);ctx.fill();
 }
 const alt=surfaceAltitude(s),nearGround=alt<55||s.landed;
 if(nearGround){
  const gx=sx(s.x),gy=sy(terrainAt(s.x,s.seed));
  ctx.fillStyle='#00000066';ctx.beginPath();ctx.ellipse(gx,gy+2,28+(s.landed?6:0),6.5,0,0,Math.PI*2);ctx.fill();
  if(s.throttle>.08&&alt<70){
   ctx.fillStyle=pal.dust;ctx.globalAlpha=.35+.25*s.throttle;
   for(let i=0;i<10;i++){
    const ox=(Math.sin(clock*9+i*1.7)+Math.cos(i*2.1+s.x*.01))*28*s.throttle;
    const oy=2+((clock*40+i*17)%18);
    ctx.beginPath();ctx.ellipse(gx+ox,gy-oy,4+i%3,2,0,0,Math.PI*2);ctx.fill();
   }
   ctx.globalAlpha=1;
  }
 }
 if(!lite&&alt<220&&!s.landed){
  const haze=ctx.createLinearGradient(0,height*.55,0,height);
  haze.addColorStop(0,'#0000');haze.addColorStop(1,fadeHex(pal.sky2,.18+(1-alt/220)*.16));
  ctx.fillStyle=haze;ctx.fillRect(0,0,width,height);
 }
 const colors={geology:'#c9b18d',relic:'#b7a6f0',biosignature:'#99e5b1',signal:'#8dcced'};
 const pingActive=s.ping&&s.ping.life>0;
 for(const a of s.anomalies){
  const x=sx(a.x),y=sy(a.y),known=Math.abs(a.x-s.x)<1000||pingActive;if(x<-120||x>width+120)continue;
  const color=a.scanned?'#638b82':colors[a.kind];
  ctx.strokeStyle=color;ctx.fillStyle=color;ctx.lineWidth=2;
  if(a.kind==='geology'){ctx.beginPath();ctx.moveTo(x,y-18);ctx.lineTo(x+14,y+4);ctx.lineTo(x-14,y+4);ctx.closePath();ctx.stroke();if(!a.scanned)ctx.fillStyle=color+'44',ctx.fill();}
  else if(a.kind==='relic'){ctx.strokeRect(x-11,y-18,22,22);ctx.beginPath();ctx.moveTo(x-6,y-8);ctx.lineTo(x+6,y-8);ctx.lineTo(x,y+4);ctx.closePath();ctx.stroke();}
  else if(a.kind==='biosignature'){ctx.beginPath();ctx.arc(x,y-6,12,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.arc(x-5,y-10,3,0,Math.PI*2);ctx.arc(x+5,y-4,2.5,0,Math.PI*2);ctx.fill();}
  else{ctx.beginPath();ctx.moveTo(x,y-20);ctx.lineTo(x+13,y-7);ctx.lineTo(x,y+6);ctx.lineTo(x-13,y-7);ctx.closePath();ctx.stroke();}
  if(!a.scanned){ctx.globalAlpha=.25+.12*Math.sin(clock*3);ctx.beginPath();ctx.arc(x,y-7,26+Math.sin(clock*2)*4,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;}
  if(pingActive&&!a.scanned){ctx.globalAlpha=.4+.3*Math.sin(clock*6);ctx.strokeStyle='#eac591';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y-7,34+Math.sin(clock*5)*6,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;}
  ctx.font='12px system-ui';ctx.textAlign='center';ctx.fillStyle=color;
  ctx.fillText(a.scanned?'RECORDED':known?a.kind.toUpperCase():'SIGNAL',x,y-38);
 }
 if(pingActive){const px=sx(s.ping.x),py=sy(s.ping.y);ctx.strokeStyle='#eac591aa';ctx.setLineDash([6,6]);ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(sx(s.x),sy(s.y));ctx.lineTo(px,py);ctx.stroke();ctx.setLineDash([]);}
 const x=sx(s.x),y=sy(s.y);
 drawSkiff(ctx,s,x,y,pal,clock,nearGround,lite,sunX);
 if(s.hardLand>0){ctx.fillStyle=`rgba(255,120,90,${s.hardLand*0.35})`;ctx.fillRect(0,0,width,height);}
 if(s.scan){const a=s.anomalies.find(a=>a.id===s.scan.id);ctx.strokeStyle='#a5fbe099';ctx.setLineDash([4,5]);ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,y+8);ctx.lineTo(sx(a.x),sy(a.y));ctx.stroke();ctx.setLineDash([]);}
 const next=nearestAnomaly(s);if(next){const nx=sx(next.x);if(nx<30||nx>width-30){const px=nx<30?25:width-25,py=Math.max(230,height*.5);ctx.fillStyle='#eac591';ctx.font='20px system-ui';ctx.textAlign='center';ctx.fillText(nx<30?'‹':'›',px,py);ctx.font='12px system-ui';ctx.fillText(Math.round(Math.abs(next.x-s.x))+' m',Math.max(45,Math.min(width-45,px)),py+23);}}
 const traveled=s.anomalies.filter(a=>a.scanned).length;
 const sink=Math.max(0,Math.round(s.vy));
 drawLandingHud(ctx,width,height,s,pal,alt,sink,traveled);
 void stats;
}

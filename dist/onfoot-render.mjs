import {nearestZone,STATION_ISO} from './onfoot.mjs';
import {SURFACE_PALETTES,drawFrontierSkiff} from './surface-render.mjs';
import {
 surfaceSun,mixHex,fadeHex,shadeHex,
 prefetchFrontierArt,peekFrontierImage,loadFrontierImage,frontierTile,
 surfaceTextureName,landingPlateName,kindPlateName,drawFrontierVista,
 tileBakeSize,tileScreenRepeat
} from './new-frontier.mjs';

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

function drawPlanetBackdrop(ctx,width,height,s,opts={}){
 prefetchFrontierArt();
 const pal=SURFACE_PALETTES[s.kindId]||SURFACE_PALETTES.mineral;
 const kind=s.kindId||'mineral';
 const sun=surfaceSun(s.seed??(s.title||kind).length*97);
 const sky=ctx.createLinearGradient(0,0,0,height);
 sky.addColorStop(0,pal.sky0);sky.addColorStop(.4,pal.sky1);sky.addColorStop(.78,pal.sky2);sky.addColorStop(1,mixHex(pal.sky2,pal.terrain,.3));
 ctx.fillStyle=sky;ctx.fillRect(0,0,width,height);
 loadFrontierImage(kindPlateName(kind));
 const plateName=landingPlateName(kind);
 const plate=peekFrontierImage(plateName)||loadFrontierImage(plateName);
 if(plate&&plate.width)drawFrontierVista(ctx,width,height,plate,plateName,pal,0,'high');
 const sx=width*(.2+sun.x*.1),sy=height*.18;
 const glow=ctx.createRadialGradient(sx,sy,6,sx,sy,width*.4);
 glow.addColorStop(0,fadeHex(pal.sun||pal.accent,.5));glow.addColorStop(.4,fadeHex(pal.sun||pal.accent,.14));glow.addColorStop(1,'#0000');
 ctx.fillStyle=glow;ctx.fillRect(0,0,width,height);
 ctx.fillStyle=pal.sun||pal.accent;ctx.beginPath();ctx.arc(sx,sy,5,0,Math.PI*2);ctx.fill();
 if(kind==='toxic'){const fog=ctx.createLinearGradient(0,height*.2,0,height*.7);fog.addColorStop(0,pal.accent+'00');fog.addColorStop(.5,pal.accent+'22');fog.addColorStop(1,pal.accent+'00');ctx.fillStyle=fog;ctx.fillRect(0,0,width,height);}
 if(kind==='volcanic'){const glowV=ctx.createRadialGradient(width*.5,height*.78,20,width*.5,height*.82,width*.55);glowV.addColorStop(0,'#ff6a2818');glowV.addColorStop(1,'#0000');ctx.fillStyle=glowV;ctx.fillRect(0,0,width,height);}
 ctx.fillStyle=pal.dust;
 for(let i=0;i<40;i++){const x=((i*131.7)%width),y=((i*71.3)%(height*.42));ctx.fillRect(x,y,1+(i%4===0?1:0),1);}
 const amp=kind==='ocean'?8:kind==='ice'?26:kind==='volcanic'?22:kind==='arid'?14:18;
 const freq=kind==='arid'?.012:kind==='barren'?.035:kind==='ice'?.04:.02;
 const site=!!opts.site;
 const bands=site
  ?[[height*.46,shadeHex(pal.terrain,.55),amp*1.05,.7],[height*.51,pal.hills[0],amp*.8,.85]]
  :[[height*.58,shadeHex(pal.terrain,.55),amp*1.35,.7],[height*.66,pal.hills[0],amp*1.1,.85],[height*.72,pal.terrain,amp,1]];
 const ground=peekFrontierImage(surfaceTextureName(kind));
 const bake=tileBakeSize('high',false),repeat=tileScreenRepeat('high',false);
 const tile=ground?frontierTile(ground,bake):null;
 const pat=tile&&ctx.createPattern?ctx.createPattern(tile,'repeat'):null;
 const pk=repeat/bake;
 for(const [base,color,a,par] of bands){
  ctx.fillStyle=color;
  ctx.beginPath();ctx.moveTo(0,height);
  for(let x=0;x<=width;x+=14){
   let y=base+Math.sin(x*freq*par+iHash(s.title||'',x+par))*a;
   if(kind==='barren'&&iHash(s.title||'c',x)>.78)y-=10;
   ctx.lineTo(x,y);
  }
  ctx.lineTo(width,height);ctx.closePath();ctx.fill();
  if(pat&&par>0.9){
   ctx.save();ctx.clip();
   ctx.scale(pk,pk);
   ctx.globalAlpha=.9;ctx.globalCompositeOperation='source-over';
   ctx.fillStyle=pat;ctx.fillRect(0,(base-40)/pk,width/pk,(height-base+40)/pk);
   ctx.globalAlpha=.48;ctx.globalCompositeOperation='multiply';
   ctx.fillStyle=color;ctx.fillRect(0,(base-40)/pk,width/pk,(height-base+40)/pk);
   ctx.restore();
  }
 }
 if(!site&&kind==='ice'){ctx.fillStyle='#e8f4ff33';ctx.beginPath();ctx.moveTo(0,height*.74);for(let x=0;x<=width;x+=20)ctx.lineTo(x,height*.7+Math.sin(x*.05)*8);ctx.lineTo(width,height);ctx.lineTo(0,height);ctx.fill();}
 const haze=ctx.createLinearGradient(0,height*.5,0,height*.72);
 haze.addColorStop(0,'#0000');haze.addColorStop(1,fadeHex(pal.sky2,.2));
 ctx.fillStyle=haze;ctx.fillRect(0,0,width,height);
}

/** Horizontal screen pixels of camera travel. Y stays 0 so the horizon and props are not lifted. */
export function siteWorldScroll(cameraX,_cameraY,scale){
 const s=Number(scale)||1;
 return {x:(Number(cameraX)||0)*s,y:0};
}

function paintSiteGround(ctx,width,height,s,scroll){
 const pal=SURFACE_PALETTES[s.kindId]||SURFACE_PALETTES.mineral;
 const kind=s.kindId||'mineral';
 const y0=height*.5;
 const wash=ctx.createLinearGradient(0,y0,0,height);
 wash.addColorStop(0,mixHex(pal.terrain,pal.sky2,.16));
 wash.addColorStop(.2,pal.terrain);
 wash.addColorStop(1,shadeHex(pal.terrain,.58));
 ctx.fillStyle=wash;ctx.fillRect(0,y0,width,height-y0);
 const img=peekFrontierImage(surfaceTextureName(kind));
 const bake=tileBakeSize('high',false),repeat=Math.max(48,tileScreenRepeat('high',false)*.42);
 const tile=img?frontierTile(img,bake):null;
 const pat=tile&&ctx.createPattern?ctx.createPattern(tile,'repeat'):null;
 if(pat){
  const pk=repeat/bake;
  const scrollX=scroll?.x||0;
  const ox=((scrollX%repeat)+repeat)%repeat;
  ctx.save();
  ctx.beginPath();ctx.rect(0,y0,width,height-y0);ctx.clip();
  ctx.translate(-ox,0);
  ctx.scale(pk,pk);
  ctx.globalAlpha=.82;ctx.globalCompositeOperation='source-over';
  ctx.fillStyle=pat;ctx.fillRect((ox-repeat)/pk,(y0-repeat)/pk,(width+repeat*2)/pk,(height-y0+repeat*2)/pk);
  ctx.globalAlpha=.55;ctx.globalCompositeOperation='multiply';
  ctx.fillStyle=pal.terrain;ctx.fillRect((ox-repeat)/pk,(y0-repeat)/pk,(width+repeat*2)/pk,(height-y0+repeat*2)/pk);
  ctx.restore();
 }
 const blend=ctx.createLinearGradient(0,y0-6,0,y0+72);
 blend.addColorStop(0,fadeHex(pal.sky2,.38));blend.addColorStop(1,'#0000');
 ctx.fillStyle=blend;ctx.fillRect(0,y0-6,width,80);
 if(kind==='ice'){ctx.fillStyle='#e8f4ff22';ctx.fillRect(0,y0,width,height-y0);}
}

function drawSitePad(ctx,x,y,rx,ry,accent,near,marked){
 ctx.fillStyle='#00000030';
 ctx.beginPath();ctx.ellipse(x+2,y+5,rx*1.06,ry*1.15,0,0,Math.PI*2);ctx.fill();
 ctx.fillStyle=near?fadeHex(accent,.18):'rgba(6,10,14,.32)';
 ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();
 ctx.strokeStyle=near?accent:fadeHex(accent,.5);ctx.lineWidth=near?2.2:1.4;
 ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.stroke();
 ctx.globalAlpha=.7;
 ctx.beginPath();ctx.ellipse(x,y,rx*.64,ry*.64,0,0,Math.PI*2);ctx.stroke();
 ctx.globalAlpha=1;
 if(marked){
  ctx.beginPath();ctx.moveTo(x-rx*.52,y);ctx.lineTo(x+rx*.52,y);ctx.moveTo(x,y-ry*.52);ctx.lineTo(x,y+ry*.52);ctx.stroke();
 }
}

function drawSiteRock(ctx,x,y,w,h,pal){
 const cx=x+w/2,cy=y+h*.62;
 ctx.fillStyle='#00000038';
 ctx.beginPath();ctx.ellipse(cx+2,y+h+3,w*.62,h*.18,0,0,Math.PI*2);ctx.fill();
 ctx.fillStyle=shadeHex(pal.terrain||pal.floor,.5);
 ctx.beginPath();ctx.ellipse(cx,cy,w*.52,h*.42,0,0,Math.PI*2);ctx.fill();
 ctx.fillStyle=shadeHex(pal.terrain||pal.floor,.35);
 ctx.beginPath();ctx.ellipse(cx-w*.16,cy+h*.06,w*.28,h*.28,-.3,0,Math.PI*2);ctx.fill();
 ctx.fillStyle=mixHex(pal.terrain||pal.floor,'#fff6e8',.08);
 ctx.beginPath();ctx.ellipse(cx+w*.1,cy-h*.16,w*.22,h*.14,.4,0,Math.PI*2);ctx.fill();
}

function drawSurveyStake(ctx,x,y,scale,accent,near){
 ctx.fillStyle='#00000040';
 ctx.beginPath();ctx.ellipse(x,y+2,6*scale,2.2*scale,0,0,Math.PI*2);ctx.fill();
 ctx.fillStyle=shadeHex(accent,.5);
 ctx.fillRect(x-1.15*scale,y-18*scale,2.3*scale,18*scale);
 ctx.fillStyle=near?accent:'#c8d4d0';
 ctx.beginPath();ctx.arc(x,y-20*scale,3.5*scale,0,Math.PI*2);ctx.fill();
 if(near){
  ctx.strokeStyle=fadeHex(accent,.45);ctx.lineWidth=1.2;
  ctx.beginPath();ctx.arc(x,y-20*scale,6.2*scale,0,Math.PI*2);ctx.stroke();
 }
}

function drawLandedSkiff(ctx,x,y,scale,accent){
 ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);
 ctx.fillStyle='#00000066';ctx.beginPath();ctx.ellipse(0,15,36,8,0,0,Math.PI*2);ctx.fill();
 const body=ctx.createLinearGradient(-20,-14,16,12);
 body.addColorStop(0,mixHex(accent||'#87b3ac','#1a3038',.55));
 body.addColorStop(1,'#121c22');
 ctx.fillStyle=body;ctx.strokeStyle=accent||'#87b3ac';ctx.lineWidth=1.6;
 ctx.beginPath();ctx.moveTo(-28,4);ctx.lineTo(-18,-8);ctx.lineTo(2,-12);ctx.lineTo(22,-6);ctx.lineTo(30,4);ctx.lineTo(14,10);ctx.lineTo(-16,10);ctx.closePath();ctx.fill();ctx.stroke();
 ctx.fillStyle='#0a1016aa';ctx.fillRect(-16,4,30,5);
 const glass=ctx.createLinearGradient(-2,-8,10,-4);
 glass.addColorStop(0,'#c8f4f8');glass.addColorStop(1,'#3a7080');
 ctx.fillStyle=glass;ctx.fillRect(-2,-8,12,4);
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
 }else if(kind==='messenger'){
  ctx.strokeRect(-u*1.05,-u*.7,u*2.1,u*1.4);
  ctx.beginPath();ctx.moveTo(-u*1.05,-u*.7);ctx.lineTo(0,u*.15);ctx.lineTo(u*1.05,-u*.7);ctx.stroke();
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
 const accent=color||'#7ec8c0',cloth=suit||'#1d3844';
 const sunX=Number.isFinite(opts.sunX)?opts.sunX:null;
 const fromLeft=sunX==null?true:sunX<0;
 const shx=sunX==null?3.6*scale:(-sunX*4.4*scale);
 ctx.save();ctx.translate(x,y);
 ctx.fillStyle='rgba(0,0,0,.18)';
 ctx.beginPath();ctx.ellipse(shx,3.6*scale,9.2*scale,3.4*scale,0,0,Math.PI*2);ctx.fill();
 ctx.fillStyle='rgba(0,0,0,.4)';
 ctx.beginPath();ctx.ellipse(shx*.55,2.6*scale,6.6*scale,2.3*scale,0,0,Math.PI*2);ctx.fill();
 if(flip)ctx.scale(-1,1);
 const bodyY=sit?-3.2*scale:-8.6*scale,headY=sit?-6.6*scale:-12.2*scale;
 const leg=stride*1.5*scale;
 ctx.fillStyle='#121920';
 if(sit){
  ctx.beginPath();rr(ctx,-4.8*scale,1.2*scale,4.2*scale,2.2*scale,1);ctx.fill();
  ctx.beginPath();rr(ctx,.6*scale,1.2*scale,4.2*scale,2.2*scale,1);ctx.fill();
 }else{
  ctx.beginPath();rr(ctx,-3.2*scale,.2*scale+leg,2.4*scale,5.2*scale,1);ctx.fill();
  ctx.beginPath();rr(ctx,.7*scale,.2*scale-leg,2.4*scale,5.2*scale,1);ctx.fill();
 }
 const body=ctx.createLinearGradient(fromLeft?-5*scale:5*scale,bodyY,fromLeft?6*scale:-6*scale,bodyY+11*scale);
 body.addColorStop(0,mix(cloth,sunX==null?'#9ad4cc':'#fff6e8',sunX==null?.2:.26));
 body.addColorStop(.45,cloth);
 body.addColorStop(1,mix(cloth,'#05090c',.38));
 ctx.fillStyle=body;
 ctx.beginPath();rr(ctx,-5*scale,bodyY,10*scale,sit?7.6*scale:11.2*scale,2.2*scale);ctx.fill();
 ctx.fillStyle='rgba(0,0,0,.22)';
 ctx.fillRect(2.6*scale,bodyY+1.2*scale,2.2*scale,sit?5.4*scale:8.4*scale);
 ctx.fillStyle=mix(accent,'#102028',.28);ctx.globalAlpha=.7;
 ctx.fillRect(-4.2*scale,bodyY+1.1*scale,8.4*scale,1.5*scale);ctx.globalAlpha=1;
 if(!sit){
  ctx.fillStyle=mix(cloth,'#0a1218',.15);
  ctx.beginPath();rr(ctx,-6.8*scale,-6.6*scale+stride*.45*scale,2.1*scale,6.6*scale,1);ctx.fill();
  ctx.beginPath();rr(ctx,4.7*scale,-6.6*scale-stride*.45*scale,2.1*scale,6.6*scale,1);ctx.fill();
 }
 const hort=opts.look==='hort';
 ctx.fillStyle=hort?'#e0c4a4':'#b7a088';
 ctx.beginPath();ctx.arc(0,headY,4.1*scale,0,Math.PI*2);ctx.fill();
 ctx.fillStyle='rgba(0,0,0,.18)';
 ctx.beginPath();ctx.arc(1.3*scale,headY+.4*scale,3.2*scale,0,Math.PI*2);ctx.fill();
 if(player){
  ctx.fillStyle='#16303c';
  ctx.beginPath();ctx.arc(0,headY-.2*scale,4.2*scale,Math.PI,0);ctx.fill();
  if(toward){
   ctx.fillStyle='rgba(159,240,224,.55)';
   ctx.beginPath();ctx.ellipse(.3*scale,headY+1*scale,2.4*scale,1.7*scale,0,0,Math.PI*2);ctx.fill();
  }
 }else if(hort){
  ctx.fillStyle='#c9b07a';
  ctx.beginPath();ctx.ellipse(0,headY-1.7*scale,4.3*scale,3.1*scale,0,Math.PI,0);ctx.fill();
  ctx.beginPath();ctx.ellipse(-2.6*scale,headY+.2*scale,1.7*scale,3.4*scale,0,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.ellipse(2.8*scale,headY+.8*scale,1.5*scale,3.8*scale,0,0,Math.PI*2);ctx.fill();
  if(toward){
   ctx.fillStyle='#3a2418';
   ctx.beginPath();ctx.ellipse(-1.15*scale,headY-.15*scale,1.05*scale,.32*scale,0,0,Math.PI*2);ctx.fill();
   ctx.beginPath();ctx.ellipse(1.15*scale,headY-.15*scale,1.05*scale,.32*scale,0,0,Math.PI*2);ctx.fill();
   ctx.fillStyle='#6a9aa4';
   ctx.beginPath();ctx.ellipse(-1.1*scale,headY+.45*scale,.42*scale,.48*scale,0,0,Math.PI*2);ctx.fill();
   ctx.beginPath();ctx.ellipse(1.1*scale,headY+.45*scale,.42*scale,.48*scale,0,0,Math.PI*2);ctx.fill();
   ctx.fillStyle='#d4a11a';
   ctx.beginPath();ctx.arc(-.55*scale,headY+.85*scale,.28*scale,0,Math.PI*2);ctx.fill();
  }
 }else{
  ctx.fillStyle=mix(accent,'#1a242c',.25);
  ctx.beginPath();ctx.ellipse(0,headY-2.1*scale,3.7*scale,2.1*scale,0,Math.PI,0);ctx.fill();
  if(toward){
   ctx.fillStyle='#3a2418';
   ctx.beginPath();ctx.ellipse(0,headY+.55*scale,1.9*scale,.9*scale,0,0,Math.PI*2);ctx.fill();
  }
 }
 if(opts.crate){
  ctx.fillStyle='#5a4634';
  ctx.beginPath();rr(ctx,-4.2*scale,-2*scale,8.4*scale,5.4*scale,1);ctx.fill();
  ctx.strokeStyle='#c9a46a88';ctx.stroke();
 }
 ctx.restore();
}

function drawRobotUnit(ctx,x,y,scale,color,clock){
 ctx.save();ctx.translate(x,y);
 ctx.fillStyle='rgba(0,0,0,.18)';
 ctx.beginPath();ctx.ellipse(3.2*scale,3.8*scale,9*scale,3.2*scale,0,0,Math.PI*2);ctx.fill();
 ctx.fillStyle='rgba(0,0,0,.4)';
 ctx.beginPath();ctx.ellipse(1.6*scale,2.8*scale,6.6*scale,2.2*scale,0,0,Math.PI*2);ctx.fill();
 const shell=ctx.createLinearGradient(-6*scale,-11*scale,6*scale,2*scale);
 shell.addColorStop(0,'#1a3340');shell.addColorStop(1,'#0b161c');
 ctx.fillStyle=shell;
 ctx.beginPath();rr(ctx,-5.8*scale,-10.4*scale,11.6*scale,12.2*scale,2.2*scale);ctx.fill();
 ctx.fillStyle='#102834';
 ctx.beginPath();rr(ctx,-4.4*scale,-8.2*scale,8.8*scale,5.6*scale,1.2*scale);ctx.fill();
 const glow=.5+.22*Math.sin((clock||0)*5);
 ctx.fillStyle=color||'#90efdc';ctx.globalAlpha=glow;
 ctx.beginPath();rr(ctx,-2.8*scale,-7*scale,2.1*scale,2.1*scale,.6*scale);ctx.fill();
 ctx.beginPath();rr(ctx,.7*scale,-7*scale,2.1*scale,2.1*scale,.6*scale);ctx.fill();
 ctx.globalAlpha=1;
 ctx.fillRect(-2*scale,-3.4*scale,4*scale,1.1*scale);
 ctx.strokeStyle=mix(color||'#7ec8c0','#0a161c',.2);ctx.lineWidth=1.1*scale;
 ctx.beginPath();ctx.moveTo(0,-10.4*scale);ctx.lineTo(0,-13.8*scale);ctx.stroke();
 ctx.fillStyle=color||'#7ec8c0';
 ctx.beginPath();ctx.arc(0,-14.2*scale,1.2*scale,0,Math.PI*2);ctx.fill();
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

const DECK_H=36,CORE_H=26,RAIL_H=14,TILE=28;

export function makeStationProjector(s,width,height){
 const zoom=width<650?1.58:height<520?1.78:2.02;
 const ix=zoom*STATION_ISO.ix,iy=zoom*STATION_ISO.iy,iz=zoom*1.05;
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

function poly(ctx,pts){
 ctx.beginPath();ctx.moveTo(pts[0].x,pts[0].y);
 for(let i=1;i<pts.length;i++)ctx.lineTo(pts[i].x,pts[i].y);
 ctx.closePath();
}

function topLit(ctx,pts,base){
 let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
 for(const p of pts){if(p.x<minX)minX=p.x;if(p.y<minY)minY=p.y;if(p.x>maxX)maxX=p.x;if(p.y>maxY)maxY=p.y;}
 const g=ctx.createLinearGradient(minX,minY,maxX+.01,maxY+.01);
 g.addColorStop(0,mix(base,'#e8fff8',.4));
 g.addColorStop(.34,mix(base,'#c5e8e0',.12));
 g.addColorStop(.68,base);
 g.addColorStop(1,mix(base,'#04080c',.44));
 return g;
}

function sideLit(ctx,pts,isLeft,base){
 const g=ctx.createLinearGradient(pts[3].x,pts[3].y,pts[0].x,pts[0].y);
 g.addColorStop(0,mix(base,'#d8f4ee',isLeft?.08:.3));
 g.addColorStop(.38,base);
 g.addColorStop(1,mix(base,'#020508',isLeft?.52:.24));
 return g;
}

function drawContactShadow(ctx,proj,wx,wy,rx,ry){
 const p=proj.p(wx,wy,DECK_H);
 ctx.fillStyle='rgba(0,0,0,.16)';
 ctx.beginPath();ctx.ellipse(p.x+5,p.y+6.4,rx*1.28,ry*1.38,0,0,Math.PI*2);ctx.fill();
 ctx.fillStyle='rgba(0,0,0,.36)';
 ctx.beginPath();ctx.ellipse(p.x+2.4,p.y+3.5,rx*.82,ry*.76,0,0,Math.PI*2);ctx.fill();
}

function drawIsoDisc(ctx,proj,cx,cy,r,h,colors,z0=0){
 const top=proj.p(cx,cy,h),bot=proj.p(cx,cy,z0),{rx,ry}=proj.radii(r);
 ctx.fillStyle='rgba(0,0,0,.22)';
 ctx.beginPath();ctx.ellipse(bot.x+12,bot.y+18,rx*1.14,ry*1.28,0,0,Math.PI*2);ctx.fill();
 ctx.fillStyle='rgba(0,0,0,.38)';
 ctx.beginPath();ctx.ellipse(bot.x+6,bot.y+11,rx*1.04,ry*1.1,0,0,Math.PI*2);ctx.fill();
 const side=ctx.createLinearGradient(bot.x-rx,bot.y,bot.x+rx,bot.y);
 side.addColorStop(0,mix(colors.left,'#020508',.18));side.addColorStop(.42,colors.left);side.addColorStop(.7,mix(colors.right,'#b7e4dc',.16));side.addColorStop(1,colors.right);
 ctx.fillStyle=side;ctx.strokeStyle=mix(colors.edge,'#0a1218',.25);ctx.lineWidth=1.2;
 ctx.beginPath();
 ctx.moveTo(top.x-rx,top.y);
 ctx.lineTo(bot.x-rx,bot.y);
 ctx.ellipse(bot.x,bot.y,rx,ry,0,Math.PI,0);
 ctx.lineTo(top.x+rx,top.y);
 ctx.closePath();ctx.fill();ctx.stroke();
 ctx.beginPath();ctx.ellipse(top.x,top.y,rx,ry,0,0,Math.PI*2);
 const roof=ctx.createRadialGradient(top.x-rx*.28,top.y-ry*.5,rx*.06,top.x,top.y,rx);
 roof.addColorStop(0,mix(colors.top,'#e8fff8',.36));
 roof.addColorStop(.42,colors.top);
 roof.addColorStop(1,mix(colors.top,'#05090c',.4));
 ctx.fillStyle=roof;ctx.fill();
 ctx.strokeStyle=mix(colors.edge,'#e4fff8',.42);ctx.lineWidth=1.7;ctx.stroke();
 ctx.strokeStyle=mix(colors.right,'#d8f4ee',.35);ctx.lineWidth=Math.max(3,rx*.018);
 ctx.beginPath();ctx.ellipse(top.x,top.y+(bot.y-top.y)*.12,rx*.98,ry*.98,0,.12,Math.PI-.12);ctx.stroke();
}

function drawIsoVolume(ctx,proj,corners,z0,z1,colors){
 if(!corners?.length)return;
 const cx=corners.reduce((n,p)=>n+p[0],0)/corners.length;
 const cy=corners.reduce((n,p)=>n+p[1],0)/corners.length;
 const floor=corners.map(([x,y])=>({...proj.p(x,y,z0),wx:x,wy:y}));
 const ceil=corners.map(([x,y])=>({...proj.p(x,y,z1),wx:x,wy:y}));
 const faces=[];
 for(let i=0;i<corners.length;i++){
  const j=(i+1)%corners.length;
  const mx=(corners[i][0]+corners[j][0])/2,my=(corners[i][1]+corners[j][1])/2;
  const ox=mx-cx,oy=my-cy;
  faces.push({visible:ox+oy>0,depth:mx+my,left:ox-oy<0,pts:[floor[i],floor[j],ceil[j],ceil[i]]});
 }
 faces.sort((a,b)=>a.depth-b.depth);
 ctx.lineJoin='round';
 for(const f of faces){
  if(!f.visible)continue;
  poly(ctx,f.pts);
  ctx.fillStyle=sideLit(ctx,f.pts,f.left,f.left?colors.left:colors.right);
  ctx.strokeStyle=mix(colors.edge,'#081018',.3);ctx.lineWidth=1;
  ctx.fill();ctx.stroke();
 }
 poly(ctx,ceil);
 ctx.fillStyle=typeof colors.top==='string'?topLit(ctx,ceil,colors.top):colors.top;
 ctx.strokeStyle=mix(colors.edge,'#e4fff8',.4);ctx.lineWidth=1.25;
 ctx.fill();ctx.stroke();
}

function drawIsoPrism(ctx,proj,corners,h,colors){
 drawIsoVolume(ctx,proj,corners,colors.z0||0,h,colors);
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
  hubTop:mix(floor,'#5a8894',.24),
  hubLeft:mix(floor,'#1a2c34',.22),
  hubRight:mix(floor,'#7aadb8',.28),
  armTop:mix(floor,'#243844',.12),
  armLeft:mix(floor,'#152028',.28),
  armRight:mix(floor,'#5a8894',.2),
  edge:mix(accent,'#c5efe8',.28),
  core:mix('#1a3844',accent,.12)
 };
}

function fillHubTop(ctx,proj,hull,h,colors){
 const top=proj.p(hull.cx,hull.cy,h),{rx,ry}=proj.radii(hull.hubR);
 ctx.beginPath();ctx.ellipse(top.x,top.y,rx,ry,0,0,Math.PI*2);
 const wash=ctx.createRadialGradient(top.x-rx*.3,top.y-ry*.52,rx*.05,top.x,top.y,rx);
 wash.addColorStop(0,mix(colors.hubTop,'#e8fff8',.3));
 wash.addColorStop(.48,colors.hubTop);
 wash.addColorStop(1,mix(colors.hubTop,'#05090c',.4));
 ctx.fillStyle=wash;ctx.fill();
 ctx.strokeStyle=mix(colors.edge,'#e4fff8',.48);ctx.lineWidth=2;ctx.stroke();
 drawFloorPanels(ctx,proj,hull,h,colors);
}

function drawFloorPanels(ctx,proj,hull,h,colors){
 const top=proj.p(hull.cx,hull.cy,h),{rx,ry}=proj.radii(hull.hubR-1.4);
 ctx.save();
 ctx.beginPath();ctx.ellipse(top.x,top.y,rx,ry,0,0,Math.PI*2);ctx.clip();
 const step=TILE,pad=7;
 for(let gx=hull.cx-hull.hubR;gx<hull.cx+hull.hubR;gx+=step){
  for(let gy=hull.cy-hull.hubR;gy<hull.cy+hull.hubR;gy+=step){
   const mx=gx+step*.5,my=gy+step*.5,d=Math.hypot(mx-hull.cx,my-hull.cy);
   if(d>hull.hubR-pad||d<hull.coreR+12)continue;
   const tile=[
    proj.p(gx+1.6,gy+1.6,h),proj.p(gx+step-1.6,gy+1.6,h),
    proj.p(gx+step-1.6,gy+step-1.6,h),proj.p(gx+1.6,gy+step-1.6,h)
   ];
   const checker=(Math.floor(gx/step)+Math.floor(gy/step))&1;
   const lit=Math.max(0,1-((mx-hull.cx)+(my-hull.cy))/(hull.hubR*2.2));
   const hatch=((Math.floor(gx/step)*7+Math.floor(gy/step)*3)%13)===0;
   poly(ctx,tile);
   ctx.fillStyle=hatch?mix(colors.hubTop,'#102028',.16)
    :mix(colors.hubTop,checker?'#0c181e':'#d8f4ee',checker?.07:.04+lit*.05);
   ctx.fill();
   ctx.strokeStyle=fade('#9fd8d0',.2+lit*.08);ctx.lineWidth=1;ctx.stroke();
  }
 }
 ctx.strokeStyle=fade('#c5efe8',.2);ctx.lineWidth=1.35;
 for(let i=1;i<=3;i++){
  const rad=proj.radii(hull.hubR*(.38+i*.17));
  ctx.beginPath();ctx.ellipse(top.x,top.y,rad.rx,rad.ry,0,0,Math.PI*2);ctx.stroke();
 }
 ctx.restore();
}

function spokeNear(hull,a,tol=.32){
 for(let k=0;k<hull.spokes;k++){
  let d=Math.abs(a-(hull.baseAngle+k*(Math.PI*2/hull.spokes)));
  d=Math.min(d,Math.PI*2-d);
  if(d<tol)return true;
 }
 return false;
}

function drawHubCurb(ctx,proj,hull,colors,accent){
 const n=28;
 for(let i=0;i<n;i++){
  const a0=i*(Math.PI*2/n),a1=(i+1)*(Math.PI*2/n),am=(a0+a1)*.5;
  if(spokeNear(hull,am,.3))continue;
  const r0=hull.hubR-7,r1=hull.hubR+.8;
  drawIsoVolume(ctx,proj,[
   [hull.cx+Math.cos(a0)*r0,hull.cy+Math.sin(a0)*r0],
   [hull.cx+Math.cos(a1)*r0,hull.cy+Math.sin(a1)*r0],
   [hull.cx+Math.cos(a1)*r1,hull.cy+Math.sin(a1)*r1],
   [hull.cx+Math.cos(a0)*r1,hull.cy+Math.sin(a0)*r1]
  ],DECK_H,DECK_H+5.6,{
   top:mix('#5a8490',accent,.22),left:'#15232c',right:'#3a5a66',edge:mix('#d8f4ee',accent,.3)
  });
 }
}

function drawDeckRim(ctx,proj,hull,accent){
 const top=proj.p(hull.cx,hull.cy,DECK_H),{rx,ry}=proj.radii(hull.hubR);
 ctx.strokeStyle=mix('#e8fff8',accent,.38);ctx.lineWidth=2.3;
 ctx.beginPath();ctx.ellipse(top.x,top.y,rx,ry,0,0,Math.PI*2);ctx.stroke();
 ctx.strokeStyle=fade('#04080c',.5);ctx.lineWidth=1.15;
 ctx.beginPath();ctx.ellipse(top.x,top.y,rx-3.6*proj.zoom,ry-3.6*proj.zoom,0,0,Math.PI*2);ctx.stroke();
}

function drawRimWindows(ctx,proj,hull,accent,clock){
 for(let i=0;i<8;i++){
  const a=i*(Math.PI*2/8)+.2;
  if(spokeNear(hull,a,.28))continue;
  const x=hull.cx+Math.cos(a)*hull.hubR,y=hull.cy+Math.sin(a)*hull.hubR;
  const px=-Math.sin(a)*5.8,py=Math.cos(a)*5.8;
  const bl=proj.p(x+px,y+py,9),br=proj.p(x-px,y-py,9);
  const tl=proj.p(x+px,y+py,22),tr=proj.p(x-px,y-py,22);
  ctx.fillStyle='#071018';ctx.strokeStyle=fade(accent,.6);ctx.lineWidth=1.25;
  ctx.beginPath();ctx.moveTo(tl.x,tl.y);ctx.lineTo(tr.x,tr.y);ctx.lineTo(br.x,br.y);ctx.lineTo(bl.x,bl.y);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.fillStyle=fade('#d8e8f0',.2+.18*Math.sin((clock||0)*2+i));
  ctx.fill();
 }
}

function drawDoorFrame(ctx,proj,hull,i,colors,accent){
 const a=hull.baseAngle+i*(Math.PI*2/hull.spokes);
 const c=Math.cos(a),sn=Math.sin(a),px=-sn,py=c;
 const along=hull.hubR,half=hull.spokeHalf-1.2,post=9.5,tall=DECK_H+44;
 drawIsoVolume(ctx,proj,rotatedRect(hull.cx+c*along,hull.cy+sn*along,4.2,half-4,a),DECK_H,DECK_H+2,{
  top:mix('#1a2c34',accent,.14),left:'#101820',right:'#1a2c34',edge:accent
 });
 const portal=[
  [hull.cx+c*along+px*(half-post),hull.cy+sn*along+py*(half-post)],
  [hull.cx+c*(along+3)+px*(half-post),hull.cy+sn*(along+3)+py*(half-post)],
  [hull.cx+c*(along+3)-px*(half-post),hull.cy+sn*(along+3)-py*(half-post)],
  [hull.cx+c*along-px*(half-post),hull.cy+sn*along-py*(half-post)]
 ];
 drawIsoVolume(ctx,proj,portal,DECK_H+2,tall-7,{
  top:mix('#0c2428',accent,.42),left:mix('#082018',accent,.3),right:mix('#145048',accent,.38),edge:accent
 });
 const posts=[-1,1].map(s=>rotatedRect(hull.cx+c*along+px*half*s,hull.cy+sn*along+py*half*s,post,7.2,a));
 for(const p of posts)drawIsoVolume(ctx,proj,p,DECK_H,tall,{top:mix('#5a8490',accent,.22),left:'#15232c',right:'#3a5a66',edge:accent});
 const lintel=[
  [hull.cx+c*along+px*half-c*3,hull.cy+sn*along+py*half-sn*3],
  [hull.cx+c*(along+10)+px*half,hull.cy+sn*(along+10)+py*half],
  [hull.cx+c*(along+10)-px*half,hull.cy+sn*(along+10)-py*half],
  [hull.cx+c*along-px*half-c*3,hull.cy+sn*along-py*half-sn*3]
 ];
 drawIsoVolume(ctx,proj,lintel,tall-8,tall,{top:mix('#6a98a4',accent,.26),left:'#15232c',right:'#3a5a66',edge:accent});
}

function railStroke(ctx,proj,posts,z){
 ctx.beginPath();
 posts.forEach((p,i)=>{
  const q=proj.p(p.x,p.y,z);
  if(i===0)ctx.moveTo(q.x,q.y);else{
   const prev=posts[i-1];
   const gap=Math.abs(p.a-prev.a);
   if(Math.min(gap,Math.PI*2-gap)>.3)ctx.moveTo(q.x,q.y);else ctx.lineTo(q.x,q.y);
  }
 });
 ctx.stroke();
}

function drawRailing(ctx,proj,hull,colors,accent){
 const posts=[];
 for(let i=0;i<36;i++){
  const a=i*(Math.PI*2/36);
  if(spokeNear(hull,a,.26))continue;
  const x=hull.cx+Math.cos(a)*hull.hubR,y=hull.cy+Math.sin(a)*hull.hubR;
  posts.push({a,x,y});
  drawIsoVolume(ctx,proj,rotatedRect(x,y,1.35,1.35,a),DECK_H,DECK_H+RAIL_H,{
   top:mix('#5a7a84',accent,.2),left:'#0c141a',right:'#2a4450',edge:fade(accent,.7)
  });
 }
 ctx.lineJoin='round';ctx.lineCap='round';
 ctx.strokeStyle=mix('#d8f4ee',accent,.28);ctx.lineWidth=Math.max(1.6,proj.zoom*1.25);
 railStroke(ctx,proj,posts,DECK_H+RAIL_H-1);
 ctx.strokeStyle=mix('#8ec8c0',accent,.2);ctx.lineWidth=Math.max(1.15,proj.zoom*.95);
 railStroke(ctx,proj,posts,DECK_H+RAIL_H*.48);
}

function drawArmDeck(ctx,proj,hull,i,colors,accent){
 const a=hull.baseAngle+i*(Math.PI*2/hull.spokes);
 const c=Math.cos(a),sn=Math.sin(a),px=-sn,py=c;
 const hangar=i===0;
 drawIsoPrism(ctx,proj,spokeCorners(hull,i),DECK_H,{
  top:hangar?mix(colors.armTop,'#c9a46a',.14):colors.armTop,
  left:colors.armLeft,right:colors.armRight,edge:colors.edge
 });
 const wallStart=hull.hubR+16,wallEnd=hull.spokeEnd-(hangar?28:14);
 const mid=(wallStart+wallEnd)*.5,len=(wallEnd-wallStart)*.48,inset=11,wall=6.2;
 for(const side of [-1,1]){
  const x=hull.cx+c*mid+px*(hull.spokeHalf-inset)*side;
  const y=hull.cy+sn*mid+py*(hull.spokeHalf-inset)*side;
  drawIsoVolume(ctx,proj,rotatedRect(x,y,len,wall,a),DECK_H,DECK_H+24,{
   top:mix('#6a98a4',accent,.2),left:'#1a3038',right:'#3a5a66',edge:colors.edge
  });
  drawIsoVolume(ctx,proj,rotatedRect(x,y,len,wall+.8,a),DECK_H+22.5,DECK_H+26.5,{
   top:mix('#9fd8d0',accent,.28),left:'#243844',right:'#4a7080',edge:accent
  });
  for(const t of [.22,.5,.78]){
   const bx=hull.cx+c*(wallStart+(wallEnd-wallStart)*t)+px*(hull.spokeHalf-inset)*side;
   const by=hull.cy+sn*(wallStart+(wallEnd-wallStart)*t)+py*(hull.spokeHalf-inset)*side;
   drawIsoVolume(ctx,proj,rotatedRect(bx,by,2.4,wall+1.2,a),DECK_H,DECK_H+28,{
    top:mix('#8ec8c0',accent,.22),left:'#1a3038',right:'#3a5a66',edge:accent
   });
  }
 }
 const start=hull.hubR+6,end=hull.spokeEnd-8;
 ctx.save();
 const clip=spokeCorners(hull,i).map(([x,y])=>proj.p(x,y,DECK_H+.3));
 poly(ctx,clip);ctx.clip();
 ctx.strokeStyle=fade('#9fd8d0',hangar?.32:.2);ctx.lineWidth=1.05;
 for(let t=0;t<8;t++){
  const u=start+(end-start)*(t/7);
  const p0=proj.p(hull.cx+c*u+px*(hull.spokeHalf-3.4),hull.cy+sn*u+py*(hull.spokeHalf-3.4),DECK_H+.3);
  const p1=proj.p(hull.cx+c*u-px*(hull.spokeHalf-3.4),hull.cy+sn*u-py*(hull.spokeHalf-3.4),DECK_H+.3);
  ctx.beginPath();ctx.moveTo(p0.x,p0.y);ctx.lineTo(p1.x,p1.y);ctx.stroke();
 }
 if(hangar){
  ctx.strokeStyle='#c9a46acc';ctx.lineWidth=Math.max(2.2,proj.zoom*2.1);ctx.setLineDash([8*proj.zoom,6*proj.zoom]);
  const p0=proj.p(hull.cx+c*(start+8),hull.cy+sn*(start+8),DECK_H+.4);
  const p1=proj.p(hull.cx+c*(end-4),hull.cy+sn*(end-4),DECK_H+.4);
  ctx.beginPath();ctx.moveTo(p0.x,p0.y);ctx.lineTo(p1.x,p1.y);ctx.stroke();ctx.setLineDash([]);
 }
 ctx.restore();
 if(hangar){
  const tip=hull.spokeEnd-6,half=hull.spokeHalf-1.2;
  drawIsoVolume(ctx,proj,rotatedRect(hull.cx+c*(tip-12),hull.cy+sn*(tip-12),10,half-2,a),DECK_H+.2,DECK_H+1.8,{
   top:'#1a2a30',left:'#152028',right:'#243844',edge:'#c9a46a'
  });
  for(const s of [-1,1]){
   drawIsoVolume(ctx,proj,rotatedRect(hull.cx+c*tip+px*half*s,hull.cy+sn*tip+py*half*s,10,7.4,a),DECK_H,DECK_H+40,{
    top:mix('#5a7a84',accent,.16),left:'#15232c',right:'#3a5560',edge:'#c9a46a'
   });
  }
  drawIsoVolume(ctx,proj,rotatedRect(hull.cx+c*tip,hull.cy+sn*tip,9,half,a),DECK_H+34,DECK_H+42,{
   top:mix('#6a98a4',accent,.2),left:'#1a3038',right:'#3a5a66',edge:'#c9a46a'
  });
 }
}

function drawIsoDeck(ctx,proj,s,clock){
 const hull=s.hull;if(!hull||hull.kind!=='wheel')return;
 const colors=stationColors(s),h=DECK_H,accent=s.accent||'#7ec8c0';
 const arms=[...Array(hull.spokes)].map((_,i)=>({i,depth:hull.cx+hull.cy+Math.cos(hull.baseAngle+i*(Math.PI*2/hull.spokes))*hull.spokeEnd+Math.sin(hull.baseAngle+i*(Math.PI*2/hull.spokes))*hull.spokeEnd}));
 arms.sort((a,b)=>a.depth-b.depth);
 const far=arms.slice(0,Math.ceil(arms.length/2));
 const near=arms.slice(Math.ceil(arms.length/2));
 for(const arm of far)drawArmDeck(ctx,proj,hull,arm.i,colors,accent);
 drawIsoDisc(ctx,proj,hull.cx,hull.cy,hull.hubR,h,{
  top:colors.hubTop,left:colors.hubLeft,right:colors.hubRight,edge:colors.edge
 });
 fillHubTop(ctx,proj,hull,h,colors);
 drawHubCurb(ctx,proj,hull,colors,accent);
 for(const arm of near)drawArmDeck(ctx,proj,hull,arm.i,colors,accent);
 const pulse=.5+.5*Math.sin((clock||0)*1.6);
 const faction=s.factionColor||accent;
 const doors=[...Array(hull.spokes)].map((_,i)=>{
  const ang=hull.baseAngle+i*(Math.PI*2/hull.spokes);
  return{i,depth:hull.cx+Math.cos(ang)*hull.hubR+hull.cy+Math.sin(ang)*hull.hubR};
 }).sort((a,b)=>a.depth-b.depth);
 const doorMid=(doors[0].depth+doors[doors.length-1].depth)*.5;
 for(const d of doors)if(d.depth<doorMid)drawDoorFrame(ctx,proj,hull,d.i,colors,accent);
 drawIsoDisc(ctx,proj,hull.cx,hull.cy,hull.coreR,h+CORE_H,{
  top:mix(colors.core,faction,.14),left:mix('#0b171e',faction,.12),right:mix('#16303a',faction,.1),edge:mix('#7db9bd',faction,.3)
 },h);
 const coreTop=proj.p(hull.cx,hull.cy,h+CORE_H);
 const cr=proj.radii(hull.coreR);
 ctx.strokeStyle=faction;ctx.globalAlpha=.34+.2*pulse;ctx.lineWidth=2.2;
 ctx.beginPath();ctx.ellipse(coreTop.x,coreTop.y,cr.rx*.6,cr.ry*.6,0,0,Math.PI*2);ctx.stroke();
 ctx.globalAlpha=.14;ctx.fillStyle=faction;
 ctx.beginPath();ctx.ellipse(coreTop.x,coreTop.y,cr.rx*.38,cr.ry*.38,0,0,Math.PI*2);ctx.fill();
 ctx.globalAlpha=1;
 drawRailing(ctx,proj,hull,colors,accent);
 for(const d of doors)if(d.depth>=doorMid)drawDoorFrame(ctx,proj,hull,d.i,colors,accent);
 drawRimWindows(ctx,proj,hull,accent,clock);
 drawDeckRim(ctx,proj,hull,accent);
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
 const fx=Math.cos(prop.facing||0),fy=Math.sin(prop.facing||0);
 drawContactShadow(ctx,proj,prop.x,prop.y,13*proj.zoom,5.4*proj.zoom);
 drawIsoVolume(ctx,proj,rotatedRect(prop.x,prop.y,11,7.6,yaw),DECK_H,DECK_H+2.6,{
  top:'#1a2a32',left:'#0a1218',right:'#16242c',edge:'#4a6a74'
 });
 drawIsoVolume(ctx,proj,rotatedRect(prop.x-fx*1.2,prop.y-fy*1.2,9.2,6.2,yaw),DECK_H+2.6,DECK_H+9,{
  top:mix('#243844',accent,.1),left:'#101c24',right:'#1c303c',edge:near?accent:'#6a94a3'
 });
 drawIsoVolume(ctx,proj,rotatedRect(prop.x,prop.y,11.2,7,yaw),DECK_H+8.6,DECK_H+10.6,{
  top:mix('#2f4a54',accent,.16),left:'#121c24',right:'#243844',edge:accent
 });
 const glow=.2+.12*Math.sin((clock||0)*3);
 const screen=proj.p(prop.x+fx*2.4,prop.y+fy*2.4,DECK_H+13.4);
 ctx.fillStyle=fade(accent,near?.4:glow);
 ctx.beginPath();ctx.ellipse(screen.x,screen.y,7.6*proj.zoom,3.6*proj.zoom,0,0,Math.PI*2);ctx.fill();
 drawIsoVolume(ctx,proj,rotatedRect(prop.x+fx*1.6,prop.y+fy*1.6,6.4,1.4,yaw),DECK_H+10.6,DECK_H+16.5,{
  top:mix('#15232c',accent,.1),left:'#0c161c',right:'#1a2c34',edge:near?accent:'#8aa8b4'
 });
 const plaque=proj.p(prop.x,prop.y,DECK_H+20);
 drawIsoVolume(ctx,proj,rotatedRect(prop.x,prop.y,2.2,2.2,yaw),DECK_H+16.5,DECK_H+22,{
  top:mix('#1a3038',accent,.12),left:'#0c161c',right:'#1d3844',edge:near?accent:'#8aa8b4'
 });
 drawIcon(ctx,plaque.x,plaque.y,11*proj.zoom,prop.icon||prop.service,near?accent:'#b7d4d8');
}

function drawCrate(ctx,proj,prop){
 const yaw=prop.facing||0,c=Math.cos(yaw),sn=Math.sin(yaw);
 drawContactShadow(ctx,proj,prop.x,prop.y,8.4*proj.zoom,3.4*proj.zoom);
 drawIsoVolume(ctx,proj,rotatedRect(prop.x,prop.y,6.8,5.5,yaw),DECK_H,DECK_H+9.2,{
  top:'#6b5340',left:'#3a2d22',right:'#5d4634',edge:'#c9a46a'
 });
 drawIsoVolume(ctx,proj,rotatedRect(prop.x,prop.y,7,5.7,yaw),DECK_H+8.4,DECK_H+10.4,{
  top:'#8a6e50',left:'#3a2d22',right:'#6b5340',edge:'#e0c48a'
 });
 for(const t of [-.28,.28]){
  const band=proj.p(prop.x+c*6.2*t,prop.y+sn*6.2*t,DECK_H+5);
  ctx.strokeStyle='#e0c48aaa';ctx.lineWidth=1.35;
  ctx.beginPath();ctx.ellipse(band.x,band.y,5.2*proj.zoom,2.1*proj.zoom,0,0,Math.PI*2);ctx.stroke();
 }
 for(const [sx,sy] of [[-5.4,-4.2],[5.4,-4.2],[-5.4,4.2],[5.4,4.2]]){
  drawIsoVolume(ctx,proj,rotatedRect(prop.x+c*sx-sn*sy,prop.y+sn*sx+c*sy,1.1,1.1,yaw),DECK_H+8.8,DECK_H+11,{
   top:'#c9a46a',left:'#5a4634',right:'#8a6e50',edge:'#e0c48a'
  });
 }
}

function drawBollard(ctx,proj,prop,accent){
 drawContactShadow(ctx,proj,prop.x,prop.y,4.2*proj.zoom,1.8*proj.zoom);
 drawIsoDisc(ctx,proj,prop.x,prop.y,2.8,DECK_H+12,{
  top:mix('#3a5560',accent,.18),left:'#0c141a',right:'#1d3844',edge:accent||'#7ec8c0'
 },DECK_H);
 const ring=proj.p(prop.x,prop.y,DECK_H+7);
 ctx.strokeStyle='#c9a46acc';ctx.lineWidth=1.6;
 ctx.beginPath();ctx.ellipse(ring.x,ring.y,3.3*proj.zoom,1.45*proj.zoom,0,0,Math.PI*2);ctx.stroke();
 drawIsoDisc(ctx,proj,prop.x,prop.y,2.2,DECK_H+13.4,{
  top:mix('#8ec8c0',accent,.22),left:'#15232c',right:'#2a4450',edge:accent||'#7ec8c0'
 },DECK_H+12);
}

function drawBench(ctx,proj,prop,accent){
 const yaw=prop.facing||0,c=Math.cos(yaw),sn=Math.sin(yaw);
 drawContactShadow(ctx,proj,prop.x,prop.y,12*proj.zoom,3.8*proj.zoom);
 for(const s of [-8.4,8.4]){
  drawIsoVolume(ctx,proj,rotatedRect(prop.x+c*s,prop.y+sn*s,1.3,1.3,yaw),DECK_H,DECK_H+4.2,{
   top:'#1b2c34',left:'#0c141a',right:'#1d2c34',edge:accent||'#7ec8c0'
  });
 }
 for(const o of [-1.6,0,1.6]){
  drawIsoVolume(ctx,proj,rotatedRect(prop.x-sn*o,prop.y+c*o,11.2,1.15,yaw),DECK_H+4.2,DECK_H+5.8,{
   top:mix('#2f4a54',accent||'#7ec8c0',.08),left:'#141c22',right:'#1d2c34',edge:accent||'#7ec8c0'
  });
 }
 drawIsoVolume(ctx,proj,rotatedRect(prop.x-sn*3.4,prop.y+c*3.4,11.2,1.15,yaw),DECK_H+5.8,DECK_H+11.4,{
  top:'#243440',left:'#0c141a',right:'#1d2c34',edge:accent||'#7ec8c0'
 });
}

function drawLightPole(ctx,proj,prop,accent,clock){
 const on=!prop.blink||Math.sin((clock||0)*6)>0;
 const col=accent||'#82d7c2';
 drawContactShadow(ctx,proj,prop.x,prop.y,3.4*proj.zoom,1.5*proj.zoom);
 drawIsoVolume(ctx,proj,rotatedRect(prop.x,prop.y,1.25,1.25,0),DECK_H,DECK_H+27,{
  top:'#2a3c46',left:'#0c141a',right:'#1d3844',edge:col
 });
 drawIsoVolume(ctx,proj,rotatedRect(prop.x+3.2,prop.y,3.4,1.1,0),DECK_H+25.4,DECK_H+27.2,{
  top:mix('#3a5560',col,.16),left:'#101820',right:'#1d3844',edge:col
 });
 const cap=proj.p(prop.x+5.4,prop.y,DECK_H+24);
 ctx.fillStyle=on?col:'#355056';ctx.globalAlpha=on?.92:.28;
 ctx.beginPath();ctx.arc(cap.x,cap.y,3.2*proj.zoom,0,Math.PI*2);ctx.fill();
 if(on){
  ctx.globalAlpha=.18;
  ctx.beginPath();ctx.ellipse(cap.x,cap.y+12*proj.zoom,16*proj.zoom,8*proj.zoom,0,0,Math.PI*2);ctx.fill();
  drawIsoEllipse(ctx,proj,prop.x,prop.y,DECK_H+.4,16,null,null,fade(col,.12));
 }
 ctx.globalAlpha=1;
}

function drawAwning(ctx,proj,prop,accent){
 drawIsoVolume(ctx,proj,rotatedRect(prop.x,prop.y,14,8,prop.facing||0),DECK_H+15,DECK_H+17.4,{
  top:mix('#1a3038',accent||'#7ec8c0',.35),left:fade('#102028',.7),right:mix('#18303e',accent||'#7ec8c0',.18),edge:accent||'#7ec8c0'
 });
}

function drawShuttlePad(ctx,proj,prop,accent){
 drawIsoEllipse(ctx,proj,prop.x,prop.y,DECK_H+.4,30,fade('#c9a46a',.6),[6*proj.zoom,5*proj.zoom],fade('#18303e',.32));
 const yaw=prop.facing||Math.PI/2,c=Math.cos(yaw),sn=Math.sin(yaw);
 drawContactShadow(ctx,proj,prop.x,prop.y,26*proj.zoom,8.2*proj.zoom);
 for(const s of [-7.2,7.2]){
  drawIsoVolume(ctx,proj,rotatedRect(prop.x-sn*s,prop.y+c*s,12,1.6,yaw),DECK_H,DECK_H+2.6,{
   top:'#2a4450',left:'#15232c',right:'#3a5a66',edge:'#8aa8b4'
  });
 }
 drawIsoVolume(ctx,proj,rotatedRect(prop.x-c*2,prop.y-sn*2,16,7.2,yaw),DECK_H+2.4,DECK_H+8.4,{
  top:'#3a5a66',left:'#1a3038',right:'#2a4552',edge:'#8aa8b4'
 });
 drawIsoVolume(ctx,proj,rotatedRect(prop.x+c*8,prop.y+sn*8,14,6.2,yaw),DECK_H+5,DECK_H+13,{
  top:mix('#5a8490',accent,.22),left:'#1a3038',right:'#3a5a66',edge:accent
 });
 for(const s of [-10,10]){
  drawIsoVolume(ctx,proj,rotatedRect(prop.x+c*4-sn*s,prop.y+sn*4+c*s,7.5,2.6,yaw),DECK_H+6,DECK_H+8.8,{
   top:mix('#4a7080',accent,.14),left:'#1a3038',right:'#2a4552',edge:accent
  });
 }
 drawIsoVolume(ctx,proj,rotatedRect(prop.x+c*18,prop.y+sn*18,6.4,4.4,yaw),DECK_H+9,DECK_H+15.5,{
  top:mix('#7ab0bc',accent,.28),left:'#1d3844',right:'#3a5a66',edge:accent
 });
 const canopy=proj.p(prop.x+c*16,prop.y+sn*16,DECK_H+16);
 ctx.fillStyle='rgba(180,255,236,.82)';
 ctx.beginPath();ctx.ellipse(canopy.x,canopy.y,7.2*proj.zoom,3.2*proj.zoom,0,0,Math.PI*2);ctx.fill();
 const tail=proj.p(prop.x-c*14,prop.y-sn*14,DECK_H+10);
 ctx.fillStyle=fade('#9ff0e0',.45);
 ctx.beginPath();ctx.ellipse(tail.x,tail.y,4*proj.zoom,2.4*proj.zoom,0,0,Math.PI*2);ctx.fill();
 drawIsoVolume(ctx,proj,rotatedRect(prop.x-c*10,prop.y-sn*10,2.6,1.3,yaw),DECK_H+8,DECK_H+19,{
  top:mix('#5a8490',accent,.2),left:'#1a3038',right:'#3a5a66',edge:accent
 });
}

function drawPlanter(ctx,proj,prop,accent){
 drawContactShadow(ctx,proj,prop.x,prop.y,7.2*proj.zoom,2.8*proj.zoom);
 drawIsoVolume(ctx,proj,rotatedRect(prop.x,prop.y,5.8,4.8,0),DECK_H,DECK_H+5.2,{
  top:'#3a3228',left:'#1c1612',right:'#4a4030',edge:'#c9a46a'
 });
 drawIsoVolume(ctx,proj,rotatedRect(prop.x,prop.y,4.6,3.6,0),DECK_H+4.6,DECK_H+6.2,{
  top:'#2a241c',left:'#1c1612',right:'#3a3228',edge:'#8a6e50'
 });
 const leaf=proj.p(prop.x,prop.y,DECK_H+12);
 ctx.fillStyle='#1c4a38';
 ctx.beginPath();ctx.ellipse(leaf.x-2.4*proj.zoom,leaf.y+.4*proj.zoom,3.4*proj.zoom,5.2*proj.zoom,-.35,0,Math.PI*2);ctx.fill();
 ctx.fillStyle='#2a6a4c';
 ctx.beginPath();ctx.ellipse(leaf.x+2.4*proj.zoom,leaf.y-1.2*proj.zoom,3.1*proj.zoom,5.6*proj.zoom,.4,0,Math.PI*2);ctx.fill();
 ctx.fillStyle='#3a8260';
 ctx.beginPath();ctx.ellipse(leaf.x,leaf.y-2.2*proj.zoom,2.4*proj.zoom,4.8*proj.zoom,0,0,Math.PI*2);ctx.fill();
 ctx.fillStyle=fade(accent||'#7ec8c0',.26);
 ctx.beginPath();ctx.ellipse(leaf.x+.6*proj.zoom,leaf.y-3.4*proj.zoom,1.4*proj.zoom,2.2*proj.zoom,0,0,Math.PI*2);ctx.fill();
}

function drawHolo(ctx,proj,prop,accent,clock){
 drawContactShadow(ctx,proj,prop.x,prop.y,5*proj.zoom,2*proj.zoom);
 drawIsoVolume(ctx,proj,rotatedRect(prop.x,prop.y,3.6,3.6,0),DECK_H,DECK_H+6,{
  top:'#15232c',left:'#0c161c',right:'#1b2c36',edge:accent||'#7ec8c0'
 });
 const p=proj.p(prop.x,prop.y,DECK_H+16);
 ctx.strokeStyle=accent||'#7ec8c0';ctx.globalAlpha=.4+.22*Math.sin((clock||0)*3);ctx.lineWidth=1.3;
 ctx.beginPath();ctx.ellipse(p.x,p.y,5.4*proj.zoom,7.6*proj.zoom,0,0,Math.PI*2);ctx.stroke();
 ctx.fillStyle=fade(accent||'#7ec8c0',.12);
 ctx.beginPath();ctx.ellipse(p.x,p.y,4.2*proj.zoom,6.2*proj.zoom,0,0,Math.PI*2);ctx.fill();
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
 else if(prop.kind==='window')return;
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
  if(!near)continue;
  drawIsoEllipse(ctx,proj,z.x,z.y,DECK_H+.6,z.r||40,accent,[5,4],fade(accent,.08));
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
   else drawStandingCrew(ctx,p.x,p.y,spriteScale,n.facing||0,n.walk||0,n.color||'#8aa3b0',n.suit||'#2a3d48',{crate:n.role==='hauler',sit:!!n.sit||n.role==='sitter',look:n.look||null});
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

function renderPlanetSite(ctx,width,height,s,clock){
 const pal=SURFACE_PALETTES[s.kindId]||SURFACE_PALETTES.mineral;
 const accent=s.accent||pal.accent;
 const sun=surfaceSun(s.seed??1);
 const sunX=sun.x||-1;
 const scale=width<650?1.08:1.2;
 const anchorY=s.spawn?.y??s.y;
 const cameraX=s.x-width*.4/scale,cameraY=anchorY-height*.68/scale;
 const sx=x=>(x-cameraX)*scale,sy=y=>(y-cameraY)*scale;
 const scroll=siteWorldScroll(cameraX,0,scale);
 prefetchFrontierArt();
 drawPlanetBackdrop(ctx,width,height,s,{site:true});
 paintSiteGround(ctx,width,height,s,scroll);
 const zone=nearestZone(s);
 for(const z of s.zones){
  const board=!!(z.board||z.launch);
  drawSitePad(ctx,sx(z.x),sy(z.y),(z.r||48)*scale,(z.r||48)*scale*.38,accent,zone&&zone.id===z.id,board);
 }
 for(const sign of s.signs||[]){
  if(sign.kind!=='chevron'||!Number.isFinite(sign.angle))continue;
  const x=sx(sign.x),y=sy(sign.y);
  ctx.save();ctx.translate(x,y);ctx.rotate(sign.angle);
  ctx.globalAlpha=sign.accent?0.4:0.2;
  ctx.fillStyle=sign.accent?accent:'#8eb4b8';
  ctx.beginPath();ctx.moveTo(10*scale,0);ctx.lineTo(-5*scale,-5.5*scale);ctx.lineTo(-5*scale,5.5*scale);ctx.closePath();ctx.fill();
  ctx.globalAlpha=1;ctx.restore();
 }
 const sprites=[];
 for(const w of s.walls||[]){
  sprites.push({y:w.y+w.h,draw:()=>drawSiteRock(ctx,sx(w.x),sy(w.y),w.w*scale,w.h*scale,pal)});
 }
 for(const z of s.zones){
  const near=zone&&zone.id===z.id;
  if(z.board||z.launch){
   sprites.push({y:z.y,draw:()=>{
    ctx.save();ctx.translate(sx(z.x),sy(z.y)-6);ctx.scale(1.85,1.85);
    drawFrontierSkiff(ctx,0,0,pal,clock,{nearGround:true,sunX});
    ctx.restore();
   }});
  }else{
   sprites.push({y:z.y,draw:()=>{
    drawSurveyStake(ctx,sx(z.x),sy(z.y),scale,accent,near);
    if(near){
     ctx.fillStyle='#eef8f6';ctx.font=`${Math.max(11,12.5*Math.min(1.1,scale))}px system-ui`;
     ctx.textAlign='center';ctx.textBaseline='alphabetic';
     ctx.fillText(z.label,sx(z.x),sy(z.y)+(z.r||48)*scale*.38+16);
    }
   }});
  }
 }
 sprites.push({y:s.y,draw:()=>{
  drawStandingCrew(ctx,sx(s.x),sy(s.y),scale*3.15,s.facing,s.walk||0,accent,pal.skiff||'#1d3844',{player:true,sunX});
 }});
 sprites.sort((a,b)=>a.y-b.y);
 for(const spr of sprites)spr.draw();
 if(zone){
  const zx=sx(zone.x),zy=sy(zone.y),rx=(zone.r||48)*scale+10+Math.sin(clock*3)*3,ry=rx*.38;
  ctx.strokeStyle=accent;ctx.globalAlpha=.55+.25*Math.sin(clock*4);ctx.lineWidth=2;ctx.setLineDash([6,5]);
  ctx.beginPath();ctx.ellipse(zx,zy,rx,ry,0,0,Math.PI*2);ctx.stroke();
  ctx.setLineDash([]);ctx.globalAlpha=1;
 }
 if(zone){
  ctx.fillStyle=accent;ctx.font='13px system-ui';ctx.textAlign='center';
  const board=!!(zone.board||zone.launch);
  const label=board?'INTERACT · BOARD SKIFF':zone.service==='inspect'?'INTERACT · INSPECT · HOLD':zone.service==='cache'?'INTERACT · SALVAGE CACHE':'INTERACT · '+zone.label.toUpperCase();
  ctx.fillText(label,width/2,Math.max(140,height*.24));
  if(s.footScan&&s.footScan.id===zone.id){
   const pct=Math.min(1,s.footScan.progress/s.footScan.need);
   ctx.fillStyle='#0a1820cc';ctx.fillRect(width/2-60,Math.max(155,height*.24+12),120,8);
   ctx.fillStyle=accent;ctx.fillRect(width/2-60,Math.max(155,height*.24+12),120*pct,8);
  }
 }
}

export function renderOnFoot(ctx,width,height,s,clock){
 if(s.kind==='station'){renderStationConcourse(ctx,width,height,s,clock);return;}
 if(s.kind==='planet'){renderPlanetSite(ctx,width,height,s,clock);return;}
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
   const floor=s.floor||'#142c31',accent=s.accent||'#87b3ac';
   ctx.fillStyle=floor+'ee';ctx.strokeStyle=accent+'66';ctx.lineWidth=2;
   ctx.beginPath();ctx.rect(sx(0),sy(0),s.width*scale,s.height*scale);ctx.fill();ctx.stroke();
   ctx.beginPath();ctx.rect(sx(0),sy(0),s.width*scale,s.height*scale);ctx.clip();
   const wash=ctx.createLinearGradient(sx(0),sy(0),sx(s.width),sy(s.height));
   wash.addColorStop(0,mixHex(floor,'#fff6e8',.08));wash.addColorStop(.55,floor);wash.addColorStop(1,shadeHex(floor,.7));
   ctx.fillStyle=wash;ctx.fillRect(sx(0),sy(0),s.width*scale,s.height*scale);
   ctx.strokeStyle=fadeHex(accent,.28);ctx.lineWidth=1.2;
   const padX=sx(s.width*.5),padY=sy(s.height*.62);
   ctx.beginPath();ctx.ellipse(padX,padY,72*scale,28*scale,0,0,Math.PI*2);ctx.stroke();
   ctx.beginPath();ctx.moveTo(padX-40*scale,padY);ctx.lineTo(padX+40*scale,padY);ctx.moveTo(padX,padY-16*scale);ctx.lineTo(padX,padY+16*scale);ctx.stroke();
   const rim=ctx.createRadialGradient(padX,padY,20*scale,padX,padY,90*scale);
   rim.addColorStop(0,accent+'18');rim.addColorStop(1,'#0000');
   ctx.fillStyle=rim;ctx.fillRect(sx(0),sy(0),s.width*scale,s.height*scale);
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
  if(planet){
   ctx.fillStyle='#00000044';ctx.beginPath();ctx.ellipse(x+ww*.5,y+hh+3*scale,ww*.55,6*scale,0,0,Math.PI*2);ctx.fill();
   ctx.fillStyle=shadeHex(s.floor||'#1a1410',.55);ctx.fillRect(x,y+4*scale,ww,hh);
   ctx.fillStyle=mixHex(s.floor||'#2a221c','#fff6e8',.12);ctx.fillRect(x-2*scale,y,ww+4*scale,6*scale);
   ctx.strokeStyle=(s.accent||'#7ec8c0')+'55';ctx.lineWidth=1.2;ctx.strokeRect(x+.5,y+.5,ww-1,hh-1);
  }else{
   ctx.fillStyle='#0d1620';ctx.fillRect(x,y,ww,hh);
   ctx.strokeStyle=(s.accent||'#7ec8c0')+'66';ctx.lineWidth=1.4;ctx.strokeRect(x+.5,y+.5,ww-1,hh-1);
  }
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

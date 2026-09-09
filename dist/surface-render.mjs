import {terrainAt,nearestAnomaly} from './surface.mjs';

const PALETTES={
 ocean:{sky0:'#041820',sky1:'#0d3a48',sky2:'#1a5a5e',terrain:'#0f2e36',stroke:'#6ec4c8',hills:['#0a2830','#123840'],dust:'#9ad4d866',skiff:'#1a4a55',skiffLine:'#a8f0ea'},
 arid:{sky0:'#1a1008',sky1:'#3a2814',sky2:'#6a4a28',terrain:'#2a1c10',stroke:'#d4a86a',hills:['#241808','#3a2814'],dust:'#e8c48a55',skiff:'#3a2a18',skiffLine:'#f0d4a0'},
 ice:{sky0:'#0a1420',sky1:'#1a3048',sky2:'#4a6a80',terrain:'#152030',stroke:'#c8e0f0',hills:['#101c28','#1e3040'],dust:'#d8ecff66',skiff:'#1a2838',skiffLine:'#d0e8f8'},
 mineral:{sky0:'#07131f',sky1:'#183141',sky2:'#3a4545',terrain:'#142c31',stroke:'#87b3ac',hills:['#233f49','#2a474e'],dust:'#bbd5e066',skiff:'#25444f',skiffLine:'#b7eee0'},
 gas:{sky0:'#120818',sky1:'#2a1840',sky2:'#4a3860',terrain:'#1a1428',stroke:'#b8a0d8',hills:['#221830','#2e2040'],dust:'#d0b8f055',skiff:'#2a2038',skiffLine:'#e0d0f8'}
};

export function renderSurface(ctx,width,height,s,clock,stats){
 const pal=PALETTES[s.kindId]||PALETTES.mineral;
 const scale=width<650?.62:.86,cameraX=s.x-width*.08/scale,cameraY=s.y-40;
 const sx=x=>(x-cameraX)*scale+width/2,sy=y=>(y-cameraY)*scale+height/2;
 const sky=ctx.createLinearGradient(0,0,0,height);sky.addColorStop(0,pal.sky0);sky.addColorStop(.55,pal.sky1);sky.addColorStop(1,pal.sky2);ctx.fillStyle=sky;ctx.fillRect(0,0,width,height);
 ctx.fillStyle=pal.dust;for(let i=0;i<70;i++){const x=((i*173.91-cameraX*.08)%width+width)%width,y=(i*63.73)%Math.max(100,height*.45);ctx.fillRect(x,y,1+(i%3===0?1:0),1);}
 // Atmospheric haze band
 ctx.fillStyle=pal.sky2+'33';ctx.fillRect(0,height*.35,width,height*.2);
 for(const [offset,color,parallax]of [[-210,pal.hills[0],.45],[-105,pal.hills[1],.72]]){ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(0,height);for(let x=0;x<=width+15;x+=15){const wx=cameraX*parallax+(x-width/2)/scale;ctx.lineTo(x,sy(terrainAt(wx,s.seed+offset)+offset));}ctx.lineTo(width,height);ctx.closePath();ctx.fill();}
 ctx.beginPath();ctx.moveTo(0,height);for(let x=0;x<=width+8;x+=8){const wx=cameraX+(x-width/2)/scale;ctx.lineTo(x,sy(terrainAt(wx,s.seed)));}ctx.lineTo(width,height);ctx.closePath();ctx.fillStyle=pal.terrain;ctx.fill();ctx.strokeStyle=pal.stroke;ctx.lineWidth=2;ctx.beginPath();for(let x=0;x<=width+8;x+=8){const wx=cameraX+(x-width/2)/scale;if(x===0)ctx.moveTo(x,sy(terrainAt(wx,s.seed)));else ctx.lineTo(x,sy(terrainAt(wx,s.seed)));}ctx.stroke();
 // Ground contact shadow for skiff
 if(s.landed||s.y>terrainAt(s.x,s.seed)-40){const gx=sx(s.x),gy=sy(terrainAt(s.x,s.seed));ctx.fillStyle='#00000044';ctx.beginPath();ctx.ellipse(gx,gy+2,22,5,0,0,Math.PI*2);ctx.fill();}
 const colors={geology:'#c9b18d',relic:'#b7a6f0',biosignature:'#99e5b1',signal:'#8dcced'};
 const pingActive=s.ping&&s.ping.life>0;
 for(const a of s.anomalies){
  const x=sx(a.x),y=sy(a.y),known=Math.abs(a.x-s.x)<1000||pingActive;if(x<-120||x>width+120)continue;
  const color=a.scanned?'#638b82':colors[a.kind];
  // Kind-specific markers
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
 const x=sx(s.x),y=sy(s.y),tilt=Math.max(-.18,Math.min(.18,s.vx/1000));ctx.save();ctx.translate(x,y);ctx.rotate(tilt);
 if(s.throttle>.05){ctx.fillStyle='#90efd9';ctx.globalAlpha=.6;for(const side of [-1,1]){ctx.beginPath();ctx.moveTo(side*16-4,8);ctx.lineTo(side*16,21+Math.random()*13*s.throttle);ctx.lineTo(side*16+4,8);ctx.fill();}ctx.globalAlpha=1;}
 ctx.fillStyle=pal.skiff;ctx.strokeStyle=pal.skiffLine;ctx.lineWidth=1.5;
 ctx.beginPath();ctx.moveTo(-31,4);ctx.lineTo(-20,-7);ctx.lineTo(2,-13);ctx.lineTo(22,-6);ctx.lineTo(34,4);ctx.lineTo(17,10);ctx.lineTo(-18,10);ctx.closePath();ctx.fill();ctx.stroke();
 ctx.fillStyle='#94d8db';ctx.fillRect(-2,-9,15,5);
 // Landing skids when near ground
 if(s.landed||s.y>terrainAt(s.x,s.seed)-35){ctx.strokeStyle=pal.skiffLine;ctx.beginPath();ctx.moveTo(-18,10);ctx.lineTo(-22,16);ctx.moveTo(16,10);ctx.lineTo(20,16);ctx.stroke();}
 ctx.restore();
 if(s.scan){const a=s.anomalies.find(a=>a.id===s.scan.id);ctx.strokeStyle='#a5fbe099';ctx.setLineDash([4,5]);ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,y+8);ctx.lineTo(sx(a.x),sy(a.y));ctx.stroke();ctx.setLineDash([]);}
 const next=nearestAnomaly(s);if(next){const nx=sx(next.x);if(nx<30||nx>width-30){const px=nx<30?25:width-25,py=Math.max(230,height*.5);ctx.fillStyle='#eac591';ctx.font='20px system-ui';ctx.textAlign='center';ctx.fillText(nx<30?'‹':'›',px,py);ctx.font='12px system-ui';ctx.fillText(Math.round(Math.abs(next.x-s.x))+' m',Math.max(45,Math.min(width-45,px)),py+23);}}
 const traveled=s.anomalies.filter(a=>a.scanned).length;ctx.font='12px system-ui';ctx.fillStyle='#b1c9ca';ctx.textAlign='center';
 ctx.fillText((s.kind?s.kind.toUpperCase()+'  ·  ':'')+'SURFACE SURVEY  ·  '+traveled+' / 6 SIGNALS',width/2,Math.max(150,height*.29));
 if(s.pingCooldown>0&&!s.ping){ctx.fillStyle='#9aabaf';ctx.fillText('BEACON '+Math.ceil(s.pingCooldown)+'s',width/2,Math.max(168,height*.29+18));}
}

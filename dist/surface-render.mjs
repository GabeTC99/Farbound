import {terrainAt,nearestAnomaly} from './surface.mjs';
export function renderSurface(ctx,width,height,s,clock,stats){
 const scale=width<650?.62:.86,cameraX=s.x-width*.08/scale,cameraY=s.y-40;
 const sx=x=>(x-cameraX)*scale+width/2,sy=y=>(y-cameraY)*scale+height/2;
 const sky=ctx.createLinearGradient(0,0,0,height);sky.addColorStop(0,'#07131f');sky.addColorStop(.6,'#183141');sky.addColorStop(1,'#3a4545');ctx.fillStyle=sky;ctx.fillRect(0,0,width,height);
 ctx.fillStyle='#bbd5e066';for(let i=0;i<60;i++){const x=((i*173.91-cameraX*.08)%width+width)%width,y=(i*63.73)%Math.max(100,height*.42);ctx.fillRect(x,y,1,1);}
 for(const [offset,color,parallax]of [[-210,'#233f49',.45],[-105,'#2a474e',.72]]){ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(0,height);for(let x=0;x<=width+15;x+=15){const wx=cameraX*parallax+(x-width/2)/scale;ctx.lineTo(x,sy(terrainAt(wx,s.seed+offset)+offset));}ctx.lineTo(width,height);ctx.closePath();ctx.fill();}
 ctx.beginPath();ctx.moveTo(0,height);for(let x=0;x<=width+8;x+=8){const wx=cameraX+(x-width/2)/scale;ctx.lineTo(x,sy(terrainAt(wx,s.seed)));}ctx.lineTo(width,height);ctx.closePath();ctx.fillStyle='#142c31';ctx.fill();ctx.strokeStyle='#87b3ac';ctx.lineWidth=2;ctx.beginPath();for(let x=0;x<=width+8;x+=8){const wx=cameraX+(x-width/2)/scale;if(x===0)ctx.moveTo(x,sy(terrainAt(wx,s.seed)));else ctx.lineTo(x,sy(terrainAt(wx,s.seed)));}ctx.stroke();
 const colors={geology:'#c9b18d',relic:'#b7a6f0',biosignature:'#99e5b1',signal:'#8dcced'};
 for(const a of s.anomalies){const x=sx(a.x),y=sy(a.y),known=Math.abs(a.x-s.x)<1000;if(x< -100||x>width+100)continue;const color=a.scanned?'#638b82':colors[a.kind];ctx.strokeStyle=color;ctx.fillStyle=color;ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(x,y-20);ctx.lineTo(x+13,y-7);ctx.lineTo(x,y+6);ctx.lineTo(x-13,y-7);ctx.closePath();ctx.stroke();if(!a.scanned){ctx.globalAlpha=.25+.12*Math.sin(clock*3);ctx.beginPath();ctx.arc(x,y-7,26+Math.sin(clock*2)*4,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;}
  ctx.font='12px system-ui';ctx.textAlign='center';ctx.fillText(a.scanned?'RECORDED':known?a.kind.toUpperCase():'SIGNAL',x,y-38);
 }
 const x=sx(s.x),y=sy(s.y),tilt=Math.max(-.18,Math.min(.18,s.vx/1000));ctx.save();ctx.translate(x,y);ctx.rotate(tilt);
 if(s.throttle>.05){ctx.fillStyle='#90efd9';ctx.globalAlpha=.6;for(const side of [-1,1]){ctx.beginPath();ctx.moveTo(side*16-4,8);ctx.lineTo(side*16,21+Math.random()*13*s.throttle);ctx.lineTo(side*16+4,8);ctx.fill();}ctx.globalAlpha=1;}
 ctx.fillStyle='#25444f';ctx.strokeStyle='#b7eee0';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(-31,4);ctx.lineTo(-20,-7);ctx.lineTo(2,-13);ctx.lineTo(22,-6);ctx.lineTo(34,4);ctx.lineTo(17,10);ctx.lineTo(-18,10);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#94d8db';ctx.fillRect(-2,-9,15,5);ctx.restore();
 if(s.scan){const a=s.anomalies.find(a=>a.id===s.scan.id);ctx.strokeStyle='#a5fbe099';ctx.setLineDash([4,5]);ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,y+8);ctx.lineTo(sx(a.x),sy(a.y));ctx.stroke();ctx.setLineDash([]);}
 const next=nearestAnomaly(s);if(next){const nx=sx(next.x);if(nx<30||nx>width-30){const px=nx<30?25:width-25,py=Math.max(230,height*.5);ctx.fillStyle='#eac591';ctx.font='20px system-ui';ctx.textAlign='center';ctx.fillText(nx<30?'‹':'›',px,py);ctx.font='12px system-ui';ctx.fillText(Math.round(Math.abs(next.x-s.x))+' m',Math.max(45,Math.min(width-45,px)),py+23);}}
 const traveled=s.anomalies.filter(a=>a.scanned).length;ctx.font='12px system-ui';ctx.fillStyle='#b1c9ca';ctx.textAlign='center';ctx.fillText('SURFACE SURVEY  ·  '+traveled+' / 6 SIGNALS RECORDED',width/2,Math.max(150,height*.29));
}

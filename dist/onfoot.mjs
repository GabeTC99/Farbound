import {pointInHull} from './station-layout.mjs';

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

export function createOnFoot(layout,saved=null){
 const pad=14;
 let x=layout.spawn.x,y=layout.spawn.y;
 if(saved&&Number.isFinite(saved.x)&&Number.isFinite(saved.y)){
  const sx=clamp(saved.x,20,layout.width-20),sy=clamp(saved.y,20,layout.height-20);
  if(!layout.hull||pointInHull(layout.hull,sx,sy,pad)){x=sx;y=sy;}
 }
 return{
  kind:layout.kind,
  title:layout.title,
  role:layout.role,
  accent:layout.accent,
  floor:layout.floor,
  width:layout.width,
  height:layout.height,
  hull:layout.hull||null,
  walls:layout.walls||[],
  windows:layout.windows||[],
  signs:layout.signs||[],
  zones:layout.zones,
  npcs:layout.npcs.map(n=>({...n,phase:n.phase||0,facing:0,walk:0,moving:0,pause:0})),
  spawn:layout.spawn,
  x,y,vx:0,vy:0,facing:layout.spawn.facing||0,radius:12,throttle:0,walk:0
 };
}

export function nearestZone(s,maxDist=62){
 if(!s?.zones?.length)return null;
 return s.zones.map(z=>({z,d:Math.hypot(z.x-s.x,z.y-s.y)-(z.r||40)})).filter(e=>e.d<=maxDist).sort((a,b)=>a.d-b.d)[0]?.z||null;
}

function overlaps(x,y,r,wall){
 const cx=clamp(x,wall.x,wall.x+wall.w),cy=clamp(y,wall.y,wall.y+wall.h);
 return Math.hypot(x-cx,y-cy)<r;
}

function resolveWalls(s,nx,ny){
 const r=s.radius;
 let x=nx,y=ny;
 for(const wall of s.walls){
  if(!overlaps(x,y,r,wall))continue;
  const cx=clamp(x,wall.x,wall.x+wall.w),cy=clamp(y,wall.y,wall.y+wall.h);
  let dx=x-cx,dy=y-cy;
  const len=Math.hypot(dx,dy);
  if(len<1e-6){
   const left=x-wall.x,right=(wall.x+wall.w)-x,top=y-wall.y,bottom=(wall.y+wall.h)-y;
   const m=Math.min(left,right,top,bottom);
   if(m===left)x=wall.x-r;else if(m===right)x=wall.x+wall.w+r;else if(m===top)y=wall.y-r;else y=wall.y+wall.h+r;
  }else{x=cx+dx/len*(r+.01);y=cy+dy/len*(r+.01);}
 }
 if(s.hull){
  const pad=r+2;
  if(!pointInHull(s.hull,x,y,pad)){
   if(pointInHull(s.hull,s.x,y,pad))x=s.x;
   else if(pointInHull(s.hull,x,s.y,pad))y=s.y;
   else{x=s.x;y=s.y;}
  }
 }
 return{x:clamp(x,r+2,s.width-r-2),y:clamp(y,r+2,s.height-r-2)};
}

export function updateOnFoot(s,dt,input={}){
 dt=clamp(dt,0,.05);
 let ax=0,ay=0;
 if(input.aim!=null){ax=Math.cos(input.aim)*(input.thrust||0);ay=Math.sin(input.aim)*(input.thrust||0);}
 else{ax=input.turn||0;ay=(input.brake?1:0)-(input.thrust||0);}
 const sprint=input.boost?1.7:1;
 s.throttle=Math.min(1,Math.hypot(ax,ay));
 const speed=560*sprint;
 s.vx+=(ax*speed-s.vx*11)*dt;s.vy+=(ay*speed-s.vy*11)*dt;
 const spd=Math.hypot(s.vx,s.vy);
 if(spd>10)s.facing=Math.atan2(s.vy,s.vx);
 s.walk=(s.walk||0)+(spd>14?dt*(spd*.018):0);
 const moved=resolveWalls(s,s.x+s.vx*dt,s.y+s.vy*dt);
 if(Math.abs(moved.x-s.x)<.01)s.vx=0;
 if(Math.abs(moved.y-s.y)<.01)s.vy=0;
 s.x=moved.x;s.y=moved.y;
 for(const n of s.npcs){
  const path=n.path||[];
  if(path.length<2)continue;
  if((n.pause||0)>0){n.pause-=dt;n.moving=0;continue;}
  n.phase=(n.phase||0)+dt*(n.speed||.22);
  const t=n.phase%path.length;
  const i=Math.floor(t)%path.length,j=(i+1)%path.length,f=t-Math.floor(t);
  if(f<.02&&(n._lastSeg!==i)){n._lastSeg=i;n.pause=.5+.7*((n.id||'0').charCodeAt((n.id||'0').length-1)%3);n.moving=0;continue;}
  const ox=n.x,oy=n.y;
  n.x=path[i].x+(path[j].x-path[i].x)*f;
  n.y=path[i].y+(path[j].y-path[i].y)*f;
  const dx=n.x-ox,dy=n.y-oy,ms=Math.hypot(dx,dy);
  n.moving=ms>0.02?1:0;
  if(ms>0.02)n.facing=Math.atan2(dy,dx);
  n.walk=(n.walk||0)+(n.moving?ms*.09:0);
 }
 return{zone:nearestZone(s)};
}

export function onFootSave(s){return s?{x:s.x,y:s.y}:null;}

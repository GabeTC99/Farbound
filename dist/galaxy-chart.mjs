import {GALAXY_CORE} from './catalog.mjs';
import {SYSTEMS,getStats,jumpDistance,systemName} from './frontier.mjs';
/** Display-only spacing — gameplay jumpDistance stays on raw SYSTEM coords. */
export const GALAXY_SPREAD=1.55;
const links=[];for(let i=0;i<SYSTEMS.length;i++)for(let j=i+1;j<SYSTEMS.length;j++)if(jumpDistance(i,j)<12.5)links.push([i,j]);
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function galaxyDisplay(sys){return{x:sys.x*GALAXY_SPREAD,y:sys.y*GALAXY_SPREAD};}
export class GalaxyChart{
 constructor(canvas,game,view,onSelect,selected){
  this.canvas=canvas;this.game=game;this.view=view;this.onSelect=onSelect;this.selected=selected;
  this.pointers=new Map();this.moved=false;this.w=1;this.h=1;this.points=[];
  canvas.addEventListener('pointerdown',e=>{e.preventDefault();canvas.setPointerCapture(e.pointerId);this.pointers.set(e.pointerId,{x:e.offsetX,y:e.offsetY});this.start={x:e.offsetX,y:e.offsetY};this.moved=this.pointers.size>1;});
  canvas.addEventListener('pointermove',e=>this.move(e));
  canvas.addEventListener('pointerup',e=>{
   if(!this.pointers.has(e.pointerId))return;
   const click=this.pointers.size===1&&!this.moved;this.pointers.delete(e.pointerId);
   if(click){
    const hit=matchMedia('(pointer:coarse)').matches?28:22;
    const near=this.points.slice().sort((a,b)=>Math.hypot(a.x-e.offsetX,a.y-e.offsetY)-Math.hypot(b.x-e.offsetX,b.y-e.offsetY))[0];
    if(near&&Math.hypot(near.x-e.offsetX,near.y-e.offsetY)<hit)onSelect(near.id);
   }
  });
  canvas.addEventListener('pointercancel',()=>{this.pointers.clear();this.moved=true;});
  canvas.addEventListener('wheel',e=>{e.preventDefault();this.zoom(e.deltaY<0?1.18:1/1.18,e.offsetX,e.offsetY);},{passive:false});
  this.draw();
 }
 move(e){
  const old=this.pointers.get(e.pointerId);if(!old)return;
  const now={x:e.offsetX,y:e.offsetY};
  if(this.pointers.size===2){
   this.moved=true;
   const other=[...this.pointers.entries()].find(([id])=>id!==e.pointerId)?.[1];
   if(other){const before=Math.hypot(old.x-other.x,old.y-other.y);if(before>3)this.zoom(Math.hypot(now.x-other.x,now.y-other.y)/before,(now.x+other.x)/2,(now.y+other.y)/2);}
  }else{
   if(Math.hypot(now.x-this.start.x,now.y-this.start.y)>5)this.moved=true;
   if(this.moved){this.view.x-=(now.x-old.x)/this.view.scale;this.view.y-=(now.y-old.y)/this.view.scale;this.draw();}
  }
  this.pointers.set(e.pointerId,now);
 }
 zoom(factor,x=this.w/2,y=this.h/2){
  const prev=this.view.scale,next=Math.max(.45,Math.min(36,prev*factor));
  this.view.x+=(x-this.w/2)*(1/prev-1/next);this.view.y+=(y-this.h/2)*(1/prev-1/next);
  this.view.scale=next;this.draw();
 }
 project(wx,wy,w,h){const v=this.view;return{x:(wx-v.x)*v.scale+w/2,y:(wy-v.y)*v.scale+h/2};}
 draw(){
  const c=this.canvas,r=c.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);
  this.w=r.width;this.h=r.height;c.width=Math.round(r.width*dpr);c.height=Math.round(r.height*dpr);
  const ctx=c.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);
  const w=r.width,h=r.height,v=this.view,s=this.game.s,scale=v.scale;
  const all=SYSTEMS.map(sys=>{const d=galaxyDisplay(sys);return{id:sys.id,...this.project(d.x,d.y,w,h)};});
  ctx.fillStyle='#07111b';ctx.fillRect(0,0,w,h);
  // Softer grid
  ctx.strokeStyle='#1d344228';
  const gap=Math.max(28,14*scale);
  for(let x=((w/2-v.x*scale)%gap+gap)%gap;x<w;x+=gap){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke();}
  for(let y=((h/2-v.y*scale)%gap+gap)%gap;y<h;y+=gap){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();}
  const core=this.project(GALAXY_CORE.x*GALAXY_SPREAD,GALAXY_CORE.y*GALAXY_SPREAD,w,h);
  ctx.fillStyle='#6aabbc0a';ctx.strokeStyle='#8ac4cf38';ctx.setLineDash([5,7]);
  ctx.beginPath();ctx.arc(core.x,core.y,GALAXY_CORE.radius*GALAXY_SPREAD*scale,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.setLineDash([]);
  if(scale>1.2){
   ctx.font='11px system-ui';ctx.fillStyle='#a9b2d888';ctx.textAlign='left';ctx.fillText('UNCHARTED REACH',12,22);
   if(scale>2.4){ctx.textAlign='center';ctx.fillStyle='#8ebcbf99';ctx.fillText('HUMAN EXPLORATION CORE',core.x,core.y-GALAXY_CORE.radius*GALAXY_SPREAD*scale-10);}
  }
  const cur=all[s.system];
  ctx.fillStyle='#80e6d306';ctx.strokeStyle='#90efdc35';
  ctx.beginPath();ctx.arc(cur.x,cur.y,getStats(s).range*GALAXY_SPREAD*scale,0,Math.PI*2);ctx.fill();ctx.stroke();
  // Link LOD — dense mesh only when zoomed in
  const visited=new Set(s.visited);const routeSet=new Set(s.route?.path||[]);routeSet.add(s.system);
  const dense=scale>=6.5;
  ctx.strokeStyle=dense?'#466b7a28':'#466b7a40';ctx.lineWidth=1;
  for(const [a,b]of links){
   const p=all[a],q=all[b];
   if(Math.max(p.x,q.x)<-20||Math.min(p.x,q.x)>w+20||Math.max(p.y,q.y)<-20||Math.min(p.y,q.y)>h+20)continue;
   if(!dense){
    const keep=a===s.system||b===s.system||a===this.selected||b===this.selected||routeSet.has(a)||routeSet.has(b)||(visited.has(a)&&visited.has(b));
    if(!keep)continue;
   }
   ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.stroke();
  }
  if(s.route){
   ctx.strokeStyle='#efb677';ctx.lineWidth=2;ctx.setLineDash([5,4]);ctx.beginPath();ctx.moveTo(cur.x,cur.y);
   for(const id of s.route.path)ctx.lineTo(all[id].x,all[id].y);
   ctx.stroke();ctx.setLineDash([]);ctx.lineWidth=1;
  }
  this.points=all.filter(p=>p.x>-30&&p.x<w+30&&p.y>-30&&p.y<h+30);
  const labelSize=clamp(11+scale*.35,10,16);
  const placed=[];
  const wantLabel=p=>{
   if(p.id===s.system||p.id===this.selected||routeSet.has(p.id))return true;
   const sys=SYSTEMS[p.id];
   if(scale>=5.5&&visited.has(p.id))return true;
   if(scale>=9&&sys.uncharted)return true;
   if(scale>=7.5&&!sys.uncharted)return true;
   return false;
  };
  for(const p of this.points){
   const sys=SYSTEMS[p.id],isVisited=visited.has(p.id),sel=p.id===this.selected,here=p.id===s.system;
   ctx.strokeStyle=sel?'#f1b879':here?'#91efda':isVisited?'#91efda':sys.uncharted?'#8493ae':'#b5c8d3';
   ctx.fillStyle=isVisited||here?'#91efda':'#b5c8d3';
   ctx.beginPath();ctx.arc(p.x,p.y,sel||here?5:3,0,Math.PI*2);
   if(sys.uncharted&&!isVisited)ctx.stroke();else ctx.fill();
   if(here){
    ctx.strokeStyle='#91efdaaa';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(p.x,p.y,13,0,Math.PI*2);ctx.stroke();
    ctx.strokeStyle='#91efda55';ctx.lineWidth=1;ctx.beginPath();ctx.arc(p.x,p.y,18,0,Math.PI*2);ctx.stroke();
   }else if(sel){ctx.strokeStyle='#f1b879';ctx.lineWidth=1.25;ctx.beginPath();ctx.arc(p.x,p.y,12,0,Math.PI*2);ctx.stroke();}
   ctx.lineWidth=1;
   if(!wantLabel(p))continue;
   const ly=p.y+labelSize+10;
   if(placed.some(q=>Math.hypot(q.x-p.x,q.y-ly)<18))continue;
   placed.push({x:p.x,y:ly});
   ctx.font=`${labelSize}px system-ui`;ctx.fillStyle=sel?'#f0c498':here?'#b8f5e8':'#99b0bc';
   ctx.textAlign='center';ctx.fillText(systemName(sys,s),p.x,ly);
  }
 }
}

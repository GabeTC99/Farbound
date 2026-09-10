/** Local-space system chart — pan/zoom canvas with live ship position. */
export class SystemChart{
 constructor(canvas,game,view,onSelect){
  this.canvas=canvas;this.game=game;this.view=view;this.onSelect=onSelect;
  this.pointers=new Map();this.moved=false;this.w=1;this.h=1;this.hits=[];
  canvas.addEventListener('pointerdown',e=>{e.preventDefault();canvas.setPointerCapture(e.pointerId);this.pointers.set(e.pointerId,{x:e.offsetX,y:e.offsetY});this.start={x:e.offsetX,y:e.offsetY};this.moved=this.pointers.size>1;});
  canvas.addEventListener('pointermove',e=>this.move(e));
  canvas.addEventListener('pointerup',e=>{
   if(!this.pointers.has(e.pointerId))return;
   const click=this.pointers.size===1&&!this.moved;this.pointers.delete(e.pointerId);
   if(click&&this.onSelect){
    const hit=matchMedia('(pointer:coarse)').matches?30:22;
    const near=this.hits.slice().sort((a,b)=>Math.hypot(a.sx-e.offsetX,a.sy-e.offsetY)-Math.hypot(b.sx-e.offsetX,b.sy-e.offsetY))[0];
    if(near&&Math.hypot(near.sx-e.offsetX,near.sy-e.offsetY)<Math.max(hit,near.sr+8))this.onSelect(near.body);
   }
  });
  canvas.addEventListener('pointercancel',()=>{this.pointers.clear();this.moved=true;});
  canvas.addEventListener('wheel',e=>{e.preventDefault();this.zoom(e.deltaY<0?1.18:1/1.18,e.offsetX,e.offsetY);},{passive:false});
  this.fit();
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
  const prev=this.view.scale,next=Math.max(.00008,Math.min(.12,prev*factor));
  this.view.x+=(x-this.w/2)*(1/prev-1/next);this.view.y+=(y-this.h/2)*(1/prev-1/next);
  this.view.scale=next;this.draw();
 }
 project(wx,wy,w,h){const v=this.view;return{x:(wx-v.x)*v.scale+w/2,y:(wy-v.y)*v.scale+h/2};}
 shipWorld(){
  const g=this.game;
  if(g.s.docked&&g.station)return{x:g.station.x,y:g.station.y,angle:g.player?.angle||0,mode:'docked'};
  if(g.surface&&g.target)return{x:g.target.x,y:g.target.y,angle:0,mode:'surface'};
  return{x:g.player.x,y:g.player.y,angle:g.player.angle||0,mode:'flight'};
 }
 bodies(){
  const g=this.game,list=[];
  for(const star of (g.stars||(g.star?[g.star]:[])))list.push(star);
  for(const p of g.visiblePlanets||[])list.push(p);
  for(const s of (g.stations||[]).filter(s=>s.type==='station'))list.push(s);
  for(const b of (g.belts||(g.belt?[g.belt]:[])))list.push(b);
  return list;
 }
 fit(){
  const g=this.game,r=this.canvas.getBoundingClientRect(),w=Math.max(120,r.width),h=Math.max(120,r.height);
  const pts=this.bodies();
  const ship=this.shipWorld();pts.push(ship);
  if(!pts.length){this.view.x=0;this.view.y=0;this.view.scale=.02;return;}
  let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
  for(const p of pts){
   const pad=Math.max(p.r||40,80);
   minX=Math.min(minX,p.x-pad);maxX=Math.max(maxX,p.x+pad);
   minY=Math.min(minY,p.y-pad);maxY=Math.max(maxY,p.y+pad);
  }
  const spanX=Math.max(400,maxX-minX),spanY=Math.max(400,maxY-minY);
  this.view.x=(minX+maxX)/2;this.view.y=(minY+maxY)/2;
  this.view.scale=Math.min((w-48)/spanX,(h-48)/spanY);
 }
 locate(){
  const ship=this.shipWorld();
  this.view.x=ship.x;this.view.y=ship.y;
  if(this.view.scale<.008)this.view.scale=.02;
  this.draw();
 }
 draw(){
  const c=this.canvas,r=c.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);
  this.w=r.width;this.h=r.height;c.width=Math.round(r.width*dpr);c.height=Math.round(r.height*dpr);
  const ctx=c.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);
  const w=r.width,h=r.height,g=this.game,v=this.view,scale=v.scale;
  ctx.fillStyle='#07111b';ctx.fillRect(0,0,w,h);
  ctx.strokeStyle='#1d344222';
  const gap=Math.max(36,120000*scale);
  for(let x=((w/2-v.x*scale)%gap+gap)%gap;x<w;x+=gap){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke();}
  for(let y=((h/2-v.y*scale)%gap+gap)%gap;y<h;y+=gap){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();}

  const stars=g.stars||(g.star?[g.star]:[]);
  const primary=stars.find(s=>s.primary!==false&&s.id==='star')||stars[0]||g.star;
  // Orbit guides for visible worlds around each host star
  ctx.setLineDash([2,10]);ctx.strokeStyle='#2c526540';ctx.lineWidth=1;
  for(const p of (g.visiblePlanets||[])){
   const host=stars.find(s=>s.id===p.hostStarId)||primary;
   if(!host)continue;
   const hx=this.project(host.x,host.y,w,h),orbit=Math.hypot(p.x-host.x,p.y-host.y)*scale;
   if(orbit<4||orbit>Math.max(w,h)*1.4)continue;
   ctx.beginPath();ctx.arc(hx.x,hx.y,orbit,0,Math.PI*2);ctx.stroke();
  }
  ctx.setLineDash([]);

  this.hits=[];
  const labelSize=Math.max(10,Math.min(14,11+scale*400));
  const pushHit=(body,sx,sy,sr)=>{this.hits.push({body,sx,sy,sr});};

  for(const b of (g.belts||(g.belt?[g.belt]:[]))){
   const p=this.project(b.x,b.y,w,h),sr=Math.max(6,(b.r||200)*scale*.08);
   ctx.strokeStyle='#797b7688';ctx.fillStyle='#797b7622';
   ctx.beginPath();ctx.arc(p.x,p.y,sr,0,Math.PI*2);ctx.fill();ctx.stroke();
   ctx.font=`${labelSize}px system-ui`;ctx.fillStyle='#829496';ctx.textAlign='center';
   ctx.fillText((b.name||'Belt').toUpperCase(),p.x,p.y-sr-6);
   pushHit(b,p.x,p.y,sr);
  }

  for(const planet of (g.visiblePlanets||[])){
   const p=this.project(planet.x,planet.y,w,h),sr=Math.max(4,Math.min(28,(planet.r||80)*scale));
   const sel=g.target===planet;
   ctx.fillStyle=planet.color||(planet.type==='moon'?'#a8b8c8':'#85b8cf');
   ctx.beginPath();ctx.arc(p.x,p.y,sr,0,Math.PI*2);ctx.fill();
   if(sel){ctx.strokeStyle='#f1b879';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(p.x,p.y,sr+5,0,Math.PI*2);ctx.stroke();ctx.lineWidth=1;}
   ctx.font=`${labelSize}px system-ui`;ctx.fillStyle=sel?'#f0c498':'#99b0bc';ctx.textAlign='center';
   ctx.fillText(planet.name||(planet.type==='moon'?'Moon':'World'),p.x,p.y+sr+labelSize+2);
   pushHit(planet,p.x,p.y,sr);
  }

  for(const star of stars){
   const p=this.project(star.x,star.y,w,h),sr=Math.max(8,Math.min(36,(star.r||160)*scale*.55));
   const glow=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,sr*2.2);
   glow.addColorStop(0,(star.color||'#e8c18a')+'cc');glow.addColorStop(1,(star.color||'#e8c18a')+'00');
   ctx.fillStyle=glow;ctx.beginPath();ctx.arc(p.x,p.y,sr*2.2,0,Math.PI*2);ctx.fill();
   ctx.fillStyle=star.color||'#e8c18a';ctx.beginPath();ctx.arc(p.x,p.y,sr,0,Math.PI*2);ctx.fill();
   if(g.target===star){ctx.strokeStyle='#f1b879';ctx.beginPath();ctx.arc(p.x,p.y,sr+6,0,Math.PI*2);ctx.stroke();}
   ctx.font=`${labelSize}px system-ui`;ctx.fillStyle='#e8c18a';ctx.textAlign='center';
   ctx.fillText(star.name||'Star',p.x,p.y+sr+labelSize+2);
   pushHit(star,p.x,p.y,sr);
  }

  for(const st of (g.stations||[]).filter(s=>s.type==='station')){
   const p=this.project(st.x,st.y,w,h),sr=Math.max(5,Math.min(16,(st.r||65)*scale));
   ctx.fillStyle='#91efd9';ctx.strokeStyle='#91efd9';
   ctx.fillRect(p.x-sr*.7,p.y-sr*.7,sr*1.4,sr*1.4);
   if(g.target===st){ctx.strokeStyle='#f1b879';ctx.strokeRect(p.x-sr-3,p.y-sr-3,sr*2+6,sr*2+6);}
   ctx.font=`${labelSize}px system-ui`;ctx.fillStyle='#91efd9';ctx.textAlign='center';
   ctx.fillText(st.name||'Station',p.x,p.y+sr+labelSize+2);
   pushHit(st,p.x,p.y,sr);
  }

  const ship=this.shipWorld(),sp=this.project(ship.x,ship.y,w,h);
  ctx.save();ctx.translate(sp.x,sp.y);ctx.rotate(ship.angle||0);
  ctx.fillStyle='#a7f0df';ctx.strokeStyle='#091820';ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(10,0);ctx.lineTo(-7,6);ctx.lineTo(-4,0);ctx.lineTo(-7,-6);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.restore();
  ctx.strokeStyle='#91efda66';ctx.beginPath();ctx.arc(sp.x,sp.y,16,0,Math.PI*2);ctx.stroke();
  ctx.font=`${labelSize}px system-ui`;ctx.fillStyle='#b8f5e8';ctx.textAlign='center';
  ctx.fillText(ship.mode==='docked'?'YOU · DOCKED':ship.mode==='surface'?'YOU · SURFACE':'YOU',sp.x,sp.y+24);
 }
}

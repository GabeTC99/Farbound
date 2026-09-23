/** Seeded station decks matching the orbital station sprite: hub disk + 6 arms. */
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const rng=seed=>()=>{let t=seed+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};

function roleAccent(roleLabel=''){
 if(/mining/i.test(roleLabel))return{accent:'#c9a46a',floor:'#2a3c32',role:'mining'};
 if(/industrial/i.test(roleLabel))return{accent:'#8aa3b8',floor:'#243644',role:'industrial'};
 if(/prison|detention/i.test(roleLabel))return{accent:'#c97878',floor:'#3a2a30',role:'prison'};
 return{accent:'#7ec8c0',floor:'#29434f',role:'orbital'};
}

function zone(id,label,service,x,y,r,icon,extra={}){return{id,label,service,x,y,r,icon,...extra};}

const NPC_COLORS=['#7ec8c0','#c9a46a','#8aa3b8','#b78fc8','#8fc98a','#d4a090'];

/**
 * Proportions mirror drawStation in app.js (unit rim ≈ 64):
 * mid disk ≈ 51, arms from ≈ 35→80 at half-width ≈ 9, core ≈ 22.
 */
function wheelHull(cx,cy){
 const unit=5.2; // pixels per exterior unit
 return{
  kind:'wheel',
  cx,cy,
  hubR:51*unit,          // solid mid body
  coreR:22*unit,
  rimR:64*unit,
  spokes:6,
  baseAngle:Math.PI/2,   // hangar arm points down
  spokeStart:35*unit,
  spokeEnd:80*unit,
  spokeHalf:9*unit
 };
}

function polar(cx,cy,angle,dist){return{x:cx+Math.cos(angle)*dist,y:cy+Math.sin(angle)*dist};}
function spokeAngle(hull,i){return hull.baseAngle+i*(Math.PI*2/hull.spokes);}
function tipOf(hull,i,dist){return polar(hull.cx,hull.cy,spokeAngle(hull,i),dist??(hull.spokeEnd-28));}

export function pointInHull(hull,x,y,pad=0){
 if(!hull||hull.kind!=='wheel')return true;
 const dx=x-hull.cx,dy=y-hull.cy,d=Math.hypot(dx,dy);
 // Solid hub disk (matches the filled mid circle outside)
 if(d<=hull.hubR-pad)return true;
 for(let i=0;i<hull.spokes;i++){
  const a=spokeAngle(hull,i),c=Math.cos(a),s=Math.sin(a);
  const along=dx*c+dy*s,across=-dx*s+dy*c;
  if(along>=hull.spokeStart+pad&&along<=hull.spokeEnd-pad&&Math.abs(across)<=hull.spokeHalf-pad)return true;
 }
 return false;
}

function normalZones(hull){
 // One desk per arm tip — same six arms you see from local space.
 const tips=[0,1,2,3,4,5].map(i=>tipOf(hull,i));
 const hub=(ang,t)=>polar(hull.cx,hull.cy,ang,hull.hubR*t);
 return[
  zone('hangar','Hangar bay','shipyard',tips[0].x,tips[0].y,52,'launch',{launch:true}),
  zone('market','Market','market',tips[1].x,tips[1].y,46,'market'),
  zone('cartographics','Cartographics','data',tips[2].x,tips[2].y,46,'data'),
  zone('contracts','Contracts','contracts',tips[3].x,tips[3].y,46,'contracts'),
  zone('modules','Modules','outfitting',tips[4].x,tips[4].y,46,'modules'),
  zone('guilds','Guilds','guilds',tips[5].x,tips[5].y,46,'guilds'),
  zone('factions','Factions','factions',hub(spokeAngle(hull,1)+.35,.55).x,hub(spokeAngle(hull,1)+.35,.55).y,40,'factions'),
  zone('shipyard','Hangar office','shipyard',hub(spokeAngle(hull,5)-.35,.55).x,hub(spokeAngle(hull,5)-.35,.55).y,40,'ship')
 ];
}

function prisonZones(hull){
 const tips=[0,1,2,3,4,5].map(i=>tipOf(hull,i));
 return[
  zone('hangar','Release bay','shipyard',tips[0].x,tips[0].y,52,'launch',{launch:true}),
  zone('detention','Detention','detention',tips[3].x,tips[3].y,50,'detention'),
  zone('commissary','Commissary','market',tips[1].x,tips[1].y,46,'market'),
  zone('cartographics','Cartographics','data',tips[2].x,tips[2].y,46,'data'),
  zone('modules','Modules','outfitting',tips[4].x,tips[4].y,46,'modules'),
  zone('shipyard','Impound','shipyard',tips[5].x,tips[5].y,46,'ship')
 ];
}

function makeNpcs(r,hull,zones){
 const desks=zones.filter(z=>!z.launch);
 return desks.slice(0,5).map((z,i)=>{
  const a=Math.atan2(z.y-hull.cy,z.x-hull.cx);
  const path=[
   polar(hull.cx,hull.cy,a,hull.hubR*.7),
   polar(hull.cx,hull.cy,a+0.2,hull.hubR*.85),
   {x:z.x+(r()-.5)*18,y:z.y+(r()-.5)*18},
   polar(hull.cx,hull.cy,a-0.2,hull.hubR*.75)
  ];
  return{id:'npc-'+i,x:path[0].x,y:path[0].y,path,speed:.14+.1*r(),phase:r()*4,color:NPC_COLORS[i%NPC_COLORS.length],facing:0,walk:0,moving:0,pause:r()*1.4};
 });
}

/** Quiet floor chevrons at arm roots — no text plaques. */
function makeSigns(hull,zones){
 return zones.filter(z=>z.launch||z.service==='market'||z.service==='data'||z.service==='contracts'||z.service==='outfitting'||z.service==='guilds'||z.service==='detention').map(z=>{
  const a=Math.atan2(z.y-hull.cy,z.x-hull.cx);
  const mouth=polar(hull.cx,hull.cy,a,(hull.spokeStart+hull.hubR)*.5);
  return{kind:'chevron',x:mouth.x,y:mouth.y,angle:a,accent:!!z.launch};
 });
}

/**
 * @param {{name?:string,roleLabel?:string,prison?:boolean,detained?:boolean,dockId?:string,seed?:number}} opts
 */
export function createStationLayout(opts={}){
 const prison=!!(opts.prison||opts.detained);
 const seed=(opts.seed??0)^(prison?991:0)^((opts.dockId||'station').length*173);
 const r=rng(seed|0);
 const look=roleAccent(prison?'PRISON BARGE':(opts.roleLabel||''));
 const width=1100,height=1100,cx=width/2,cy=height/2;
 const hull=wheelHull(cx,cy);
 const zones=prison?prisonZones(hull):normalZones(hull);
 for(const z of zones){
  if(z.launch)continue;
  z.x=clamp(z.x+(r()-.5)*12,40,width-40);
  z.y=clamp(z.y+(r()-.5)*12,40,height-40);
 }
 const hangar=zones.find(z=>z.launch)||zones[0];
 return{
  kind:'station',
  title:opts.name||'Station deck',
  role:look.role,
  accent:look.accent,
  floor:look.floor,
  width,height,hull,
  walls:[],
  zones,windows:[],signs:makeSigns(hull,zones),
  spawn:{x:hangar.x,y:hangar.y,facing:Math.atan2(cy-hangar.y,cx-hangar.x)},
  npcs:makeNpcs(r,hull,zones)
 };
}

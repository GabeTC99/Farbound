/** Seeded station decks shaped like the orbital wheel (hub + 6 spokes). */
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const rng=seed=>()=>{let t=seed+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};

function roleAccent(roleLabel=''){
 if(/mining/i.test(roleLabel))return{accent:'#c9a46a',floor:'#1c2a22',role:'mining'};
 if(/industrial/i.test(roleLabel))return{accent:'#8aa3b8',floor:'#1a2430',role:'industrial'};
 if(/prison|detention/i.test(roleLabel))return{accent:'#c97878',floor:'#24181c',role:'prison'};
 return{accent:'#7ec8c0',floor:'#172430',role:'orbital'};
}

function zone(id,label,service,x,y,r,icon,extra={}){return{id,label,service,x,y,r,icon,...extra};}

const NPC_COLORS=['#7ec8c0','#c9a46a','#8aa3b8','#b78fc8','#8fc98a','#d4a090'];

/** Same wheel geometry the local-space station sprite uses, scaled for walking. */
function wheelHull(cx,cy){
 return{
  kind:'wheel',
  cx,cy,
  hubR:118,
  ringInner:198,
  ringOuter:318,
  spokes:6,
  // Hangar spoke points down (+Y) to match approach from below in space.
  baseAngle:Math.PI/2,
  spokeStart:160,
  spokeEnd:470,
  spokeHalf:48
 };
}

function polar(cx,cy,angle,dist){return{x:cx+Math.cos(angle)*dist,y:cy+Math.sin(angle)*dist};}

function spokeAngle(hull,i){return hull.baseAngle+i*(Math.PI*2/hull.spokes);}

function tipOf(hull,i,dist){return polar(hull.cx,hull.cy,spokeAngle(hull,i),dist??(hull.spokeEnd-36));}

export function pointInHull(hull,x,y,pad=0){
 if(!hull||hull.kind!=='wheel')return true;
 const dx=x-hull.cx,dy=y-hull.cy,d=Math.hypot(dx,dy);
 if(d<=hull.hubR-pad)return true;
 if(d>=hull.ringInner+pad&&d<=hull.ringOuter-pad)return true;
 for(let i=0;i<hull.spokes;i++){
  const a=spokeAngle(hull,i),c=Math.cos(a),s=Math.sin(a);
  const along=dx*c+dy*s,across=-dx*s+dy*c;
  if(along>=hull.spokeStart+pad&&along<=hull.spokeEnd-pad&&Math.abs(across)<=hull.spokeHalf-pad)return true;
 }
 return false;
}

function normalZones(hull){
 // Spoke 0 = hangar (down). Others carry the main desks, matching the six orbital arms.
 const tips=[0,1,2,3,4,5].map(i=>tipOf(hull,i));
 const ring=(i,t)=>polar(hull.cx,hull.cy,spokeAngle(hull,i)+Math.PI/6,hull.ringInner+(hull.ringOuter-hull.ringInner)*t);
 return[
  zone('hangar','Hangar bay','shipyard',tips[0].x,tips[0].y,58,'launch',{launch:true}),
  zone('market','Market','market',tips[1].x,tips[1].y,50,'market'),
  zone('cartographics','Cartographics','data',tips[2].x,tips[2].y,50,'data'),
  zone('contracts','Contracts','contracts',tips[3].x,tips[3].y,50,'contracts'),
  zone('modules','Modules','outfitting',tips[4].x,tips[4].y,50,'modules'),
  zone('guilds','Guilds','guilds',tips[5].x,tips[5].y,50,'guilds'),
  zone('factions','Factions','factions',ring(1,.55).x,ring(1,.55).y,44,'factions'),
  zone('shipyard','Hangar office','shipyard',ring(5,.55).x,ring(5,.55).y,44,'ship')
 ];
}

function prisonZones(hull){
 const tips=[0,1,2,3,4,5].map(i=>tipOf(hull,i));
 return[
  zone('hangar','Release bay','shipyard',tips[0].x,tips[0].y,58,'launch',{launch:true}),
  zone('detention','Detention','detention',tips[3].x,tips[3].y,54,'detention'),
  zone('commissary','Commissary','market',tips[1].x,tips[1].y,50,'market'),
  zone('cartographics','Cartographics','data',tips[2].x,tips[2].y,50,'data'),
  zone('modules','Modules','outfitting',tips[4].x,tips[4].y,50,'modules'),
  zone('shipyard','Impound','shipyard',tips[5].x,tips[5].y,50,'ship')
 ];
}

function makeNpcs(r,hull,zones){
 const desks=zones.filter(z=>!z.launch);
 return desks.slice(0,5).map((z,i)=>{
  const a=Math.atan2(z.y-hull.cy,z.x-hull.cx);
  const path=[
   polar(hull.cx,hull.cy,a,.92*((hull.ringInner+hull.ringOuter)/2)),
   polar(hull.cx,hull.cy,a+0.18,(hull.ringInner+hull.ringOuter)/2),
   {x:z.x+(r()-.5)*24,y:z.y+(r()-.5)*24},
   polar(hull.cx,hull.cy,a-0.18,(hull.ringInner+hull.ringOuter)/2)
  ];
  return{id:'npc-'+i,x:path[0].x,y:path[0].y,path,speed:.14+.1*r(),phase:r()*4,color:NPC_COLORS[i%NPC_COLORS.length],facing:0,walk:0,moving:0,pause:r()*1.4};
 });
}

function rimWindows(hull){
 const windows=[];
 for(let i=0;i<36;i++){
  const a=i/36*Math.PI*2;
  const p=polar(hull.cx,hull.cy,a,hull.ringOuter-8);
  windows.push({x:p.x-7,y:p.y-7,w:14,h:14,angle:a});
 }
 return windows;
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
 // Tiny seeded jitter on spoke desk positions so stations feel distinct.
 const zones=prison?prisonZones(hull):normalZones(hull);
 for(const z of zones){
  if(z.launch)continue;
  z.x=clamp(z.x+(r()-.5)*16,40,width-40);
  z.y=clamp(z.y+(r()-.5)*16,40,height-40);
 }
 const hangar=zones.find(z=>z.launch)||zones[0];
 return{
  kind:'station',
  title:opts.name||'Station deck',
  role:look.role,
  accent:look.accent,
  floor:look.floor,
  width,height,hull,
  walls:[], // walkability comes from the wheel hull
  zones,windows:rimWindows(hull),
  spawn:{x:hangar.x,y:hangar.y,facing:Math.atan2(cy-hangar.y,cx-hangar.x)},
  npcs:makeNpcs(r,hull,zones)
 };
}

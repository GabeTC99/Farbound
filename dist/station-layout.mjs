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
const CLERK_NAMES=['Rin','Vela','Pax','Orrin','Sable','Joss','Nim','Kade'];
const WALKER_NAMES=['Ives','Mara','Pell','Juno','Tov','Ellis','Wren','Hale','Nash','Quin','Bram','Pike'];
export const STATION_CHAT={
 market:['Refuel’s on the counter.','Two buttons. Fuel, then hull.','Don’t overpay the shortage.'],
 data:['Catalogs sell as a bundle.','Scan twice. Always.','Unsold data dies with the hull.'],
 contracts:['Board’s fresh this hour.','Extraction wants ore. Always.','Sign, fly, get paid.'],
 outfitting:['One module per category.','Don’t strip cargo mid-load.','Wren still flies true.'],
 guilds:['Accept before you grind.','Modules transfer. Hulls don’t.','Three jobs. That’s the ladder.'],
 factions:['Standing is a long game.','Patrols remember faces.','Relief crates beat speeches.'],
 shipyard:['Pad three’s open.','Mind the fold wash.','Launch when you’re ready.'],
 detention:['Pay the fine. Then leave.','Quiet day. Don’t fix that.','Bounties print themselves.'],
 walker:['New Wren on pad 3.','Fold just came in.','Coffee’s burnt again.','Heard Sundog’s paying.'],
 hauler:['Mind the crates.','Hangar’s busy.','Watch your toes.','Market wants this pallet.'],
 robot:['Market first. Always.','I am delightful. Allegedly.','Try not to scratch the paint.'],
 talker:['Don’t fly wanted.','Core’s humming loud tonight.','Another quiet arrival.','That hull looks interpretive.'],
 clerk:['Next.','I can wait.','Sign here. Mentally.'],
 tech:['Pad three’s open.','Mind the fold wash.','Hold short of the stripe.'],
 sitter:['Coffee’s burnt again.','Give the core a minute.','Heard Sundog’s paying.'],
 messenger:['Packets first.','Horses later.','Hortreach is quiet.']
};

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
  zone('market','Market · Refuel','market',tips[1].x,tips[1].y,46,'market'),
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
  zone('commissary','Commissary · Refuel','market',tips[1].x,tips[1].y,46,'market'),
  zone('cartographics','Cartographics','data',tips[2].x,tips[2].y,46,'data'),
  zone('modules','Modules','outfitting',tips[4].x,tips[4].y,46,'modules'),
  zone('shipyard','Impound','shipyard',tips[5].x,tips[5].y,46,'ship')
 ];
}

function chatFor(service,role){
 const pool=STATION_CHAT[service]||STATION_CHAT[role]||STATION_CHAT.walker;
 return pool;
}

function takeName(pool,used){
 for(const n of pool){if(!used.has(n)){used.add(n);return n;}}
 const fallback=pool[used.size%pool.length]+'-'+used.size;
 used.add(fallback);return fallback;
}

function npcBase(id,role,name,x,y,extra={}){
 return{id,role,name,x,y,facing:0,walk:0,moving:0,pause:0,line:null,lineUntil:0,path:[],speed:.16,...extra};
}

function makeNpcs(r,hull,zones,look){
 const npcs=[];
 const used=new Set();
 const desks=zones.filter(z=>!z.launch);
 desks.forEach((z,i)=>{
  const a=Math.atan2(z.y-hull.cy,z.x-hull.cx);
  const pos=polar(z.x,z.y,a+Math.PI,26);
  const hort=z.service==='messenger';
  if(hort)used.add('Hort');
  npcs.push(npcBase('clerk-'+z.id,hort?'messenger':'clerk',hort?'Hort':takeName(CLERK_NAMES,used),pos.x,pos.y,{
   facing:a,color:hort?'#c9b48a':NPC_COLORS[i%NPC_COLORS.length],suit:hort?'#2b5a9a':look.floor,service:z.service,speed:0,phase:i*.85,look:hort?'hort':null
  }));
 });
 for(let i=0;i<4;i++){
  const ring=hull.hubR*(.58+.1*r());
  const path=[0,1,2,3,4,5].map(k=>polar(hull.cx,hull.cy,spokeAngle(hull,k)+.18*r(),ring));
  const rot=Math.floor(r()*path.length);
  const p=path.slice(rot).concat(path.slice(0,rot));
  npcs.push(npcBase('walk-'+i,'walker',takeName(WALKER_NAMES,used),p[0].x,p[0].y,{
   path:p,speed:.11+.1*r(),phase:r()*4,color:NPC_COLORS[(i+2)%NPC_COLORS.length],suit:'#243844',pause:r()*1.2
  }));
 }
 const hangar=zones.find(z=>z.launch),market=zones.find(z=>z.service==='market');
 if(hangar&&market){
  const mid=polar(hull.cx,hull.cy,Math.atan2(market.y-hull.cy,market.x-hull.cx)*.5+spokeAngle(hull,0)*.5,hull.hubR*.72);
  const path=[{x:hangar.x,y:hangar.y-18},mid,{x:market.x+16,y:market.y+10},mid];
  npcs.push(npcBase('haul-0','hauler',takeName(WALKER_NAMES,used),path[0].x,path[0].y,{
   path,speed:.16,phase:r()*2,color:'#c9a46a',suit:'#3a3228',pause:.4
  }));
 }
 if(market){
  const a=Math.atan2(market.y-hull.cy,market.x-hull.cx);
  const pos=polar(market.x,market.y,a+Math.PI,.55*46);
  npcs.push(npcBase('robot-0','robot','concierge',pos.x+18,pos.y-8,{
   facing:a,color:look.accent,suit:'#132833',service:'market',speed:0
  }));
 }
 const talkA=polar(hull.cx,hull.cy,2.4,hull.hubR*.42);
 npcs.push(npcBase('talk-a','talker',takeName(WALKER_NAMES,used),talkA.x-11,talkA.y,{facing:.15,color:'#8fc98a',suit:'#2a3d48',speed:0}));
 npcs.push(npcBase('talk-b','talker',takeName(WALKER_NAMES,used),talkA.x+11,talkA.y,{facing:Math.PI-.15,color:'#8aa3b8',suit:'#2a3d48',speed:0}));
 if(hangar){
  npcs.push(npcBase('tech-0','tech',takeName(WALKER_NAMES,used),hangar.x-30,hangar.y+16,{
   facing:-.35,color:'#c9a46a',suit:'#3a3228',service:'shipyard',speed:0
  }));
 }
 for(let i=0;i<2;i++){
  const p=polar(hull.cx,hull.cy,i*2.15+.4,hull.coreR+40);
  npcs.push(npcBase('sit-'+i,'sitter',takeName(WALKER_NAMES,used),p.x,p.y+1,{
   facing:i*2.15+.4+Math.PI/2,color:NPC_COLORS[(i+4)%NPC_COLORS.length],suit:'#243844',speed:0,sit:true
  }));
 }
 return npcs;
}

function makeProps(r,hull,zones){
 const props=[];
 const hangar=zones.find(z=>z.launch);
 if(hangar){
  for(let i=0;i<3;i++)props.push({kind:'crate',x:hangar.x+(i-1)*20,y:hangar.y-30,facing:0});
  props.push({kind:'light',x:hangar.x-42,y:hangar.y+4,blink:true});
  props.push({kind:'light',x:hangar.x+42,y:hangar.y+4,blink:true});
  props.push({kind:'shuttle',x:hangar.x,y:hangar.y+6,facing:Math.PI/2});
 }
 for(const z of zones.filter(z=>!z.launch)){
  const a=Math.atan2(z.y-hull.cy,z.x-hull.cx);
  props.push({kind:'kiosk',x:z.x,y:z.y,facing:a,service:z.service,icon:z.icon,label:z.label});
  if(z.service==='market'){
   props.push({kind:'awning',x:z.x,y:z.y,facing:a});
   props.push({kind:'crate',x:z.x+Math.cos(a+1.2)*22,y:z.y+Math.sin(a+1.2)*22,facing:a});
   props.push({kind:'crate',x:z.x+Math.cos(a-1.2)*20,y:z.y+Math.sin(a-1.2)*20,facing:a});
  }
 }
 for(let i=0;i<3;i++){
  const p=polar(hull.cx,hull.cy,i*2.15+.4,hull.coreR+40);
  props.push({kind:'bench',x:p.x,y:p.y,facing:i*2.15+.4+Math.PI/2});
 }
 for(let i=0;i<4;i++){
  const p=polar(hull.cx,hull.cy,i*(Math.PI/2)+.7,hull.coreR+22);
  props.push({kind:'planter',x:p.x,y:p.y});
 }
 const fac=zones.find(z=>z.service==='factions');
 if(fac)props.push({kind:'holo',x:(fac.x+hull.cx)*.5,y:(fac.y+hull.cy)*.5});
 else props.push({kind:'holo',x:hull.cx+28,y:hull.cy-36});
 for(let i=0;i<hull.spokes;i++){
  const mouth=polar(hull.cx,hull.cy,spokeAngle(hull,i),(hull.spokeStart+hull.hubR)*.5);
  props.push({kind:'bollard',x:mouth.x+Math.cos(spokeAngle(hull,i)+Math.PI/2)*14,y:mouth.y+Math.sin(spokeAngle(hull,i)+Math.PI/2)*14});
  props.push({kind:'bollard',x:mouth.x+Math.cos(spokeAngle(hull,i)-Math.PI/2)*14,y:mouth.y+Math.sin(spokeAngle(hull,i)-Math.PI/2)*14});
 }
 for(let i=0;i<8;i++){
  const p=polar(hull.cx,hull.cy,i*(Math.PI*2/8)+.2,hull.hubR-18);
  props.push({kind:'window',x:p.x,y:p.y,facing:i*(Math.PI*2/8)+.2});
 }
 return props;
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
 * @param {{name?:string,roleLabel?:string,prison?:boolean,detained?:boolean,dockId?:string,seed?:number,faction?:string,factionColor?:string,robotName?:string,solace?:boolean}} opts
 */
export function createStationLayout(opts={}){
 const prison=!!(opts.prison||opts.detained);
 const seed=(opts.seed??0)^(prison?991:0)^((opts.dockId||'station').length*173);
 const r=rng(seed|0);
 const look=roleAccent(prison?'PRISON BARGE':(opts.roleLabel||''));
 const width=1100,height=1100,cx=width/2,cy=height/2;
 const hull=wheelHull(cx,cy);
 const zones=prison?prisonZones(hull):normalZones(hull);
 if(opts.solace&&!prison){
  const pos=polar(hull.cx,hull.cy,spokeAngle(hull,2)+.55,hull.hubR*.38);
  zones.push(zone('messenger','Messenger desk','messenger',pos.x,pos.y,36,'messenger'));
 }
 for(const z of zones){
  if(z.launch)continue;
  z.x=clamp(z.x+(r()-.5)*12,40,width-40);
  z.y=clamp(z.y+(r()-.5)*12,40,height-40);
 }
 const hangar=zones.find(z=>z.launch)||zones[0];
 const npcs=makeNpcs(r,hull,zones,look);
 const robot=npcs.find(n=>n.role==='robot');
 if(robot&&opts.robotName)robot.name=opts.robotName;
 const inward=polar(hangar.x,hangar.y,Math.atan2(cy-hangar.y,cx-hangar.x),42);
 return{
  kind:'station',
  title:opts.name||'Station deck',
  role:look.role,
  accent:look.accent,
  floor:look.floor,
  faction:opts.faction||null,
  factionColor:opts.factionColor||null,
  width,height,hull,
  walls:[],
  zones,windows:[],signs:makeSigns(hull,zones),
  props:makeProps(r,hull,zones),
  spawn:{x:inward.x,y:inward.y,facing:Math.atan2(cy-hangar.y,cx-hangar.x)},
  npcs
 };
}

export function pickStationChat(npc,now=0){
 const pool=chatFor(npc.service,npc.role);
 if(!pool?.length)return null;
 const i=Math.abs(((npc.id||'').length*17+(Math.floor(now*2)|0))|0)%pool.length;
 return pool[i];
}

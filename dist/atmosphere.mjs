/** Deterministic local-space sky profiles. Does not touch galaxy RNG. */
export function systemSky(sys){
 const h=((sys.id*2654435761)>>>0),bucket=h%10;
 let kind='clear';
 if(sys.uncharted){
  if(sys.danger>=3||bucket<3)kind='storm';
  else if(bucket<7)kind='nebula';
  else kind='deep';
 }else if(sys.danger>=3)kind=bucket<5?'ion':'dust';
 else if(bucket===0)kind='nebula';
 else if(bucket===1)kind='ion';
 // Quiet Frontier palette: mint / cyan / slate — no stock-nebula purple.
 const palettes={
  clear:{bg:'#060c16',star:'#c2e5f1',tint:'#6aa8c0',wash:['#1a3a48','#0d2838'],nebulaAlpha:.4,lightning:false},
  nebula:{bg:'#061018',star:'#d0f4ee',tint:'#5ec4b0',wash:['#0a3a40','#164858','#0e2a38'],nebulaAlpha:.72,lightning:false},
  storm:{bg:'#070a14',star:'#d7e8ff',tint:'#6a8ab8',wash:['#122038','#1a2848'],nebulaAlpha:.65,lightning:true},
  ion:{bg:'#06141a',star:'#9ff0e0',tint:'#3fd0b8',wash:['#0a3038','#124850'],nebulaAlpha:.55,lightning:false},
  dust:{bg:'#100c0a',star:'#ffd4a8',tint:'#c48858',wash:['#2a1c14','#3a2818'],nebulaAlpha:.5,lightning:false},
  deep:{bg:'#04060f',star:'#8aa0c8',tint:'#405070',wash:['#0a1020'],nebulaAlpha:.28,lightning:false}
 };
 const p=palettes[kind];
 return{kind,label:kind.toUpperCase(),seed:h,hue:h%360,fog:0.18+(h%40)/200,...p};
}

export function wantedTier(bounty=0){
 if(bounty<=0)return{level:0,label:'CLEAN',color:'#83d9c9'};
 if(bounty<400)return{level:1,label:'PETTY',color:'#e6c07b'};
 if(bounty<1000)return{level:2,label:'WANTED',color:'#efa778'};
 if(bounty<2500)return{level:3,label:'HIGH VALUE',color:'#ee918b'};
 return{level:4,label:'EXTREME',color:'#ff5c6a'};
}

export function pickTradeDestination(fromId,SYSTEMS,jumpDistance,preferStation=true){
 const near=SYSTEMS.filter(s=>s.id!==fromId&&(!preferStation||s.hasStation)&&jumpDistance(fromId,s.id)<=14);
 const pool=near.length?near:SYSTEMS.filter(s=>s.id!==fromId&&s.hasStation).sort((a,b)=>jumpDistance(fromId,a.id)-jumpDistance(fromId,b.id)).slice(0,8);
 if(!pool.length)return null;
 return pool[Math.floor(((fromId*97+pool.length*13)%pool.length+pool.length)%pool.length)].id;
}

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
 const palettes={
  clear:{bg:'#060c16',star:'#c2e5f1',tint:'#6aa8c0',nebulaAlpha:.55,lightning:false},
  nebula:{bg:'#0a0614',star:'#e2c4ff',tint:'#a56dff',nebulaAlpha:.92,lightning:false},
  storm:{bg:'#070812',star:'#d7e8ff',tint:'#6f8cff',nebulaAlpha:.85,lightning:true},
  ion:{bg:'#06141a',star:'#9ff0e0',tint:'#3fd0b8',nebulaAlpha:.7,lightning:false},
  dust:{bg:'#120c08',star:'#ffd4a8',tint:'#d08a4a',nebulaAlpha:.62,lightning:false},
  deep:{bg:'#04060f',star:'#8aa0c8',tint:'#4050a0',nebulaAlpha:.45,lightning:false}
 };
 const p=palettes[kind];
 return{kind,label:kind.toUpperCase(),hue:h%360,fog:0.18+(h%40)/200,...p};
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

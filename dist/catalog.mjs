export const RELEASE='2.0.0';
export const FACTIONS=[
 {id:'concord',name:'Orion Concord',color:'#8fdbc9',desc:'A coalition protecting trade and scientific access.',rival:'directorate'},
 {id:'directorate',name:'Cinder Directorate',color:'#efa778',desc:'An industrial power rewarding production and decisive force.',rival:'freeholds'},
 {id:'freeholds',name:'Outer Freeholds',color:'#a6b9f4',desc:'Independent frontier communities defending their own horizons.',rival:'concord'}
];
export const MODULES=Object.fromEntries([
 ['laser','Pulse cannon','weapon',950,'+7 pulse damage per grade',{damage:7}],
 ['shield','Shield matrix','shield',800,'+30 shield per grade',{shield:30}],
 ['engine','Vector thrusters','engine',700,'+28 m/s per grade',{speed:28}],
 ['drive','Fold drive','drive',1000,'+3 ly per grade',{range:3}],
 ['cargo','Cargo expansion','cargo',600,'+6 t per grade',{cargo:6}],
 ['cartographer','Cartographer array','survey',0,'+350 m scan range · 40% faster scans · +25% survey value',{scanRange:350,scanSpeed:.4,dataBonus:.25},'explorers'],
 ['pathfinder','Pathfinder drive','expedition',0,'+6 ly jump range · 15% less jump fuel',{range:6,fuelEfficiency:.15},'explorers'],
 ['deepfield','Deepfield spectrometer','surface',0,'+180 m surface range · +40% anomaly value',{surfaceRange:180,signalBonus:.4},'explorers'],
 ['merchant','Merchant exchange link','trade',0,'Better market prices · +6 t cargo',{buyDiscount:.06,sellBonus:.05,cargo:6},'traders'],
 ['foldrack','Folded cargo rack','freight',0,'+14 t cargo',{cargo:14},'traders'],
 ['convoy','Convoy bulkhead','armor',0,'+55 hull · +8 t cargo',{hull:55,cargo:8},'traders'],
 ['prospector','Prospector emitter','mining',0,'+1 ton per asteroid · +5 pulse damage',{miningYield:1,damage:5},'miners'],
 ['foundry','Foundry capacitor','power',0,'+40 shield · +8 pulse damage',{shield:40,damage:8},'miners'],
 ['seismic','Seismic array','surface',0,'+240 m surface range · 30% faster scans',{surfaceRange:240,scanSpeed:.3},'miners'],
 ['fieldwork','Fieldwork bay','support',0,'+25 hull · +6 t cargo',{hull:25,cargo:6},'freelancers'],
 ['outrider','Outrider shield','defense',0,'+65 shield · +15 m/s',{shield:65,speed:15},'freelancers'],
 ['wayfarer','Wayfarer thrusters','expedition',0,'+55 m/s · +2 ly range',{speed:55,range:2},'freelancers']
].map(([id,name,category,price,desc,bonus,guild])=>[id,{id,name,category,price,desc,bonus,guild,standard:price>0}]));
const quest=(name,desc,metric,count,reward,credits,good)=>({name,desc,metric,count,reward,credits,good});
export const GUILDS=[
 {id:'explorers',name:'Explorers Guild',color:'#8fe6d4',desc:'Chart unknown stars and the stories beneath them.',quests:[quest('A wider lens','Scan 3 new worlds after accepting.','surveys',3,'cartographer',900),quest('Beyond the lanterns','Discover 6 new systems in the Uncharted Reach.','discoveries',6,'pathfinder',1600),quest('Signals from below','Record 5 new surface anomalies.','anomalies',5,'deepfield',2400)]},
 {id:'traders',name:'Trading Guild',color:'#edc590',desc:'Keep the frontier supplied and make every hold count.',quests:[quest('Open for business','Earn 3,000 cr in commodity sales after accepting.','sales',3000,'merchant',900),quest('The last mile','Complete 3 delivery contracts.','deliveries',3,'foldrack',1500),quest('A lifeline in the dark','Bring 10 t of medical supplies to a guild desk.',null,10,'convoy',2800,'meds')]},
 {id:'miners',name:'Miners Guild',color:'#cead8e',desc:'Extract resources and survey the worlds beneath them.',quests:[quest('First seam','Mine 8 tons of resources after accepting.','mined',8,'prospector',800),quest('Crystal commission','Bring 5 t of void crystals to a guild desk.',null,5,'foundry',2400,'crystal'),quest('Read the rocks','Scan 3 new geological surface anomalies.','geology',3,'seismic',2200)]},
 {id:'freelancers',name:'Freelancer Guild',color:'#aebcf5',desc:'Take the odd jobs, stand your ground, and keep moving.',quests:[quest('A dependable pilot','Complete 2 station contracts after accepting.','contracts',2,'fieldwork',1000),quest('Cut the red tape','Defeat 4 pirates after accepting.','pirates',4,'outrider',1800),quest('Friends in far places','Complete 2 faction operations.','operations',2,'wayfarer',2500)]}
];
export const moduleSlots=id=>id==='mule'?7:6;
export function moduleBonuses(s){const result={hull:0,shield:0,speed:0,damage:0,range:0,cargo:0,fuel:0,scanRange:0,scanSpeed:0,dataBonus:0,signalBonus:0,surfaceRange:0,fuelEfficiency:0,miningYield:0,buyDiscount:0,sellBonus:0};for(const uid of s.loadouts?.[s.ship]||[]){const item=s.modules?.find(m=>m.uid===uid),def=item&&MODULES[item.kind];if(def)for(const [k,v]of Object.entries(def.bonus))result[k]+=v*item.grade;}return result;}
export function expandGalaxy(systems,rng){
 const names='Argent,Dawnward,Aurelia,Peregrine,Halcyon,Blackwater,Iskra,New Cascadia,Mistral,Sundog,Wellspring,Amaranth,Copperline,Juniper,Eos Gate,Tempest,Arcadia,Redwater,Northstar,Bellwether,Corsair,Nightingale,Cobalt,Vesper,Hearth,Saffron,Palisade,Solstice,Dovetail,Tamarack,Bluehaven,Wildrose,Lantern,Tidebreak,Opaline,Watchfall,Auric,Estuary,Mosslight,Threshold'.split(',');
 const slots=[];for(let row=0;row<8;row++)for(let col=0;col<8;col++)if(!(row<4&&col<6))slots.push({col,row});
 for(let id=24;id<192;id++){const r=rng(7731+id*127),u=id>=64,n=id-64,slot=slots[id-24];systems.push({id,name:u?['Silent','Distant','Hollow','Silver','Faint','Hidden','Drifting','Ancient'][n%8]+' '+['Harbor','Echo','Veil','Crown','Warden','Garden','Ember','Current','Signal','Beacon','Promise','Tide','Atlas','Horizon','Orbit','Dawn'][Math.floor(n/8)]:names[id-24],x:(u?68+n%16*8:slot.col*8)+(r()-.5)*2,y:(u?-4+Math.floor(n/16)*9:slot.row*9)+(r()-.5)*2,eco:['Agricultural','Extraction','Industrial','Research','Frontier'][id%5],danger:u?1+Math.floor(r()*3):id%4,station:u?'Expedition relay '+(Math.floor(n/16)+1):['Haven','Exchange','Anchorage','Terminal'][id%4]+' '+(id+1),color:['#ecc095','#a8d7fc','#f59c71','#ccbcff','#e9debb'][id%5],lore:u?'Beyond the shipping lanes, each signal could be a discovery.':'Settlements and freight routes connect this part of the frontier.',uncharted:u,hasStation:!u||n%16===0,faction:u?null:FACTIONS[Math.floor(id/4)%3].id,catalog:u?'UR-'+String(n+1).padStart(3,'0'):null});}
 for(const sys of systems.slice(0,24)){sys.uncharted=false;sys.hasStation=true;sys.faction=FACTIONS[Math.floor(sys.id/4)%3].id;}
}

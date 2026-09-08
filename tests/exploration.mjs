import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {Game,newSave,validateSave,SYSTEMS,getStats,dist,jumpDistance,findRoute} from '../dist/frontier.mjs';
import {readPilot,writePilot,SAVE_KEY,PRE_EXPLORATION_KEY} from '../dist/pilot-storage.mjs';
const tests=[];const test=(name,fn)=>tests.push([name,fn]);
const ticks=(g,seconds,input={})=>{for(let t=0;t<seconds;t+=1/30)g.update(1/30,input);};
const roundtrip=g=>new Game(validateSave(JSON.parse(JSON.stringify(g.serialize()))));
function frontier(){const g=new Game();g.s.system=65;g.s.docked=false;g.s.visited.push(65);g.makeSystem();g.player.x=g.star.x+g.star.r+950;g.player.y=g.star.y;return g;}
function nearStar(g,altitude){g.player.x=g.star.x+g.star.r+altitude;g.player.y=g.star.y;g.player.vx=g.player.vy=0;}
test('Radial chart surrounds the human core in every direction and every route is flyable',()=>{
 const core=SYSTEMS.filter(s=>!s.uncharted),reach=SYSTEMS.filter(s=>s.uncharted);
 assert.equal(core.length,64);assert.equal(reach.length,128);assert.deepEqual([SYSTEMS[0].x,SYSTEMS[0].y],[0,0]);
 for(let sector=0;sector<8;sector++)for(const region of [core,reach])assert(region.filter(s=>Math.floor((Math.atan2(s.y,s.x)+Math.PI)/(Math.PI/4))%8===sector).length>=3);
 assert(Math.max(...core.map(s=>Math.hypot(s.x,s.y)))<37);assert(Math.min(...reach.map(s=>Math.hypot(s.x,s.y)))>32);
 for(const s of SYSTEMS){let from=0;const route=findRoute(0,s.id,14);assert(route);for(const to of route){assert(jumpDistance(from,to)<=14);from=to;}assert.equal(from,s.id);}
});
test('Arrival is outside the scoop zone near the primary; reload preserves actual flight position',()=>{
 const g=new Game();g.launch();assert(g.jumpTo(1));ticks(g,3.1);assert.equal(g.target,g.star);assert(Math.abs(dist(g.player,g.star)-(g.star.r+950))<50);assert.equal(g.s.heat,25);ticks(g,1,{thrust:1});const h=roundtrip(g);assert.equal(h.player.x,g.player.x);assert.equal(h.player.y,g.player.y);
});
test('Pulse locates unknown worlds, resumes as unscanned after interruption, pays once and persists',()=>{
 let g=frontier();assert.equal(g.visiblePlanets.length,0);assert(!g.land());assert(g.discover());ticks(g,1);const progress=g.discoveryScan.progress;assert(!g.discover());assert.equal(g.discoveryScan.progress,progress);assert(!g.scanTarget());
 g=roundtrip(g);assert.equal(g.discoveryScan,null);assert.equal(g.visiblePlanets.length,0);assert(g.scanTarget());ticks(g,4.1);assert.equal(g.visiblePlanets.length,2);assert.equal(g.s.data,500);assert.equal(g.s.metrics.discoveries,1);assert(!g.discover());
 g=roundtrip(g);assert.equal(g.visiblePlanets.length,2);assert(!g.discover());assert.equal(g.s.data,500);g.s.system=0;g.makeSystem();g.player.x=0;g.player.y=180;const credits=g.s.credits;assert(g.dock());assert.equal(g.s.credits,credits);assert.equal(g.s.data,500);assert.equal(g.s.explorationLog.filter(e=>!e.sold).length,1);assert(g.sellExplorationData());assert.equal(g.s.credits,credits+500);assert.equal(g.s.data,0);assert(g.s.explorationLog.every(e=>e.sold));g.dock();assert(!g.sellExplorationData());assert.equal(g.s.credits,credits+500);
});
test('Discovery and world surveys cancel or reject during travel and require separate completion',()=>{
 const g=frontier();assert(g.discover());const next=SYSTEMS.find(s=>s.id!==g.s.system&&jumpDistance(g.s.system,s.id)<14).id;assert(g.jumpTo(next));assert.equal(g.discoveryScan,null);assert(!g.discover());assert(!g.scanTarget());assert(!g.scoop());assert(!g.dock());ticks(g,3.1);assert.equal(g.s.data,0);
 assert(g.discover());ticks(g,4.1);const p=g.planets[0];g.target=p;g.player.x=p.x;g.player.y=p.y+p.r+300;g.player.vx=101;assert(!g.scanTarget());g.player.vx=0;assert(g.scanTarget());ticks(g,1);const progress=g.scan.progress;assert(!g.scanTarget());assert.equal(g.scan.progress,progress);ticks(g,.1,{fire:true});assert.equal(g.scan,null);assert.equal(g.s.scanned.length,0);assert(g.scanTarget());ticks(g,3.1);assert(g.s.scanned.includes(p.id));assert.equal(g.s.scanned.length,1);assert(!g.scanTarget());assert(g.s.data>500);
});
test('Scooping varies with distance, stops at full capacity and rejects fast flight',()=>{
 const near=frontier(),far=frontier();for(const g of [near,far])g.s.fuel=0;nearStar(near,300);nearStar(far,580);assert(near.scoop());assert(far.scoop());ticks(near,2);ticks(far,2);assert(near.s.fuel>far.s.fuel);assert(near.s.heat>far.s.heat);assert(near.scoop());assert(!near.scooping);assert.equal(near.scoopRate,0);
 near.player.vx=120;assert(!near.scoop());near.player.vx=0;assert(near.scoop());near.player.x+=1500;ticks(near,.1);assert(!near.scooping);assert.equal(near.scoopRate,0);
 nearStar(far,310);ticks(far,30);assert.equal(far.s.fuel,getStats(far.s).fuel);assert(!far.scooping);assert(far.s.heat<80);assert(!far.scoop());
});
test('Stellar heat warns, retracts scoop, damages hull, cools with distance and survives reload',()=>{
 let g=frontier();g.s.fuel=0;nearStar(g,65);g.s.heat=89;assert(g.scoop());ticks(g,2);assert(!g.scooping);assert(g.s.heat>=95);assert(!g.scoop());const hot=g.s.heat;g=roundtrip(g);assert.equal(g.s.heat,hot);const hull=g.s.hull;ticks(g,3);assert(g.s.hull<hull);assert(dist(g.player,g.star)>=g.star.r+60);
 nearStar(g,1800);ticks(g,25);assert(g.s.heat<30);nearStar(g,300);assert(g.scoop());
});
test('Destroyed pilots recover from heat; docked and landed ships do not scoop',()=>{
 const g=frontier();nearStar(g,60);g.s.hull=.01;g.s.heat=145;g.s.cargo.ore=3;ticks(g,.1);assert(g.s.docked);assert(g.sys.hasStation);assert.equal(g.s.cargo.ore,0);assert.equal(g.s.heat,25);assert(!g.scoop());assert(!g.discover());
 g.launch();const p=g.planets[0];g.target=p;g.player.x=p.x;g.player.y=p.y+p.r+300;assert(g.land());assert(!g.scoop());assert(!g.discover());
});
test('Pre-update pilots keep progress and an immutable original backup; malformed new fields reject',()=>{
 const legacy=newSave();delete legacy.heat;delete legacy.systemScans;legacy.visited.push(65);legacy.metrics.discoveries=1;legacy.scanned.push('planet-65-0');legacy.data=650;legacy.route={destination:191,path:[1,191]};
 const raw=JSON.stringify(legacy),map=new Map([[SAVE_KEY,raw]]),storage={getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)};
 const boot=readPilot(storage);assert(boot.pilot);assert.deepEqual(boot.pilot.systemScans,[0,65]);assert.equal(boot.pilot.data,650);assert.equal(boot.pilot.metrics.discoveries,1);assert.equal(boot.pilot.heat,25);assert.deepEqual(boot.pilot.scanned,legacy.scanned);assert.equal(map.get(PRE_EXPLORATION_KEY),raw);
 const blocked={getItem:k=>k===SAVE_KEY?raw:null,setItem:()=>{throw Error('Storage full');}};const restored=readPilot(blocked);assert(restored.existing);assert(restored.error);assert.equal(restored.pilot.data,650);assert.throws(()=>writePilot(blocked,restored.pilot));
 assert.deepEqual(boot.pilot.route.path,findRoute(0,191,14));writePilot(storage,boot.pilot);readPilot(storage);assert.equal(map.get(PRE_EXPLORATION_KEY),raw);
 for(const fields of [{heat:-1},{heat:151},{heat:NaN},{systemScans:[999]},{systemScans:[1]}])assert.equal(validateSave({...boot.pilot,...fields}),null);
});
test('Cartographics preserves a mixed discovery manifest until an explicit one-time sale',()=>{
 const g=new Game();g.launch();assert(g.discover());ticks(g,4.1);const world=g.planets[0];g.target=world;g.player.x=world.x;g.player.y=world.y+world.r+300;assert(g.scanTarget());ticks(g,3.1);assert.equal(g.s.explorationLog.filter(e=>!e.sold).length,2);const expected=g.s.data,credits=g.s.credits;g.player.x=0;g.player.y=185;assert(g.dock());assert.equal(g.s.credits,credits);assert.equal(g.s.data,expected);let h=roundtrip(g);assert.equal(h.s.explorationLog.filter(e=>!e.sold).length,2);assert(h.sellExplorationData());assert.equal(h.s.credits,credits+expected);assert.equal(h.s.data,0);assert(h.s.explorationLog.every(e=>e.sold));assert(!h.sellExplorationData());assert.equal(h.s.credits,credits+expected);
});
test('Recovery and destruction discard unsold discovery entries while retaining sold history',()=>{
 const g=new Game();g.s.explorationLog=[{id:'sold',type:'legacy',system:0,name:'Sold cache',value:50,sold:true},{id:'pending',type:'legacy',system:0,name:'Pending cache',value:80,sold:false}];g.s.data=80;g.rescue();assert.equal(g.s.data,0);assert.deepEqual(g.s.explorationLog.map(e=>e.id),['sold']);
 g.launch();g.s.explorationLog.push({id:'pending-2',type:'legacy',system:0,name:'Pending cache 2',value:90,sold:false});g.s.data=90;g.s.hull=0;ticks(g,.1);assert(g.s.docked);assert.equal(g.s.data,0);assert.deepEqual(g.s.explorationLog.map(e=>e.id),['sold']);
 const invalid={...g.serialize(),explorationLog:[{id:'bad',type:'rumor',system:0,name:'Bad',value:1,sold:false}]};assert.equal(validateSave(invalid),null);
});
test('Living traffic performs distinct jobs and pauses at real destinations',()=>{
 const g=new Game();assert.deepEqual(g.traffic.map(t=>t.job),['ARRIVING FROM JUMP POINT','DEPARTING FOR JUMP POINT','MINING RUN','FUEL SCOOPING','PLANETARY SURVEY']);
 const start=g.traffic.map(t=>[t.x,t.y]);g.launch();ticks(g,4);assert(g.traffic.some((t,i)=>t.x!==start[i][0]||t.y!==start[i][1]));assert(g.traffic.some(t=>t.thrust>0));
 const miner=g.traffic.find(t=>t.job==='MINING RUN');ticks(g,30);assert(['MINING RUN','IN TRANSIT','DOCKED'].includes(miner.status));
 const scoop=g.traffic.find(t=>t.job==='FUEL SCOOPING');let worked=false;for(let i=0;i<1800;i++){g.update(1/30);if(scoop.status==='FUEL SCOOPING'&&scoop.thrust===0){worked=true;break;}}assert(worked);assert(Math.hypot(scoop.x-g.star.x,scoop.y-g.star.y)<g.star.r+650);
 const remote=frontier();remote.sys.hasStation=false;remote.makeSystem();assert.equal(remote.traffic.length,0);
});
test('Engine volume uses the full slider and stays silent at zero',()=>{
 const source=readFileSync(new URL('../dist/engine-audio.mjs',import.meta.url),'utf8');assert(source.includes('*.32'));assert(source.includes('Math.pow'));assert(!source.includes('*.24'));assert(!source.includes('*.065'));
});
test('Security responds to wanted attacks and assaults on innocent civilians',()=>{
 const g=new Game();g.launch();const civilian=g.traffic[0],wanted=g.enemies[0],patrol=g.patrols[0],remote=g.patrols[1];civilian.x=1100;civilian.y=900;wanted.x=1450;wanted.y=900;wanted.raidFire=0;remote.x=-2500;remote.y=-2500;const before=dist(patrol,wanted);g.update(.05);assert.equal(wanted.wanted,true);assert.equal(patrol.responseTarget,wanted.id);assert.equal(patrol.status,'RESPONDING');assert.equal(remote.responseTarget,null);assert.equal(remote.status,'PATROLLING');ticks(g,1);assert(dist(patrol,wanted)<before);assert(g.shots.some(b=>b.trafficShot&&b.enemy));
 const j=new Game();j.launch();const attacker=j.enemies[0],responder=j.patrols[0];j.traffic=[];j.player.x=1400;j.player.y=900;attacker.x=1700;attacker.y=900;attacker.fire=0;responder.x=1200;responder.y=900;j.update(.05);assert.equal(attacker.wanted,true);assert.equal(responder.responseTarget,attacker.id);
 const h=new Game();h.launch();const innocent=h.traffic[0],guard=h.patrols[0],rep=h.s.reputation[guard.faction];h.player.angle=0;innocent.x=h.player.x+280;innocent.y=h.player.y;h.target=innocent;h.shoot();ticks(h,.5);assert(innocent.hp<innocent.max);assert(h.playerCrimeUntil>h.time);assert.equal(h.s.bounty,400);assert.equal(h.s.reputation[guard.faction],rep-8);assert.equal(guard.responseTarget,'player');assert.equal(guard.status,'RESPONDING');guard.x=h.player.x+250;guard.y=h.player.y;guard.fire=0;h.update(.05);assert(h.shots.some(b=>b.security&&b.enemy));
});
test('Security kills award no bounty unless the player landed a shot',()=>{
 const securityShot=e=>({x:e.x-12,y:e.y,vx:600,vy:0,damage:9,enemy:false,ally:true,security:true,life:1.2});
 const g=new Game();g.launch();g.traffic=[];g.patrols=[];const enemy=g.enemies[0],credits=g.s.credits,pirates=g.s.metrics.pirates;g.enemies=[enemy];enemy.x=250;enemy.y=185;enemy.hp=1;g.shots=[securityShot(enemy)];g.update(.05);assert.equal(g.enemies.length,0);assert.equal(g.s.credits,credits);assert.equal(g.s.kills,0);assert.equal(g.s.metrics.pirates,pirates);assert(g.events.at(-1).text.includes('No bounty awarded'));
 const h=new Game();h.launch();h.traffic=[];h.patrols=[];const assisted=h.enemies[0],before=h.s.credits,startPirates=h.s.metrics.pirates;h.enemies=[assisted];assisted.x=250;assisted.y=185;assisted.hp=25;h.player.x=0;h.player.y=185;h.player.angle=0;h.shoot();ticks(h,.4);assert.equal(assisted.playerHit,true);assisted.hp=1;h.shots=[securityShot(assisted)];h.update(.05);assert.equal(h.enemies.length,0);assert.equal(h.s.credits,before+assisted.bounty);assert.equal(h.s.kills,1);assert.equal(h.s.metrics.pirates,startPirates+1);
});
test('Civilian destruction can yield loot, persists its bounty, and allows payment at a station',()=>{
 const g=new Game();g.launch();const civilian=g.traffic[0];civilian.x=g.player.x+250;civilian.y=g.player.y;civilian.hp=1;g.player.angle=0;g.target=civilian;const original=Math.random;Math.random=()=>0;try{g.shoot();ticks(g,.5);}finally{Math.random=original;}assert(!g.traffic.includes(civilian));assert.equal(g.s.bounty,1000);assert.equal(g.s.cargo.food,1);let h=roundtrip(g);assert.equal(h.s.bounty,1000);h.s.docked=true;h.s.credits=2000;assert(h.payBounty());assert.equal(h.s.bounty,0);assert.equal(h.s.credits,1000);assert(!h.payBounty());assert.equal(validateSave({...h.serialize(),bounty:-1}),null);
 const m=new Game();m.launch();const bystander=m.traffic[0];bystander.x=m.player.x+240;bystander.y=m.player.y;bystander.pause=10;m.player.angle=0;m.target=m.station;m.shoot();ticks(m,.4);assert(bystander.hp<bystander.max);assert.equal(m.s.bounty,400);
});
test('Player thrust and boost never control another ship’s exhaust',()=>{
 const g=new Game();g.launch();g.update(1/30,{thrust:1,boost:true});assert.equal(g.player.thrust,1);assert(g.player.boost);const patrol=g.patrols[0].thrust;g.update(1/30,{});assert.equal(g.player.thrust,0);assert(!g.player.boost);assert.equal(g.patrols[0].thrust,patrol);
 // Exercise the actual renderer without a browser or global game state.
 const source=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8'),fn=source.match(/function drawShip\([^\n]+/)[0];
 let flames=0;const ctx=new Proxy({}, {get:(_,key)=>key==='lineTo'?((x,y)=>{if(x<-24&&y===0)flames++;}):()=>{},set:()=>true});
 const sandbox={ctx,Math};vm.createContext(sandbox);vm.runInContext(fn+';this.drawShip=drawShip',sandbox);
 sandbox.drawShip(0,0,0,'white',19,false,0);assert.equal(flames,0);sandbox.drawShip(0,0,0,'white',19,false,1,true);assert.equal(flames,1);sandbox.drawShip(0,0,0,'white',19,false,0);assert.equal(flames,1);
});
test('Planets, stars and stations allow uninterrupted overflight',()=>{
 for(const kind of ['planet','star','station']){
  const g=new Game();g.launch();g.enemies=[];g.traffic=[];g.patrols=[];g.asteroids=[];
  const body=kind==='planet'?g.planets[0]:g[kind];
  g.player.x=body.x-5;g.player.y=body.y;g.player.vx=200;g.player.vy=0;
  g.update(.05);assert(g.player.x>body.x);assert(g.player.x<body.x+10);assert.equal(g.player.y,body.y);assert(g.player.vx>180);
  if(kind==='station')assert(g.dock());
  if(kind==='planet'){g.player.vx=0;g.target=body;assert(g.scanTarget());}
 }
});
test('Asteroids and every NPC class block contact, including boosted passes',()=>{
 for(const group of ['asteroids','enemies','traffic','patrols']){
  const g=new Game();g.launch();const body={...g[group][0],x:5000,y:5000};
  g.enemies=[];g.traffic=[];g.patrols=[];g.asteroids=[];g[group]=[body];
  const radius=g.player.r+body.r;g.player.x=body.x-radius+2;g.player.y=body.y;g.player.vx=100;g.player.vy=20;
  g.resolveFlightCollisions({x:body.x-radius-5,y:body.y});
  assert(dist(g.player,body)>=radius);assert(g.player.vx<=0);assert.equal(g.player.vy,20);
  g.player.x=body.x+radius+100;g.player.y=body.y;g.player.vx=1000;
  g.resolveFlightCollisions({x:body.x-radius-100,y:body.y});assert(g.player.x<body.x-radius);assert.equal(g.player.vx,0);
  g.player.x=body.x;g.player.y=body.y;g.resolveFlightCollisions({...g.player});assert(Number.isFinite(g.player.x));assert(dist(g.player,body)>=radius);
 }
 const g=new Game();g.launch();g.enemies=[];g.traffic=[];g.patrols=[];const rock=g.asteroids[0];g.asteroids=[rock];g.player.x=rock.x-rock.r-g.player.r-1;g.player.y=rock.y;g.player.vx=200;g.update(.05);assert(dist(g.player,rock)>=rock.r+g.player.r);
});
let failed=0;for(const [name,fn]of tests){try{fn();console.log('PASS '+name);}catch(e){failed++;console.error('FAIL '+name,e);}}console.log(`\n${tests.length-failed} / ${tests.length} exploration checks passed.`);if(failed)process.exitCode=1;

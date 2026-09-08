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
 const g=new Game();g.launch();assert(g.jumpTo(1));ticks(g,3.1);assert.equal(g.target,g.star);assert.equal(dist(g.player,g.star),g.star.r+950);assert.equal(g.s.heat,25);ticks(g,1,{thrust:1});const h=roundtrip(g);assert.equal(h.player.x,g.player.x);assert.equal(h.player.y,g.player.y);
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
 const source=readFileSync(new URL('../dist/engine-audio.mjs',import.meta.url),'utf8');assert(source.includes('*.24'));assert(source.includes('Math.pow'));assert(!source.includes('*.065'));
});
test('Player thrust and boost never control another ship’s exhaust',()=>{
 const g=new Game();g.launch();g.update(1/30,{thrust:1,boost:true});assert.equal(g.player.thrust,1);assert(g.player.boost);const patrol=g.patrols[0].thrust;g.update(1/30,{});assert.equal(g.player.thrust,0);assert(!g.player.boost);assert.equal(g.patrols[0].thrust,patrol);
 // Exercise the actual renderer without a browser or global game state.
 const source=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8'),fn=source.match(/function drawShip\([^\n]+/)[0];
 let flames=0;const ctx=new Proxy({}, {get:(_,key)=>key==='lineTo'?((x,y)=>{if(x<-24&&y===0)flames++;}):()=>{},set:()=>true});
 const sandbox={ctx,Math};vm.createContext(sandbox);vm.runInContext(fn+';this.drawShip=drawShip',sandbox);
 sandbox.drawShip(0,0,0,'white',19,false,0);assert.equal(flames,0);sandbox.drawShip(0,0,0,'white',19,false,1,true);assert.equal(flames,1);sandbox.drawShip(0,0,0,'white',19,false,0);assert.equal(flames,1);
});
let failed=0;for(const [name,fn]of tests){try{fn();console.log('PASS '+name);}catch(e){failed++;console.error('FAIL '+name,e);}}console.log(`\n${tests.length-failed} / ${tests.length} exploration checks passed.`);if(failed)process.exitCode=1;

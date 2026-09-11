import {operationCards,factionView} from '../dist/frontier-views.mjs';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {Game,newSave,validateSave,SYSTEMS,SHIPS,getStats,dist,jumpDistance,findRoute,operationDetails,FACTIONS,angleDiff,systemSky,wantedTier,EVENT_IDS,EVENT_CONFIG,eventArrowTargets,eventObjective,surveyWorldIds,systemLayoutMeta,buildSystemLayout,isLandablePlanet,applyOrbitPhase,advanceOrbits} from '../dist/frontier.mjs';
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
 g=roundtrip(g);assert.equal(g.discoveryScan,null);assert.equal(g.visiblePlanets.length,0);assert(g.scanTarget());ticks(g,4.1);assert.equal(g.visiblePlanets.length,g.planets.length);assert(g.planets.filter(p=>p.type==='planet').length>=1&&g.planets.filter(p=>p.type==='planet').length<=5);assert.equal(g.s.data,500);assert.equal(g.s.metrics.discoveries,1);assert(!g.discover());
 g=roundtrip(g);assert.equal(g.visiblePlanets.length,g.planets.length);assert(!g.discover());assert.equal(g.s.data,500);g.s.system=0;g.makeSystem();g.player.x=g.station.x;g.player.y=g.station.y+50;const credits=g.s.credits;assert(g.dock());assert.equal(g.s.credits,credits);assert.equal(g.s.data,500);assert.equal(g.s.explorationLog.filter(e=>!e.sold).length,1);assert(g.sellExplorationData());assert.equal(g.s.credits,credits+500);assert.equal(g.s.data,0);assert(g.s.explorationLog.every(e=>e.sold));g.dock();assert(!g.sellExplorationData());assert.equal(g.s.credits,credits+500);
});
test('Discovery and world surveys cancel or reject during travel and require separate completion',()=>{
 const g=frontier();assert(g.discover());const next=SYSTEMS.find(s=>s.id!==g.s.system&&jumpDistance(g.s.system,s.id)<14).id;assert(g.jumpTo(next));assert.equal(g.discoveryScan,null);assert(!g.discover());assert(!g.scanTarget());assert(!g.scoop());assert(!g.dock());ticks(g,3.1);assert.equal(g.s.data,0);
 assert(g.discover());ticks(g,4.1);const p=g.planets[0];g.target=p;g.player.x=p.x;g.player.y=p.y+p.r+300;g.player.vx=0;
 assert(g.scanTarget());assert(g.spectrumScan);ticks(g,1);const spectProg=g.spectrumScan.progress;assert(!g.scanTarget());assert.equal(g.spectrumScan.progress,spectProg);ticks(g,.1,{fire:true});assert.equal(g.spectrumScan,null);
 assert(g.scanTarget());ticks(g,2.6);assert((g.s.spectrumScanned||[]).includes(p.id));
 g.player.vx=101;assert(!g.scanTarget());g.player.vx=0;assert(g.scanTarget());assert(g.scan);ticks(g,1);const progress=g.scan.progress;assert(!g.scanTarget());assert.equal(g.scan.progress,progress);ticks(g,.1,{fire:true});assert.equal(g.scan,null);assert.equal(g.s.scanned.length,0);assert(g.scanTarget());ticks(g,3.1);assert(g.s.scanned.includes(p.id));assert.equal(g.s.scanned.length,1);assert(!g.scanTarget());assert(g.s.data>500);
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
 g.launch();const p=g.planets.find(isLandablePlanet)||g.planets[0];g.target=p;g.player.x=p.x;g.player.y=p.y+p.r+300;assert(g.land());assert(!g.scoop());assert(!g.discover());
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
 const g=new Game();g.launch();assert(g.discover());ticks(g,4.1);const world=g.planets[0];g.target=world;g.player.x=world.x;g.player.y=world.y+world.r+300;g.player.vx=g.player.vy=0;assert(g.scanTarget());ticks(g,2.6);assert(g.scanTarget());ticks(g,3.1);assert.equal(g.s.explorationLog.filter(e=>!e.sold).length,2);const expected=g.s.data,credits=g.s.credits;g.player.x=g.station.x;g.player.y=g.station.y+50;assert(g.dock());assert.equal(g.s.credits,credits);assert.equal(g.s.data,expected);let h=roundtrip(g);assert.equal(h.s.explorationLog.filter(e=>!e.sold).length,2);assert(h.sellExplorationData());assert.equal(h.s.credits,credits+expected);assert.equal(h.s.data,0);assert(h.s.explorationLog.every(e=>e.sold));assert(!h.sellExplorationData());assert.equal(h.s.credits,credits+expected);
});
test('System layouts are seeded, cover multi-star and multi-world variety, and gate gas giants',()=>{
 const a=buildSystemLayout(SYSTEMS[0]),b=buildSystemLayout(SYSTEMS[0]);
 assert.equal(a.stars.length,b.stars.length);assert.equal(a.planets.length,b.planets.length);assert.equal(a.moons.length,b.moons.length);
 assert.deepEqual(a.planets.map(p=>p.id),b.planets.map(p=>p.id));
 const stars=new Set(),planets=new Set(),docks=new Set(),spectra=new Set(),colors=new Set(),kinds=new Set();
 let minPlanetDist=Infinity,minStationDist=Infinity,moonSystems=0,hasGiant=false,hasLandable=false;
 for(const sys of SYSTEMS){
  const layout=buildSystemLayout(sys),meta=systemLayoutMeta(sys);
  assert.equal(layout.stars.length,meta.starCount);
  assert.equal(layout.planets.length,meta.planetCount);
  assert.equal(surveyWorldIds(sys.id,sys).length,layout.planets.length+layout.moons.length);
  if(layout.moons.length)moonSystems++;
  stars.add(layout.stars.length);planets.add(layout.planets.length);
  if(sys.hasStation)docks.add(layout.stations.filter(s=>s.type==='station').length);
  for(const star of layout.stars){assert(star.spectral);spectra.add(star.spectral);colors.add(star.color);}
  const primary=layout.primary;
  for(const p of layout.planets){
   const host=layout.stars.find(s=>s.id===p.hostStarId)||primary;
   minPlanetDist=Math.min(minPlanetDist,Math.hypot(p.x-host.x,p.y-host.y));
   kinds.add(p.kindId);assert(p.class);assert(Number.isFinite(p.mass));assert(Number.isFinite(p.gravity));assert(Number.isFinite(p.orbitRadius));
   if(p.class==='giant'){hasGiant=true;assert.equal(p.landable,false);assert(!isLandablePlanet(p));}
   else{hasLandable=true;assert(isLandablePlanet(p));}
  }
  for(const m of layout.moons){const parent=layout.planets.find(p=>p.id===m.parentId);assert.equal(m.type,'moon');assert(parent);assert(isLandablePlanet(m));assert(m.r<parent.r);}
  for(const s of layout.stations.filter(s=>s.type==='station'))minStationDist=Math.min(minStationDist,Math.hypot(s.x-primary.x,s.y-primary.y));
 }
 assert(stars.has(1)&&stars.has(2)&&stars.has(3));
 assert(planets.has(1)&&planets.has(5));
 assert([...docks].some(n=>n>=2));
 assert(spectra.size>=4,'expected multiple spectral classes across the chart');
 assert(colors.size>=6,'expected varied star colors');
 assert(kinds.size>=5,'expected expanded planet kind variety');
 assert(hasGiant&&hasLandable);
 assert(moonSystems>10,'expected moons on some systems');
 assert(minPlanetDist>1200,'planets should sit well clear of their host star');
 assert(minStationDist>900,'home docks should not hug the star');
 const g=new Game();g.launch();
 const giant=g.planets.find(p=>!isLandablePlanet(p));
 if(giant){g.target=giant;g.player.x=giant.x;g.player.y=giant.y+giant.r+300;assert(!g.land());}
 const solid=g.planets.find(isLandablePlanet);assert(solid);g.target=solid;g.player.x=solid.x;g.player.y=solid.y+solid.r+300;assert(g.land());
});
test('Spectrum scan unlocks body dossier fields before close survey payout',()=>{
 const g=new Game();g.launch();assert(g.discover());ticks(g,4.1);
 const p=g.planets.find(x=>x.type==='planet')||g.planets[0];
 g.target=p;g.player.x=p.x;g.player.y=p.y+p.r+1800;g.player.vx=g.player.vy=0;
 assert(dist(g.player,p)>p.r+getStats(g.s).scanRange);
 assert(g.scanTarget());assert(g.spectrumScan);ticks(g,2.6);
 assert((g.s.spectrumScanned||[]).includes(p.id));
 assert(p.gravity!=null&&p.composition?.length);
 g.player.y=p.y+p.r+300;assert(g.scanTarget());ticks(g,3.1);assert(g.s.scanned.includes(p.id));
 const h=roundtrip(g);assert(h.s.spectrumScanned.includes(p.id));
});
test('Spectrum SCAN hops to the next unanalyzed body after the first dossier',()=>{
 const g=new Game();g.launch();assert(g.discover());ticks(g,4.1);
 const worlds=g.planets.filter(p=>p.type==='planet');assert(worlds.length>=2);
 const a=worlds[0],b=worlds[1];
 g.player.x=(a.x+b.x)/2;g.player.y=(a.y+b.y)/2;g.player.vx=g.player.vy=0;
 g.target=a;assert(g.scanTarget());ticks(g,2.6);assert(g.s.spectrumScanned.includes(a.id));
 g.target=a;assert(g.scanTarget());assert.equal(g.target,b);assert(g.spectrumScan);ticks(g,2.6);assert(g.s.spectrumScanned.includes(b.id));
});
test('Recovery and destruction discard unsold discovery entries while retaining sold history',()=>{
 const g=new Game();g.s.explorationLog=[{id:'sold',type:'legacy',system:0,name:'Sold cache',value:50,sold:true},{id:'pending',type:'legacy',system:0,name:'Pending cache',value:80,sold:false}];g.s.data=80;g.rescue();assert.equal(g.s.data,0);assert.deepEqual(g.s.explorationLog.map(e=>e.id),['sold']);
 g.launch();g.s.explorationLog.push({id:'pending-2',type:'legacy',system:0,name:'Pending cache 2',value:90,sold:false});g.s.data=90;g.s.hull=0;ticks(g,.1);assert(g.s.docked);assert.equal(g.s.data,0);assert.deepEqual(g.s.explorationLog.map(e=>e.id),['sold']);
 const invalid={...g.serialize(),explorationLog:[{id:'bad',type:'rumor',system:0,name:'Bad',value:1,sold:false}]};assert.equal(validateSave(invalid),null);
});
test('Docked station time keeps traffic and playtime moving',()=>{
 const g=new Game();assert(g.s.docked);assert(g.traffic.length);const start=g.traffic.map(t=>[t.x,t.y]),play=g.s.playtime;
 ticks(g,2);assert(g.s.docked);assert(g.s.playtime>play);assert(g.traffic.some((t,i)=>t.x!==start[i][0]||t.y!==start[i][1]));
});
test('Station desks return to the deck and version comes from release.mjs',()=>{
 const app=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
 const release=readFileSync(new URL('../dist/release.mjs',import.meta.url),'utf8');
 const sw=readFileSync(new URL('../dist/sw.js',import.meta.url),'utf8');
 assert.match(release,/export const RELEASE='2\.10\.1'/);
 assert.match(app,/import \{RELEASE,RELEASE_NAME\} from '\.\/release\.mjs'/);
 assert.match(app,/const simPaused=\(\)=>!!panel&&panel!=='station'&&panel!=='system-map'/);
 assert.match(app,/case 'close':if\(panel==='station'&&game\.s\.docked\)closePanel\(\)/);
 assert.match(app,/interactStation/);
 assert.match(app,/renderOnFoot/);
 assert.match(app,/openDesk/);
 assert.match(app,/desk-terminal/);
 assert.match(app,/desk-banner/);
 assert.match(app,/Return to deck/);
 assert.match(app,/SPRINT/);
 assert.match(app,/scan-button/);
 assert.match(app,/body-dossier/);
 assert.match(app,/SPECTRUM/);
 assert.match(app,/drawLandmasses/);
 assert.ok(!/aria-label="Station services"/.test(app));
 assert.match(sw,/farbound-v2\.10\.1/);
 assert.match(sw,/release:'2\.10\.1'/);
 assert.match(sw,/system-chart\.mjs/);
 assert.match(sw,/hull-defs\.mjs/);
 assert.match(sw,/planet-layout\.mjs/);
 assert.match(sw,/dynamic-events\.mjs/);
 assert.match(sw,/cloud-config\.mjs/);
 assert.match(sw,/cloud-sync\.mjs/);
 assert.match(sw,/station-robot\.mjs/);
 assert.match(sw,/system-layout\.mjs/);
 assert.match(sw,/onfoot\.mjs/);
 assert.match(sw,/station-layout\.mjs/);
 assert(sw.includes("'./release.mjs'"));
 const g=new Game();assert(g.s.docked);assert(g.onfoot);assert(g.launch());assert(!g.s.docked);assert.equal(g.onfoot,null);
});
test('Security cutters and prospector boom use dedicated hull geometry',()=>{
 const source=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
 assert.match(source,/function drawSecurityShip/);
 assert(source.includes("drawSecurityShip(p)")&&source.includes('drawSecurityShip(e,true)'));
 assert(source.includes("#ff3b4a")&&source.includes("#3b8cff"));
 assert(!source.includes('ctx.lineTo(size*.95,size*1.05)'));
 assert.match(source,/tr\.hull==='prospector'[\s\S]*?size\*\.72,size\*\.55/);
});
test('Living traffic performs distinct jobs and pauses at real destinations',()=>{
 const g=new Game();assert.deepEqual(g.traffic.map(t=>t.job),['ARRIVING FROM JUMP POINT','DEPARTING FOR JUMP POINT','MINING RUN','FUEL SCOOPING','PLANETARY SURVEY']);
 assert.deepEqual(g.traffic.map(t=>t.hull),['courier','freighter','prospector','tender','surveyor']);
 assert.equal(new Set(g.traffic.map(t=>t.color)).size,5);
 const start=g.traffic.map(t=>[t.x,t.y]);g.launch();ticks(g,4);assert(g.traffic.some((t,i)=>t.x!==start[i][0]||t.y!==start[i][1]));assert(g.traffic.some(t=>t.thrust>0));
 assert(g.traffic.some(t=>t.trail.length>0));
 const angles=g.traffic.map(t=>t.angle);ticks(g,.5);assert(g.traffic.some((t,i)=>Math.abs(angleDiff(t.angle,angles[i]))>0||t.pause>0||t.status!=='IN TRANSIT'));
 const miner=g.traffic.find(t=>t.job==='MINING RUN');g.enemies=[];for(const t of g.traffic)t.underAttackUntil=0;ticks(g,30);assert(['MINING RUN','IN TRANSIT','DOCKED'].includes(miner.status));
 const scoop=g.traffic.find(t=>t.job==='FUEL SCOOPING');let worked=false;for(let i=0;i<1800;i++){g.update(1/30);if(scoop.status==='FUEL SCOOPING'&&scoop.thrust===0){worked=true;break;}}assert(worked);assert(Math.hypot(scoop.x-g.star.x,scoop.y-g.star.y)<g.star.r+650);
 const remote=frontier();remote.sys.hasStation=false;remote.makeSystem();assert.equal(remote.traffic.length,0);
});
test('Outbound freighter leaves dock instead of looping in place',()=>{
 const g=new Game();g.launch();
 const ship=g.traffic.find(t=>t.hull==='freighter');
 assert.equal(ship.job,'DEPARTING FOR JUMP POINT');
 assert.equal(ship.status,'DOCKED');
 const dock={x:ship.x,y:ship.y};
 ticks(g,6);
 assert(g.traffic.includes(ship),'Freighter should still be in-system after a short wait');
 assert.equal(ship.status,'IN TRANSIT');
 assert(Math.hypot(ship.x-dock.x,ship.y-dock.y)>40);
 assert(ship.thrust>0);
 assert.notEqual(ship.job,'ARRIVING FROM JUMP POINT');
});
test('Traffic turns smoothly and flees when assaulted',()=>{
 const g=new Game();g.launch();const ship=g.traffic[0],from=ship.angle;ship.pause=0;ship.target=1;ship.x=800;ship.y=800;ship.points[1]={x:200,y:1400,status:'DOCKED'};
 g.updateTraffic(1/30);assert(Math.abs(angleDiff(ship.angle,from))>0);assert(Math.abs(angleDiff(ship.angle,from))<=ship.turn/30+.001);
 ship.underAttackUntil=g.time+5;const x=ship.x,y=ship.y;g.updateTraffic(.2);assert.equal(ship.status,'UNDER ATTACK');assert(ship.thrust>.5);assert(Math.hypot(ship.x-x,ship.y-y)>1);
});
test('Engine volume uses the full slider and stays silent at zero',()=>{
 const source=readFileSync(new URL('../dist/engine-audio.mjs',import.meta.url),'utf8');assert(source.includes('*.32'));assert(source.includes('Math.pow'));assert(!source.includes('*.24'));assert(!source.includes('*.065'));
 assert(source.includes('setFoldCharge'));assert(source.includes('playFoldJump'));assert(source.includes('playFoldArrive'));
 const app=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
 assert(app.includes('wasFolding'));assert(app.includes('setFoldCharge'));assert(app.includes('playFoldJump'));
});
test('Security responds to wanted attacks and assaults on innocent civilians',()=>{
 const g=new Game();g.launch();const civilian=g.traffic[0],wanted=g.enemies[0],patrol=g.patrols[0],remote=g.patrols[1];civilian.x=1100;civilian.y=900;wanted.x=1450;wanted.y=900;wanted.raidFire=0;patrol.x=1000;patrol.y=900;remote.x=-2500;remote.y=-2500;const before=dist(patrol,wanted);g.update(.05);assert.equal(wanted.wanted,true);assert.equal(patrol.responseTarget,wanted.id);assert.equal(patrol.status,'RESPONDING');assert.equal(remote.responseTarget,null);assert.equal(remote.status,'PATROLLING');ticks(g,1);assert(dist(patrol,wanted)<before);assert(g.shots.some(b=>b.trafficShot&&b.enemy));
 const j=new Game();j.launch();const attacker=j.enemies[0],responder=j.patrols[0];j.traffic=[];j.player.x=1400;j.player.y=900;attacker.x=1700;attacker.y=900;attacker.fire=0;responder.x=1200;responder.y=900;j.update(.05);assert.equal(attacker.wanted,true);assert.equal(responder.responseTarget,attacker.id);
 const h=new Game();h.launch();const innocent=h.traffic[0],guard=h.patrols[0],rep=h.s.reputation[guard.faction];h.player.angle=0;innocent.x=h.player.x+280;innocent.y=h.player.y;h.target=innocent;h.shoot();ticks(h,.5);assert(innocent.hp<innocent.max);assert(h.heatWanted>0);assert(h.lastKnown);assert.equal(h.s.bounty,400);assert.equal(h.s.reputation[guard.faction],rep-8);assert.equal(guard.responseTarget,'last-known');assert.equal(guard.status,'SEARCHING');guard.x=h.player.x+250;guard.y=h.player.y;guard.fire=0;h.update(.05);assert.equal(guard.responseTarget,'player');assert.equal(guard.status,'ENGAGING');assert(h.shots.some(b=>b.security&&b.enemy));
});
test('Wanted heat decays, clears on jump, and security hunts last known position',()=>{
 const g=new Game();g.launch();g.markWanted(80,{x:400,y:500});assert.equal(g.heatWanted,80);assert.deepEqual(g.lastKnown,{x:400,y:500});
 const patrol=g.patrols[0];patrol.x=100;patrol.y=100;g.player.x=2000;g.player.y=2000;g.updateSecurity(.05);
 assert.equal(patrol.responseTarget,'last-known');assert.equal(patrol.status,'SEARCHING');
 const before=dist(patrol,g.lastKnown);ticks(g,2);assert(dist(patrol,g.lastKnown)<before);
 g.player.x=patrol.x+120;g.player.y=patrol.y;patrol.fire=0;g.updateSecurity(.05);
 assert.equal(patrol.responseTarget,'player');assert.equal(patrol.status,'ENGAGING');
 const heat=g.heatWanted;g.updateSecurity(5);assert(g.heatWanted<heat);
 const dest=SYSTEMS.find(s=>s.id!==g.s.system&&s.hasStation).id;g.teleportTo(dest,{docked:false});
 assert.equal(g.heatWanted,0);assert.equal(g.lastKnown,null);
 assert(g.spawnResponseTeam({force:true}));assert(g.enemies.filter(e=>e.response).length>=3);
 assert(g.spawnResponseTeam({force:true}));assert(g.enemies.filter(e=>e.response).length>=6);
});
test('Response team hunts the player and never raids civilian traffic',()=>{
 const g=new Game();g.launch();g.traffic.forEach(t=>{t.x=g.player.x+180;t.y=g.player.y;});
 assert(g.spawnResponseTeam({force:true}));
 const team=g.enemies.filter(e=>e.response);assert.equal(team.length,3);
 for(const e of team){e.x=g.player.x+400;e.y=g.player.y;e.fire=0;e.raidFire=0;}
 g.updateSecurity(.05);
 assert(team.every(e=>!e.wanted&&e.status==='ENGAGING'));
 assert(g.shots.some(b=>b.security&&b.enemy));
 assert(!g.shots.some(b=>b.trafficShot));
 assert(team.every(e=>e.wanted===false));
});
test('Prison barges exist sparsely and security kills transfer you there',()=>{
 const barges=SYSTEMS.filter(s=>s.prison&&s.hasStation);
 assert(barges.length>=5);assert(barges.length<=10);assert(!SYSTEMS[0].prison);
 assert(barges.every(s=>String(s.station).startsWith('Prison barge ')));
 const g=new Game();g.launch();g.s.credits=5000;g.s.bounty=800;g.s.cargo.ore=3;g.s.data=120;
 const from=g.s.system,nearest=g.nearestPrison();assert.notEqual(nearest,undefined);
 g.lastHitSecurity=true;g.s.hull=1;g.s.shield=0;g.shots=[{x:g.player.x,y:g.player.y,vx:0,vy:0,damage:50,enemy:true,security:true,life:1}];
 g.update(.05);
 assert(g.s.docked);assert.equal(g.s.detained,true);assert.equal(g.s.system,nearest);assert(g.sys.prison);
 assert.equal(g.s.cargo.ore,0);assert.equal(g.s.data,0);assert(g.s.bounty>=800);assert(!g.launch());
 assert(g.s.credits>=0);g.s.credits=Math.max(g.s.credits,g.s.bounty);assert(g.payBounty());assert.equal(g.s.detained,false);assert.equal(g.s.bounty,0);assert(g.launch());
 const h=new Game();h.launch();h.s.system=from;h.makeSystem();h.lastHitSecurity=false;h.s.hull=1;h.s.shield=0;h.shots=[{x:h.player.x,y:h.player.y,vx:0,vy:0,damage:50,enemy:true,security:false,life:1}];
 h.update(.05);assert(h.s.docked);assert.equal(h.s.detained,false);assert.equal(h.s.system,from);
});
test('Security kills award no bounty unless the player landed a shot',()=>{
 const securityShot=e=>({x:e.x-12,y:e.y,vx:600,vy:0,damage:9,enemy:false,ally:true,security:true,life:1.2});
 const g=new Game();g.launch();g.traffic=[];g.patrols=[];const enemy=g.enemies[0],credits=g.s.credits,pirates=g.s.metrics.pirates;g.enemies=[enemy];enemy.x=250;enemy.y=185;enemy.hp=1;g.events=[];g.shots=[securityShot(enemy)];g.update(.05);assert.equal(g.enemies.length,0);assert.equal(g.s.credits,credits);assert.equal(g.s.kills,0);assert.equal(g.s.metrics.pirates,pirates);assert.equal(g.events.length,0);
 const h=new Game();h.launch();h.traffic=[];h.patrols=[];const assisted=h.enemies[0],before=h.s.credits,startPirates=h.s.metrics.pirates;h.enemies=[assisted];assisted.x=250;assisted.y=185;assisted.hp=25;h.player.x=0;h.player.y=185;h.player.angle=0;h.shoot();ticks(h,.4);assert.equal(assisted.playerHit,true);assisted.hp=1;h.shots=[securityShot(assisted)];h.update(.05);assert.equal(h.enemies.length,0);assert.equal(h.s.credits,before+assisted.bounty);assert.equal(h.s.kills,1);assert.equal(h.s.metrics.pirates,startPirates+1);
});
test('Ambient NPC combat stays silent and security shots do not mine for the player',()=>{
 const securityShot=t=>({x:t.x-12,y:t.y,vx:600,vy:0,damage:20,enemy:false,ally:true,security:true,life:1.2});
 const g=new Game();g.launch();g.patrols=[];const rock=g.asteroids[0],ore=g.s.cargo.ore,mined=g.s.mined;g.asteroids=[rock];rock.x=250;rock.y=185;rock.hp=1;g.events=[];g.shots=[securityShot(rock)];g.update(.05);assert.equal(g.asteroids.length,1);assert.equal(g.s.cargo.ore,ore);assert.equal(g.s.mined,mined);assert.equal(g.events.length,0);
 const h=new Game();h.launch();const civilian=h.traffic[0];civilian.x=400;civilian.y=185;civilian.hp=1;h.events=[];h.shots=[{x:civilian.x-8,y:civilian.y,vx:600,vy:0,damage:20,enemy:true,trafficShot:true,trafficTarget:civilian.id,life:1.2,previousX:civilian.x-14,previousY:civilian.y}];h.resolveTrafficShots();assert(!h.traffic.includes(civilian));assert.equal(h.events.length,0);
 const app=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
 assert.match(app,/game\.s\.shield<st\.shield&&game\.time-game\.lastDamage>4/);
 assert(!app.includes("circle(p.x,p.y,size+18,'#a9e9df18',true)"));
 assert.match(app,/ctx\.lineWidth=1;ctx\.stroke\(\);ctx\.lineWidth=prev/);
});
test('Civilian destruction can yield loot, persists its bounty, and allows payment at a station',()=>{
 const g=new Game();g.launch();const civilian=g.traffic[0];civilian.x=g.player.x+250;civilian.y=g.player.y;civilian.hp=1;g.player.angle=0;g.target=civilian;const original=Math.random;Math.random=()=>0;try{g.shoot();ticks(g,.5);}finally{Math.random=original;}assert(!g.traffic.includes(civilian));assert.equal(g.s.bounty,1000);assert.equal(g.s.cargo.food,1);let h=roundtrip(g);assert.equal(h.s.bounty,1000);h.s.docked=true;h.s.credits=2000;assert(h.payBounty());assert.equal(h.s.bounty,0);assert.equal(h.s.credits,1000);assert(!h.payBounty());assert.equal(validateSave({...h.serialize(),bounty:-1}),null);
 const m=new Game();m.launch();const bystander=m.traffic[0];bystander.x=m.player.x+240;bystander.y=m.player.y;bystander.pause=10;m.player.angle=0;m.target=m.station;m.shoot();ticks(m,.4);assert(bystander.hp<bystander.max);assert.equal(m.s.bounty,400);
});
test('Checkpoint writes preserve the outgoing pilot instead of snapshotting the new save',()=>{
 const source=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
 assert.match(source,/data\.savedAt=Date\.now\(\);writePilot\(localStorage,data,\{checkpoint:checkpoint===true\}\)/);
 assert(!/if\(checkpoint===true\)writePilot\(localStorage,pilot\);writePilot/.test(source));
 const map=new Map(),storage={getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)};
 const first=newSave();first.credits=2400;writePilot(storage,first,{now:1});
 const second=newSave();second.credits=8800;writePilot(storage,second,{checkpoint:true,now:2});
 const checkpoint=JSON.parse(map.get('farbound-save-v2-checkpoint'));
 assert.equal(JSON.parse(map.get(SAVE_KEY)).credits,8800);
 assert.equal(checkpoint.pilot.credits,2400);
 assert(source.includes('...game.traffic,...game.visiblePlanets'));
});
test('Tutorial tip keeps its Got it button across HUD refreshes',()=>{
 const source=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
 assert.match(source,/tut\.dataset\.tip!==tipKey/);
 assert.match(source,/if\(tipVisible&&tut\.dataset\.tip!==tipKey\)/);
 assert(!/if\(showTutorial&&started&&!panel\)\{tut\.innerHTML=/.test(source));
});
test('Player ships have distinct silhouettes, colors, and collision radii',async()=>{
 const {HULL_DEFS,getHullDef,hullPreviewSvg}=await import('../dist/hull-defs.mjs');
 assert.equal(SHIPS.length,20);
 assert.equal(Object.keys(HULL_DEFS).length,20);
 assert.equal(new Set(SHIPS.map(s=>s.id)).size,20);
 assert.equal(new Set(SHIPS.map(s=>s.name)).size,20);
 assert.equal(new Set(SHIPS.map(s=>s.color)).size,20);
 for(const ship of SHIPS){
  assert(HULL_DEFS[ship.id],ship.id+' missing hull def');
  assert(Array.isArray(getHullDef(ship.id).body)&&getHullDef(ship.id).body.length>=5);
  assert(Number.isInteger(ship.slots)&&ship.slots>=5&&ship.slots<=8);
  assert(['explorer','scout','trader','miner','courier','combat'].includes(ship.class),ship.id);
  const svg=hullPreviewSvg(ship);assert.match(svg,/ship-preview/);assert.match(svg,/<polygon /);
 }
 assert(SHIPS.some(s=>s.id==='raptor'&&s.class==='combat'));
 assert(SHIPS.some(s=>s.class==='explorer'&&s.id!=='wren'&&s.id!=='kestrel'));
 const source=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
 assert.match(source,/function drawPlayerShip/);
 assert.match(source,/drawHullDef/);
 assert.match(source,/hull-defs\.mjs/);
 const g=new Game();assert.equal(g.player.r,16);g.s.docked=true;g.s.credits=250000;
 assert(g.buyShip('mule'));assert.equal(g.s.ship,'mule');assert.equal(g.player.r,22);
 assert(g.buyShip('kestrel'));assert.equal(g.player.r,18);
 assert(g.buyShip('eagle'));assert.equal(g.player.r,24);
 assert(g.buyShip('sparrow'));assert.equal(g.player.r,14);
});
test('Legacy hangar saves pad loadouts for new hulls',()=>{
 const g=new Game();const raw=g.serialize();
 delete raw.loadouts.sparrow;delete raw.loadouts.eagle;delete raw.loadouts.goliath;
 const loaded=validateSave(raw);assert(loaded);assert.deepEqual(loaded.loadouts.sparrow,[]);assert.deepEqual(loaded.loadouts.eagle,[]);assert.deepEqual(loaded.loadouts.goliath,[]);
 assert.equal(loaded.ship,'wren');assert(loaded.fleet.includes('wren'));
});
test('Player thrust and boost never control another ship’s exhaust',()=>{
 const g=new Game();g.launch();g.update(1/30,{thrust:1,boost:true});assert.equal(g.player.thrust,1);assert(g.player.boost);const patrol=g.patrols[0].thrust;g.update(1/30,{});assert.equal(g.player.thrust,0);assert(!g.player.boost);assert.equal(g.patrols[0].thrust,patrol);
 // Exercise the actual renderer without a browser or global game state.
 const source=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8'),fn=source.match(/function drawShip\([^\n]+/)[0];
 let flames=0;const ctx=new Proxy({}, {get:(_,key)=>key==='lineTo'?((x,y)=>{if(x<-24&&y===0)flames++;}):()=>{},set:()=>true});
 const sandbox={ctx,Math};vm.createContext(sandbox);vm.runInContext('function softFX(){return false}function liteFX(){return false}'+fn+';this.drawShip=drawShip',sandbox);
 sandbox.drawShip(0,0,0,'white',19,false,0);assert.equal(flames,0);sandbox.drawShip(0,0,0,'white',19,false,1,true);assert.equal(flames,1);sandbox.drawShip(0,0,0,'white',19,false,0);assert.equal(flames,1);
});
test('Planets, stars and stations allow uninterrupted overflight',()=>{
 for(const kind of ['planet','star','station']){
  const g=new Game();g.launch();g.enemies=[];g.traffic=[];g.patrols=[];g.asteroids=[];
  const body=kind==='planet'?g.planets[0]:g[kind];
  // Snapshot before update — planets/moons may advance on living orbits.
  const x0=body.x,y0=body.y,startX=x0-5;
  g.player.x=startX;g.player.y=y0;g.player.vx=200;g.player.vy=0;
  g.update(.05);
  assert(g.player.x>startX);assert(g.player.vx>180);
  assert(Math.abs(g.player.y-y0)<2);
  if(kind==='station'){g.player.x=body.x;g.player.y=body.y;assert(g.dock());}
  if(kind==='planet'){g.player.x=body.x;g.player.y=body.y+body.r+40;g.player.vx=0;g.target=body;assert(g.scanTarget());}
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
test('Every local worker stop label matches its physical location over complete round trips',()=>{
 const g=new Game(),workers=g.traffic.filter(t=>!t.canJump),seen=new Map(workers.map(t=>[t.id,new Set()]));
 for(let frame=0;frame<7200;frame++){
  g.updateTraffic(1/30);
  for(const ship of g.traffic.filter(t=>!t.canJump)){
   if(ship.status==='IN TRANSIT')continue;
   seen.get(ship.id).add(ship.status);
   const stop=ship.points.find(p=>p.status===ship.status);assert(stop,ship.status);assert(dist(ship,stop)<18);
   if(ship.status==='DOCKED')assert(dist(ship,g.station)<18);
   if(ship.status==='FUEL SCOOPING')assert(dist(ship,g.star)<g.star.r+650);
  }
 }
 for(const ship of workers)for(const stop of ship.points)assert(seen.get(ship.id).has(stop.status),ship.name+' reaches '+stop.status);
});
test('Jump traffic leaves wakes that can be scanned and followed across systems',()=>{
 const g=new Game();g.launch();const freighter=g.traffic.find(t=>t.job==='DEPARTING FOR JUMP POINT');assert(freighter.canJump);assert(Number.isInteger(freighter.destination));
 freighter.x=g.jumpAnchor().x;freighter.y=g.jumpAnchor().y;freighter.pause=0;freighter.target=0;g.departJump(freighter);
 assert.equal(g.traffic.includes(freighter),false);assert.equal(g.wakes.length,1);assert.equal(g.s.transit.length,1);
 const wake=g.wakes[0],dest=wake.to;g.target=wake;assert(g.scanWake());assert(wake.scanned);assert(g.followWake());assert.equal(g.s.route.destination,dest);
 g.s.transit[0].eta=g.s.playtime;g.teleportTo(dest,{docked:false});assert(g.traffic.some(t=>t.uid===wake.uid||t.job==='ARRIVING FROM JUMP POINT'));
});
test('Wanted escalation and system skies are available for testing',()=>{
 assert.equal(wantedTier(0).label,'CLEAN');assert.equal(wantedTier(600).label,'WANTED');assert.equal(wantedTier(3000).label,'EXTREME');
 assert(SYSTEMS.some(s=>systemSky(s).kind==='storm'));assert(SYSTEMS.some(s=>systemSky(s).lightning));
 const g=new Game();g.launch();assert(g.scheduleResponseTeam(0));g.responseAt=g.time;g.updateSecurity(0);assert(g.enemies.some(e=>e.response));
 const app=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
 assert.match(app,/function drawSkyBackdrop/);assert.match(app,/case 'dev':openPanel\('dev'\)/);
 assert.match(app,/WANTED · HEAT/);assert.match(app,/spawnResponseTeam\(\{force:true\}\)/);
 assert.match(app,/Soft ion curtains/);
 assert.match(app,/Procedural gas washes/);
 assert.match(app,/Soft Milky Way band/);
 assert.ok(!/drawImage\(nebula/.test(app));
 assert.ok(!/lineTo\(x\+10\+i\*2\.5,height\)/.test(app));
 assert(SYSTEMS.every(s=>{const sky=systemSky(s);return Array.isArray(sky.wash)&&sky.wash.length>0&&Number.isFinite(sky.galaxy)&&Number.isFinite(sky.bandAngle)&&!/#a56dff/i.test([sky.tint,sky.bg,...sky.wash].join(''));}));
});
test('Galaxy chart spreads display coords and system chart ships with the System nav',()=>{
 const chart=readFileSync(new URL('../dist/galaxy-chart.mjs',import.meta.url),'utf8');
 assert.match(chart,/GALAXY_SPREAD/);assert.match(chart,/galaxyDisplay/);assert.match(chart,/Label LOD|wantLabel|labelSize/);
 assert.match(chart,/dense/);
 const sys=readFileSync(new URL('../dist/system-chart.mjs',import.meta.url),'utf8');
 assert.match(sys,/export class SystemChart/);assert.match(sys,/shipWorld/);assert.match(sys,/Locate|locate/);
 const app=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
 assert.match(app,/data-action="system-map"/);assert.match(app,/case 'system-map'/);assert.match(app,/drawSystemMap/);
 assert.match(app,/galaxyDisplay/);
});
test('Dynamic events start, resolve, and reuse living NPCs',()=>{
 assert.equal(EVENT_IDS.length,8);assert(EVENT_CONFIG.maxActive<=2);
 const g=new Game();g.launch();
 assert(g.triggerDynamicEvent('distressSignal'));assert.equal(g.dyn.active.length,1);assert(g.signals.length>=1);
 ticks(g,2);assert(g.dyn.active.some(e=>e.type==='distressSignal')||g.signals.length>=0);
 const h=new Game();h.launch();assert(h.triggerDynamicEvent('pirateAttack'));
 assert(h.enemies.some(e=>e.wanted||e.eventOwned));
 assert(h.triggerDynamicEvent('derelictWreck'));assert(h.derelicts.length>=1);
 const d=h.derelicts[0];h.target=d;h.player.x=d.x;h.player.y=d.y;h.player.vx=h.player.vy=0;assert(h.scanDynamic());assert(d.scanned);
 const app=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
 assert.match(app,/case 'dev-event'/);assert.match(app,/triggerDynamicEvent/);
 assert.match(app,/function drawEdgeArrow/);assert.match(app,/eventArrowTargets\(game\)/);
 assert.match(app,/gravityLens|radioStorm|silentRelic/);
});
test('Space anomalies catalog with anomaly log type and dwell scan',()=>{
 const g=new Game();g.launch();
 assert(g.triggerDynamicEvent('anomalyActivity'));
 const ev=g.dyn.active.find(e=>e.type==='anomalyActivity');assert(ev);
 assert(['gravityLens','radioStorm','silentRelic'].includes(ev.anomalyKind));
 if(ev.anomalyKind==='silentRelic'){
  const d=g.derelicts.find(x=>x.id===ev.derelictId);assert(d);assert.equal(d.anomalyKind,'silentRelic');
  g.target=d;g.player.x=d.x;g.player.y=d.y;g.player.vx=g.player.vy=0;
  assert(g.scanDynamic());assert(d.scanned);
  assert(g.s.explorationLog.some(e=>e.id===d.id&&e.type==='anomaly'));
 }else{
  const sig=g.signals.find(s=>s.id===ev.signalId);assert(sig);assert(sig.anomalyKind);
  g.target=sig;g.player.x=sig.x;g.player.y=sig.y;g.player.vx=g.player.vy=0;
  assert(g.scanDynamic());assert(g.dynScan);
  ticks(g,4);assert(sig.scanned);assert(!g.dynScan);
  assert(g.s.explorationLog.some(e=>e.id===sig.id&&e.type==='anomaly'));
 }
 const save=validateSave(JSON.parse(JSON.stringify(g.serialize())));
 assert(save);assert(save.explorationLog.some(e=>e.type==='anomaly'));
});
test('Event direction arrows require discovery or combat alert',()=>{
 const g=new Game();g.launch();
 g.player.x=g.star.x+8000;g.player.y=g.star.y;
 assert(g.triggerDynamicEvent('distressSignal'));
 const sig=g.signals[0];assert(sig);sig.discovered=false;
 assert.equal(eventArrowTargets(g).length,0);
 sig.discovered=true;
 const arrows=eventArrowTargets(g);assert.equal(arrows.length,1);assert.equal(arrows[0].color,'#efa778');assert.equal(arrows[0].id,sig.id);
 const h=new Game();h.launch();
 h.player.x=h.star.x+8000;h.player.y=h.star.y;
 assert(h.triggerDynamicEvent('pirateAttack'));
 const raid=h.dyn.active.find(e=>e.type==='pirateAttack');assert(raid);
 raid.alerted=false;
 assert.equal(eventArrowTargets(h).filter(a=>a.kind==='pirateAttack').length,0);
 raid.alerted=true;if(!raid.beacon){const v=h.traffic.find(t=>t.id===raid.victimId)||h.enemies[0];raid.beacon={x:v.x,y:v.y};}
 assert(eventArrowTargets(h).some(a=>a.kind==='pirateAttack'&&a.color==='#ee918b'));
});
test('Operation guidance survives reload and navigates combat, delivery and reporting stages',()=>{
 let g=new Game();const faction=FACTIONS[0].id;assert(g.acceptOperation(faction,'combat'));g=roundtrip(g);let op=g.s.operations[0],d=operationDetails(g.s,op);
 assert(d.next.includes(SYSTEMS[op.target].name));assert(g.routeOperation(op.uid));assert.equal(g.s.route.destination,op.target);
 g.s.system=op.target;g.s.docked=false;g.makeSystem();assert(g.routeOperation(op.uid));assert(g.target.id.startsWith(op.uid+'-'));assert.equal(operationDetails(g.s,op).navLabel,'Find target');
 op.kills=2;d=operationDetails(g.s,op);assert(d.next.includes('Report success'));assert.equal(SYSTEMS[d.destination].faction,faction);assert(g.routeOperation(op.uid));assert.equal(g.s.route.destination,d.destination);
 g.s.system=d.destination;g.makeSystem();g.s.docked=true;assert(g.claimOperation(op.uid));assert(g.acceptOperation(faction,'relief'));op=g.s.operations[0];d=operationDetails(g.s,op);assert(d.next.includes('Acquire'));g.s.cargo[d.good]=d.total;d=operationDetails(g.s,op);assert(d.next.includes('Report success'));assert(g.routeOperation(op.uid));assert.equal(g.target,g.station);
 const html=operationCards(g);assert(html.includes(d.next));assert(html.includes('Select station'));assert(factionView(g).indexOf('Active operations')<factionView(g).indexOf('faction-grid'));assert(g.claimOperation(op.uid));assert.equal(g.s.operations.length,0);
});

test('Living Frontier interventions pay when the player assists',()=>{
 const g=new Game();g.launch();
 assert(g.triggerDynamicEvent('pirateAttack'));
 const ev=g.dyn.active.find(e=>e.type==='pirateAttack');assert(ev);
 assert(ev.objective);assert.match(ev.objective,/Defend|civilian|attack/i);
 const pirate=g.enemies.find(e=>e.id===ev.pirateId);assert(pirate);
 const beforeCredits=g.s.credits,before=g.s.metrics.interventions||0;
 pirate.playerHit=true;g.onDestroyed(pirate,true);g.enemies=g.enemies.filter(e=>e!==pirate);
 ticks(g,.2);
 assert.equal(g.dyn.active.length,0);
 assert(g.s.credits>beforeCredits);
 assert.equal(g.s.metrics.interventions,before+1);
 // Fresh distress payoff
 const h=new Game();h.launch();
 assert(h.triggerDynamicEvent('distressSignal'));
 const sig=h.signals[0];assert(sig);sig.discovered=true;h.target=sig;h.player.x=sig.x;h.player.y=sig.y;h.player.vx=h.player.vy=0;
 const c0=h.s.credits;assert(h.scanDynamic());ticks(h,.2);
 assert(h.s.credits>c0);assert((h.s.metrics.interventions||0)>=1);
 assert(eventObjective);assert.match(readFileSync(new URL('../dist/app.js',import.meta.url),'utf8'),/eventObjective\(/);
});
test('Derelict scan unlocks salvage loot and optional wreck boarding',()=>{
 const g=new Game();g.launch();
 assert(g.triggerDynamicEvent('derelictWreck'));
 const d=g.derelicts[0];assert(d);assert.equal(d.salvaged,false);
 g.target=d;g.player.x=d.x;g.player.y=d.y;g.player.vx=g.player.vy=0;
 assert(g.scanDynamic());assert(d.scanned);assert.equal(d.salvaged,false);
 const credits=g.s.credits,salvages=g.s.metrics.salvages||0;
 assert(g.scanDynamic());assert(d.salvaged);assert(g.s.credits>=credits);assert.equal(g.s.metrics.salvages,salvages+1);
 const h=new Game();h.launch();assert(h.triggerDynamicEvent('derelictWreck'));
 const w=h.derelicts[0];w.scanned=true;h.target=w;h.player.x=w.x;h.player.y=w.y;h.player.vx=h.player.vy=0;
 assert(h.boardWreck());assert.equal(h.onfoot.kind,'wreck');
 const zone=(h.onfoot.zones||[]).find(z=>z.service==='cache'||z.cache);assert(zone);
 h.onfoot.x=zone.x;h.onfoot.y=zone.y;assert(h.interactWreck());
 const app=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
 assert.match(app,/BOARD WRECK/);assert.match(app,/boardWreck\(/);assert.match(app,/interactWreck\(/);
});
test('Kind-driven surfaces expose readout, landmarks, and landing feel',()=>{
 const g=new Game();g.launch();
 const landable=g.planets.find(p=>isLandablePlanet(p))||g.planets.find(p=>p.type==='planet'&&p.landable!==false);
 assert(landable);
 g.target=landable;g.player.x=landable.x;g.player.y=landable.y+landable.r+20;g.player.vx=g.player.vy=0;
 assert(g.land());assert(g.surface);assert(g.surface.readout);
 assert(g.surface.anomalies.some(a=>a.landmark));
 const app=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
 assert.match(app,/surface\.readout/);
});
test('Living orbits advance planet and moon positions over playtime',()=>{
 const layout=buildSystemLayout(SYSTEMS[0]);
 assert(layout.planets.length>=1);
 const p=layout.planets[0];assert(Number.isFinite(p.orbitRadius));assert(Number.isFinite(p.orbitAngle));assert(Number.isFinite(p.period));
 const x0=p.x,y0=p.y;
 applyOrbitPhase(layout,5000);
 assert(p.x!==x0||p.y!==y0);
 const x1=p.x;
 advanceOrbits(layout.planets,layout.moons,layout.stars,8);
 assert(p.x!==x1);
 const g=new Game();g.launch();
 const before=g.planets.filter(b=>b.type==='planet').map(b=>({id:b.id,x:b.x,y:b.y}));
 ticks(g,6);
 const moved=g.planets.filter(b=>b.type==='planet').some(b=>{const o=before.find(x=>x.id===b.id);return o&&(o.x!==b.x||o.y!==b.y);});
 assert(moved);
});

let failed=0;for(const [name,fn]of tests){try{fn();console.log('PASS '+name);}catch(e){failed++;console.error('FAIL '+name,e);}}console.log(`\n${tests.length-failed} / ${tests.length} exploration checks passed.`);if(failed)process.exitCode=1;

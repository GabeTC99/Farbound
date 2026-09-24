import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Game,newSave,validateSave,SYSTEMS,SHIPS,GOODS,GUILDS,MODULES,FACTIONS,getStats,cargoUsed,jumpDistance,jumpCost,price,marketBulletin,ECONOMY_SPECIALTY,pursuitObjective,contractsFor,companiesFor,companyRank,findRoute,systemName,missionDestination,guildProgress,operationDetails,terrainAt,surveyWorldIds,tradeHop,bestExport,systemPresence,radarBlip} from '../dist/frontier.mjs';
import {Game as ClassicGame,getStats as classicStats} from '../dist/classic/core.mjs';
import {readPilot,writePilot,readCheckpoint,SAVE_KEY,BACKUP_KEY,ORIGINAL_KEY} from '../dist/pilot-storage.mjs';
import {moduleView,fleetView,guildView,factionView,mapView,systemMapView,robotStrip} from '../dist/frontier-views.mjs';
import {STATION_ROBOT,buildRobotContext,pickRobotLine,ROBOT_LINES} from '../dist/station-robot.mjs';
import {createStationLayout,pickStationChat,pointInHull} from '../dist/station-layout.mjs';
import {isoWalkAxes,STATION_ISO,interactZone,ZONE_INTERACT_RANGE} from '../dist/onfoot.mjs';
import {makeStationProjector} from '../dist/onfoot-render.mjs';
const tests=[];function test(name,fn){tests.push([name,fn]);}
function ticks(g,seconds,input={}){for(let i=0;i<Math.ceil(seconds*30);i++)g.update(1/30,input);}
function roundtrip(g){const s=validateSave(JSON.parse(JSON.stringify(g.serialize())));assert(s,'Saved pilot must validate');return new Game(s);}
function place(g,id,docked=true){g.s.system=id;g.s.docked=docked;if(!g.s.visited.includes(id))g.s.visited.push(id);g.makeSystem();}
function approach(g,t){g.target=t;g.auto=null;g.autopilot();for(let i=0;i<3000&&g.auto;i++)g.update(1/30);assert.equal(g.auto,null,'Autopilot arrived');}
function fit(g,kind){const m={uid:'m-'+g.s.nextModule++,kind,grade:1};g.s.modules.push(m);assert(g.equip(m.uid));return m;}
function scanSignal(g,a){g.surface.x=a.x;g.surface.y=a.y-80;g.surface.vx=g.surface.vy=0;assert(g.scanSurface());ticks(g,3.1);assert(g.s.surfaceScanned.includes(a.id));}
class MemoryStorage{constructor(){this.m=new Map();}getItem(k){return this.m.get(k)??null;}setItem(k,v){this.m.set(k,String(v));}}
test('All 192 systems are reachable; 128 unknown systems conceal names until discovered',()=>{
 assert.equal(SYSTEMS.length,192);assert.equal(SYSTEMS.filter(s=>s.uncharted).length,128);const save=newSave();for(const sys of SYSTEMS){const p=findRoute(0,sys.id,14);assert(p);let from=0;for(const to of p){assert(jumpDistance(from,to)<=14);from=to;}assert.equal(from,sys.id);if(sys.uncharted){assert(!systemName(sys,save).includes(sys.name));save.visited.push(sys.id);assert.equal(systemName(sys,save),sys.name);}}
 assert.equal(findRoute(0,191,1),null);assert.equal(new Set(SYSTEMS.map(s=>s.name)).size,192);
});
test('An upgraded v1 pilot migrates without changing cargo, progress, credits, or effective stats',()=>{
 const old=new ClassicGame();old.s.credits=50000;for(const key of ['laser','shield','engine','drive','cargo']){old.upgrade(key);old.upgrade(key);}old.s.cargo.food=26;old.s.scanned=['planet-0-0'];old.s.visited=[0,1];old.s.kills=7;old.s.data=750;
 const snapshot=old.serialize(),before=JSON.stringify(snapshot),migrated=validateSave(snapshot);assert(migrated);for(const k of ['hull','shield','speed','range','cargo','damage'])assert.equal(getStats(migrated)[k],classicStats(snapshot)[k],k);assert.equal(JSON.stringify(snapshot),before);assert.equal(migrated.modules.length,5);assert.equal(migrated.credits,snapshot.credits);assert.deepEqual(migrated.cargo,snapshot.cargo);assert.deepEqual(migrated.visited,snapshot.visited);assert.equal(migrated.metrics.pirates,7);assert(roundtrip(new Game(migrated)));
});
test('Contract navigation plots a direct jump and pays exactly once on arrival',()=>{
 const g=new Game(),m=contractsFor(g.s).find(m=>m.type==='delivery'),credits=g.s.credits;assert(g.accept(m.id));assert(g.routeContract(m.id));assert.deepEqual(g.s.route.path,[m.destination]);assert(!g.jumpNext());g.launch();const fuel=g.s.fuel,cost=jumpCost(0,m.destination,g.s);assert(g.jumpNext());assert.equal(g.s.system,0);ticks(g,3.1);assert.equal(g.s.system,m.destination);assert.equal(g.s.fuel,fuel-cost);assert.deepEqual(g.s.route.path,[]);approach(g,g.station);assert(g.dock());assert.equal(g.s.credits,credits+m.reward);assert.equal(g.s.metrics.deliveries,1);g.claimMissions();g.dock();assert.equal(g.s.metrics.deliveries,1);assert.equal(g.s.credits,credits+m.reward);
});
test('Multihop routes update after jumps, respect fuel, and survive reloads',()=>{
 const g=new Game();g.launch();assert(g.setRoute(191));assert(g.s.route.path.length>1);const next=g.s.route.path[0],original=g.s.fuel;g.s.fuel=0;assert(!g.jumpNext());g.s.fuel=original;assert(g.jumpNext());ticks(g,3.1);assert.equal(g.s.system,next);const h=roundtrip(g);assert.equal(h.s.route.destination,191);assert.equal(h.s.route.path[0],g.s.route.path[0]);assert(!h.s.route.path.includes(h.s.system));
});
test('Survey contract routing changes to its home station after destination worlds are surveyed',()=>{
 const g=new Game(),m=contractsFor(g.s).find(m=>m.type==='survey');assert(g.accept(m.id));assert.equal(missionDestination(g.s,m),m.destination);g.s.scanned.push(...surveyWorldIds(m.destination,SYSTEMS[m.destination]));assert.equal(missionDestination(g.s,m),m.origin);
});
test('New systems pay on discovery scans once; fuel scooping prevents stranding',()=>{
 const g=new Game();place(g,64,false);const home=g.s.system,dest=SYSTEMS.find(s=>s.uncharted&&!s.hasStation&&s.id!==home&&jumpDistance(home,s.id)<=14).id;
 assert(g.jumpTo(dest));ticks(g,3.1);assert.equal(g.s.metrics.discoveries,0);assert.equal(g.s.data,0);assert.equal(g.visiblePlanets.length,0);assert(!g.dock());
 assert(g.discover());ticks(g,4.1);assert.equal(g.s.metrics.discoveries,1);assert.equal(g.s.data,500);assert.equal(g.visiblePlanets.length,g.planets.length);
 g.enemies=[];g.traffic=[];g.patrols=[];g.s.fuel=0;g.player.x=g.star.x+g.star.r+310;g.player.y=g.star.y;g.player.vx=g.player.vy=0;assert(g.scoop());ticks(g,10);assert.equal(g.s.fuel,getStats(g.s).fuel);assert(!g.scooping);assert(g.s.heat<80);
 assert(g.jumpTo(home));ticks(g,3.1);assert(g.jumpTo(dest));ticks(g,3.1);assert(!g.discover());assert.equal(g.s.metrics.discoveries,1);const h=roundtrip(g);assert(!h.discover());h.s.hull=0;ticks(h,.1);assert(h.s.docked);assert(h.sys.hasStation);
});
test('Planetary landings restore in place, record signals once, and sell only when docked',()=>{
 let g=new Game();g.launch();const p=g.planets.find(pl=>pl.landable!==false)||g.planets[0];approach(g,p);ticks(g,1);assert(g.land());assert(!g.jumpTo(1));const a=g.surface.anomalies[0],initial=g.s.credits;scanSignal(g,a);assert.equal(g.s.records.length,1);assert.equal(g.s.metrics.anomalies,1);assert.equal(g.s.credits,initial);g=roundtrip(g);assert(g.surface);assert.equal(g.surface.anomalies[0].scanned,true);assert.equal(g.s.records.length,1);const value=g.s.records[0].value;g.takeoff();g.player.x=g.station.x;g.player.y=g.station.y+50;assert(g.dock());assert.equal(g.s.credits,initial);assert.equal(g.s.records.length,1);assert(g.sellExplorationData());assert.equal(g.s.credits,initial+value);assert.equal(g.s.records.length,0);assert(!g.sellExplorationData());g.dock();assert.equal(g.s.credits,initial+value);g.launch();g.player.x=p.x;g.player.y=p.y+p.r+300;assert(g.land());assert(g.surface.anomalies[0].scanned);assert.equal(g.s.metrics.anomalies,1);
});
test('Surface scans cancel when moving fast; crash recovery loses only this expedition’s signals',()=>{
 const g=new Game();g.launch();const p=g.planets.find(pl=>pl.landable!==false)||g.planets[0];g.player.x=p.x;g.player.y=p.y+p.r+300;assert(g.land());const a=g.surface.anomalies[0];g.surface.x=a.x;g.surface.y=a.y-80;g.surface.vx=100;assert(!g.scanSurface());g.surface.vx=0;assert(g.scanSurface());ticks(g,.5,{surfaceX:1,boost:true});assert.equal(g.surface.scan,null);g.surface.vx=0;scanSignal(g,a);g.takeoff();assert(g.land());scanSignal(g,g.surface.anomalies[1]);g.surface.integrity=.1;g.surface.y=terrainAt(g.surface.x,g.surface.seed);g.surface.vy=300;ticks(g,.04);assert.equal(g.surface,null);assert.equal(g.s.records.length,1);assert.equal(g.s.hull,80);
});
test('Guilds count work after acceptance and issue each of twelve unique rewards once',()=>{
 for(const guild of GUILDS){const g=new Game();g.s.scanned=['planet-0-0'];g.s.mined=4;g.s.trade=100;g.s.contracts=1;assert(g.joinGuild(guild.id));for(const q of guild.quests){assert(g.acceptGuild(guild.id));assert(!guildProgress(g.s,guild.id).ready);assert(!g.claimGuild(guild.id));if(q.good)g.s.cargo[q.good]=q.count;else if(q.metric==='surveys')g.s.scanned.push(...Array.from({length:q.count},(_,i)=>`planet-${i+1}-0`));else if(q.metric==='sales')g.s.trade+=q.count;else if(q.metric==='mined')g.s.mined+=q.count;else if(q.metric==='contracts')g.s.contracts+=q.count;else g.s.metrics[q.metric]+=q.count;assert(guildProgress(g.s,guild.id).ready);const before=g.s.credits;assert(g.claimGuild(guild.id));assert.equal(g.s.credits,before+q.credits);assert.equal(g.s.modules.filter(m=>m.kind===q.reward).length,1);assert(!g.claimGuild(guild.id));if(q.good)assert.equal(g.s.cargo[q.good],0);roundtrip(g);}assert(guildProgress(g.s,guild.id).done);assert(!g.acceptGuild(guild.id));}
});
test('Unique modules transfer physically between owned ships and each hull keeps wear and fuel',()=>{
 const g=new Game();g.s.credits=50000;const m=fit(g,'pathfinder');assert.equal(getStats(g.s).range,20);g.s.hull=62;g.s.fuel=27;assert(g.buyShip('mule'));assert.equal(getStats(g.s).range,16);assert.equal(g.moduleLocation(m.uid),'wren');assert(g.equip(m.uid));assert.equal(g.moduleLocation(m.uid),'mule');assert.equal(getStats(g.s).range,22);assert.equal(g.s.loadouts.wren.length,0);g.s.fuel=45;assert(g.buyShip('wren'));assert.equal(getStats(g.s).range,14);assert.equal(g.s.hull,62);assert.equal(g.s.fuel,27);assert(g.buyShip('mule'));assert.equal(g.s.fuel,45);assert(g.unequip(m.uid));assert.equal(getStats(g.s).range,16);assert.equal(g.moduleLocation(m.uid),null);roundtrip(g);
});
test('Cargo modules cannot be removed if cargo will not fit; slots and categories are enforced',()=>{
 const g=new Game();g.s.credits=50000;const m=fit(g,'foldrack');g.s.cargo.food=25;assert(!g.unequip(m.uid));assert.equal(getStats(g.s).cargo,32);assert(!g.buyShip('wren'));const a=fit(g,'deepfield'),b={uid:'m-'+g.s.nextModule++,kind:'seismic',grade:1};g.s.modules.push(b);assert(!g.equip(b.uid));assert.equal(g.moduleLocation(a.uid),'wren');assert.equal(g.moduleLocation(b.uid),null);g.s.cargo.food=0;assert(g.unequip(m.uid));for(const k of ['drive','engine','shield','cargo','laser'])assert(g.upgrade(k));assert.equal(g.s.loadouts.wren.length,6);const extra={uid:'m-'+g.s.nextModule++,kind:'merchant',grade:1};g.s.modules.push(extra);assert(!g.equip(extra.uid));roundtrip(g);
});
test('Enhanced scanning and mining bonuses change actual payouts and collection',()=>{
 const g=new Game();fit(g,'cartographer');fit(g,'prospector');g.launch();const p=g.planets[0];g.target=p;g.player.x=p.x;g.player.y=p.y+p.r+900;g.player.vx=g.player.vy=0;assert(g.scanTarget());ticks(g,2.0);assert((g.s.spectrumScanned||[]).includes(p.id));assert(g.scanTarget());ticks(g,2.5);assert(g.s.scanned.includes(p.id));assert.equal(g.s.data,Math.round(p.value*1.25*1.15));g.enemies=[];const rock=g.asteroids[0];g.asteroids=[rock];g.player.x=rock.x-110;g.player.y=rock.y;g.player.angle=0;ticks(g,2,{fire:true});assert.equal(g.s.mined,2);assert.equal(cargoUsed(g.s),2);const h=roundtrip(g);assert(!h.asteroids.some(r=>r.id===rock.id),'Mined rocks stay depleted after reload');
});
test('Relief operations consume supplies, pay once, and improve faction standing and prices',()=>{
 const g=new Game();assert(g.acceptOperation('concord','relief'));const o=g.s.operations[0];assert(!g.acceptOperation('concord','relief'));assert(!g.claimOperation(o.uid));g.s.cargo.meds=4;const credits=g.s.credits;assert(operationDetails(g.s,o).ready);assert(g.claimOperation(o.uid));assert.equal(g.s.cargo.meds,0);assert.equal(g.s.credits,credits+1400);assert.equal(g.s.reputation.concord,15);assert(!g.claimOperation(o.uid));assert(g.acceptOperation('concord','relief'));g.s.cargo.meds=4;assert(g.claimOperation(g.s.operations[0].uid));const neutral=price(g.sys,'food');assert(price(g.sys,'food',true,g.s)<neutral);assert.equal(g.s.metrics.operations,2);
});
test('Faction combat counts only the specified rival and system, then requires reporting home',()=>{
 const g=new Game();assert(g.acceptOperation('concord','combat'));let o=g.s.operations[0];g.onDestroyed({id:'patrol-test-0',type:'enemy',faction:'directorate'});assert.equal(o.kills,0);place(g,o.target,false);assert.equal(g.enemies.filter(e=>e.id.startsWith(o.uid+'-')).length,2);g.onDestroyed({id:'patrol-test-1',type:'enemy',faction:'freeholds'});assert.equal(o.kills,0);for(const e of g.enemies.filter(e=>e.id.startsWith(o.uid+'-')))g.onDestroyed(e);assert.equal(o.kills,2);assert(!g.claimOperation(o.uid));const h=roundtrip(g);o=h.s.operations[0];assert.equal(o.kills,2);place(h,0,true);assert(h.claimOperation(o.uid));assert.equal(h.s.metrics.operations,1);
});
test('Neutral patrols can be engaged and friendly pledged patrols assist nearby combat',()=>{
 const g=new Game();g.pledge('concord');g.launch();const p=g.patrols[0],e=g.enemies[0];e.x=p.x+100;e.y=p.y;p.fire=0;g.update(1/30);assert(g.shots.some(s=>s.ally));assert(g.engageFaction(p));assert.equal(g.s.reputation.concord,-12);assert(g.enemies.includes(p));assert(!g.patrols.includes(p));assert(!g.engageFaction(p));g.s.reputation.concord=-25;g.update(1/30);assert.equal(g.patrols.length,0);roundtrip(g);
});
test('Market bonuses never create a profitable buy-and-sell loop at the same station',()=>{
 const g=new Game();fit(g,'merchant');
 for(const play of [0,1200,4800]){
  g.s.playtime=play;
  for(const sys of SYSTEMS)for(const rep of [-100,0,100]){if(sys.faction)g.s.reputation[sys.faction]=rep;for(const good of GOODS)assert(price(sys,good.id,true,g.s)>price(sys,good.id,false,g.s),sys.name+' '+good.id+' @'+play);}
 }
});
test('Market bulletins are deterministic, named, and shown on the galaxy chart',()=>{
 let posted=0;
 for(const sys of SYSTEMS.filter(s=>s.hasStation).slice(0,32)){
  for(const play of [0,1200,2400,7200]){
   const note=marketBulletin(sys,play);
   assert.deepEqual(note,marketBulletin(sys,play+10));
   if(note){
    posted++;
    assert(GOODS.some(g=>g.id===note.good));
    assert(['shortage','surplus'].includes(note.kind));
    assert(note.headline.includes(sys.name));
    assert(note.headline.includes(note.name.toLowerCase())||note.headline.includes(note.name));
   }
  }
 }
 assert(posted>8,'expected some traffic-board postings');
 for(const eco of Object.keys(ECONOMY_SPECIALTY))assert(GOODS.some(g=>g.id===ECONOMY_SPECIALTY[eco].good));
 const g=new Game();
 let hit=null,sysId=0,play=0;
 for(const sys of SYSTEMS){
  for(const p of [0,1200,2400,3600,4800,6000,7200,8400]){
   const note=marketBulletin(sys,p);
   if(note){hit=note;sysId=sys.id;play=p;break;}
  }
  if(hit)break;
 }
 assert(hit);
 g.s.playtime=play;
 if(!g.s.visited.includes(sysId))g.s.visited.push(sysId);
 const chart=mapView(g,sysId);
 assert(chart.includes('Bulletin'));
 assert(chart.includes(hit.name));
 const app=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
 assert.match(app,/bulletin-callout/);
 assert.match(app,/TRAFFIC BOARD/);
 assert.match(app,/ECONOMY_SPECIALTY/);
});
test('Trade hops pick a higher-paying dock, keep buy above sell, and plot from Market and Galaxy',()=>{
 const g=new Game();
 const hop=bestExport(0,g.s);
 assert(hop,'Agricultural Solace should have a profitable export');
 assert.equal(hop.fromId,0);
 assert.notEqual(hop.to,0);
 assert(hop.profit>0);
 assert(hop.jumps>=1);
 assert(price(SYSTEMS[hop.to],hop.good,false,g.s)>price(SYSTEMS[0],hop.good,true,g.s));
 const food=tradeHop(0,'food',g.s,{haveCargo:false});
 if(food){
  assert(food.profit>0);
  assert(price(SYSTEMS[food.to],'food',true,g.s)>price(SYSTEMS[food.to],'food',false,g.s));
 }
 g.s.cargo.food=5;
 const sale=tradeHop(0,'food',g.s,{haveCargo:true});
 if(sale)assert(sale.sell>price(SYSTEMS[0],'food',false,g.s));
 const home=mapView(g,0);
 assert(home.includes('Best export'));
 assert(home.includes('data-action="plot-trade"'));
 const app=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
 assert.match(app,/case 'plot-trade'/);
 assert.match(app,/trade-hop/);
 assert.match(app,/radar-mode/);
 assert.match(app,/flightModeLabel/);
 for(const sys of SYSTEMS.filter(s=>s.hasStation).slice(0,16)){
  const p=systemPresence(sys,g.s);
  assert(p.label);
  if(sys.faction)assert(p.label.includes(FACTIONS.find(f=>f.id===sys.faction).name));
 }
 g.s.reputation.concord=40;
 const friendly=systemPresence(SYSTEMS[0],g.s);
 assert.equal(SYSTEMS[0].faction,'concord');
 assert.match(friendly.label,/Friendly/);
});
test('Radar contacts stay screen-up while the nose chevron turns',()=>{
 const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} !~ ${b}`);
 let b=radarBlip(0,0,10,0,1);
 near(b.x,10);near(b.y,0);
 b=radarBlip(0,0,0,10,1);
 near(b.x,0);near(b.y,10);
 const g=new Game();g.launch();
 const st=radarBlip(g.player.x,g.player.y,g.station.x,g.station.y);
 assert.ok(st.y<0,'after launch the dock sits above the ship, same as local space');
 const app=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
 assert.match(app,/radarBlip/);
 assert.match(app,/r\.rotate\(p\.angle\)/);
 assert.match(app,/contacts stay put while you turn/);
});
test('First dock briefs Market refuel/repair; prospecting is optional extra yield',()=>{
 const g=new Game();
 assert.equal(g.s.briefed,false);
 g.launch();g.player.x=g.station.x;g.player.y=g.station.y+50;
 assert(g.dock());
 assert.equal(g.s.briefed,true);
 assert(g.s.tutorial>=3);
 assert(g.events.some(e=>/Market/i.test(e.text)));
 const saved=validateSave(JSON.parse(JSON.stringify(g.serialize())));
 assert.equal(saved.briefed,true);
 const miner=new Game();miner.launch();miner.enemies=[];
 const plain=miner.asteroids[0];miner.asteroids=[plain];plain.hp=1;
 miner.player.x=plain.x-110;miner.player.y=plain.y;miner.player.angle=0;miner.target=plain;
 ticks(miner,2,{fire:true});assert.equal(miner.s.mined,1);
 const rich=new Game();rich.launch();rich.enemies=[];
 const rock=rich.asteroids[0];rich.asteroids=[rock];
 rich.player.x=rock.x-80;rich.player.y=rock.y;rich.player.vx=rich.player.vy=0;rich.target=rock;
 assert(rich.prospectRock());assert.equal(rock.prospected,true);
 rock.hp=1;rich.player.x=rock.x-110;rich.player.angle=0;
 ticks(rich,2,{fire:true});assert.equal(rich.s.mined,2);
 const app=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
 assert.match(app,/PROSPECT ROCK/);
 assert.match(app,/prospectRock/);
});
test('Wake pursuit persists, realizes after jump, and pays once on scan',()=>{
 const g=new Game();g.launch();
 const freighter=g.traffic.find(t=>t.job==='DEPARTING FOR JUMP POINT');
 assert(freighter?.canJump);
 freighter.x=g.jumpAnchor().x;freighter.y=g.jumpAnchor().y;freighter.pause=0;freighter.target=0;
 g.departJump(freighter);
 const wake=g.wakes[0],dest=wake.to;
 g.target=wake;assert(g.scanWake());assert(g.followWake());
 assert.equal(g.s.pursuit.uid,wake.uid);
 assert.equal(g.s.pursuit.to,dest);
 assert(['trader','fugitive'].includes(g.s.pursuit.kind));
 g.s.pursuit.kind='trader';
 const obj=pursuitObjective(g);
 assert(obj&&obj.text.includes(g.s.pursuit.name));
 const snap=validateSave(JSON.parse(JSON.stringify(g.serialize())));
 assert.equal(snap.pursuit.uid,wake.uid);
 const bad={...g.serialize(),pursuit:{...g.s.pursuit,kind:'wizard'}};
 assert.equal(validateSave(bad),null);
 g.teleportTo(dest,{docked:false});
 const ship=g.traffic.find(t=>t.uid===wake.uid||t.pursued);
 assert(ship);assert.equal(ship.pursued,true);
 g.player.x=ship.x;g.player.y=ship.y+40;g.player.vx=g.player.vy=0;g.target=ship;
 const credits=g.s.credits,cargo=cargoUsed(g.s);
 assert(g.scanPursuit());
 assert.equal(g.s.metrics.pursuits,1);
 assert.equal(g.s.credits,credits+180);
 assert.equal(g.s.pursuit,null);
 assert(cargoUsed(g.s)>=cargo);
 const h=roundtrip(g);
 assert.equal(h.s.metrics.pursuits,1);
 assert.equal(h.s.pursuit,null);
 g.s.playtime=0;
 const late=new Game();late.launch();
 late.s.pursuit={uid:'gone',name:'Ghost Runner',hull:'courier',color:'#7ec8d8',size:12,from:0,to:1,kind:'trader',until:-1};
 late.s.playtime=10;
 assert.equal(late.realizePursuit(),false);
 assert.equal(late.s.pursuit,null);
 const app=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
 assert.match(app,/FOLLOW WAKE/);
 assert.match(app,/SCAN CONTACT/);
 assert.match(app,/pursuitObjective/);
});
test('Migration preserves the original save byte-for-byte; checkpoints recover damaged v2 saves',()=>{
 const storage=new MemoryStorage(),original=JSON.stringify(new ClassicGame().serialize());storage.setItem(ORIGINAL_KEY,original);const boot=readPilot(storage);assert(boot.migrated);writePilot(storage,boot.pilot,{now:1000});assert.equal(storage.getItem(ORIGINAL_KEY),original);const next=structuredClone(boot.pilot);next.credits+=100;writePilot(storage,next,{now:2000});assert.equal(readCheckpoint(storage).pilot.credits,2400);storage.setItem(SAVE_KEY,'corrupted');const recovered=readPilot(storage);assert(recovered.recovered);assert.equal(recovered.pilot.credits,2400);assert.equal(storage.getItem(ORIGINAL_KEY),original);writePilot(storage,next,{now:3000});const final=structuredClone(next);final.credits+=500;writePilot(storage,final,{checkpoint:true,now:4000});assert.equal(readCheckpoint(storage).pilot.credits,2500);assert.equal(readPilot(storage).pilot.credits,3000);assert(storage.getItem(BACKUP_KEY));
});
test('FPS meter toggle is off by default and survives a save roundtrip',()=>{
 const g=new Game();
 assert.equal(g.s.showFps,false);
 const fresh=validateSave(g.serialize());
 assert.equal(fresh.showFps,false);
 g.s.showFps=true;
 const kept=roundtrip(g);
 assert.equal(kept.s.showFps,true);
 const coerced=validateSave({...g.serialize(),showFps:'yes'});
 assert.equal(coerced.showFps,false);
});
test('Malformed saves reject duplicate modules, duplicate rewards, overloads, and unknown entries',()=>{
 const g=new Game();const m=fit(g,'pathfinder'),base=g.serialize();for(const alter of [s=>s.modules.push({...m}),s=>s.loadouts.mule.push(m.uid),s=>s.cargo.food=999,s=>s.modules[0].kind='missing',s=>s.reputation.concord=101,s=>s.metrics.anomalies=-1,s=>s.surfaceScanned.push('planet-9999-0-a0'),s=>s.companies={'bad-id':{standing:1,completed:1}}]){const bad=structuredClone(base);alter(bad);assert.equal(validateSave(bad),null);}assert.equal(validateSave({}),null);
});
test('Panel generators cover all navigation actions and render all guilds, factions, and modules',()=>{
 const g=new Game();const guilds=guildView(g),factions=factionView(g),modules=moduleView(g),fleet=fleetView(g),combat=fleetView(g,'combat');for(const guild of GUILDS)assert(guilds.includes(guild.name));assert(factions.includes('Cinder Directorate'));assert(modules.includes('data-action="upgrade"'));assert(fleet.includes('ship-filter'));for(const ship of SHIPS)assert(fleet.includes(ship.name));assert(combat.includes('Eagle'));assert(!combat.includes('Mule'));g.setRoute(191);const chart=mapView(g,191);assert(chart.includes('Jump next')||chart.includes('Launch to jump'));assert(chart.includes('Uncharted UR-128'));assert(!chart.includes(SYSTEMS[191].name));
 g.launch();const local=systemMapView(g);assert(local.includes('id="system-map"'));assert(local.includes('SYSTEM')||local.includes('Local chart')||local.includes('You'));
});
test('Station robot Nellby-9 is configurable, greets on dock, and biases dialogue by context',()=>{
 assert.equal(STATION_ROBOT.displayName,'Nellby-9');
 assert.equal(STATION_ROBOT.nameFor(SYSTEMS[0]),'Nellby-9');
 const names=new Set(SYSTEMS.filter(s=>s.hasStation).slice(0,24).map(s=>STATION_ROBOT.nameFor(s)));
 assert(names.size>=3,'station robots should not all share one name');
 assert.equal(STATION_ROBOT.nameFor(SYSTEMS[7]),STATION_ROBOT.nameFor(SYSTEMS[7]));
 assert.equal(STATION_ROBOT.roleLabel,'Station Service Unit');
 assert(ROBOT_LINES.greeting.length>=3);
 assert(ROBOT_LINES.wanted.length>=2);
 assert(ROBOT_LINES.damaged.length>=2);
 assert(ROBOT_LINES.tips.length>=6);
 const g=new Game();
 assert.equal(g.s.robotMet,false);
 const strip=robotStrip(g);
 assert(strip.includes(STATION_ROBOT.displayName));
 assert(strip.includes('robot-strip'));
 assert(strip.includes('data-action="robot-talk"'));
 assert(strip.includes('data-action="robot-tip"'));
 assert(strip.includes('robot-face--'));
 assert(strip.includes('viewBox="0 0 148 104"'));
 assert(!strip.includes('cy="168"'));
 g.launch();
 g.player.x=g.station.x;g.player.y=g.station.y+50;
 assert(g.dock());
 assert(g.s.robotMet);
 assert.equal(g.s.briefed,true);
 assert(g.robotState?.lastText);
 assert(g.robotState.lastText.includes('Market'));
 assert(g.robotState.lastText.includes('first two buttons')||g.robotState.lastText.includes('Refuel'));
 assert(robotStrip(g).includes(g.robotState.lastText));
 const greet=g.talkRobot('greeting');
 assert(ROBOT_LINES.greeting.some(([t])=>t===greet.text));
 const line=g.talkRobot();
 assert(line?.text);
 assert(['neutral','happy','confused','annoyed','alert'].includes(line.expression));
 const tip=g.talkRobot('tip');
 assert(tip?.tag==='tips');
 assert(ROBOT_LINES.tips.some(([t])=>t===tip.text));
 g.s.bounty=900;g.s.hull=40;g.s.cargo.ore=3;
 const ctx=buildRobotContext(g);
 assert(ctx.wanted);assert(ctx.damaged);assert(ctx.tags.includes('mining'));
 let wantedHits=0,damagedHits=0;
 for(let i=0;i<40;i++){const pick=pickRobotLine(g,'talk');if(pick.tag==='wanted')wantedHits++;if(pick.tag==='damaged')damagedHits++;}
 assert(wantedHits+damagedHits>=10,'expected situational dialogue bias');
 const saved=validateSave(JSON.parse(JSON.stringify(g.serialize())));
 assert.equal(saved.robotMet,true);
 assert.equal(roundtrip(g).s.robotMet,true);
 const app=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
 assert.match(app,/robotStrip\(game\)/);
 assert.match(app,/case 'robot-tip'/);
 assert(!app.includes("['concierge','Concierge']"));
 assert(!app.includes('robotView(game)'));
});
test('Station desks and hangar require walk-up proximity, not pad-radius range',()=>{
 const g=new Game();
 assert(g.onfoot,'new save starts docked on the station deck');
 const hangar=g.onfoot.zones.find(z=>z.launch);
 const contracts=g.onfoot.zones.find(z=>z.service==='contracts');
 assert(hangar);assert(contracts);
 const spawnD=Math.hypot(hangar.x-g.onfoot.x,hangar.y-g.onfoot.y);
 assert(spawnD>ZONE_INTERACT_RANGE,'spawn sits off the hangar pad center');
 assert.equal(interactZone(g.onfoot),null);
 assert.equal(g.interactStation(),null);
 assert(g.s.docked);
 g.onfoot.x=contracts.x+50;g.onfoot.y=contracts.y;
 assert(Math.hypot(50,0)>ZONE_INTERACT_RANGE);
 assert.equal(g.interactStation(),null);
 g.onfoot.x=contracts.x;g.onfoot.y=contracts.y;
 assert.equal(g.interactStation().service,'contracts');
});
test('Station space legs: dock enters deck, desks open services, hangar launches, detention blocks',()=>{
 const g=new Game();
 assert(g.onfoot,'new save starts docked on the station deck');
 assert.equal(g.onfoot.kind,'station');
 const hangar=g.onfoot.zones.find(z=>z.launch);
 assert(hangar);
 g.onfoot.x=hangar.x;g.onfoot.y=hangar.y;
 assert(g.launch());
 assert.equal(g.onfoot,null);
 assert.equal(g.s.docked,false);
 g.player.x=g.station.x;g.player.y=g.station.y+50;
 assert(g.dock());
 assert(g.onfoot);
 assert(g.onfoot.zones.some(z=>z.service==='market'));
 const market=g.onfoot.zones.find(z=>z.service==='market');
 assert.match(market.label,/Refuel/);
 g.onfoot.x=market.x;g.onfoot.y=market.y;
 const open=g.interactStation();
 assert.equal(open.service,'market');
 assert(g.s.docked);
 ticks(g,.2,{aim:0,thrust:1});
 assert(g.s.stationPos);
 const h=roundtrip(g);
 assert(h.s.docked);
 assert(h.onfoot);
 assert.ok(Math.abs(h.onfoot.x-g.onfoot.x)<2);
 h.onfoot.x=hangar.x;h.onfoot.y=hangar.y;
 assert(h.launch());
 const prison=SYSTEMS.find(sys=>sys.prison)||SYSTEMS[h.nearestPrison()];
 h.teleportTo(prison.id,{docked:true});
 h.s.detained=true;h.s.bounty=800;h.s.stationPos=null;h.enterStationDeck();
 assert(h.onfoot.zones.some(z=>z.service==='detention'));
 assert(h.onfoot.zones.some(z=>z.service==='market'&&/Refuel/.test(z.label)));
 assert(!h.onfoot.zones.some(z=>z.service==='contracts'));
 const bay=h.onfoot.zones.find(z=>z.launch);
 h.onfoot.x=bay.x;h.onfoot.y=bay.y;
 assert(!h.launch());
 assert(h.s.docked);
 h.s.credits=Math.max(h.s.credits,5000);
 assert(h.payBounty());
 assert(!h.s.detained);
 assert(h.launch());
});
test('Living concourse: standing crew, props, speech, and isometric station renderer',()=>{
 const g=new Game();
 assert.equal(g.onfoot.kind,'station');
 assert.equal(g.onfoot.faction,'concord');
 assert(g.onfoot.factionColor);
 const roles=new Set(g.onfoot.npcs.map(n=>n.role));
 for(const role of ['clerk','walker','robot','hauler','talker','tech','sitter'])assert(roles.has(role),role);
 assert(g.onfoot.npcs.filter(n=>n.role==='clerk').length>=5);
 const names=new Set(g.onfoot.npcs.filter(n=>n.role!=='robot').map(n=>n.name));
 assert.equal(names.size,g.onfoot.npcs.filter(n=>n.role!=='robot').length,'crew names should be unique');
 const robot=g.onfoot.npcs.find(n=>n.role==='robot');
 assert.equal(robot.name,STATION_ROBOT.nameFor(SYSTEMS[0]));
 const kinds=new Set(g.onfoot.props.map(p=>p.kind));
 for(const kind of ['kiosk','crate','shuttle','bench','planter','bollard','window','light'])assert(kinds.has(kind),kind);
 assert(pointInHull(g.onfoot.hull,g.onfoot.x,g.onfoot.y,14));
 const pell=g.onfoot.npcs.find(n=>n.role==='tech');
 g.onfoot.x=pell.x;g.onfoot.y=pell.y;
 ticks(g,4);
 assert(g.onfoot.npcs.some(n=>n.line),'idle crew should chat');
 const hangar=g.onfoot.zones.find(z=>z.launch);
 g.onfoot.x=hangar.x;g.onfoot.y=hangar.y;
 ticks(g,.4,{aim:-Math.PI/2,thrust:1});
 assert(pointInHull(g.onfoot.hull,g.onfoot.x,g.onfoot.y,14));
 const office=g.onfoot.zones.find(z=>z.service==='shipyard'&&!z.launch);
 assert(office);g.onfoot.x=office.x;g.onfoot.y=office.y;
 assert.equal(g.interactStation().service,'shipyard');
 const prison=createStationLayout({prison:true,detained:true,name:'Prison barge',robotName:'Picket-3'});
 assert(prison.zones.some(z=>z.service==='detention'));
 assert(!prison.zones.some(z=>z.service==='contracts'));
 assert(prison.npcs.some(n=>n.role==='clerk'));
 assert.equal(prison.npcs.find(n=>n.role==='robot')?.name,'Picket-3');
 assert(pickStationChat({role:'walker',id:'walk-0'}));
 const render=readFileSync(new URL('../dist/onfoot-render.mjs',import.meta.url),'utf8');
 assert.match(render,/renderStationConcourse/);
 assert.match(render,/drawStandingCrew/);
 assert.match(render,/drawRobotUnit/);
 assert.match(render,/drawKiosk/);
 assert.match(render,/drawIsoDisc/);
 assert.match(render,/drawIsoPrism/);
 assert.match(render,/makeStationProjector/);
 assert.match(render,/drawFloorPanels/);
 assert.match(render,/drawDoorFrame/);
 assert.match(render,/drawRailing/);
 assert.match(render,/drawContactShadow/);
 assert.match(render,/drawHubCurb/);
 assert.match(render,/drawDeckRim/);
 assert.match(render,/drawRimWindows/);
 assert.match(render,/along=hull\.hubR/);
 assert.equal(STATION_ISO.ix,1);assert.equal(STATION_ISO.iy,.5);
 const right=isoWalkAxes(1,0);
 assert.ok(right.ax>0&&right.ay<0,'stick right should walk world +X −Y (screen east)');
 const down=isoWalkAxes(0,1);
 assert.ok(down.ax>0&&down.ay>0,'stick down should walk world +X +Y (toward camera)');
 const proj=makeStationProjector({x:office.x,y:office.y},390,844);
 const hub=proj.p(g.onfoot.hull.cx,g.onfoot.hull.cy,0);
 const rim=proj.p(g.onfoot.hull.cx+g.onfoot.hull.hubR,g.onfoot.hull.cy,0);
 const {rx,ry}=proj.radii(g.onfoot.hull.hubR);
 assert.ok(rx>ry*1.6,'hub floor must project as a wide isometric ellipse, not a circle');
 assert.ok(Math.abs((rim.x-hub.x)/rx)<1.05);
 const app=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
 assert.match(app,/CONCOURSE/);
 assert.match(app,/step onto the concourse/);
});
test('Surface beacon ping reveals the nearest unscanned anomaly',()=>{
 const g=new Game();g.launch();
 const p=g.planets.find(pl=>pl.landable!==false)||g.planets[0];
 g.player.x=p.x;g.player.y=p.y+p.r+300;assert(g.land());
 assert(g.surface.kindId);
 const a=g.surface.anomalies[0];
 g.surface.x=40;g.surface.y=200;g.surface.vx=g.surface.vy=0;
 assert(!g.scanSurface());
 assert(g.pingSurface());
 assert(g.surface.ping);
 assert.equal(g.surface.ping.x,a.x);
 assert(!g.pingSurface());
 ticks(g,9);
 assert(g.pingSurface());
});
test('Planetary space legs: disembark, inspect, board, then takeoff',()=>{
 const g=new Game();g.launch();
 const p=g.planets.find(pl=>pl.landable!==false)||g.planets[0];
 g.player.x=p.x;g.player.y=p.y+p.r+300;assert(g.land());
 const a=g.surface.anomalies[0];
 g.surface.x=a.x;g.surface.y=terrainAt(g.surface.x,g.surface.seed)-19;g.surface.vx=g.surface.vy=0;g.surface.landed=true;
 assert(g.disembark());
 assert(g.onfoot);assert.equal(g.onfoot.kind,'planet');
 assert(!g.takeoff());
 const pad=g.onfoot.zones.find(z=>z.anomalyId===a.id);
 assert(pad,'nearby inspect pad for landed anomaly');
 g.onfoot.x=pad.x;g.onfoot.y=pad.y;
 const before=g.s.records.length;
 assert(g.interactPlanet()?.scanning);
 assert(g.audioCues.includes('surface.inspect.start'));
 assert(g.audioCues.includes('surface.inspect.loop'));
 ticks(g,1.6);
 assert.equal(g.s.records.length,before+1);
 assert(a.scanned);
 assert(g.s.surfaceScanned.includes(a.id));
 assert(g.audioCues.includes('surface.inspect.stop'));
 const cache=g.onfoot.zones.find(z=>z.service==='cache'||z.id==='cache');
 if(cache){g.onfoot.x=cache.x;g.onfoot.y=cache.y;assert(g.interactPlanet()?.cache);assert(cache.looted||cache.service==='done');}
 g.onfoot.x=g.onfoot.zones.find(z=>z.board).x;g.onfoot.y=g.onfoot.zones.find(z=>z.board).y;
 assert(g.interactPlanet()?.board);
 assert(!g.onfoot);assert(g.surface.landed);
 assert(g.siteFx);assert.equal(g.siteFx.kind,'embark');
 assert(g.audioCues.includes('surface.embark'));
 assert(g.takeoff());
 assert(!g.surface);
 assert(g.siteFx);assert.equal(g.siteFx.kind,'takeoff');
 assert(g.audioCues.includes('surface.takeoff'));
 ticks(g,.6);
 assert(!g.siteFx);
});
test('Weapon modes, mining split, loadout identity, and combat feedback',()=>{
 const g=new Game();assert.equal(getStats(g.s).weapon,'pulse');assert.equal(getStats(g.s).weaponName,'Pulse cannon');
 g.s.credits=50000;assert(g.upgrade('beam'));assert.equal(getStats(g.s).weapon,'beam');assert.equal(MODULES.beam.category,'weapon');
 assert(!g.upgrade('missile'),'Cannot fit a second weapon category');assert(g.unequip(g.s.loadouts.wren.find(uid=>g.s.modules.find(m=>m.uid===uid).kind==='beam')));
 assert(g.upgrade('missile'));assert.equal(getStats(g.s).weapon,'missile');assert.equal(getStats(g.s).missileMax,6);
 g.launch();assert.equal(g.missiles,6);g.enemies=[];const rock=g.asteroids[0];g.asteroids=[rock];g.player.x=rock.x-110;g.player.y=rock.y;g.player.angle=0;g.target=rock;g.energy=100;
 ticks(g,2,{fire:true});assert.equal(g.s.mined,1);assert(!g.asteroids.length,'Mining laser depletes rocks');
 const h=new Game();h.s.ship='falcon';h.s.hull=getStats(h.s).hull;h.s.shield=getStats(h.s).shield;h.launch();assert.equal(getStats(h.s).weapon,'beam');
 h.enemies=[{id:'e-beam',type:'enemy',x:h.player.x+180,y:h.player.y,hp:40,max:40,r:16,angle:0,bounty:50,fire:9}];h.asteroids=[];h.player.angle=0;h.target=h.enemies[0];h.energy=100;
 const hpBefore=h.enemies[0].hp;ticks(h,.5,{fire:true});assert(h.shots.some(s=>s.kind==='beam')||h.enemies.length===0||h.enemies[0].hp<hpBefore);assert(h.hitMarks.length||h.enemies.length===0||h.enemies[0].hp<hpBefore);
 const v=new Game();v.s.ship='vulture';v.s.hull=getStats(v.s).hull;v.s.shield=getStats(v.s).shield;v.launch();assert.equal(getStats(v.s).weapon,'missile');assert.equal(v.missiles,8);
 v.enemies=[{id:'e-m',type:'enemy',x:v.player.x+240,y:v.player.y,hp:90,max:90,r:16,angle:0,bounty:50,fire:9}];v.asteroids=[];v.player.angle=0;v.target=v.enemies[0];v.energy=100;
 const before=v.missiles;v.shoot();assert.equal(v.missiles,before-1);assert(v.shots.some(s=>s.kind==='missile'&&s.seek==='e-m'));
 const p=new Game();fit(p,'prospector');assert.equal(getStats(p.s).miningDamage,32);assert.equal(getStats(p.s).miningYield,2);
 const modules=moduleView(p);assert(modules.includes('Beam lance'));assert(modules.includes('Seeker rack'));
});
test('Station boards regenerate, follow local economies, and raise company standing',()=>{
 const g=new Game();
 assert.deepEqual(g.s.companies,{});
 const first=contractsFor(g.s);
 assert.equal(first.length,4);
 assert(first.every(m=>m.company&&m.companyName&&m.faction==='concord'));
 const harvest=companiesFor(SYSTEMS[0]);
 assert.equal(harvest.length,2);
 assert(harvest.every(c=>c.faction==='concord'));
 const mining=first.find(m=>m.type==='mining');
 assert(mining);
 const credits=g.s.credits;
 assert(g.accept(mining.id));
 g.s.cargo.ore=5;
 g.claimMissions();
 assert.equal(g.s.credits,credits+mining.reward);
 assert.equal(g.s.companies[mining.company].completed,1);
 assert.equal(g.s.companies[mining.company].standing,8);
 assert.equal(g.s.reputation.concord,2);
 const remaining=contractsFor(g.s);
 assert.equal(remaining.length,3);
 assert(!remaining.some(m=>m.id===mining.id));
 g.s.completed.push(...remaining.map(m=>m.id));
 const next=contractsFor(g.s);
 assert.equal(next.length,4);
 assert(next.every(m=>!first.some(f=>f.id===m.id)));
 const partner=new Game();
 const sample=contractsFor(partner.s).find(m=>m.company);
 const low=sample.reward;
 partner.s.companies={[sample.company]:{standing:80,completed:10}};
 const boosted=contractsFor(partner.s).find(m=>m.company===sample.company);
 assert.equal(companyRank(80).name,'Partner');
 assert(boosted.reward>low);
 assert(boosted.rankLevel>=3);
 const extraction=SYSTEMS.find(sys=>sys.eco==='Extraction'&&sys.hasStation);
 partner.s.system=extraction.id;if(!partner.s.visited.includes(extraction.id))partner.s.visited.push(extraction.id);
 const board=contractsFor(partner.s);
 const freight=board.filter(m=>m.type==='mining'||m.type==='delivery').length;
 assert(freight>=board.length*0.75,extraction.name+' should favor mining and freight');
 const preferred=new Game();
 preferred.s.companies={[companiesFor(SYSTEMS[0])[0].id]:{standing:40,completed:5}};
 assert(contractsFor(preferred.s).length>=5);
 assert(contractsFor(preferred.s).some(m=>m.name.startsWith('Priority')));
 const saved=validateSave(JSON.parse(JSON.stringify(g.serialize())));
 assert.equal(saved.companies[mining.company].standing,8);
 assert.equal(roundtrip(g).s.companies[mining.company].completed,1);
 const app=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
 assert.match(app,/Local companies aligned with the system faction/);
 assert.match(app,/contractorLine/);
});

test('Company careers unlock exclusive jobs, hangar discounts, and Partner liaison',()=>{
 const g=new Game();
 const cos=companiesFor(SYSTEMS[0]);
 for(const c of cos)g.s.companies[c.id]={standing:20,completed:3,perk:false};
 let board=contractsFor(g.s);
 assert(board.some(m=>m.type==='escort'&&m.career));
 for(const c of cos)g.s.companies[c.id]={standing:45,completed:6,perk:false};
 board=contractsFor(g.s);
 assert(board.length>=5);
 const preferred=new Game();
 for(const c of companiesFor(SYSTEMS[0]))preferred.s.companies[c.id]={standing:45,completed:6,perk:false};
 preferred.s.docked=true;
 const ship=SHIPS.find(s=>s.id!==preferred.s.ship&&s.price<=preferred.s.credits+50000);
 preferred.s.credits=ship.price;
 const before=preferred.s.credits;
 assert(preferred.buyShip(ship.id));
 assert(before-preferred.s.credits<ship.price);
 const partner=new Game();
 for(const c of companiesFor(SYSTEMS[0]))partner.s.companies[c.id]={standing:80,completed:12,perk:false};
 board=contractsFor(partner.s);
 assert(board.some(m=>m.type==='salvage'||m.type==='geology'));
 const job=board.find(m=>m.type==='escort')||board.find(m=>m.career);
 assert(partner.accept(job.id));
 if(job.type==='escort'||job.type==='bounty')partner.s.metrics.pirates=(job.startKills||0)+(job.required||2);
 if(job.type==='geology')partner.s.metrics.geology=(job.startGeology||0)+(job.required||2);
 if(job.type==='salvage')partner.s.cargo[job.good||'crystal']=job.tons||3;
 partner.claimMissions();
 assert(Object.values(partner.s.companies).some(c=>c.perk));
 assert(partner.s.modules.some(m=>m.kind==='liaison'));
 const app=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
 assert.match(app,/m\.type==='escort'/);assert.match(app,/m\.type==='salvage'/);assert.match(app,/m\.type==='geology'/);
 assert.match(app,/Liaison|Partner|Preferred hangar|hangar rate|career/i);
});

let failed=0;for(const [name,fn]of tests){try{fn();console.log('PASS '+name);}catch(e){failed++;console.error('FAIL '+name);console.error(e);}}console.log(`\n${tests.length-failed} / ${tests.length} Frontiers checks passed.`);if(failed)process.exitCode=1;

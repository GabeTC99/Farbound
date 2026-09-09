import assert from 'node:assert/strict';
import {Game,newSave,validateSave,SYSTEMS,SHIPS,GOODS,GUILDS,MODULES,getStats,cargoUsed,jumpDistance,jumpCost,price,contractsFor,findRoute,systemName,missionDestination,guildProgress,operationDetails,terrainAt} from '../dist/frontier.mjs';
import {Game as ClassicGame,getStats as classicStats} from '../dist/classic/core.mjs';
import {readPilot,writePilot,readCheckpoint,SAVE_KEY,BACKUP_KEY,ORIGINAL_KEY} from '../dist/pilot-storage.mjs';
import {moduleView,fleetView,guildView,factionView,mapView,robotView} from '../dist/frontier-views.mjs';
import {STATION_ROBOT,buildRobotContext,pickRobotLine,ROBOT_LINES} from '../dist/station-robot.mjs';
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
test('Survey contract routing changes to its home station after both worlds are surveyed',()=>{
 const g=new Game(),m=contractsFor(g.s).find(m=>m.type==='survey');assert(g.accept(m.id));assert.equal(missionDestination(g.s,m),m.destination);g.s.scanned.push(`planet-${m.destination}-0`,`planet-${m.destination}-1`);assert.equal(missionDestination(g.s,m),m.origin);
});
test('New systems pay on discovery scans once; fuel scooping prevents stranding',()=>{
 const g=new Game();place(g,64,false);const home=g.s.system,dest=SYSTEMS.find(s=>s.uncharted&&!s.hasStation&&s.id!==home&&jumpDistance(home,s.id)<=14).id;
 assert(g.jumpTo(dest));ticks(g,3.1);assert.equal(g.s.metrics.discoveries,0);assert.equal(g.s.data,0);assert.equal(g.visiblePlanets.length,0);assert(!g.dock());
 assert(g.discover());ticks(g,4.1);assert.equal(g.s.metrics.discoveries,1);assert.equal(g.s.data,500);assert.equal(g.visiblePlanets.length,2);
 g.s.fuel=0;g.player.x=g.star.x+g.star.r+310;g.player.y=g.star.y;assert(g.scoop());ticks(g,10);assert.equal(g.s.fuel,getStats(g.s).fuel);assert(!g.scooping);assert(g.s.heat<80);
 assert(g.jumpTo(home));ticks(g,3.1);assert(g.jumpTo(dest));ticks(g,3.1);assert(!g.discover());assert.equal(g.s.metrics.discoveries,1);const h=roundtrip(g);assert(!h.discover());h.s.hull=0;ticks(h,.1);assert(h.s.docked);assert(h.sys.hasStation);
});
test('Planetary landings restore in place, record signals once, and sell only when docked',()=>{
 let g=new Game();g.launch();const p=g.planets[0];approach(g,p);ticks(g,1);assert(g.land());assert(!g.jumpTo(1));const a=g.surface.anomalies[0],initial=g.s.credits;scanSignal(g,a);assert.equal(g.s.records.length,1);assert.equal(g.s.metrics.anomalies,1);assert.equal(g.s.credits,initial);g=roundtrip(g);assert(g.surface);assert.equal(g.surface.anomalies[0].scanned,true);assert.equal(g.s.records.length,1);const value=g.s.records[0].value;g.takeoff();g.player.x=0;g.player.y=185;assert(g.dock());assert.equal(g.s.credits,initial);assert.equal(g.s.records.length,1);assert(g.sellExplorationData());assert.equal(g.s.credits,initial+value);assert.equal(g.s.records.length,0);assert(!g.sellExplorationData());g.dock();assert.equal(g.s.credits,initial+value);g.launch();g.player.x=p.x;g.player.y=p.y+p.r+300;assert(g.land());assert(g.surface.anomalies[0].scanned);assert.equal(g.s.metrics.anomalies,1);
});
test('Surface scans cancel when moving fast; crash recovery loses only this expedition’s signals',()=>{
 const g=new Game();g.launch();const p=g.planets[0];g.player.x=p.x;g.player.y=p.y+p.r+300;assert(g.land());const a=g.surface.anomalies[0];g.surface.x=a.x;g.surface.y=a.y-80;g.surface.vx=100;assert(!g.scanSurface());g.surface.vx=0;assert(g.scanSurface());ticks(g,.5,{surfaceX:1,boost:true});assert.equal(g.surface.scan,null);g.surface.vx=0;scanSignal(g,a);g.takeoff();assert(g.land());scanSignal(g,g.surface.anomalies[1]);g.surface.integrity=.1;g.surface.y=terrainAt(g.surface.x,g.surface.seed);g.surface.vy=300;ticks(g,.04);assert.equal(g.surface,null);assert.equal(g.s.records.length,1);assert.equal(g.s.hull,80);
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
 const g=new Game();fit(g,'cartographer');fit(g,'prospector');g.launch();const p=g.planets[0];g.player.x=p.x;g.player.y=p.y+p.r+900;assert(g.scanTarget());ticks(g,2.3);assert(g.s.scanned.includes(p.id));assert.equal(g.s.data,Math.round(p.value*1.25));g.enemies=[];const rock=g.asteroids[0];g.asteroids=[rock];g.player.x=rock.x-110;g.player.y=rock.y;g.player.angle=0;ticks(g,2,{fire:true});assert.equal(g.s.mined,2);assert.equal(cargoUsed(g.s),2);const h=roundtrip(g);assert(!h.asteroids.some(r=>r.id===rock.id),'Mined rocks stay depleted after reload');
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
 const g=new Game();fit(g,'merchant');for(const sys of SYSTEMS)for(const rep of [-100,0,100]){if(sys.faction)g.s.reputation[sys.faction]=rep;for(const good of GOODS)assert(price(sys,good.id,true,g.s)>price(sys,good.id,false,g.s));}
});
test('Migration preserves the original save byte-for-byte; checkpoints recover damaged v2 saves',()=>{
 const storage=new MemoryStorage(),original=JSON.stringify(new ClassicGame().serialize());storage.setItem(ORIGINAL_KEY,original);const boot=readPilot(storage);assert(boot.migrated);writePilot(storage,boot.pilot,{now:1000});assert.equal(storage.getItem(ORIGINAL_KEY),original);const next=structuredClone(boot.pilot);next.credits+=100;writePilot(storage,next,{now:2000});assert.equal(readCheckpoint(storage).pilot.credits,2400);storage.setItem(SAVE_KEY,'corrupted');const recovered=readPilot(storage);assert(recovered.recovered);assert.equal(recovered.pilot.credits,2400);assert.equal(storage.getItem(ORIGINAL_KEY),original);writePilot(storage,next,{now:3000});const final=structuredClone(next);final.credits+=500;writePilot(storage,final,{checkpoint:true,now:4000});assert.equal(readCheckpoint(storage).pilot.credits,2500);assert.equal(readPilot(storage).pilot.credits,3000);assert(storage.getItem(BACKUP_KEY));
});
test('Malformed saves reject duplicate modules, duplicate rewards, overloads, and unknown entries',()=>{
 const g=new Game();const m=fit(g,'pathfinder'),base=g.serialize();for(const alter of [s=>s.modules.push({...m}),s=>s.loadouts.mule.push(m.uid),s=>s.cargo.food=999,s=>s.modules[0].kind='missing',s=>s.reputation.concord=101,s=>s.metrics.anomalies=-1,s=>s.surfaceScanned.push('planet-9999-0-a0')]){const bad=structuredClone(base);alter(bad);assert.equal(validateSave(bad),null);}assert.equal(validateSave({}),null);
});
test('Panel generators cover all navigation actions and render all guilds, factions, and modules',()=>{
 const g=new Game();const guilds=guildView(g),factions=factionView(g),modules=moduleView(g),fleet=fleetView(g);for(const guild of GUILDS)assert(guilds.includes(guild.name));assert(factions.includes('Cinder Directorate'));assert(modules.includes('data-action="upgrade"'));for(const ship of SHIPS)assert(fleet.includes(ship.name));g.setRoute(191);const chart=mapView(g,191);assert(chart.includes('Jump next')||chart.includes('Launch to jump'));assert(chart.includes('Uncharted UR-128'));assert(!chart.includes(SYSTEMS[191].name));
});
test('Station robot Nellby-9 is configurable, greets on dock, and biases dialogue by context',()=>{
 assert.equal(STATION_ROBOT.displayName,'Nellby-9');
 assert.equal(STATION_ROBOT.roleLabel,'Station Service Unit');
 assert(ROBOT_LINES.greeting.length>=3);
 assert(ROBOT_LINES.wanted.length>=2);
 assert(ROBOT_LINES.damaged.length>=2);
 const g=new Game();
 assert.equal(g.s.robotMet,false);
 const desk=robotView(g);
 assert(desk.includes(STATION_ROBOT.displayName));
 assert(desk.includes('data-action="robot-talk"'));
 assert(desk.includes('robot-face--'));
 g.launch();
 g.player.x=g.station.x;g.player.y=g.station.y+50;
 const before=g.events.length;
 assert(g.dock());
 assert(g.s.robotMet);
 assert(g.events.length>before);
 assert(g.events.some(e=>ROBOT_LINES.greeting.some(([t])=>t===e.text)||e.text.includes('Exploration data')||e.text.includes('Docking complete')||e.text.includes('Welcome')));
 assert(g.robotState?.lastText);
 const line=g.talkRobot();
 assert(line?.text);
 assert(['neutral','happy','confused','annoyed','alert'].includes(line.expression));
 g.s.bounty=900;g.s.hull=40;g.s.cargo.ore=3;
 const ctx=buildRobotContext(g);
 assert(ctx.wanted);assert(ctx.damaged);assert(ctx.tags.includes('mining'));
 let wantedHits=0,damagedHits=0;
 for(let i=0;i<40;i++){const pick=pickRobotLine(g,'talk');if(pick.tag==='wanted')wantedHits++;if(pick.tag==='damaged')damagedHits++;}
 assert(wantedHits+damagedHits>=10,'expected situational dialogue bias');
 const saved=validateSave(JSON.parse(JSON.stringify(g.serialize())));
 assert.equal(saved.robotMet,true);
 assert.equal(roundtrip(g).s.robotMet,true);
});
let failed=0;for(const [name,fn]of tests){try{fn();console.log('PASS '+name);}catch(e){failed++;console.error('FAIL '+name);console.error(e);}}console.log(`\n${tests.length-failed} / ${tests.length} Frontiers checks passed.`);if(failed)process.exitCode=1;

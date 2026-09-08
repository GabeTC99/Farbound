import assert from 'node:assert/strict';
import {Game,newSave,validateSave,SYSTEMS,GOODS,getStats,cargoUsed,jumpDistance,jumpCost,price,contractsFor} from '../dist/classic/core.mjs';
function ticks(game,seconds,input={}){for(let i=0;i<seconds*30;i++)game.update(1/30,input);}
function approach(game,target){game.target=target;game.autopilot();for(let i=0;i<30*100&&game.auto;i++)game.update(1/30);assert.equal(game.auto,null,'Autopilot must arrive within 100 seconds');}
let count=0;function test(name,fn){fn();count++;console.log('PASS '+name);}
test('First flight earns credits by surveying a planet and returning to dock',()=>{
 const g=new Game(),before=g.s.credits;g.launch();const planet=g.planets[0];approach(g,planet);assert(g.scanTarget());ticks(g,3.2);assert(g.s.scanned.includes(planet.id));assert(g.s.data>0);assert(!g.scanTarget(),'Survey may only pay once per world');approach(g,g.station);assert(g.dock());assert(g.s.credits>before);assert.equal(g.s.data,0);
});
test('Delivery cargo is reserved, consumes fuel in transit, and pays only once at destination',()=>{
 const g=new Game(),job=contractsFor(g.s).find(m=>m.type==='delivery'),credits=g.s.credits;assert(g.accept(job.id));assert.equal(cargoUsed(g.s),3);assert(!g.accept(job.id));assert(!g.jumpTo(job.destination),'Docked ships cannot jump');g.launch();const cost=jumpCost(0,job.destination);assert(g.jumpTo(job.destination));ticks(g,3.3);assert.equal(g.s.system,job.destination);assert.equal(g.s.fuel,100-cost);approach(g,g.station);g.dock();assert.equal(g.s.credits,credits+job.reward);assert.equal(cargoUsed(g.s),0);assert.equal(g.s.contracts,1);g.claimMissions();assert.equal(g.s.credits,credits+job.reward);
});
test('Trade profits depend on the destination economy and cannot overspend or duplicate cargo',()=>{
 const g=new Game(),before=g.s.credits;assert(g.buy('food',5));assert.equal(g.s.cargo.food,5);g.s.system=1;g.makeSystem();assert(g.sell('food',5));assert(g.s.credits>before);const balance=g.s.credits;assert(!g.sell('food',1));assert.equal(g.s.credits,balance);assert(!g.buy('food',-10));assert(!g.buy('unknown',1));g.s.credits=0;assert(!g.buy('tech'));assert.equal(g.s.cargo.tech,0);
});
test('Asteroid mining collects cargo; a full hold does not overfill',()=>{
 const g=new Game();g.launch();g.enemies=[];const rock=g.asteroids[0];g.asteroids=[rock];g.player.x=rock.x-110;g.player.y=rock.y;g.player.angle=0;ticks(g,2,{fire:true});assert.equal(g.s.mined,1);assert.equal(cargoUsed(g.s),1);assert.equal(g.asteroids.length,0);
 const h=new Game();h.launch();h.enemies=[];const r=h.asteroids[0];h.asteroids=[r];h.s.cargo.food=getStats(h.s).cargo;h.player.x=r.x-110;h.player.y=r.y;h.player.angle=0;ticks(h,2,{fire:true});assert.equal(cargoUsed(h.s),getStats(h.s).cargo);
});
test('Combat awards bounties, regenerates shields, and recovers a destroyed pilot',()=>{
 const g=new Game();g.launch();g.asteroids=[];const enemy=g.enemies[0];g.enemies=[enemy];g.player.x=enemy.x-230;g.player.y=enemy.y;const credits=g.s.credits;
 for(let i=0;i<200&&g.enemies.length;i++){g.player.angle=Math.atan2(enemy.y-g.player.y,enemy.x-g.player.x);g.update(1/30,{fire:true});}
 assert.equal(g.s.kills,1);assert.equal(g.s.credits,credits+enemy.bounty);g.s.shield=10;g.lastDamage=g.time;ticks(g,6);assert(g.s.shield>10);g.s.cargo.ore=4;g.s.data=100;g.s.hull=0;ticks(g,.1);assert(g.s.docked);assert.equal(cargoUsed(g.s),0);assert.equal(g.s.data,0);assert.equal(g.s.hull,getStats(g.s).hull);
});
test('Ship and module progression transfers cargo and preserves caps',()=>{
 const g=new Game();g.s.credits=30000;g.buy('food',5);assert(g.upgrade('cargo'));assert(g.buyShip('mule'));assert.equal(g.s.ship,'mule');assert.equal(g.s.cargo.food,5);assert.equal(getStats(g.s).cargo,54);for(let i=0;i<4;i++)g.upgrade('shield');assert.equal(g.s.upgrades.shield,3);assert.equal(g.s.shield,getStats(g.s).shield);
});
test('Every system is reachable with the starter drive and free recovery prevents stranding',()=>{
 const reachable=new Set([0]);for(let pass=0;pass<24;pass++)for(const a of [...reachable])for(const b of SYSTEMS)if(jumpDistance(a,b.id)<=14)reachable.add(b.id);assert.equal(reachable.size,24);const g=new Game();g.launch();assert(!g.jumpTo(23));g.s.fuel=0;assert(!g.jumpTo(1));g.s.credits=0;g.rescue();assert.equal(g.s.fuel,getStats(g.s).fuel);assert(g.s.docked);assert.equal(g.s.credits,0);
});
test('Save round trip restores pilot position, credits, inventory and contracts; malformed imports fail',()=>{
 const g=new Game();g.accept('0-0');g.launch();ticks(g,1,{thrust:1});const data=JSON.parse(JSON.stringify(g.serialize())),saved=validateSave(data);assert(saved);const h=new Game(saved);assert.equal(h.player.x,g.player.x);assert.equal(h.player.y,g.player.y);assert.equal(h.s.credits,g.s.credits);assert.equal(h.s.missions[0].id,'0-0');const bad=structuredClone(data);bad.credits=-1;assert.equal(validateSave(bad),null);const inject=structuredClone(data);inject.stock={'0:food':'<img src=x>'};assert.equal(validateSave(inject),null);assert.equal(validateSave({}),null);
});
test('Survey, mining and bounty contracts settle with their actual objectives',()=>{
 for(const type of ['survey','mining','bounty']){const g=new Game(),m=contractsFor(g.s).find(m=>m.type===type);assert(g.accept(m.id));const before=g.s.credits;g.claimMissions();assert.equal(g.s.credits,before);if(type==='survey')g.s.scanned.push(`planet-${m.destination}-0`,`planet-${m.destination}-1`);if(type==='mining')g.s.cargo.ore=5;if(type==='bounty')g.s.kills=2;g.claimMissions();assert.equal(g.s.credits,before+m.reward);assert.equal(g.s.missions.length,0);assert.equal(g.s.contracts,1);if(type==='mining')assert.equal(g.s.cargo.ore,0);}
});
console.log(`\n${count} gameplay checks passed.`);

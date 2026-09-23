import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
import {Game,newSave,validateSave,SYSTEMS,systemName,HORT_SYSTEM_ID,HORT_SYSTEM_NAME,HORT_SYSTEM_NICK,STATION_HORT,HORT_LINES,pickHortLine} from '../dist/frontier.mjs';
import {mapView,hortStrip} from '../dist/frontier-views.mjs';
import {createStationLayout,pickStationChat,STATION_CHAT} from '../dist/station-layout.mjs';
import {HORT_SYSTEM_ID as catalogId} from '../dist/catalog.mjs';

const srcFiles=['../dist/station-hort.mjs','../dist/station-layout.mjs','../dist/frontier.mjs','../dist/frontier-views.mjs','../dist/app.js','../dist/catalog.mjs','../README.md','../releases/v2.16.10.json','../releases/v2.16.11.json'];
const banned=/legal name|real person|named after a real/i;
for(const file of srcFiles){
 const src=readFileSync(new URL(file,import.meta.url),'utf8');
 assert.ok(!banned.test(src),file+' must not leak a real-world identity');
}

assert.equal(catalogId,HORT_SYSTEM_ID);
assert.equal(HORT_SYSTEM_ID,105);
assert.equal(HORT_SYSTEM_NAME,'Hortreach');
assert.equal(HORT_SYSTEM_NICK,"Hort's Pasture");
const hortSys=SYSTEMS[HORT_SYSTEM_ID];
assert(hortSys);
assert.equal(hortSys.id,105);
assert.equal(hortSys.uncharted,true);
assert.equal(hortSys.hasStation,false);
assert.equal(hortSys.eco,'Agricultural');
assert.equal(hortSys.catalog,'UR-042');
assert.equal(hortSys.name,HORT_SYSTEM_NAME);
assert.equal(hortSys.search,HORT_SYSTEM_NICK);
assert.match(hortSys.lore,/Hortreach/);
assert.match(hortSys.lore,/Hort's Pasture/);
assert.equal(new Set(SYSTEMS.map(s=>s.name)).size,192);

const fresh=newSave();
assert.equal(systemName(hortSys,fresh),'Uncharted UR-042');
assert.ok(!systemName(hortSys,fresh).includes(HORT_SYSTEM_NAME));
const seen={...fresh,visited:[...fresh.visited,HORT_SYSTEM_ID]};
assert.equal(systemName(hortSys,seen),HORT_SYSTEM_NAME);

const g=new Game();
const chart=mapView(g,HORT_SYSTEM_ID,'hort');
assert.match(chart,new RegExp('data-id="'+HORT_SYSTEM_ID+'"'));
assert.match(mapView(g,HORT_SYSTEM_ID,'pasture'),new RegExp('data-id="'+HORT_SYSTEM_ID+'"'));
assert.match(mapView(g,HORT_SYSTEM_ID,'ur-042'),new RegExp('data-id="'+HORT_SYSTEM_ID+'"'));
assert.match(mapView(g,HORT_SYSTEM_ID,'Hortreach'),new RegExp('data-id="'+HORT_SYSTEM_ID+'"'));

assert.equal(STATION_HORT.displayName,'Hort');
assert.equal(STATION_HORT.roleLabel,'Station messenger');
assert(g.onfoot,'new save starts on Solace deck');
assert(g.onfoot.zones.some(z=>z.service==='messenger'));
assert.equal(g.onfoot.npcs.filter(n=>n.name==='Hort').length,1);
const hort=g.onfoot.npcs.find(n=>n.name==='Hort');
assert.equal(hort.role,'messenger');
assert.equal(hort.look,'hort');
assert.equal(hort.service,'messenger');
assert(pickStationChat(hort));
assert(STATION_CHAT.messenger.length>=3);
g.onfoot.x=hort.x;g.onfoot.y=hort.y;
const desk=g.onfoot.zones.find(z=>z.service==='messenger');
g.onfoot.x=desk.x;g.onfoot.y=desk.y;
assert.equal(g.interactStation().service,'messenger');

const greet=g.talkHort('greeting');
assert(HORT_LINES.greeting.some(([t])=>t===greet.text));
const talk=g.talkHort();
assert(talk?.text);
assert(['greeting','general','pasture','tips'].includes(talk.tag));
const tip=g.talkHort('tip');
assert.equal(tip.tag,'tips');
assert(HORT_LINES.tips.some(([t])=>t===tip.text));
assert(HORT_LINES.pasture.some(([t])=>/Hortreach|Hort's Pasture|UR-042/.test(t)));
const strip=hortStrip(g);
assert.match(strip,/hort-portrait\.png/);
assert.match(strip,/Station messenger/);
assert.match(strip,/>Hort</);
assert.match(strip,/data-action="hort-talk"/);
assert.match(strip,/data-action="hort-tip"/);
assert.match(strip,new RegExp(STATION_HORT.displayName));

const saved=validateSave(JSON.parse(JSON.stringify(g.serialize())));
assert(saved);
assert.equal(saved.robotMet,g.s.robotMet);
const again=new Game(saved);
assert(again.onfoot.npcs.some(n=>n.name==='Hort'));

g.teleportTo(1,{docked:true});
assert.ok(!g.onfoot.zones.some(z=>z.service==='messenger'));
assert.ok(!g.onfoot.npcs.some(n=>n.name==='Hort'));
assert.equal(g.talkHort(),null);

const other=createStationLayout({name:'Elsewhere',robotName:'Vesper-4'});
assert.ok(!other.zones.some(z=>z.service==='messenger'));
assert.ok(!other.npcs.some(n=>n.name==='Hort'));
const prison=createStationLayout({prison:true,detained:true,solace:true,name:'Prison barge'});
assert.ok(!prison.zones.some(z=>z.service==='messenger'));

const app=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
assert.match(app,/case 'hort-talk'/);
assert.match(app,/case 'hort-tip'/);
assert.match(app,/case 'dev-hort'/);
assert.match(app,/case 'dev-hortreach'/);
assert.match(app,/Messenger desk/);
assert.match(app,/hortStrip\(game\)/);

const portrait=statSync(new URL('../dist/hort-portrait.png',import.meta.url));
assert(portrait.size>8000,'desk portrait asset must ship');

const line=pickHortLine(g,'talk');
assert(typeof line.text==='string'&&line.text.length>8);

console.log('PASS Hort stays a Solace-only messenger with a station-card portrait');
console.log('PASS Hortreach / Hort\'s Pasture is UR-042 and chart-searchable without leaking a legal name');

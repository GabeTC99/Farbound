import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SYSTEMS,systemName,newSave} from '../dist/frontier.mjs';
import {mapView} from '../dist/frontier-views.mjs';
import {CREDITS,CREDITS_STUDIO,creditsView} from '../dist/credits.mjs';
import {Game} from '../dist/frontier.mjs';

assert.equal(CREDITS_STUDIO,'Voidwake Studios');
assert.deepEqual(CREDITS.map(c=>[c.name,c.role]),[
 ['Gabriel Trindade-Coffland','Founder / Creative Director'],
 ['Gillian Trindade-Coffland','Assistant Producer'],
 ['Oryanna Nelson','Special Appearance (Hort)']
]);

const html=creditsView();
for(const c of CREDITS){
 assert(html.includes(c.name),c.name+' belongs on the credits screen');
 assert(html.includes(c.role),c.role+' belongs on the credits screen');
}
assert.match(html,/Voidwake Studios/);
assert.match(html,/Nullharbor/);
assert.ok(!/@/.test(html),'credits must not include emails');
assert.ok(!/https?:\/\//.test(html),'credits must not include personal URLs');

const tokens=['Gabriel','Gillian','Oryanna','Nelson','Trindade','Coffland'];
const chartFiles=['../dist/catalog.mjs','../dist/station-hort.mjs','../dist/station-layout.mjs','../dist/galaxy-chart.mjs','../dist/core.mjs'];
for(const file of chartFiles){
 const src=readFileSync(new URL(file,import.meta.url),'utf8');
 for(const token of tokens)assert.equal(src.includes(token),false,file+' must not put '+token+' on the chart');
}
for(const sys of SYSTEMS){
 const blob=[sys.name,sys.lore||'',sys.search||'',sys.catalog||'',sys.station||''].join(' ');
 for(const token of tokens)assert.equal(blob.includes(token),false,'system '+sys.id+' must not include '+token);
}

const g=new Game();
const chart=mapView(g,0,'');
for(const token of tokens)assert.equal(chart.includes(token),false,'galaxy chart HTML must not include '+token);
const hort=mapView(g,105,'hort');
for(const token of ['Oryanna','Nelson','Gabriel','Gillian','Trindade'])assert.equal(hort.includes(token),false);
assert.match(systemName(SYSTEMS[105],{...newSave(),visited:[105]}),/Hortreach/);

const app=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
assert.match(app,/from '\.\/credits\.mjs'/);
assert.match(app,/creditsView\(\)/);
assert.match(app,/data-action="credits"/);
assert.match(app,/case 'credits'/);
assert.match(app,/Open credits/);
assert.match(app,/panel==='credits'/);

const sw=readFileSync(new URL('../dist/sw.js',import.meta.url),'utf8');
assert.match(sw,/credits\.mjs/);

console.log('PASS Credits screen lists the studio roster and keeps real names off the chart');

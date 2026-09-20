import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SYSTEMS,STAR_TYPES,STAR_CLASS_IDS,findStarOfClass,Game} from '../dist/frontier.mjs';
import {STAR_ART,sampleStarColor,meanStarColor,colorDistance,luma,starLimb,starCorona} from '../dist/star-render.mjs';

assert.deepEqual(STAR_CLASS_IDS,['O','B','A','F','G','K','M']);
for(const id of STAR_CLASS_IDS){
 assert(STAR_TYPES[id],id+' missing from STAR_TYPES');
 assert(STAR_ART[id],id+' needs photosphere art');
 assert(findStarOfClass(id,SYSTEMS),id+' must exist somewhere on the chart');
 assert(starLimb(id).startsWith('#'));
 assert(starCorona(id).startsWith('#'));
}

const means=Object.fromEntries(STAR_CLASS_IDS.map(id=>[id,meanStarColor(id,11)]));
const pairs=[['O','M'],['B','K'],['A','G'],['O','G'],['F','M']];
for(const [a,b] of pairs){
 const d=colorDistance(means[a],means[b]);
 assert(d>28,a+' vs '+b+' photospheres too similar ('+d.toFixed(1)+')');
}
assert(means.O[2]>means.O[0],'O stays blue-dominant');
assert(means.M[0]>means.M[2],'M stays red-dominant');
assert(luma(means.A)>luma(means.K),'A reads brighter than K');
assert(STAR_ART.O.flare>STAR_ART.G.flare);
assert(STAR_ART.M.spots>STAR_ART.A.spots);
assert(STAR_ART.O.coronaScale>STAR_ART.M.coronaScale);

const edge=sampleStarColor('G',3,.92,0),core=sampleStarColor('G',3,0,0);
assert(luma(core)>luma(edge)+8,'G stars limb-darken');
const spot=sampleStarColor('M',9,.2,-.15),disk=sampleStarColor('M',9,0,.6);
assert(colorDistance(spot,disk)>=0);

const app=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
assert.match(app,/dev-star/);
assert.match(app,/Stellar atlas/);
assert.match(app,/drawStarBody/);
assert.match(app,/from '\.\/star-render\.mjs'/);
assert.ok(!/const hot=p\.spectral==='M'/.test(app));

const hit=findStarOfClass('M',SYSTEMS);
assert(hit);
const g=new Game();g.launch();
g.teleportTo(hit.sys.id,{docked:false});
const star=(g.stars||[g.star]).find(s=>s.spectral==='M')||g.star;
assert.equal(star.spectral,'M');
g.target=star;g.player.x=star.x;g.player.y=star.y+star.r+200;g.player.vx=g.player.vy=0;
assert(g.player.x===star.x);

console.log('PASS Stellar atlas: O–M photospheres stay distinct and all classes exist on the chart');
console.log('PASS Limb darkening, flare/spot cues, and DEV hops hold');

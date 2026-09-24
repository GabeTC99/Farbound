import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 FRONTIER_EDITION,FRONTIER_ASSET_DIR,qualityOf,planetTexSize,surfaceStep,
 lightDir,hexRgb,rgbHex,mixHex,fadeHex,shadeHex,surfaceSun,terminatorStops,
 atmosphereRimAlpha,frontierAssetUrl,loadFrontierImage,peekFrontierImage,
 FRONTIER_SHIPPED_ASSETS,surfaceTextureName,landingPlateName,plateCrop,
 tileBakeSize,tileScreenRepeat,tileSizeForQuality,prefetchFrontierArt
} from '../dist/new-frontier.mjs';
import {drawPlanetBody,warmPlanetTexture,PLANET_ART,samplePlanetColor} from '../dist/planet-render.mjs';
import {SURFACE_PALETTES,renderSurface} from '../dist/surface-render.mjs';
import {terrainAt,terrainSlope,createSurface} from '../dist/surface.mjs';
import {RELEASE,RELEASE_NAME,RELEASE_EDITION} from '../dist/release.mjs';
import {PLANET_KIND_IDS} from '../dist/frontier.mjs';

assert.equal(FRONTIER_EDITION,'New Frontier');
assert.equal(RELEASE,'3.0.0');
assert.equal(RELEASE_NAME,'Nullharbor');
assert.equal(RELEASE_EDITION,'New Frontier');
assert.equal(FRONTIER_ASSET_DIR,'assets/new-frontier/');
assert.equal(qualityOf('high'),'high');
assert.equal(qualityOf('balanced'),'balanced');
assert.equal(qualityOf('performance'),'performance');
assert.equal(qualityOf(undefined),'high');
assert.equal(planetTexSize('high',false),256);
assert.equal(planetTexSize('balanced',false),192);
assert.equal(planetTexSize('high',true),96);
assert.equal(planetTexSize('performance',false),96);
assert.equal(surfaceStep('high',false),6);
assert.equal(surfaceStep('balanced',false),10);
assert.equal(surfaceStep('performance',false),16);
assert.ok(surfaceStep('high',false)<surfaceStep('performance',false));

const L=lightDir(3,4);
assert.ok(Math.abs(L.x-.6)<1e-9);
assert.ok(Math.abs(L.y-.8)<1e-9);
assert.deepEqual(hexRgb('#0af'),[0,170,255]);
assert.equal(rgbHex(16,32,48),'#102030');
assert.equal(mixHex('#000000','#ffffff',.5),'#808080');
assert.match(fadeHex('#90efdc',.4),/^rgba\(/);
assert.ok(shadeHex('#80a0c0',.5)!=='#80a0c0');
const sun=surfaceSun(11);
assert.ok(Number.isFinite(sun.x)&&Number.isFinite(sun.y));
const stops=terminatorStops('volcanic');
assert.ok(stops.length>=4);
assert.equal(stops[0][0],0);
assert.equal(stops[stops.length-1][0],1);
assert.ok(atmosphereRimAlpha(.58,false)>atmosphereRimAlpha(.58,true));
assert.equal(atmosphereRimAlpha(0,false),0);
assert.match(frontierAssetUrl('planet-rim.png'),/assets\/new-frontier\/planet-rim\.png/);
assert.equal(loadFrontierImage('missing-optional.png'),null);
assert.equal(peekFrontierImage('missing-optional.png'),null);
assert.equal(FRONTIER_SHIPPED_ASSETS.length,4);
assert.equal(surfaceTextureName('volcanic'),'planet-surface-a.png');
assert.equal(surfaceTextureName('earthlike'),'planet-surface-b.png');
assert.equal(landingPlateName('volcanic'),'landing-a.png');
assert.equal(landingPlateName('ice'),'landing-b.png');
assert.ok(plateCrop('landing-a.png').sy>=.08);
assert.ok(plateCrop('landing-a.png').sh<=.3);
assert.ok(plateCrop('landing-b.png').sy>=.06);
assert.ok(plateCrop('landing-b.png').sh<=.3);
assert.equal(tileBakeSize('high',false),384);
assert.equal(tileBakeSize('balanced',false),256);
assert.equal(tileBakeSize('performance',false),192);
assert.equal(tileScreenRepeat('high',false),112);
assert.equal(tileScreenRepeat('balanced',false),80);
assert.equal(tileScreenRepeat('performance',false),56);
assert.ok(tileScreenRepeat('high',false)<tileBakeSize('high',false));
assert.ok(tileScreenRepeat('high',false)*4<=512);
assert.equal(tileSizeForQuality('high',false),tileBakeSize('high',false));
prefetchFrontierArt();
for(const name of FRONTIER_SHIPPED_ASSETS){
 const file=new URL('../dist/assets/new-frontier/'+name,import.meta.url);
 assert.ok(readFileSync(file).length>100000,name+' must ship');
}

const slopeUp=terrainSlope(0,1,20);
assert.ok(Number.isFinite(slopeUp));
assert.ok(Math.abs(terrainAt(0,7)-terrainAt(0,7))<1e-12);

for(const id of PLANET_KIND_IDS){
 assert(SURFACE_PALETTES[id],id+' needs a surface palette');
 assert(PLANET_ART[id],id+' needs planet art');
 assert(SURFACE_PALETTES[id].sun,id+' needs a New Frontier sun color');
}

const src=readFileSync(new URL('../dist/planet-render.mjs',import.meta.url),'utf8');
assert.match(src,/drawSunwardRim/);
assert.match(src,/paintTerminator/);
assert.match(src,/terminatorStops/);
assert.match(src,/planetTexSize/);
const surfaceSrc=readFileSync(new URL('../dist/surface-render.mjs',import.meta.url),'utf8');
assert.match(surfaceSrc,/drawLandingHud/);
assert.match(surfaceSrc,/fillRidge/);
assert.match(surfaceSrc,/shadeRidge/);
assert.match(surfaceSrc,/shadeFaces/);
assert.match(surfaceSrc,/terrainSlope/);
assert.match(surfaceSrc,/samplePlanetColor/);
assert.match(surfaceSrc,/paintRidgeTexture/);
assert.match(surfaceSrc,/tileScreenRepeat/);
assert.match(surfaceSrc,/drawPlateVista/);
assert.match(surfaceSrc,/surfaceTextureName/);
assert.match(surfaceSrc,/landingPlateName/);
assert.doesNotMatch(surfaceSrc,/fillRect\(x,\s*gy/);
const app=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
assert.match(app,/NEW FRONTIER/);
assert.match(app,/lightDir/);
assert.match(app,/quality:graphicsMode\(\)/);
assert.match(app,/renderSurface\(ctx,width,height,game\.surface,clock,getStats\(game\.s\),\{lite:liteFX\(\),quality:graphicsMode\(\)\}\)/);
assert.match(app,/New Frontier lighting follows this toggle/);
const sw=readFileSync(new URL('../dist/sw.js',import.meta.url),'utf8');
assert.match(sw,/new-frontier\.mjs/);
assert.match(sw,/farbound-v3\.0\.0/);
assert.match(sw,/planet-surface-a\.png/);
assert.match(sw,/landing-b\.png/);
const notes=JSON.parse(readFileSync(new URL('../releases/v3.0.0.json',import.meta.url),'utf8'));
assert.equal(notes.release,'3.0.0');
assert.equal(notes.edition,'New Frontier');
assert.equal(notes.save_key,'farbound-save-v2');
assert.ok(notes.notes.some(n=>/versionCode 13/.test(n)));
assert.ok(notes.notes.some(n=>/Pages-first/.test(n)));
assert.ok(notes.notes.some(n=>/Scenario Pro/.test(n)));

function fakeCtx(){
 const calls=[];
 const grad={addColorStop(){}};
 return {
  calls,
  fillStyle:'',strokeStyle:'',lineWidth:1,globalAlpha:1,font:'',textAlign:'',
  createLinearGradient(){return grad;},
  createRadialGradient(){return grad;},
  save(){calls.push('save');},restore(){calls.push('restore');},
  translate(){},rotate(){},scale(){},
  beginPath(){},closePath(){},moveTo(){},lineTo(){},arc(){},ellipse(){},rect(){},
  fill(){calls.push('fill');},stroke(){calls.push('stroke');},
  fillRect(){calls.push('fillRect');},strokeRect(){},fillText(){calls.push('text');},
  clip(){},drawImage(){calls.push('drawImage');},
  createPattern(){calls.push('pattern');return grad;},
  setLineDash(){},roundRect(){}
 };
}
const p={id:'planet-0-0',x:0,y:0,r:40,kindId:'earthlike',seed:11,color:'#1a4a50'};
const ctx=fakeCtx();
drawPlanetBody(ctx,p,{lite:false,quality:'high',lightX:-20,lightY:-10});
assert.ok(ctx.calls.includes('fill'));
drawPlanetBody(ctx,p,{lite:true,quality:'performance',lightX:-20,lightY:-10});
warmPlanetTexture(p,true,'performance');
const dummy={id:'p',name:'Test',kindId:'mineral',kind:'Mineral world',seed:'1-2',color:'#87b3ac',r:80,gravity:1,atmosphere:'thin'};
const surface=createSurface(dummy);
const sctx=fakeCtx();
renderSurface(sctx,800,480,surface,1.2,{surfaceRange:0,scanSpeed:1},{lite:false,quality:'high'});
assert.ok(sctx.calls.includes('fillRect'));
assert.ok(sctx.calls.includes('text'));
const c=samplePlanetColor('earthlike',7,0,-.92);
assert(c&&c.length===3);

const gradle=readFileSync(new URL('../android/app/build.gradle',import.meta.url),'utf8');
assert.match(gradle,/versionCode 13/);
assert.match(gradle,/versionName '3\.0\.0'/);

console.log('PASS New Frontier Phase 1 lighting helpers, planet/surface hooks, and 3.0.0 branding');

import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 FRONTIER_EDITION,FRONTIER_ASSET_DIR,qualityOf,planetTexSize,surfaceStep,
 lightDir,hexRgb,rgbHex,mixHex,fadeHex,shadeHex,surfaceSun,terminatorStops,
 atmosphereRimAlpha,frontierAssetUrl,loadFrontierImage,peekFrontierImage,
 FRONTIER_SHIPPED_ASSETS,FRONTIER_KIND_IDS,FRONTIER_KIND_ASSETS,FRONTIER_KIND_SHIPPED,FRONTIER_PREFETCH_ASSETS,
 surfaceTextureName,landingPlateName,kindPlateName,kindSurfaceName,
 fallbackPlateName,fallbackSurfaceName,resolveFrontierName,rememberFrontierImage,
 clearFrontierAssets,plateCrop,vistaDestHeight,ridgeCameraY,VISTA_LOCK_Y,RIDGE_VERTICAL_PARALLAX,surfaceCameraY,
 tileBakeSize,tileScreenRepeat,tileSizeForQuality,prefetchFrontierArt,
 createSiteTransition,siteTransitionAlpha,siteTransitionDone,drawSiteTransition
} from '../dist/new-frontier.mjs';
import {SURFACE_AUDIO_CUES,AUDIO_CUES,EngineAudio,surfaceAmbientCue,surfaceGritCue,planetaryAudioFile,PLANETARY_AUDIO_DIR,PLANETARY_AUDIO_STEMS} from '../dist/engine-audio.mjs';
import {drawPlanetBody,warmPlanetTexture,PLANET_ART,samplePlanetColor} from '../dist/planet-render.mjs';
import {SURFACE_PALETTES,renderSurface,drawFrontierSkiff} from '../dist/surface-render.mjs';
import {terrainAt,terrainSlope,createSurface} from '../dist/surface.mjs';
import {createPlanetLayout} from '../dist/planet-layout.mjs';
import {createOnFoot} from '../dist/onfoot.mjs';
import {renderOnFoot,siteWorldScroll} from '../dist/onfoot-render.mjs';
import {RELEASE,RELEASE_NAME,RELEASE_EDITION} from '../dist/release.mjs';
import {Game,PLANET_KIND_IDS} from '../dist/frontier.mjs';

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
assert.equal(FRONTIER_KIND_IDS.length,11);
assert.equal(FRONTIER_KIND_ASSETS.length,22);
assert.equal(FRONTIER_KIND_SHIPPED.length,14);
assert.equal(FRONTIER_PREFETCH_ASSETS.length,26);
assert.ok(FRONTIER_KIND_ASSETS.includes('landing-volcanic.png'));
assert.ok(FRONTIER_KIND_ASSETS.includes('surface-ice.png'));
assert.ok(FRONTIER_KIND_ASSETS.includes('landing-arid.png'));
assert.ok(FRONTIER_KIND_ASSETS.includes('landing-ocean.png'));
assert.ok(FRONTIER_KIND_ASSETS.includes('surface-earthlike.png'));
assert.ok(FRONTIER_PREFETCH_ASSETS.includes('landing-volcanic.png'));
assert.ok(FRONTIER_PREFETCH_ASSETS.includes('surface-toxic.png'));
assert.ok(FRONTIER_KIND_SHIPPED.includes('landing-gas.png'));
assert.ok(FRONTIER_KIND_SHIPPED.includes('surface-barren.png'));
assert.ok(!FRONTIER_KIND_SHIPPED.includes('landing-metal.png'));
assert.ok(!FRONTIER_KIND_SHIPPED.includes('landing-icegiant.png'));
assert.ok(FRONTIER_PREFETCH_ASSETS.includes('landing-metal.png'));
assert.ok(FRONTIER_PREFETCH_ASSETS.includes('surface-mineral.png'));
assert.ok(FRONTIER_PREFETCH_ASSETS.includes('landing-icegiant.png'));
for(const name of FRONTIER_KIND_SHIPPED)assert.ok(FRONTIER_PREFETCH_ASSETS.includes(name),name+' must be prefetched');
assert.equal(kindPlateName('volcanic'),'landing-volcanic.png');
assert.equal(kindSurfaceName('ice'),'surface-ice.png');
assert.equal(fallbackPlateName('volcanic'),'landing-a.png');
assert.equal(fallbackPlateName('ice'),'landing-b.png');
assert.equal(fallbackSurfaceName('volcanic'),'planet-surface-a.png');
assert.equal(fallbackSurfaceName('earthlike'),'planet-surface-b.png');
assert.equal(fallbackSurfaceName('metal'),'planet-surface-a.png');
assert.equal(fallbackPlateName('metal'),'landing-b.png');
clearFrontierAssets();
assert.equal(surfaceTextureName('volcanic'),'planet-surface-a.png');
assert.equal(surfaceTextureName('earthlike'),'planet-surface-b.png');
assert.equal(landingPlateName('volcanic'),'landing-a.png');
assert.equal(landingPlateName('ice'),'landing-b.png');
assert.equal(landingPlateName('arid'),'landing-a.png');
rememberFrontierImage('landing-volcanic.png',{width:8,height:8});
rememberFrontierImage('surface-ice.png',{width:8,height:8});
assert.equal(landingPlateName('volcanic'),'landing-volcanic.png');
assert.equal(surfaceTextureName('ice'),'surface-ice.png');
assert.equal(resolveFrontierName('landing-volcanic.png','landing-a.png'),'landing-volcanic.png');
rememberFrontierImage('landing-barren.png',{width:8,height:8});
rememberFrontierImage('surface-barren.png',{width:8,height:8});
assert.equal(landingPlateName('metal'),'landing-barren.png');
assert.equal(surfaceTextureName('mineral'),'surface-barren.png');
rememberFrontierImage('landing-metal.png',{width:8,height:8});
rememberFrontierImage('surface-mineral.png',{width:8,height:8});
rememberFrontierImage('landing-icegiant.png',{width:8,height:8});
rememberFrontierImage('surface-icegiant.png',{width:8,height:8});
assert.equal(landingPlateName('metal'),'landing-metal.png');
assert.equal(surfaceTextureName('mineral'),'surface-mineral.png');
assert.equal(landingPlateName('icegiant'),'landing-icegiant.png');
assert.equal(surfaceTextureName('icegiant'),'surface-icegiant.png');
clearFrontierAssets();
assert.equal(landingPlateName('volcanic'),'landing-a.png');
assert.equal(surfaceTextureName('ice'),'planet-surface-b.png');
assert.equal(landingPlateName('metal'),'landing-b.png');
for(const id of FRONTIER_KIND_IDS){
 assert.equal(kindPlateName(id),'landing-'+id+'.png');
 assert.equal(kindSurfaceName(id),'surface-'+id+'.png');
 assert.match(fallbackPlateName(id),/^landing-[ab]\.png$/);
 assert.match(fallbackSurfaceName(id),/^planet-surface-[ab]\.png$/);
}
assert.ok(plateCrop('landing-a.png').sh>=.42);
assert.ok(plateCrop('landing-a.png').sh<=.58);
assert.ok(plateCrop('landing-b.png').sh>=.42);
assert.ok(plateCrop('landing-volcanic.png').sh>=.45);
assert.ok(vistaDestHeight(800,'high')>vistaDestHeight(800,'balanced'));
assert.ok(vistaDestHeight(800,'high')>=800*.6);
assert.equal(RIDGE_VERTICAL_PARALLAX,0);
assert.equal(ridgeCameraY(120),VISTA_LOCK_Y);
assert.equal(ridgeCameraY(120,0),VISTA_LOCK_Y);
assert.equal(ridgeCameraY(800,0),VISTA_LOCK_Y);
assert.equal(ridgeCameraY(800,RIDGE_VERTICAL_PARALLAX),VISTA_LOCK_Y);
assert.equal(ridgeCameraY(800,1),800);
assert.ok(Math.abs(ridgeCameraY(800,.5)-(VISTA_LOCK_Y+(800-VISTA_LOCK_Y)*.5))<1e-9);
{
 const scale=.86,height=720,hill=650;
 const lock=(worldY,py)=>(worldY-surfaceCameraY(py))*scale+height/2;
 const skiff=py=>(py-surfaceCameraY(py))*scale+height/2;
 assert.equal(surfaceCameraY(90),VISTA_LOCK_Y);
 assert.equal(surfaceCameraY(630),VISTA_LOCK_Y);
 assert.equal(lock(hill,90),lock(hill,440));
 assert.ok(skiff(90)<skiff(440));
}
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
for(const name of FRONTIER_KIND_SHIPPED){
 const file=new URL('../dist/assets/new-frontier/'+name,import.meta.url);
 assert.ok(readFileSync(file).length>100000,name+' must ship');
}

const slopeUp=terrainSlope(0,1,20);
assert.ok(Number.isFinite(slopeUp));
assert.ok(Math.abs(terrainAt(0,7)-terrainAt(0,7))<1e-12);

assert.deepEqual([...FRONTIER_KIND_IDS].sort(),[...PLANET_KIND_IDS].sort());
for(const id of PLANET_KIND_IDS){
 assert(SURFACE_PALETTES[id],id+' needs a surface palette');
 assert(PLANET_ART[id],id+' needs planet art');
 assert(SURFACE_PALETTES[id].sun,id+' needs a New Frontier sun color');
}

const frontierSrc=readFileSync(new URL('../dist/new-frontier.mjs',import.meta.url),'utf8');
assert.match(frontierSrc,/drawFrontierVista/);
assert.match(frontierSrc,/there is no cameraY/);
const src=readFileSync(new URL('../dist/planet-render.mjs',import.meta.url),'utf8');
assert.match(src,/drawSunwardRim/);
assert.match(src,/paintTerminator/);
assert.match(src,/terminatorStops/);
assert.match(src,/planetTexSize/);
const surfaceSrc=readFileSync(new URL('../dist/surface-render.mjs',import.meta.url),'utf8');
assert.match(surfaceSrc,/drawLandingHud/);
assert.match(surfaceSrc,/fillRidge/);
assert.match(surfaceSrc,/shadeRidge/);
assert.doesNotMatch(surfaceSrc,/shadeFaces/);
assert.doesNotMatch(surfaceSrc,/y\+20/);
assert.doesNotMatch(surfaceSrc,/k\*11/);
assert.doesNotMatch(surfaceSrc,/RIDGE_CREST_INSET/);
assert.doesNotMatch(surfaceSrc,/strokeRidgeFill/);
assert.match(surfaceSrc,/terrainSlope/);
assert.match(surfaceSrc,/samplePlanetColor/);
assert.match(surfaceSrc,/paintRidgeTexture/);
assert.match(surfaceSrc,/tileScreenRepeat/);
assert.match(surfaceSrc,/drawPlateVista/);
assert.match(surfaceSrc,/drawFrontierVista/);
assert.match(surfaceSrc,/surfaceCameraY/);
assert.match(surfaceSrc,/ridgeSy/);
assert.doesNotMatch(surfaceSrc,/cameraY=s\.y-40/);
assert.doesNotMatch(surfaceSrc,/ridgeSy\(vPar\)/);
assert.doesNotMatch(surfaceSrc,/true,\.68/);
assert.doesNotMatch(surfaceSrc,/true,\.28/);
assert.doesNotMatch(surfaceSrc,/true,\.5\]/);
assert.match(surfaceSrc,/surfaceTextureName/);
assert.match(surfaceSrc,/landingPlateName/);
assert.match(surfaceSrc,/kindPlateName/);
const onfootSrc=readFileSync(new URL('../dist/onfoot-render.mjs',import.meta.url),'utf8');
assert.match(onfootSrc,/drawFrontierVista/);
assert.match(onfootSrc,/kindPlateName/);
assert.match(onfootSrc,/renderPlanetSite/);
assert.match(onfootSrc,/paintSiteGround/);
assert.match(onfootSrc,/drawSitePad/);
assert.match(onfootSrc,/drawFrontierSkiff/);
assert.match(onfootSrc,/drawStandingCrew/);
assert.match(onfootSrc,/siteWorldScroll/);
assert.match(onfootSrc,/translate\(-ox,0\)/);
assert.match(onfootSrc,/anchorY=s\.spawn\?\.y/);
assert.doesNotMatch(onfootSrc,/scrollX\*par/);
{
 const scale=1.2,width=1280,rock=400;
 const cam=x=>x-width*.4/scale;
 const a=cam(290),b=cam(490);
 const sa=siteWorldScroll(a,80,scale),sb=siteWorldScroll(b,400,scale);
 const sx=(x,c)=>(x-c)*scale;
 assert.equal(sa.y,0);
 assert.equal(sb.y,0);
 assert.ok(Math.abs((sb.x-sa.x)-(b-a)*scale)<1e-6);
 assert.ok(Math.abs(-(sb.x-sa.x)-(sx(rock,b)-sx(rock,a)))<1e-6);
}
assert.match(onfootSrc,/surfaceSun\(s\.seed/);
assert.doesNotMatch(onfootSrc,/sunX:-1/);
assert.doesNotMatch(onfootSrc,/plateCrop/);
const onfootLogic=readFileSync(new URL('../dist/onfoot.mjs',import.meta.url),'utf8');
assert.match(onfootLogic,/kindId:layout\.kindId/);
const layoutSrc=readFileSync(new URL('../dist/planet-layout.mjs',import.meta.url),'utf8');
assert.match(layoutSrc,/skiffX=220/);
assert.match(layoutSrc,/spawn:\{x:skiffX\+70/);
const assetReadme=readFileSync(new URL('../dist/assets/new-frontier/README.md',import.meta.url),'utf8');
assert.match(assetReadme,/landing-volcanic\.png/);
assert.match(assetReadme,/surface-ice\.png/);
assert.match(assetReadme,/landing-arid\.png/);
assert.match(assetReadme,/landing-ocean\.png/);
assert.match(assetReadme,/Phase 1b/);
assert.match(assetReadme,/Still optional/);
assert.doesNotMatch(surfaceSrc,/fillRect\(x,\s*gy/);
const app=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
assert.match(app,/NEW FRONTIER/);
assert.match(app,/lightDir/);
assert.match(app,/quality:graphicsMode\(\)/);
assert.match(app,/renderSurface\(ctx,width,height,game\.surface,clock,getStats\(game\.s\),\{lite:liteFX\(\),quality:graphicsMode\(\)\}\)/);
assert.match(app,/New Frontier lighting follows this toggle/);
const sw=readFileSync(new URL('../dist/sw.js',import.meta.url),'utf8');
assert.match(sw,/new-frontier\.mjs/);
assert.match(sw,/farbound-v3\.0\.0-ships5/);
assert.match(sw,/planet-surface-a\.png/);
assert.match(sw,/landing-b\.png/);
assert.match(sw,/landing-volcanic\.png/);
assert.match(sw,/landing-ocean\.png/);
assert.match(sw,/surface-ice\.png/);
assert.match(sw,/surface-barren\.png/);
assert.doesNotMatch(sw,/landing-metal\.png/);
assert.doesNotMatch(sw,/surface-ocean\.png/);
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

const siteSurface=createSurface({id:'planet-0-0',name:'Solace',kindId:'metal',kind:'Metal-rich world',seed:'1-2',color:'#8a9098',r:80,gravity:1.21,atmosphere:'none'});
siteSurface.x=siteSurface.anomalies[0].x;siteSurface.y=siteSurface.anomalies[0].y;
const siteLayout=createPlanetLayout(siteSurface);
assert.equal(siteLayout.kindId,'metal');
const foot=createOnFoot(siteLayout);
assert.equal(foot.kindId,'metal');
assert.equal(foot.seed,siteLayout.seed);
assert.equal(siteLayout.seed,siteSurface.seed);
const skiff=siteLayout.zones.find(z=>z.board);
const pads=siteLayout.zones.filter(z=>z.service==='inspect');
assert(skiff);assert(pads.length);
assert.ok(Math.abs(siteLayout.spawn.y-skiff.y)<1);
assert.ok(siteLayout.spawn.x>skiff.x);
for(const pad of pads){
 assert.ok(Math.abs(pad.y-skiff.y)<30,'inspect pads share the skiff ground line');
 assert.ok(pad.x>skiff.x,'inspect pads sit ahead of the skiff');
}
const fctx=fakeCtx();
renderOnFoot(fctx,1280,720,foot,1);
assert.ok(fctx.calls.includes('fillRect'));
assert.ok(typeof drawFrontierSkiff==='function');

const fx=createSiteTransition('embark');
assert.ok(siteTransitionAlpha(fx)>0.99);
fx.t=fx.dur;
assert.ok(siteTransitionAlpha(fx)<0.02);
assert.ok(siteTransitionDone(fx));
drawSiteTransition(fakeCtx(),120,80,createSiteTransition('takeoff'));
const audio=new EngineAudio();
assert.equal(PLANETARY_AUDIO_DIR,'assets/audio/planetary/');
assert.equal(planetaryAudioFile('pad_inspect_start'),'assets/audio/planetary/pad_inspect_start.mp3');
assert.equal(AUDIO_CUES[SURFACE_AUDIO_CUES.inspectStart].file,'assets/audio/planetary/pad_inspect_start.mp3');
assert.equal(AUDIO_CUES[SURFACE_AUDIO_CUES.embark].file,'assets/audio/planetary/embark_whoosh.mp3');
assert.equal(AUDIO_CUES[SURFACE_AUDIO_CUES.takeoff].file,'assets/audio/planetary/embark_whoosh.mp3');
assert.equal(AUDIO_CUES[SURFACE_AUDIO_CUES.inspectStart].type,'oneshot');
assert.equal(AUDIO_CUES[SURFACE_AUDIO_CUES.inspectLoop].type,'loop');
assert.equal(AUDIO_CUES.ambient_metal.type,'loop');
assert.equal(AUDIO_CUES.ambient_mineral.type,'loop');
assert.equal(AUDIO_CUES.ambient_icegiant.type,'loop');
assert.equal(AUDIO_CUES.grit_metal.type,'oneshot');
assert.equal(AUDIO_CUES.grit_mineral.type,'oneshot');
assert.equal(AUDIO_CUES.grit_icegiant.type,'oneshot');
assert.equal(PLANETARY_AUDIO_STEMS.length,26);
assert.equal(surfaceAmbientCue('metal'),'ambient_metal');
assert.equal(surfaceAmbientCue('ice'),'ambient_ice');
assert.equal(surfaceAmbientCue('earthlike'),'ambient_earthlike');
assert.equal(surfaceAmbientCue('gas'),'ambient_gas');
assert.equal(surfaceGritCue('ice'),'grit_ice');
assert.equal(surfaceGritCue('icegiant'),'grit_icegiant');
assert.equal(surfaceGritCue('mineral'),'grit_mineral');
assert.equal(surfaceAmbientCue('station'),null);
for(const stem of PLANETARY_AUDIO_STEMS){
 const file=new URL('../dist/assets/audio/planetary/'+stem+'.mp3',import.meta.url);
 assert.ok(readFileSync(file).length>1000,stem+' mp3 must ship');
 assert.match(sw,new RegExp(stem.replace(/[.]/g,'\\.')+'\\.mp3'));
}
assert.doesNotMatch(sw,/\.wav/);
assert.ok(audio.playCue(SURFACE_AUDIO_CUES.inspectStart));
assert.ok(audio.playCue('pad_inspect_start'));
assert.ok(audio.playCue(SURFACE_AUDIO_CUES.inspectLoop));
assert.ok(audio.isCueLooping('pad_inspect_loop'));
assert.ok(audio.playCue('pad_inspect_stop'));
assert.ok(!audio.isCueLooping(SURFACE_AUDIO_CUES.inspectLoop));
assert.ok(audio.playCue('embark_whoosh'));
assert.ok(audio.playCue('grit_mineral'));
assert.ok(audio.playCue('ambient_metal'));
assert.ok(audio.isCueLooping('ambient_metal'));
assert.ok(audio.stopCue('ambient_metal'));
assert.ok(!audio.isCueLooping('ambient_metal'));
siteSurface.landed=true;
const siteGame=new Game();
siteGame.onfoot=null;siteGame.s.docked=false;
siteGame.surface=siteSurface;
assert(siteGame.disembark());
assert(siteGame.audioCues.includes('ambient_metal'));
assert(siteGame.boardSkiff());
assert(siteGame.audioStops.includes('ambient_metal'));
function gritHits(kind,speed,seconds=3){
 const g=new Game();
 g.onfoot={kindId:kind,vx:speed,vy:0};
 g.surface={kindId:kind};
 g.audioCues=[];
 let n=0;
 for(let t=0;t<seconds;t+=1/30){
  g.updatePlanetFootGrit(1/30);
  n+=g.audioCues.length;
  g.audioCues.length=0;
 }
 return n;
}
const iceWalk=gritHits('ice',40),iceSprint=gritHits('ice',80),earthWalk=gritHits('earthlike',40);
assert.ok(iceWalk>=1&&iceWalk<=2,'ice walk stays sparse ('+iceWalk+')');
assert.ok(iceSprint>iceWalk&&iceSprint<=4,'ice sprint is a bit more frequent ('+iceSprint+')');
assert.ok(earthWalk>iceWalk&&earthWalk<=4,'milder ground steps more often than ice ('+earthWalk+')');
console.log('PASS On-foot grit is sparse, faster on sprint, and ice waits longest');

console.log('PASS New Frontier mapping, vista lock, kind-plate hooks, and 3.0.0 branding');

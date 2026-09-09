import {operationCards} from './frontier-views.mjs';
import {Game,newSave,validateSave,SYSTEMS,SHIPS,GOODS,UPGRADES,getStats,cargoUsed,price,contractsFor,jumpDistance,jumpCost,dist,clamp,rng,systemSky,wantedTier,systemName,EVENT_IDS,eventArrowTargets,surveyWorldIds,systemLayoutMeta,missionDestination,operationDetails,FACTIONS,nearestAnomaly,terrainAt,nearestZone} from './frontier.mjs';
import {RELEASE,RELEASE_NAME} from './release.mjs';
import {readPilot,writePilot,readCheckpoint} from './pilot-storage.mjs';
import {EngineAudio} from './engine-audio.mjs';
import {moduleView,fleetView,guildView,factionView,mapView as galaxyHTML,robotStrip} from './frontier-views.mjs';
import {STATION_ROBOT} from './station-robot.mjs';
import {GalaxyChart} from './galaxy-chart.mjs';
import {renderSurface} from './surface-render.mjs';
import {renderOnFoot} from './onfoot-render.mjs';
const $=id=>document.getElementById(id),fmt=n=>Math.round(n).toLocaleString(),esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icons={map:'<circle cx="7" cy="7" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="15" cy="18" r="2"/><path d="m9 7 7-1M8 9l6 7m3-8-2 8"/>',missions:'<path d="M8 4H5v17h14V4h-3M9 2h6v5H9zM8 12h8m-8 4h6"/>',ship:'<path d="m12 2 8 19-8-4-8 4 8-19Zm0 4v9"/>',menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',fire:'<circle cx="12" cy="12" r="7"/><path d="M12 1v7m0 8v7M1 12h7m8 0h7"/>',close:'<path d="m6 6 12 12M18 6 6 18"/>',expand:'<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>'};
const icon=(name)=>`<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]||icons.ship}</svg>`;
const simPaused=()=>!!panel&&panel!=='station';
const leaveStation=()=>{if(game.s.docked){const z=nearestZone(game.onfoot);if(z?.launch){if(!game.launch()){stationTab=game.sys.prison||game.s.detained?'detention':'market';openPanel('station');return;}closePanel();return;}game.notify('Walk to the hangar bay to launch.');return;}closePanel();};
let boot;try{boot=readPilot(localStorage);}catch{boot={pilot:newSave(),existing:false,error:true};}
let saved=boot.existing?boot.pilot:null,storageOK=!boot.error;
let game=new Game(boot.pilot),started=false,panel=null,stationTab='market',deskVisit=false,qty=1,selectedSystem=game.s.system,installPrompt=null,offlineReady=false;
const engine=new EngineAudio();let mapQuery='',mapFilter='all',mapChart=null,mapCamera={x:SYSTEMS[game.s.system].x,y:SYSTEMS[game.s.system].y,scale:8};
let keys={},touch={aim:null,thrust:0,fire:false,boost:false},stickPointer=null,showTutorial=game.s.tutorial<2,lastStore=0,lastHUD=0,clock=0,saveErrorShown=false,confirmAction=null,lastFocus=null,shipBank=0,playerTrail=[];
const canvas=$('space'),ctx=canvas.getContext('2d',{alpha:false});let width=innerWidth,height=innerHeight,dpr=Math.min(devicePixelRatio||1,2),cam={x:0,y:0,zoom:.6};
const nebula=new Image();nebula.src='./nebula.webp';const starRand=rng(2471),stars=Array.from({length:260},()=>({x:starRand(),y:starRand(),r:.4+starRand()*1.25,a:.15+starRand()*.65,depth:.025+starRand()*.075}));
let audio=null;function sound(kind='click'){if(!game.s.sound||!started)return;try{audio??=new (window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume();const o=audio.createOscillator(),gain=audio.createGain(),t=audio.currentTime;const f=kind==='fire'?440:kind==='good'?700:kind==='jump'?110:330;o.type=kind==='fire'?'triangle':'sine';o.frequency.setValueAtTime(f,t);o.frequency.exponentialRampToValueAtTime(kind==='fire'?100:f*1.4,t+.09);gain.gain.setValueAtTime(kind==='fire'?.035:.045,t);gain.gain.exponentialRampToValueAtTime(.001,t+.14);o.connect(gain);gain.connect(audio.destination);o.start(t);o.stop(t+.16);}catch{}}
function save(checkpoint=false){try{writePilot(localStorage,game.serialize(),{checkpoint:checkpoint===true});storageOK=true;return true;}catch{storageOK=false;if(!saveErrorShown){game.notify('Device storage is unavailable. Export your save from the flight menu.','bad');saveErrorShown=true;}return false;}}
function resetControls(){engine.mute();keys={};touch={aim:null,thrust:0,fire:false,boost:false};stickPointer=null;const knob=$('stick-knob');if(knob)knob.style.transform='';document.querySelectorAll('.held').forEach(x=>x.classList.remove('held'));}
function buildHUD(){
 $('game').innerHTML=`<div class="hud" id="hud"><header class="topbar"><div class="brand"><span class="star">✦</span>FARBOUND</div><div class="divider"></div><div><div class="system-name" id="sys-name"></div><div class="system-sub" id="sys-sub"></div></div><div class="top-right"><div class="credits"><small>AVAILABLE CREDITS</small><span id="credits"></span></div><button class="icon-button" data-action="fullscreen" aria-label="Toggle fullscreen">${icon('expand')}</button><button class="icon-button" data-action="menu" aria-label="Flight menu">${icon('menu')}</button></div></header><div class="underbar">${['shield','hull','fuel','heat'].map(x=>`<div class="stat ${x}"><div class="stat-label"><span>${x.toUpperCase()}</span><b id="${x}-label"></b></div><div class="meter"><i id="${x}-meter"></i></div></div>`).join('')}</div><div class="flight-top"><div class="location-info"><div class="eyebrow" id="flight-status">LOCAL SPACE</div><h2 id="flight-location"></h2><p id="flight-desc"></p><div class="route-hud" id="route-hud"></div><div class="target-list" id="flight-targets"><button id="station-target" data-action="target" data-id="station">Station</button><button data-action="target" data-id="star">Star</button><button data-action="planet">Worlds</button><button data-action="target" data-id="belt">Belt</button></div></div><div class="target-panel"><div class="eyebrow">NAVIGATION TARGET</div><h3 id="target-name"></h3><div class="target-meta"><span id="target-type"></span><span id="target-dist"></span></div><button class="primary" id="context-action" data-action="context">DOCK</button><div class="target-row"><button data-action="autopilot" id="auto-button">AUTO</button><button data-action="scan" id="scan-button">SCAN</button></div><button id="discovery-button" data-action="discover">DISCOVERY PULSE</button><div id="scanner-status" class="scanner-status"></div><button class="landing-button" id="landing-button" data-action="land-or-takeoff">LAND ON WORLD</button></div></div><div class="bottom"><div class="control-zone"><div class="stick-wrap"><div class="stick" id="stick" role="application" aria-label="Flight stick. Drag toward the direction you want to fly."><div class="stick-knob" id="stick-knob"></div></div><div class="control-caption">FLIGHT ASSIST ON</div></div><div class="speed-box"><b id="speed">0</b> <small>m/s</small><div id="motion-mode">MANUAL FLIGHT</div></div></div><nav class="nav" aria-label="Flight navigation"><button data-action="map">${icon('map')}<span>Galaxy</span></button><button data-action="missions">${icon('missions')}<span>Contracts</span></button><button data-action="guilds">${icon('missions')}<span>Guilds</span></button><button data-action="ship">${icon('ship')}<span>Ship</span></button></nav><div class="action-zone"><div class="aux-actions"><button class="boost" id="boost" data-hold="boost">BOOST</button><button data-action="brake" id="brake">BRAKE</button></div><button class="fire" id="fire" data-hold="fire">${icon('fire')}FIRE / MINE</button></div></div><div class="radar-wrap"><canvas id="radar" width="268" height="268" aria-label="Nearby objects radar"></canvas></div><div class="center-status" id="center-status"></div><div class="tutorial hidden" id="tutorial"></div></div><div class="toasts" id="toasts" role="status" aria-live="polite"></div><div id="panel-layer"></div><div id="welcome-layer"></div>`;
 setupStick();updateHUD();
}
function showWelcome(){
 $('welcome-layer').innerHTML=`<div class="welcome-cover"><section class="welcome"><div class="eyebrow">SOLO SPACE SANDBOX · ${RELEASE_NAME.toUpperCase()} ${RELEASE}</div><h1>FARBOUND<span>THE QUIET FRONTIER</span></h1><p>A small ship. An open sky. Make your living between the stars — as a trader, a prospector, an explorer, or a hunter.</p><div class="welcome-actions"><button class="primary" data-action="start">${saved?'Continue your journey':'Begin your journey'} &nbsp; →</button><button class="quiet" data-action="welcome-help">How to fly</button></div><div class="welcome-notes"><span>192 star systems</span><span>Planetary exploration</span><span>4 guilds · 3 factions</span><span>v${RELEASE}</span></div></section><div class="welcome-footer">HEADPHONES RECOMMENDED &nbsp; / &nbsp; TOUCH + KEYBOARD &nbsp; / &nbsp; v${RELEASE}</div></div>`;
}
function risk(s){return ['Secure','Patrolled','Contested','Lawless'][s.danger];}
function updateHUD(){
 const s=game.s,st=getStats(s),sys=game.sys,t=game.target,d=t?dist(game.player,t):0;
 $('sys-name').textContent=systemName(sys,s);$('sys-sub').textContent=sys.eco+' · '+(sys.uncharted?'Uncharted Reach':risk(sys))+' · '+systemSky(sys).label;const wanted=wantedTier(s.bounty),heat=Math.ceil(game.heatWanted||0);$('credits').textContent=fmt(s.credits)+' cr'+(heat?` · WANTED HEAT ${heat}`:s.bounty?` · ${wanted.label} ${fmt(s.bounty)}`:'');$('credits').style.color=heat||s.bounty?wanted.color:'';
 for(const k of ['shield','hull','fuel']){$(k+'-label').textContent=Math.ceil(s[k])+' / '+st[k];$(k+'-meter').style.width=clamp(s[k]/st[k]*100,0,100)+'%';}
 $('flight-status').textContent=s.docked?(s.detained?'DETENTION HOLD':game.sys.prison?'PRISON BARGE':game.onfoot?'STATION DECK':'DOCKING BAY 04'):game.auto?'AUTOPILOT ENGAGED':game.jump?'FOLD TRANSIT':'LOCAL SPACE';$('flight-location').textContent=s.docked?(game.onfoot?.title||sys.station):sys.name+' system';$('flight-desc').textContent=s.docked?(s.detained?'Walk to Detention, pay the fine, then launch from the hangar.':game.sys.prison?'Detention services, limited market access, and release processing.':'Walk the deck to visit Market, Cartographics, Contracts, and more.'):sys.lore;
 $('target-name').textContent=t?.name||'No target';$('target-type').textContent=t?.type==='planet'?(s.scanned.includes(t.id)?'Surveyed':'Unsurveyed world'):t?.type==='enemy'?'Wanted vessel':t?.type==='wake'?(t.scanned?'Resolved hyperspace wake':'Unresolved hyperspace wake'):t?.type==='signal'?(t.scanned?'Resolved signal':(t.kind==='distress'?'Distress signal':t.kind==='anomaly'?'Anomalous reading':'Local signal')):t?.type==='derelict'?(t.scanned?'Surveyed derelict':'Derelict wreck'):t?.type==='traffic'?((t.hull?t.hull[0].toUpperCase()+t.hull.slice(1)+' · ':'')+(t.status||'Civilian vessel')):t?.type==='station'?'Orbital station':t?.type==='belt'?'Mineral deposits':'Resource';$('target-dist').textContent=d>1000?(d/1000).toFixed(1)+' km':Math.round(d)+' m';
 const context=$('context-action');context.textContent=s.docked?'INTERACT':t?.type==='wake'?(t.scanned?'PLOT WAKE ROUTE':d<=260?'SCAN WAKE':'APPROACH WAKE'):t?.type==='signal'||t?.type==='derelict'?(t.scanned?'RESOLVED':d<=280?'SCAN SIGNAL':'APPROACH'):t?.type==='station'?(d<=200?'DOCK':'APPROACH'):t?.type==='planet'?(s.scanned.includes(t.id)?'SURVEYED':d<t.r+st.scanRange?'SCAN WORLD':'APPROACH'):t?.type==='enemy'?'INTERCEPT':'APPROACH';context.disabled=!s.docked&&((t?.type==='planet'&&s.scanned.includes(t.id))||((t?.type==='signal'||t?.type==='derelict')&&t.scanned));
 $('auto-button').textContent=game.auto?'AUTO · ON':'AUTO';$('auto-button').classList.toggle('switch-on',!!game.auto);$('speed').textContent=Math.round(Math.hypot(game.player.vx,game.player.vy));$('motion-mode').textContent=game.boost?'BOOST ACTIVE':game.auto?'AUTOPILOT':'MANUAL FLIGHT';
 $('center-status').innerHTML=game.jump?`FOLD DRIVE · ${(3-game.jump.progress).toFixed(1)}<div class="progress"><i style="width:${game.jump.progress/3*100}%"></i></div>`:game.scan?`SURVEYING WORLD<div class="progress"><i style="width:${game.scan.progress/3*100}%"></i></div>`:'';
 updateFrontierHUD();
 const tipVisible=showTutorial&&started&&!panel&&!s.docked&&!game.surface,tipKey=tipVisible?(s.tutorial<2?'discover':'dock'):'';
 const tut=$('tutorial');tut.classList.toggle('hidden',!tipVisible);if(tipVisible&&tut.dataset.tip!==tipKey){tut.dataset.tip=tipKey;tut.innerHTML=tipKey==='discover'?'Try <b>DISCOVERY PULSE</b> to catalog this system. Then tap <b>Worlds</b>, then <b>AUTO</b>. When you arrive, <b>SCAN</b> the planet.<button data-action="dismiss-tip">Got it</button>':'Survey data is valuable. Select <b>Station</b>, tap <b>AUTO</b>, then <b>DOCK</b>. Walk the deck to <b>Cartographics</b> to sell it.<button data-action="dismiss-tip">Got it</button>';}else if(!tipVisible)delete tut.dataset.tip;
}
function updateFrontierHUD(){
 const s=game.s,st=getStats(s),surface=game.surface,onfoot=game.onfoot,t=game.target,d=t?dist(game.player,t):0;
 $('heat-label').textContent=Math.round(s.heat)+'%';$('heat-meter').style.width=Math.min(100,s.heat)+'%';$('heat-meter').style.background=s.heat>=95?'#ff7777':s.heat>=80?'#f5b778':'#88b6ea';
 const cataloged=s.systemScans.includes(s.system),discovery=$('discovery-button');discovery.hidden=!!surface||!!onfoot;discovery.disabled=s.docked||!!game.jump||!!game.scan||!!game.discoveryScan||cataloged;discovery.textContent=game.discoveryScan?'PULSE CHARGING…':cataloged?'SYSTEM CATALOGED':'DISCOVERY PULSE';
 $('scanner-status').hidden=!!surface||!!onfoot;$('scanner-status').textContent=(cataloged?'Catalog complete':game.sys.uncharted?'Discovery pulse locates worlds':'Known stellar charts')+' · '+game.visiblePlanets.length+' worlds located · '+game.planets.filter(p=>s.scanned.includes(p.id)).length+'/'+game.planets.length+' surveyed';

 $('hud').classList.toggle('surface-mode',!!surface);$('hud').classList.toggle('station-mode',!!onfoot&&!!s.docked);$('station-target').hidden=!game.sys.hasStation;$('flight-targets').hidden=!!surface||!!onfoot;$('auto-button').hidden=!!surface||!!onfoot;$('scan-button').hidden=!!surface||!!onfoot;$('brake').hidden=!!onfoot&&!!s.docked;
 const boostBtn=$('boost');if(boostBtn){const stationPad=!!onfoot&&!!s.docked;if(boostBtn.dataset.mode!==(stationPad?'station':surface?'surface':'space')){boostBtn.dataset.mode=stationPad?'station':surface?'surface':'space';boostBtn.textContent=stationPad?'SPRINT':surface?'BOOST':'BOOST';}boostBtn.classList.toggle('sprint',stationPad);}
 const caption=document.querySelector('.control-caption');if(caption)caption.textContent=onfoot&&s.docked?'WALK · HOLD SPRINT':surface?'SURFACE ASSIST ON':'FLIGHT ASSIST ON';
 const beltBtn=[...document.querySelectorAll('#flight-targets [data-id="belt"]')][0];if(beltBtn)beltBtn.hidden=!game.belt&&!(game.belts&&game.belts.length);
 $('landing-button').hidden=!surface&&(s.docked||t?.type!=='planet'||(t&&t.landable===false));$('landing-button').textContent=surface?'RETURN TO ORBIT':'LAND ON WORLD';
 const fire=$('fire'),mode=surface?'surface':onfoot?'station':'space';if(fire.dataset.mode!==mode){fire.dataset.mode=mode;fire.innerHTML=icon('fire')+(surface?'SCAN SIGNAL':onfoot?'INTERACT':'FIRE / MINE');}
 const activeOp=s.operations[0];if(activeOp&&!game.surface&&!onfoot)$('flight-desc').textContent=operationDetails(s,activeOp).next;
 const route=s.route,next=route?.path[0];$('route-hud').innerHTML=route?`<button data-action="map">${next!=null?'↗ '+systemName(SYSTEMS[next],s)+' · '+route.path.length+' jumps remaining':'✓ Destination reached'}</button>`:'';
 if(onfoot&&s.docked){
  const z=nearestZone(onfoot);
  $('flight-status').textContent=s.detained?'DETENTION HOLD':game.sys.prison?'PRISON BARGE':'STATION DECK';
  $('flight-location').textContent=onfoot.title||sysStationName();
  $('flight-desc').textContent=z?(z.launch?'Hangar bay — launch when ready.':('At '+z.label+'. Interact to open services.')):'Walk corridors to Market, Cartographics, Contracts, and more.';
  $('target-name').textContent=z?z.label:'Station deck';
  $('target-type').textContent=z?(z.launch?'Departure':'Service desk'):'Walk to a highlighted pad';
  $('target-dist').textContent=z?Math.round(Math.hypot(z.x-onfoot.x,z.y-onfoot.y))+' m':'';
  const context=$('context-action');context.textContent=z?(z.launch?(s.detained?'HELD · PAY FINE':'LAUNCH'):'OPEN '+z.label.toUpperCase()):'WALK TO A DESK';context.disabled=!z||(z.launch&&s.detained);
  const sprinting=!!(touch.boost||keys.shift);$('speed').textContent=Math.round(Math.hypot(onfoot.vx,onfoot.vy));$('motion-mode').textContent=sprinting?'SPRINT':'ON FOOT';$('boost')?.classList.toggle('held',sprinting&&!panel);
  const caption=document.querySelector('.control-caption');if(caption)caption.textContent='WALK · HOLD SPRINT';
  $('center-status').innerHTML='';
 }else if(surface){const a=nearestAnomaly(surface),d=a?Math.hypot(a.x-surface.x,a.y-surface.y):0,inRange=a&&d<=230+st.surfaceRange;
  $('flight-status').textContent='SURFACE EXPEDITION';$('flight-location').textContent=surface.planetName;$('flight-desc').textContent='Fly left or right. Hover near a signal to scan. Ping beacon for a bearing.';
  $('shield-label').textContent='SKIFF '+Math.ceil(surface.integrity)+'%';$('shield-meter').style.width=surface.integrity+'%';
  $('target-name').textContent=a?a.name:'Surface fully recorded';$('target-type').textContent=a?'Anomaly · '+a.kind:'Return to orbit to sell signals';$('target-dist').textContent=a?Math.round(d)+' m':'';
  const context=$('context-action');context.textContent=surface.scan?'SCANNING…':inRange?'SCAN SIGNAL':a?(surface.pingCooldown>0?'BEACON '+Math.ceil(surface.pingCooldown)+'s':'PING BEACON'):'ALL SIGNALS RECORDED';context.disabled=!!surface.scan||(!a)||(!!a&&!inRange&&surface.pingCooldown>0);
  $('speed').textContent=Math.round(Math.hypot(surface.vx,surface.vy));$('motion-mode').textContent=Math.max(0,Math.round(terrainAt(surface.x,surface.seed)-surface.y-16))+' m ALTITUDE';
  const caption=document.querySelector('.control-caption');if(caption)caption.textContent='SURFACE FLIGHT';
  $('center-status').innerHTML=surface.scan?`RECORDING SIGNAL<div class="progress"><i style="width:${surface.scan.progress/3*100}%"></i></div>`:surface.ping?`BEACON PING · ${surface.ping.life.toFixed(1)}s`:'';
 }else if(t?.type==='star'){$('target-type').textContent=(t.primary!==false&&t.id==='star'?'Primary':'Companion')+' star · fuel source';$('context-action').textContent=game.scooping?'STOP SCOOPING':s.fuel>=st.fuel?'TANK FULL':dist(game.player,t)>t.r+600?'APPROACH TO SCOOP':'SCOOP FUEL';$('context-action').disabled=s.docked||!!game.jump||(!game.scooping&&s.fuel>=st.fuel);}
 else if(t?.type==='station'){$('target-type').textContent=t.roleLabel||'Orbital station';}
 if(!surface&&!onfoot){
  const caption=document.querySelector('.control-caption');if(caption)caption.textContent='FLIGHT ASSIST ON';
  if(t?.type==='wake'){$('target-type').textContent=t.scanned?`Wake → ${systemName(SYSTEMS[t.to],s)}`:'Hyperspace wake · unresolved';$('context-action').textContent=t.scanned?'PLOT WAKE ROUTE':d<=260?'SCAN WAKE':'APPROACH WAKE';$('context-action').disabled=s.docked||!!game.jump;}
  if(t?.type==='signal'||t?.type==='derelict'){$('context-action').textContent=t.scanned?'RESOLVED':d<=280?'SCAN SIGNAL':'APPROACH';$('context-action').disabled=s.docked||!!game.jump||t.scanned;}
  if(game.scooping&&!game.jump&&!game.scan)$('center-status').textContent='SCOOPING · '+game.scoopRate.toFixed(1)+' fuel/s · HEAT '+Math.round(s.heat)+'%';
  if(game.discoveryScan)$('center-status').innerHTML=`DISCOVERY PULSE<div class="progress"><i style="width:${Math.min(100,game.discoveryScan.progress/4*100)}%"></i></div>`;
  if(s.heat>=80)$('flight-status').textContent=s.heat>=100?'OVERHEATING · HULL DAMAGE':'HEAT WARNING · MOVE AWAY FROM STAR';
  if(game.heatWanted>0)$('flight-status').textContent='WANTED · HEAT '+Math.ceil(game.heatWanted)+(s.bounty?' · '+fmt(s.bounty)+' CR':'');
  else if(s.bounty)$('flight-status').textContent=wantedTier(s.bounty).label+' · '+fmt(s.bounty)+' CR ON FILE';
 }

 if(!surface&&!onfoot&&t?.faction){$('target-type').textContent=FACTIONS.find(f=>f.id===t.faction)?.name||'Faction vessel';$('context-action').textContent=t.type==='faction'?'ENGAGE PATROL':'INTERCEPT';}
}
function sysStationName(){return game.station?.name||game.sys.station;}
function toast(message,tone){const e=document.createElement('div');e.className='toast '+tone;e.textContent=message;$('toasts').appendChild(e);while($('toasts').children.length>3)$('toasts').firstChild.remove();setTimeout(()=>e.remove(),4300);if(tone==='good')sound('good');}
function drainEvents(){while(game.events.length){const e=game.events.shift();toast(e.text,e.tone);}}
function openPanel(name){lastFocus=document.activeElement;panel=name;if(name!=='station')deskVisit=false;resetControls();if(name==='map'){selectedSystem=game.s.route?.destination??game.s.system;mapCamera.x=SYSTEMS[game.s.system].x;mapCamera.y=SYSTEMS[game.s.system].y;}renderPanel();updateHUD();setTimeout(()=>{$('panel-layer').querySelector('button')?.focus();},0);}
function closePanel(){panel=null;deskVisit=false;$('panel-layer').innerHTML='';resetControls();updateHUD();if(lastFocus?.isConnected)lastFocus.focus();save();}
function modalShell(title,eyebrow,body,options={}){return `<div class="screen-cover${options.desk?' desk-cover':''}"><section class="modal${options.desk?' desk-terminal':''}" role="dialog" aria-modal="true" aria-labelledby="modal-title"><header class="modal-head"><div><div class="eyebrow">${eyebrow}</div><h2 id="modal-title">${title}</h2></div><div class="actions">${options.actions||''}<button class="icon-button quiet" data-action="close" aria-label="${options.desk?'Return to deck':'Close panel'}">${icon('close')}</button></div></header>${options.tabs||''}<div class="modal-body">${body}</div>${options.footer?`<footer class="modal-foot">${options.footer}</footer>`:''}</section></div>`;}
const DESK_META={
 market:{title:'Market counter',clerk:'Station trader',blurb:'Buy, sell, refuel, and repair at the counter.'},
 data:{title:'Cartographics',clerk:'Survey clerk',blurb:'Review and sell exploration data packages.'},
 contracts:{title:'Contracts board',clerk:'Dispatcher',blurb:'Accept work and claim completed contracts.'},
 outfitting:{title:'Outfitting bay',clerk:'Systems tech',blurb:'Fit, remove, and transfer ship modules.'},
 shipyard:{title:'Hangar office',clerk:'Yard master',blurb:'Switch hulls, buy ships, and manage the hangar.'},
 guilds:{title:'Guild desks',clerk:'Guild liaison',blurb:'Join guilds and claim commission rewards.'},
 factions:{title:'Faction office',clerk:'Political attaché',blurb:'Pledge allegiance and run faction operations.'},
 detention:{title:'Detention desk',clerk:'Barge officer',blurb:'Clear bounties and process release.'}
};
function openDesk(service){
 stationTab=service||'market';deskVisit=true;try{engine.unlock();}catch{}
 sound('good');
 openPanel('station');
}
function renderPanel(){
 if(!panel)return;const s=game.s,st=getStats(s);let html='';
 if(panel==='station'){
  if(!s.docked){closePanel();return;}
  const prison=!!game.sys.prison,detained=!!s.detained,fine=Math.max(s.bounty||0,detained?500:0);
  if(detained&&stationTab!=='detention')stationTab='detention';
  if(stationTab==='concierge')stationTab='market';
  // Docked station UI is always a single-desk terminal (space legs).
  const meta=DESK_META[stationTab]||{title:'Station desk',clerk:'Attendant',blurb:'Station services.'};
  let body='';
  if(stationTab==='detention')body=`<div class="station-status"><span class="tag ${detained||s.bounty?'danger':'safe'}">${detained?'DETAINED':s.bounty?'BOUNTY ON FILE':'CLEARED'}</span></div><p class="intro">${detained?'System security transferred you here after disabling your ship. Cargo and delivery contracts were confiscated. Pay the fine to restore CLEAN standing and launch.':prison?'This barge processes wanted pilots. Clear an active bounty here, or return after a security kill.':'Detention processing is available at prison barges across the frontier.'}</p><div class="stats-grid">${[[fmt(fine)+' cr','Release fine'],[wantedTier(s.bounty).label,'Standing'],[SYSTEMS.filter(sys=>sys.prison).length,'Prison barges']].map(([v,l])=>`<div class="stat-card"><b>${v}</b><span>${l}</span></div>`).join('')}</div><div class="section-actions" style="margin-top:18px"><button class="primary" data-action="pay-bounty" ${!fine||s.credits<fine?'disabled':''}>${detained?'Pay fine & release':'Clear bounty'} · ${fmt(fine)} cr</button></div><p class="detail-text" style="margin-top:14px">${s.credits<fine?'You need more credits before barge security will release you.':'Once cleared, return to the hangar bay to launch.'}</p>`;
  if(stationTab==='market')body=`<div class="station-status"><button data-action="refuel" ${s.fuel>=st.fuel?'disabled':''}>Refuel <span class="accent">${fmt(Math.ceil(st.fuel-s.fuel)*2)} cr</span></button><button data-action="repair" ${s.hull>=st.hull?'disabled':''}>Repair <span class="accent">${fmt(Math.ceil(st.hull-s.hull)*4)} cr</span></button>${s.bounty||s.detained?`<button data-action="pay-bounty" ${s.credits<Math.max(s.bounty||0,s.detained?500:0)?'disabled':''}>${s.detained?'Pay fine':'Clear bounty'} <span class="accent">${fmt(Math.max(s.bounty||0,s.detained?500:0))} cr</span></button>`:''}<span class="tag ${s.bounty||s.detained?'danger':'safe'}">${s.detained?'Detained · '+fmt(fine)+' cr fine':s.bounty?fmt(s.bounty)+' cr bounty':s.data||s.records.length?'Exploration data pending':'Exploration data settled'}</span></div><div class="row-label"><div class="quantity">Trade quantity ${[1,5].map(n=>`<button class="${qty===n?'active':''}" data-action="quantity" data-id="${n}">${n} t</button>`).join('')}</div><div class="eyebrow">${cargoUsed(s)} / ${st.cargo} T</div></div><table class="market"><thead><tr><th>COMMODITY</th><th class="supply">SUPPLY</th><th>BUY / SELL</th><th>HOLD</th><th>TRADE</th></tr></thead><tbody>${GOODS.map(g=>`<tr><td><div class="good-name"><span class="commodity-dot" style="background:${g.color}"></span>${g.name}</div><div class="sub">${g.desc}</div></td><td class="supply">${game.stock(g.id)} t</td><td>${fmt(price(game.sys,g.id,true,s))}<span class="muted"> / ${fmt(price(game.sys,g.id,false,s))}</span></td><td>${s.cargo[g.id]}</td><td><div class="trade-buttons"><button data-action="buy" data-id="${g.id}" aria-label="Buy ${qty} tons ${g.name}" ${s.credits<price(game.sys,g.id,true,s)*qty||st.cargo-cargoUsed(s)<qty||game.stock(g.id)<qty?'disabled':''}>Buy</button><button data-action="sell" data-id="${g.id}" aria-label="Sell ${qty} tons ${g.name}" ${s.cargo[g.id]<qty?'disabled':''}>Sell</button></div></td></tr>`).join('')}</tbody></table><p class="intro" style="margin:18px 0 0">${prison?'Commissary prices are thin. Pay any fine before launch.':'Prices are per ton. Agricultural systems produce cheap food; extraction colonies pay more.'}</p>`;
  if(stationTab==='data')body=explorationView(game);
  if(stationTab==='contracts')body=contractsView(true);
  if(stationTab==='outfitting')body=moduleView(game);
  if(stationTab==='shipyard')body=fleetView(game);
  if(stationTab==='guilds')body=guildView(game);
  if(stationTab==='factions')body=factionView(game);
  if(stationTab==='market')body=robotStrip(game)+body;
  const launchBtn=stationTab==='shipyard'?`<button class="primary" data-action="launch" ${detained?'disabled':''}>${detained?'Held · pay fine':'Launch →'}</button>`:`<button data-action="close">Return to deck</button>`;
  const intro=`<div class="desk-banner"><div class="desk-clerk" aria-hidden="true"></div><div><div class="eyebrow">${esc(meta.clerk).toUpperCase()}</div><p>${esc(meta.blurb)}</p></div></div>`;
  html=modalShell(meta.title,(game.station?.name||game.sys.station)+' · deck terminal',intro+body,{desk:true,actions:launchBtn,footer:`<span class="muted">Walk the deck to visit other services</span><span class="accent">${fmt(s.credits)} cr</span>`});
 }
 if(panel==='map')html=modalShell('The frontier','GALAXY CHART · '+s.visited.length+' / 192 SYSTEMS VISITED',galaxyHTML(game,selectedSystem,mapQuery,mapFilter),{actions:s.docked?'<button class="primary" data-action="launch-map">Launch →</button>':''});
 if(['guilds','factions','modules','fleet'].includes(panel)){const views={guilds:guildView,factions:factionView,modules:moduleView,fleet:fleetView},names={guilds:'Guild commissions',factions:'Factions & operations',modules:'Ship modules',fleet:'Your hangar'};html=modalShell(names[panel],s.docked?game.sys.station:'FLIGHT LOG · DOCK TO FIT & CLAIM',views[panel](game),{tabs:'<nav class="tabs">'+Object.entries(names).map(([id,title])=>`<button data-action="${id}" class="${panel===id?'active':''}">${title}</button>`).join('')+'</nav>'});}
 if(panel==='missions')html=modalShell('Your contracts','FLIGHT LOG · '+s.contracts+' COMPLETED',contractsView(false));
 if(panel==='ship')html=modalShell(st.name,'SHIP & PILOT',`<p class="intro">${st.desc}</p><div class="section-actions"><button data-action="modules">Manage modules</button><button data-action="fleet">Hangar</button><button data-action="factions">Factions</button></div><div class="stats-grid">${[[s.visited.length,'Systems visited'],[s.scanned.length,'Worlds surveyed'],[s.kills,'Ships defeated'],[s.mined,'Tons mined'],[s.contracts,'Contracts complete'],[fmt(s.bounty)+' cr','Active bounty']].map(([v,l])=>`<div class="stat-card"><b>${v}</b><span>${l}</span></div>`).join('')}</div>${[['Role',st.role],['Cargo',cargoUsed(s)+' / '+st.cargo+' t'],['Fold range',st.range+' ly'],['Pulse damage',st.damage],['Cruise speed',st.speed+' m/s'],['Trading revenue',fmt(s.trade)+' cr'],['Unsold data',fmt(s.data+s.records.reduce((v,r)=>v+r.value,0))+' cr']].map(([k,v])=>`<div class="data-row"><span>${k}</span>${v}</div>`).join('')}<h3 style="margin:23px 0 10px">Cargo manifest</h3>${GOODS.filter(g=>s.cargo[g.id]).map(g=>`<div class="data-row"><span>${g.name}</span>${s.cargo[g.id]} t</div>`).join('')||'<p class="detail-text">No commodities aboard.</p>'}${s.missions.filter(m=>m.type==='delivery').map(m=>`<div class="data-row"><span>Sealed contract supplies</span>${m.tons} t</div>`).join('')}<p class="intro" style="margin-top:20px">Dock at any station to upgrade modules, buy a new ship, or clear a bounty.</p>`);
 if(panel==='menu'||panel==='help'){
  html=modalShell(panel==='help'?'Your first flight':'Flight menu',`FARBOUND · v${RELEASE}${simPaused()?' · PAUSED':''}`,`${panel==='help'?helpHTML():`<div class="setting-row"><div><h3>Flight manual</h3><p>Controls, earning credits, and staying in flight.</p></div><button data-action="help">Open manual</button></div><div class="setting-row"><div><h3>Sound effects</h3><p>Engine and interface sounds. Set ambience volume independently below.</p></div><button class="${s.sound?'switch-on':''}" data-action="sound">${s.sound?'Sound on':'Sound off'}</button></div><div class="setting-row"><div><h3>Engine & station ambience</h3><p>Ship thrusters in flight and habitat hum on the station deck.</p></div><label class="volume-control"><span id="volume-value">${Math.round((Number.isFinite(s.engineVolume)?s.engineVolume:.35)*100)}%</span><input id="engine-volume" aria-label="Engine and station volume" type="range" min="0" max="100" value="${Math.round((Number.isFinite(s.engineVolume)?s.engineVolume:.35)*100)}"></label></div><div class="setting-row"><div><h3>Install on Android</h3><p>${offlineReady?'Offline game files are ready.':'Open online once to prepare offline play.'} In Chrome, use ⋮ → Add to Home screen → Install.</p></div><button data-action="install">Install game</button></div><div class="setting-row"><div><h3>Save progress</h3><p>${storageOK?'Auto-saved on this device.':'Device storage unavailable.'} Export a backup to move your pilot to another device.</p></div><button data-action="export">Export save</button></div><div class="setting-row"><div><h3>Restore a pilot</h3><p>Import a Farbound save file. Replaces this device’s current progress.</p></div><label><span class="sr-only">Import save file</span><input class="file-input" id="import-save" type="file" accept=".json,application/json"></label></div><div class="setting-row"><div><h3>Roll back progress</h3><p>A rolling checkpoint keeps a recent copy of this pilot. Export a save for a permanent backup.</p></div><button data-action="restore-checkpoint">Restore checkpoint</button></div><div class="setting-row"><div><h3>Original game · v1.0</h3><p>Open the original release with your original pilot. Frontiers progress remains saved separately.</p></div><a class="button-link" href="./classic/index.html">Play original v1</a></div><div class="setting-row"><div><h3>Emergency recovery</h3><p>Return to the station with a full tank. Costs up to 250 cr; cargo, delivery contracts and unsold data and anomaly signals are lost.</p></div><button class="danger" data-action="rescue-prompt">Call recovery</button></div><div class="setting-row"><div><h3>New journey</h3><p>Start fresh after preserving a checkpoint of this pilot.</p></div><button class="danger" data-action="reset-prompt">Start over</button></div><div class="setting-row"><div><h3>Temporary DEV menu</h3><p>Teleport, credits, bounty, wakes, and response teams for testing.</p></div><button data-action="dev">Open DEV tools</button></div><p class="detail-text" style="margin-top:18px">Release ${RELEASE_NAME} ${RELEASE}. Station desks keep local space running; closing a desk returns you to the walkable deck.</p>`}`);
 }
 if(panel==='dev'){
  const storm=SYSTEMS.find(sys=>sys.uncharted&&systemSky(sys).kind==='storm')||SYSTEMS.find(sys=>sys.uncharted);
  const nebulaSys=SYSTEMS.find(sys=>systemSky(sys).kind==='nebula'&&sys.id!==storm?.id)||SYSTEMS[64];
  const relay=SYSTEMS.find(sys=>sys.uncharted&&sys.hasStation)||SYSTEMS[64];
  const wanted=wantedTier(s.bounty);
  html=modalShell('DEV tools',`TEMP · v${RELEASE} · ${wanted.label}`,`<p class="intro">Temporary helpers for testing skies, wakes, transit, and wanted response. Remove later.</p>
<div class="setting-row"><div><h3>Credits</h3><p>Current ${fmt(s.credits)} cr.</p></div><div class="section-actions"><button data-action="dev-credits" data-id="10000">+10k</button><button data-action="dev-credits" data-id="100000">+100k</button></div></div>
<div class="setting-row"><div><h3>Repair & fuel</h3><p>Top off hull, shield, and tank.</p></div><button data-action="dev-refit">Full refit</button></div>
<div class="setting-row"><div><h3>Wanted standing</h3><p>${wanted.label} · ${fmt(s.bounty)} cr bounty.</p></div><div class="section-actions"><button data-action="dev-bounty" data-id="0">Clear</button><button data-action="dev-bounty" data-id="600">Wanted</button><button data-action="dev-bounty" data-id="2800">Extreme</button></div></div>
<div class="setting-row"><div><h3>Teleport · storm sky</h3><p>${storm?systemName(storm,s)+' · '+systemSky(storm).label:'n/a'}</p></div><button data-action="dev-teleport" data-id="${storm?.id??64}">Go</button></div>
<div class="setting-row"><div><h3>Teleport · nebula sky</h3><p>${systemName(nebulaSys,s)} · ${systemSky(nebulaSys).label}</p></div><button data-action="dev-teleport" data-id="${nebulaSys.id}">Go</button></div>
<div class="setting-row"><div><h3>Teleport · uncharted relay</h3><p>${systemName(relay,s)}</p></div><button data-action="dev-teleport" data-id="${relay.id}">Go</button></div>
<div class="setting-row"><div><h3>Home station</h3><p>Return to Solace docked.</p></div><button data-action="dev-home">Dock at Solace</button></div>
<div class="setting-row"><div><h3>${esc(STATION_ROBOT.displayName)} · Market strip</h3><p>Dock at Solace Market and force a dialogue line on the strip.</p></div><div class="section-actions"><button data-action="dev-concierge">Open market</button><button data-action="dev-robot-talk">Force line</button></div></div>
<div class="setting-row"><div><h3>Nearest prison barge</h3><p>Teleport docked to a detention barge.</p></div><button data-action="dev-prison">Go to prison</button></div>
<div class="setting-row"><div><h3>Simulate security kill</h3><p>Force a detention transfer as if security disabled you.</p></div><button class="danger" data-action="dev-detain">Detain me</button></div>
<div class="setting-row"><div><h3>Spawn wake</h3><p>Create a scannable outbound wake near you.</p></div><button data-action="dev-wake">Spawn wake</button></div>
<div class="setting-row"><div><h3>Force freighter jump</h3><p>Make the outbound freighter leave immediately.</p></div><button data-action="dev-force-jump">Jump freighter</button></div>
<div class="setting-row"><div><h3>Security response</h3><p>Scramble the SWAT-style response team now.</p></div><button class="danger" data-action="dev-response">Spawn response</button></div>
<div class="setting-row"><div><h3>Wipe local patrols</h3><p>Destroy remaining local patrols (triggers response if none left).</p></div><button class="danger" data-action="dev-clear-patrols">Clear patrols</button></div>
<div class="setting-row"><div><h3>Dynamic events</h3><p>Force an ambient event. Active ${game.dyn?.active?.length||0} · cooldown ${Math.ceil(game.dyn?.cooldown||0)}s.</p></div><div class="section-actions">${EVENT_IDS.map(id=>`<button data-action="dev-event" data-id="${id}">${id}</button>`).join('')}</div></div>`);
 }
 if(panel==='confirm')html=modalShell(confirmAction?.title||'Confirm','FLIGHT CONTROL',`<p class="detail-text">${confirmAction?.text||''}</p>`,{footer:'<button data-action="cancel-confirm">Cancel</button><button class="danger" data-action="confirm">Confirm</button>'});
 const old=$('panel-layer').querySelector('.modal-body'),scroll=old?.scrollTop||0,focus=document.activeElement,act=focus?.dataset?.action,id=focus?.dataset?.id;
 $('panel-layer').innerHTML=html;
 const body=$('panel-layer').querySelector('.modal-body');if(body)body.scrollTop=scroll;
 if(act){const matches=[...$('panel-layer').querySelectorAll('button')];matches.find(b=>b.dataset.action===act&&b.dataset.id===id)?.focus({preventScroll:true});}
 if(panel==='map')requestAnimationFrame(drawMap);
}
function explorationView(game){const s=game.s,pending=s.explorationLog.filter(e=>!e.sold),sold=s.explorationLog.filter(e=>e.sold),signals=s.records.reduce((n,r)=>n+r.value,0),total=s.data+signals,types={system:'System catalog',world:'Detailed world survey',surface:'Surface anomaly',legacy:'Recovered cache'},rows=list=>list.map(e=>`<div class="discovery-row"><div><strong>${esc(e.name)}</strong><span>${types[e.type]} · ${esc(SYSTEMS[e.system].name)}</span></div><b>${fmt(e.value)} cr</b></div>`).join('');return `<div class="section-heading"><div><div class="eyebrow">UNIVERSAL CARTOGRAPHICS</div><h3>${pending.length} unsold discoveries</h3></div><button class="primary" data-action="sell-data" ${!total?'disabled':''}>Sell all · ${fmt(total)} cr</button></div><div class="stats-grid">${[[s.systemScans.length,'Systems cataloged'],[s.scanned.length,'Worlds surveyed'],[s.surfaceScanned.length,'Surface signals'],[fmt(total)+' cr','Data aboard']].map(([v,l])=>`<div class="stat-card"><b>${v}</b><span>${l}</span></div>`).join('')}</div><h3 class="section-title">Data aboard</h3><div class="discovery-list">${rows(pending)||'<p class="detail-text">No unsold discoveries. Scan systems, worlds, and surface signals to build a data package.</p>'}</div>${sold.length?`<h3 class="section-title">Sold discoveries</h3><div class="discovery-list sold">${rows(sold.slice(-40).reverse())}</div>`:''}`;}
function contractsView(atStation){const s=game.s;let out='';if(s.missions.length){out+='<h3 style="margin-bottom:15px">Active · '+s.missions.length+' / 3</h3><div class="cards">'+s.missions.map(m=>{const worlds=m.type==='survey'?surveyWorldIds(m.destination,SYSTEMS[m.destination]):[];let prog=m.type==='delivery'?'Deliver to '+SYSTEMS[m.destination].name:m.type==='survey'?worlds.filter(id=>s.scanned.includes(id)).length+' / '+worlds.length+' worlds scanned':m.type==='bounty'?Math.min(2,s.metrics.pirates-m.startKills)+' / 2 pirates defeated':s.cargo.ore+' / 5 t titanium aboard';return `<article class="card"><span class="tag">${m.type}</span><h3>${esc(m.name)}</h3><p>${esc(m.desc||'Complete the contract objectives.')}</p><p class="accent">${prog}</p><div class="contract-route"><button data-action="route-contract" data-id="${m.id}">Plot destination route ↗</button><span>${jumpDistance(s.system,missionDestination(s,m)).toFixed(1)} ly away</span></div><div class="card-bottom"><b>${fmt(m.reward)} cr</b><button class="quiet" data-action="abandon-prompt" data-id="${m.id}">Abandon</button></div><div class="detail-text" style="margin-top:10px">${m.type==='delivery'?'Paid on delivery.':'Return to '+SYSTEMS[m.origin].station+' in '+SYSTEMS[m.origin].name+'.'}</div></article>`;}).join('')+'</div>';}
 else out='<p class="intro">No active contracts. Station boards offer delivery, survey, bounty, and mining work.</p>';
 if(atStation){const board=contractsFor(s);out+='<h3 style="margin:25px 0 15px">Station board</h3>';out+=board.length?'<div class="cards">'+board.map(m=>`<article class="card"><span class="tag">${m.type}</span><h3>${m.name}</h3><p>${m.desc}</p><div class="card-bottom"><b>${fmt(m.reward)} cr</b><button data-action="accept" data-id="${m.id}" ${s.missions.length>=3?'disabled':''}>Accept contract</button></div></article>`).join('')+'</div>':'<div class="empty">All contracts here are accepted or completed. Visit another system for fresh work.</div>';if(s.missions.some(m=>game.missionReady(m)))out+='<button class="primary" style="margin-top:20px" data-action="claim">Claim completed contracts</button>';}
 else if(s.docked)out+='<button style="margin-top:20px" data-action="station-contracts">Open station board</button>';else out+='<p class="intro" style="margin-top:20px">Completed contracts pay automatically when you dock at their destination. Station desks keep local space running; closing a desk returns you to the walkable deck.</p>';
 return '<div class="section-actions"><button data-action="guilds">Guild commissions</button><button data-action="factions">Faction operations</button></div>'+(s.operations.length?'<h3>Active faction operations</h3><div class="cards">'+operationCards(game)+'</div>':'')+out;
}
function helpHTML(){return `<p class="intro">You begin with a Wren explorer and 2,400 credits. All roles are open from the start.</p><div class="help-grid"><div><h3>01 · Fly</h3><p>Drag the left stick toward your destination. Hold BOOST for more speed. Flight assist slows your ship when you let go. Keyboard: W / ↑ thrust, A D / ← → turn, Shift boost, S brake.</p></div><div><h3>02 · Explore</h3><p>Use DISCOVERY PULSE (H) to catalog a system; in uncharted space it reveals the worlds. Select Worlds, then AUTO to approach. Slow below 100 m/s and SCAN (R) for a detailed survey. Dock, walk to Cartographics, review your discovery list, and sell the data when ready. Each catalog and world pays once.</p></div><div><h3>03 · Trade & work</h3><p>Dock to step onto the station deck. Walk to Market, Contracts, and other desks. Hold SPRINT (Shift) to move faster. Closing a desk returns you to the deck; launch only from the hangar bay. Local space keeps running while you shop. Buy goods where they are produced and sell them where demand is higher. Contract supplies reserve cargo space.</p></div><div><h3>04 · Mine & fight</h3><p>Select Belt, then AUTO. Point toward rocks and hold FIRE / MINE to collect minerals. Pirates lurk near the belt. Face them and fire; nearby targets get aim assist. Civilian ships can be attacked and may yield cargo when destroyed, but every assault adds a bounty and summons security. If security disables you, you are transferred to the nearest prison barge — not always in-system. Pay the fine to launch again. Clear lesser bounties at any station market.</p></div><div><h3>05 · Jump</h3><p>Launch, open Galaxy, select a star, and plot a route. Jump next follows each leg within your drive range. Contracts can plot their destination directly. Jumps consume fuel; local flight does not. Most uncharted systems have no station. Jumps arrive near the primary star. Select Star, approach, slow below 100 m/s, then SCOOP for free fuel. Closer means faster collection and more heat. Move away at 80%; the scoop retracts at 95%, and heat above 100% damages your hull. Expedition relays offer services deeper in the Reach.</p></div><div><h3>06 · Keep going</h3><p>Spend credits on modules and larger ships. Shields regenerate after 4 seconds without damage. Destruction costs cargo, survey data and 12% of credits. Recovery in the menu prevents stranding.</p></div><div><h3>07 · Land & discover</h3><p>Approach a world, slow below 100 m/s, then LAND. In the side view, fly with the stick or A / D and W / S. Hover within scan range of a signal and tap SCAN. Out of range, INTERACT pings a beacon toward the nearest signal. Return to orbit and dock to sell it. Hard impacts damage the skiff.</p></div><div><h3>08 · Guilds & factions</h3><p>Walk to guild and faction desks on the station. Accept commissions before working on objectives, then claim unique modules. Fit or transfer them in Modules. Support a faction through relief or combat operations; hostile patrols remember your standing.</p></div></div><p class="detail-text">Tap a nearby object in space to select it. N opens the chart; E docks; R scans; P toggles autopilot; Escape opens the menu (or closes a desk while docked). Flight menu and most overlays pause the sim; station desks do not. Landscape gives you more room, and portrait works too. Progress is stored on this device; clearing site data removes it, so export a backup from the menu.</p>`;}
async function action(a,id){
 try{engine.unlock();}catch{}
 switch(a){
  case 'start':started=true;$('welcome-layer').innerHTML='';try{engine.unlock();}catch{}if(!(game.s.engineVolume>0))game.s.engineVolume=.35;if(game.s.docked&&!game.onfoot)game.enterStationDeck();sound();save();if(boot.migrated){game.notify('Pilot upgraded. Your original game and save are still available in the menu.','good');boot.migrated=false;}else if(boot.recovered){game.notify('Pilot recovered from its checkpoint.','good');boot.recovered=false;}else if(!saved)game.notify(game.s.docked?'Welcome aboard. Walk the station deck to visit services.':'Welcome to the frontier. Select Worlds to make your first discovery.');else if(game.s.docked)game.notify('Back on the station deck. Walk to a service pad.');break;
  case 'welcome-help':started=true;$('welcome-layer').innerHTML='';openPanel('help');break;
  case 'close':if(panel==='station'&&game.s.docked)closePanel();else closePanel();break;
  case 'menu':openPanel('menu');break;
  case 'help':openPanel('help');break;
  case 'dev':openPanel('dev');break;
  case 'dev-credits':game.s.credits+=Number(id)||0;game.notify('DEV · +'+fmt(Number(id))+' credits','good');renderPanel();save();break;
  case 'dev-refit':{const st=getStats(game.s);game.s.hull=st.hull;game.s.shield=st.shield;game.s.fuel=st.fuel;game.notify('DEV · hull, shield, and fuel topped off','good');renderPanel();save();break;}
  case 'dev-bounty':game.s.bounty=Number(id)||0;if(game.s.bounty)game.markWanted(Math.min(100,20+game.s.bounty/40));else{game.heatWanted=0;game.lastKnown=null;game.playerCrimeUntil=0;game.playerCrime=null;}game.notify('DEV · bounty set to '+fmt(game.s.bounty)+' ('+wantedTier(game.s.bounty).label+')','good');renderPanel();save();break;
  case 'dev-teleport':game.teleportTo(Number(id),{docked:false});closePanel();save();break;
  case 'dev-home':game.teleportTo(0,{docked:true});game.s.detained=false;panel='station';renderPanel();save();break;
  case 'dev-concierge':game.teleportTo(0,{docked:true});game.s.detained=false;stationTab='market';panel='station';renderPanel();save();break;
  case 'dev-robot-talk':{if(!game.s.docked)game.teleportTo(game.s.system,{docked:true});const line=game.talkRobot();if(line)game.notify(STATION_ROBOT.displayName+' · '+line.text,'good');stationTab='market';panel='station';renderPanel();save();break;}
  case 'dev-prison':{const prison=SYSTEMS.find(sys=>sys.prison)||SYSTEMS[game.nearestPrison()];game.teleportTo(prison.id,{docked:true});stationTab='detention';panel='station';renderPanel();save();break;}
  case 'dev-detain':{if(game.s.docked)game.s.docked=false;const loss=Math.ceil(game.s.credits*.12);game.s.credits=Math.max(0,game.s.credits-loss);for(const g of GOODS)game.s.cargo[g.id]=0;game.s.data=0;game.s.missions=game.s.missions.filter(m=>m.type!=='delivery');const st=getStats(game.s);game.s.hull=st.hull;game.s.shield=st.shield;game.s.fuel=st.fuel;game.s.docked=true;game.onCombatLoss(loss,{security:true});stationTab='detention';panel='station';renderPanel();save();break;}
  case 'dev-wake':{if(game.s.docked)game.launch();const to=SYSTEMS.find(sys=>sys.id!==game.s.system&&sys.hasStation)?.id||1;const wake={id:'wake-dev-'+Math.floor(game.time*10),type:'wake',name:'Test freighter wake',x:game.player.x+140,y:game.player.y-40,r:30,from:game.s.system,to,shipName:'Test freighter',hull:'freighter',color:'#d2b48c',size:17,uid:'dev-wake',scanned:false,life:120};game.wakes.push(wake);game.target=wake;game.notify('DEV · wake spawned. Approach and SCAN WAKE.','good');closePanel();save();break;}
  case 'dev-force-jump':{const ship=game.traffic.find(t=>t.canJump&&t.job==='DEPARTING FOR JUMP POINT')||game.traffic.find(t=>t.canJump);if(!ship){game.notify('No jump-capable traffic here.');break;}ship.x=game.jumpAnchor().x;ship.y=game.jumpAnchor().y;ship.pause=0.01;ship.target=0;ship.points[1]=game.jumpAnchor();game.departJump(ship);game.notify('DEV · traffic jumped out','good');closePanel();save();break;}
  case 'dev-response':game.spawnResponseTeam({force:true});closePanel();save();break;
  case 'dev-clear-patrols':for(const p of [...game.patrols]){game.patrols=game.patrols.filter(q=>q!==p);p.type='enemy';game.enemies.push(p);game.onDestroyed(p,true);game.enemies=game.enemies.filter(e=>e!==p);}closePanel();save();break;
  case 'dev-event':game.triggerDynamicEvent(id);closePanel();save();break;
  case 'map':openPanel('map');break;
  case 'missions':openPanel('missions');break;
  case 'ship':openPanel('ship');break;
  case 'guilds':case 'factions':case 'modules':case 'fleet':openPanel(a);break;
  case 'target':{
   if(id==='star'&&game.stars?.length>1){const list=game.stars,idx=list.indexOf(game.target);game.target=list[(idx+1)%list.length];game.auto=null;break;}
   if(id==='station'&&game.stations){const docks=game.stations.filter(s=>s.type==='station');if(docks.length>1){const idx=docks.indexOf(game.target);game.target=docks[(idx+1)%docks.length];game.station=game.target;game.auto=null;break;}}
   if(id==='belt'&&game.belts?.length){const list=game.belts,idx=list.indexOf(game.target);game.target=list[(Math.max(0,idx)+1)%list.length];game.auto=null;break;}
   if(!game.surface)game.select(id);break;
  }
  case 'planet':{if(game.surface)break;const worlds=game.visiblePlanets;if(!worlds.length){game.discover();break;}const idx=worlds.indexOf(game.target);game.target=worlds[(idx+1)%worlds.length];game.auto=null;break;}
  case 'context':if(game.surface){const a=nearestAnomaly(game.surface),st=getStats(game.s),d=a?Math.hypot(a.x-game.surface.x,a.y-game.surface.y):Infinity;if(a&&d<=230+st.surfaceRange)game.scanSurface();else game.pingSurface();}else if(game.s.docked){const result=game.interactStation();if(result?.launch)closePanel();else if(result?.service)openDesk(result.service);}else if(game.target?.type==='wake'){if(game.target.scanned)game.followWake();else game.scanWake();}else if(game.target?.type==='signal'||game.target?.type==='derelict')game.scanDynamic();else if(game.target?.type==='star')game.scoop();else if(game.target?.type==='faction')game.engageFaction(game.target);else if(game.target?.type==='station'){if(game.dock()){try{engine.unlock();}catch{}}}else if(game.target?.type==='planet'&&dist(game.player,game.target)<game.target.r+getStats(game.s).scanRange)game.scanTarget();else game.autopilot();break;
  case 'autopilot':if(!game.surface)game.autopilot();break;
  case 'scan':game.scanTarget();break;
  case 'discover':game.discover();break;
  case 'land-or-takeoff':game.surface?game.takeoff():game.land();resetControls();save();break;
  case 'brake':if(game.surface){game.surface.vx=0;game.surface.vy=0;}else if(game.onfoot){game.onfoot.vx=0;game.onfoot.vy=0;}else{game.auto=null;game.player.vx*=.1;game.player.vy*=.1;}break;
  case 'launch':if(game.launch())closePanel();else{stationTab=game.sys.prison||game.s.detained?'detention':'market';if(panel==='station')renderPanel();else openPanel('station');}break;
  case 'tab':stationTab=id;deskVisit=false;renderPanel();break;
  case 'quantity':qty=Number(id);renderPanel();break;
  case 'refuel':game.service('fuel');renderPanel();save();break;
  case 'repair':game.service('hull');renderPanel();save();break;
  case 'pay-bounty':game.payBounty();renderPanel();save();break;
  case 'sell-data':game.sellExplorationData();renderPanel();save();break;
  case 'robot-talk':{game.talkRobot();renderPanel();save();break;}
  case 'robot-tip':{game.talkRobot('tip');renderPanel();save();break;}
  case 'buy':game.buy(id,qty);renderPanel();save();break;
  case 'sell':game.sell(id,qty);renderPanel();save();break;
  case 'upgrade':game.upgrade(id);renderPanel();save();break;
  case 'buy-ship':game.buyShip(id);renderPanel();save();break;
  case 'accept':game.accept(id);renderPanel();save();break;
  case 'claim':game.claimMissions();renderPanel();save();break;
  case 'station-contracts':openDesk('contracts');break;
  case 'select-system':selectedSystem=Number(id);mapCamera.x=SYSTEMS[selectedSystem].x;mapCamera.y=SYSTEMS[selectedSystem].y;renderPanel();break;
  case 'plot-route':game.setRoute(Number(id));renderPanel();save();break;
  case 'route-contract':if(game.routeContract(id)){openPanel('map');save();}break;
  case 'jump-next':if(game.jumpNext()){sound('jump');closePanel();}break;
  case 'launch-map':if(game.launch()){renderPanel();save();}else{stationTab='detention';panel='station';renderPanel();}break;
  case 'clear-route':game.s.route=null;renderPanel();save();break;
  case 'map-zoom':mapChart?.zoom(id==='in'?1.35:1/1.35);break;
  case 'map-home':mapCamera.x=game.sys.x;mapCamera.y=game.sys.y;mapCamera.scale=8;drawMap();break;
  case 'map-overview':{const r=$('galaxy-map').getBoundingClientRect();const xs=SYSTEMS.map(s=>s.x),ys=SYSTEMS.map(s=>s.y),left=Math.min(...xs),right=Math.max(...xs),top=Math.min(...ys),bottom=Math.max(...ys);mapCamera.x=(left+right)/2;mapCamera.y=(top+bottom)/2;mapCamera.scale=Math.min((r.width-50)/(right-left),(r.height-50)/(bottom-top));drawMap();break;}
  case 'equip':game.equip(id);renderPanel();save();break;
  case 'unequip':game.unequip(id);renderPanel();save();break;
  case 'join-guild':game.joinGuild(id);renderPanel();save();break;
  case 'accept-guild':game.acceptGuild(id);renderPanel();save();break;
  case 'claim-guild':game.claimGuild(id);renderPanel();save();break;
  case 'pledge':game.pledge(id==='independent'?null:id);renderPanel();save();break;
  case 'operation-relief':case 'operation-combat':game.acceptOperation(id,a.slice(10));renderPanel();$('panel-layer').querySelector('.modal-body')?.scrollTo(0,0);save();break;
  case 'claim-operation':game.claimOperation(id);renderPanel();save();break;
  case 'route-operation':if(game.routeOperation(id)){if(game.s.route.path.length)openPanel('map');else closePanel();save();}break;
  case 'restore-checkpoint':{const checkpoint=readCheckpoint(localStorage);if(!checkpoint){game.notify('No checkpoint yet. One is created as you continue playing.');break;}confirmAction={title:'Restore the pilot checkpoint?',text:'Return to progress saved at '+new Date(checkpoint.at).toLocaleString()+'. Your current pilot will become the next checkpoint.',do:()=>{save(true);game=new Game(checkpoint.pilot);closePanel();game.notify('Checkpoint restored.','good');}};panel='confirm';renderPanel();break;}
  case 'jump':if(game.jumpTo(Number(id))){sound('jump');closePanel();}break;
  case 'dismiss-tip':showTutorial=false;updateHUD();break;
  case 'sound':game.s.sound=!game.s.sound;if(!game.s.sound)engine.mute();renderPanel();save();break;
  case 'fullscreen':try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{game.notify('Use your browser’s Install option for a full-screen game.');}break;
  case 'install':if(installPrompt){await installPrompt.prompt();await installPrompt.userChoice;installPrompt=null;}else game.notify('In Android Chrome: ⋮ → Add to Home screen → Install.');break;
  case 'export':{save();const data=JSON.stringify(game.serialize(),null,2);if(window.FarboundAndroid?.exportSave){window.FarboundAndroid.exportSave(data);}else{const blob=new Blob([data],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='farbound-pilot.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);game.notify('Pilot save exported.');}break;}
  case 'rescue-prompt':confirmAction={title:'Call emergency recovery?',text:'Your cargo, delivery contracts, and unsold exploration data will be lost. Recovery costs up to 250 credits.',do:()=>{game.rescue();closePanel();save();}};panel='confirm';renderPanel();break;
  case 'reset-prompt':confirmAction={title:'Start a new journey?',text:'Start a fresh pilot? Your current progress is kept as a checkpoint. Export a save to keep a permanent copy.',do:()=>{save(true);game=new Game();saved=null;showTutorial=true;stationTab='market';game.launch();closePanel();save();game.notify('A new journey begins.');}};panel='confirm';renderPanel();break;
  case 'abandon-prompt':confirmAction={title:'Abandon this contract?',text:'This removes the contract and any sealed supplies from your hold. You can accept it again at the original station.',do:()=>{game.abandon(id);panel=game.s.docked?'station':'missions';renderPanel();save();}};panel='confirm';renderPanel();break;
  case 'cancel-confirm':panel='menu';confirmAction=null;renderPanel();break;
  case 'confirm':{const fn=confirmAction?.do;confirmAction=null;fn?.();break;}
 }
 updateHUD();drainEvents();if(a!=='start')sound();
}
document.addEventListener('click',e=>{const b=e.target.closest('[data-action]');if(b&&!b.disabled)action(b.dataset.action,b.dataset.id);});
document.addEventListener('change',async e=>{if(e.target.id==='map-filter'){mapFilter=e.target.value;renderPanel();return;}if(e.target.id!=='import-save')return;const file=e.target.files[0];if(!file)return;try{if(file.size>500000)throw Error();const parsed=validateSave(JSON.parse(await file.text()));if(!parsed)throw Error();confirmAction={title:'Restore this pilot?',text:`Replace your current progress with a ${SHIPS.find(b=>b.id===parsed.ship).name} pilot in ${SYSTEMS[parsed.system].name} with ${fmt(parsed.credits)} credits?`,do:()=>{save(true);game=new Game(parsed);started=true;showTutorial=false;closePanel();save();game.notify('Pilot restored.','good');}};panel='confirm';renderPanel();}catch{game.notify('That file is not a valid Farbound save.','bad');drainEvents();}});
document.addEventListener('input',e=>{if(e.target.id==='engine-volume'){game.s.engineVolume=Math.max(0,Math.min(1,Number(e.target.value)/100));$('volume-value').textContent=e.target.value+'%';try{engine.unlock();}catch{}save();}if(e.target.id==='map-search'){mapQuery=e.target.value;const start=e.target.selectionStart;renderPanel();$('map-search')?.focus({preventScroll:true});try{$('map-search').setSelectionRange(start,start);}catch{}}});
document.addEventListener('pointerdown',()=>{if(started)try{engine.unlock();}catch{}},{passive:true});
document.addEventListener('keydown',e=>{
 if(e.key==='Tab'&&panel){const items=[...$('panel-layer').querySelectorAll('button:not(:disabled),input,select,a[href]')].filter(x=>x.offsetParent!==null),first=items[0],last=items.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}return;}
 if(e.target.matches?.('input,select,textarea'))return;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();if(e.repeat)return;
 if(e.key==='Escape'){if(panel==='station'&&game.s.docked)closePanel();else if(panel)closePanel();else if(started)openPanel('menu');return;}if(simPaused()||!started)return;
 const k=e.key.toLowerCase();keys[k]=true;if(k==='n')openPanel('map');if(k==='e'&&!game.surface){if(game.s.docked)action('context');else if(game.dock()){/* deck */}}if(k==='r'&&!game.onfoot&&!game.surface)game.scanTarget();if(k==='h'&&!game.onfoot)game.discover();if(k==='p'&&!game.surface&&!game.onfoot)game.autopilot();if(k==='l')action('land-or-takeoff');if(k===' '&&game.surface){const a=nearestAnomaly(game.surface),st=getStats(game.s),d=a?Math.hypot(a.x-game.surface.x,a.y-game.surface.y):Infinity;if(a&&d<=230+st.surfaceRange)game.scanSurface();else game.pingSurface();}if(k===' '&&game.onfoot&&game.s.docked)action('context');
});document.addEventListener('keyup',e=>{keys[e.key.toLowerCase()]=false;});
function setupStick(){const stick=$('stick');const move=e=>{if(e.pointerId!==stickPointer)return;const r=stick.getBoundingClientRect(),x=e.clientX-r.left-r.width/2,y=e.clientY-r.top-r.height/2,l=Math.hypot(x,y),max=r.width*.34,mag=Math.min(l,max);touch.aim=l>7?Math.atan2(y,x):null;touch.thrust=l>7?Math.min(1,l/max):0;$('stick-knob').style.transform=`translate(${l?x/l*mag:0}px,${l?y/l*mag:0}px)`;};stick.addEventListener('pointerdown',e=>{if(panel||!started)return;e.preventDefault();stickPointer=e.pointerId;stick.setPointerCapture(e.pointerId);move(e);});stick.addEventListener('pointermove',move);const end=e=>{if(e.pointerId!==stickPointer)return;touch.aim=null;touch.thrust=0;stickPointer=null;$('stick-knob').style.transform='';};stick.addEventListener('pointerup',end);stick.addEventListener('pointercancel',end);stick.addEventListener('lostpointercapture',end);for(const b of document.querySelectorAll('[data-hold]')){b.addEventListener('pointerdown',e=>{if(panel||!started)return;e.preventDefault();b.setPointerCapture(e.pointerId);if(game.surface&&b.dataset.hold==='fire'){const a=nearestAnomaly(game.surface),st=getStats(game.s),d=a?Math.hypot(a.x-game.surface.x,a.y-game.surface.y):Infinity;if(a&&d<=230+st.surfaceRange)game.scanSurface();else game.pingSurface();return;}if(game.onfoot&&game.s.docked&&b.dataset.hold==='fire'){action('context');return;}touch[b.dataset.hold]=true;b.classList.add('held');});const release=()=>{touch[b.dataset.hold]=false;b.classList.remove('held');};b.addEventListener('pointerup',release);b.addEventListener('pointercancel',release);b.addEventListener('lostpointercapture',release);}}
window.addEventListener('blur',()=>{resetControls();engine.muteAll();save();});document.addEventListener('visibilitychange',()=>{resetControls();if(document.hidden)engine.muteAll();save();});window.addEventListener('pagehide',()=>{resetControls();engine.muteAll();save();});window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;});
function resize(){width=innerWidth;height=innerHeight;dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);if(panel==='map')drawMap();}window.addEventListener('resize',resize);
canvas.addEventListener('pointerdown',e=>{if(panel||!started||game.s.docked||game.surface)return;const p={x:(e.clientX-width/2)/cam.zoom+cam.x,y:(e.clientY-height/2)/cam.zoom+cam.y};const docks=(game.stations||[]).filter(s=>s.type==='station'||game.sys.hasStation);const all=[...docks,...(game.stars||[game.star]),...(game.belts||[]),...game.wakes,...game.signals,...game.derelicts,...game.patrols,...game.traffic,...game.visiblePlanets,...game.enemies,...game.asteroids];const target=all.filter(t=>dist(p,t)<Math.max(t.r,35/cam.zoom)).sort((a,b)=>dist(p,a)-dist(p,b))[0];if(target){game.target=target;if(target.type==='station')game.station=target;game.auto=null;updateHUD();}});
function drawMap(){const c=$('galaxy-map');if(!c)return;if(mapChart?.canvas===c){mapChart.draw();return;}mapChart=new GalaxyChart(c,game,mapCamera,id=>{selectedSystem=id;renderPanel();},selectedSystem);}
function circle(x,y,r,color,stroke=false){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);if(stroke){const prev=ctx.lineWidth;ctx.strokeStyle=color;ctx.lineWidth=1;ctx.stroke();ctx.lineWidth=prev;}else{ctx.fillStyle=color;ctx.fill();}}
function drawShip(x,y,a,color,size=19,enemy=false,thrust=0,boost=false){ctx.save();ctx.translate(x,y);ctx.rotate(a);if(thrust>.05){const len=(12+Math.random()*(boost?47:18))*thrust;ctx.fillStyle='#76efdb';ctx.globalAlpha=.7;ctx.beginPath();ctx.moveTo(-size+3,-5);ctx.lineTo(-size-len,0);ctx.lineTo(-size+3,5);ctx.fill();ctx.globalAlpha=1;}ctx.fillStyle=enemy?'#4d252d':'#183742';ctx.strokeStyle=color;ctx.lineWidth=1.7;ctx.beginPath();ctx.moveTo(size*1.25,0);ctx.lineTo(-size,size*.74);ctx.lineTo(-size*.55,0);ctx.lineTo(-size,-size*.74);ctx.closePath();ctx.fill();ctx.stroke();ctx.strokeStyle=color;ctx.globalAlpha=.7;ctx.beginPath();ctx.moveTo(size*.85,0);ctx.lineTo(-size*.5,0);ctx.stroke();ctx.fillStyle='#c8f8f2';ctx.fillRect(0,-2,5,4);ctx.restore();}
function drawSecurityShip(p,hostile=false){
 const f=FACTIONS.find(f=>f.id===p.faction),color=hostile?'#ee918b':(f?.color||'#9eb7bd'),size=18,thrust=p.thrust||0;
 ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle);
 if(thrust>.05){const len=(10+Math.random()*16)*thrust;ctx.fillStyle='#76efdb';ctx.globalAlpha=.65;ctx.beginPath();ctx.moveTo(-size+2,size*.22);ctx.lineTo(-size-len,size*.22);ctx.lineTo(-size+2,size*.22+3.5);ctx.fill();ctx.beginPath();ctx.moveTo(-size+2,-size*.22-3.5);ctx.lineTo(-size-len,-size*.22);ctx.lineTo(-size+2,-size*.22);ctx.fill();ctx.globalAlpha=1;}
 ctx.fillStyle=hostile?'#3a1f28':'#15202c';ctx.strokeStyle=color;ctx.lineWidth=1.7;ctx.beginPath();
 ctx.moveTo(size*1.15,0);ctx.lineTo(size*.35,size*.38);ctx.lineTo(-size*.15,size*.88);ctx.lineTo(size*.05,size*.32);ctx.lineTo(-size*.85,size*.48);ctx.lineTo(-size,size*.18);ctx.lineTo(-size*.55,0);ctx.lineTo(-size,-size*.18);ctx.lineTo(-size*.85,-size*.48);ctx.lineTo(size*.05,-size*.32);ctx.lineTo(-size*.15,-size*.88);ctx.lineTo(size*.35,-size*.38);
 ctx.closePath();ctx.fill();ctx.stroke();
 ctx.globalAlpha=.55;ctx.beginPath();ctx.moveTo(size*.55,0);ctx.lineTo(-size*.25,0);ctx.moveTo(-size*.1,size*.4);ctx.lineTo(size*.2,size*.15);ctx.moveTo(-size*.1,-size*.4);ctx.lineTo(size*.2,-size*.15);ctx.stroke();ctx.globalAlpha=1;
 ctx.fillStyle='#d7f7ff';ctx.beginPath();ctx.ellipse(size*.35,0,4.2,2.8,0,0,6.28);ctx.fill();
 const flash=Math.floor(clock*(p.status==='RESPONDING'?10:6)+ (p.x||0)*.01)%2===0;
 ctx.fillStyle=flash?'#ff3b4a':'#243038';ctx.fillRect(-size*.2,size*.5,5,3.4);
 ctx.fillStyle=flash?'#243038':'#3b8cff';ctx.fillRect(-size*.2,-size*.5-3.4,5,3.4);
 ctx.globalAlpha=.9;ctx.fillStyle=flash?'#ff3b4a':'#3b8cff';ctx.fillRect(-size*.05,-2.4,7,4.8);ctx.globalAlpha=1;
 ctx.restore();
}
function drawPlayerHull(id,size,color){
 ctx.fillStyle='#152833';ctx.strokeStyle=color;ctx.lineWidth=1.8;ctx.beginPath();
 if(id==='mule'){ctx.moveTo(size*1.05,0);ctx.lineTo(size*.35,size*.78);ctx.lineTo(-size*.85,size*.9);ctx.lineTo(-size,size*.35);ctx.lineTo(-size*.7,0);ctx.lineTo(-size,-size*.35);ctx.lineTo(-size*.85,-size*.9);ctx.lineTo(size*.35,-size*.78);}
 else if(id==='kestrel'){ctx.moveTo(size*1.35,0);ctx.lineTo(size*.15,size*.42);ctx.lineTo(-size*.35,size*.95);ctx.lineTo(-size*.15,size*.35);ctx.lineTo(-size,size*.48);ctx.lineTo(-size*.55,0);ctx.lineTo(-size,-size*.48);ctx.lineTo(-size*.15,-size*.35);ctx.lineTo(-size*.35,-size*.95);ctx.lineTo(size*.15,-size*.42);}
 else{ctx.moveTo(size*1.3,0);ctx.lineTo(-size*.1,size*.48);ctx.lineTo(-size,size*.32);ctx.lineTo(-size*.45,0);ctx.lineTo(-size,-size*.32);ctx.lineTo(-size*.1,-size*.48);}
 ctx.closePath();ctx.fill();ctx.stroke();
 if(id==='mule'){ctx.globalAlpha=.5;ctx.beginPath();ctx.rect(-size*.55,-size*.45,size*.7,size*.9);ctx.stroke();ctx.beginPath();ctx.moveTo(-size*.2,-size*.45);ctx.lineTo(-size*.2,size*.45);ctx.moveTo(size*.05,-size*.4);ctx.lineTo(size*.05,size*.4);ctx.stroke();ctx.globalAlpha=1;}
 if(id==='kestrel'){ctx.globalAlpha=.55;ctx.beginPath();ctx.moveTo(size*.55,0);ctx.lineTo(-size*.2,0);ctx.moveTo(-size*.05,size*.55);ctx.lineTo(size*.2,size*.2);ctx.moveTo(-size*.05,-size*.55);ctx.lineTo(size*.2,-size*.2);ctx.stroke();ctx.globalAlpha=1;}
 if(id==='wren'){ctx.globalAlpha=.55;ctx.beginPath();ctx.moveTo(size*.7,0);ctx.lineTo(-size*.35,0);ctx.stroke();ctx.globalAlpha=1;}
}
function drawPlayerExhaust(id,size,thrust,boost){
 if(thrust<=.04)return;
 const len=(10+Math.random()*(boost?52:18))*thrust,flame=boost?'#9bfff0':'#76efdb';
 ctx.fillStyle=flame;ctx.globalAlpha=.7;
 const nozzles=id==='mule'?[[-size+2,size*.38],[-size+2,-size*.38]]:id==='kestrel'?[[-size+1,size*.28],[-size+1,-size*.28]]:[[-size+3,0]];
 for(const [nx,ny] of nozzles){ctx.beginPath();ctx.moveTo(nx,ny-3.5);ctx.lineTo(nx-len*(id==='wren'?1:0.85),ny);ctx.lineTo(nx,ny+3.5);ctx.fill();}
 if(boost){ctx.globalAlpha=.28;ctx.beginPath();ctx.arc(-size-len*.35,0,8+thrust*10,0,6.28);ctx.fill();}
 ctx.globalAlpha=1;
}
function drawPlayerShip(dt=1/60){
 const p=game.player,hull=SHIPS.find(s=>s.id===game.s.ship)||SHIPS[0],size=hull.size,color=hull.color,thrust=started?p.thrust||0:0,boost=!!p.boost,st=getStats(game.s);
 const turn=(keys.d||keys.arrowright?1:0)-(keys.a||keys.arrowleft?1:0);
 const desiredBank=clamp((touch.aim!=null?Math.sin(touch.aim-p.angle)*1.4:turn)*.38+(boost?0:0),-.45,.45);
 shipBank+=(desiredBank-shipBank)*Math.min(1,dt*8);
 if(thrust>.08){playerTrail.push({x:p.x-Math.cos(p.angle)*(size-2),y:p.y-Math.sin(p.angle)*(size-2),life:.4,color:boost?hull.accent:color});if(playerTrail.length>18)playerTrail.shift();}
 for(const t of playerTrail){t.life-=dt;ctx.globalAlpha=Math.max(0,t.life*1.8);circle(t.x,t.y,boost?2.4:1.7,t.color);}ctx.globalAlpha=1;playerTrail=playerTrail.filter(t=>t.life>0);
 if(game.time-game.lastDamage<.3)circle(p.x,p.y,size+14,'#a4f5ed88',true);
 else if(game.s.shield>0&&game.s.shield<st.shield&&game.time-game.lastDamage>4){ctx.globalAlpha=.14+.05*Math.sin(clock*2);circle(p.x,p.y,size+12,color,true);ctx.globalAlpha=1;}
 ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle);ctx.transform(1,0,Math.tan(shipBank)*.35,1,0,0);
 drawPlayerExhaust(hull.id,size,thrust,boost);
 drawPlayerHull(hull.id,size,color);
 ctx.fillStyle='#d8fff8';ctx.globalAlpha=.85+.15*Math.sin(clock*4);ctx.beginPath();
 if(hull.id==='mule')ctx.ellipse(size*.35,0,5.5,4.2,0,0,6.28);else if(hull.id==='kestrel')ctx.ellipse(size*.55,0,5,3.2,0,0,6.28);else ctx.ellipse(size*.4,0,4.5,3,0,0,6.28);
 ctx.fill();ctx.globalAlpha=1;
 const blink=((clock*2.6)%1)<.5;ctx.fillStyle=blink?'#ff6b6b':'#31414a';ctx.fillRect(-2,size*.48,3.2,3.2);ctx.fillStyle=blink?'#31414a':'#7dffb8';ctx.fillRect(-2,-size*.48-3.2,3.2,3.2);
 if(hull.id==='kestrel'){ctx.fillStyle=hull.accent;ctx.globalAlpha=.7;ctx.fillRect(size*.1,size*.62,7,2);ctx.fillRect(size*.1,-size*.62-2,7,2);ctx.globalAlpha=1;}
 ctx.restore();
 if(boost){ctx.globalAlpha=.2;circle(p.x,p.y,size+28,hull.accent,true);ctx.globalAlpha=1;}
}
function drawTrafficShip(tr){
 const size=tr.size||12,color=tr.color||'#647d94';
 for(const t of tr.trail||[]){ctx.globalAlpha=Math.max(0,t.life*1.6);circle(t.x,t.y,1.6,color);}ctx.globalAlpha=1;
 ctx.save();ctx.translate(tr.x,tr.y);ctx.rotate(tr.angle);
 if(tr.thrust>.05){const len=(8+Math.random()*14)*tr.thrust;ctx.fillStyle='#76efdb';ctx.globalAlpha=.65;ctx.beginPath();ctx.moveTo(-size+2,-4);ctx.lineTo(-size-len,0);ctx.lineTo(-size+2,4);ctx.fill();ctx.globalAlpha=1;}
 ctx.fillStyle='#142833';ctx.strokeStyle=color;ctx.lineWidth=1.6;ctx.beginPath();
 if(tr.hull==='freighter'){ctx.moveTo(size*1.05,0);ctx.lineTo(size*.2,size*.72);ctx.lineTo(-size,size*.78);ctx.lineTo(-size*.7,0);ctx.lineTo(-size,-size*.78);ctx.lineTo(size*.2,-size*.72);}
 else if(tr.hull==='prospector'){ctx.moveTo(size,0);ctx.lineTo(-size*.15,size*.68);ctx.lineTo(-size,size*.4);ctx.lineTo(-size*.55,0);ctx.lineTo(-size,-size*.4);ctx.lineTo(-size*.15,-size*.68);}
 else if(tr.hull==='tender'){ctx.moveTo(size*1.1,0);ctx.lineTo(size*.15,size*.55);ctx.lineTo(-size*.75,size*.68);ctx.lineTo(-size,0);ctx.lineTo(-size*.75,-size*.68);ctx.lineTo(size*.15,-size*.55);}
 else if(tr.hull==='surveyor'){ctx.moveTo(size*1.15,0);ctx.lineTo(-size*.15,size*.62);ctx.lineTo(-size,size*.35);ctx.lineTo(-size*.5,0);ctx.lineTo(-size,-size*.35);ctx.lineTo(-size*.15,-size*.62);}
 else{ctx.moveTo(size*1.35,0);ctx.lineTo(-size*.15,size*.42);ctx.lineTo(-size,size*.28);ctx.lineTo(-size*.45,0);ctx.lineTo(-size,-size*.28);ctx.lineTo(-size*.15,-size*.42);}
 ctx.closePath();ctx.fill();ctx.stroke();
 if(tr.hull==='prospector'){ctx.beginPath();ctx.moveTo(size*.2,size*.28);ctx.lineTo(size*.58,size*.42);ctx.lineTo(size*.48,size*.58);ctx.lineTo(size*.12,size*.48);ctx.closePath();ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(size*.48,size*.5);ctx.lineTo(size*.72,size*.55);ctx.lineTo(size*.48,size*.62);ctx.closePath();ctx.fill();ctx.stroke();}
 if(tr.hull==='tender'){ctx.beginPath();ctx.moveTo(-size*.05,size*.32);ctx.quadraticCurveTo(-size*1.35,0,-size*.05,-size*.32);ctx.stroke();}
 if(tr.hull==='surveyor'){ctx.beginPath();ctx.arc(-size*.05,-size*.95,size*.4,0,6.28);ctx.stroke();ctx.globalAlpha=.35;ctx.fill();ctx.globalAlpha=1;}
 if(tr.hull==='freighter'){ctx.strokeStyle=color;ctx.globalAlpha=.55;ctx.beginPath();ctx.moveTo(-size*.15,-size*.4);ctx.lineTo(-size*.15,size*.4);ctx.moveTo(size*.25,-size*.35);ctx.lineTo(size*.25,size*.35);ctx.stroke();ctx.globalAlpha=1;}
 ctx.fillStyle='#c8f8f2';ctx.fillRect(size*.05,-1.8,4.2,3.6);
 const blink=((clock*3+tr.phase)%1)<.55;ctx.fillStyle=blink?'#ff6b6b':'#2a3840';ctx.fillRect(-2,size*.55,3,3);ctx.fillStyle=blink?'#2a3840':'#6dffb0';ctx.fillRect(-2,-size*.55-3,3,3);
 ctx.restore();
 if(tr.status==='FUEL SCOOPING'){ctx.strokeStyle='#ffc68577';ctx.lineWidth=1.5;ctx.setLineDash([6,10]);ctx.beginPath();ctx.moveTo(game.star.x,game.star.y);ctx.lineTo(tr.x,tr.y);ctx.stroke();ctx.setLineDash([]);}
 if(tr.status==='MINING RUN'){const rock=game.asteroids[0];if(rock){ctx.strokeStyle='#9ad7c988';ctx.lineWidth=1.4;ctx.setLineDash([4,8]);ctx.beginPath();ctx.moveTo(tr.x,tr.y);ctx.lineTo(rock.x+Math.sin(tr.work)*12,rock.y+Math.cos(tr.work)*12);ctx.stroke();ctx.setLineDash([]);}}
 if(tr.status==='PLANETARY SURVEY'){const pulse=20+((tr.work*40)%70);circle(tr.x,tr.y,pulse,'#8fd6c255',true);}
 if(tr.status==='AT JUMP POINT'&&((clock+tr.phase)%2.4)<.35)circle(tr.x,tr.y,18+((clock*30)%20),'#9be7ff44',true);
 const near=dist(game.player,tr)<520||game.target===tr;
 if(tr.status!=='IN TRANSIT'){label(tr.status,tr.x,tr.y-tr.size-16,'#8aa7b4',10);if(near)label(tr.name,tr.x,tr.y-tr.size-30,color,11);}
 else if(near)label(tr.name,tr.x,tr.y-tr.size-16,color,11);
}
function drawPlanet(p){
 const glow=ctx.createRadialGradient(p.x,p.y,p.r*.92,p.x,p.y,p.r*1.12);glow.addColorStop(0,p.color+'66');glow.addColorStop(.6,p.color+'22');glow.addColorStop(1,p.color+'00');circle(p.x,p.y,p.r*1.12,glow);
 if(p.ring){ctx.save();ctx.translate(p.x,p.y);ctx.rotate(-.35);ctx.strokeStyle=p.color+'88';ctx.lineWidth=Math.max(4,p.r*.08);ctx.beginPath();ctx.ellipse(0,0,p.r*1.55,p.r*.38,0,0,6.28);ctx.stroke();ctx.restore();}
 ctx.save();ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,6.28);ctx.clip();const g=ctx.createRadialGradient(p.x-p.r*.48,p.y-p.r*.45,p.r*.1,p.x+p.r*.35,p.y+p.r*.2,p.r*1.2);g.addColorStop(0,p.color);g.addColorStop(.55,p.color);g.addColorStop(1,'#030810');ctx.fillStyle=g;ctx.fillRect(p.x-p.r,p.y-p.r,p.r*2,p.r*2);
 ctx.globalAlpha=.17;ctx.strokeStyle=p.kindId==='ice'?'#e8f4ff':'#d4ece4';ctx.lineWidth=p.r*.12;for(let i=0;i<7;i++){ctx.beginPath();ctx.ellipse(p.x-p.r*.3,p.y+p.r*(i*.3-.8),p.r*.8,p.r*.14,-.45,0,6.28);ctx.stroke();}ctx.globalAlpha=1;const shade=ctx.createLinearGradient(p.x-p.r,p.y-p.r,p.x+p.r,p.y+p.r*.7);shade.addColorStop(0,'#00000000');shade.addColorStop(.55,'#00030b33');shade.addColorStop(1,'#00040cf8');ctx.fillStyle=shade;ctx.fillRect(p.x-p.r,p.y-p.r,p.r*2,p.r*2);ctx.restore();ctx.lineWidth=1;circle(p.x,p.y,p.r,p.color+'66',true);
 label(p.name,p.x,p.y+p.r+34,'#adbec7');if(p.kind)label(p.kind,p.x,p.y+p.r+52,'#718694',11);label(game.s.scanned.includes(p.id)?'SURVEYED':'UNSURVEYED',p.x,p.y+p.r+(p.kind?70:58),game.s.scanned.includes(p.id)?'#83d9c9':'#718694',12);
}
function label(text,x,y,color='#a1bdc8',size=14){ctx.font=`${size}px system-ui`;ctx.textAlign='center';ctx.fillStyle=color;ctx.fillText(text,x,y);}
function drawStation(s=game.station){if(!s||s.type==='beacon')return;const scale=s.r/65;ctx.save();ctx.translate(s.x,s.y);ctx.rotate(clock*.06);ctx.scale(scale,scale);ctx.lineWidth=2;circle(0,0,64,'#527d8c',true);circle(0,0,51,'#29434f',true);for(let i=0;i<6;i++){ctx.save();ctx.rotate(i*Math.PI/3);ctx.fillStyle='#18303e';ctx.strokeStyle='#6a94a3';ctx.fillRect(35,-9,45,18);ctx.strokeRect(35,-9,45,18);ctx.fillStyle='#82d7c2';ctx.fillRect(68,-3,7,6);ctx.restore();}circle(0,0,22,'#132833');circle(0,0,22,'#7db9bd',true);ctx.restore();ctx.setLineDash([9,13]);circle(s.x,s.y,125*scale,'#4c8c8740',true);ctx.setLineDash([]);label(s.name,s.x,s.y-100*scale,'#94c7cd');label(s.roleLabel||'ORBITAL STATION',s.x,s.y-78*scale,'#608592',12);}
function drawStar(p=game.star){const col=p.color||'#e9be82',hot=p.spectral==='M'||p.spectral==='K'?'#f0c8a0':'#f8d9a3',g=ctx.createRadialGradient(p.x,p.y,p.r*.5,p.x,p.y,p.r*2.2);g.addColorStop(0,col+'aa');g.addColorStop(.45,col+'44');g.addColorStop(1,col+'00');circle(p.x,p.y,p.r*2.2,g);circle(p.x,p.y,p.r,col);circle(p.x-p.r*.13,p.y-p.r*.1,p.r*.74,hot);label(p.name+(p.spectralLabel?' · '+p.spectralLabel:''),p.x,p.y+p.r+45,col);if(p.primary!==false&&p.id==='star'){circle(p.x,p.y,p.r+600,'#ecc08533',true);circle(p.x,p.y,p.r+150,'#ff777722',true);label('FUEL SCOOPING ZONE · WATCH HEAT',p.x,p.y+p.r+70,'#987c62',12);}else circle(p.x,p.y,p.r+320,col+'22',true);}
function drawWake(w){
 const pulse=14+((1-w.life/90)*18)+Math.sin(clock*5+w.x)*3;
 ctx.strokeStyle=w.scanned?'#9be7ffaa':'#7aa0c888';ctx.lineWidth=1.6;ctx.setLineDash(w.scanned?[]:[5,7]);
 circle(w.x,w.y,pulse,ctx.strokeStyle,true);circle(w.x,w.y,pulse*.55,'#9be7ff33',true);ctx.setLineDash([]);
 label(w.scanned?('WAKE → '+systemName(SYSTEMS[w.to],game.s)):('WAKE · '+(w.shipName||'unknown')),w.x,w.y-pulse-14,w.scanned?'#9be7ff':'#8aa7b4',11);
}
function drawSkyBackdrop(){
 const sky=systemSky(game.sys);
 ctx.fillStyle=sky.bg;ctx.fillRect(0,0,width,height);
 if(nebula.complete&&nebula.naturalWidth){
  const k=Math.max(width/nebula.width,height/nebula.height);
  ctx.save();
  if(sky.kind==='nebula'||sky.kind==='storm'){ctx.filter=`hue-rotate(${sky.hue}deg) saturate(1.35)`;}
  else if(sky.kind==='ion'){ctx.filter='hue-rotate(140deg) saturate(1.2)';}
  else if(sky.kind==='dust'){ctx.filter='hue-rotate(-25deg) saturate(1.15) brightness(1.05)';}
  else if(sky.kind==='deep'){ctx.filter='saturate(.7) brightness(.85)';}
  ctx.globalAlpha=sky.nebulaAlpha;ctx.drawImage(nebula,(width-nebula.width*k)/2,(height-nebula.height*k)/2,nebula.width*k,nebula.height*k);
  ctx.restore();ctx.globalAlpha=1;
 }
 if(sky.kind==='nebula'||sky.kind==='storm'||sky.kind==='ion'){
  const g=ctx.createRadialGradient(width*.7,height*.3,20,width*.55,height*.45,Math.max(width,height)*.7);
  g.addColorStop(0,sky.tint+'55');g.addColorStop(.45,sky.tint+'18');g.addColorStop(1,sky.tint+'00');
  ctx.fillStyle=g;ctx.fillRect(0,0,width,height);
 }
 for(const s of stars){const x=((s.x*width-cam.x*s.depth)%width+width)%width,y=((s.y*height-cam.y*s.depth)%height+height)%height;ctx.globalAlpha=s.a*(sky.kind==='deep'?.7:1);ctx.fillStyle=sky.star;ctx.fillRect(x,y,s.r*(sky.kind==='storm'?1.15:1),s.r);}ctx.globalAlpha=1;
 if(sky.lightning&&((clock*1.7)%3.4)<.08){
  ctx.strokeStyle='#d7e8ffcc';ctx.lineWidth=1.4;ctx.globalAlpha=.85;ctx.beginPath();
  let lx=width*(.2+((Math.floor(clock*3)%7)*.1)),ly=0;
  ctx.moveTo(lx,ly);
  for(let i=0;i<5;i++){lx+=(Math.random()-.5)*90;ly+=height*.12+Math.random()*40;ctx.lineTo(lx,ly);}
  ctx.stroke();ctx.globalAlpha=.35;ctx.lineWidth=4;ctx.stroke();ctx.globalAlpha=1;
 }
}
function drawEdgeArrow(wx,wy,color,{scale=1,alpha=1}={}){
 const sx=(wx-cam.x)*cam.zoom+width/2,sy=(wy-cam.y)*cam.zoom+height/2,margin=width<650?65:105;
 if(!(sx<margin||sx>width-margin||sy<165||sy>height-170))return;
 const dx=sx-width/2,dy=sy-height/2,a=Math.atan2(dy,dx),rx=width/2-margin,ry=height/2-165;
 if(ry<=20)return;
 const k=Math.min(rx/Math.max(.01,Math.abs(dx)),ry/Math.max(.01,Math.abs(dy))),x=width/2+dx*k,y=height/2+dy*k;
 ctx.save();ctx.globalAlpha=alpha;ctx.translate(x,y);ctx.rotate(a);ctx.scale(scale,scale);ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(8,0);ctx.lineTo(-5,-5);ctx.lineTo(-5,5);ctx.closePath();ctx.fill();ctx.restore();
}
function render(dt=1/60){
 ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle='#060c16';ctx.fillRect(0,0,width,height);
 if(game.surface){renderSurface(ctx,width,height,game.surface,clock,getStats(game.s));return;}
 if(game.onfoot&&game.s.docked){renderOnFoot(ctx,width,height,game.onfoot,clock);return;}
 cam.zoom=started?(width<650?.54:height<520?.55:.75):.26;let desiredX=started?game.player.x:400,desiredY=started?game.player.y:50;cam.x+=(desiredX-cam.x)*.09;cam.y+=(desiredY-cam.y)*.09;
 drawSkyBackdrop();
 ctx.save();ctx.translate(width/2,height/2);ctx.scale(cam.zoom,cam.zoom);ctx.translate(-cam.x,-cam.y);
 const orbitColor='#2c52652b';ctx.lineWidth=1;ctx.setLineDash([2,14]);for(const star of (game.stars||[game.star]))for(const p of game.visiblePlanets)circle(star.x,star.y,dist(p,star),orbitColor,true);ctx.setLineDash([]);
 for(const p of game.visiblePlanets)drawPlanet(p);if(game.sys.hasStation)for(const s of (game.stations||[game.station]).filter(s=>s.type==='station'))drawStation(s);for(const star of (game.stars||[game.star]))drawStar(star);for(const p of game.patrols){drawSecurityShip(p);label(p.status==='ENGAGING'?'SECURITY ENGAGING':p.status==='SEARCHING'?'SECURITY SEARCHING':p.status==='RESPONDING'?'SECURITY RESPONDING':p.name,p.x,p.y-38,'#9eb7bd',12);}
 if(game.heatWanted>0&&game.lastKnown){const lk=game.lastKnown;circle(lk.x,lk.y,28,'#df8e8344',true);circle(lk.x,lk.y,6,'#df8e8388');label('LAST CONTACT',lk.x,lk.y-36,'#df8e83',11);}
 for(const a of game.asteroids){ctx.save();ctx.translate(a.x,a.y);ctx.rotate(a.rotation+clock*.025);ctx.fillStyle=a.ore==='crystal'?'#1e3f42':'#34343b';ctx.strokeStyle=a.ore==='crystal'?'#75b9b0':'#7b7874';ctx.lineWidth=1;ctx.beginPath();for(let i=0;i<9;i++){const ang=i/9*6.28,r=a.shape[i]*a.r;if(i===0)ctx.moveTo(Math.cos(ang)*r,Math.sin(ang)*r);else ctx.lineTo(Math.cos(ang)*r,Math.sin(ang)*r);}ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();}
 for(const b of (game.belts||(game.belt?[game.belt]:[])))label(b.name.toUpperCase(),b.x,b.y-Math.max(180,b.r+40),'#829496',13);
 for(const w of game.wakes)drawWake(w);
 for(const s of game.signals){const pulse=18+Math.sin(clock*3+(s.x||0)*.01)*6;circle(s.x,s.y,pulse,s.kind==='distress'?'#efa77855':'#8fd6c255',true);circle(s.x,s.y,8,s.kind==='distress'?'#efa778':'#8fd6c2');label(s.discovered||dist(game.player,s)<900?(s.name||'SIGNAL'):'CONTACT',s.x,s.y-34,s.kind==='distress'?'#efa778':'#8fd6c2',11);}
 for(const d of game.derelicts){ctx.save();ctx.translate(d.x,d.y);ctx.rotate(d.angle||0);ctx.fillStyle='#2a3038';ctx.strokeStyle='#8a939c';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(22,0);ctx.lineTo(6,12);ctx.lineTo(-18,10);ctx.lineTo(-22,0);ctx.lineTo(-16,-11);ctx.lineTo(8,-12);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();label(d.scanned?'DERELICT · SCANNED':'DERELICT',d.x,d.y-36,'#a8b4be',11);}
 for(const tr of game.traffic)drawTrafficShip(tr);
 for(const e of game.enemies){if(e.faction&&String(e.id||'').startsWith('patrol-'))drawSecurityShip(e,true);else if(e.response)drawSecurityShip(e,true);else drawShip(e.x,e.y,e.angle,'#ee918b',20,true,e.thrust||0);label(e.response?(e.status==='ENGAGING'?'RESPONSE ENGAGING':e.status==='SEARCHING'?'RESPONSE SEARCHING':'RESPONSE TEAM'):e.faction?FACTIONS.find(f=>f.id===e.faction).name:'WANTED',e.x,e.y-38,'#df8e83',12);ctx.fillStyle='#533436';ctx.fillRect(e.x-24,e.y+34,48,3);ctx.fillStyle='#ee978b';ctx.fillRect(e.x-24,e.y+34,48*e.hp/e.max,3);}
 for(const b of game.shots){ctx.strokeStyle=b.enemy?'#ff8b7b':'#a4fff0';ctx.shadowBlur=9;ctx.shadowColor=ctx.strokeStyle;ctx.lineWidth=b.enemy?3:3.5;ctx.beginPath();ctx.moveTo(b.x,b.y);ctx.lineTo(b.x-b.vx*.025,b.y-b.vy*.025);ctx.stroke();}ctx.shadowBlur=0;
 for(const p of game.particles){ctx.globalAlpha=Math.min(1,p.life*2);circle(p.x,p.y,2.2,p.color);}ctx.globalAlpha=1;
 if(game.discoveryScan){const p=game.player;circle(p.x,p.y,100+game.discoveryScan.progress/4*4500,'#8df6df88',true);}
 if(game.scooping){ctx.strokeStyle='#ffc68599';ctx.lineWidth=2;ctx.setLineDash([10,15]);ctx.beginPath();ctx.moveTo(game.star.x,game.star.y);ctx.lineTo(game.player.x,game.player.y);ctx.stroke();ctx.setLineDash([]);}
 if(game.scan){const p=game.planets.find(p=>p.id===game.scan.id);ctx.setLineDash([7,8]);ctx.strokeStyle='#97f7df99';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(game.player.x,game.player.y);ctx.lineTo(p.x,p.y);ctx.stroke();ctx.setLineDash([]);circle(p.x,p.y,p.r+25+Math.sin(clock*4)*10,'#7df3d88c',true);}
 if(!game.s.docked)drawPlayerShip(dt);
 const t=game.target;if(t){const r=t.type==='planet'?t.r+19:t.type==='belt'?85:t.type==='wake'?t.r+10:t.r+16;ctx.strokeStyle='#e5b67a';ctx.lineWidth=1.5/cam.zoom;for(let i=0;i<4;i++){const a=i*Math.PI/2+clock*.03;ctx.beginPath();ctx.arc(t.x,t.y,r,a+.15,a+.5);ctx.stroke();}}
 ctx.restore();
 if(started&&!panel&&!game.s.docked){
  if(t)drawEdgeArrow(t.x,t.y,'#e6b67c');
  for(const b of eventArrowTargets(game)){
   if(t&&Math.hypot(b.x-t.x,b.y-t.y)<40)continue;
   drawEdgeArrow(b.x,b.y,b.color,{scale:.78,alpha:.82});
  }
 }
 if(game.jump){const progress=game.jump.progress/3;ctx.globalAlpha=progress*.8;ctx.strokeStyle='#91eadd';ctx.lineWidth=1;for(let i=0;i<75;i++){const a=i*2.39996,r=30+(i*71+clock*800)%Math.max(width,height);ctx.beginPath();ctx.moveTo(width/2+Math.cos(a)*r,height/2+Math.sin(a)*r);ctx.lineTo(width/2+Math.cos(a)*r*(1.1+progress*.7),height/2+Math.sin(a)*r*(1.1+progress*.7));ctx.stroke();}ctx.globalAlpha=1;}
 drawRadar();
}
function drawRadar(){const c=$('radar');if(!c)return;const r=c.getContext('2d');r.clearRect(0,0,268,268);r.fillStyle='#0b1c2577';r.strokeStyle='#44697388';r.lineWidth=1.5;r.beginPath();r.arc(134,134,123,0,6.28);r.fill();r.stroke();r.beginPath();r.arc(134,134,64,0,6.28);r.strokeStyle='#38525e99';r.stroke();r.beginPath();r.moveTo(12,134);r.lineTo(256,134);r.moveTo(134,12);r.lineTo(134,256);r.stroke();r.save();r.beginPath();r.arc(134,134,121,0,6.28);r.clip();const p=game.player;const docks=(game.stations||[]).filter(s=>s.type==='station');for(const o of [...docks,...(game.stars||[game.star]),...game.wakes,...game.signals,...game.derelicts,...game.patrols,...game.traffic,...game.visiblePlanets,...game.asteroids,...game.enemies]){const x=134+(o.x-p.x)*.054,y=134+(o.y-p.y)*.054;r.fillStyle=o.type==='enemy'?'#ee8d87':o.type==='wake'?'#9be7ff':o.type==='signal'?'#efa778':o.type==='derelict'?'#a8b4be':o.type==='planet'?'#85b8cf':o.type==='asteroid'?'#797b76':o.type==='traffic'?'#8aa3b5':o.type==='star'?'#e8c18a':'#91efd9';r.fillRect(x-2,y-2,o.type==='station'||o.type==='star'?7:4,o.type==='station'||o.type==='star'?7:4);}r.restore();r.save();r.translate(134,134);r.rotate(p.angle);r.fillStyle='#a7f0df';r.beginPath();r.moveTo(9,0);r.lineTo(-5,5);r.lineTo(-5,-5);r.closePath();r.fill();r.restore();}
let last=performance.now(),lastFireSound=0;
function loop(now){const dt=Math.min(.05,(now-last)/1000);last=now;if(!document.hidden){clock+=dt;if(started&&!simPaused()){const wasDocked=game.s.docked;const canWalk=!panel;const input={aim:canWalk?touch.aim:null,thrust:canWalk?Math.max(touch.thrust,keys.w||keys.arrowup?1:0):0,turn:canWalk?(keys.d||keys.arrowright?1:0)-(keys.a||keys.arrowleft?1:0):0,fire:!panel&&(touch.fire||keys[' ']),boost:canWalk&&(touch.boost||keys.shift),brake:canWalk&&(keys.s||keys.arrowdown)};game.update(dt,input);if(input.fire&&!game.surface&&!game.onfoot&&!game.s.docked&&now-lastFireSound>240){sound('fire');lastFireSound=now;}if(!wasDocked&&game.s.docked){try{engine.unlock();}catch{}}else if(wasDocked&&!game.s.docked)closePanel();}render(dt);const onDeck=!!(game.onfoot&&game.s.docked);const p=game.surface||game.onfoot||game.player;const ambience=Number.isFinite(game.s.engineVolume)?game.s.engineVolume:.35;engine.update({moving:Math.min(1,Math.hypot(p.vx||0,p.vy||0)/(game.surface?140:onDeck?280:getStats(game.s).speed)),boost:game.boost||touch.boost,volume:ambience,enabled:game.s.sound,paused:!started||(simPaused()&&!onDeck),surface:!!game.surface,station:onDeck});if(now-lastHUD>120){updateHUD();drainEvents();lastHUD=now;}if(started&&now-lastStore>4000){save();lastStore=now;}}else{engine.muteAll();}requestAnimationFrame(loop);}
if(!ctx){document.body.innerHTML='<div class="canvas-fallback">Farbound needs an Android browser with Canvas support. Please open it in an updated Chrome browser.</div>';}else{buildHUD();showWelcome();resize();requestAnimationFrame(loop);}
if('serviceWorker'in navigator&&location.protocol==='https:'&&location.hostname!=='appassets.androidplatform.net'){
 const checkOffline=async()=>{const reg=await navigator.serviceWorker.ready,worker=reg.active;if(worker){const ch=new MessageChannel();ch.port1.onmessage=e=>{offlineReady=e.data?.ready===true;if(panel==='menu')renderPanel();};worker.postMessage({type:'CACHE_STATUS'},[ch.port2]);}};
 navigator.serviceWorker.addEventListener('controllerchange',()=>{checkOffline().catch(()=>{});if(started)game.notify('Game files updated. Save and reopen to load the latest release.');});
 navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'}).then(reg=>{reg.update().catch(()=>{});return checkOffline();}).catch(()=>{});
}

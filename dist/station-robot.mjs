/** Station service robot — configurable name + witty dialogue pools. Rename via STATION_ROBOT.displayName. */
import {getStats,rng} from './core.mjs';

const ROBOT_NAMES=['Nellby-9','Vesper-4','Quill-7','Hearth-2','Lodestone-5','Marrow-8','Picket-3','Sable-6','Auger-1','Wick-12'];
const FACTION_LINES={
 concord:['Concord space. Relief crates and lectures, in that order.','neutral'],
 directorate:['Directorate docks run hot. They like hulls that work and mouths that do not.','annoyed'],
 freeholds:['Freehold stations keep their own books. Watch your manners and your hold.','happy']
};

/** Single rename point for Jill / later station overrides. Solace stays Nellby-9. */
export const STATION_ROBOT={
 id:'nellby-9',
 displayName:'Nellby-9',
 roleLabel:'Station Service Unit',
 nameFor(sys){
  if(!sys||sys.id===0)return this.displayName;
  const r=rng((sys.id*911+19)|0);
  return ROBOT_NAMES[Math.floor(r()*ROBOT_NAMES.length)];
 }
};

/** @typedef {'neutral'|'happy'|'confused'|'annoyed'|'alert'} RobotExpression */

/** Tagged line pools. Each entry: [text, expression]. Expand freely. */
export const ROBOT_LINES={
 greeting:[
  ['Welcome. Market is the arm with Refuel and Repair at the top of the counter. Start there.','happy'],
  ['Docking complete. Catastrophe has been postponed. Market still sells fuel.','happy'],
  ['Another ship safely docked. My faith in pilots has risen marginally.','neutral'],
  ['Welcome aboard. Try not to scratch the paint. It’s older than both of us.','happy'],
  ['Docking successful. Exploding afterward is still discouraged. Walk to Market if you are leaking.','annoyed']
 ],
 general:[
  ['I am required to appear helpful. Fortunately, I am excellent at it.','happy'],
  ['Station traffic is calm. That usually means something unfortunate is scheduled.','confused'],
  ['You look functional enough. That’s practically a compliment.','neutral'],
  ['Always a pleasure. Or at least rarely a problem.','happy'],
  ['My personality module is operating within acceptable levels of charm.','happy'],
  ['Local services are online. So am I, regrettably.','neutral'],
  ['If you need directions: forward is usually the dangerous part.','confused']
 ],
 damaged:[
  ['Your ship appears damaged. I admire your commitment to questionable decisions.','annoyed'],
  ['Hull integrity is lower than recommended. By recommended, I mean “not terrible.”','confused'],
  ['Repair is available. Continuing without it is a choice, not a strategy.','alert'],
  ['That hull looks… interpretive. The workshop is still open.','annoyed']
 ],
 wanted:[
  ['Security seems interested in you. I’m sure it’s for something charming.','alert'],
  ['If you are wanted by station security, please stand very still so they can find you faster.','annoyed'],
  ['Your legal situation appears… dynamic.','confused'],
  ['Bounty notices print themselves. Efficient, if embarrassing.','alert']
 ],
 mining:[
  ['Miners keep the station running. Traders keep the miners arguing.','neutral'],
  ['Ore aboard. The universe’s least glamorous treasure, and somehow always welcome.','happy'],
  ['Prospecting is 90% rocks and 10% pretending rocks are exciting.','confused']
 ],
 trade:[
  ['Freighters move civilization. Pirates move freighters faster.','neutral'],
  ['Cargo manifests never lie. Pilots sometimes do. I prefer the manifests.','annoyed'],
  ['Markets fluctuate. My sarcasm is a fixed rate.','happy']
 ],
 explore:[
  ['Anomaly hunters are either very brave or very unemployed.','confused'],
  ['If you discover something ancient and terrifying, please report it before touching it.','alert'],
  ['Exploration data pending. Cartographics will be delighted. Or at least paid.','happy'],
  ['Uncharted space loves visitors. It does not always return them.','alert']
 ],
 repeat:[
  ['You again. Delightful. Probably.','annoyed'],
  ['I would roll my eyes if my designer had given me any.','annoyed'],
  ['Back so soon? I missed you in a professionally limited way.','happy'],
  ['Familiar face. Familiar ship. Novel opportunity for fresh mistakes.','confused']
 ],
 friendly:[
  ['Always a pleasure. Or at least rarely a problem.','happy'],
  ['My personality module is operating within acceptable levels of charm.','happy'],
  ['Dock services standing by. Try not to make that exciting.','neutral']
 ],
 danger:[
  ['Local security rating: concerning. Pack optimism accordingly.','alert'],
  ['This system grades poorly on “not getting shot.” Plan your afternoon.','annoyed']
 ],
 tips:[
  ['Slow below 100 m/s before scanning a world or scooping fuel. Fast pilots miss the interesting parts.','happy'],
  ['Discovery Pulse catalogs a system. Approach a world and Scan for the detailed survey payout.','happy'],
  ['Buy where goods are produced, sell where demand is high. The Galaxy chart and Market traffic board show economies.','neutral'],
  ['Stars refill fuel for free. Closer means faster scooping and more heat — move away before you cook.','alert'],
  ['Station services keep local space running. Closing the desk returns you to the deck. Launch from the hangar.','confused'],
  ['Assaulting civilians adds bounty and summons security. Prison barges are not always in-system.','annoyed'],
  ['Hyperspace wakes can be scanned and followed. Jump after the contact — they drop in at the destination.','happy'],
  ['Cartographics sells exploration data in one package. Recovery and destruction discard unsold entries.','neutral'],
  ['Prospect a rock before you mine it. SCAN at close range; prospected seams yield extra tons.','confused'],
  ['Plot routes from the Galaxy chart, then Jump next. Fuel is spent on jumps, not local flight.','happy'],
  ['Guild commissions need acceptance before progress counts. Claim unique modules at any station desk.','neutral'],
  ['If heat hits 100%, your hull pays the bill. Scooping at 95% retracts itself. Listen to the thermometer.','alert'],
 ['Market Refuel and Repair are the first two buttons. I mention this because pilots keep asking.','annoyed'],
  ['Tap a commodity on the Market to plot a sale. The Galaxy chart colors faction space.','happy']
 ],
 faction:Object.values(FACTION_LINES)
};

const TRADE_GOODS=['food','tech','meds','crystal'];

export function buildRobotContext(game){
 const s=game.s,st=getStats(s),sys=game.sys||{};
 const hullRatio=s.hull/Math.max(1,st.hull);
 const tags=[];
 if(s.bounty>0||(game.heatWanted||0)>15)tags.push('wanted');
 if(hullRatio<.85)tags.push('damaged');
 if((s.cargo?.ore||0)>0)tags.push('mining');
 if(TRADE_GOODS.some(g=>(s.cargo?.[g]||0)>0))tags.push('trade');
 if(sys.uncharted||s.data>0||(s.records||[]).length||(s.explorationLog||[]).some(e=>!e.sold))tags.push('explore');
 if(s.robotMet)tags.push('repeat');
 else tags.push('friendly');
 if((sys.danger||0)>=2)tags.push('danger');
 if(sys.faction)tags.push('faction');
 return{tags,first:!s.robotMet,wanted:tags.includes('wanted'),damaged:tags.includes('damaged'),hullRatio,faction:sys.faction||null,danger:sys.danger||0};
}

function poolFor(tag){
 const list=ROBOT_LINES[tag];
 return Array.isArray(list)&&list.length?list:null;
}

function pickFrom(entries,avoidText){
 const choices=avoidText?entries.filter(([t])=>t!==avoidText):entries;
 const pool=choices.length?choices:entries;
 const [text,expression]=pool[Math.floor(Math.random()*pool.length)];
 return{text,expression:expression||'neutral'};
}

/**
 * @param {object} game
 * @param {'greeting'|'talk'|'tip'} mode
 * @returns {{text:string,expression:RobotExpression,tag:string}}
 */
export function pickRobotLine(game,mode='talk'){
 const ctx=buildRobotContext(game);
 const avoid=game.robotState?.lastText||'';
 if(mode==='greeting'){
  if(!game.s.robotMet){
   const st=getStats(game.s);
   const leak=game.s.fuel<st.fuel*.92||game.s.hull<st.hull*.95;
   const text=leak
    ?`Welcome to ${game.sys?.station||'the station'}. You are leaking fuel or hull. Market is the Refuel / Repair arm — first two buttons on the counter.`
    :`Welcome to ${game.sys?.station||'the station'}. Walk to Market for fuel and repairs — first two buttons — then Contracts if you want work.`;
   return{text,expression:'happy',tag:'greeting'};
  }
  const greet=poolFor('greeting')||ROBOT_LINES.general;
  const line=pickFrom(greet,avoid);
  return{...line,tag:'greeting'};
 }
 if(mode==='tip'){
  const tips=poolFor('tips')||ROBOT_LINES.general;
  const line=pickFrom(tips,avoid);
  return{...line,tag:'tips'};
 }
 const situational=['wanted','damaged','explore','mining','trade','danger'].filter(t=>ctx.tags.includes(t)&&poolFor(t));
 if(ctx.faction&&FACTION_LINES[ctx.faction])situational.push('faction');
 const ambient=['repeat','friendly','general'].filter(t=>(t==='general'||ctx.tags.includes(t))&&poolFor(t));
 // Prefer situational context when present; occasionally fall back to ambient for variety
 const useSituational=situational.length&&Math.random()<0.78;
 const candidates=useSituational?situational:ambient.length?ambient:['general'];
 const tag=candidates[Math.floor(Math.random()*candidates.length)];
 if(tag==='faction'&&FACTION_LINES[ctx.faction]){
  const [text,expression]=FACTION_LINES[ctx.faction];
  return{text,expression,tag:'faction'};
 }
 const line=pickFrom(poolFor(tag)||ROBOT_LINES.general,avoid);
 return{...line,tag};
}

/** Apply a spoken line to runtime + optional first-meet flag. */
export function speakRobot(game,mode='talk'){
 const line=pickRobotLine(game,mode);
 game.robotState={lastText:line.text,expression:line.expression,tag:line.tag,at:game.time||0};
 if(!game.s.robotMet)game.s.robotMet=true;
 return line;
}

export function ensureRobotState(game){
 if(!game.robotState)game.robotState={lastText:'',expression:'neutral',tag:'general',at:0};
 game.s.robotMet=!!game.s.robotMet;
 return game.robotState;
}

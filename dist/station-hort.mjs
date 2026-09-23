/** Solace messenger easter egg — in-universe nickname Hort only. */
export const HORT_SYSTEM_ID=105;
export const HORT_SYSTEM_NAME='Hortreach';
export const HORT_SYSTEM_NICK="Hort's Pasture";

export const STATION_HORT={
 id:'hort',
 displayName:'Hort',
 roleLabel:'Station messenger',
 deskLabel:'Messenger desk'
};

const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/** Tagged line pools. Each entry: [text, expression]. */
export const HORT_LINES={
 greeting:[
  ['Hort. I punch packets, not passengers. You still have both boots — good start.','happy'],
  ['Messenger desk. If it is going farther than the core, it comes through me.','neutral'],
  ['Pull up a stool. The queue can wait one rumor.','happy']
 ],
 general:[
  ['Most pilots talk cargo. I talk horses when nobody is listening.','happy'],
  ['If I ever cash out, I am buying a paddock. Until then I ride the packet queue.','happy'],
  ['Hoofprints in dust look a lot like landing struts if you squint.','confused'],
  ['Nellby-9 can keep the lectures. I will keep the rumors.','annoyed'],
  ['Saddle up — metaphorically. The Wren does not come with stirrups.','happy'],
  ['Do not fold hungry. That is how you end up naming systems after snacks.','confused']
 ],
 pasture:[
  ['There is a quiet fold in the Reach the scouts filed as Hortreach. I call it Hort\'s Pasture.','happy'],
  ['UR-042 sits empty and agricultural. No dock. Pretty if you like grass made of stars.','neutral'],
  ['Search the chart for Hortreach — or Pasture, if you like my name for it. Uncharted until you visit.','happy'],
  ['Hort\'s Pasture is just a nickname the packet riders use. Official charts still say Hortreach.','neutral']
 ],
 tips:[
  ['Galaxy chart: type Hort or UR-042. The true name hides until you fold in.','happy'],
  ['Slow below 100 before you scan. Fast pilots miss the pasture.','neutral'],
  ['Packets first, then Market if you are leaking. I do not sell fuel.','annoyed']
 ]
};

export function hortFaceHtml(){
 return `<div class="hort-card" aria-hidden="true"><img class="hort-portrait-photo" src="./hort-portrait.png" alt="" width="444" height="333"></div>`;
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
 */
export function pickHortLine(game,mode='talk'){
 const avoid=game.hortState?.lastText||'';
 if(mode==='greeting'){
  const line=pickFrom(HORT_LINES.greeting,avoid);
  return{...line,tag:'greeting'};
 }
 if(mode==='tip'){
  const line=pickFrom(HORT_LINES.tips,avoid);
  return{...line,tag:'tips'};
 }
 const tags=['pasture','general'];
 const tag=tags[Math.floor(Math.random()*tags.length)];
 const line=pickFrom(HORT_LINES[tag],avoid);
 return{...line,tag};
}

export function speakHort(game,mode='talk'){
 const line=pickHortLine(game,mode);
 game.hortState={lastText:line.text,expression:line.expression,tag:line.tag,at:game.time||0};
 return line;
}

export function ensureHortState(game){
 if(!game.hortState)game.hortState={lastText:'',expression:'neutral',tag:'general',at:0};
 return game.hortState;
}

export function hortStripHtml(quote,options={}){
 const name=STATION_HORT.displayName;
 const role=STATION_HORT.roleLabel;
 const text=quote||'Packets are moving. Tap Talk if you want a rumor.';
 const actions=options.actions!==false;
 return `<aside class="robot-strip hort-strip" aria-label="${esc(name)} station messenger">
  <div class="robot-strip-face hort-strip-face">${hortFaceHtml()}</div>
  <div class="robot-strip-copy">
   <div class="robot-strip-head"><div class="eyebrow">${esc(role)}</div><strong>${esc(name)}</strong></div>
   <blockquote class="robot-quote"><p>${esc(text)}</p></blockquote>
   ${actions?`<div class="section-actions robot-actions"><button class="primary" data-action="hort-talk">Talk</button><button data-action="hort-tip">Ask about the Reach</button></div>`:''}
  </div>
 </aside>`;
}

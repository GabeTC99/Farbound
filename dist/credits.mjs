/** Player-facing credits. Real names stay on this screen — not on the galaxy chart. */
export const CREDITS_STUDIO='Voidwake Studios';
export const CREDITS=[
 {name:'Gabriel Trindade-Coffland',role:'Founder / Creative Director'},
 {name:'Gillian Trindade-Coffland',role:'Assistant Producer'},
 {name:'Oryanna Nelson',role:'Special Appearance (Hort)'}
];

const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function creditsView(){
 return `<p class="intro">${esc(CREDITS_STUDIO)} presents Nullharbor.</p>
<div class="credits-roll">${CREDITS.map(c=>`<div class="setting-row"><div><h3>${esc(c.name)}</h3><p>${esc(c.role)}</p></div></div>`).join('')}</div>
<p class="detail-text" style="margin-top:18px">Hort is an in-universe Solace messenger. Chart names stay in-universe.</p>`;
}

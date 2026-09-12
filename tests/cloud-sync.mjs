import assert from 'node:assert/strict';
import {cloudConfigured,CLOUD} from '../dist/cloud-config.mjs';
import {
 comparePilotFreshness,cloudAutosyncEnabled,setCloudAutosync,AUTOSYNC_KEY,SESSION_KEY,AUTH_REDIRECT,
 consumeAuthRedirect,requestCloudSignIn,verifyCloudOtp,uploadCloudPilot,downloadCloudPilot,
 fetchCloudPilotMeta,cloudSignOut,cloudUserEmail
} from '../dist/cloud-sync.mjs';
import {newSave} from '../dist/frontier.mjs';

const liveUrl=CLOUD.url,liveKey=CLOUD.anonKey;
const mem=new Map();
globalThis.localStorage={
 getItem:k=>mem.has(k)?mem.get(k):null,
 setItem:(k,v)=>mem.set(k,String(v)),
 removeItem:k=>mem.delete(k)
};
globalThis.sessionStorage={
 getItem:k=>mem.has('ss:'+k)?mem.get('ss:'+k):null,
 setItem:(k,v)=>mem.set('ss:'+k,String(v)),
 removeItem:k=>mem.delete('ss:'+k)
};
globalThis.window={location:{pathname:'/Farbound/',search:'',hash:'',origin:'https://gabetc99.github.io',href:'https://gabetc99.github.io/Farbound/'}};
globalThis.location=window.location;
globalThis.history={replaceState(a,b,url){if(typeof url==='string'){const u=new URL(url,'https://gabetc99.github.io');location.pathname=u.pathname;location.search=u.search;location.hash=u.hash;location.href=u.href;}}};
function restoreCloud(){CLOUD.url=liveUrl;CLOUD.anonKey=liveKey;}

let count=0;function test(name,fn){fn();count++;console.log('PASS '+name);}
async function atest(name,fn){await fn();count++;console.log('PASS '+name);}

test('cloudConfigured reflects whether url and anon key are present',()=>{
 CLOUD.url='';CLOUD.anonKey='';
 assert.equal(cloudConfigured(),false);
 CLOUD.url='https://example.supabase.co';CLOUD.anonKey='anon-key-for-tests-0123456789abcdef';
 assert.equal(cloudConfigured(),true);
 restoreCloud();
 assert.equal(cloudConfigured(),!!(liveUrl&&liveKey));
});

test('Auth redirect always targets the Farbound Pages path',()=>{
 assert.equal(AUTH_REDIRECT,'https://gabetc99.github.io/Farbound/');
 assert.match(AUTH_REDIRECT,/\/Farbound\/$/);
});

test('Autosync flag persists in localStorage',()=>{
 mem.clear();
 assert.equal(cloudAutosyncEnabled(),false);
 setCloudAutosync(true);
 assert.equal(mem.get(AUTOSYNC_KEY),'1');
 assert.equal(cloudAutosyncEnabled(),true);
 setCloudAutosync(false);
 assert.equal(cloudAutosyncEnabled(),false);
});

test('Freshness prefers savedAt vs cloud updated_at',()=>{
 const remote={updated_at:'2026-09-11T12:00:00.000Z',playtime:100};
 assert.equal(comparePilotFreshness({savedAt:Date.parse('2026-09-11T13:00:00.000Z')},remote).localNewer,true);
 assert.equal(comparePilotFreshness({savedAt:Date.parse('2026-09-11T11:00:00.000Z')},remote).remoteNewer,true);
 assert.equal(comparePilotFreshness({savedAt:Date.parse('2026-09-11T12:00:00.500Z')},remote).same,true);
 assert.equal(comparePilotFreshness({playtime:50},{playtime:80}).remoteNewer,true);
});

await atest('Sign-in request uses PKCE and the Pages redirect URL',async()=>{
 mem.clear();
 const calls=[];
 CLOUD.url='https://example.supabase.co';
 CLOUD.anonKey='anon-key-for-tests-0123456789abcdef';
 globalThis.fetch=async(url,opts={})=>{
  calls.push({url:String(url),method:opts.method||'GET',body:opts.body?JSON.parse(opts.body):null});
  if(String(url).includes('/auth/v1/otp'))return {ok:true,json:async()=>({})};
  return {ok:false,json:async()=>({msg:'unexpected '+url})};
 };
 await requestCloudSignIn('Pilot@Example.com');
 const otp=calls.find(c=>c.url.includes('/auth/v1/otp'));
 assert.ok(otp);
 assert.equal(otp.body.email,'pilot@example.com');
 assert.equal(otp.body.options.email_redirect_to,AUTH_REDIRECT);
 assert.ok(otp.body.code_challenge);
 assert.equal(otp.body.code_challenge_method,'s256');
 assert.ok(sessionStorage.getItem('farbound-cloud-pkce'));
 restoreCloud();
});

await atest('PKCE redirect code is exchanged for a session',async()=>{
 mem.clear();
 CLOUD.url='https://example.supabase.co';
 CLOUD.anonKey='anon-key-for-tests-0123456789abcdef';
 sessionStorage.setItem('farbound-cloud-pkce','test-verifier');
 location.search='?code=auth-code-1';
 location.href='https://gabetc99.github.io/Farbound/?code=auth-code-1';
 const calls=[];
 globalThis.fetch=async(url,opts={})=>{
  calls.push({url:String(url),method:opts.method||'GET',body:opts.body?JSON.parse(opts.body):null});
  if(String(url).includes('/auth/v1/token'))return {ok:true,json:async()=>({access_token:'a1',refresh_token:'r1',expires_in:3600,user:{id:'user-1',email:'pilot@example.com'}})};
  if(String(url).includes('/auth/v1/user'))return {ok:true,json:async()=>({id:'user-1',email:'pilot@example.com'})};
  return {ok:false,json:async()=>({msg:'unexpected '+url})};
 };
 const session=await consumeAuthRedirect(location);
 assert.equal(session.access_token,'a1');
 assert.equal(cloudUserEmail(),'pilot@example.com');
 assert.ok(calls.some(c=>c.url.includes('grant_type=pkce')&&c.body.code_verifier==='test-verifier'));
 restoreCloud();
});

await atest('OTP verify / upload / download shapes still work',async()=>{
 mem.clear();
 const calls=[];
 const pilot=newSave();
 pilot.credits=1234;pilot.playtime=42;pilot.system=0;pilot.ship='wren';
 CLOUD.url='https://example.supabase.co';
 CLOUD.anonKey='anon-key-for-tests-0123456789abcdef';
 globalThis.fetch=async(url,opts={})=>{
  calls.push({url:String(url),method:opts.method||'GET',body:opts.body?JSON.parse(opts.body):null});
  if(String(url).includes('/auth/v1/verify'))return {ok:true,json:async()=>({access_token:'a1',refresh_token:'r1',expires_in:3600,user:{id:'user-1',email:'pilot@example.com'}})};
  if(String(url).includes('/auth/v1/user'))return {ok:true,json:async()=>({id:'user-1',email:'pilot@example.com'})};
  if(String(url).includes('/auth/v1/logout'))return {ok:true,json:async()=>({})};
  if(String(url).includes('/rest/v1/pilots')&&(opts.method||'GET')==='GET'){
   if(String(url).includes('select=pilot'))return {ok:true,json:async()=>[{pilot,updated_at:'2026-09-11T12:00:00.000Z'}]};
   return {ok:true,json:async()=>[{updated_at:'2026-09-11T12:00:00.000Z',credits:1234,system:0,ship:'wren',playtime:42}]};
  }
  if(String(url).includes('/rest/v1/pilots')&&opts.method==='POST'){
   return {ok:true,json:async()=>[{...JSON.parse(opts.body),updated_at:'2026-09-11T12:05:00.000Z'}]};
  }
  return {ok:false,json:async()=>({msg:'unexpected '+url})};
 };
 await verifyCloudOtp('pilot@example.com','12345678');
 assert.equal(cloudUserEmail(),'pilot@example.com');
 const meta=await fetchCloudPilotMeta();
 assert.equal(meta.credits,1234);
 const up=await uploadCloudPilot(pilot);
 assert.equal(up.user_id,'user-1');
 const down=await downloadCloudPilot();
 assert.equal(down.pilot.credits,1234);
 await cloudSignOut();
 assert.equal(cloudUserEmail(),null);
 restoreCloud();
});

console.log(`\n${count} cloud-sync checks passed.`);

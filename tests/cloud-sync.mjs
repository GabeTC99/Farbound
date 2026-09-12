import assert from 'node:assert/strict';
import {cloudConfigured,CLOUD} from '../dist/cloud-config.mjs';
import {
 comparePilotFreshness,cloudAutosyncEnabled,setCloudAutosync,AUTOSYNC_KEY,SESSION_KEY,AUTH_REDIRECT,
 consumeAuthRedirect,requestCloudSignIn,cloudSignUp,cloudSignIn,uploadCloudPilot,downloadCloudPilot,
 fetchCloudPilotMeta,cloudSignOut,cloudUserEmail,pilotProgress,pilotProgressSummary,wouldDowngradeCloud
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

await atest('Password sign-up posts to /auth/v1/signup and stores session',async()=>{
 mem.clear();
 const calls=[];
 CLOUD.url='https://example.supabase.co';
 CLOUD.anonKey='anon-key-for-tests-0123456789abcdef';
 globalThis.fetch=async(url,opts={})=>{
  calls.push({url:String(url),method:opts.method||'GET',body:opts.body?JSON.parse(opts.body):null});
  if(String(url).includes('/auth/v1/signup'))return {ok:true,json:async()=>({access_token:'a1',refresh_token:'r1',expires_in:3600,user:{id:'user-1',email:'pilot@example.com'}})};
  return {ok:false,json:async()=>({msg:'unexpected '+url})};
 };
 const session=await cloudSignUp('Pilot@Example.com','secret99');
 assert.equal(session.access_token,'a1');
 assert.equal(cloudUserEmail(),'pilot@example.com');
 const signup=calls.find(c=>c.url.includes('/auth/v1/signup'));
 assert.ok(signup);
 assert.equal(signup.body.email,'pilot@example.com');
 assert.equal(signup.body.password,'secret99');
 restoreCloud();
});

await atest('Password sign-in uses grant_type=password',async()=>{
 mem.clear();
 const calls=[];
 CLOUD.url='https://example.supabase.co';
 CLOUD.anonKey='anon-key-for-tests-0123456789abcdef';
 globalThis.fetch=async(url,opts={})=>{
  calls.push({url:String(url),method:opts.method||'GET',body:opts.body?JSON.parse(opts.body):null});
  if(String(url).includes('/auth/v1/token')&&String(url).includes('grant_type=password')){
   return {ok:true,json:async()=>({access_token:'a2',refresh_token:'r2',expires_in:3600,user:{id:'user-1',email:'pilot@example.com'}})};
  }
  return {ok:false,json:async()=>({msg:'unexpected '+url})};
 };
 await cloudSignIn('pilot@example.com','secret99');
 assert.equal(cloudUserEmail(),'pilot@example.com');
 assert.ok(calls.some(c=>c.url.includes('grant_type=password')&&c.body.password==='secret99'));
 restoreCloud();
});

await atest('Password helpers reject short passwords',async()=>{
 mem.clear();
 CLOUD.url='https://example.supabase.co';
 CLOUD.anonKey='anon-key-for-tests-0123456789abcdef';
 await assert.rejects(()=>cloudSignIn('pilot@example.com','123'),/6 characters/);
 await assert.rejects(()=>cloudSignUp('pilot@example.com','abc'),/6 characters/);
 restoreCloud();
});

await atest('Deprecated magic-link request still uses PKCE + Pages redirect',async()=>{
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

await atest('Password session upload / download shapes still work',async()=>{
 mem.clear();
 const calls=[];
 const pilot=newSave();
 pilot.credits=1234;pilot.playtime=42;pilot.system=0;pilot.ship='wren';
 pilot.modules=[{uid:'m-1',kind:'laser',grade:1}];
 pilot.loadouts={...pilot.loadouts,wren:['m-1']};
 pilot.reputation={...pilot.reputation,concord:12};
 pilot.companies={'co-0-a':{standing:24,completed:3,perk:false}};
 CLOUD.url='https://example.supabase.co';
 CLOUD.anonKey='anon-key-for-tests-0123456789abcdef';
 globalThis.fetch=async(url,opts={})=>{
  calls.push({url:String(url),method:opts.method||'GET',body:opts.body?JSON.parse(opts.body):null});
  if(String(url).includes('/auth/v1/token')&&String(url).includes('grant_type=password')){
   return {ok:true,json:async()=>({access_token:'a1',refresh_token:'r1',expires_in:3600,user:{id:'user-1',email:'pilot@example.com'}})};
  }
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
 await cloudSignIn('pilot@example.com','secret99');
 assert.equal(cloudUserEmail(),'pilot@example.com');
 const meta=await fetchCloudPilotMeta();
 assert.equal(meta.credits,1234);
 const up=await uploadCloudPilot(pilot);
 assert.equal(up.user_id,'user-1');
 assert.match(up.summary,/1 module/);
 assert.match(up.summary,/Concord \+12/);
 const down=await downloadCloudPilot();
 assert.equal(down.pilot.credits,1234);
 assert.equal(down.pilot.modules.length,1);
 assert.equal(down.pilot.reputation.concord,12);
 assert.equal(down.pilot.companies['co-0-a'].standing,24);
 assert.match(down.summary,/1 module/);
 await cloudSignOut();
 assert.equal(cloudUserEmail(),null);
 assert.ok(!mem.has(SESSION_KEY)||!mem.get(SESSION_KEY));
 restoreCloud();
});

test('Pilot progress helpers detect a thinner save that would wipe modules or reputation',()=>{
 const rich=newSave();
 rich.modules=[{uid:'m-1',kind:'laser',grade:2},{uid:'m-2',kind:'shield',grade:1}];
 rich.loadouts={...rich.loadouts,wren:['m-1','m-2']};
 rich.reputation={...rich.reputation,concord:40,directorate:-5};
 rich.companies={'co-0-a':{standing:48,completed:6,perk:false}};
 rich.playtime=9000;
 const thin=newSave();
 thin.playtime=120;
 assert.equal(wouldDowngradeCloud(thin,rich),true);
 assert.equal(wouldDowngradeCloud(rich,thin),false);
 assert.match(pilotProgressSummary(rich),/2 modules/);
 assert.match(pilotProgressSummary(rich),/Concord \+40/);
 assert.deepEqual(pilotProgress(rich).modules,2);
 assert.equal(pilotProgress(rich).standing,48);
});

await atest('Autosync-style upload refuses to overwrite a richer cloud pilot',async()=>{
 mem.clear();
 const rich=newSave();
 rich.modules=[{uid:'m-1',kind:'laser',grade:1}];
 rich.loadouts={...rich.loadouts,wren:['m-1']};
 rich.reputation={...rich.reputation,concord:30};
 rich.companies={'co-0-a':{standing:40,completed:5,perk:false}};
 rich.playtime=8000;rich.credits=50000;
 const thin=newSave();
 thin.playtime=200;thin.credits=2400;
 CLOUD.url='https://example.supabase.co';
 CLOUD.anonKey='anon-key-for-tests-0123456789abcdef';
 let posts=0;
 globalThis.fetch=async(url,opts={})=>{
  if(String(url).includes('/auth/v1/token')&&String(url).includes('grant_type=password')){
   return {ok:true,json:async()=>({access_token:'a1',refresh_token:'r1',expires_in:3600,user:{id:'user-1',email:'pilot@example.com'}})};
  }
  if(String(url).includes('/rest/v1/pilots')&&(opts.method||'GET')==='GET'&&String(url).includes('select=pilot')){
   return {ok:true,json:async()=>[{pilot:rich,updated_at:'2026-09-11T12:00:00.000Z'}]};
  }
  if(String(url).includes('/rest/v1/pilots')&&opts.method==='POST'){posts++;return {ok:true,json:async()=>[{user_id:'user-1'}]};}
  return {ok:false,json:async()=>({msg:'unexpected '+url})};
 };
 await cloudSignIn('pilot@example.com','secret99');
 await assert.rejects(()=>uploadCloudPilot(thin,{allowDowngrade:false}),/Autosync skipped/);
 assert.equal(posts,0);
 const forced=await uploadCloudPilot(thin,{allowDowngrade:true});
 assert.equal(posts,1);
 assert.ok(forced);
 restoreCloud();
});

console.log(`\n${count} cloud-sync checks passed.`);

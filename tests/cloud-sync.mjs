import assert from 'node:assert/strict';
import {cloudConfigured,CLOUD} from '../dist/cloud-config.mjs';
import {
 comparePilotFreshness,cloudAutosyncEnabled,setCloudAutosync,AUTOSYNC_KEY,SESSION_KEY,
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
globalThis.window={location:{pathname:'/Farbound/',search:'',hash:'',origin:'https://game.example'}};
globalThis.location=window.location;
globalThis.history={replaceState(){location.hash='';location.search='';}};
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
 const a=comparePilotFreshness({savedAt:Date.parse('2026-09-11T13:00:00.000Z')},remote);
 const b=comparePilotFreshness({savedAt:Date.parse('2026-09-11T11:00:00.000Z')},remote);
 const c=comparePilotFreshness({savedAt:Date.parse('2026-09-11T12:00:00.500Z')},remote);
 const d=comparePilotFreshness({playtime:50},{playtime:80});
 assert.equal(a.localNewer??a.localNewer,true);
 assert.equal(b.remoteNewer??b.remoteNewer,true);
 assert.equal(c.same??c.same,true);
 assert.equal(d.remoteNewer??d.remoteNewer,true);
});

test('Magic-link hash tokens are captured into the session store',()=>{
 mem.clear();
 CLOUD.url='https://example.supabase.co';
 CLOUD.anonKey='anon-key-for-tests-0123456789abcdef';
 location.hash='#access_token=tok-abc&refresh_token=ref-xyz&expires_at=9999999999';
 const session=consumeAuthRedirect(location);
 assert.equal(session.access_token,'tok-abc');
 assert.equal(JSON.parse(mem.get(SESSION_KEY)).refresh_token,'ref-xyz');
 assert.equal(location.hash,'');
 restoreCloud();
});

await atest('Sign-in / OTP / upload / download use Supabase Auth + REST shapes',async()=>{
 mem.clear();
 const calls=[];
 const pilot=newSave();
 pilot.credits=1234;pilot.playtime=42;pilot.system=0;pilot.ship='wren';
 CLOUD.url='https://example.supabase.co';
 CLOUD.anonKey='anon-key-for-tests-0123456789abcdef';
 assert.equal(cloudConfigured(),true);

 globalThis.fetch=async(url,opts={})=>{
  calls.push({url:String(url),method:opts.method||'GET',body:opts.body?JSON.parse(opts.body):null,headers:opts.headers});
  if(String(url).includes('/auth/v1/otp'))return {ok:true,json:async()=>({})};
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

 await requestCloudSignIn('Pilot@Example.com');
 assert(calls.some(c=>c.url.includes('/auth/v1/otp')&&c.body.email==='pilot@example.com'));

 await verifyCloudOtp('pilot@example.com','123456');
 assert.equal(cloudUserEmail(),'pilot@example.com');

 const meta=await fetchCloudPilotMeta();
 assert.equal(meta.credits,1234);

 const up=await uploadCloudPilot(pilot);
 assert.equal(up.user_id,'user-1');
 assert.equal(up.credits,1234);

 const down=await downloadCloudPilot();
 assert.equal(down.pilot.credits,1234);
 assert.equal(down.updatedAt,'2026-09-11T12:00:00.000Z');

 await cloudSignOut();
 assert.equal(cloudUserEmail(),null);

 restoreCloud();
});

console.log(`\n${count} cloud-sync checks passed.`);

/**
 * Optional pilot cloud sync via Supabase Auth + REST (no SDK / no bundler).
 * Local saves remain authoritative for play; cloud is opt-in upload/download.
 */
import {cloudConfigured,CLOUD} from './cloud-config.mjs';
import {validateSave} from './frontier.mjs';

export const SESSION_KEY='farbound-cloud-session';
export const AUTOSYNC_KEY='farbound-cloud-autosync';

const jsonHeaders=()=>({
 'Content-Type':'application/json',
 apikey:CLOUD.anonKey,
 Authorization:`Bearer ${CLOUD.anonKey}`
});
const authHeaders=token=>({
 'Content-Type':'application/json',
 apikey:CLOUD.anonKey,
 Authorization:`Bearer ${token}`
});

function loadSession(){
 try{return JSON.parse(localStorage.getItem(SESSION_KEY)||'null');}catch{return null;}
}
function saveSession(session){
 if(!session)localStorage.removeItem(SESSION_KEY);
 else localStorage.setItem(SESSION_KEY,JSON.stringify(session));
}
export function cloudAutosyncEnabled(){return localStorage.getItem(AUTOSYNC_KEY)==='1';}
export function setCloudAutosync(on){localStorage.setItem(AUTOSYNC_KEY,on?'1':'0');}

export function getCloudSession(){return loadSession();}
export function cloudUserEmail(){return loadSession()?.user?.email||null;}

/** Capture magic-link tokens from the URL hash/query after redirect. */
export function consumeAuthRedirect(location=window.location){
 if(!cloudConfigured())return null;
 const hash=new URLSearchParams((location.hash||'').replace(/^#/,''));
 const query=new URLSearchParams(location.search||'');
 const access=hash.get('access_token')||query.get('access_token');
 const refresh=hash.get('refresh_token')||query.get('refresh_token');
 if(!access)return null;
 const session={access_token:access,refresh_token:refresh,expires_at:Number(hash.get('expires_at')||query.get('expires_at')||0),user:null};
 saveSession(session);
 try{
  history.replaceState({},'',location.pathname+(location.search&&!query.get('access_token')?location.search:'')+(location.hash&&!hash.get('access_token')?location.hash:''));
 }catch{}
 return session;
}

async function refreshIfNeeded(){
 const session=loadSession();if(!session?.access_token)return null;
 const exp=session.expires_at?session.expires_at*1000:0;
 if(exp&&Date.now()<exp-60000&&session.user)return session;
 if(session.refresh_token){
  const res=await fetch(`${CLOUD.url}/auth/v1/token?grant_type=refresh_token`,{
   method:'POST',headers:jsonHeaders(),body:JSON.stringify({refresh_token:session.refresh_token})
  });
  if(res.ok){
   const data=await res.json();
   const next={access_token:data.access_token,refresh_token:data.refresh_token||session.refresh_token,expires_at:data.expires_at||Math.floor(Date.now()/1000)+(data.expires_in||3600),user:data.user||session.user};
   saveSession(next);return next;
  }
 }
 // Probe user with current token
 const user=await fetchUser(session.access_token);
 if(user){session.user=user;saveSession(session);return session;}
 saveSession(null);return null;
}

async function fetchUser(token){
 const res=await fetch(`${CLOUD.url}/auth/v1/user`,{headers:authHeaders(token)});
 if(!res.ok)return null;
 return await res.json();
}

export async function ensureCloudSession(){
 if(!cloudConfigured())return null;
 consumeAuthRedirect();
 return await refreshIfNeeded();
}

/** Send a magic-link / OTP email. */
export async function requestCloudSignIn(email,{redirectTo=typeof location!=='undefined'?location.origin+location.pathname:''}={}){
 if(!cloudConfigured())throw Error('Cloud sync is not configured on this build.');
 const clean=String(email||'').trim().toLowerCase();
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean))throw Error('Enter a valid email address.');
 const res=await fetch(`${CLOUD.url}/auth/v1/otp`,{
  method:'POST',headers:jsonHeaders(),
  body:JSON.stringify({email:clean,create_user:true,options:{email_redirect_to:redirectTo}})
 });
 if(!res.ok){
  const err=await res.json().catch(()=>({}));
  throw Error(err.msg||err.error_description||'Could not send sign-in email.');
 }
 return {email:clean};
}

/** Verify a 6–8 digit email OTP from the message body. */
export async function verifyCloudOtp(email,token){
 if(!cloudConfigured())throw Error('Cloud sync is not configured on this build.');
 const clean=String(email||'').trim().toLowerCase();
 const code=String(token||'').trim();
 if(!clean||!code)throw Error('Email and code are required.');
 const res=await fetch(`${CLOUD.url}/auth/v1/verify`,{
  method:'POST',headers:jsonHeaders(),
  body:JSON.stringify({type:'email',email:clean,token:code})
 });
 if(!res.ok){
  const err=await res.json().catch(()=>({}));
  throw Error(err.msg||err.error_description||'That code was not accepted.');
 }
 const data=await res.json();
 const session={access_token:data.access_token,refresh_token:data.refresh_token,expires_at:data.expires_at||Math.floor(Date.now()/1000)+(data.expires_in||3600),user:data.user};
 saveSession(session);return session;
}

export async function cloudSignOut(){
 const session=loadSession();
 if(session?.access_token&&cloudConfigured()){
  try{await fetch(`${CLOUD.url}/auth/v1/logout`,{method:'POST',headers:authHeaders(session.access_token)});}catch{}
 }
 saveSession(null);
}

export async function fetchCloudPilotMeta(){
 const session=await ensureCloudSession();if(!session?.user?.id)return null;
 const res=await fetch(`${CLOUD.url}/rest/v1/pilots?select=updated_at,credits,system,ship,playtime&user_id=eq.${session.user.id}`,{
  headers:{...authHeaders(session.access_token),Accept:'application/json'}
 });
 if(!res.ok)throw Error('Could not read cloud pilot.');
 const rows=await res.json();
 return rows[0]||null;
}

export async function downloadCloudPilot(){
 const session=await ensureCloudSession();if(!session?.user?.id)throw Error('Sign in to download a cloud pilot.');
 const res=await fetch(`${CLOUD.url}/rest/v1/pilots?select=pilot,updated_at&user_id=eq.${session.user.id}`,{
  headers:{...authHeaders(session.access_token),Accept:'application/json'}
 });
 if(!res.ok)throw Error('Could not download cloud pilot.');
 const rows=await res.json();
 if(!rows.length)return null;
 const pilot=validateSave(rows[0].pilot);
 if(!pilot)throw Error('Cloud pilot failed validation.');
 return {pilot,updatedAt:rows[0].updated_at};
}

export async function uploadCloudPilot(pilot){
 const session=await ensureCloudSession();if(!session?.user?.id)throw Error('Sign in to upload your pilot.');
 const valid=validateSave(pilot);if(!valid)throw Error('Local pilot is not valid to upload.');
 const body={
  user_id:session.user.id,
  email:session.user.email||null,
  pilot:valid,
  updated_at:new Date().toISOString(),
  playtime:Number(valid.playtime)||0,
  credits:Number(valid.credits)||0,
  system:Number.isInteger(valid.system)?valid.system:0,
  ship:valid.ship||null
 };
 const res=await fetch(`${CLOUD.url}/rest/v1/pilots?on_conflict=user_id`,{
  method:'POST',
  headers:{...authHeaders(session.access_token),Prefer:'resolution=merge-duplicates,return=representation'},
  body:JSON.stringify(body)
 });
 if(!res.ok){
  const err=await res.json().catch(()=>({}));
  throw Error(err.message||err.msg||'Upload failed.');
 }
 const rows=await res.json();
 return rows[0]||body;
}

/** Compare local vs cloud timestamps for conflict UI. */
export function comparePilotFreshness(localPilot,remoteMeta){
 const localMs=Number(localPilot?.savedAt)||0;
 const remoteMs=remoteMeta?.updated_at?Date.parse(remoteMeta.updated_at):NaN;
 if(localMs&&Number.isFinite(remoteMs)){
  return {localNewer:localMs>remoteMs+2000,remoteNewer:remoteMs>localMs+2000,same:Math.abs(localMs-remoteMs)<=2000,remoteMs,localMs};
 }
 const localPlay=Number(localPilot?.playtime)||0;
 const remotePlay=Number(remoteMeta?.playtime)||0;
 return {localNewer:localPlay>remotePlay,remoteNewer:remotePlay>localPlay,same:localPlay===remotePlay,remotePlay,localAt:localPlay};
}

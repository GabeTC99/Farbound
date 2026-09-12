/**
 * Optional pilot cloud sync via Supabase Auth + REST (no SDK / no bundler).
 * Local saves remain authoritative for play; cloud is opt-in upload/download.
 */
import {cloudConfigured,CLOUD} from './cloud-config.mjs';
import {validateSave} from './frontier.mjs';

export const SESSION_KEY='farbound-cloud-session';
export const AUTOSYNC_KEY='farbound-cloud-autosync';
const PKCE_KEY='farbound-cloud-pkce';
/** Always return testers to the Pages game path — never the bare github.io host. */
export const AUTH_REDIRECT='https://gabetc99.github.io/Farbound/';

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

function b64url(bytes){
 let s='';for(const b of bytes)s+=String.fromCharCode(b);
 return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
function randomVerifier(){
 const bytes=new Uint8Array(32);
 crypto.getRandomValues(bytes);
 return b64url(bytes);
}
async function challengeS256(verifier){
 const data=new TextEncoder().encode(verifier);
 const dig=await crypto.subtle.digest('SHA-256',data);
 return b64url(new Uint8Array(dig));
}

function clearUrlAuth(location){
 try{
  const url=new URL(location.href);
  ['code','access_token','refresh_token','expires_at','expires_in','token_type','type','error','error_description'].forEach(k=>url.searchParams.delete(k));
  url.hash='';
  history.replaceState({},'',url.pathname+url.search);
 }catch{}
}

/** Capture magic-link / PKCE redirect tokens from the URL. */
export async function consumeAuthRedirect(location=window.location){
 if(!cloudConfigured())return null;
 const hash=new URLSearchParams((location.hash||'').replace(/^#/,''));
 const query=new URLSearchParams(location.search||'');
 if(hash.get('error')||query.get('error')){
  const msg=hash.get('error_description')||query.get('error_description')||hash.get('error')||query.get('error');
  clearUrlAuth(location);
  throw Error(msg||'Sign-in link failed.');
 }
 const access=hash.get('access_token')||query.get('access_token');
 const refresh=hash.get('refresh_token')||query.get('refresh_token');
 if(access){
  const session={access_token:access,refresh_token:refresh,expires_at:Number(hash.get('expires_at')||query.get('expires_at')||0),user:null};
  saveSession(session);
  clearUrlAuth(location);
  const user=await fetchUser(access);if(user){session.user=user;saveSession(session);}
  return session;
 }
 const code=query.get('code');
 if(!code)return null;
 let verifier=null;
 try{verifier=sessionStorage.getItem(PKCE_KEY);}catch{}
 if(!verifier)throw Error('Sign-in link opened in a different browser. Request a new email and open the link in Chrome where Farbound is running.');
 const res=await fetch(`${CLOUD.url}/auth/v1/token?grant_type=pkce`,{
  method:'POST',headers:jsonHeaders(),
  body:JSON.stringify({auth_code:code,code_verifier:verifier,code})
 });
 try{sessionStorage.removeItem(PKCE_KEY);}catch{}
 clearUrlAuth(location);
 if(!res.ok){
  const err=await res.json().catch(()=>({}));
  throw Error(err.msg||err.error_description||'Could not finish sign-in from the email link.');
 }
 const data=await res.json();
 const session={access_token:data.access_token,refresh_token:data.refresh_token,expires_at:data.expires_at||Math.floor(Date.now()/1000)+(data.expires_in||3600),user:data.user||null};
 saveSession(session);
 if(!session.user){const user=await fetchUser(session.access_token);if(user){session.user=user;saveSession(session);}}
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
 await consumeAuthRedirect();
 return await refreshIfNeeded();
}

function cleanEmail(email){
 const clean=String(email||'').trim().toLowerCase();
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean))throw Error('Enter a valid email address.');
 return clean;
}
function cleanPassword(password){
 const pass=String(password||'');
 if(pass.length<6)throw Error('Password must be at least 6 characters.');
 return pass;
}
function sessionFromAuth(data){
 const session={access_token:data.access_token,refresh_token:data.refresh_token,expires_at:data.expires_at||Math.floor(Date.now()/1000)+(data.expires_in||3600),user:data.user||null};
 saveSession(session);return session;
}

/** Create a cloud account with email + password (stays inside the PWA). */
export async function cloudSignUp(email,password){
 if(!cloudConfigured())throw Error('Cloud sync is not configured on this build.');
 const clean=cleanEmail(email),pass=cleanPassword(password);
 const res=await fetch(`${CLOUD.url}/auth/v1/signup`,{
  method:'POST',headers:jsonHeaders(),
  body:JSON.stringify({email:clean,password:pass})
 });
 const data=await res.json().catch(()=>({}));
 if(!res.ok){
  const msg=data.msg||data.error_description||data.error||'Could not create account.';
  if(/already|registered|exists/i.test(msg))throw Error('That email already has an account. Use Sign in.');
  throw Error(msg);
 }
 if(!data.access_token)throw Error('Account created, but sign-in did not complete. Try Sign in.');
 return sessionFromAuth(data);
}

/** Sign in with email + password (stays inside the PWA). */
export async function cloudSignIn(email,password){
 if(!cloudConfigured())throw Error('Cloud sync is not configured on this build.');
 const clean=cleanEmail(email),pass=cleanPassword(password);
 const res=await fetch(`${CLOUD.url}/auth/v1/token?grant_type=password`,{
  method:'POST',headers:jsonHeaders(),
  body:JSON.stringify({email:clean,password:pass})
 });
 const data=await res.json().catch(()=>({}));
 if(!res.ok){
  const msg=data.msg||data.error_description||data.error||'Sign-in failed.';
  if(/invalid.*credentials|invalid login/i.test(msg))throw Error('Wrong email or password. If you only used the old email link, create an account with a password instead.');
  throw Error(msg);
 }
 return sessionFromAuth(data);
}

/** @deprecated Prefer cloudSignIn / cloudSignUp — magic links leave the installed PWA. */
export async function requestCloudSignIn(email,{redirectTo=AUTH_REDIRECT}={}){
 if(!cloudConfigured())throw Error('Cloud sync is not configured on this build.');
 const clean=cleanEmail(email);
 const verifier=randomVerifier();
 const challenge=await challengeS256(verifier);
 try{sessionStorage.setItem(PKCE_KEY,verifier);}catch{}
 const res=await fetch(`${CLOUD.url}/auth/v1/otp`,{
  method:'POST',headers:jsonHeaders(),
  body:JSON.stringify({
   email:clean,
   create_user:true,
   code_challenge:challenge,
   code_challenge_method:'s256',
   options:{email_redirect_to:redirectTo}
  })
 });
 if(!res.ok){
  const err=await res.json().catch(()=>({}));
  throw Error(err.msg||err.error_description||'Could not send sign-in email.');
 }
 return {email:clean};
}

/** @deprecated Prefer cloudSignIn / cloudSignUp. */
export async function verifyCloudOtp(email,token){
 if(!cloudConfigured())throw Error('Cloud sync is not configured on this build.');
 const clean=cleanEmail(email);
 const code=String(token||'').trim();
 if(!code)throw Error('Email and code are required.');
 const res=await fetch(`${CLOUD.url}/auth/v1/verify`,{
  method:'POST',headers:jsonHeaders(),
  body:JSON.stringify({type:'email',email:clean,token:code})
 });
 if(!res.ok){
  const err=await res.json().catch(()=>({}));
  throw Error(err.msg||err.error_description||'That code was not accepted.');
 }
 return sessionFromAuth(await res.json());
}

export async function cloudSignOut(){
 const session=loadSession();
 if(session?.access_token&&cloudConfigured()){
  try{await fetch(`${CLOUD.url}/auth/v1/logout`,{method:'POST',headers:authHeaders(session.access_token)});}catch{}
 }
 saveSession(null);
 try{sessionStorage.removeItem(PKCE_KEY);}catch{}
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


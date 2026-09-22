import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

/**
 * Mirrors MainActivity.interceptRequest:
 *   asset    — serve from bundled APK assets
 *   network  — return null so WebView uses the real HTTPS connection
 *   blocked  — 404 empty body (zip, .., non-https, off-asset paths)
 */
const HOST='appassets.androidplatform.net';
function interceptDecision(href){
 const uri=new URL(href);
 const host=uri.hostname;
 const path=decodeURIComponent(uri.pathname);
 if(host!==HOST){
  if(uri.protocol!=='https:')return 'blocked';
  return 'network';
 }
 if(uri.protocol!=='https:'||!path||!path.startsWith('/assets/')||path.includes('..'))return 'blocked';
 let asset=path.slice('/assets/'.length);
 if(!asset)asset='index.html';
 if(asset.endsWith('.zip'))return 'blocked';
 return 'asset';
}

assert.equal(interceptDecision('https://appassets.androidplatform.net/assets/index.html'),'asset');
assert.equal(interceptDecision('https://appassets.androidplatform.net/assets/app.js'),'asset');
assert.equal(interceptDecision('https://appassets.androidplatform.net/assets/'),'asset');
assert.equal(interceptDecision('https://thcciowujlfeqzdyskea.supabase.co/auth/v1/signup'),'network');
assert.equal(interceptDecision('https://thcciowujlfeqzdyskea.supabase.co/rest/v1/pilots'),'network');
assert.equal(interceptDecision('https://example.com/anything'),'network');
assert.equal(interceptDecision('http://thcciowujlfeqzdyskea.supabase.co/auth/v1/signup'),'blocked');
assert.equal(interceptDecision('http://appassets.androidplatform.net/assets/index.html'),'blocked');
assert.equal(interceptDecision('https://appassets.androidplatform.net/index.html'),'blocked');
assert.equal(interceptDecision('https://appassets.androidplatform.net/assets/pack.zip'),'blocked');
assert.equal(interceptDecision('https://appassets.androidplatform.net/assets/%2e%2e/AndroidManifest.xml'),'blocked');

const java=readFileSync(new URL('../android/app/src/main/java/com/nullharbor/game/MainActivity.java',import.meta.url),'utf8');
assert.match(java,/WebResourceResponse interceptRequest\(Uri uri\)/);
assert.match(java,/if \(!HOST\.equals\(host\)\) \{[\s\S]*return blocked\(\);[\s\S]*return null;/);
assert.match(java,/path\.contains\("\.\."\)/);
assert.match(java,/asset\.endsWith\("\.zip"\)/);
assert.match(java,/return interceptRequest\(request\.getUrl\(\)\)/);
assert.match(java,/Asset host intercepted[\s\S]*Other HTTPS returns null/);
assert.ok(!/ACCESS_NETWORK_STATE/.test(java));

const manifest=readFileSync(new URL('../android/app/src/main/AndroidManifest.xml',import.meta.url),'utf8');
assert.match(manifest,/android\.permission\.INTERNET/);
assert.match(manifest,/android:usesCleartextTraffic="false"/);
assert.ok(!/ACCESS_NETWORK_STATE/.test(manifest));
assert.ok(!/usesCleartextTraffic="true"/.test(manifest));

const cloud=readFileSync(new URL('../dist/cloud-config.mjs',import.meta.url),'utf8');
assert.match(cloud,/https:\/\/thcciowujlfeqzdyskea\.supabase\.co/);
assert.match(cloud,/anonKey:/);
assert.match(cloud,/RLS protects each pilot row/);

console.log('PASS Android WebView: asset host intercepted, other https passes through');

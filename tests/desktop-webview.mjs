import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';

const require = createRequire(import.meta.url);
const {HOST, interceptDecision, assetPath, mimeFor} = require('../desktop/shell-policy.cjs');

assert.equal(HOST, 'appassets.nullharbor.local');
assert.equal(interceptDecision('https://appassets.nullharbor.local/assets/index.html'), 'asset');
assert.equal(interceptDecision('https://appassets.nullharbor.local/assets/app.js'), 'asset');
assert.equal(interceptDecision('https://appassets.nullharbor.local/assets/'), 'asset');
assert.equal(interceptDecision('https://thcciowujlfeqzdyskea.supabase.co/auth/v1/signup'), 'network');
assert.equal(interceptDecision('https://thcciowujlfeqzdyskea.supabase.co/rest/v1/pilots'), 'network');
assert.equal(interceptDecision('https://example.com/anything'), 'network');
assert.equal(interceptDecision('http://thcciowujlfeqzdyskea.supabase.co/auth/v1/signup'), 'blocked');
assert.equal(interceptDecision('http://appassets.nullharbor.local/assets/index.html'), 'blocked');
assert.equal(interceptDecision('https://appassets.nullharbor.local/index.html'), 'blocked');
assert.equal(interceptDecision('https://appassets.nullharbor.local/assets/pack.zip'), 'blocked');
assert.equal(interceptDecision('https://appassets.nullharbor.local/assets/%2e%2e/main.cjs'), 'blocked');
assert.equal(assetPath('https://appassets.nullharbor.local/assets/'), 'index.html');
assert.equal(assetPath('https://appassets.nullharbor.local/assets/cloud-sync.mjs'), 'cloud-sync.mjs');
assert.equal(mimeFor('app.js'), 'text/javascript');
assert.equal(mimeFor('style.css'), 'text/css');
assert.equal(mimeFor('icon-512.png'), 'image/png');

const main = readFileSync(new URL('../desktop/main.cjs', import.meta.url), 'utf8');
assert.match(main, /function handleHttps\(request\)/);
assert.match(main, /bypassCustomProtocolHandlers: true/);
assert.match(main, /protocol\.handle\('https', handleHttps\)/);
assert.match(main, /if \(decision === 'blocked'\) return new Response/);
assert.match(main, /loadURL\(`https:\/\/\$\{HOST\}\/assets\/index.html`\)/);
assert.match(main, /nullharbor-pause/);
assert.match(main, /nullharbor-resume/);
assert.match(main, /NULLHARBOR_SMOKE/);
assert.match(main, /will-navigate/);
assert.ok(!/webSecurity:\s*false/.test(main));
assert.ok(!/nodeIntegration:\s*true/.test(main));

const preload = readFileSync(new URL('../desktop/preload.cjs', import.meta.url), 'utf8');
assert.match(preload, /NullharborDesktop/);
assert.match(preload, /exportSave/);
assert.match(preload, /refreshLock/);

const pkg = JSON.parse(readFileSync(new URL('../desktop/package.json', import.meta.url), 'utf8'));
assert.equal(pkg.version, '3.0.0');
assert.equal(pkg.build?.appId, 'com.nullharbor.game');
assert.equal(pkg.build?.productName, 'Nullharbor');
assert.equal(pkg.build?.win?.artifactName, 'Nullharbor.exe');
assert.equal(pkg.build?.portable?.artifactName, 'Nullharbor.exe');
assert.equal(pkg.build?.forceCodeSigning, false);

const release = readFileSync(new URL('../.github/workflows/windows-release.yml', import.meta.url), 'utf8');
assert.match(release, /windows-v\*/);
assert.match(release, /v\*-windows/);
assert.match(release, /windows-latest/);
assert.match(release, /make_latest: false/);
assert.match(release, /Nullharbor\.exe/);
assert.match(release, /nullharbor-\$\{\{ steps\.ver\.outputs\.name \}\}-win\.exe/);
assert.match(release, /CSC_IDENTITY_AUTO_DISCOVERY/);

const loop = readFileSync(new URL('../dist/flight-loop.mjs', import.meta.url), 'utf8');
assert.match(loop, /NullharborDesktop/);
assert.match(loop, /bundledAssetHost/);

const app = readFileSync(new URL('../dist/app.js', import.meta.url), 'utf8');
assert.match(app, /bundledAssetHost\(location\.hostname\)/);
assert.match(app, /nativeAndroidBridge\(\)\?''/);

const classic = readFileSync(new URL('../dist/classic/app.js', import.meta.url), 'utf8');
assert.match(classic, /NullharborDesktop/);

console.log('PASS Windows shell: asset host intercepted, other https passes through, Install hidden');

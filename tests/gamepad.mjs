import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';

const root = path.resolve('dist');
const source = await readFile(path.join(root, 'gamepad.mjs'), 'utf8');

const buttons = Array.from({length:17}, () => ({pressed:false, value:0}));
const axes = [0, 0, 0, 0];
const pad = {
  id:'Xbox Wireless Controller (STANDARD GAMEPAD Vendor: 045e)',
  index:0,
  connected:true,
  mapping:'standard',
  buttons,
  axes
};

const listeners = {};
const sandbox = {
  console,
  module: {exports:{}},
  exports: {}
};
sandbox.window = {
  addEventListener: (name, fn) => { listeners[name] = fn; },
  removeEventListener: (name, fn) => { if (listeners[name] === fn) delete listeners[name]; }
};
sandbox.navigator = {getGamepads: () => [pad]};
sandbox.globalThis = sandbox;

const rewritten = source
  .replace(/export const /g, 'const ')
  .replace(/export function /g, 'function ')
  + '\nmodule.exports={XB,gamepadConnected,bindGamepadListeners,pollGamepad,xbIcon,xboxHelpRow};';

vm.runInNewContext(rewritten, sandbox);
const {
  XB,
  gamepadConnected,
  bindGamepadListeners,
  pollGamepad,
  xbIcon,
  xboxHelpRow
} = sandbox.module.exports;

bindGamepadListeners({});
listeners.gamepadconnected?.({gamepad:pad});
assert.equal(gamepadConnected(), true);

let state = pollGamepad();
assert.equal(state.active, true);
assert.equal(state.fire, false);
assert.equal(state.edges.length, 0);

axes[0] = 0.8;
axes[1] = 0;
state = pollGamepad();
assert.ok(state.thrust > 0.7);
assert.ok(Math.abs(state.aim) < 0.2);

buttons[XB.A] = {pressed:true, value:1};
state = pollGamepad();
assert.equal(state.fire, true);
assert.ok(state.edges.includes('confirm'));
state = pollGamepad();
assert.equal(state.fire, true);
assert.equal(state.edges.includes('confirm'), false);

buttons[XB.A] = {pressed:false, value:0};
pollGamepad();

buttons[XB.X] = {pressed:true, value:1};
state = pollGamepad();
assert.ok(state.edges.includes('interact'));

const icon = xbIcon('A');
assert.match(icon, /xb xb-a/);
assert.match(icon, />A</);

const help = xboxHelpRow();
assert.match(help, /help-pad/);
assert.match(help, /Xbox controller/);
assert.match(help, /xb-a/);
assert.match(help, /aim/);
buttons[XB.X] = {pressed:false, value:0};
buttons[XB.UP] = {pressed:false, value:0};
pollGamepad();
buttons[XB.UP] = {pressed:true, value:1};
state = pollGamepad();
assert.ok(state.edges.includes('focus-up'));
assert.equal(state.uiY, -1);
assert.equal(state.xbox, true);
assert.match(help, /press any button once/i);


const app = await readFile(path.join(root, 'app.js'), 'utf8');
assert.match(app, /pollGamepad\(\)/);
assert.match(app, /xboxHelpRow\(\)/);
assert.match(app, /Install app/);
assert.match(app, /Game update/);
assert.match(app, /data-action="update-app"/);
assert.equal(/Install on Android/.test(app), false);
assert.match(app, /TOUCH \+ KEYBOARD \+ CONTROLLER/);

const release = await readFile(path.join(root, 'release.mjs'), 'utf8');
assert.match(release, /export const RELEASE='3\.0\.0'/);

const sw = await readFile(path.join(root, 'sw.js'), 'utf8');
assert.match(sw, /gamepad\.mjs/);
assert.match(sw, /farbound-v3\.0\.0-space7'/);

assert.match(app, /function scrollPanelBy/);
assert.match(app, /function revealInPanel/);
assert.match(help, /scroll menus/);
console.log('PASS Xbox gamepad polling, icons, help row, install copy, and release wiring');

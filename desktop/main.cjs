'use strict';

const { app, BrowserWindow, Menu, dialog, net, ipcMain, session } = require('electron');
const fs = require('fs');
const path = require('path');
const { HOST, interceptDecision, assetPath, mimeFor } = require('./shell-policy.cjs');

function gameRoot() {
  if (app.isPackaged) return path.join(process.resourcesPath, 'dist');
  return path.join(__dirname, '..', 'dist');
}

function safeAssetFile(requestUrl) {
  const rel = assetPath(requestUrl);
  if (!rel || rel.includes('..') || rel.includes('\0') || rel.endsWith('.zip')) return null;
  const root = path.resolve(gameRoot());
  const file = path.resolve(root, rel);
  if (file !== root && !file.startsWith(root + path.sep)) return null;
  return file;
}

function serveAsset(requestUrl) {
  const file = safeAssetFile(requestUrl);
  if (!file) return new Response('', { status: 404, statusText: 'Not found' });
  try {
    const data = fs.readFileSync(file);
    const type = mimeFor(path.basename(file).toLowerCase());
    return new Response(data, {
      status: 200,
      statusText: 'OK',
      headers: {
        'Content-Type': type,
        'Cache-Control': 'no-cache',
      },
    });
  } catch {
    return new Response('', { status: 404, statusText: 'Not found' });
  }
}

function handleHttps(request) {
  const decision = interceptDecision(request.url);
  if (decision === 'asset') return serveAsset(request.url);
  if (decision === 'blocked') return new Response('', { status: 404, statusText: 'Not found' });
  return net.fetch(request, { bypassCustomProtocolHandlers: true });
}

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    backgroundColor: '#070d17',
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
    },
  });
  Menu.setApplicationMenu(null);
  mainWindow.once('ready-to-show', () => mainWindow.show());
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (interceptDecision(url) !== 'asset') event.preventDefault();
  });
  mainWindow.on('blur', () => {
    mainWindow.webContents.executeJavaScript("window.dispatchEvent(new Event('nullharbor-pause'))").catch(() => {});
  });
  mainWindow.on('focus', () => {
    mainWindow.webContents.executeJavaScript("window.dispatchEvent(new Event('nullharbor-resume'))").catch(() => {});
  });
  mainWindow.loadURL(`https://${HOST}/assets/index.html`);
  if (process.env.NULLHARBOR_SMOKE) runSmoke(mainWindow);
}

function runSmoke(win) {
  const timer = setTimeout(() => {
    console.error('SMOKE timeout waiting for the bundled game');
    app.exit(1);
  }, 25000);
  win.webContents.once('did-fail-load', (_e, code, desc, url, isMainFrame) => {
    if (!isMainFrame) return;
    clearTimeout(timer);
    console.error('SMOKE did-fail-load', code, desc, url);
    app.exit(1);
  });
  win.webContents.once('did-finish-load', async () => {
    try {
      const result = await win.webContents.executeJavaScript(`(async()=>{
        const host=location.hostname;
        const desktop=!!window.NullharborDesktop;
        const release=await (await fetch(new URL('release.mjs',location.href))).text();
        const asset=await fetch(new URL('index.html',location.href));
        const httpsNet=await fetch('https://example.com/');
        const httpsBody=await httpsNet.text();
        let httpBlock;
        try{
          const r=await fetch('http://example.com/');
          httpBlock={status:r.status,len:(await r.text()).length};
        }catch(e){ httpBlock={threw:String(e.message||e)}; }
        return {
          host, desktop, title:document.title,
          release, assetStatus:asset.status,
          httpsStatus:httpsNet.status, httpsLen:httpsBody.length,
          httpBlock
        };
      })()`);
      const releaseOk = /export const RELEASE='2\.16\.11'/.test(result.release);
      const httpsOk = result.httpsStatus >= 200 && result.httpsStatus < 400 && result.httpsLen > 0;
      const httpBlocked = !!(result.httpBlock && (
        (result.httpBlock.status === 404 && result.httpBlock.len === 0) ||
        /Failed to fetch|ERR_FAILED|blocked/i.test(result.httpBlock.threw || '')
      ));
      const ok = result.host === HOST && result.desktop && releaseOk && result.assetStatus === 200 && httpsOk && httpBlocked;
      console.log(ok ? 'SMOKE PASS' : 'SMOKE FAIL', JSON.stringify(result));
      clearTimeout(timer);
      app.exit(ok ? 0 : 1);
    } catch (err) {
      clearTimeout(timer);
      console.error('SMOKE error', err);
      app.exit(1);
    }
  });
}

app.whenReady().then(() => {
  session.defaultSession.protocol.handle('https', handleHttps);
  createWindow();
});

app.on('window-all-closed', () => {
  app.quit();
});

ipcMain.handle('export-save', async (_event, json) => {
  if (typeof json !== 'string' || json.length > 500000) return { ok: false };
  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
    title: 'Export pilot',
    defaultPath: 'nullharbor-pilot.json',
    filters: [{ name: 'JSON', extensions: ['json'] }],
  });
  if (canceled || !filePath) return { ok: false };
  fs.writeFileSync(filePath, json, 'utf8');
  return { ok: true };
});

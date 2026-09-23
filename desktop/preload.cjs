'use strict';

const { contextBridge, ipcRenderer } = require('electron');

const bridge = {
  exportSave(json) {
    if (typeof json === 'string') ipcRenderer.invoke('export-save', json);
  },
  refreshLock() {
    return JSON.stringify({ hz: 0, mode: 'desktop' });
  },
};

contextBridge.exposeInMainWorld('NullharborDesktop', bridge);

'use strict';

/**
 * Mirrors Android MainActivity.interceptRequest for the Windows shell:
 *   asset    — serve from bundled dist/
 *   network  — pass through so Chromium uses the real HTTPS connection
 *   blocked  — 404 empty body (zip, .., non-https, off-asset paths)
 *
 * Game files live at https://appassets.nullharbor.local/… (same spirit as
 * https://appassets.androidplatform.net/assets/… on the APK). Other HTTPS
 * (optional Supabase cloud sync) is not locked down.
 */
const HOST = 'appassets.nullharbor.local';

function interceptDecision(href) {
  const uri = new URL(href);
  const host = uri.hostname;
  const path = decodeURIComponent(uri.pathname);
  if (host !== HOST) {
    if (uri.protocol !== 'https:') return 'blocked';
    return 'network';
  }
  if (uri.protocol !== 'https:' || !path || !path.startsWith('/assets/') || path.includes('..')) return 'blocked';
  const asset = assetPathFromUrl(uri);
  if (!asset || asset.endsWith('.zip')) return 'blocked';
  return 'asset';
}

function assetPathFromUrl(uri) {
  const path = decodeURIComponent(uri.pathname || '');
  if (!path || path === '/assets' || path === '/assets/') return 'index.html';
  if (!path.startsWith('/assets/')) return '';
  return path.slice('/assets/'.length);
}

function assetPath(href) {
  return assetPathFromUrl(new URL(href));
}

function mimeFor(asset) {
  if (asset.endsWith('.html')) return 'text/html';
  if (asset.endsWith('.js') || asset.endsWith('.mjs')) return 'text/javascript';
  if (asset.endsWith('.css')) return 'text/css';
  if (asset.endsWith('.webp')) return 'image/webp';
  if (asset.endsWith('.png')) return 'image/png';
  if (asset.endsWith('.svg')) return 'image/svg+xml';
  if (asset.endsWith('.json') || asset.endsWith('.webmanifest')) return 'application/json';
  return 'application/octet-stream';
}

module.exports = { HOST, interceptDecision, assetPath, mimeFor };

package com.farbound.game;

import android.app.Activity;
import android.os.Bundle;
import android.content.Intent;
import android.net.Uri;
import android.view.View;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;
import java.io.ByteArrayInputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.Collections;

/** Offline shell: serves only bundled assets at a fixed HTTPS origin. No network permission. */
public final class MainActivity extends Activity {
    private static final String HOST = "appassets.androidplatform.net";
    private static final int IMPORT_FILE = 101, EXPORT_FILE = 102;
    private WebView web;
    private ValueCallback<Uri[]> fileCallback;
    private String pendingExport;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        web = new WebView(this);
        web.setBackgroundColor(0xFF070D17);
        WebSettings settings = web.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setMediaPlaybackRequiresUserGesture(true);
        web.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return !HOST.equals(request.getUrl().getHost());
            }
            @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                String path = uri.getPath();
                if (!"https".equals(uri.getScheme()) || !HOST.equals(uri.getHost()) || path == null || !path.startsWith("/assets/") || path.contains("..")) return blocked();
                String asset = path.substring(8);
                if (asset.isEmpty()) asset = "index.html";
                if (asset.endsWith(".zip")) return blocked();
                String type = asset.endsWith(".html") ? "text/html" : asset.endsWith(".js") || asset.endsWith(".mjs") ? "text/javascript" : asset.endsWith(".css") ? "text/css" : asset.endsWith(".webp") ? "image/webp" : asset.endsWith(".png") ? "image/png" : asset.endsWith(".svg") ? "image/svg+xml" : "application/json";
                try { return new WebResourceResponse(type, "UTF-8", 200, "OK", Collections.singletonMap("Cache-Control", "no-cache"), getAssets().open(asset)); }
                catch (Exception e) { return blocked(); }
            }
        });
        web.setWebChromeClient(new WebChromeClient() {
            @Override public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (fileCallback != null) fileCallback.onReceiveValue(null);
                fileCallback = callback;
                Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                intent.setType("application/json");
                startActivityForResult(intent, IMPORT_FILE);
                return true;
            }
        });
        web.addJavascriptInterface(new SaveBridge(), "FarboundAndroid");
        setContentView(web);
        immersive();
        web.loadUrl("https://" + HOST + "/assets/index.html");
    }
    private static WebResourceResponse blocked() {
        return new WebResourceResponse("text/plain", "UTF-8", 404, "Not found", Collections.emptyMap(), new ByteArrayInputStream(new byte[0]));
    }
    private void immersive() {
        web.setSystemUiVisibility(View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY | View.SYSTEM_UI_FLAG_FULLSCREEN | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_LAYOUT_STABLE);
    }
    public final class SaveBridge {
        @JavascriptInterface public void exportSave(String json) {
            if (json == null || json.length() > 500000) return;
            runOnUiThread(() -> {
                pendingExport = json;
                Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                intent.setType("application/json");
                intent.putExtra(Intent.EXTRA_TITLE, "farbound-pilot.json");
                startActivityForResult(intent, EXPORT_FILE);
            });
        }
    }
    @Override protected void onActivityResult(int request, int result, Intent data) {
        super.onActivityResult(request, result, data);
        if (request == IMPORT_FILE && fileCallback != null) {
            fileCallback.onReceiveValue(result == RESULT_OK && data != null ? new Uri[]{data.getData()} : null);
            fileCallback = null;
        }
        if (request == EXPORT_FILE && pendingExport != null) {
            if (result == RESULT_OK && data != null) {
                try (OutputStream out = getContentResolver().openOutputStream(data.getData())) {
                    if (out != null) out.write(pendingExport.getBytes(StandardCharsets.UTF_8));
                    Toast.makeText(this, "Pilot save exported", Toast.LENGTH_SHORT).show();
                } catch (Exception e) { Toast.makeText(this, "Could not export save", Toast.LENGTH_LONG).show(); }
            }
            pendingExport = null;
        }
    }
    @Override public void onWindowFocusChanged(boolean focus) { super.onWindowFocusChanged(focus); if (focus && web != null) immersive(); }
    @Override protected void onPause() { web.evaluateJavascript("window.dispatchEvent(new Event('pagehide'))", null); web.onPause(); super.onPause(); }
    @Override protected void onResume() { super.onResume(); if (web != null) web.onResume(); }
    @Override public void onBackPressed() { web.evaluateJavascript("document.dispatchEvent(new KeyboardEvent('keydown', {key:'Escape',bubbles:true}))", null); }
    @Override protected void onDestroy() { if (fileCallback != null) fileCallback.onReceiveValue(null); web.removeJavascriptInterface("FarboundAndroid"); web.destroy(); super.onDestroy(); }
}

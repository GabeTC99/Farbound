package com.nullharbor.game;

import android.app.Activity;
import android.content.Intent;
import android.content.res.Configuration;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.graphics.PixelFormat;
import android.view.Display;
import android.view.Gravity;
import android.view.Surface;
import android.view.SurfaceHolder;
import android.view.SurfaceView;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.view.WindowManager;
import android.widget.FrameLayout;
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
import java.util.Locale;

/**
 * Offline Nullharbor shell: bundled dist/ assets at a fixed HTTPS origin. No network permission.
 *
 * Fold 2.16.7: Chrome PWA compositor keep-alive did not hold 120 Hz. Native games on the
 * same panel do — they lock the window display mode. Pages PWA cannot call these APIs.
 *
 * JS bridges: NullharborAndroid (preferred) and FarboundAndroid (alias for existing game JS).
 */
public final class MainActivity extends Activity {
    private static final String HOST = "appassets.androidplatform.net";
    private static final String BRIDGE = "NullharborAndroid";
    private static final String BRIDGE_ALIAS = "FarboundAndroid";
    private static final int IMPORT_FILE = 101, EXPORT_FILE = 102;
    private WebView web;
    private final Runnable pauseWeb = () -> { if (web != null) web.onPause(); };
    private View root;
    private SurfaceView rateHint;
    private Surface rateSurface;
    private ValueCallback<Uri[]> fileCallback;
    private String pendingExport;
    private volatile String refreshLockJson = "{\"hz\":0,\"mode\":\"none\"}";
    private float lockedHz = 0f;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        Window window = getWindow();
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        if (Build.VERSION.SDK_INT >= 30) window.setPreferMinimalPostProcessing(true);
        preferHighRefresh();
        web = new WebView(this);
        web.setBackgroundColor(0xFF070D17);
        web.setLayerType(View.LAYER_TYPE_HARDWARE, null);
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
        SaveBridge bridge = new SaveBridge();
        web.addJavascriptInterface(bridge, BRIDGE);
        web.addJavascriptInterface(bridge, BRIDGE_ALIAS);
        rateHint = new SurfaceView(this);
        rateHint.setZOrderOnTop(false);
        rateHint.getHolder().setFormat(PixelFormat.TRANSLUCENT);
        rateHint.getHolder().addCallback(new SurfaceHolder.Callback() {
            @Override public void surfaceCreated(SurfaceHolder holder) {
                rateSurface = holder.getSurface();
                applySurfaceFrameRate(lockedHz > 0 ? lockedHz : 120f);
            }
            @Override public void surfaceChanged(SurfaceHolder holder, int format, int w, int h) {
                rateSurface = holder.getSurface();
                applySurfaceFrameRate(lockedHz > 0 ? lockedHz : 120f);
            }
            @Override public void surfaceDestroyed(SurfaceHolder holder) { rateSurface = null; }
        });
        FrameLayout layout = new FrameLayout(this);
        layout.setBackgroundColor(0xFF070D17);
        FrameLayout.LayoutParams hintLp = new FrameLayout.LayoutParams(1, 1, Gravity.BOTTOM | Gravity.START);
        layout.addView(rateHint, hintLp);
        layout.addView(web, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        root = layout;
        setContentView(layout);
        immersive();
        preferHighRefresh();
        web.loadUrl("https://" + HOST + "/assets/index.html");
    }
    /**
     * Lock this window to the highest refresh mode that matches the current
     * cover/inner resolution. Chrome PWA cannot do this; native games can.
     * preferredDisplayModeId is the heavy switch Android docs reserve for
     * apps that cannot live on Adaptive 60↔120. API 35 also votes HIGH on
     * the WebView / root and reports a content velocity so ARR does not sit
     * on 60 while the ship is coasting.
     */
    private void preferHighRefresh() {
        try {
            Display display = Build.VERSION.SDK_INT >= 30 ? getDisplay() : getWindowManager().getDefaultDisplay();
            if (display == null) {
                refreshLockJson = "{\"hz\":0,\"mode\":\"no-display\"}";
                return;
            }
            Display.Mode current = display.getMode();
            Display.Mode best = current;
            float bestRate = current.getRefreshRate();
            for (Display.Mode mode : display.getSupportedModes()) {
                if (mode.getPhysicalWidth() != current.getPhysicalWidth()) continue;
                if (mode.getPhysicalHeight() != current.getPhysicalHeight()) continue;
                if (mode.getRefreshRate() > bestRate + 0.1f) {
                    best = mode;
                    bestRate = mode.getRefreshRate();
                }
            }
            Window window = getWindow();
            WindowManager.LayoutParams lp = window.getAttributes();
            lp.preferredDisplayModeId = best.getModeId();
            lp.preferredRefreshRate = bestRate;
            window.setAttributes(lp);
            if (Build.VERSION.SDK_INT >= 30) window.setPreferMinimalPostProcessing(true);
            lockedHz = bestRate;
            applySurfaceFrameRate(bestRate);
            if (Build.VERSION.SDK_INT >= 35) {
                window.setFrameRatePowerSavingsBalanced(false);
                voteViewFrameRate(web, bestRate);
                voteViewFrameRate(root, bestRate);
                voteViewFrameRate(rateHint, bestRate);
            }
            refreshLockJson = String.format(Locale.US,
                "{\"hz\":%d,\"modeId\":%d,\"mode\":\"preferredDisplayModeId+setFrameRate\"}",
                Math.round(bestRate), best.getModeId());
        } catch (Throwable e) {
            refreshLockJson = "{\"hz\":0,\"mode\":\"error\"}";
        }
    }
    private static void voteViewFrameRate(View view, float hz) {
        if (view == null || !(hz > 0) || Build.VERSION.SDK_INT < 35) return;
        try {
            view.setRequestedFrameRate(hz);
            view.setFrameContentVelocity(4000f);
        } catch (Throwable ignored) {}
    }
    private void applySurfaceFrameRate(float hz) {
        Surface surface = rateSurface;
        if (surface == null || !surface.isValid() || !(hz > 0) || Build.VERSION.SDK_INT < 30) return;
        try {
            if (Build.VERSION.SDK_INT >= 31) {
                surface.setFrameRate(hz, Surface.FRAME_RATE_COMPATIBILITY_FIXED_SOURCE, Surface.CHANGE_FRAME_RATE_ALWAYS);
            } else {
                surface.setFrameRate(hz, Surface.FRAME_RATE_COMPATIBILITY_FIXED_SOURCE);
            }
        } catch (Throwable ignored) {}
    }
    private static WebResourceResponse blocked() {
        return new WebResourceResponse("text/plain", "UTF-8", 404, "Not found", Collections.emptyMap(), new ByteArrayInputStream(new byte[0]));
    }
    private void immersive() {
        View target = getWindow() != null ? getWindow().getDecorView() : web;
        if (target == null) return;
        target.setSystemUiVisibility(View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY | View.SYSTEM_UI_FLAG_FULLSCREEN | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_LAYOUT_STABLE);
    }
    public final class SaveBridge {
        @JavascriptInterface public String refreshLock() {
            return refreshLockJson;
        }
        @JavascriptInterface public void exportSave(String json) {
            if (json == null || json.length() > 500000) return;
            runOnUiThread(() -> {
                pendingExport = json;
                Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                intent.setType("application/json");
                intent.putExtra(Intent.EXTRA_TITLE, "nullharbor-pilot.json");
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
    @Override public void onWindowFocusChanged(boolean focus) { super.onWindowFocusChanged(focus); if (focus && web != null) { immersive(); preferHighRefresh(); } }
    @Override public void onConfigurationChanged(Configuration config) { super.onConfigurationChanged(config); immersive(); preferHighRefresh(); }
    @Override protected void onPause() {
        if (web != null) {
            web.evaluateJavascript("window.dispatchEvent(new Event('nullharbor-pause'))", null);
            web.removeCallbacks(pauseWeb);
            web.postDelayed(pauseWeb, 70);
        }
        super.onPause();
    }
    @Override protected void onResume() {
        super.onResume();
        if (web != null) {
            web.removeCallbacks(pauseWeb);
            web.onResume();
            preferHighRefresh();
            web.evaluateJavascript("window.dispatchEvent(new Event('nullharbor-resume'))", null);
        }
    }
    @Override public void onBackPressed() { web.evaluateJavascript("document.dispatchEvent(new KeyboardEvent('keydown', {key:'Escape',bubbles:true}))", null); }
    @Override protected void onDestroy() {
        if (fileCallback != null) fileCallback.onReceiveValue(null);
        if (web != null) {
            web.removeCallbacks(pauseWeb);
            web.removeJavascriptInterface(BRIDGE);
            web.removeJavascriptInterface(BRIDGE_ALIAS);
            web.destroy();
        }
        super.onDestroy();
    }
}

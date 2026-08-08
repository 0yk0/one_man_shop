package com.wails.app;

import android.app.Activity;
import android.content.Context;
import android.hardware.display.DisplayManager;
import android.os.Handler;
import android.os.Looper;
import android.util.DisplayMetrics;
import android.util.Log;
import android.view.Display;
import android.webkit.WebView;

import org.json.JSONArray;
import org.json.JSONObject;

/**
 * DisplayBridge provides external display (customer display) support for Android.
 * Exposed to JavaScript as window._displayBridge via addJavascriptInterface.
 *
 * Uses the Presentation API to show the customer display on an external screen
 * connected via USB-C, Miracast, or other display output.
 */
public class DisplayBridge {
    private static final String TAG = "DisplayBridge";

    private final Activity activity;
    private final WebView webView;
    private final Handler mainHandler;
    private CustomerDisplayPresentation presentation;
    private boolean displayOpen = false;

    public DisplayBridge(Activity activity) {
        this.activity = activity;
        this.webView = activity.findViewById(R.id.webview);
        this.mainHandler = new Handler(Looper.getMainLooper());
    }

    /**
     * Get list of external displays available for customer display.
     * Returns JSON array: [{id, name, width, height}]
     * Returns empty array if no external displays are connected.
     */
    @android.webkit.JavascriptInterface
    public String getExternalDisplays() {
        JSONArray result = new JSONArray();

        DisplayManager displayManager = (DisplayManager) activity.getSystemService(Context.DISPLAY_SERVICE);
        if (displayManager == null) {
            Log.w(TAG, "DisplayManager not available");
            return result.toString();
        }

        Display[] displays = displayManager.getDisplays(DisplayManager.DISPLAY_CATEGORY_PRESENTATION);
        for (Display display : displays) {
            try {
                JSONObject obj = new JSONObject();
                obj.put("id", display.getDisplayId());
                obj.put("name", display.getName());

                DisplayMetrics metrics = new DisplayMetrics();
                display.getRealMetrics(metrics);
                obj.put("width", metrics.widthPixels);
                obj.put("height", metrics.heightPixels);

                result.put(obj);
            } catch (Exception e) {
                Log.e(TAG, "Error reading display info", e);
            }
        }

        Log.d(TAG, "Found " + result.length() + " external display(s)");
        return result.toString();
    }

    /**
     * Open the customer display on the first available external display.
     * If no external display is connected, does nothing.
     */
    @android.webkit.JavascriptInterface
    public void openDisplay() {
        if (displayOpen) {
            Log.w(TAG, "Display already open");
            return;
        }

        DisplayManager displayManager = (DisplayManager) activity.getSystemService(Context.DISPLAY_SERVICE);
        if (displayManager == null) {
            notifyError("DisplayManager not available");
            return;
        }

        Display[] displays = displayManager.getDisplays(DisplayManager.DISPLAY_CATEGORY_PRESENTATION);
        if (displays.length == 0) {
            notifyError("No external display connected");
            return;
        }

        // Auto-select the first external display
        Display targetDisplay = displays[0];
        Log.i(TAG, "Opening customer display on: " + targetDisplay.getName() + " (id=" + targetDisplay.getDisplayId() + ")");

        activity.runOnUiThread(() -> {
            try {
                presentation = new CustomerDisplayPresentation(activity, targetDisplay);
                presentation.setOnDismissCallback(() -> {
                    Log.i(TAG, "Presentation dismissed");
                    displayOpen = false;
                    presentation = null;
                    notifyFrontend("onDismiss");
                });
                presentation.show();
                displayOpen = true;
                Log.i(TAG, "Customer display opened successfully");
            } catch (Exception e) {
                Log.e(TAG, "Failed to open display", e);
                displayOpen = false;
                presentation = null;
                notifyError("Failed to open display: " + e.getMessage());
            }
        });
    }

    /**
     * Close the customer display if it's open.
     */
    @android.webkit.JavascriptInterface
    public void closeDisplay() {
        if (!displayOpen || presentation == null) {
            return;
        }

        activity.runOnUiThread(() -> {
            try {
                presentation.dismiss();
            } catch (Exception e) {
                Log.e(TAG, "Error dismissing presentation", e);
            }
            displayOpen = false;
            presentation = null;
            Log.i(TAG, "Customer display closed");
        });
    }

    /**
     * Check if the customer display is currently open.
     */
    @android.webkit.JavascriptInterface
    public boolean isDisplayOpen() {
        return displayOpen;
    }

    /**
     * Clean up resources. Called from MainActivity.onDestroy().
     */
    public void destroy() {
        if (presentation != null) {
            try {
                presentation.dismiss();
            } catch (Exception e) {
                Log.e(TAG, "Error dismissing presentation on destroy", e);
            }
            presentation = null;
            displayOpen = false;
        }
    }

    // ========== Internal helpers ==========

    private void notifyFrontend(String event) {
        if (webView == null) return;
        String js = String.format("window._displayBridge && window._displayBridge.%s && window._displayBridge.%s()",
            event, event);
        mainHandler.post(() -> webView.evaluateJavascript(js, null));
    }

    private void notifyError(String message) {
        if (webView == null) return;
        String escaped = message.replace("'", "\\'").replace("\n", "\\n");
        String js = String.format("window._displayBridge && window._displayBridge.onError && window._displayBridge.onError('%s')",
            escaped);
        mainHandler.post(() -> webView.evaluateJavascript(js, null));
    }
}

package com.wails.app;

import android.app.Presentation;
import android.content.Context;
import android.os.Bundle;
import android.view.Display;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

/**
 * Presentation that shows the customer display on an external screen (USB-C display).
 * 
 * Creates a separate WebView on the external display that loads the
 * customer display route (/#/customer-display) and connects to the same
 * WebSocket server for real-time state updates.
 */
public class CustomerDisplayPresentation extends Presentation {
    
    private WebView webView;
    
    public CustomerDisplayPresentation(Context context, Display display) {
        super(context, display);
    }
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        webView = new WebView(getContext());
        
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                view.loadUrl(url);
                return true;
            }
        });
        
        // Load the customer display page
        // Connects to the same WebSocket server as the main activity
        webView.loadUrl("http://127.0.0.1:9246/#/customer-display");
        
        setContentView(webView);
    }
    
    @Override
    protected void onStop() {
        if (webView != null) {
            webView.onPause();
        }
        super.onStop();
    }
    
    @Override
    protected void onStart() {
        super.onStart();
        if (webView != null) {
            webView.onResume();
        }
    }
    
    /**
     * Get the WebView instance for this presentation.
     */
    public WebView getWebView() {
        return webView;
    }
}

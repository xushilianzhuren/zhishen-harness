package com.zhishen.dsh;

import android.Manifest;
import android.app.Activity;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.PermissionRequest;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

public class MainActivity extends Activity {
    private static final String URL =
        "http://124.156.160.121:8080/?token=zhishen-dsh-g0";
    private static final String URL_MARKET = "https://dsh.market/";
    private static final String URL_SH =
        "http://101.35.222.84:3081/?token=zhishen-dsh-g0";
    private static final int M_GO_MAIN = 1;
    private static final int M_GO_MARKET = 2;
    private static final int M_GO_MAIN_SH = 3;
    private static final int REQ_PERMS = 7;
    private static final int REQ_FILE = 9;
    private static final String CH = "zhishen_dsh";

    private WebView web;
    private ValueCallback<Uri[]> filePathCB;
    private static MainActivity self;

    @Override protected void onCreate(Bundle b) {
        super.onCreate(b);
        self = this;
        askPerms();
        makeChannel();
        web = new WebView(this);
        web.setVisibility(android.view.View.INVISIBLE);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setJavaScriptCanOpenWindowsAutomatically(true);
        s.setUseWideViewPort(true);
        s.setLoadWithOverviewMode(true);
        s.setSupportZoom(true);
        s.setBuiltInZoomControls(true);
        s.setDisplayZoomControls(false);
        s.setSupportMultipleWindows(false);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        s.setUserAgentString(s.getUserAgentString() + " ZhiShenHarness/3.4");
        // v1.8提速三件
        s.setCacheMode(WebSettings.LOAD_DEFAULT);
        try { web.setRendererPriorityPolicy(WebView.RENDERER_PRIORITY_IMPORTANT, true); } catch (Throwable t) {}
        new Thread(new TcpWarm()).start();
        web.addJavascriptInterface(new Bridge(), "ZhiShenBridge");
        web.addJavascriptInterface(new ReconBridge(), "ZKA");
        web.addJavascriptInterface(new BackSignal(this), "ZKBK");
        web.addOnLayoutChangeListener(new EdgeShield(web));
        web.setSystemGestureExclusionRects(new java.util.ArrayList<android.graphics.Rect>());
        web.setWebViewClient(new LocalClient());
        web.setOnTouchListener(new TouchRelay(this));
        web.setWebChromeClient(new LocalChrome());
        web.setBackgroundColor(Color.parseColor("#1a1a2e"));
        setContentView(web);
        if (b == null) web.loadUrl(URL);
    }

    private static final String NOTIFY_SHIM =
        "javascript:(function(){if(window.ZhiShenBridge&&!window.__zsNotifShim){window.__zsNotifShim=1;"
        + "if(!window.Notification){window.Notification=function(t,o){o=o||{};"
        + "window.ZhiShenBridge.notify(String(t),o.body?String(o.body):'');};"
        + "window.Notification.permission='granted';"
        + "window.Notification.requestPermission=function(cb){if(cb)cb('granted');return Promise.resolve('granted');};}"
        + "}})();";

    static class LocalClient extends WebViewClient {
        @Override public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r) {
            return false;
        }
        @Override public void onPageFinished(WebView v, String url) {
            v.evaluateJavascript(
                "(function(){var m=document.querySelector('meta[name=viewport]');"
                + "if(!m){m=document.createElement('meta');m.name='viewport';document.head.appendChild(m);}"
                + "m.content='width=device-width, initial-scale=1, maximum-scale=3, viewport-fit=cover';})()", null);
            v.evaluateJavascript(MOBILE_JS, null);
            v.evaluateJavascript(MODAL_JS, null);
            v.evaluateJavascript(PANEL_JS, null);
            v.evaluateJavascript(DOM_RECON_JS, null);
            android.os.Handler h = new android.os.Handler(android.os.Looper.getMainLooper());
            h.postDelayed(new RevealRun(v), 1600);
            super.onPageFinished(v, url);
        }
    }

    static class RevealRun implements Runnable {
        private final android.webkit.WebView w;
        RevealRun(android.webkit.WebView wv) { w = wv; }
        public void run() { w.setVisibility(android.view.View.VISIBLE); }
    }

    static class ReconBridge {
        @android.webkit.JavascriptInterface public void report(String json) {
            new Thread(new DomPoster(json)).start();
        }
    }

    static class DomPoster implements Runnable {
        private final String body;
        DomPoster(String b) { body = b; }
        public void run() {
            try {
                java.net.URL u = new java.net.URL("http://124.156.160.121:8080/dom");
                java.net.HttpURLConnection hc = (java.net.HttpURLConnection) u.openConnection();
                hc.setRequestMethod("POST"); hc.setDoOutput(true); hc.setConnectTimeout(8000);
                hc.setFixedLengthStreamingMode(body.getBytes("UTF-8").length);
                hc.getOutputStream().write(body.getBytes("UTF-8"));
                hc.getResponseCode(); hc.disconnect();
            } catch (Exception e) {}
        }
    }

    private static final String MOBILE_JS =
        "javascript:(function(){"
        + "if(window.__zkMobile)return;window.__zkMobile=1;"
        + "var css='@media (max-width:700px){html,body{overflow-x:hidden!important}"
        + "div[class*=sidebarCol]{width:100vw!important;max-width:100vw!important}"
        + "div[class*=centerCol]{position:fixed!important;left:100vw!important;top:0!important;width:100vw!important;height:100%!important;transition:left .22s ease!important;z-index:30!important}"
        + "body.zk-chat-open div[class*=centerCol]{left:0!important}"
        + "body.zk-chat-open div[class*=sidebarCol]{visibility:hidden}"
        + "div[class*=composerSeat],div[class*=composerStack]{max-width:100%!important}"
        + "#zkBackBtn{position:fixed;top:12px;left:12px;z-index:999;background:rgba(20,20,30,.78);color:#fff;border:none;border-radius:20px;padding:7px 15px;font-size:14px}"
        + "div[class*=yMCRDG_group]{display:grid!important;grid-template-columns:1fr 1fr!important;gap:10px!important}"
        + "div[class*=yMCRDG_card]{width:100%!important;max-width:100%!important;margin:0!important}"
        + "div[class*=yMCRDG_card] *{max-width:100%!important}"
        + "[class*=_3rC3fW_panel]{display:flex!important;flex-direction:column!important;overflow-y:auto!important}"
        + "[class*=_3rC3fW_nav]{width:100%!important;max-height:64px!important;flex-shrink:0!important;overflow:hidden}"
        + "[class*=_3rC3fW_navList]{display:flex!important;flex-direction:row!important;overflow-x:auto!important;width:100%!important}"
        + "[class*=_3rC3fW_navList]::-webkit-scrollbar{display:none}"
        + "[class*=_3rC3fW_navCell]{flex-shrink:0!important;white-space:nowrap!important;width:auto!important;min-width:0!important;padding:9px 16px!important;justify-content:center!important;gap:6px!important}"
        + "[class*=_3rC3fW_navCell] span{white-space:nowrap!important;display:inline!important;width:auto!important}"
        + "[class*=_3rC3fW_navLabel]{display:none!important}"
        + "[class*=_3rC3fW_content]{width:100%!important;max-width:100%!important;flex:1!important;min-height:0!important;height:auto!important;overflow-y:auto!important;-webkit-overflow-scrolling:touch!important}"
        + "[class*=_3rC3fW_options]{width:100%!important;max-width:100%!important;overflow:visible!important;height:auto!important;max-height:none!important}"
        + "[class*=_3rC3fW_triggerRow]{width:100%!important;max-width:100%!important}"
        + "[class*=_3rC3fW_header]{height:0!important;min-height:0!important;overflow:visible!important;flex:none!important}"
        + "[class*=_3rC3fW_close]{position:fixed!important;top:14px!important;right:14px!important;z-index:9999!important;margin:0!important}"
        + "*{white-space:normal!important;word-break:break-word!important}}';"
        + "var st=document.createElement('style');st.textContent=css;document.head.appendChild(st);"
        + "setInterval(function(){var cc=document.querySelector('div[class*=centerCol]');if(!cc)return;var off=cc.getBoundingClientRect().left>400;if(off&&!document.body.classList.contains('zk-chat-open')&&!window.__zkUserClosed){document.body.classList.add('zk-chat-open');}},1500);"
        + "document.addEventListener('click',function(e){"
        + "var col=document.querySelector(\"div[class*='sidebarCol']\");"
        + "if(col&&col.contains(e.target)){var it=e.target.closest('li,button,a,[role]');"
        + "if(it){document.body.classList.add('zk-chat-open');}}},true);"
        + "var btn=document.createElement('button');btn.id='zkBackBtn';btn.textContent='\\u2190 \\u5217\\u8868';btn.style.display='none';"
        + "btn.addEventListener('click',function(){document.body.classList.remove('zk-chat-open');window.__zkUserClosed=1;});"
        + "document.body.appendChild(btn);"
        + "new MutationObserver(function(){btn.style.display=document.body.classList.contains('zk-chat-open')?'block':'none';}).observe(document.body,{attributes:true,attributeFilter:['class']});"
        + "var sx=0,sy=0;"
        + "document.addEventListener('touchstart',function(e){sx=e.touches[0].clientX;sy=e.touches[0].clientY;},{passive:true});"
        + "document.addEventListener('touchend',function(e){"
        + "var dx=e.changedTouches[0].clientX-sx,dy=e.changedTouches[0].clientY-sy;"
        + "if(dx>90&&Math.abs(dx)>Math.abs(dy)*1.5&&document.body.classList.contains('zk-chat-open')){document.body.classList.remove('zk-chat-open');window.__zkUserClosed=1;}"
        + "},{passive:true});"
        + "})();";

    private static final String DOM_RECON_JS =
        "javascript:(function(){setTimeout(function(){try{"
        + "if(!window.__zkRecon){window.__zkRecon=1;"
        + "var out=[];var els=document.querySelectorAll('*');"
        + "for(var i=0;i<els.length&&i<600;i++){var el=els[i];var r=el.getBoundingClientRect();"
        + "if(r.width<2||r.height<2)continue;"
        + "out.push({t:el.tagName.toLowerCase(),c:(el.className&&el.className.toString?el.className.toString():'').slice(0,50),id:el.id||'',w:Math.round(r.width),h:Math.round(r.height),x:Math.round(r.left),y:Math.round(r.top)});}"
        + "window.ZKA.report('MODAL'+JSON.stringify(out));}"
        + "}catch(e){}},4000);})();"
        + "(function(){setInterval(function(){try{"
        + "var dl=document.querySelectorAll('[class*=overlay] [class*=panel],[role=dialog],dialog');var vis=false;"
        + "for(var i=0;i<dl.length;i++){var r=dl[i].getBoundingClientRect();if(r.width>50)vis=true;}"
        + "if(!vis)return;var now=Date.now();if(window.__zkLast&&now-window.__zkLast<12000)return;window.__zkLast=now;"
        + "var out=[];var els=document.querySelectorAll('*');"
        + "for(var i=0;i<els.length&&i<600;i++){var el=els[i];var r=el.getBoundingClientRect();"
        + "if(r.width<2||r.height<2)continue;"
        + "out.push({t:el.tagName.toLowerCase(),c:(el.className&&el.className.toString?el.className.toString():'').slice(0,50),id:el.id||'',w:Math.round(r.width),h:Math.round(r.height),x:Math.round(r.left),y:Math.round(r.top)});}"
        + "window.ZKA.report('MODAL'+JSON.stringify(out));"
        + "}catch(e){}},6000);})();";
    private static final String MODAL_JS =
        "javascript:(function(){"
        + "if(window.__zkModal)return;window.__zkModal=1;"
        + "function fix(d){if(d.__zkFix)return;d.__zkFix=1;"
        + "d.style.maxWidth='100vw';d.style.width='100vw';"
        + "var kids=[].filter.call(d.children,function(x){return x.tagName==='DIV'||x.tagName==='SECTION';});"
        + "if(kids.length>=2){var p=kids[0].parentElement;"
        + "p.style.display='flex';p.style.flexDirection='column';"
        + "kids[0].style.display='flex';kids[0].style.flexDirection='row';kids[0].style.overflowX='auto';kids[0].style.width='100%';"
        + "kids.forEach(function(k){k.style.maxWidth='100%';k.style.width='100%';});}}"
        + "function scan(){var ds=document.querySelectorAll('[role=dialog],dialog');"
        + "for(var i=0;i<ds.length;i++)fix(ds[i]);}"
        + "new MutationObserver(scan).observe(document.body,{childList:true,subtree:true});"
        + "setTimeout(scan,800);})();";

    private static final String PANEL_JS =
        "javascript:(function(){"
        + "if(window.__zkPanel)return;window.__zkPanel=1;"
        + "function fixPanel(p){if(p.__zkFix)return;p.__zkFix=1;"
        + "p.style.display='flex';p.style.flexDirection='column';p.style.overflowY='auto';"
        + "var kids=[].filter.call(p.children,function(x){var r=x.getBoundingClientRect();return r.width>60&&r.height>40;});"
        + "if(kids.length<1)return;"
        + "var row=kids[kids.length-1];"
        + "row.style.display='flex';row.style.flexDirection='column';row.style.flex='1';"
        + "var cols=[].filter.call(row.children,function(x){var r=x.getBoundingClientRect();return r.width>80;});"
        + "if(cols.length>=2){"
        + "cols.forEach(function(c){c.style.width='100%';c.style.maxWidth='100%';});"
        + "var menu=cols[0];"
        + "menu.style.display='flex';menu.style.flexDirection='row';menu.style.overflowX='auto';"
        + "menu.style.flexShrink='0';menu.style.maxHeight='70px';menu.style.width='100%';"
        + "[].forEach.call(menu.children,function(it){it.style.flexShrink='0';it.style.whiteSpace='nowrap';});}}"
        + "function scan(){var ps=document.querySelectorAll('[class*=_3rC3fW_panel],[class*=overlay] div[class*=panel]');"
        + "for(var i=0;i<ps.length;i++)fixPanel(ps[i]);}"
        + "new MutationObserver(scan).observe(document.body,{childList:true,subtree:true});"
        + "function grid(){var cs=document.querySelectorAll('div[class*=yMCRDG_card]');"
        + "for(var i=0;i<cs.length;i++){var p=cs[i].parentElement;if(p&&!p.__zg){p.__zg=1;p.style.display='grid';p.style.gridTemplateColumns='1fr 1fr';p.style.gap='10px';}}}"
        + "new MutationObserver(function(){scan();grid();}).observe(document.body,{childList:true,subtree:true});"
        + "setInterval(function(){scan();grid();},1500);})();";

    static class LocalChrome extends WebChromeClient {
        @Override public boolean onShowFileChooser(WebView v, ValueCallback<Uri[]> cb,
                FileChooserParams params) {
            MainActivity a = self;
            if (a == null) return false;
            a.filePathCB = cb;
            Intent i = new Intent(Intent.ACTION_GET_CONTENT);
            i.addCategory(Intent.CATEGORY_OPENABLE);
            i.setType("*/*");
            i.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true);
            a.startActivityForResult(Intent.createChooser(i, "\u9009\u62e9\u6587\u4ef6"), REQ_FILE);
            return true;
        }
        @Override public void onPermissionRequest(final PermissionRequest request) {
            final MainActivity a = self;
            if (a == null) { request.deny(); return; }
            a.runOnUiThread(new GrantRun(request));
        }
    }

    static class GrantRun implements Runnable {
        private final PermissionRequest req;
        GrantRun(PermissionRequest r) { req = r; }
        @Override public void run() { req.grant(req.getResources()); }
    }

    static class Bridge {
        @JavascriptInterface public void notify(String title, String body) {
            final MainActivity a = self;
            if (a == null) return;
            NotificationManager nm = (NotificationManager) a.getSystemService(NOTIFICATION_SERVICE);
            android.app.Notification n;
            if (Build.VERSION.SDK_INT >= 26) {
                n = new android.app.Notification.Builder(a, CH)
                        .setContentTitle(title).setContentText(body)
                        .setSmallIcon(android.R.drawable.ic_dialog_info).build();
            } else {
                n = new android.app.Notification.Builder(a)
                        .setContentTitle(title).setContentText(body)
                        .setSmallIcon(android.R.drawable.ic_dialog_info).build();
            }
            try { nm.notify((int) (System.currentTimeMillis() & 0xffff), n); } catch (Exception e) {}
        }
        @JavascriptInterface public void toast(String t) {
            final MainActivity a = self;
            if (a == null) return;
            Toast.makeText(a, t, Toast.LENGTH_SHORT).show();
        }
    }

    public WebView getWeb() { return web; }

    static class TcpWarm implements Runnable {
        public void run() {
            try { java.net.Socket sk = new java.net.Socket();
                sk.connect(new java.net.InetSocketAddress("124.156.160.121", 8080), 3000);
                sk.close(); } catch (Exception e) {}
        }
    }

    private void makeChannel() {
        if (Build.VERSION.SDK_INT >= 26) {
            NotificationChannel ch = new NotificationChannel(CH, "\u667a\u795eHarness",
                NotificationManager.IMPORTANCE_DEFAULT);
            ((NotificationManager) getSystemService(NOTIFICATION_SERVICE)).createNotificationChannel(ch);
        }
    }

    private void askPerms() {
        if (Build.VERSION.SDK_INT >= 23) {
            java.util.List<String> need = new java.util.ArrayList<String>();
            if (checkSelfPermission(Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED)
                need.add(Manifest.permission.RECORD_AUDIO);
            if (Build.VERSION.SDK_INT >= 33 &&
                checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED)
                need.add(Manifest.permission.POST_NOTIFICATIONS);
            if (!need.isEmpty())
                requestPermissions(need.toArray(new String[0]), REQ_PERMS);
        }
    }

    @Override public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus && web != null) web.evaluateJavascript(NOTIFY_SHIM, null);
    }

    @Override protected void onActivityResult(int req, int res, Intent data) {
        if (req == REQ_FILE && filePathCB != null) {
            Uri[] out = null;
            if (res == RESULT_OK && data != null && data.getClipData() != null) {
                android.content.ClipData cl = data.getClipData();
                out = new Uri[cl.getItemCount()];
                for (int i = 0; i < cl.getItemCount(); i++) out[i] = cl.getItemAt(i).getUri();
            } else if (res == RESULT_OK && data != null && data.getData() != null) {
                out = new Uri[]{ data.getData() };
            }
            filePathCB.onReceiveValue(out);
            filePathCB = null;
            return;
        }
        super.onActivityResult(req, res, data);
    }

    @Override protected void onSaveInstanceState(Bundle out) {
        super.onSaveInstanceState(out);
        web.saveState(out);
    }

    @Override public boolean onCreateOptionsMenu(android.view.Menu menu) {
        menu.add(0, M_GO_MARKET, 0, "\u63d2\u4ef6\u5e02\u573a");
        menu.add(0, M_GO_MAIN, 0, "\u4e3b\u754c\u9762");
        menu.add(0, M_GO_MAIN_SH, 0, "\u4e0a\u6d77\u4e3b\u754c\u9762");
        return true;
    }

    @Override public boolean onOptionsItemSelected(android.view.MenuItem item) {
        if (item.getItemId() == M_GO_MARKET) { web.loadUrl(URL_MARKET); return true; }
        if (item.getItemId() == M_GO_MAIN) { web.loadUrl(URL); return true; }
        if (item.getItemId() == M_GO_MAIN_SH) { web.loadUrl(URL_SH); return true; }
        return super.onOptionsItemSelected(item);
    }

    @Override public void onBackPressed() {
        web.evaluateJavascript(
            "(function(){if(document.body.classList.contains('zk-chat-open')){document.body.classList.remove('zk-chat-open');var b=document.getElementById('zkBackBtn');if(b)b.style.display='none';window.ZKBK.onBack('closed');}else{window.ZKBK.onBack('none');}})();", null);
    }

    @Override protected void onDestroy() {
        if (web != null) web.destroy();
        super.onDestroy();
    }
}

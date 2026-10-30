package com.zhishen.dsh;

import android.webkit.JavascriptInterface;
import java.lang.ref.WeakReference;

/** v3.0: 后退裁决信号——JS关聊天页后回报·named classes only(d8坑) */
class BackSignal {
    private final WeakReference act;
    BackSignal(MainActivity a) { act = new WeakReference(a); }

    @JavascriptInterface public void onBack(String result) {
        final MainActivity a = (MainActivity) act.get();
        if (a == null) return;
        if ("closed".equals(result)) return;
        a.runOnUiThread(new BackFollow(a));
    }
}

class BackFollow implements Runnable {
    private final MainActivity a;
    BackFollow(MainActivity a) { this.a = a; }
    public void run() {
        if (a.getWeb() != null && a.getWeb().canGoBack()) a.getWeb().goBack();
        else a.moveTaskToBack(true);
    }
}

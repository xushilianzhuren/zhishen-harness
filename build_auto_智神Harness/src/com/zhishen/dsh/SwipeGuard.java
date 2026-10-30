package com.zhishen.dsh;

import android.view.GestureDetector;
import android.view.MotionEvent;
import android.webkit.WebView;

public class SwipeGuard implements GestureDetector.OnGestureListener {
    private final MainActivity act;
    public SwipeGuard(MainActivity a) { act = a; }
    public boolean onDown(MotionEvent e) { return false; }
    public void onShowPress(MotionEvent e) {}
    public boolean onSingleTapUp(MotionEvent e) { return false; }
    public boolean onScroll(MotionEvent e1, MotionEvent e2, float dx, float dy) { return false; }
    public void onLongPress(MotionEvent e) {}
    public boolean onFling(MotionEvent e1, MotionEvent e2, float vx, float vy) {
        if (e1 == null || e2 == null) return false;
        float dx = e2.getX() - e1.getX(), dy = e2.getY() - e1.getY();
        if (Math.abs(dx) > Math.abs(dy) * 1.2f && Math.abs(dx) > 90f && Math.abs(vx) > 350f) {
            WebView w = act.getWeb();
            if (dx > 0) { if (w != null && w.canGoBack()) w.goBack(); }
            else { if (w != null && w.canGoForward()) w.goForward(); }
            return true;
        }
        return false;
    }
}

package com.zhishen.dsh;

import android.view.GestureDetector;
import android.view.MotionEvent;
import android.view.View;

public class TouchRelay implements View.OnTouchListener {
    private final GestureDetector gd;
    public TouchRelay(MainActivity a) { gd = new GestureDetector(a, new SwipeGuard(a)); }
    public boolean onTouch(View v, MotionEvent ev) { gd.onTouchEvent(ev); return false; }
}

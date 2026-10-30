package com.zhishen.dsh;

import android.graphics.Rect;
import android.view.View;

import java.util.ArrayList;
import java.util.List;

/** v2.2: 屏蔽系统边缘返回手势（左右各150dp·系统上限200dp内）·治"滑一下回手机桌面" */
public class EdgeShield implements View.OnLayoutChangeListener {
    private final View target;
    public EdgeShield(View v) { target = v; }
    public void onLayoutChange(View v, int l, int t, int r, int b, int ol, int ot, int or2, int ob) {
        if (android.os.Build.VERSION.SDK_INT < 29) return;
        int w = r - l, h = b - t;
        if (w <= 0 || h <= 0) return;
        float den = target.getResources().getDisplayMetrics().density;
        int ew = (int) (150 * den);
        if (ew * 2 > w) ew = w / 3;
        List<Rect> rects = new ArrayList<Rect>();
        rects.add(new Rect(0, 0, ew, h));
        rects.add(new Rect(w - ew, 0, w, h));
        target.setSystemGestureExclusionRects(rects);
    }
}

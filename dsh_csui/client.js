window.__ModuleLoader__.load({
        id: "@local/dsh-chat-search-ui",
        factory: (require) => {
                var module = { exports: {} };
                var exports = module.exports;
                Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
                let react = require("react");
                const PANEL_ID = "chat-search";
                const El = react.createElement;

                /* 全文阅读器（导出/搜索命中共用·弹窗可滚可复制可下载） */
                function openTextViewer(text, sid, highlights, msgs) {
                        if (text === null || text === undefined) {
                                fetch("/chatsearch/api", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ method: "export", args: { sid } }) })
                                        .then((r) => r.json()).then((d) => { if (d.ok) openTextViewer(d.result.text, sid, highlights, d.result.msgs); else toast("导出失败"); }).catch(() => toast("导出失败"));
                                return;
                        }
                        if (!msgs) {
                                const looksJsonl2 = String(text).trimStart().startsWith('{"type"');
                                msgs = looksJsonl2 ? parseConv(text) : ( /^\[[a-z]+\/message\] /.test(String(text).trimStart()) ? parseBlocks(text) : null);
                        }
                        const old = document.getElementById("csui-viewer");
                        if (old) old.remove();
                        const ov = document.createElement("div"); ov.id = "csui-viewer";
                        ov.style.cssText = "position:fixed;inset:0;z-index:2147480003;background:rgba(0,0,0,.5);display:flex;align-items:stretch;justify-content:center";
                        const box = document.createElement("div");
                        box.style.cssText = "background:#1e1e1e;color:#eee;margin:24px 8px;border-radius:14px;display:flex;flex-direction:column;flex:1;max-width:720px;overflow:hidden;box-shadow:0 6px 24px rgba(0,0,0,.6)";
                        const head = document.createElement("div");
                        head.style.cssText = "display:flex;align-items:center;gap:8px;padding:10px 12px;border-bottom:1px solid #8883";
                        const title = document.createElement("div");
                        title.style.cssText = "flex:1;font-size:12px;color:#999;font-family:monospace;overflow:hidden;text-overflow:ellipsis";
                        title.textContent = sid || "导出";
                        const mkBtn = (label, fn, primary) => {
                                const b = document.createElement("button");
                                b.textContent = label;
                                b.style.cssText = "font-size:13px;padding:6px 12px;border-radius:9px;border:1px solid #8886;background:" + (primary ? "#8c1f28" : "transparent") + ";color:#fff";
                                b.onclick = (ev) => { try { fn(ev); } catch (err) { toast("钮错误:" + String(err).slice(0, 70)); } }; return b;
                        };
                        head.appendChild(title);
                        head.appendChild(mkBtn("📋 复制全文", () => {
                                const fallback = () => {
                                        try {
                                                const ta = document.createElement("textarea");
                                                ta.value = text; ta.style.cssText = "position:fixed;top:0;left:0;opacity:0.01";
                                                document.body.appendChild(ta);
                                                ta.focus(); ta.setSelectionRange(0, ta.value.length);
                                                const ok = document.execCommand("copy");
                                                ta.remove();
                                                if (ok) toast("✅已复制");
                                                else toast("复制失败·请长按正文选字复制");
                                        } catch (e) { toast("复制失败·请长按正文选字复制"); }
                                };
                                if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(() => toast("✅已复制"), fallback);
                                else fallback();
                        }));
                        head.appendChild(mkBtn("⬇ 下载", () => { dl(buildText("txt"), "txt", sid || "export"); toast("已尝试下载·若文件管理器没有·用复制全文"); }));
                        head.appendChild(mkBtn("📤 出下载链", () => {
                                toast("存服务器中…");
                                fetch("/chatsearch/api", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ method: "save", args: { sid: sid || "export", text: buildText("txt") } }) })
                                        .then((r) => r.json()).then((d) => {
                                                if (!d.ok) { toast("存服务器失败:" + (d.error || "?")); return; }
                                                const url = location.origin + "/chatsearch/file/" + d.result.file;
                                                const fallback2 = () => {
                                                        try {
                                                                const ta = document.createElement("textarea");
                                                                ta.value = url; ta.style.cssText = "position:fixed;top:0;left:0;opacity:0.01";
                                                                document.body.appendChild(ta); ta.focus(); ta.setSelectionRange(0, ta.value.length);
                                                                document.execCommand("copy"); ta.remove();
                                                        } catch (e) {}
                                                };
                                                if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(() => toast("✅链接已复制·用系统浏览器打开即下载"), fallback2);
                                                else { fallback2(); toast("链接已复制·用系统浏览器打开即下载"); }
                                                window.open(url, "_blank");
                                        }).catch((e) => toast("存服务器失败:" + String(e).slice(0, 50)));
                        }));
                        head.appendChild(mkBtn("✖", () => ov.remove()));
                        /* 工具行：内搜+上下条 · 导出格式三选 */
                        const tools = document.createElement("div");
                        tools.style.cssText = "display:flex;align-items:center;gap:6px;padding:8px 12px;border-bottom:1px solid #8883;flex-wrap:wrap";
                        const sInp = document.createElement("input");
                        sInp.placeholder = "文内搜索…";
                        sInp.style.cssText = "flex:1;min-width:100px;padding:5px 10px;border-radius:8px;border:1px solid #8886;background:transparent;color:#eee;font-size:13px;outline:none";
                        const cnt = document.createElement("span");
                        cnt.style.cssText = "font-size:11px;color:#999;min-width:44px;text-align:center";
                        const buildText = (fmt) => {
                                if (!msgs || !msgs.length) return text;
                                const list = msgs.map((m) => ({ role: m.role === "user" ? "🧑 我" : "🤖 器灵", ts: m.ts ? new Date(m.ts).toLocaleString("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "", text: m.text }));
                                if (fmt === "json") return JSON.stringify(list, null, 2);
                                if (fmt === "md") return "# " + (sid || "会话") + "\n\n" + list.map((m) => "## " + m.role + (m.ts ? " · " + m.ts : "") + "\n\n" + m.text).join("\n\n---\n\n") + "\n";
                                return list.map((m) => m.role + (m.ts ? " " + m.ts : "") + "\n" + m.text).join("\n\n────\n\n");
                                if (fmt === "json") return JSON.stringify(msgs, null, 2);
                                if (fmt === "md") return "# " + (sid || "会话") + "\n\n" + msgs.map((m) => "## " + m.role + (m.ts ? " · " + m.ts : "") + "\n\n" + m.text).join("\n\n---\n\n") + "\n";
                                return msgs.map((m) => m.role + (m.ts ? " " + m.ts : "") + "\n" + m.text).join("\n\n────\n\n");
                        };
                        let marks = [], mIdx = -1;
                        const clearMarks = () => {
                                marks.forEach((m) => { const p = m.parentNode; if (p) { p.replaceChild(document.createTextNode(m.textContent), m); p.normalize(); } });
                                marks = []; mIdx = -1; cnt.textContent = "";
                        };
                        const nav = (dir) => {
                                if (!marks.length) return;
                                mIdx = (mIdx + dir + marks.length) % marks.length;
                                marks.forEach((m) => { m.style.background = "#5a3320"; m.style.color = "#fff"; });
                                const cur = marks[mIdx];
                                cur.style.background = "#c0392b";
                                cur.scrollIntoView({ block: "center" });
                                cnt.textContent = (mIdx + 1) + "/" + marks.length;
                        };
                        const doFind = () => {
                                clearMarks();
                                const q = sInp.value.trim();
                                if (!q) return;
                                const walker = document.createTreeWalker(body, NodeFilter.SHOW_TEXT, null);
                                const nodes = [];
                                let n;
                                while ((n = walker.nextNode())) if (n.nodeValue.toLowerCase().includes(q.toLowerCase())) nodes.push(n);
                                nodes.forEach((node) => {
                                        const frag = document.createDocumentFragment();
                                        let rest = node.nodeValue, low = rest.toLowerCase(), ql = q.toLowerCase(), i;
                                        while ((i = low.indexOf(ql)) >= 0) {
                                                if (i > 0) frag.appendChild(document.createTextNode(rest.slice(0, i)));
                                                const mk = document.createElement("mark");
                                                mk.className = "csui-mk"; mk.textContent = rest.slice(i, i + q.length);
                                                mk.style.cssText = "background:#5a3320;color:#fff;border-radius:3px;padding:0 1px";
                                                frag.appendChild(mk); marks.push(mk);
                                                rest = rest.slice(i + q.length); low = rest.toLowerCase();
                                        }
                                        if (rest) frag.appendChild(document.createTextNode(rest));
                                        node.parentNode.replaceChild(frag, node);
                                });
                                if (marks.length) nav(1); else cnt.textContent = "无命中";
                        };
                        const mkT = (label, fn) => {
                                const b = document.createElement("button");
                                b.textContent = label;
                                b.style.cssText = "font-size:12px;padding:4px 10px;border-radius:8px;border:1px solid #8886;background:transparent;color:#eee";
                                b.onclick = (ev) => { try { fn(ev); } catch (err) { toast("钮错误:" + String(err).slice(0, 70)); } }; return b;
                        };
                        tools.appendChild(sInp);
                        tools.appendChild(mkT("↑", () => nav(-1)));
                        tools.appendChild(mkT("↓", () => nav(1)));
                        tools.appendChild(cnt);
                        tools.appendChild(mkT("⬇txt", () => dl(buildText("txt"), "txt")));
                        tools.appendChild(mkT("⬇md", () => dl(buildText("md"), "md")));
                        tools.appendChild(mkT("⬇json", () => dl(buildText("json"), "json")));
                        sInp.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); nav(1); } });
                        sInp.addEventListener("input", () => { clearTimeout(sInp._t); sInp._t = setTimeout(doFind, 350); });
                        const body = document.createElement("div");
                        body.style.cssText = "flex:1;overflow:auto;padding:12px 14px;font-size:13px;line-height:1.55;white-space:pre-wrap;word-break:break-all;font-family:monospace";
                        const hlSet = (highlights || []).map((l) => l.replace(/^\d+:/, "").slice(0, 60));
                        const looksJsonl = String(text).trimStart().startsWith('{"type"');
                        const looksRepr = /^\[[a-z]+\/message\] /.test(String(text).trimStart());
                        if (msgs && msgs.length) {
                                msgs = msgs.map((m) => ({ role: m.role === "user" ? "🧑 我" : "🤖 器灵", ts: m.ts ? new Date(m.ts).toLocaleString("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "", text: m.text }));
                                body.style.fontFamily = "sans-serif";
                                msgs.forEach((m) => {
                                        const blk = document.createElement("div");
                                        blk.style.cssText = "margin:10px 0;padding:8px 10px;border-radius:10px;background:" + (m.role.indexOf("我") >= 0 ? "#26324a" : "#2a2a2a");
                                        const hd = document.createElement("div");
                                        hd.style.cssText = "font-size:11px;color:#8aa;margin-bottom:4px";
                                        hd.textContent = m.role + (m.ts ? " · " + m.ts : "");
                                        const tx = document.createElement("div");
                                        tx.style.cssText = "font-size:13px;line-height:1.55;white-space:pre-wrap;word-break:break-all";
                                        tx.textContent = m.text;
                                        blk.appendChild(hd); blk.appendChild(tx);
                                        if (hlSet.length && hlSet.some((hl) => m.text.includes(hl))) { blk.style.outline = "1px solid #b76e79"; blk.dataset.hl = "1"; }
                                        body.appendChild(blk);
                                });
                        } else if (looksJsonl || looksRepr) {
                                const msgs2 = looksJsonl ? parseConv(text) : parseBlocks(text);
                                body.style.fontFamily = "sans-serif";
                                if (!msgs2.length) body.textContent = "(无可读文本)";
                                msgs2.forEach((m, i) => {
                                        const blk = document.createElement("div");
                                        blk.style.cssText = "margin:10px 0;padding:8px 10px;border-radius:10px;background:" + (m.role.indexOf("我") >= 0 ? "#26324a" : "#2a2a2a");
                                        const hd = document.createElement("div");
                                        hd.style.cssText = "font-size:11px;color:#8aa;margin-bottom:4px";
                                        hd.textContent = m.role + (m.ts ? " · " + m.ts : "");
                                        const tx = document.createElement("div");
                                        tx.style.cssText = "font-size:13px;line-height:1.55;white-space:pre-wrap;word-break:break-all";
                                        tx.textContent = m.text;
                                        blk.appendChild(hd); blk.appendChild(tx);
                                        if (hlSet.length && hlSet.some((hl) => m.text.includes(hl))) { blk.style.outline = "1px solid #b76e79"; blk.dataset.hl = "1"; }
                                        body.appendChild(blk);
                                });
                        } else if (hlSet.length) {
                                const frags = String(text).split("\n");
                                frags.forEach((line, i) => {
                                        const d = document.createElement("div");
                                        d.textContent = line;
                                        if (line && hlSet.some((hl) => line.includes(hl))) { d.style.background = "#5a3320"; d.style.borderRadius = "4px"; d.dataset.hl = "1"; }
                                        body.appendChild(d);
                                        if (i % 400 === 399) body.appendChild(document.createElement("div"));
                                });
                        } else body.textContent = String(text);
                        box.appendChild(head); box.appendChild(tools); box.appendChild(body);
                        ov.appendChild(box);
                        ov.addEventListener("click", (e) => { if (e.target === ov) ov.remove(); });
                        document.body.appendChild(ov);
                        const first = body.querySelector('[data-hl="1"]');
                        if (first) first.scrollIntoView({ block: "center" });
                }
                function toast(msg) {
                        const t = document.createElement("div");
                        t.textContent = msg;
                        t.style.cssText = "position:fixed;left:50%;bottom:40%;transform:translateX(-50%);background:rgba(30,30,30,.85);color:#fff;padding:8px 18px;border-radius:10px;font-size:14px;z-index:2147480004;pointer-events:none";
                        document.body.appendChild(t);
                        setTimeout(() => t.remove(), 1600);
                }
                function dl(content, ext, name) {
                        const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
                        const a = document.createElement("a");
                        a.href = URL.createObjectURL(blob); a.download = (name || "export") + "." + ext; a.click();
                }
                /* jsonl会话→对话体（从头阅读/导出pretty共用） */
                function parseConv(text) {
                        const out = [];
                        String(text).split("\n").forEach((line) => {
                                if (!line.trim()) return;
                                let j; try { j = JSON.parse(line); } catch (e) { return; }
                                const ty = String(j.type || "");
                                if (!/\/message$/.test(ty)) return;
                                if (/^(system|developer)\//.test(ty)) return;
                                const d = j.data || {};
                                const items = d.content || (d.message && d.message.content) || [];
                                const parts = [];
                                (Array.isArray(items) ? items : []).forEach((it) => {
                                        if (it && it.type === "text" && it.text) parts.push(it.text);
                                });
                                if (!parts.length) return;
                                const ts = j.time ? new Date(j.time).toLocaleString("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "";
                                out.push({ role: /user/.test(ty) ? "🧑 我" : "🤖 器灵", ts, text: parts.join("\n") });
                        });
                        return out;
                }

                /* export文本([user/message]{...} Python-repr风格)→对话块 */
                function parseBlocks(text) {
                        const out = [];
                        const parts = String(text).split(/\n(?=\[[a-z]+\/message\] )/);
                        parts.forEach((blk) => {
                                const m = blk.match(/^\[([a-z]+)\/message\] /);
                                if (!m) return;
                                const ty = m[1];
                                if (ty === "system" || ty === "developer") return;
                                const texts = [];
                                const rx = /'text': '((?:[^'\\]|\\.)*)'/g;
                                let mm;
                                while ((mm = rx.exec(blk))) texts.push(mm[1]);
                                if (!texts.length) return;
                                const body2 = texts.join("\n").replace(/\\n/g, "\n").replace(/\\'/g, "'").replace(/\\\\/g, "\\");
                                out.push({ role: ty === "user" ? "🧑 我" : "🤖 器灵", ts: "", text: body2 });
                        });
                        return out;
                }

                function RailIcon() {
                        return El("div", { style: { fontSize: "16px", lineHeight: "1" } }, "\u{1F50D}");
                }

                function HitCard(h) {
                        const kids = [];
                        kids.push(El("div", { key: "hd", style: { display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#999" } },
                                El("span", { style: { fontFamily: "monospace" } }, h.sid.slice(0, 13) + "…"),
                                El("span", null, h.mtime)));
                        h.lines.forEach((l, i) => {
                                kids.push(El("div", { key: "l" + i, style: { fontSize: "13px", margin: "4px 0", whiteSpace: "pre-wrap", wordBreak: "break-all" } }, l));
                        });
                        kids.push(El("div", { key: "go", style: { fontSize: "11px", color: "#b76e79", marginTop: "6px" } }, "点击查看全文·命中行已高亮 ↗"));
                        return El("div", { onClick: () => h.onOpen && h.onOpen(h), style: { border: "1px solid #8883", borderRadius: "10px", padding: "10px 12px", margin: "6px 0", cursor: "pointer" } }, ...kids);
                }

                function Panel(props) {
                        const q0 = react.useState(""); const q = q0[0]; const setQ = q0[1];
                        const r0 = react.useState(null); const res = r0[0]; const setRes = r0[1];
                        const b0 = react.useState(false); const busy = b0[0]; const setBusy = b0[1];
                        const t0 = react.useState("search"); const tab = t0[0]; const setTab = t0[1];
                        const l0 = react.useState(null); const sessions = l0[0]; const setSessions = l0[1];
                        const m0 = react.useState(false); const selMode = m0[0]; const setSelMode = m0[1];
                        const s1 = react.useState({}); const selMap = s1[0]; const setSelMap = s1[1];
                        const pg0 = react.useState(""); const prog = pg0[0]; const setProg = pg0[1];

                        const batchExport = async (fmt) => {
                                const sids = Object.keys(selMap).filter((k) => selMap[k]);
                                if (!sids.length) { toast("先勾选会话"); return; }
                                const parts = [], toc = [];
                                for (let i = 0; i < sids.length; i++) {
                                        setProg("导出中 " + (i + 1) + "/" + sids.length);
                                        try {
                                                const r = await fetch("/chatsearch/api", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ method: "export", args: { sid: sids[i] } }) });
                                                const d = await r.json();
                                                if (d.ok && d.result.text) {
                                                        const raw = String(d.result.text);
                                                        const msgs = raw.trimStart().startsWith('{"type"') ? parseConv(raw) : parseBlocks(raw);
                                                        toc.push((i + 1) + ". " + sids[i].slice(8, 24) + "…（" + (msgs.length || "?") + "条）");
                                                        const bodyTxt = msgs.length ? msgs.map((m) => m.role + (m.ts ? " " + m.ts : "") + "\n" + m.text).join("\n\n") : raw;
                                                        parts.push("\n\n────── 第" + (i + 1) + "册 · " + sids[i] + " ──────\n\n" + bodyTxt);
                                                }
                                        } catch (e) {}
                                }
                                setProg("");
                                if (!parts.length) { toast("所选会话都是空会话(0KB)·无可导出"); return; }
                                const head = "# 智神会话合集\n\n## 目录\n\n" + toc.join("\n") + "\n";
                                const body = head + parts.join("") + "\n";
                                if (fmt === "json") {
                                        dl(JSON.stringify({ toc: toc, count: parts.length }, null, 2) + "\n", "json", "zhishen-heji");
                                        toast("已出目录json·全文走md");
                                        return;
                                }
                                openTextViewer(body, "zhishen-heji-" + sids.length + "册", []);
                                fetch("/chatsearch/api", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ method: "save", args: { sid: "zhishen-heji", text: body } }) })
                                        .then((r) => r.json()).then((d) => {
                                                if (!d.ok) return;
                                                const url = location.origin + "/chatsearch/file/" + d.result.file;
                                                try {
                                                        const ta = document.createElement("textarea");
                                                        ta.value = url; ta.style.cssText = "position:fixed;top:0;left:0;opacity:0.01";
                                                        document.body.appendChild(ta); ta.focus(); ta.setSelectionRange(0, ta.value.length);
                                                        document.execCommand("copy"); ta.remove();
                                                        toast("✅合集已存·下载链接已复制");
                                                } catch (e) { toast("✅合集已存·去阅读器看出链"); }
                                        }).catch(() => {});
                        };

                        const search = async () => {
                                if (!q.trim() || busy) return;
                                setBusy(true);
                                try {
                                        const r = await fetch("/chatsearch/api", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ method: "search", args: { query: q } }) });
                                        const data = await r.json();
                                        if (data.ok) setRes(data.result); else setRes({ error: data.error });
                                } catch (e) { setRes({ error: String(e) }); }
                                setBusy(false);
                        };
                        const loadSessions = async () => {
                                setBusy(true);
                                try {
                                        const r = await fetch("/chatsearch/api", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ method: "list", args: {} }) });
                                        const data = await r.json();
                                        if (data.ok) setSessions(data.result.sessions);
                                } catch (e) {}
                                setBusy(false);
                        };
                        const doExport = async (sid0) => {
                                try {
                                        const sid = /^session-/.test(sid0) ? sid0 : "session-" + sid0;
                                        const r = await fetch("/chatsearch/api", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ method: "export", args: { sid } }) });
                                        const data = await r.json();
                                        if (data.ok) openTextViewer(data.result.text, sid, [], data.result.msgs);
                                        else toast("导出失败:" + (data.error || "?") + "(" + r.status + ")");
                                } catch (e) { toast("导出失败:" + String(e).slice(0, 60)); }
                        };
                        const openHit = async (h) => {
                                const snip = ((h.lines && h.lines[0]) || "").replace(/^🧑我：|^🤖器灵：/, "");
                                try {
                                        const okJump = await jumpToMessage(h.sid, snip);
                                        if (okJump) return;
                                } catch (e) {}
                                try {
                                        const r = await fetch("/chatsearch/api", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ method: "export", args: { sid: h.sid } }) });
                                        const data = await r.json();
                                        if (data.ok) openTextViewer(data.result.text, h.sid, h.lines);
                                        else toast("导出失败");
                                } catch (e) { toast("导出失败"); }
                        };
                        const getPins = () => { try { return JSON.parse(localStorage.getItem("csui_pins") || "[]"); } catch (e) { return []; } };
                        const isPinned = (sid) => getPins().includes(sid);
                        const togglePin = (sid) => {
                                try {
                                        let pins = getPins();
                                        pins = pins.includes(sid) ? pins.filter(x => x !== sid) : pins.concat([sid]);
                                        localStorage.setItem("csui_pins", JSON.stringify(pins));
                                        if (sessions) {
                                                const sorted = [...sessions].sort((a, b) => (isPinned(b.sid) ? 1 : 0) - (isPinned(a.sid) ? 1 : 0));
                                                setSessions(sorted);
                                        }
                                } catch (e) {}
                        };

                        const kids = [];
                        kids.push(El("div", { key: "bar", style: { display: "flex", gap: "8px", marginBottom: "8px" } },
                                El("input", { value: q, placeholder: "搜索所有历史会话…", onChange: (e) => setQ(e.target.value), onKeyDown: (e) => { if (e.key === "Enter" && tab === "search") search(); }, style: { flex: 1, padding: "8px 12px", borderRadius: "10px", border: "1px solid #8886", background: "transparent", color: "inherit", fontSize: "14px", outline: "none" } }),
                                El("button", { onClick: search, disabled: busy, style: { padding: "8px 16px", borderRadius: "10px", border: "none", background: "#8c1f28", color: "#fff", fontSize: "13px" } }, busy ? "…" : "搜索")));
                        kids.push(El("div", { key: "tabs", style: { display: "flex", gap: "6px", marginBottom: "10px" } },
                                El("button", { onClick: () => setTab("search"), style: { fontSize: "12px", padding: "4px 14px", borderRadius: "99px", border: "1px solid " + (tab === "search" ? "#8c1f28" : "#8886"), background: tab === "search" ? "#8c1f28" : "transparent", color: tab === "search" ? "#fff" : "inherit" } }, "🔍 搜索"),
                                El("button", { onClick: () => { setTab("manage"); if (!sessions) loadSessions(); }, style: { fontSize: "12px", padding: "4px 14px", borderRadius: "99px", border: "1px solid " + (tab === "manage" ? "#8c1f28" : "#8886"), background: tab === "manage" ? "#8c1f28" : "transparent", color: tab === "manage" ? "#fff" : "inherit" } }, "📂 会话管理"),
                                El("span", { style: { fontSize: "11px", color: "#b76e79", alignSelf: "center" } }, "V3.2")));

                        if (tab === "search") {
                                if (res === null) {
                                        kids.push(El("div", { key: "hint", style: { color: "#999", fontSize: "13px", marginTop: "12px" } }, "输入关键词·搜索全部历史会话（含压缩存档全文）"));
                                } else if (res.error) {
                                        kids.push(El("div", { key: "err", style: { color: "#c04040", fontSize: "13px" } }, "出错：" + res.error));
                                } else if (res.hits.length === 0) {
                                        kids.push(El("div", { key: "none", style: { color: "#999", fontSize: "13px" } }, "在 " + res.total + " 个会话中无命中——换同义词再试"));
                                } else {
                                        kids.push(El("div", { key: "meta", style: { fontSize: "12px", color: "#999", margin: "4px 0 10px" } }, "命中 " + res.hits.length + "/" + res.total + " 个会话"));
                                        res.hits.forEach((h) => { kids.push(El(HitCard, { key: h.sid, onOpen: openHit, ...h })); });
                                }
                        } else {
                                if (sessions === null) {
                                        kids.push(El("div", { key: "ld", style: { color: "#999", fontSize: "13px", marginTop: "12px" } }, "加载中…"));
                                } else {
                                        kids.push(El("div", { key: "mn", style: { fontSize: "12px", color: "#999", margin: "4px 0 10px" } }, "共 " + sessions.length + " 个会话 · 📌置顶 | ⬇导出txt"));
                                        kids.push(El("div", { key: "bt", style: { display: "flex", gap: "6px", margin: "0 0 8px", flexWrap: "wrap" } },
                                                El("button", { onClick: () => { setSelMode(!selMode); if (selMode) setSelMap({}); }, style: { fontSize: "11px", padding: "4px 12px", borderRadius: "8px", border: "1px solid #8886", background: selMode ? "#8c1f28" : "transparent", color: "inherit" } }, selMode ? "✕退出多选" : "☑ 多选导出"),
                                                selMode ? El("button", { onClick: () => batchExport("md"), style: { fontSize: "11px", padding: "4px 12px", borderRadius: "8px", border: "1px solid #8886", background: "transparent", color: "inherit" } }, "📚 合并导出md(" + Object.values(selMap).filter(Boolean).length + ")") : null,
                                                selMode ? El("button", { onClick: () => batchExport("json"), style: { fontSize: "11px", padding: "4px 12px", borderRadius: "8px", border: "1px solid #8886", background: "transparent", color: "inherit" } }, "🗂 目录json") : null,
                                                prog ? El("span", { key: "pg", style: { fontSize: "11px", color: "#b76e79", alignSelf: "center" } }, prog) : null));
                                        sessions.forEach((sess) => {
                                                kids.push(El("div", { key: sess.sid, style: { display: "flex", alignItems: "center", gap: "8px", border: "1px solid #8883", borderRadius: "10px", padding: "8px 12px", margin: "5px 0" } },
                                                        El("span", { style: { fontFamily: "monospace", fontSize: "12px", flex: 1, overflow: "hidden", textOverflow: "ellipsis" } }, (isPinned(sess.sid) ? "📌 " : "") + sess.sid.slice(8, 20) + "… · " + sess.mtime + " · " + (sess.size / 1024).toFixed(0) + "KB"),
                                                        El("button", { onClick: () => togglePin(sess.sid), style: { fontSize: "11px", padding: "2px 10px", borderRadius: "8px", border: "1px solid #8886", background: "transparent", color: "inherit" } }, isPinned(sess.sid) ? "取消置顶" : "置顶"),
                                                        El("button", { onClick: () => doExport(sess.sid), style: { fontSize: "11px", padding: "2px 10px", borderRadius: "8px", border: "1px solid #8886", background: "transparent", color: "inherit" } }, "⬇ 导出"),
                                                        selMode ? El("button", { onClick: () => setSelMap((m) => ({ ...m, [sess.sid]: !m[sess.sid] })), style: { fontSize: "11px", padding: "2px 10px", borderRadius: "8px", border: "1px solid #8886", background: selMap[sess.sid] ? "#8c1f28" : "transparent", color: "inherit" } }, selMap[sess.sid] ? "☑已选" : "☐选") : null));
                                        });
                                }
                        }
                        return El("div", { style: { padding: "16px", height: "100%", overflow: "auto", boxSizing: "border-box" } }, ...kids);
                }

                const sleepMs = (ms) => new Promise((r) => setTimeout(r, ms));
                /* 搜索直达原对话：切会话→翻页找那条→高亮 */
                async function jumpToMessage(sid, snippet) {
                        const key = "session:" + String(sid).replace(/^session-/, "");
                        toast("直达原对话…");
                        let row = document.querySelector('[data-row-key="' + key + '"]');
                        if (!row) {
                                const opener = [...document.querySelectorAll("button,[role=button],div,span")].find((e) => {
                                        if (!e.offsetWidth && !e.offsetHeight) return false;
                                        const t = (e.textContent || "").trim();
                                        return t.length < 8 && /会话|列表/.test(t) && e.closest("#csui-viewer,#csui-menu") === null;
                                });
                                if (opener) opener.click();
                                for (let i = 0; i < 12 && !row; i++) { await sleepMs(300); row = document.querySelector('[data-row-key="' + key + '"]'); }
                        }
                        if (!row) { openTextViewer(null, sid, [snippet]); return false; }
                        row.click();
                        await sleepMs(1200);
                        const findTurn = () => [...document.querySelectorAll("[data-chat-turn]")].find((el) => (el.innerText || "").replace(/\s+/g, " ").includes(snippet.replace(/\s+/g, " ").slice(0, 40)));
                        let target = findTurn();
                        let rounds = 0;
                        while (!target && rounds < 25) {
                                const sc = document.querySelector("[data-conversation-scroll]");
                                if (!sc) break;
                                sc.scrollTo({ top: 0, behavior: "auto" });
                                const btn = [...document.querySelectorAll("button,[role=button],div,span")].find((e) => {
                                        if (!e.offsetWidth && !e.offsetHeight) return false;
                                        const t = (e.textContent || "").trim();
                                        return /加载更早/.test(t) && t.length < 30;
                                });
                                if (!btn) break;
                                btn.click();
                                await sleepMs(900);
                                target = findTurn();
                                rounds++;
                        }
                        if (!target) { openTextViewer(null, sid, [snippet]); return false; }
                        target.scrollIntoView({ block: "center" });
                        target.style.transition = "outline 0.3s";
                        target.style.outline = "3px solid #c0392b";
                        setTimeout(() => { target.style.outline = ""; }, 4000);
                        toast("✅已跳到命中处");
                        return true;
                }

                /* ── SessionTools V1（2026-10-30）：快跳条+原生会话行长按菜单 ── */
                function installSessionTools() {
                        if (window.__csuiToolsInstalled) return;
                        window.__csuiToolsInstalled = true;
                        /* 强拆旧缓存：卸载SW+清cache存储（对治webview吃旧JS） */
                        try {
                                if (navigator.serviceWorker) navigator.serviceWorker.getRegistrations().then((rs) => rs.forEach((r) => r.unregister())).catch(() => {});
                                if (window.caches && caches.keys) caches.keys().then((ks) => ks.forEach((k) => caches.delete(k))).catch(() => {});
                        } catch (e) {}
                        const st = document.createElement("style"); st.id = "csui-tools-style";
                        st.textContent = [
                                "#csui-qbar{position:fixed;right:6px;bottom:140px;z-index:2147480000;display:flex;flex-direction:column;gap:6px;opacity:.85}",
                                "#csui-qbar button{width:38px;height:38px;border-radius:50%;border:1px solid #8886;background:rgba(30,30,30,.72);color:#fff;font-size:15px;line-height:1;padding:0;touch-action:manipulation}",
                                "#csui-menu{position:fixed;inset:0;z-index:2147480001;background:rgba(0,0,0,.35);display:flex;align-items:flex-end;justify-content:center}",
                                "#csui-menu .card{background:#1e1e1e;color:#fff;border-radius:14px;padding:10px 14px;margin-bottom:120px;min-width:200px;box-shadow:0 4px 18px rgba(0,0,0,.5)}",
                                "#csui-menu .card button{display:block;width:100%;padding:12px 10px;margin:4px 0;border:none;border-radius:10px;background:transparent;color:#fff;font-size:15px;text-align:left}",
                                ".csui-pin-badge{margin-right:4px}"
                        ].join("");
                        document.head.appendChild(st);
                        /* 快跳条 */
                        const bar = document.createElement("div"); bar.id = "csui-qbar";
                        /* 智能到顶v4：▲=一键"从头阅读"（直读缓存·绕开分页器·确定性成功） */
                        const smartTop = () => {
                                toast("从头阅读·加载中…");
                                fallbackReadFromTop();
                        };
                        const fallbackReadFromTop = () => {
                                const sidNow = getCurrentSid();
                                if (!sidNow) { toast("取不到当前会话号"); return; }
                                fetch("/chatsearch/api", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ method: "export", args: { sid: sidNow } }) })
                                        .then((r) => r.json()).then((data) => {
                                                if (data.ok) openTextViewer(data.result.text, sidNow, []);
                                                else toast("导出失败");
                                        }).catch(() => toast("导出失败"));
                        };
                        const getCurrentSid = () => {
                                const el = document.querySelector('[data-conversation-session]');
                                let v = el ? (el.getAttribute("data-conversation-session") || "") : "";
                                if (!v) { const m = location.href.match(/session-([0-9a-f-]{36})/); v = m ? m[0] : ""; }
                                const u = v.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
                                return u ? "session-" + u[1] : null;
                        };
                        const smartBottom = (sc) => {
                                sc.scrollTo({ top: sc.scrollHeight, behavior: "auto" });
                                let n = 0;
                                const iv = setInterval(() => {
                                        if (!document.body.contains(sc)) { clearInterval(iv); return; }
                                        if (sc.scrollHeight - sc.scrollTop - sc.clientHeight < 40 || n > 12) { clearInterval(iv); sc.scrollTo({ top: sc.scrollHeight, behavior: "smooth" }); return; }
                                        sc.scrollTo({ top: sc.scrollHeight, behavior: "auto" }); n++;
                                }, 350);
                        };
                        [["top", "▲"], ["prev", "↑"], ["next", "↓"]].forEach(([act, ch]) => {
                                const b = document.createElement("button");
                                b.textContent = ch; b.dataset.act = act; b.setAttribute("aria-label", act);
                                bar.appendChild(b);
                        });
                        /* 拖动换位（localStorage记忆）+ 拖后不误触发点击 */
                        let drag = null, qbarSup = false;
                        try {
                                const saved = JSON.parse(localStorage.getItem("csui_qbar_pos") || "null");
                                if (saved && saved.left != null) { bar.style.left = saved.left + "px"; bar.style.top = saved.top + "px"; bar.style.right = "auto"; bar.style.bottom = "auto"; }
                        } catch (e) {}
                        bar.addEventListener("touchstart", (e) => {
                                const t = e.touches[0]; const r = bar.getBoundingClientRect();
                                drag = { x: t.clientX, y: t.clientY, l: r.left, t2: r.top, moved: false };
                                if (e.target.dataset && e.target.dataset.act === "top") bar._lp = setTimeout(() => { bar._lp = null; openTOC(); }, 600);
                        }, { passive: true });
                        bar.addEventListener("touchmove", (e) => {
                                if (!drag) return;
                                const t = e.touches[0]; const dx = t.clientX - drag.x, dy = t.clientY - drag.y;
                                if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
                                        drag.moved = true; if (bar._lp) { clearTimeout(bar._lp); bar._lp = null; }
                                        bar.style.left = Math.max(4, drag.l + dx) + "px";
                                        bar.style.top = Math.max(4, drag.t2 + dy) + "px";
                                        bar.style.right = "auto"; bar.style.bottom = "auto";
                                        e.preventDefault();
                                }
                        }, { passive: false });
                        bar.addEventListener("touchend", () => {
                                if (bar._lp) { clearTimeout(bar._lp); bar._lp = null; }
                                if (drag && drag.moved) {
                                        qbarSup = true; setTimeout(() => { qbarSup = false; }, 300);
                                        try { localStorage.setItem("csui_qbar_pos", JSON.stringify({ left: parseInt(bar.style.left), top: parseInt(bar.style.top) })); } catch (e) {}
                                }
                                drag = null;
                        });
                        document.body.appendChild(bar);
                        const getScroller = () => {
                                const all = [...document.querySelectorAll("[data-conversation-scroll]")];
                                return all.filter((el) => el.clientHeight > 120).sort((a, b) => b.clientHeight - a.clientHeight)[0] || null;
                        };
                        const getUserMsgs = (sc) => [...sc.querySelectorAll('[data-chat-flow-kind="user"]')];
                        const jumpTo = (el, sc) => {
                                if (!el) return;
                                sc.scrollTo({ top: el.offsetTop - 8, behavior: "smooth" });
                        };
                        /* 问题目录：长按▲弹出本会话全部提问 */
                        const openTOC = () => {
                                const sc = getScroller(); if (!sc) return;
                                const msgs = getUserMsgs(sc);
                                if (!msgs.length) { toast("本页暂无提问"); return; }
                                const old2 = document.getElementById("csui-toc"); if (old2) old2.remove();
                                const ov = document.createElement("div"); ov.id = "csui-toc";
                                ov.style.cssText = "position:fixed;inset:0;z-index:2147480003;background:rgba(0,0,0,.5);display:flex;align-items:flex-end;justify-content:center";
                                const card = document.createElement("div");
                                card.style.cssText = "background:#1e1e1e;color:#fff;border-radius:14px 14px 0 0;max-height:60vh;width:100%;overflow:auto;padding:10px 12px;box-sizing:border-box";
                                const hd = document.createElement("div");
                                hd.textContent = "📋 问题目录（本页" + msgs.length + "问）· 点问题跳过去";
                                hd.style.cssText = "font-size:12px;color:#999;margin-bottom:8px";
                                card.appendChild(hd);
                                msgs.forEach((el, i) => {
                                        const it = document.createElement("div");
                                        it.textContent = (i + 1) + ". " + (el.innerText || "").trim().replace(/\s+/g, " ").slice(0, 60);
                                        it.style.cssText = "padding:10px 8px;border-bottom:1px solid #8883;font-size:14px";
                                        it.onclick = () => { ov.remove(); jumpTo(el, sc); };
                                        card.appendChild(it);
                                });
                                const cl = document.createElement("div");
                                cl.textContent = "✖ 关闭"; cl.style.cssText = "padding:12px;text-align:center;color:#b76e79;font-size:14px";
                                cl.onclick = () => ov.remove();
                                card.appendChild(cl);
                                ov.appendChild(card);
                                ov.addEventListener("click", (e) => { if (e.target === ov) ov.remove(); });
                                document.body.appendChild(ov);
                        };
                        bar.addEventListener("click", (e) => {
                                if (qbarSup) return;
                                const act = e.target.dataset && e.target.dataset.act;
                                const sc = getScroller(); if (!sc) return;
                                const msgs = getUserMsgs(sc);
                                if (act === "top") { smartTop(sc); return; }
                                if (!msgs.length) return;
                                const scTop = sc.getBoundingClientRect().top;
                                let cur = -1;
                                msgs.forEach((el, i) => { if (el.getBoundingClientRect().top <= scTop + 40) cur = i; });
                                if (act === "prev") jumpTo(msgs[Math.max(0, cur <= 0 ? 0 : cur - 1)], sc);
                                if (act === "next") jumpTo(msgs[Math.min(msgs.length - 1, cur + 1)], sc);
                        });
                        const copyText = (txt, tip) => {
                                const fallback = () => {
                                        try {
                                                const ta = document.createElement("textarea");
                                                ta.value = txt; ta.style.cssText = "position:fixed;top:0;left:0;opacity:0.01";
                                                document.body.appendChild(ta);
                                                ta.focus(); ta.setSelectionRange(0, ta.value.length);
                                                const ok = document.execCommand("copy");
                                                ta.remove();
                                                if (ok) toast(tip || "✅已复制");
                                                else toast("复制失败·请在阅读器里长按选字复制");
                                        } catch (e) { toast("复制失败·请在阅读器里长按选字复制"); }
                                };
                                if (navigator.clipboard && navigator.clipboard.writeText) {
                                        navigator.clipboard.writeText(txt).then(() => toast(tip || "✅已复制"), fallback);
                                } else fallback();
                        };
                        /* 长按菜单（原生会话行） */
                        const openMenu = (sid) => {
                                closeMenu();
                                const ov = document.createElement("div"); ov.id = "csui-menu";
                                const card = document.createElement("div"); card.className = "card";
                                const pinned = () => { try { return JSON.parse(localStorage.getItem("csui_pins") || "[]"); } catch (e) { return []; } };
                                const isP = pinned().includes(sid);
                                const mk = (label, fn) => {
                                        const b = document.createElement("button");
                                        b.textContent = label; b.onclick = () => { closeMenu(); fn(); };
                                        return b;
                                };
                                const title = document.createElement("div");
                                title.style.cssText = "font-size:12px;color:#999;margin-bottom:4px;font-family:monospace";
                                title.textContent = sid.slice(8, 24) + "…";
                                card.appendChild(title);
                                card.appendChild(mk((isP ? "☆ 取消置顶" : "📌 置顶"), () => {
                                        try {
                                                let pins = pinned();
                                                pins = isP ? pins.filter((x) => x !== sid) : pins.concat([sid]);
                                                localStorage.setItem("csui_pins", JSON.stringify(pins));
                                        } catch (e) {}
                                }));
                                card.appendChild(mk("⬇ 导出txt", () => {
                                        fetch("/chatsearch/api", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ method: "export", args: { sid } }) })
                                                .then((r) => r.json()).then((data) => {
                                                        if (data.ok) openTextViewer(data.result.text, sid, []);
                                                        else toast("导出失败");
                                                }).catch(() => toast("导出失败"));
                                }));
                                card.appendChild(mk("📋 复制全文", () => {
                                        fetch("/chatsearch/api", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ method: "export", args: { sid } }) })
                                                .then((r) => r.json()).then((data) => {
                                                        if (data.ok) copyText(data.result.text, "✅全会话已复制");
                                                        else toast("导出失败");
                                                }).catch(() => toast("复制失败"));
                                }));
                                card.appendChild(mk("⏬ 回最新", () => {
                                        const sc = getScroller();
                                        if (sc) smartBottom(sc);
                                }));
                                ov.appendChild(card);
                                ov.addEventListener("click", closeMenu);
                                document.body.appendChild(ov);
                        };
                        const closeMenu = () => { const m = document.getElementById("csui-menu"); if (m) m.remove(); };
                        let lpTimer = null, lpSid = null;
                        const rowOf = (t) => { const el = t && t.closest ? t.closest('[data-row-key^="session:"]') : null; return el; };
                        document.addEventListener("touchstart", (e) => {
                                const row = rowOf(e.target); if (!row) return;
                                lpSid = (row.getAttribute("data-row-key") || "").slice(8);
                                lpTimer = setTimeout(() => { lpTimer = null; openMenu(lpSid); }, 550);
                        }, { passive: true });
                        document.addEventListener("touchmove", () => { if (lpTimer) { clearTimeout(lpTimer); lpTimer = null; } }, { passive: true });
                        document.addEventListener("touchend", (e) => {
                                if (lpTimer) { clearTimeout(lpTimer); lpTimer = null; }
                                if (document.getElementById("csui-menu") && rowOf(e.target)) e.preventDefault();
                        });
                        document.addEventListener("contextmenu", (e) => {
                                const row = rowOf(e.target); if (!row) return;
                                e.preventDefault();
                                openMenu((row.getAttribute("data-row-key") || "").slice(8));
                        });
                        /* 长按消息气泡→菜单：复制本条/复制选中/引用到输入框 */
                        let msgTimer = null;
                        const turnOf = (t) => { const el = t && t.closest ? t.closest("[data-chat-turn]") : null; return el; };
                        const quoteToInput = (txt) => {
                                const ed = document.querySelector("[data-lexical-editor]");
                                if (!ed) { copyText(txt, "输入框未找到·已复制"); return; }
                                ed.focus();
                                let ok = false;
                                try { ok = document.execCommand("insertText", false, "> " + txt.replace(/\n/g, "\n> ") + "\n"); } catch (e) {}
                                toast(ok ? "✅已引用到输入框" : "引用失败·已复制");
                                if (!ok) copyText(txt, null);
                        };
                        const openMsgMenu = (turn, cx, cy) => {
                                const old2 = document.getElementById("csui-msgmenu"); if (old2) old2.remove();
                                const ov = document.createElement("div"); ov.id = "csui-msgmenu";
                                ov.style.cssText = "position:fixed;inset:0;z-index:2147480003;background:rgba(0,0,0,.25)";
                                const card = document.createElement("div");
                                card.style.cssText = "position:absolute;background:#1e1e1e;color:#fff;border-radius:12px;padding:6px;box-shadow:0 4px 18px rgba(0,0,0,.5);min-width:170px";
                                card.style.left = Math.min(window.innerWidth - 190, Math.max(6, cx - 80)) + "px";
                                card.style.top = Math.min(window.innerHeight - 190, Math.max(6, cy - 40)) + "px";
                                const sel = (window.getSelection && window.getSelection().toString().trim()) || "";
                                const mk = (label, fn) => {
                                        const b = document.createElement("button");
                                        b.textContent = label; b.onclick = () => { ov.remove(); fn(); };
                                        b.style.cssText = "display:block;width:100%;padding:11px 12px;border:none;border-radius:9px;background:transparent;color:#fff;font-size:14px;text-align:left";
                                        return b;
                                };
                                const whole = turn.innerText.trim();
                                if (sel) card.appendChild(mk("✂️ 复制选中(" + sel.length + "字)", () => copyText(sel, "✅已复制选中")));
                                card.appendChild(mk("📋 复制本条", () => copyText(whole, "✅已复制")));
                                card.appendChild(mk("💬 引用到输入框", () => quoteToInput(whole.slice(0, 1200))));
                                card.appendChild(mk("✖ 取消", () => {}));
                                ov.appendChild(card);
                                ov.addEventListener("click", (e) => { if (e.target === ov) ov.remove(); });
                                document.body.appendChild(ov);
                        };
                        document.addEventListener("touchstart", (e) => {
                                if (rowOf(e.target) || e.target.closest("#csui-qbar,#csui-menu,#csui-viewer,#csui-toc,#csui-msgmenu")) return;
                                const turn = turnOf(e.target); if (!turn) return;
                                const t = e.touches[0];
                                msgTimer = setTimeout(() => {
                                        msgTimer = null;
                                        openMsgMenu(turn, t.clientX, t.clientY);
                                }, 600);
                        }, { passive: true });
                        document.addEventListener("touchmove", () => { if (msgTimer) { clearTimeout(msgTimer); msgTimer = null; } }, { passive: true });
                        document.addEventListener("touchend", () => { if (msgTimer) { clearTimeout(msgTimer); msgTimer = null; } });
                        document.addEventListener("contextmenu", (e) => {
                                if (rowOf(e.target) || !turnOf(e.target)) return;
                                e.preventDefault();
                                openMsgMenu(turnOf(e.target), e.clientX, e.clientY);
                        });
                        /* 置顶徽标+原生列表置顶排序·周期巡检 */
                        setInterval(() => {
                                const sc = getScroller();
                                bar.style.display = sc ? "flex" : "none";
                                closeMenuOnNav();
                                let pins = []; try { pins = JSON.parse(localStorage.getItem("csui_pins") || "[]"); } catch (e) {}
                                const rows = [...document.querySelectorAll('[data-row-key^="session:"]')];
                                const seen = new Set();
                                let firstRow = null;
                                rows.forEach((row) => {
                                        const sid = (row.getAttribute("data-row-key") || "").slice(8);
                                        if (!sid || seen.has(sid)) return; seen.add(sid);
                                        if (!firstRow) firstRow = row;
                                        let badge = row.querySelector(":scope > .csui-pin-badge");
                                        if (pins.includes(sid)) {
                                                if (!badge) { badge = document.createElement("span"); badge.className = "csui-pin-badge"; badge.textContent = "📌"; row.prepend(badge); }
                                                if (row.parentElement && firstRow.parentElement === row.parentElement && firstRow !== row) {
                                                        row.parentElement.insertBefore(row, firstRow); firstRow = row;
                                                }
                                        } else if (badge) badge.remove();
                                });
                        }, 1200);
                        let lastPath = location.href;
                        function closeMenuOnNav() { if (location.href !== lastPath) { lastPath = location.href; closeMenu(); } }
                }

                function apply(ctx) {
                        const layout = ctx.layout;
                        if (layout && layout.selectPanel) {
                                ctx.slots.inject("sidebar.panellist", () => ctx.slots.register({
                                        name: "sidebar.panellist", id: PANEL_ID, order: 6, label: "聊天搜索"
                                }, (props) => El(RailIcon, props)));
                                ctx.slots.inject("main", () => ctx.slots.register({
                                        name: "main", key: PANEL_ID
                                }, () => El(Panel, {})));
                        }
                        try { installSessionTools(); } catch (e) { try { console.warn("[csui-tools]", e); } catch (e2) {} }
                }
                exports.apply = apply;
                exports.inject = ["slots", "layout"];
                return module.exports;
        }
});

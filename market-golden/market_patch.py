#!/usr/bin/env python3
"""市场"已发布"页签补丁器 · 0.4.16锚点版
用法: python3 market_patch.py [client.js路径]
锚点不唯一或找不到即报错退出,绝不写坏文件。市场升级后由watchdog自动重打。
"""
import sys, pathlib
p = pathlib.Path(sys.argv[1] if len(sys.argv)>1 else "/home/ubuntu/.dsh/profiles/web/node_modules/@dsh-market/plugin/lib/client.js")
comp_p = pathlib.Path(__file__).parent/"publishedtab.js"
s = p.read_text()
if "已发布" in s: print("已打补丁,跳过"); sys.exit(0)
a1='\t\t\t\t{\n\t\t\t\t\tid: "settings",\n\t\t\t\t\tlabel: "设置"\n\t\t\t\t}\n\t\t\t];'
assert s.count(a1)==1, "锚1失配(市场版升级?锚点需重审)"
s=s.replace(a1,'\t\t\t\t{\n\t\t\t\t\tid: "published",\n\t\t\t\t\tlabel: "已发布"\n\t\t\t\t},\n'+a1)
a2='\t\t\t})) : tab === "installed" ? El(Boundary, {'
assert s.count(a2)==1, "锚2失配"
b2=('\t\t\t})) : tab === "published" ? El(Boundary, {\n'
    '\t\t\t\tkey: tab,\n'
    '\t\t\t\tlabel: "已发布 Tab"\n'
    '\t\t\t}, El(PublishedTab, {\n'
    '\t\t\t\tonInstall: setInstallTarget\n'
    '\t\t\t})) : tab === "installed" ? El(Boundary, {')
s=s.replace(a2,b2)
a3='\t\t\tconst tabs = ['
assert s.count(a3)==1, "锚3失配"
s=s.replace(a3, comp_p.read_text()+a3)
p.write_text(s)
print("PATCHED", len(s))

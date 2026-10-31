# market-golden · 插件市场定制金身（2026-10-31）

定制内容：DSH插件市场client增加——
- **已发布Tab**：列xushilianzhuren名下全部dsh-*套件（星数/更新日期/仓库链接/一键安装/刷新）
- **排序条**：默认 / ★星数 / 更新 / Aa名称

## 背景
定制原为2026-10-30手工补丁。2026-10-31市场插件随依赖重装升级，补丁被原版覆盖。
此后以整文件金身恢复制固化：市场升级覆盖后，看门狗60秒内自动恢复+重启dsh。

## 四件
- `client.golden.js` = 完整定制版client.js整文件金身（对`@dsh-market/plugin`包lib/client.js整体替换）
- `publishedtab.js` = "已发布Tab"组件源码段（锚点补丁式装配用）
- `market_patch.py` = 锚点补丁器（0.4.16锚点·断言制·锚失配即拒写·幂等跳过）
- `dsh_watch.sh` = HK机看门狗（dsh进程守护+金身自愈钩·每60秒巡检）

## 部署（HK机）
```bash
cp client.golden.js /home/ubuntu/.dsh/profiles/web/node_modules/@dsh-market/plugin/lib/client.js
kill $(pgrep -f 'bin.js --profile web' | head -1)   # dsh自动被watch拉起
setsid nohup /home/ubuntu/dsh_watch.sh >/dev/null 2>&1 < /dev/null &
```

## 适配提醒
- golden按市场插件0.4.16代client裁制；市场大版本升级若UI重构，golden与新版host的接口可能失配——届时以`market_patch.py`的锚点断言重审新原版，重新裁制golden。
- 验活三查：dsh启动日志无market报错；页面装载单含`@dsh-market/plugin/client.js`；市场UI见"已发布"页签与排序条。

# dsh_csui · DSH会话工具套件（2026-10-30）
- client.js = 浏览器端插件：快跳条(▲↑↓/可拖动/问题目录)、长按菜单(复制/引用)、全文阅读器(内搜/三格式导出/出下载链)、批量导出成册
- index.js  = 服务端Host插件：/chatsearch/api(list/search/export/save) + /chatsearch/file/* 下载路由
- 安装: client.js→node_modules/@local/dsh-chat-search-ui/lib/ · index.js→同包lib/index.js · 重启DSH
- 依赖: HK机DSH web + 会话存档~/.dsh/sessions(**/session.v4.jsonl.zstd) + zstd/rg

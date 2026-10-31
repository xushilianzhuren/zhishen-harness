#!/bin/bash
while true; do
  if ! pgrep -f 'bin.js --profile web' >/dev/null; then
    nohup /home/ubuntu/dsh_start.sh >> /home/ubuntu/dsh_web.log 2>&1 &
    echo "$(date '+%F %T') restarted" >> /home/ubuntu/dsh_watch.log
  fi
  # 市场定制金身自愈:被插件升级覆盖则60秒内整文件恢复+重启
  MK=/home/ubuntu/.dsh/profiles/web/node_modules/@dsh-market/plugin/lib/client.js
  GD=/home/ubuntu/智神harness/market-golden/client.golden.js
  if [ -f "$MK" ] && [ -f "$GD" ] && ! grep -q "已发布" "$MK"; then
    cp "$GD" "$MK" \
      && kill $(pgrep -f 'bin.js --profile web' | head -1) 2>/dev/null \
      && echo "$(date '+%F %T') market golden restored" >> /home/ubuntu/dsh_watch.log
  fi
  sleep 60
done

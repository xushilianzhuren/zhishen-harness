/** dsh-chat-search-ui · Host端：/chatsearch/api 路由（跨会话搜索） */
export const inject = ['webServer']
import { execFile } from 'node:child_process'
import { homedir } from 'node:os'

const run = (cmd, a, t = 30000) => new Promise(res => execFile(cmd, a, { timeout: t, maxBuffer: 16e6 }, (e, so, se) => res({ code: e ? (e.code ?? 1) : 0, out: (so ?? '') + (se ?? '') })))

async function dispatch(method, args) {
  if (method === 'debug') {
    const d = homedir()
    const ls = await run('bash', ['-c', `ls ${d}/.dsh/chatsearch_cache/*.jsonl 2>/dev/null | wc -l; whoami; echo HOME=$HOME`], 10000)
    return { homedir: d, out: ls.out }
  }
  if (method === 'list') {
    const out = await run('bash', ['-c', `ls -la ${homedir()}/.dsh/chatsearch_cache/*.jsonl 2>/dev/null | awk '{print $5, $6, $7, $8, $9}'`], 20000)
    const rows = (out.out || '').trim().split('\n').filter(Boolean).map(l => {
      const parts = l.split(/\s+/)
      const f = parts.slice(4).join(' ')
      const sid = (f.match(/session-([0-9a-f-]{36})/) ?? [])[1] ?? f
      return { sid, size: parseInt(parts[0]) || 0, mtime: parts.slice(1, 4).join(' ') }
    })
    return { sessions: rows.sort((a, b) => b.mtime.localeCompare(a.mtime)) }
  }
  if (method === 'export') {
    let sid = String(args?.sid ?? '')
    if (!/^session-/.test(sid)) sid = 'session-' + sid
    if (!/^session-[0-9a-f-]{36}$/.test(sid)) throw new Error('sid格式非法')
    const fs = await import('node:fs')
    const f = `${homedir()}/.dsh/chatsearch_cache/${sid}.jsonl`
    if (!fs.existsSync(f)) {
      const z = fs.readdirSync(homedir() + '/.dsh/sessions', { withFileTypes: false })
      void z
      await run('bash', ['-c', `find ${homedir()}/.dsh/sessions -name "session.v4.jsonl.zstd" -path "*${sid}*" | head -1 | xargs -r -I{} sh -c 'timeout 10 zstd -dc "{}" > ${f}'`], 20000)
    }
    const msgs = []
    try {
      for (const raw of fs.readFileSync(f, 'utf8').split('\n')) {
        if (!raw.trim()) continue
        let jj; try { jj = JSON.parse(raw) } catch (e) { continue }
        const ty = String(jj.type || '')
        if (!/\/message$/.test(ty)) continue
        if (/^(system|developer)\//.test(ty)) continue
        const d = jj.data || {}
        const items = d.content || (d.message && d.message.content) || []
        const parts = []
        ;(Array.isArray(items) ? items : []).forEach(it => { if (it && it.type === 'text' && it.text) parts.push(it.text) })
        const txt = parts.join('\n').trim()
        if (!txt) continue
        if (txt.startsWith('<system-reminder')) continue
        msgs.push({ role: /user/.test(ty) ? 'user' : 'assistant', ts: jj.time || 0, text: txt.slice(0, 20000) })
      }
    } catch (e) {}
    const text = msgs.map(m => (m.role === 'user' ? '\ud83e\uddd1\u6211' : '\ud83e\udd16\u5668\u7075') + (m.ts ? ' (' + new Date(m.ts).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) + ')' : '') + '\n' + m.text).join('\n\n────\n\n') || '(无可读文本)'
    return { text, sid, msgs }
  }
  if (method === 'search') {
    const q = String(args?.query ?? '').trim()
    if (!q) throw new Error('query必填')
    const cache = homedir() + '/.dsh/chatsearch_cache'
    await run('bash', ['-c', `find ${homedir()}/.dsh/sessions -name "session.v4.jsonl.zstd" | while read f; do b=$(basename $(dirname "$f")); [ -f ${cache}/$b.jsonl ] || timeout 10 zstd -dc "$f" > ${cache}/$b.jsonl 2>/dev/null; done`], 60000)
    const total = parseInt((await run('bash', ['-c', `ls ${cache}/*.jsonl 2>/dev/null | wc -l`], 10000)).out.trim()) || 0
    const safe = q.replace(/'/g, "''")
    const fileList = (await run('bash', ['-c', `rg -i -l '${safe}' ${cache} 2>/dev/null | head -n 20`], 30000)).out.trim().split('\n').filter(Boolean)
    const fs = await import('node:fs')
    const re = new RegExp(safe.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
    const hits = fileList.map(f => {
      const sid = f.split('/').pop().replace(/\.jsonl$/, '')
      const lines = []
      try {
        for (const raw of fs.readFileSync(f, 'utf8').split('\n')) {
          if (!re.test(raw)) continue
          try {
            const j = JSON.parse(raw)
            const ty = String(j.type || '')
            if (!/\/message$/.test(ty)) continue
            if (/^(system|developer)\//.test(ty)) continue
            const d = j.data || {}
            const items = d.content || (d.message && d.message.content) || []
            const parts = []
            ;(Array.isArray(items) ? items : []).forEach(it => { if (it && it.type === 'text' && it.text) parts.push(it.text) })
            const txt = parts.join(' ')
            if (!txt || !re.test(txt)) continue
            if (txt.startsWith('<system-reminder')) continue
            const who = /user/.test(ty) ? '\ud83e\uddd1\u6211' : '\ud83e\udd16\u5668\u7075'
            lines.push(who + '\uff1a' + txt.replace(/\s+/g, ' ').slice(0, 140))
            if (lines.length >= 3) break
          } catch (e) { continue }
        }
      } catch (e) {}
      return { sid, mtime: '', lines }
    }).filter(h => h.sid && h.lines.length)
    return { total, hits }
  }
  if (method === 'save') {
    let sidArg = String(args?.sid ?? '')
    if (sidArg && !/^session-/.test(sidArg)) sidArg = 'session-' + sidArg
    const fs = await import('node:fs')
    const path = await import('node:path')
    const dir = homedir() + '/.dsh/chatsearch_cache/exports'
    fs.mkdirSync(dir, { recursive: true })
    const fname = (String(args?.name || 'export').replace(/[^\w.-]/g, '_').slice(0, 60)) + '-' + Date.now() + '.txt'
    fs.writeFileSync(path.join(dir, fname), String(args?.text ?? ''), 'utf8')
    return { file: fname }
  }
  throw new Error('未知方法: ' + method)
}

export function apply(ctx) {
  ctx.effect(() => ctx.webServer.register({
    kind: 'prefix',
    path: '/chatsearch/api',
    handler: async (req, res) => {
      if (req.method !== 'POST') { res.writeHead(405, {'content-type': 'application/json'}); res.end(JSON.stringify({ok: false, error: 'method not allowed'})); return }
      let body = ''
      req.setEncoding('utf8')
      req.on('data', c => { body += c; if (body.length > 1e6) req.destroy() })
      req.on('end', async () => {
        try {
          const { method, args } = JSON.parse(body || '{}')
          const result = await dispatch(method, args)
          res.writeHead(200, {'content-type': 'application/json'})
          res.end(JSON.stringify({ok: true, result}))
        } catch (err) {
          res.writeHead(200, {'content-type': 'application/json'})
          res.end(JSON.stringify({ok: false, error: String(err?.message ?? err)}))
        }
      })
    }
  }), 'dsh-chat-search: /chatsearch/api')
  ctx.effect(() => ctx.webServer.register({
    kind: 'prefix',
    path: '/chatsearch/file',
    handler: async (req, res) => {
      const fs = await import('node:fs')
      const path = await import('node:path')
      const fname = String(req.url || '').replace('/chatsearch/file/', '').split('?')[0]
      if (!/^[\w.-]+\.txt$/.test(fname)) { res.writeHead(400); res.end('bad name'); return }
      const f = path.join(homedir(), '.dsh/chatsearch_cache/exports', fname)
      if (!fs.existsSync(f)) { res.writeHead(404); res.end('not found'); return }
      res.writeHead(200, {
        'content-type': 'text/plain; charset=utf-8',
        'content-disposition': 'attachment; filename="' + fname + '"'
      })
      res.end(fs.readFileSync(f))
    }
  }), 'dsh-chat-search: /chatsearch/file')
}

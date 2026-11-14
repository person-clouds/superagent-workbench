/**
 * 轻量 Markdown 解析：只识别标题、列表、段落，行内加粗/行内代码/链接。
 *
 * 复用思路来自 dsh-superagent 的面板（同样的子集），这里多保留代码块，
 * 因为工单记录里常有命令与 JSON 片段。从不解释原始 HTML，页面不注入 innerHTML。
 */

// 链接只吃 ASCII URL 字符：末尾连续的 . , : ; ! ? ' " ) ] 视作句末标点留在链接外。
const URL_RE = /https?:\/\/[A-Za-z0-9\-._~:/?#[\]@!$&'()*+,;=%]*[A-Za-z0-9\-_~:/?#[\]@$&*+=%]/g

/** 把普通文本切成「文本 / 裸链接」片段；用 matchAll 定位，不依赖 String.split 的分组语义。 */
function linkify(text) {
  const parts = []
  let at = 0
  for (const match of text.matchAll(URL_RE)) {
    if (match.index > at) parts.push({ kind: 'text', text: text.slice(at, match.index) })
    parts.push({ kind: 'link', text: shortUrl(match[0]), url: match[0] })
    at = match.index + match[0].length
  }
  if (at < text.length) parts.push({ kind: 'text', text: text.slice(at) })
  return parts
}

function shortUrl(url) {
  try {
    const parsed = new URL(url)
    const path = parsed.pathname.length > 24 ? `${parsed.pathname.slice(0, 24)}…` : parsed.pathname
    return `${parsed.host}${path === '/' ? '' : path}`
  } catch {
    return url
  }
}

export function inlines(text) {
  return text
    .split(/(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\(https?:\/\/[^)\s]+\))/)
    .flatMap(part => {
      if (/^\*\*[^*]+\*\*$/.test(part)) return [{ kind: 'bold', text: part.slice(2, -2) }]
      if (/^`[^`]+`$/.test(part)) return [{ kind: 'code', text: part.slice(1, -1) }]
      const link = /^\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)$/.exec(part)
      if (!link) return linkify(part)
      // 反引号里的链接文本是原文，其余文本仍按行内 Markdown 处理。
      return [{ kind: 'link', text: link[1], url: link[2] }]
    })
}

/** 表格分隔行：| --- | :---: | ---: | */
function isTableSeparator(line) {
  const cells = splitTableRow(line)
  return cells.length > 0 && cells.every(cell => /^:?-{3,}:?$/.test(cell))
}

/** 拆一行表格，忽略首尾竖线；不处理转义竖线，保持实现简单可预测。 */
function splitTableRow(line) {
  let value = String(line || '').trim()
  if (value.startsWith('|')) value = value.slice(1)
  if (value.endsWith('|')) value = value.slice(0, -1)
  return value.split('|').map(cell => cell.trim())
}

/**
 * 把 Markdown 文本切成块：heading / list / table / paragraph / code / quote。
 * @returns {Array<{kind: string, text?: string, items?: string[], ordered?: boolean, headers?: string[], rows?: string[][]}>}
 */
export function markdownBlocks(text) {
  const blocks = []
  let list
  let code
  const lines = String(text || '').split('\n')
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]
    if (line.trim().startsWith('```')) {
      if (code) {
        blocks.push({ kind: 'code', text: code.lines.join('\n') })
        code = undefined
      } else {
        code = { lines: [] }
      }
      continue
    }
    if (code) {
      code.lines.push(line)
      continue
    }
    // 表格必须紧跟在表头下一行的分隔行，避免把普通含 | 的段落误判为表格。
    if (line.includes('|') && index + 1 < lines.length && isTableSeparator(lines[index + 1])) {
      const headers = splitTableRow(line)
      const rows = []
      index += 2
      while (index < lines.length && lines[index].trim() && lines[index].includes('|')) {
        const cells = splitTableRow(lines[index])
        rows.push(headers.map((_, at) => cells[at] || ''))
        index += 1
      }
      index -= 1
      blocks.push({ kind: 'table', headers, rows })
      list = undefined
      continue
    }
    const item = /^\s*[-*]\s+(.*)$/.exec(line) || /^\s*\d+[.)]\s+(.*)$/.exec(line)
    if (item) {
      const ordered = !/^\s*[-*]/.test(line)
      if (!list || list.ordered !== ordered) blocks.push((list = { kind: 'list', ordered, items: [] }))
      list.items.push(item[1])
      continue
    }
    list = undefined
    if (!line.trim()) continue
    const heading = /^#{1,6}\s+(.*)$/.exec(line)
    if (heading) blocks.push({ kind: 'heading', text: heading[1] })
    else if (/^>\s?/.test(line)) blocks.push({ kind: 'quote', text: line.replace(/^>\s?/, '') })
    else blocks.push({ kind: 'paragraph', text: line })
  }
  if (code) blocks.push({ kind: 'code', text: code.lines.join('\n') })
  return blocks
}

/** 取文档第一个一级标题，用作列表里的文档标题。 */
export function firstHeading(text) {
  const match = /^#\s+(.+?)\s*$/m.exec(String(text || '').slice(0, 8000))
  return match ? match[1] : ''
}

/**
 * 把块里的纯文本切成行内片段（加粗/行内代码/链接/普通文本），交给浏览器端直接映射成 React 元素。
 * Host 一次切好，浏览器端不需要再解析 Markdown，也就不存在注入 HTML 的入口。
 */
export function withParts(blocks) {
  return blocks.map(block => {
    if (block.kind === 'list') return { ...block, items: block.items.map(item => ({ text: item, parts: inlines(item) })) }
    if (block.kind === 'table') {
      return {
        ...block,
        headers: block.headers.map(cell => ({ text: cell, parts: inlines(cell) })),
        rows: block.rows.map(row => row.map(cell => ({ text: cell, parts: inlines(cell) }))),
      }
    }
    // 代码块原样显示，不做行内解析。
    if (block.kind === 'code' || block.text === undefined) return block
    return { ...block, parts: inlines(block.text) }
  })
}

/**
 * 把原始补丁切成按文件的块：每个块带路径、增删行数，面板逐块渲染并着色。
 * 只做行级判断，不解析 hunk 语义。
 */
export function splitPatch(patch) {
  const files = []
  let current
  for (const line of String(patch || '').split('\n')) {
    if (line.startsWith('diff --git ')) {
      const match = /^diff --git a\/(.+?) b\/(.+)$/.exec(line)
      current = { path: match ? match[2] : line.slice(11), added: 0, removed: 0, lines: [] }
      files.push(current)
      continue
    }
    if (!current) continue
    if (line.startsWith('+') && !line.startsWith('+++')) current.added += 1
    else if (line.startsWith('-') && !line.startsWith('---')) current.removed += 1
    // 文件头里的 index/mode 行对阅读没用，只保留 ---/+++/hunk 与正文。
    if (/^(index |new file mode|deleted file mode|similarity index|rename |old mode|new mode)/.test(line)) continue
    current.lines.push(line)
  }
  return files
}

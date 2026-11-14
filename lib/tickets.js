/**
 * 从 dsh-superagent 的工单库（orchestrator.sqlite）只读读取工单。
 *
 * 工单 JSON 里已经有需求、执行目录、分支名、每一轮执行报告和结束结果，
 * 这里把它们整理成面板直接可用的形状；不改库，也不依赖 superagent 自己的管理 API。
 */

import { existsSync } from 'node:fs'
import { markdownBlocks, withParts } from './markdown.js'

const PR_RE = /https:\/\/github\.com\/[^\s)\]"'，。]+?\/pull\/\d+/g
const ISSUE_RE = /https:\/\/github\.com\/[^\s)\]"'，。]+?\/issues\/\d+/
// 取值来自 dsh-superagent src/core/model.ts 的 TicketOutcome / ReportState。
const OUTCOME_LABELS = { completed: '已完成', merged: '已合入', closed: '已关闭', dropped: '已放弃', stopped: '已停止' }
const ASSIGNMENT_LABELS = { pending: '排队中', running: '执行中', ended: '本次结束' }
const REPORT_LABELS = { progress: '推进中', waiting: '等待中', ready: '已就绪', blocked: '受阻', failed: '失败', dropped: '已放弃' }

function text(value, fallback = '') {
  return typeof value === 'string' ? value : fallback
}

function objectOf(value) {
  return value && typeof value === 'object' ? value : {}
}

function lastAssignment(raw) {
  const list = Array.isArray(raw.assignments) ? raw.assignments : []
  return objectOf(list[list.length - 1])
}

function parseTicket(raw) {
  const assignment = lastAssignment(raw)
  const report = objectOf(assignment.report)
  const ended = raw.ended === undefined ? undefined : objectOf(raw.ended)
  const execution = objectOf(raw.execution)
  const channels = Array.isArray(raw.channels) ? raw.channels : []
  const address = objectOf(objectOf(channels[0]).address)
  const state = text(assignment.state)
  const reportState = text(report.state)
  const blob = JSON.stringify(raw)
  const prs = blob.match(PR_RE) || []
  const issue = blob.match(ISSUE_RE)

  // 未结束的工单以最近一次执行报告为准：pending 是排队，running 看报告，waiting 表示等一个决定或消息。
  let label
  if (ended) {
    const outcome = text(ended.outcome)
    label = `已结束${outcome ? `（${OUTCOME_LABELS[outcome] || outcome}）` : ''}`
  } else if (state === 'pending') label = '排队中'
  else if (state === 'running') label = reportState ? `执行中 · ${REPORT_LABELS[reportState] || reportState}` : '执行中'
  else label = ASSIGNMENT_LABELS[state] || REPORT_LABELS[reportState] || state || '未知'

  // 每一轮执行留下一份报告；面板把最新一份放在最前。
  const reports = (Array.isArray(raw.assignments) ? raw.assignments : [])
    .map((item, index) => {
      const itemReport = objectOf(objectOf(item).report)
      const summary = text(itemReport.summary)
      return {
        index: index + 1,
        state: text(itemReport.state) || text(objectOf(item).state),
        summary,
        blocks: withParts(markdownBlocks(summary)),
        at: text(itemReport.at) || text(objectOf(item).endedAt) || text(objectOf(item).createdAt),
      }
    })
    .filter(item => item.summary)
    .reverse()

  const directory = text(execution.directory)
  return {
    id: text(raw.id),
    shortId: text(raw.id).slice(0, 8),
    title: text(raw.title, '（无标题）'),
    createdAt: text(raw.createdAt),
    updatedAt: text(raw.updatedAt),
    state,
    reportState,
    label,
    prUrl: prs.length > 0 ? prs[prs.length - 1] : '',
    prUrls: [...new Set(prs)],
    issueUrl: text(address.url) || (issue ? issue[0] : ''),
    branch: execution.name ? `agent/${text(execution.name)}` : '',
    execName: text(execution.name),
    execDir: directory,
    execExists: Boolean(directory) && existsSync(directory),
    outcome: text(ended && ended.outcome),
    endedAt: text(ended && ended.at),
    endedBy: text(ended && ended.by),
    reports,
    mandate: text(objectOf(raw.mandate).strength),
    // 进行中 = 没结束，且最近一次执行还没收尾（数据库的 active 列口径一致）。
    live: !ended && (state === 'pending' || state === 'running'),
    attention: text(objectOf(raw.attention).question),
  }
}

/**
 * 用 Node 内置的 node:sqlite 只读打开工单库并读出全部工单，按创建时间倒序。
 * 打不开时返回带原因的 error，由 Host 转成页面提示，而不是静默给空列表。
 */
export async function loadTickets(dbPath) {
  if (!existsSync(dbPath)) return { tickets: [], error: `找不到工单库：${dbPath}` }
  let DatabaseSync
  try {
    ({ DatabaseSync } = await import('node:sqlite'))
  } catch (error) {
    return { tickets: [], error: `当前 Node 运行时没有 node:sqlite：${errorText(error)}` }
  }
  let db
  try {
    db = new DatabaseSync(dbPath, { readOnly: true, timeout: 3000 })
    // superagent 以 WAL 打开库；只读连接同样能读到 -wal 中尚未检查点的数据，不会干扰写入。
    const rows = db.prepare('select value from ticket').all()
    const tickets = []
    for (const row of rows) {
      try {
        const raw = JSON.parse(String(row.value))
        if (raw && typeof raw === 'object') tickets.push(parseTicket(raw))
      } catch { /* 单条损坏不影响其它工单 */ }
    }
    tickets.sort((left, right) => (right.createdAt || '').localeCompare(left.createdAt || ''))
    return { tickets, error: '' }
  } catch (error) {
    return { tickets: [], error: `读取工单库失败：${errorText(error)}` }
  } finally {
    try { db?.close() } catch { /* 关闭失败无需提示 */ }
  }
}

function errorText(error) {
  return String(error && error.message ? error.message : error)
}

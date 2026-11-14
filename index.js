/**
 * Host 端：把 superagent 的工单、交付分支改动和工单记录整理成一个只读 JSON 快照，
 * 通过 `GET /superagent-workbench/api` 交给浏览器端渲染。
 *
 * 边界：
 * - 只读。工单库以只读连接打开，仓库只读 git 对象，唯一的写操作是后台 `git fetch`（只改引用）；
 * - 只注册 GET 路由，并沿用 DSH 自己的 Host / Origin 校验与浏览器 cookie 鉴权；
 * - 不读凭据、不改工作区、不切分支。
 */

import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import z from '@deepseek-ai/schemastery'
import { branchDiff, fileAt, findTicketDoc, headInfo, looksLikeRepo, syncRemote } from './lib/gitdata.js'
import { firstHeading, markdownBlocks, splitPatch, withParts } from './lib/markdown.js'
import { docsIndex, findRepo, loadRepos, repoBlob, repoTree, reposOverview } from './lib/repos.js'
import { loadTickets } from './lib/tickets.js'

export const name = 'dsh-superagent-workbench'
/** webServer 提供路由，connection 提供 Host 与鉴权校验；两者缺一这层就不激活。 */
export const inject = ['webServer', 'connection']

const DEFAULT_HOME = process.env.DSH_HOME || join(homedir(), '.dsh')
// 本工作区里插件与 superagent-console 是同级项目；存在其 repos.json 时自动复用，
// 让文档/代码入口默认就能看到与 console 相同的纳管仓库。
const DEFAULT_REPOS_FILE = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'superagent-console', 'repos.json')

export const Config = z.object({
  dshHome: z.string().default(DEFAULT_HOME).description('DSH 主目录；工单库默认在其下 state/superagent/orchestrator.sqlite。'),
  stateDir: z.string().default(join(DEFAULT_HOME, 'state', 'superagent')).description('superagent 的状态目录，存放 orchestrator.sqlite。'),
  repoDir: z.string().default(join(homedir(), 'src', 'dshSuperagentRepo')).description('superagent 交付仓库的本地克隆；只读 git 对象，不切换分支。'),
  baseRef: z.string().default('origin/main').description('对比交付分支的基线引用。'),
  cacheSeconds: z.number().default(10).description('快照缓存秒数，避免页面多次请求时重复读库。'),
  fetchMinutes: z.number().default(10).description('后台 git fetch 间隔（分钟），0 表示不同步。'),
  reposFile: z.string().default(existsSync(DEFAULT_REPOS_FILE) ? DEFAULT_REPOS_FILE : '').description('仓库清单 JSON 文件（与 superagent-console/repos.json 同格式）；留空时只浏览 repoDir。'),
})

/** 一次快照请求的进程内缓存：key 由工单 ID 决定，同一时刻同 key 只允许一次读取。 */
let cache = { key: '', at: 0, value: undefined, pending: undefined }
let syncState = { at: '', ok: undefined, message: '尚未同步' }

function dbPathOf(config) {
  const stateDir = config.stateDir || join(config.dshHome || DEFAULT_HOME, 'state', 'superagent')
  return join(stateDir, 'orchestrator.sqlite')
}

/** 工单库版本，用于让面板显示「库与 superagent 代码是否对得上」，不阻塞展示。 */
function schemaVersion(dbPath, DatabaseSync) {
  if (!DatabaseSync) return undefined
  try {
    const db = new DatabaseSync(dbPath, { readOnly: true, timeout: 3000 })
    try {
      // superagent 把 schema 版本记在 kv 表里，值为 JSON 数字。
      const row = db.prepare("select value from kv where key like '%schema%'").get()
      return row ? Number(JSON.parse(String(row.value))) : undefined
    } finally {
      db.close()
    }
  } catch {
    return undefined
  }
}

async function buildDoc(repoDir, ticket) {
  if (!looksLikeRepo(repoDir)) return undefined
  const path = await findTicketDoc(repoDir, ticket.id)
  if (!path) return undefined
  const raw = await fileAt(repoDir, path)
  if (raw === undefined) return undefined
  return { path, title: firstHeading(raw), blocks: withParts(markdownBlocks(raw)) }
}

async function buildDiff(repoDir, ticket, withPatch) {
  if (!looksLikeRepo(repoDir) || !ticket.branch) return { exists: false, files: [], stat: '', patch: [] }
  const diff = await branchDiff(repoDir, ticket.branch)
  if (!diff.exists) return { exists: false, files: [], stat: '', patch: [] }
  return {
    exists: true,
    ref: diff.ref,
    files: diff.files,
    stat: diff.stat,
    patch: withPatch ? splitPatch(diff.patch) : [],
    patchBytes: diff.patch.length,
  }
}

/**
 * 组装整份快照；可只组装某一张工单（面板打开详情时用 `?ticket=` 命中缓存）。
 * @param DatabaseSync - 注入的 node:sqlite 构造函数（由 ctx.get('node:sqlite') 取得），用于读 schema 版本。
 */
async function buildSnapshot(config, ticketId, DatabaseSync) {
  const dbPath = dbPathOf(config)
  const repoDir = config.repoDir
  const repo = {
    dir: repoDir,
    ok: looksLikeRepo(repoDir),
    baseRef: config.baseRef,
    sync: syncState,
  }
  if (repo.ok) Object.assign(repo, await headInfo(repoDir))

  const { tickets, error } = await loadTickets(dbPath)
  const base = {
    generatedAt: new Date().toISOString(),
    db: { path: dbPath, ok: !error, error, schema: error ? undefined : schemaVersion(dbPath, DatabaseSync) },
    repo,
    counts: {
      all: tickets.length,
      live: tickets.filter(ticket => ticket.live).length,
      merged: tickets.filter(ticket => ticket.outcome === 'merged').length,
    },
  }

  if (ticketId) {
    const ticket = tickets.find(item => item.id === ticketId || item.id.startsWith(ticketId))
    if (!ticket) return { ...base, error: `找不到工单：${ticketId}` }
    const [doc, diff] = await Promise.all([buildDoc(repoDir, ticket), buildDiff(repoDir, ticket, true)])
    return { ...base, ticket: { ...ticket, doc, diff } }
  }

  const withDocs = await Promise.all(
    tickets.map(async ticket => {
      const [doc, diff] = await Promise.all([buildDoc(repoDir, ticket), buildDiff(repoDir, ticket, false)])
      // 列表只要摘要，报告正文留在详情里按需读取。
      return { ...ticket, reports: ticket.reports.length, doc: doc ? { path: doc.path, title: doc.title } : undefined, diff: diff.exists ? diff : undefined }
    }),
  )
  return { ...base, tickets: withDocs }
}


/** 文档、代码、仓库列表等读请求共用的调度入口。 */
async function buildView(config, params, DatabaseSync) {
  const view = params.get('view') || ''
  if (view === 'docs') {
    const repos = await loadRepos(config)
    return { generatedAt: new Date().toISOString(), groups: await docsIndex(repos) }
  }
  if (view === 'repos') {
    const repos = await loadRepos(config)
    return { generatedAt: new Date().toISOString(), repos: await reposOverview(repos) }
  }
  if (view === 'tree' || view === 'blob') {
    const repos = await loadRepos(config)
    const repo = findRepo(repos, params.get('repo') || '')
    if (!repo) return { error: `找不到仓库：${params.get('repo') || ''}` }
    if (!looksLikeRepo(repo.path) && repo.mode === 'git') return { error: `仓库不可用：${repo.path}` }
    const result = view === 'tree'
      ? await repoTree(repo, params.get('path') || '')
      : await repoBlob(repo, params.get('path') || '')
    return {
      generatedAt: new Date().toISOString(),
      repo: { id: repo.id, name: repo.name, description: repo.description, mode: repo.mode, ref: repo.ref },
      ...result,
    }
  }
  return { error: `未知视图：${view}` }
}

function cachedSnapshot(config, ticketId, DatabaseSync) {
  const now = Date.now()
  const key = `ticket:${ticketId || ''}`
  const fresh = cache.value && cache.key === key && now - cache.at < config.cacheSeconds * 1000
  if (fresh) return Promise.resolve(cache.value)
  if (cache.pending && cache.key === key) return cache.pending
  cache.key = key
  cache.pending = buildSnapshot(config, ticketId, DatabaseSync)
    .then(value => {
      cache = { key, at: Date.now(), value, pending: undefined }
      return value
    })
    .catch(error => {
      cache.pending = undefined
      throw error
    })
  return cache.pending
}

/** 文档/代码读请求也做短暂缓存，避免目录来回切换时重复读 git。 */
function cachedView(config, params, DatabaseSync) {
  const now = Date.now()
  const key = `view:${params.toString()}`
  const fresh = cache.value && cache.key === key && now - cache.at < config.cacheSeconds * 1000
  if (fresh) return Promise.resolve(cache.value)
  if (cache.pending && cache.key === key) return cache.pending
  cache.key = key
  cache.pending = buildView(config, params, DatabaseSync)
    .then(value => {
      cache = { key, at: Date.now(), value, pending: undefined }
      return value
    })
    .catch(error => {
      cache.pending = undefined
      throw error
    })
  return cache.pending
}

function json(res, status, value) {
  const body = JSON.stringify(value)
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': String(Buffer.byteLength(body)),
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
  })
  res.end(body)
}

/** 注册路由：GET /superagent-workbench/api[?ticket=<id>]。 */
function serveRoute(ctx, config) {
  const rejection = req => (ctx.connection.requestRejection ? ctx.connection.requestRejection({ headers: req.headers }) : undefined)
  return async (req, res) => {
    if (req.method !== 'GET') {
      res.writeHead(405, { allow: 'GET' })
      res.end()
      return
    }
    // 与 /api 一致：先做 Host / Origin 校验与浏览器 cookie 鉴权，再读数据。
    const refusal = rejection(req)
    if (refusal !== undefined) {
      res.writeHead(refusal, { 'content-type': 'text/plain; charset=utf-8' })
      res.end(refusal === 401 ? 'unauthorized' : 'forbidden')
      return
    }
    try {
      const url = new URL(req.url || '/', 'http://localhost')
      const view = url.searchParams.get('view') || ''
      const value = view
        ? await cachedView(config, url.searchParams, ctx.get('node:sqlite')?.DatabaseSync)
        : await cachedSnapshot(config, routeTicketId(req), ctx.get('node:sqlite')?.DatabaseSync)
      json(res, value && value.error && !value.tickets && !value.ticket && !value.groups && !value.repos && !value.entries && !value.path ? 400 : 200, value)
    } catch (error) {
      json(res, 500, { error: String(error && error.message ? error.message : error) })
    }
  }
}

function routeTicketId(req) {
  const url = new URL(req.url || '/', 'http://localhost')
  const ticket = url.searchParams.get('ticket') || ''
  // 只接受十六进制 ID 前缀，避免把任意字符串带进查询。
  return /^[0-9a-f]{6,32}$/i.test(ticket) ? ticket : ''
}

export function apply(ctx, config) {
  const route = {
    kind: 'exact',
    path: '/superagent-workbench/api',
    handler: serveRoute(ctx, config),
  }
  ctx.effect(() => ctx.webServer.register(route), 'superagent-workbench: api route')

  const minutes = Number(config.fetchMinutes) || 0
  if (minutes > 0 && looksLikeRepo(config.repoDir)) {
    const sync = async () => {
      syncState = await syncRemote(config.repoDir)
      ctx.logger.info('superagent-workbench: fetch %s %s', config.repoDir, syncState.ok ? '完成' : `失败 ${syncState.message}`)
      // 引用变了，缓存立即失效，下一次打开面板就是新内容。
      cache = { key: '', at: 0, value: undefined, pending: undefined }
    }
    ctx.effect(() => {
      const timer = setInterval(() => { void sync() }, minutes * 60 * 1000)
      timer.unref?.()
      return () => clearInterval(timer)
    }, 'superagent-workbench: fetch loop')
    queueMicrotask(() => { void sync() })
  } else if (!looksLikeRepo(config.repoDir)) {
    ctx.logger.warn('superagent-workbench: 仓库目录不存在或不是 git 仓库：%s', config.repoDir)
  }
  ctx.logger.info('superagent-workbench ready: db=%s repo=%s reposFile=%s', dbPathOf(config), config.repoDir, config.reposFile || '（单仓库）')
}

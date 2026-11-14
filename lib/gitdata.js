/**
 * 只读访问 superagent 的交付仓库（默认读 origin/main 的 git 对象，不 checkout、不改工作区）。
 *
 * 为什么不用工作区文件：superagent 仓库在本机通常落后几十个提交，也没 checkout 交付分支，
 * `git show <ref>:<path>` 只读对象库，看到的就是远端上的真实内容。
 * 后台定时 `git fetch` 只更新引用，不动工作区。
 */

import { execFile } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { promisify } from 'node:util'

const run = promisify(execFile)
const MAX_BUFFER = 64 * 1024 * 1024

async function git(cwd, args) {
  const { stdout } = await run('git', args, { cwd, maxBuffer: MAX_BUFFER, timeout: 30_000, windowsHide: true })
  return stdout
}

/** 工单记录文档：superagent 约定放在 docs/work/<工单ID 前 8 位>-*.md。 */
export async function findTicketDoc(repoDir, ticketId, ref = 'origin/main') {
  const prefix = ticketId.slice(0, 8)
  let listing
  try {
    listing = await git(repoDir, ['ls-tree', '-r', '--name-only', ref, '--', 'docs/work'])
  } catch {
    return ''
  }
  return listing
    .split('\n')
    .map(line => line.trim())
    .find(path => path.endsWith('.md') && path.startsWith(`docs/work/${prefix}`)) || ''
}

/** 读取 ref 下某文件的内容；文件不存在时返回 undefined。 */
export async function fileAt(repoDir, path, ref = 'origin/main') {
  try {
    return await git(repoDir, ['show', `${ref}:${path}`])
  } catch {
    return undefined
  }
}

/** 仓库当前 HEAD 摘要，用于提示本地落后与后台同步状态。 */
export async function headInfo(repoDir) {
  const read = async args => {
    try {
      return (await git(repoDir, args)).trim()
    } catch {
      return ''
    }
  }
  const [branch, head] = await Promise.all([
    read(['rev-parse', '--abbrev-ref', 'HEAD']),
    read(['log', '-1', '--format=%h %s', 'HEAD']),
  ])
  return { branch, head }
}

async function hasCommit(repoDir, ref) {
  try {
    await git(repoDir, ['rev-parse', '--verify', '--quiet', `${ref}^{commit}`])
    return true
  } catch {
    return false
  }
}

/**
 * 读取交付分支相对 base 的改动：文件清单、diffstat、完整补丁（截断到 400KB）。
 * 本地与 origin 都没有该分支时返回 exists=false，面板显示「尚未推送」。
 */
export async function branchDiff(repoDir, branch, base = 'origin/main') {
  if (!branch) return { exists: false, files: [], stat: '', patch: '' }
  let ref = ''
  for (const candidate of [branch, `origin/${branch}`]) {
    if (await hasCommit(repoDir, candidate)) { ref = candidate; break }
  }
  if (!ref) return { exists: false, files: [], stat: '', patch: '' }
  const range = `${base}...${ref}`
  const [nameStatus, stat, patch] = await Promise.all([
    git(repoDir, ['diff', '--name-status', range]),
    git(repoDir, ['diff', '--stat', range]),
    git(repoDir, ['diff', '--no-color', '--patience', range]).catch(() => ''),
  ])
  const files = nameStatus
    .split('\n')
    .filter(Boolean)
    .map(line => {
      const [status, ...rest] = line.split('\t')
      // 重命名会给出「旧路径」「新路径」两段。
      return { status: status || '?', path: rest.length > 1 ? `${rest[0]} → ${rest[1]}` : (rest[0] || '') }
    })
  return { exists: true, ref, files, stat: stat.trim(), patch: patch.slice(0, 400_000) }
}

/** 后台同步：fetch 远端只更新引用，不碰工作区。 */
export async function syncRemote(repoDir) {
  const at = new Date().toISOString()
  try {
    await git(repoDir, ['fetch', '--quiet', '--prune', 'origin'])
    return { ok: true, at, message: '' }
  } catch (error) {
    const detail = error && error.stderr ? String(error.stderr) : String(error)
    return { ok: false, at, message: detail.trim().slice(0, 400) }
  }
}

/** 目录是否像一个 git 仓库；不从工作区向上查找，避免误读父仓库。 */
export function looksLikeRepo(repoDir) {
  return Boolean(repoDir) && existsSync(join(repoDir, '.git'))
}

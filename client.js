/**
 * 交付台（浏览器端）：在侧栏加一个独立面板，读 Host 的 /superagent-workbench/api，
 * 展示 superagent 的工单列表、执行报告、分支改动与工单记录。
 *
 * 渲染入口与 dsh-superagent 官方面板一致（main 槽位 + sidebar.panellist 图标），
 * 所以它能作为官方面板的并列入口存在：官方面板管配置与运行，这里专门看交付物。
 */
// 浏览器端插件脚本由 dsh-client-modules 以**普通脚本**原样拼接执行（只注册
// window.__ModuleLoader__.load 的工厂），不得出现 import / export：顶层 import
// 会让整条 entry 在 import 阶段失败（"<id> import failed (see console)"）。
// 因此字典直接内联；改动文案时请同步 locale/zh.json、locale/en.json 与本处。
const zh = {
  "meta": {
    "title": "交付台",
    "description": "在 DSH 侧栏查看 dsh-superagent 的工单、交付分支改动与工单记录，作为官方 Superagent 面板的补充。"
  },
  "panel": "交付台",
  "loading": "正在读取工单…",
  "refreshedAt": "更新于 {time}",
  "tickets": "工单",
  "all": "全部",
  "live": "进行中",
  "countAll": "共 {n} 条",
  "countLive": "{n} 条进行中",
  "filterLive": "只看进行中",
  "filterAll": "看全部",
  "back": "返回列表",
  "emptyTickets": "没有读到工单。superagent 还没处理过任何需求，或工单库路径不对。",
  "emptyLive": "当前没有进行中的工单。",
  "loadFailed": "读取失败：{message}",
  "retry": "重试",
  "summary": "执行摘要",
  "latestReport": "最新报告",
  "reports": "执行报告（{n} 轮）",
  "reportRound": "第 {n} 轮",
  "noReport": "还没有执行报告。",
  "doc": "工单记录",
  "noDoc": "仓库里没有这篇工单记录（docs/work/{prefix}-*.md）。",
  "diff": "分支改动",
  "noDiff": "还没有可读的分支改动：分支尚未推送，或与 main 没有差异。",
  "diffFiles": "{n} 个文件",
  "diffTruncated": "补丁过大，只展示前 400KB。",
  "source": "来源",
  "createdAt": "创建",
  "updatedAt": "更新",
  "branch": "分支",
  "execDir": "执行目录",
  "execExists": "本地仍在",
  "execCleaned": "已清理",
  "outcome": "结束",
  "fullId": "完整 ID",
  "pullRequest": "Pull Request",
  "issue": "Issue",
  "attention": "等待回答",
  "dbMissing": "读不到工单库：{message}",
  "repoMissing": "交付仓库不可用：{dir}。分支改动与工单记录将无法显示。",
  "syncOk": "仓库已同步 {time}",
  "syncFail": "上次同步失败：{message}",
  "navTickets": "工单",
  "navDocs": "文档",
  "navCode": "代码",
  "docsTitle": "文档",
  "docsHint": "浏览各纳管仓库里的 Markdown 文档。",
  "docsCount": "{n} 篇",
  "noDocs": "没有可读的 Markdown 文档。",
  "openDoc": "打开文档",
  "backToDocs": "返回文档列表",
  "codeTitle": "代码仓库",
  "codeHint": "浏览纳管仓库的目录、源码与最近提交。",
  "repoCount": "{n} 个仓库",
  "noRepos": "没有可用的仓库。请检查 reposFile 或 repoDir 配置。",
  "openRepo": "浏览仓库",
  "repoUnavailable": "仓库不可用：{message}",
  "branch": "分支",
  "head": "最新提交",
  "modeGit": "git 对象（不改工作区）",
  "modeWorktree": "工作区文件",
  "dirty": "{n} 个未提交",
  "commits": "最近提交",
  "noCommits": "没有读到提交记录。",
  "backToRepos": "返回仓库列表",
  "backToTree": "返回目录",
  "emptyTree": "这个目录是空的。",
  "dirCount": "{n} 个目录",
  "fileCount": "{n} 个文件",
  "fileTooLarge": "文件超过 2MB，不在页面内渲染。",
  "binaryFile": "二进制文件，不在页面内渲染。",
  "docFile": "Markdown 文档",
  "codeFile": "源码文件",
  "loadingData": "正在读取…",
  "readFailed": "读取失败：{message}",
  "lineNo": "行号",
  "repoPath": "路径"
}

const en = {
  "meta": {
    "title": "Delivery desk",
    "description": "Read dsh-superagent tickets, branch changes and work notes inside the DSH sidebar, as a companion to the official Superagent panel."
  },
  "panel": "Delivery desk",
  "loading": "Reading tickets…",
  "refreshedAt": "Updated {time}",
  "tickets": "Tickets",
  "all": "All",
  "live": "Active",
  "countAll": "{n} total",
  "countLive": "{n} active",
  "filterLive": "Active only",
  "filterAll": "Show all",
  "back": "Back to list",
  "emptyTickets": "No tickets were found. Superagent has not handled any request yet, or the ticket database path is wrong.",
  "emptyLive": "No active tickets right now.",
  "loadFailed": "Could not load: {message}",
  "retry": "Retry",
  "summary": "Execution summary",
  "latestReport": "Latest report",
  "reports": "Reports ({n} rounds)",
  "reportRound": "Round {n}",
  "noReport": "No report yet.",
  "doc": "Work note",
  "noDoc": "This repository has no work note for the ticket (docs/work/{prefix}-*.md).",
  "diff": "Branch changes",
  "noDiff": "No branch changes to read: the branch is not pushed yet, or it has no difference from main.",
  "diffFiles": "{n} files",
  "diffTruncated": "The patch is too large; only the first 400KB is shown.",
  "source": "Source",
  "createdAt": "Created",
  "updatedAt": "Updated",
  "branch": "Branch",
  "execDir": "Execution directory",
  "execExists": "Still on disk",
  "execCleaned": "Cleaned up",
  "outcome": "Outcome",
  "fullId": "Full ID",
  "pullRequest": "Pull request",
  "issue": "Issue",
  "attention": "Waiting for an answer",
  "dbMissing": "Ticket database unavailable: {message}",
  "repoMissing": "Delivery repository unavailable: {dir}. Branch changes and work notes cannot be shown.",
  "syncOk": "Repository synced {time}",
  "syncFail": "Last sync failed: {message}",
  "navTickets": "Tickets",
  "navDocs": "Docs",
  "navCode": "Code",
  "docsTitle": "Docs",
  "docsHint": "Browse Markdown documents in configured repositories.",
  "docsCount": "{n} docs",
  "noDocs": "No readable Markdown documents.",
  "openDoc": "Open document",
  "backToDocs": "Back to docs",
  "codeTitle": "Code repositories",
  "codeHint": "Browse repository directories, source files and recent commits.",
  "repoCount": "{n} repos",
  "noRepos": "No repository available. Check reposFile or repoDir.",
  "openRepo": "Browse repository",
  "repoUnavailable": "Repository unavailable: {message}",
  "branch": "Branch",
  "head": "Latest commit",
  "modeGit": "Git objects (worktree untouched)",
  "modeWorktree": "Worktree files",
  "dirty": "{n} uncommitted",
  "commits": "Recent commits",
  "noCommits": "No commits found.",
  "backToRepos": "Back to repositories",
  "backToTree": "Back to directory",
  "emptyTree": "This directory is empty.",
  "dirCount": "{n} dirs",
  "fileCount": "{n} files",
  "fileTooLarge": "File is larger than 2MB and is not rendered inline.",
  "binaryFile": "Binary file, not rendered inline.",
  "docFile": "Markdown document",
  "codeFile": "Source file",
  "loadingData": "Loading…",
  "readFailed": "Could not load: {message}",
  "lineNo": "Line",
  "repoPath": "Path"
}

window.__ModuleLoader__.load({
  id: 'dsh-superagent-workbench',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const API = '/superagent-workbench/api'
    const PANEL_ID = 'superagent-workbench'
    const NS = 'superagentWorkbench'
    const REFRESH_MS = 20_000

    // ---------------- 样式：只用 --dsw-alias-* 主题令牌，跟随明暗与字体 ----------------

    const CSS = `
.sawb-root { display: flex; flex-direction: column; height: 100%; min-height: 0; overflow: hidden; color: var(--dsw-alias-label-primary); background: var(--dsw-alias-bg-base); font-size: 13px; line-height: 1.55; }
.sawb-head { display: flex; align-items: center; gap: 10px; padding: 12px clamp(18px, 3vw, 40px); border-bottom: 1px solid var(--dsw-alias-border-l1); flex-wrap: wrap; flex: 0 0 auto; background: var(--dsw-alias-bg-base); }
.sawb-head.sawb-subhead { border-bottom: 0; padding-bottom: 2px; }
.sawb-title { margin: 0; font-size: 15px; font-weight: 600; }
.sawb-meta { color: var(--dsw-alias-label-secondary); font-size: 12px; }
.sawb-spacer { flex: 1; }
.sawb-btn { border: 1px solid var(--dsw-alias-border-l2); background: transparent; color: var(--dsw-alias-label-primary); border-radius: 6px; padding: 3px 10px; font: inherit; font-size: 12px; cursor: pointer; }
.sawb-btn:hover { background: var(--dsw-alias-bg-layer-2); }
.sawb-btn[aria-pressed="true"] { background: var(--dsw-alias-bg-layer-2); border-color: var(--dsw-alias-brand-primary); }
.sawb-btn:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 1px; }
.sawb-btn.sawb-btn-sm { padding: 2px 8px; }
.sawb-tabs { display: inline-flex; gap: 2px; padding: 2px; border-radius: 8px; background: var(--dsw-alias-bg-layer-2); }
.sawb-tabs button { border: 0; background: transparent; color: var(--dsw-alias-label-secondary); font: inherit; font-size: 12px; padding: 3px 12px; border-radius: 6px; cursor: pointer; }
.sawb-tabs button[aria-pressed="true"] { background: var(--dsw-alias-bg-base); color: var(--dsw-alias-label-primary); box-shadow: 0 1px 2px rgba(0,0,0,.12); }
.sawb-tabs button:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 0; }
.sawb-body { flex: 1 1 auto; min-height: 0; overflow-y: auto; overflow-x: hidden; padding: 24px clamp(18px, 3vw, 40px) 52px; overscroll-behavior: contain; scrollbar-width: thin; }
.sawb-body.sawb-body-tight { padding-top: 12px; }
.sawb-notice { border: 1px solid var(--dsw-alias-state-warn-primary); border-radius: 8px; padding: 8px 12px; margin: 0 0 12px; font-size: 12px; }
.sawb-notice.sawb-error { border-color: var(--dsw-alias-state-error-primary); }
.sawb-empty { color: var(--dsw-alias-label-secondary); padding: 24px 0; text-align: center; }
.sawb-badge { display: inline-block; padding: 0 7px; border-radius: 999px; font-size: 11px; line-height: 18px; border: 1px solid var(--dsw-alias-border-l2); color: var(--dsw-alias-label-secondary); white-space: nowrap; }
.sawb-badge.live { border-color: var(--dsw-alias-brand-primary); color: var(--dsw-alias-brand-primary); }
.sawb-badge.ok { border-color: var(--dsw-alias-state-success-primary); color: var(--dsw-alias-state-success-primary); }
.sawb-badge.muted { border-color: var(--dsw-alias-state-idle-primary); color: var(--dsw-alias-state-idle-primary); }
.sawb-row { display: grid; grid-template-columns: 78px 1fr auto; gap: 2px 12px; width: 100%; text-align: left; border: 0; border-bottom: 1px solid var(--dsw-alias-border-l1); background: transparent; color: inherit; font: inherit; padding: 9px 8px; cursor: pointer; }
.sawb-row:hover { background: var(--dsw-alias-bg-layer-2); }
.sawb-row:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: -2px; }
.sawb-row-title { font-weight: 500; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.sawb-mono { font-family: var(--dsw-font-mono, ui-monospace, SFMono-Regular, Menlo, monospace); font-size: 12px; color: var(--dsw-alias-label-secondary); }
.sawb-row-sub { grid-column: 2 / 4; font-size: 12px; color: var(--dsw-alias-label-secondary); min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.sawb-row-side { display: flex; align-items: center; gap: 8px; }
.sawb-detail-head { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
.sawb-detail-title { margin: 0; font-size: 17px; font-weight: 600; line-height: 1.4; }
.sawb-facts { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 8px 18px; border: 1px solid var(--dsw-alias-border-l1); border-radius: 8px; padding: 10px 14px; margin: 0 0 14px; background: var(--dsw-alias-bg-layer-1); }
.sawb-facts div { min-width: 0; }
.sawb-facts dt { font-size: 11px; color: var(--dsw-alias-label-secondary); }
.sawb-facts dd { margin: 0; overflow-wrap: anywhere; font-size: 12px; }
.sawb-section { margin-bottom: 16px; }
.sawb-section h3 { display: flex; align-items: center; gap: 8px; margin: 0 0 8px; font-size: 13px; font-weight: 600; flex-wrap: wrap; }
.sawb-panel { border: 1px solid var(--dsw-alias-border-l1); border-radius: 10px; background: var(--dsw-alias-bg-layer-1); padding: 14px 18px; line-height: 1.75; }
.sawb-md p { margin: 0 0 6px; }
.sawb-md ul, .sawb-md ol { margin: 0 0 6px; padding-left: 20px; }
.sawb-md code { font-family: var(--dsw-font-mono, ui-monospace, SFMono-Regular, Menlo, monospace); font-size: 12px; background: var(--dsw-alias-bg-layer-2); border-radius: 4px; padding: 0 4px; }
.sawb-md pre { font-family: var(--dsw-font-mono, ui-monospace, SFMono-Regular, Menlo, monospace); font-size: 12px; background: var(--dsw-alias-bg-layer-2); border-radius: 6px; padding: 8px 10px; overflow: auto; margin: 0 0 8px; }
.sawb-md blockquote { margin: 0 0 6px; padding-left: 10px; border-left: 2px solid var(--dsw-alias-border-l2); color: var(--dsw-alias-label-secondary); }
.sawb-table-wrap { width: 100%; overflow-x: auto; margin: 4px 0 12px; border: 1px solid var(--dsw-alias-border-l1); border-radius: 8px; }
.sawb-md table { width: 100%; border-collapse: collapse; font-size: 12px; }
.sawb-md th, .sawb-md td { padding: 8px 12px; border-bottom: 1px solid var(--dsw-alias-border-l1); text-align: left; vertical-align: top; }
.sawb-md th { background: var(--dsw-alias-bg-layer-2); font-weight: 600; white-space: nowrap; }
.sawb-md tr:last-child td { border-bottom: 0; }
.sawb-md a, .sawb-link { color: var(--dsw-alias-brand-primary); text-decoration: none; overflow-wrap: anywhere; }
.sawb-md a:hover, .sawb-link:hover { text-decoration: underline; }
.sawb-links { display: flex; gap: 14px; flex-wrap: wrap; }
.sawb-files { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 8px; }
.sawb-files td { border-bottom: 1px solid var(--dsw-alias-border-l1); padding: 4px 6px; vertical-align: top; }
.sawb-files td:first-child { width: 64px; color: var(--dsw-alias-label-secondary); font-family: var(--dsw-font-mono, ui-monospace, SFMono-Regular, Menlo, monospace); }
.sawb-files td:last-child { font-family: var(--dsw-font-mono, ui-monospace, SFMono-Regular, Menlo, monospace); overflow-wrap: anywhere; }
.sawb-stat { font-family: var(--dsw-font-mono, ui-monospace, SFMono-Regular, Menlo, monospace); font-size: 12px; color: var(--dsw-alias-label-secondary); white-space: pre-wrap; margin: 0 0 8px; }
.sawb-diff-file { border: 1px solid var(--dsw-alias-border-l1); border-radius: 6px; margin-bottom: 10px; overflow: hidden; }
.sawb-diff-file > summary { cursor: pointer; padding: 6px 10px; background: var(--dsw-alias-bg-layer-2); font-family: var(--dsw-font-mono, ui-monospace, SFMono-Regular, Menlo, monospace); font-size: 12px; display: flex; gap: 10px; }
.sawb-diff-file > summary .sawb-count { color: var(--dsw-alias-label-secondary); margin-left: auto; }
.sawb-diff-body { margin: 0; font-family: var(--dsw-font-mono, ui-monospace, SFMono-Regular, Menlo, monospace); font-size: 12px; line-height: 1.5; overflow: auto; max-height: 420px; }
.sawb-diff-body span { display: block; padding: 0 10px; white-space: pre; }
.sawb-diff-body .add { color: var(--dsw-alias-state-success-primary); }
.sawb-diff-body .del { color: var(--dsw-alias-state-error-primary); }
.sawb-diff-body .hunk { color: var(--dsw-alias-label-secondary); }
.sawb-diff-body .meta { color: var(--dsw-alias-state-idle-primary); }
.sawb-reports details { border-top: 1px solid var(--dsw-alias-border-l1); padding: 6px 0; }
.sawb-reports summary { cursor: pointer; color: var(--dsw-alias-label-secondary); font-size: 12px; }
.sawb-live-dot { display: inline-block; width: 7px; height: 7px; border-radius: 50%; background: var(--dsw-alias-brand-primary); margin-right: 6px; }
.sawb-foot { padding: 12px 18px 12px; flex: 0 0 auto; }
.sawb-crumbs { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; font-size: 12px; color: var(--dsw-alias-label-secondary); margin-bottom: 12px; }
.sawb-crumbs button { border: 0; background: transparent; color: var(--dsw-alias-brand-primary); font: inherit; padding: 1px 2px; cursor: pointer; }
.sawb-crumbs button:hover { text-decoration: underline; }
.sawb-doc-list { width: 100%; max-width: 1040px; box-sizing: border-box; border: 1px solid var(--dsw-alias-border-l1); border-radius: 12px; overflow: hidden; margin: 0 auto 20px; background: var(--dsw-alias-bg-layer-1); }
.sawb-doc-group-title { display: flex; align-items: center; gap: 8px; padding: 12px 16px; background: var(--dsw-alias-bg-layer-2); font-weight: 600; font-size: 13px; }
.sawb-doc-item { display: flex; align-items: center; gap: 12px; width: 100%; border: 0; border-top: 1px solid var(--dsw-alias-border-l1); background: transparent; color: inherit; font: inherit; padding: 10px 16px; text-align: left; cursor: pointer; }
.sawb-doc-item:hover { background: var(--dsw-alias-bg-layer-2); }
.sawb-doc-item .sawb-doc-title { font-weight: 500; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.sawb-doc-item .sawb-doc-path { margin-left: auto; font-family: var(--dsw-font-mono, ui-monospace, SFMono-Regular, Menlo, monospace); font-size: 11px; color: var(--dsw-alias-label-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 55%; }
.sawb-repo-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 22px; width: 100%; max-width: 1360px; margin: 0 auto; }
.sawb-repo-card { border: 1px solid var(--dsw-alias-border-l1); border-radius: 12px; background: var(--dsw-alias-bg-layer-1); padding: 18px 20px; display: flex; flex-direction: column; gap: 12px; min-width: 0; transition: border-color .15s ease, transform .15s ease; }
.sawb-repo-card:hover { border-color: var(--dsw-alias-brand-primary); transform: translateY(-1px); }
.sawb-repo-card h3 { margin: 0; font-size: 15px; }
.sawb-repo-card p { margin: 0; }
.sawb-repo-info { display: grid; grid-template-columns: auto 1fr; gap: 2px 10px; font-size: 12px; }
.sawb-repo-info dt { color: var(--dsw-alias-label-secondary); }
.sawb-repo-info dd { margin: 0; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.sawb-repo-card .sawb-foot-line { margin-top: auto; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.sawb-tree { width: 100%; box-sizing: border-box; border: 1px solid var(--dsw-alias-border-l1); border-radius: 10px; overflow: hidden; background: var(--dsw-alias-bg-layer-1); }
.sawb-tree-row { display: flex; align-items: center; gap: 12px; width: 100%; border: 0; border-top: 1px solid var(--dsw-alias-border-l1); background: transparent; color: inherit; font: inherit; padding: 9px 14px; text-align: left; cursor: pointer; }
.sawb-tree-row:first-child { border-top: 0; }
.sawb-tree-row:hover { background: var(--dsw-alias-bg-layer-2); }
.sawb-tree-icon { width: 18px; text-align: center; color: var(--dsw-alias-label-secondary); flex: 0 0 auto; }
.sawb-tree-name { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.sawb-tree-row .sawb-meta { margin-left: auto; }
.sawb-code-wrap { width: 100%; box-sizing: border-box; border: 1px solid var(--dsw-alias-border-l1); border-radius: 10px; background: var(--dsw-alias-bg-layer-1); overflow: hidden; }
.sawb-code { margin: 0; padding: 10px 0; overflow: auto; max-height: calc(100vh - 280px); font-family: var(--dsw-font-mono, ui-monospace, SFMono-Regular, Menlo, monospace); font-size: 12px; line-height: 1.55; tab-size: 2; }
.sawb-code-line { display: flex; min-width: max-content; }
.sawb-code-line:hover { background: var(--dsw-alias-bg-layer-2); }
.sawb-line-no { flex: 0 0 54px; padding: 0 10px 0 8px; text-align: right; color: var(--dsw-alias-state-idle-primary); user-select: none; }
.sawb-line-text { white-space: pre; padding-right: 16px; }
.sawb-file-head { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 12px; }
.sawb-body > .sawb-file-head,
.sawb-body > .sawb-crumbs,
.sawb-body > .sawb-tree,
.sawb-body > .sawb-code-wrap,
.sawb-body > .sawb-panel { width: 100%; max-width: 1120px; box-sizing: border-box; margin-left: auto; margin-right: auto; }
.sawb-body > .sawb-section { width: 100%; max-width: 1080px; margin-left: auto; margin-right: auto; }
@media (max-width: 900px) {
  .sawb-head { padding-left: 14px; padding-right: 14px; }
  .sawb-body { padding: 16px 14px 36px; }
  .sawb-repo-grid { grid-template-columns: 1fr; gap: 16px; }
  .sawb-doc-item { align-items: flex-start; flex-direction: column; gap: 3px; }
  .sawb-doc-item .sawb-doc-path { margin-left: 0; max-width: 100%; }
}
`

    function StyleTag() {
      return h('style', { 'data-plugin': NS }, CSS)
    }

    // ---------------- 小工具 ----------------

    function when(value) {
      if (!value) return '—'
      const date = new Date(value)
      if (Number.isNaN(date.getTime())) return String(value).replace('T', ' ').slice(0, 16)
      const pad = number => String(number).padStart(2, '0')
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
    }

    function urlNumber(url, kind) {
      const match = new RegExp(`/${kind}/(\\d+)`).exec(url || '')
      return match ? `#${match[1]}` : ''
    }

    function badge(text, tone) {
      return h('span', { className: `sawb-badge ${tone || ''}`.trim() }, text)
    }

    function toneOf(ticket) {
      if (ticket.live) return 'live'
      if (ticket.outcome === 'merged' || ticket.outcome === 'completed') return 'ok'
      return 'muted'
    }

    function external(href, text, key) {
      return h('a', { key, className: 'sawb-link', href, target: '_blank', rel: 'noopener noreferrer' }, text)
    }

    /** 行内片段：加粗、行内代码、链接，纯 React 元素，不用 innerHTML。 */
    function Inlines({ parts }) {
      return parts.map((part, index) => {
        if (part.kind === 'bold') return h('strong', { key: index }, part.text)
        if (part.kind === 'code') return h('code', { key: index }, part.text)
        if (part.kind === 'link') return h(React.Fragment, { key: index }, external(part.url, part.text))
        return h(React.Fragment, { key: index }, part.text)
      })
    }

    /** Markdown 块渲染：Host 已把文本切好，这里只做 React 元素映射。 */
    function Markdown({ blocks }) {
      if (!blocks || blocks.length === 0) return null
      return h('div', { className: 'sawb-md' }, blocks.map((block, index) => {
        if (block.kind === 'code') return h('pre', { key: index }, block.text)
        if (block.kind === 'list') {
          const items = block.items.map((item, at) => h('li', { key: at }, h(Inlines, { parts: item.parts })))
          return block.ordered ? h('ol', { key: index }, items) : h('ul', { key: index }, items)
        }
        if (block.kind === 'table') {
          return h('div', { key: index, className: 'sawb-table-wrap' },
            h('table', null,
              h('thead', null, h('tr', null, block.headers.map((cell, at) => h('th', { key: at }, h(Inlines, { parts: cell.parts }))))),
              h('tbody', null, block.rows.map((row, rowIndex) =>
                h('tr', { key: rowIndex }, row.map((cell, at) => h('td', { key: at }, h(Inlines, { parts: cell.parts }))))))))
        }
        if (block.kind === 'heading') return h('p', { key: index }, h('strong', null, h(Inlines, { parts: block.parts })))
        if (block.kind === 'quote') return h('blockquote', { key: index }, h(Inlines, { parts: block.parts }))
        return h('p', { key: index }, h(Inlines, { parts: block.parts }))
      }))
    }

    function diffLineClass(line) {
      if (line.startsWith('+++') || line.startsWith('---')) return 'meta'
      if (line.startsWith('@@')) return 'hunk'
      if (line.startsWith('+')) return 'add'
      if (line.startsWith('-')) return 'del'
      return ''
    }

    /** 按需加载一个接口：列表不带 ticket，详情带 ticket；两者不是同一份快照。 */
    function loadSnapshot(ticketId, signal) {
      const url = ticketId ? `${API}?ticket=${encodeURIComponent(ticketId)}` : API
      return fetch(url, { credentials: 'same-origin', signal, headers: { accept: 'application/json' } }).then(async response => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const data = await response.json()
        if (data && data.error && !data.tickets && !data.ticket) throw new Error(data.error)
        return data
      })
    }

    /** 文档 / 代码视图统一走同一个只读 API，不同 view 参数由 Host 调度。 */
    function loadApi(params, signal) {
      const search = new URLSearchParams()
      Object.entries(params || {}).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') search.set(key, String(value))
      })
      return fetch(`${API}?${search.toString()}`, {
        credentials: 'same-origin', signal, headers: { accept: 'application/json' },
      }).then(async response => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const data = await response.json()
        if (data && data.error) throw new Error(data.error)
        return data
      })
    }

    function errorText(error) {
      return String(error && error.message ? error.message : error)
    }

    // ---------------- 视图 ----------------

    /** 所有页面都必须经过 Root：保证 style 永远存在，并给内容区稳定的高度/滚动容器。 */
    function Root({ children }) {
      return h('div', { className: 'sawb-root' }, h(StyleTag), children)
    }

    function Tabs({ section, t, onSection }) {
      const items = [
        ['tickets', t('navTickets')],
        ['docs', t('navDocs')],
        ['code', t('navCode')],
      ]
      return h('div', { className: 'sawb-tabs', role: 'tablist' },
        items.map(([key, label]) => h('button', {
          key,
          type: 'button',
          role: 'tab',
          'aria-pressed': String(section === key),
          onClick: () => onSection(key),
        }, label)))
    }

    function CodeBlock({ text }) {
      const lines = String(text || '').split('\n')
      return h('pre', { className: 'sawb-code' }, lines.map((line, index) =>
        h('span', { key: index, className: 'sawb-code-line' },
          h('span', { className: 'sawb-line-no', 'aria-hidden': true }, String(index + 1)),
          h('span', { className: 'sawb-line-text' }, line || ' '))))
    }

    function Breadcrumbs({ repo, path, t, onRoot, onPath }) {
      const parts = String(path || '').split('/').filter(Boolean)
      return h('div', { className: 'sawb-crumbs', 'aria-label': t('repoPath') },
        h('button', { type: 'button', onClick: onRoot }, repo.name),
        parts.map((part, index) => h(React.Fragment, { key: index },
          h('span', null, '/'),
          h('button', { type: 'button', onClick: () => onPath(parts.slice(0, index + 1).join('/')) }, part))))
    }

    function Notice({ children, tone }) {
      return h('div', { className: `sawb-notice${tone === 'error' ? ' sawb-error' : ''}`, role: 'status' }, children)
    }

    function TicketRow({ ticket, t, onOpen }) {
      const extra = [
        when(ticket.createdAt),
        ticket.branch,
        ticket.doc && ticket.doc.title ? `${t('doc')} · ${ticket.doc.title}` : '',
      ].filter(Boolean).join(' · ')
      return h('button', { type: 'button', className: 'sawb-row', onClick: () => onOpen(ticket.id) },
        h('span', { className: 'sawb-mono' }, ticket.shortId),
        h('span', { className: 'sawb-row-title', title: ticket.title }, ticket.title),
        h('span', { className: 'sawb-row-side' },
          ticket.prUrl ? h('span', { className: 'sawb-mono' }, `PR ${urlNumber(ticket.prUrl, 'pull')}`.trim()) : null,
          badge(ticket.label, toneOf(ticket))),
        h('span', { className: 'sawb-row-sub' },
          ticket.live ? h('span', { className: 'sawb-live-dot', 'aria-hidden': true }) : null,
          extra))
    }

    function ListView({ data, t, onOpen, section, onSection }) {
      const [showAll, setShowAll] = React.useState(false)
      const all = (data && data.tickets) || []
      const live = all.filter(ticket => ticket.live)
      // 默认先看进行中；没有进行中就直接给全部，免得用户对着空列表。
      const showLive = !showAll && live.length > 0
      const shown = showLive ? live : all
      const notices = []
      if (data && data.db && !data.db.ok) notices.push(h(Notice, { key: 'db', tone: 'error' }, t('dbMissing', { message: data.db.error })))
      if (data && data.repo && !data.repo.ok) notices.push(h(Notice, { key: 'repo' }, t('repoMissing', { dir: data.repo.dir })))
      const sync = data && data.repo && data.repo.sync
      return h(React.Fragment, null,
        h('div', { className: 'sawb-head' },
          h('h2', { className: 'sawb-title' }, t('tickets')),
          h('span', { className: 'sawb-meta' }, live.length > 0 ? `${t('countLive', { n: live.length })} · ${t('countAll', { n: all.length })}` : t('countAll', { n: all.length })),
          h('span', { className: 'sawb-spacer' }),
          sync && sync.at
            ? h('span', { className: 'sawb-meta', title: sync.message || '' },
                sync.ok === false ? t('syncFail', { message: sync.message }) : t('syncOk', { time: when(sync.at) }))
            : null,
          h(Tabs, { section, t, onSection }),
          h('button', {
            type: 'button',
            className: 'sawb-btn',
            'aria-pressed': String(showAll),
            onClick: () => setShowAll(value => !value),
          }, showAll ? t('filterLive') : t('filterAll')),
        ),
        h('div', { className: 'sawb-body' },
          notices,
          shown.length === 0
            ? h('div', { className: 'sawb-empty' }, all.length === 0 ? t('emptyTickets') : t('emptyLive'))
            : h('div', null, shown.map(ticket => h(TicketRow, { key: ticket.id, ticket, t, onOpen })))),
      )
    }

    function Facts({ ticket, t }) {
      // 链接带自己的 key：作为 span 的子节点直接渲染，避免 React 列表 key 警告。
      const issue = ticket.issueUrl ? [external(ticket.issueUrl, `${t('issue')} ${urlNumber(ticket.issueUrl, 'issues')}`.trim(), 'issue')] : []
      const pr = ticket.prUrl ? [external(ticket.prUrl, `${t('pullRequest')} ${urlNumber(ticket.prUrl, 'pull')}`.trim(), 'pr')] : []
      const rows = [
        [t('source'), issue.length || pr.length ? h('span', { className: 'sawb-links' }, issue, pr) : '—'],
        [t('createdAt'), when(ticket.createdAt)],
        [t('updatedAt'), when(ticket.updatedAt)],
        [t('branch'), h('span', { className: 'sawb-mono' }, ticket.branch || '—')],
        [t('execDir'), h('span', { className: 'sawb-mono', title: ticket.execDir }, `${ticket.execDir || '—'} · ${ticket.execExists ? t('execExists') : t('execCleaned')}`)],
        [t('outcome'), ticket.endedAt ? `${ticket.label} · ${when(ticket.endedAt)}` : ticket.label],
        [t('fullId'), h('span', { className: 'sawb-mono' }, ticket.id)],
      ]
      return h('dl', { className: 'sawb-facts' }, rows.map(([label, value], index) =>
        h('div', { key: index }, h('dt', null, label), h('dd', null, value))))
    }

    function DiffSection({ ticket, t }) {
      const diff = ticket.diff
      const title = t('diff')
      if (!diff || !diff.exists) {
        return h('section', { className: 'sawb-section' }, h('h3', null, title), h('div', { className: 'sawb-panel sawb-meta' }, t('noDiff')))
      }
      const files = diff.files || []
      const patch = diff.patch || []
      return h('section', { className: 'sawb-section' },
        h('h3', null, title, badge(`${t('diffFiles', { n: files.length })} · ${diff.ref || ''}`.trim(), 'muted')),
        files.length > 0
          ? h('table', { className: 'sawb-files' }, h('tbody', null, files.map((file, index) =>
              h('tr', { key: index }, h('td', null, file.status), h('td', null, file.path)))))
          : null,
        diff.stat ? h('pre', { className: 'sawb-stat' }, diff.stat) : null,
        patch.map((file, index) => h('details', { key: index, className: 'sawb-diff-file' },
          h('summary', null,
            h('span', null, file.path),
            h('span', { className: 'sawb-count' }, `+${file.added} −${file.removed}`)),
          h('pre', { className: 'sawb-diff-body' }, file.lines.map((line, at) =>
            h('span', { key: at, className: diffLineClass(line) }, line || ' '))))),
        diff.patchBytes >= 400_000 ? h('div', { className: 'sawb-meta' }, t('diffTruncated')) : null,
      )
    }

    function Reports({ ticket, t }) {
      const reports = Array.isArray(ticket.reports) ? ticket.reports : []
      if (reports.length === 0) {
        return h('section', { className: 'sawb-section' }, h('h3', null, t('latestReport')), h('div', { className: 'sawb-panel sawb-meta' }, t('noReport')))
      }
      const [latest, ...others] = reports
      return h('section', { className: 'sawb-section' },
        h('h3', null, t('latestReport'), badge(when(latest.at), 'muted')),
        h('div', { className: 'sawb-panel sawb-reports' },
          h(Markdown, { blocks: latest.blocks }),
          others.length > 0
            ? h('details', null,
                h('summary', null, t('reports', { n: reports.length })),
                others.map(report => h('div', { key: report.index, style: { marginTop: 8 } },
                  h('div', { className: 'sawb-meta' }, `${t('reportRound', { n: report.index })} · ${when(report.at)}`),
                  h(Markdown, { blocks: report.blocks }))))
            : null),
      )
    }

    function DetailView({ ticket, t, onBack }) {
      return h(React.Fragment, null,
        h('div', { className: 'sawb-head' },
          h('button', { type: 'button', className: 'sawb-btn', onClick: onBack }, `← ${t('back')}`),
          h('span', { className: 'sawb-spacer' }),
          h('span', { className: 'sawb-links' },
            ticket.prUrl ? external(ticket.prUrl, t('pullRequest')) : null,
            ticket.issueUrl ? external(ticket.issueUrl, t('issue')) : null)),
        h('div', { className: 'sawb-body' },
          h('div', { className: 'sawb-detail-head' },
            h('div', { className: 'sawb-meta' }, h('span', { className: 'sawb-mono' }, ticket.shortId), ' · ', badge(ticket.label, toneOf(ticket))),
            h('h2', { className: 'sawb-detail-title' }, ticket.title),
            ticket.attention ? h(Notice, null, `${t('attention')}：${ticket.attention}`) : null),
          h(Facts, { ticket, t }),
          h(Reports, { ticket, t }),
          h(DiffSection, { ticket, t }),
          ticket.doc
            ? h('section', { className: 'sawb-section' },
                h('h3', null, t('doc'), badge(ticket.doc.path, 'muted')),
                h('div', { className: 'sawb-panel' }, h(Markdown, { blocks: ticket.doc.blocks })))
            : h('section', { className: 'sawb-section' },
                h('h3', null, t('doc')),
                h('div', { className: 'sawb-panel sawb-meta' }, t('noDoc', { prefix: ticket.shortId }))),
        ))
    }

    /** 文档中心：按仓库分组列出 Markdown，点开后渲染正文。 */
    function DocsView({ t, section, onSection }) {
      const [index, setIndex] = React.useState({ phase: 'loading', groups: [], error: '' })
      const [doc, setDoc] = React.useState({ phase: 'idle', repo: undefined, data: undefined, error: '' })

      React.useEffect(() => {
        const controller = new AbortController()
        loadApi({ view: 'docs' }, controller.signal)
          .then(data => setIndex({ phase: 'ready', groups: data.groups || [], error: '' }))
          .catch(error => {
            if (error && error.name === 'AbortError') return
            setIndex({ phase: 'error', groups: [], error: errorText(error) })
          })
        return () => controller.abort()
      }, [])

      const openDoc = (repo, path) => {
        setDoc({ phase: 'loading', repo, data: undefined, error: '' })
        const controller = new AbortController()
        loadApi({ view: 'blob', repo: repo.id, path }, controller.signal)
          .then(data => setDoc({ phase: 'ready', repo, data, error: '' }))
          .catch(error => setDoc({ phase: 'error', repo, data: undefined, error: errorText(error) }))
      }

      if (doc.phase !== 'idle') {
        return h(React.Fragment, null,
          h('div', { className: 'sawb-head' },
            h('button', { type: 'button', className: 'sawb-btn', onClick: () => setDoc({ phase: 'idle', repo: undefined, data: undefined, error: '' }) }, `← ${t('backToDocs')}`),
            h('span', { className: 'sawb-spacer' }),
            h('span', { className: 'sawb-meta' }, doc.repo ? doc.repo.name : '')),
          h('div', { className: 'sawb-body' },
            doc.phase === 'error'
              ? h(Notice, { tone: 'error' }, t('readFailed', { message: doc.error }))
              : doc.phase === 'loading' || !doc.data
                ? h('div', { className: 'sawb-empty' }, t('loadingData'))
                : h(React.Fragment, null,
                    h('div', { className: 'sawb-file-head' },
                      h('h2', { className: 'sawb-detail-title' }, doc.data.path.split('/').pop()),
                      badge(doc.data.path, 'muted')),
                    doc.data.tooLarge
                      ? h(Notice, null, t('fileTooLarge'))
                      : h('div', { className: 'sawb-panel' }, h(Markdown, { blocks: doc.data.blocks })))))
      }

      const total = index.groups.reduce((sum, group) => sum + group.docs.length, 0)
      return h(React.Fragment, null,
        h('div', { className: 'sawb-head' },
          h('h2', { className: 'sawb-title' }, t('docsTitle')),
          h('span', { className: 'sawb-meta' }, t('docsHint')),
          h('span', { className: 'sawb-spacer' }),
          h('span', { className: 'sawb-meta' }, t('docsCount', { n: total })),
          h(Tabs, { section, t, onSection })),
        h('div', { className: 'sawb-body' },
          index.phase === 'error'
            ? h(Notice, { tone: 'error' }, t('readFailed', { message: index.error }))
            : index.phase === 'loading'
              ? h('div', { className: 'sawb-empty' }, t('loadingData'))
              : total === 0
                ? h('div', { className: 'sawb-empty' }, t('noDocs'))
                : index.groups.map(group => group.docs.length === 0 ? null : h('section', { key: group.repo.id, className: 'sawb-section' },
                    h('div', { className: 'sawb-doc-list' },
                      h('div', { className: 'sawb-doc-group-title' },
                        h('span', null, group.repo.name),
                        badge(t('docsCount', { n: group.docs.length }), 'muted')),
                      group.docs.map(item => h('button', {
                        key: item.path, type: 'button', className: 'sawb-doc-item', onClick: () => openDoc(group.repo, item.path),
                      },
                        h('span', { className: 'sawb-doc-title' }, item.title || item.path),
                        h('span', { className: 'sawb-doc-path', title: item.path }, item.path)))))))
      )
    }

    function RepoCard({ repo, t, onOpen }) {
      return h('article', { className: 'sawb-repo-card' },
        h('h3', null, repo.name, ' ', badge(repo.mode === 'git' ? t('modeGit') : t('modeWorktree'), 'muted')),
        repo.description ? h('p', { className: 'sawb-meta' }, repo.description) : null,
        repo.ok === false
          ? h(Notice, { tone: 'error' }, t('repoUnavailable', { message: repo.error }))
          : h('dl', { className: 'sawb-repo-info' },
              h('dt', null, t('branch')), h('dd', { className: 'sawb-mono' }, repo.branch || '—'),
              h('dt', null, t('head')), h('dd', { className: 'sawb-mono', title: repo.subject || '' }, `${repo.head || '—'}${repo.subject ? ` · ${repo.subject}` : ''}`),
              h('dt', null, t('repoPath')), h('dd', { className: 'sawb-mono', title: repo.path }, repo.path),
              repo.dirty ? h(React.Fragment, null, h('dt', null, ' '), h('dd', null, badge(t('dirty', { n: repo.dirty }), 'live'))) : null),
        repo.commits && repo.commits.length > 0
          ? h('div', null,
              h('div', { className: 'sawb-meta' }, t('commits')),
              h('ul', { className: 'sawb-meta', style: { margin: '4px 0 0', paddingLeft: 18 } },
                repo.commits.slice(0, 3).map(commit => h('li', { key: commit.short }, h('span', { className: 'sawb-mono' }, commit.short), ' ', commit.subject))))
          : null,
        h('div', { className: 'sawb-foot-line' },
          h('button', { type: 'button', className: 'sawb-btn', disabled: repo.ok === false, onClick: () => onOpen(repo) }, t('openRepo'))))
    }

    /** 代码仓库：仓库列表 → 目录树 → 文件内容。全程只读。 */
    function CodeView({ t, section, onSection }) {
      const [route, setRoute] = React.useState({ kind: 'repos', repo: undefined, path: '' })
      const [state, setState] = React.useState({ phase: 'loading', data: undefined, error: '' })

      React.useEffect(() => {
        const controller = new AbortController()
        setState({ phase: 'loading', data: undefined, error: '' })
        let params
        if (route.kind === 'repos') params = { view: 'repos' }
        else if (route.kind === 'tree') params = { view: 'tree', repo: route.repo.id, path: route.path }
        else params = { view: 'blob', repo: route.repo.id, path: route.path }
        loadApi(params, controller.signal)
          .then(data => setState({ phase: 'ready', data, error: '' }))
          .catch(error => {
            if (error && error.name === 'AbortError') return
            setState({ phase: 'error', data: undefined, error: errorText(error) })
          })
        return () => controller.abort()
      }, [route])

      const openRepo = repo => setRoute({ kind: 'tree', repo, path: '' })
      const openTree = (repo, path) => setRoute({ kind: 'tree', repo, path })
      const openBlob = (repo, path) => setRoute({ kind: 'blob', repo, path })

      let content = null
      if (state.phase === 'error') {
        content = h(Notice, { tone: 'error' }, t('readFailed', { message: state.error }))
      } else if (state.phase === 'loading' && !state.data) {
        content = h('div', { className: 'sawb-empty' }, t('loadingData'))
      } else if (route.kind === 'repos') {
        const repos = state.data.repos || []
        content = repos.length === 0
          ? h('div', { className: 'sawb-empty' }, t('noRepos'))
          : h('div', { className: 'sawb-repo-grid' }, repos.map(repo => h(RepoCard, { key: repo.id, repo, t, onOpen: openRepo })))
      } else if (route.kind === 'tree') {
        const data = state.data
        const entries = data.entries || []
        const dirs = entries.filter(item => item.type === 'dir').length
        content = h(React.Fragment, null,
          h('div', { className: 'sawb-file-head' },
            h('button', { type: 'button', className: 'sawb-btn', onClick: () => setRoute({ kind: 'repos' }) }, `← ${t('backToRepos')}`),
            h('button', { type: 'button', className: 'sawb-btn', onClick: () => openTree(route.repo, '') }, t('repoPath')),
            h('span', { className: 'sawb-meta' }, t('dirCount', { n: dirs }) + ' · ' + t('fileCount', { n: entries.length - dirs }))),
          h(Breadcrumbs, { repo: route.repo, path: data.path || '', t, onRoot: () => openTree(route.repo, ''), onPath: path => openTree(route.repo, path) }),
          entries.length === 0
            ? h('div', { className: 'sawb-empty' }, t('emptyTree'))
            : h('div', { className: 'sawb-tree' }, entries.map(entry => h('button', {
                key: entry.path, type: 'button', className: 'sawb-tree-row',
                onClick: () => entry.type === 'dir' ? openTree(route.repo, entry.path) : openBlob(route.repo, entry.path),
              },
                h('span', { className: 'sawb-tree-icon', 'aria-hidden': true }, entry.type === 'dir' ? '▸' : '·'),
                h('span', { className: 'sawb-tree-name' }, entry.name + (entry.type === 'dir' ? '/' : '')),
                h('span', { className: 'sawb-meta' }, entry.type === 'dir' ? '' : (entry.lang || ''))))))
      } else {
        const data = state.data
        const parent = route.path.includes('/') ? route.path.slice(0, route.path.lastIndexOf('/')) : ''
        content = h(React.Fragment, null,
          h('div', { className: 'sawb-file-head' },
            h('button', { type: 'button', className: 'sawb-btn', onClick: () => openTree(route.repo, parent) }, `← ${t('backToTree')}`),
            h('h2', { className: 'sawb-detail-title' }, route.path.split('/').pop()),
            badge(data.isDoc ? t('docFile') : (data.lang || t('codeFile')), 'muted'),
            h('span', { className: 'sawb-meta' }, `${data.size >= 0 ? Math.ceil(data.size / 1024) + ' KB' : ''}`)),
          h(Breadcrumbs, { repo: route.repo, path: route.path, t, onRoot: () => openTree(route.repo, ''), onPath: path => openTree(route.repo, path) }),
          data.tooLarge
            ? h(Notice, null, t('fileTooLarge'))
            : data.binary
              ? h(Notice, null, t('binaryFile'))
              : data.isDoc
                ? h('div', { className: 'sawb-panel' }, h(Markdown, { blocks: data.blocks }))
                : h('div', { className: 'sawb-code-wrap' }, h(CodeBlock, { text: data.text })))
      }

      return h(React.Fragment, null,
        h('div', { className: 'sawb-head' },
          h('h2', { className: 'sawb-title' }, t('codeTitle')),
          h('span', { className: 'sawb-meta' }, t('codeHint')),
          h('span', { className: 'sawb-spacer' }),
          h(Tabs, { section, t, onSection })),
        h('div', { className: 'sawb-body' }, content))
    }

    /** 列表：静默定时刷新；详情：打开时读一次快照，避免长报告反复传输。 */
    function Workbench({ t }) {
      const [section, setSection] = React.useState('tickets')
      const [list, setList] = React.useState({ phase: 'loading', data: undefined, error: '' })
      const [detail, setDetail] = React.useState({ id: '', ticket: undefined, phase: 'idle', error: '' })
      const [nonce, setNonce] = React.useState(0)

      React.useEffect(() => {
        let alive = true
        const controller = new AbortController()
        const read = quiet => loadSnapshot('', controller.signal)
          .then(data => { if (alive) setList({ phase: 'ready', data, error: '' }) })
          .catch(error => {
            if (!alive || (error && error.name === 'AbortError')) return
            setList(previous => ({ phase: 'error', data: previous.data, error: String(error && error.message ? error.message : error) }))
          })
        void read(false)
        const timer = setInterval(() => { void loadSnapshot('', controller.signal).then(data => { if (alive) setList({ phase: 'ready', data, error: '' }) }).catch(() => {}) }, REFRESH_MS)
        return () => { alive = false; controller.abort(); clearInterval(timer) }
      }, [nonce])

      const open = React.useCallback(id => {
        setDetail({ id, ticket: undefined, phase: 'loading', error: '' })
        const controller = new AbortController()
        loadSnapshot(id, controller.signal)
          .then(data => setDetail({ id, ticket: data.ticket, phase: 'ready', error: '' }))
          .catch(error => setDetail({ id, ticket: undefined, phase: 'error', error: String(error && error.message ? error.message : error) }))
      }, [])
      const back = React.useCallback(() => setDetail({ id: '', ticket: undefined, phase: 'idle', error: '' }), [])

      if (section === 'docs') return h(Root, null, h(DocsView, { t, section, onSection: setSection }))
      if (section === 'code') return h(Root, null, h(CodeView, { t, section, onSection: setSection }))

      if (detail.id) {
        if (detail.ticket) return h(Root, null, h(DetailView, { ticket: detail.ticket, t, onBack: back }))
        return h(Root, null,
          h('div', { className: 'sawb-body' },
            detail.phase === 'error'
              ? h(Notice, { tone: 'error' }, t('loadFailed', { message: detail.error }))
              : h('div', { className: 'sawb-empty' }, t('loading'))),
          h('div', { className: 'sawb-foot' }, h('button', { type: 'button', className: 'sawb-btn', onClick: back }, `← ${t('back')}`)))
      }

      return h(Root, null,
        list.data ? h(ListView, { data: list.data, t, onOpen: open, section, onSection: setSection }) : null,
        list.phase === 'loading' && !list.data ? h('div', { className: 'sawb-empty' }, t('loading')) : null,
        list.phase === 'error'
          ? h('div', { className: 'sawb-body' },
              h(Notice, { tone: 'error' }, t('loadFailed', { message: list.error }), ' ',
                h('button', { type: 'button', className: 'sawb-btn', onClick: () => setNonce(value => value + 1) }, t('retry'))))
          : null,
        list.data && list.data.generatedAt
          ? h('div', { className: 'sawb-meta sawb-foot' }, t('refreshedAt', { time: when(list.data.generatedAt) }))
          : null)
    }

    // ---------------- 注册 ----------------

    const Icon = ({ size }) =>
      h('svg', { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true },
        h('rect', { x: 3, y: 4.5, width: 18, height: 15, rx: 2 }),
        h('path', { d: 'M7 9h6M7 12.5h10M7 16h7' }),
        h('circle', { cx: 17, cy: 8, r: 1.6, fill: 'currentColor', stroke: 'none' }))

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        // DSH 内置语言 id 是 zh / en；再保留 zh-CN 以兼容浏览器区域标签。
        ctx.effect(() => ctx.locale.register(NS, { zh, 'zh-CN': zh, en }), 'superagent-workbench: dictionaries')
        const t = ctx.locale.bind(NS)
        ctx.slots.inject('main', () => ctx.slots.register(
          { name: 'main', key: PANEL_ID, locale: NS },
          (props) => h(Workbench, { t: props.t || t }),
        ))
        ctx.slots.inject('sidebar.panellist', () => ctx.slots.register(
          { name: 'sidebar.panellist', id: PANEL_ID, order: 20, label: () => t('panel'), locale: NS },
          Icon,
        ))
      },
    }
  },
})

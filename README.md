# 交付台（DSH 插件）

把 superagent 的**工单、执行报告、交付分支改动、工单记录、文档中心、代码仓库浏览**直接放进 DSH 侧栏，
不用再切到 8448 端口的 `superagent-console` 网页单独看，也不再包含 cloudctl 的本机服务状态。

> 一句话：把 `superagent-console` 里属于 super-agent 的内容搬进 DSH 做成插件，
> 任何人装上、配上自己的工单库与仓库，就能把它当作自己的 superagent 交付台；它是对官方 dsh-superagent 面板的补充。

## 与官方面板、superagent-console 的分工

| 入口 | 管什么 | 说明 |
|---|---|---|
| 官方 dsh-superagent 面板（侧栏「超级代理」） | Source / Trigger / Eval / 执行 / 配置 | 运行与配置，管「接没接到、做没做」 |
| **本插件（侧栏「交付台」）** | 工单列表、每轮执行报告、分支 diff、工单记录、Markdown 文档中心、代码仓库浏览 | 交付物，管「做出了什么、改了什么、代码在哪」 |
| `task/superagent-console`（8099 / tailnet 8448） | 上面两者 + 本机服务状态、全局搜索 | 完整版；本插件已覆盖工单、文档和代码浏览 |

插件不重复实现官方面板的配置与运行控制，只读、只展示，避免出现两套互相矛盾的事实。

## 功能

- **工单列表**：默认先看进行中；没有进行中时直接给全部。每行显示 ID、标题、状态徽标、创建时间、分支、PR 号、是否有工单记录。
- **工单详情**：Issue / PR 链接、分支、执行目录（还在/已清理）、结束结果；最新报告直接展开，历史报告收在「执行报告（N 轮）」里；分支改动按文件折叠并红绿着色；工单记录文档整篇渲染。
- **Markdown 表格**：文档、工单记录与报告中的标准 Markdown 表格渲染为带边框的表格，宽表格可横向滚动。
- **文档中心**：按仓库分组列出所有 Markdown 文档，点开即读，不需要跳到 console。
- **代码仓库**：仓库列表 → 目录树 → 文件内容；支持 `git` 对象与 `worktree` 两种模式，源码带行号，Markdown 自动渲染，并显示分支、HEAD、最近提交和未提交改动数量。
- **自动刷新**：列表每 20 秒静默刷新；详情打开时读一次快照，避免长报告反复传输。
- **只读**：工单库以只读连接打开；仓库只读 git 对象（`git show origin/main:<path>`），唯一写操作是后台 `git fetch`（只改引用，不动工作区、不切分支）。
- **跟随主题与语言**：只用 `--dsw-alias-*` 主题令牌，明暗自动适配；文案走 DSH 语言服务，中/英自动切换。
- **PC 宽屏排版**：文档列表限宽居中，仓库卡片使用更大的间距与内边距，目录树/代码区/详情面板统一版心，窄屏自动回退单列。

## 页面结构

侧栏图标（id `superagent-workbench`，排在「定时任务」之后）→ 主面板 `main` 槽位：

```text
[工单] [文档] [代码]
─────────────────────────────────────────────────────────────────────────
工单                     [共 7 条 · 1 条进行中]        [仓库已同步 …]  [看全部]
6f73dd8f  维护 PROJECT_INDEX.md…    PR #14   执行中 · 等待中
```

点工单进入详情（同一面板内切换，带「← 返回列表」）；「文档」按仓库分组；
「代码」从仓库列表进入目录树与文件内容。

## 数据来源

| 数据 | 来源 | 刷新 |
|---|---|---|
| 工单、各轮报告 | `~/.dsh/state/superagent/orchestrator.sqlite`，表 `ticket`，只读 | 请求时读，进程内缓存 10 秒 |
| 工单记录文档 | 仓库 `origin/main` 的 `docs/work/<工单ID 前 8 位>-*.md` | 同上 |
| 分支改动 | `git diff <baseRef>...agent/<执行名>`（本地或 `origin/` 分支） | 同上 |
| 远端引用 | 后台 `git fetch --prune origin` | 每 10 分钟 |
| 文档 / 代码 | `reposFile` 纳管的仓库；`git` 模式读 ref 对象，`worktree` 模式读磁盘 | 请求时读，进程内缓存 30–60 秒 |

工单 JSON 里 `assignments[-1].report.summary` 是最近一轮报告，`assignments[].report` 是逐轮报告，
`execution.name` 推出交付分支 `agent/<name>`，`ended.outcome` 是结束结果（merged / closed / dropped / completed / stopped）。

## 配置（全部有默认值）

在 DSH 设置 → 插件 → 交付台 里改，或直接改 profile 的 `cordis.patch.yml`：

```yaml
- id: dsh-superagent-workbench
  name: dsh-superagent-workbench
  config:
    dshHome: /home/zh/.dsh          # 工单库默认在其下 state/superagent/
    stateDir: /home/zh/.dsh/state/superagent
    repoDir: /home/zh/src/dshSuperagentRepo   # 交付仓库本地克隆
    baseRef: origin/main            # 对比交付分支的基线
    cacheSeconds: 10
    fetchMinutes: 10                # 0 = 不自动 fetch
    reposFile: /home/zh/www/personalCloud/task/superagent-console/repos.json
                                    # 可选；同 superagent-console 的仓库清单格式
```

别人要用时，至少改 `stateDir` 与 `repoDir`；需要浏览多仓库文档/代码时再配 `reposFile`。
未配置 `reposFile` 时，插件只纳管 `repoDir` 一个仓库；本工作区若存在同级
`task/superagent-console/repos.json`，会自动复用。

## 安装与更新

```bash
# 插件目录
cd /home/zh/www/personalCloud/task/superagent-workbench

# 安装（幂等）：在 DSH 里通过插件管理器安装，或让 AI 执行 plugin_manager install_bundle
#   目标：/home/zh/www/personalCloud/task/superagent-workbench
```

- 已以「本地链接」方式装进 `web` profile（`dsh-superagent-workbench` → 本目录）。
- 改 Host 代码（`index.js`、`lib/`）：HMR 一般会重启插件行；若没生效，**必须重启 `dsh-web.service`**。只刷新浏览器不够：旧 Host 会忽略 `?view=docs|repos`，仍返回工单快照，页面就会表现为文档/代码为空。
- 改 Client 代码（`client.js`、`locale/`）：已安装包的浏览器模块按文件修订号缓存，**刷新页面**即可；刚安装或改过 Host 行后建议直接刷新一次。
- 卸载：插件管理器移除 `dsh-superagent-workbench` 即可（不删本目录）。
- 发布到 DSH 插件市场：见 [`PUBLISHING.md`](PUBLISHING.md)。
- 公开仓库：<https://github.com/person-clouds/superagent-workbench>。
- GitHub Release 安装包：<https://github.com/person-clouds/superagent-workbench/releases/latest/download/dsh-superagent-workbench.tgz>。
- npm 包：`dsh-superagent-workbench`。

## 安全边界

- 只注册一个 `GET /superagent-workbench/api` 路由，挂在 DSH 自己的 Web 服务上；
- 与 DSH 原 `/api` 一致，先做 Host / Origin 校验与浏览器 cookie 鉴权（未登录返回 401）；
- 不读凭据、不读 `.env`、不写任何文件；唯一写操作是 `git fetch`；
- 代码浏览沿用 console 的敏感路径规则：不展示 `.env*`、凭据目录、`.git`、`*.pem/*.key/*.sqlite/*.db` 等；
- 返回值只有工单、报告、diff、文档与代码文本，全部由 React 元素渲染，不用 `innerHTML`。

## 目录结构

```text
task/superagent-workbench/
├── package.json          # bundle 清单：dsh.bundle.patch + dsh.client（web，immediately）
├── cordis.patch.yml      # 插入行 dsh-superagent-workbench
├── index.js              # Host：读取快照 + 注册 GET 路由 + 后台 fetch
├── lib/tickets.js        # 读 orchestrator.sqlite（node:sqlite，只读）
├── lib/gitdata.js        # 读仓库：git show / ls-tree / diff / fetch
├── lib/markdown.js       # Markdown 子集 → block + 行内片段；diff 按文件切块
├── lib/repos.js          # 只读仓库：文档索引 / 目录树 / 文件内容 / 最近提交
├── client.js             # 浏览器端：侧栏图标 + main 面板（工单 / 文档 / 代码）
├── locale/zh.json        # 中文文案（meta.title / meta.description 供插件管理页显示）
├── locale/en.json
└── icon.svg              # 插件图标
```

## 已知限制

- 分支改动只在**分支已推送到远端或本地仍有该分支**时可读；工单执行目录已清理且分支也删了，就只剩报告与文档。
- 单次 diff 截断在上限 400KB，超出时页面提示。
- 单文件超过 2MB 或为二进制时不内联渲染；文档/代码浏览不做全局内容搜索。
- 不做鉴权之外的权限区分：能看到工作台的人等于能看到工单、文档与代码（与 DSH 自身登录态一致）。

# STATUS — 交付台 DSH 插件

- 更新时间：2026-11-14 13:20
- 一句话：把 superagent-console 里属于 super-agent 的内容（工单 / 报告 / 分支改动 / 工单记录 / 文档 / 代码仓库）做成 DSH 插件，侧栏独立面板，只读，不含本机服务状态。
- 位置：`task/superagent-workbench/`；已装进 `web` profile（本地链接）。

## 目标

1. 在 DSH 里直接看 super-agent 的工作进展与产出，不再切 8099/8448；
2. 通用：任何人安装后改 `stateDir` / `repoDir` 即可当自己的 superagent 交付台；
3. 作为官方 dsh-superagent 面板的补充，不改、不替代官方面板；
4. 补齐 console 的文档中心和代码仓库浏览，代码产出是本工作台的主视图；
5. 只读，不引入云服务与本机服务监控。

## 已完成

- [x] Host：只读工单库（`node:sqlite`，WAL 可读）、按 `docs/work/<id8>-*.md` 取工单记录、按 `agent/<执行名>` 取 `baseRef...分支` 的 diff 与 diffstat；
- [x] Host：`GET /superagent-workbench/api[?ticket=]`，先过 `ctx.connection.requestRejection`（Host/Origin + cookie 鉴权），带 10 秒快照缓存，后台 `git fetch` 只改引用；
- [x] Client：`main` 槽位面板 + `sidebar.panellist` 图标（id `superagent-workbench`，order 20），列表默认进行中、可切全部；详情含事实表、最新报告 + 历史报告折叠、diff 按文件红绿、工单记录 Markdown；
- [x] Client：新增「文档」「代码」两个 tab；文档按仓库分组打开 Markdown，代码从仓库列表进入目录树/文件（源码带行号，Markdown 渲染）；
- [x] Host：新增 `view=docs|repos|tree|blob` 只读 API；`lib/repos.js` 支持 `git` 对象与 `worktree`、敏感路径屏蔽、单文件 2MB 上限；
- [x] 样式/滚动修复：所有视图统一包在 `sawb-root` 中，`<style>` 不再只在列表页存在；内容区固定为 `flex:1; min-height:0; overflow-y:auto`，详情与代码页可正常向下滚动；
- [x] PC 宽屏优化：文档限宽居中、仓库卡片间距/内边距加大、目录树与代码区统一版心、窄屏单列回退；
- [x] Markdown 表格：识别表头/分隔行/数据行，Host 输出结构化 table 块，Client 渲染为可横向滚动的表格；
- [x] 市场发布准备：新增 `PUBLISHING.md` 与插件目录 `.gitignore`，移除 `private`，`npm pack` 可通过；GitHub Release `v0.1.1` 已创建；npm `dsh-superagent-workbench@0.1.1` 已发布；市场 PR 待仓库满 1 天；
- [x] 主题：只用 `--dsw-alias-*` 令牌，无字面色值，类名统一 `sawb-` 前缀；文案走 `ctx.locale`（zh / en，另兼容 zh-CN），插件元信息 `meta.title/description` 与原创 `icon.svg` 齐备；
- [x] 安装：`plugin_manager install_bundle` → `application: applied`，`warnings: []`；
- [x] Host 快照与 React 组件在真实数据上做过冒烟（见下）。
- [x] **依赖修复（2026-11-14）**：本包以 `link:` 装入 profile，Node 按**真实路径**解析依赖，
  会从 `task/superagent-workbench/` 往上找 `node_modules`；该目录原本没有 `@deepseek-ai/schemastery`，
  `index.js` 的静态 import 在导入阶段就失败，报
  `dsh-superagent-workbench: import failed`、`web boot: 1 entry did not activate`。
  修复：在插件目录本地安装 `@deepseek-ai/schemastery@3.19.0`（与 DSH 自带版本一致）。
  该目录已被根 `.gitignore` 的 `node_modules/` 忽略，重新部署需再装一次：
  `cd task/superagent-workbench && pnpm add --save-exact @deepseek-ai/schemastery@3.19.0`。
  注意：`@deepseek-ai/schemastery` **不是** cordis 服务，不要试图靠 `inject` 取得。

## 安装前提（重装时必读）

1. `~/.dsh/profiles/web` 里用 `dsh plugin --profile web add link:/home/zh/www/personalCloud/task/superagent-workbench`
   或插件管理器 install；
2. **插件目录本地必须存在 `node_modules/@deepseek-ai/schemastery`**，否则 Host 端导入失败、整条 entry 不激活；
3. 装完重启 `dsh-web.service`（导入期失败无法靠 HMR 恢复）。

## Client 端硬性约束（2026-11-14 踩坑，务必遵守）

`client.js` 由 `dsh-client-modules` 以**普通脚本**原样拼接进页面执行（`prepareSource` 只去
source-map 尾注，不做任何打包/转换）。脚本的唯一职责是注册工厂：

```js
window.__ModuleLoader__.load({ id: 'dsh-superagent-workbench', factory(require) { ... } })
```

因此 **`client.js` 里绝对不能出现顶层 `import` / `export`**，也**不能 require 相对 JSON**
（加载器的 `require` 只认已注册工厂与 shell 模块，不解析文件路径）。

- 症状：刷新页面即报 `Failed to load plugins` / `web boot: 1 entry did not activate` /
  `<id> import failed (see console)`。该文案来自浏览器侧 `dsh-client-modules/lib/client.js`，
  **不是 Host 端**——Host 端报错不会出现 "web boot" 字样。
- 本插件的 `zh` / `en` 字典已**内联**在该文件中；改文案要同时改 `locale/zh.json`、`locale/en.json`
  与 `client.js` 内联处。
- 自检（提交前必跑，模拟浏览器解析）：
  ```bash
  node -e "new (require('vm').Script)(require('fs').readFileSync('client.js','utf8')); console.log('OK')"
  ```

## 验证记录

| 时间 | 项 | 结果 |
|---|---|---|
| 2026-11-14 11:15 | Host 快照（真实工单库） | 7 条工单 / 1 条进行中；schema 11；doc 命中 5/7 |
| 2026-11-14 11:16 | jsdom 挂载（模拟 Host fetch） | 列表 1 行（进行中）→ 切全部 7 行 → 详情标题匹配 → 返回 → HTTP 500 显示「读取失败：HTTP 500」+ 重试恢复；无 React 警告 |
| 2026-11-14 11:16 | 安全渲染 | 报告内 10 个链接、原始 HTML 不执行（`<b>` 未注入） |
| 2026-11-14 11:18 | `install_bundle` | `applied`；`Config.listConfigs` 可见 6 项配置 schema |
| 2026-11-14 11:18 | `cordis_inspect_query client Slots` | `sidebar.panellist` 尚未出现该插件占用（页面未重新加载，Client HMR 未接上线） |
| 2026-11-14 11:20 | `curl /superagent-workbench/api`（无 cookie） | 401 `unauthorized`（鉴权生效） |
| 2026-11-14 12:05 | 依赖修复后真实启动（临时 DSH_HOME + `dsh --profile web`） | 无 `did not activate` 告警；插件 `index.js` 直接 import 成功（exports: Config/apply/inject/name） |
| 2026-11-14 12:12 | 重装后运行态核对 | `plugin_manager install_bundle` → `applied`、`warnings: []`；`Config.listConfigs` 该条目 `status: schema`（模块已导入）；`GET /superagent-workbench/api` 无 cookie 返回 401（路由已注册 + 鉴权生效） |
| 2026-11-14 12:12 | 真实数据读取 | 7 条工单 / 1 进行中 / 5 已合并；`repoDir` 可用（`main` @ f68fee1） |
| 2026-11-14 13:15 | `lib/repos.js` 真实仓库只读冒烟 | 单仓库：44 篇文档、目录树正常、README Markdown 55 块；`reposFile` 多仓库：5 个仓库全部可读 |
| 2026-11-14 13:18 | 语法自检 | `node --check index.js`、`lib/repos.js` 通过；`client.js` 通过 `vm.Script` 解析 |
| 2026-11-14 12:33 | 重启 dsh-web 后真实 API 核对 | `view=docs` 返回 5 个仓库文档索引（48KB）；`view=repos` 返回 5 个仓库；`tree/blob` 正常；确认旧 Host 忽略 `view` 是文档/代码为空的根因 |

## 未能确认

- **浏览器实际渲染**：本会话没有浏览器控制，页面处于未刷新状态；需用户刷新 `https://zh-gem-r7.tailb6e152.ts.net:8443/` 后确认侧栏出现「交付台」图标，并检查页面控制台无 `slot entry crashed`。
- **浏览器 bundle 是否已发布**：客户端模块由 Host 扫描 `dsh.client` 生成，安装后需刷新页面（或重启 `dsh-web.service`）重取 boot graph；未登录时 `/plugins/<包>/client.js` 直接 404/401，无法用 curl 证明。

## 待办 / 后续

| # | 事项 | 说明 |
|---|---|---|
| 1 | 用户刷新确认视觉 | 重点看详情长文档、代码文件是否能正常滚动 |
| 2 | 可选：工单内「打开对应 Session」 | 执行器 Session id 规则需在 superagent 源码确认，本版未做 |
| 3 | 可选：文档/代码全局搜索 | console 有，本版先补齐浏览主链路 |
| 4 | superagent-console 去留 | 本插件已覆盖工单、文档、代码；console 的「服务状态 / 全局搜索」仍只有它提供 |

## 关键决策

1. **只读 + 只一个 GET 路由**：复用 DSH 的鉴权和 Web 服务，不新开端口、不新做登录。
2. **读 git 对象而不是工作区文件**：本机仓库落后几十个提交且不 checkout 交付分支，`origin/main` 才是真实交付物；`fetch` 只更新引用。
3. **不用官方 Remote/typert 通道**：纯 JS 插件没有生成步骤，改用带鉴权的 Web 路由 + fetch，避免手写 Remote 描述符。
4. **卡片整体一个 button**：行内不放 `<a>`，避免嵌套交互元素。
5. **Client 与 Host 一致性留给用户刷新**：HMR 只重启 Host 行，浏览器 bundle 以文件修订号缓存，刷新页面即可取新版本。

## 涉及文件

- 新增/修改：`task/superagent-workbench/`（新增 `lib/repos.js`；Host `index.js` 增加 docs/repos/tree/blob 视图；`client.js` 修复样式与滚动并新增文档/代码 tab；README/STATUS/locale/package 同步更新）
- 修改：`PROJECT_INDEX.md`（项目登记 + DSH 插件入口）
- profile：`~/.dsh/profiles/web/package.json`、`cordis.patch.yml`（由插件管理器写入）

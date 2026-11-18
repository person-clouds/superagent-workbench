---
audience: shared
status: current
---

# 发布到 DSH 插件市场

> 状态：GitHub 与 npm 均已发布；市场条目待仓库满 1 天后提交。  
> 公开仓库：<https://github.com/person-clouds/superagent-workbench>  
> GitHub Release：<https://github.com/person-clouds/superagent-workbench/releases/tag/v0.1.1>  
> 安装包：<https://github.com/person-clouds/superagent-workbench/releases/latest/download/dsh-superagent-workbench.tgz>  
> npm：<https://www.npmjs.com/package/dsh-superagent-workbench>（`0.1.1`，latest）  
> 当前仅剩：awesome-dsh-plugin 要求仓库创建满 1 天（创建于 2026-11-14 05:12 UTC，2026-11-15 05:12 UTC 后可提 PR）。

## 市场收录规则（来自 awesome-dsh-plugin/contributing.md）

1. 公开 GitHub 仓库，`package.json` 声明 `dsh.bundle`；
2. 仓库创建满 1 天；
3. 仓库添加 GitHub topic：`dsh-plugin`；
4. 在 [awesome-dsh-plugin](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin)
   提交一个 `data/plugins/<owner>__<repo>.yml` 文件；
5. 推荐同时发布 npm 包，或把预构建 `.tgz` 上传到 GitHub Release，并在条目里写 `tarball:`。

## 一、把插件抽成独立仓库

当前目录已经是可独立安装的插件根目录。创建公开 GitHub 仓库后执行：

```bash
cd /home/zh/www/personalCloud/task/superagent-workbench

# 仅首次：初始化独立仓库（不要提交 node_modules）
git init
git add .
git commit -m "feat: superagent 交付台 DSH 插件"
git branch -M main
git remote add origin git@github.com:person-clouds/superagent-workbench.git
git push -u origin main
```

然后在 GitHub 仓库设置里添加 topic：`dsh-plugin`。

## 二、构建并验证安装包

已生成：

```bash
cd /home/zh/www/personalCloud/task/superagent-workbench
npm pack --pack-destination release
# 产物：release/dsh-superagent-workbench-0.1.1.tgz
```

GitHub Release 资源名保持无版本号，便于 `latest/download` 长期有效：
`dsh-superagent-workbench.tgz`。

## 三、发布 npm

已发布：

<https://www.npmjs.com/package/dsh-superagent-workbench>

安装：

```bash
dsh plugin --profile web add dsh-superagent-workbench
```

## 四、提交市场条目

本地草稿：`market/person-clouds__superagent-workbench.yml`。

提交到 awesome-dsh-plugin 仓库时，把内容放到：

`data/plugins/person-clouds__superagent-workbench.yml`

条目内容：

```yaml
url: https://github.com/person-clouds/superagent-workbench
name: person-clouds/superagent-workbench
category: ui
description:
  en: 'Superagent delivery desk for DSH: browse tickets, execution reports, branch diffs, Markdown docs and read-only Git repositories from the sidebar.'
  zh: 'DSH 侧栏的 superagent 交付台：查看工单、执行报告、分支改动、Markdown 文档与只读代码仓库。'
# 如果发了 GitHub Release tarball，再加：
# tarball: https://github.com/person-clouds/superagent-workbench/releases/latest/download/dsh-superagent-workbench.tgz
```

提交 PR 后由市场维护者审核。合并后 dsh-market / Plugin Discover 会自动收录。

## 五、当前阻塞

- npm：需先在 <https://www.npmjs.com/signup> 注册，再执行
  `npm login --registry=https://registry.npmjs.org`；
- 市场 PR：仓库需创建满 1 天，2026-11-15 05:12 UTC 之后可提交；
- npm 发布命令：`npm publish --registry=https://registry.npmjs.org --access public`。

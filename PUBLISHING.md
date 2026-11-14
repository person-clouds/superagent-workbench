# 发布到 DSH 插件市场

> 状态：本地发布物已准备；尚未发布。  
> 目标仓库：<https://github.com/person-clouds/superagent-workbench>  
> 当前阻塞：本机 git 身份 `zhyfor` 对该仓库没有写权限（HTTP 403）；npm 未登录。

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

```bash
cd /home/zh/www/personalCloud/task/superagent-workbench
npm pack
# 产物：dsh-superagent-workbench-0.1.0.tgz

# 本地验证安装（示例，使用测试 profile）
dsh plugin --profile test add ./dsh-superagent-workbench-0.1.0.tgz
```

## 三、发布 npm（推荐，可选）

```bash
npm login
npm publish --access public
```

如果插件名已被占用，需要先改 `package.json` 的 `name`。

## 四、提交市场条目

在 awesome-dsh-plugin 仓库新建：

`data/plugins/person-clouds__superagent-workbench.yml`

内容：

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

- 需要给 `zhyfor` 授予 `person-clouds/superagent-workbench` 写权限，或改用有权限的 GitHub 账号；
- npm 需要先执行 `npm login`，或在本机配置可发布 `dsh-superagent-workbench` 的 `NPM_TOKEN`；
- 完成后即可执行：`npm publish --access public`，再把插件推送到 GitHub 并提交 awesome-dsh-plugin PR。

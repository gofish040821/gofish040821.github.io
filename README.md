# Gofish 的个人主页

暖米白、陶土橙与深灰配色。包括个人介绍、Agent RSI / Physical AI 研究兴趣、教育经历、兴趣爱好和 10 张旅行照片。支持手机布局、相册展开、图片放大、键盘左右切换、Esc 关闭和手机滑动切换。

## 先看网页

直接打开 `dist/index.html` 即可查看完整网站，无需安装任何依赖。也可以安装 Node.js 20 或更新版本，在本目录运行：

```sh
node scripts/serve.mjs
```

然后访问 http://127.0.0.1:4173 。退出预览按 Ctrl+C。

## 发布到你的 GitHub Pages

目标账号：**gofish040821**。账号主页仓库应命名为 **gofish040821.github.io**。只有发布成功后，网站才会出现在 **https://gofish040821.github.io/**。

1. 登录 GitHub，创建公开仓库 `gofish040821.github.io`。如果同名仓库已存在，先检查并备份已有内容，再合并本项目；不要直接覆盖旧主页。
2. 将**本文件所在文件夹内的内容**上传到仓库根目录，包含 `content.json`、`src/`、`scripts/`、`dist/`、`.github/` 等。不要额外嵌套一层 `gofish-homepage/`。代码推送到 `main` 分支。
3. 打开仓库 **Settings → Pages → Build and deployment → Source**，选择 **GitHub Actions**。
4. 在 **Actions → Deploy Gofish homepage → Run workflow** 中运行一次；之后每次更新 `main` 分支都会自动重新生成并发布网站。
5. 等待任务成功，在 **Settings → Pages** 查看实际发布地址。

Git 命令示例（前提：仓库已创建且本机已登录 GitHub）：

```sh
git init -b main
git add .
git commit -m "Create Gofish personal homepage"
git remote add origin https://github.com/gofish040821/gofish040821.github.io.git
git push -u origin main
```

如果本机未配置 Git 作者信息，请先填写自己的 `user.name` 和 `user.email`。不要将密码、Token 或任何私钥写入项目文件。

不使用 Git 命令时，可在 GitHub 网页上传文件。请确认 `.github/workflows/pages.yml` 没有因隐藏文件显示设置而被遗漏。也可以使用 GitHub Desktop 上传整个项目。

官方说明：[创建 GitHub Pages 站点](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site)。

## 以后如何更新

**日常内容只需修改 `content.json`。** 在 GitHub 网页中打开该文件并编辑，提交后自动发布。请保留 JSON 中的英文双引号和逗号。

| 想改什么 | 对应字段 |
| --- | --- |
| 个人简介与首页文案 | `about`、`headline`、`intro` |
| GitHub / 公开邮箱 | `github`、`email`（留空则不展示邮箱入口） |
| 研究兴趣 | `research` |
| 学历与在读状态 | `education` |
| 兴趣爱好 | `hobbies` |
| 相册顺序、标题、说明 | `gallery` |
| 首页大图 | `heroImage` |
| 年龄说明和更新时间 | `profileNote`、`updated` |

年龄标为“22 岁 · 2026 年记”，未推测生日，也不会自动增龄。硕士经历标为在读、预计 2029 年毕业。没有添加未经提供的论文、成果或项目经历。

本地修改内容或样式后，运行以下命令更新网页：

```sh
node scripts/build.mjs
```

本项目没有第三方运行依赖，不需要 `npm install`。构建只是将内容填入 HTML 模板，网站上线后完全由静态文件组成。关闭 JavaScript 仍可阅读正文、查看全部照片并打开原图。

## 照片维护

已提供的照片全部保存为 WebP 网页副本，放在 `dist/assets/photos/`，原始照片不被修改。每张照片有正常版和 `-small` 缩略版，所有照片合计约 3 MB。副本不保留原文件 EXIF 信息。

第一张所提供图片实际是一只海鸟，因此当前用作导航头像。首页人物照片使用山间生活照。更换证件照时，可用新头像替换 `avatar.webp` 和 `avatar-small.webp`；无需改变网页布局。

新增相册照片时：

1. 使用简短的英文文件名，如 `new-trip.webp`，再准备同名的缩略版 `new-trip-small.webp`，两者均放入 `dist/assets/photos/`。
2. 在 `content.json` 的 `gallery` 数组中增加一项，`image` 填写不带扩展名的 `new-trip`，并填写 `title`、`caption`、`alt`、`position`。
3. 照片建议长边 1800 像素，缩略版长边 720 像素。人物在照片中的位置可以通过 `position`（例如 `50% 60%`）调整；放大查看始终显示完整照片。
4. 重新构建或提交至 GitHub。相册数量自动更新。

## 文件结构

```text
content.json                 日常编辑的全部个人内容
src/index.html               网页结构模板
src/style.css                配色与响应式排版
src/app.js                   导航和相册交互
scripts/build.mjs            无依赖静态构建
scripts/serve.mjs            本地预览
dist/                       可直接上线的静态网站（照片也保存在这里）
.github/workflows/pages.yml  GitHub Pages 自动部署
```

`dist/` 必须一并上传，因为照片存放于该目录。不要把它加入 `.gitignore`。无需手动修改生成的 `dist/index.html`、`dist/style.css` 或 `dist/app.js`，构建时会以 `src/` 和 `content.json` 为准更新。

如使用自定义域名或项目子路径，更新 `siteUrl` 后重新构建，以更新 canonical 和 sitemap。网站资源采用相对路径，也可迁移到其他静态托管服务。

配色集中在 `src/style.css` 顶部 `:root` 中。字体采用系统字体，无需访问外部字体服务。网站没有统计追踪、外部图片请求或第三方脚本。

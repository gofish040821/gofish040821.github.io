[English](README.md) | [中文](README.zh-CN.md)

# Gofish 的个人主页

我喜欢把在意的事讲具体，也愿意给听的人留一点余地。做这个主页时，我把这种分寸叫作“有体温的克制”。一些 AI 产品用深底、霓虹渐变和玻璃光晕表现未来感，我更想让这里像一册摊开的手记。一道研究问题能写得严谨，我和父母的毕业照也有自己的位置。

访问主站可以读到研究笔记、求学经历和生活照片。想搭自己的主页，也可以直接取用中性模板。[中文主页](https://gofish040821.github.io/?lang=zh) · [English](https://gofish040821.github.io/?lang=en) · [设计说明](DESIGN.zh-CN.md)

[![Preview template](https://img.shields.io/badge/Preview-template-8a5a44?style=for-the-badge)](https://gofish040821.github.io/template-preview/)
[![Clone template](https://img.shields.io/badge/Clone-template-2ea44f?style=for-the-badge&logo=github&logoColor=white)](https://github.com/gofish040821/gofish040821.github.io/archive/refs/heads/template.zip)

**一键使用：** [在线预览模板](https://gofish040821.github.io/template-preview/)（仅示例内容，不含任何个人文字、照片或链接），或 [下载模板 ZIP](https://github.com/gofish040821/gofish040821.github.io/archive/refs/heads/template.zip)，然后运行 `npm run build && npm run preview`。

## 设计方法

**有体温的克制**，是我想在清晰与个性之间找到的分寸。页面借用纸和墨的感觉：暖色中性色、陶土色点缀、易读的文字和足够的留白。页眉与页脚叠加细颗粒、横纵纤维和大尺度纸浆斑块，形成纸面质感；明暗主题用深浅相反的纸面框住阅读区域。

研究和生活属于同一个人，也都值得在主页上有位置。问题和项目留出展开细节的空间，照片与简短图注则容纳家人、旅行和兴趣。我希望表达认真、具体，同时让阅读的人感到自在。

动效从画里的事物出发：笔尖落纸写字，汉堡夹层滑出，羽毛球回应球拍。每个动作都有起点和停顿，笔压与时间也有细小变化。阅读时页眉收拢为居中字标，回到顶部后恢复导航；开启减少动态效果时，页面也能安静地使用。

验证页的三只 Gofish 公仔在表单周围活动，各有习惯，也会回应访客的操作，让入口多一点轻松的感觉。Key 是前端访问门槛，不构成身份认证的安全边界。[设计说明](DESIGN.zh-CN.md) · [吉祥物动作](docs/mascot-actions.md)

## 构建与预览

个人主页使用原生 HTML、CSS 和 JavaScript，支持 14 种语言及明暗主题。

在仓库根目录用 Node.js 20 或以上版本构建和预览，无需安装第三方依赖。

```sh
npm run build
npm run preview
```

打开 [本地预览](http://127.0.0.1:4173)。修改源文件后重新构建，刷新浏览器即可看到变化。按 `Ctrl+C` 结束预览。

本机装有 Chrome 和 Python Playwright 时，可保持预览服务运行，再执行 `python tests/gate_browser.py --evidence ../gate-review` 验收登录流程。成功用例只在隔离浏览器收到的本地 HTML 中替换测试摘要。

执行 `python tests/mascot_dynamics.py --url http://127.0.0.1:4173 --evidence ../mascot-soak` 可进行三分钟实时时间观察。加上 `--interactions` 可检查输入优先级、闭眼、键盘操作和跳跃中断后的落地。用于观察状态的入口只存在于本地测试拦截的响应中。

## 用模板做自己的主页

模板提供中英文、示例项目、示意图和可再分发的字体。模板中不含本站任何个人文字、照片或链接，所有联系方式均为占位符。[在线预览](https://gofish040821.github.io/template-preview/) · [下载 ZIP](https://github.com/gofish040821/gofish040821.github.io/archive/refs/heads/template.zip)。

**从已有主仓库导出。** 在 `main` 的根目录执行以下命令，目标是一个新目录。

```sh
node scripts/create-template.mjs ../my-homepage
cd ../my-homepage
npm run build
npm run preview
```

**单独下载模板。** 直接克隆 `template` 分支即可。

```sh
git clone --branch template --single-branch https://github.com/gofish040821/gofish040821.github.io.git my-homepage
cd my-homepage
npm run build
npm run preview
```

两条路径得到的都是可独立构建的站点。主仓库内的 `template/` 目录只放导出时覆盖原内容的配置和素材。模板的维护规则见导出项目根目录的 `AGENTS.md`。

## 修改内容

| 要改什么 | 从哪里改 |
| --- | --- |
| 姓名、简介、联系方式、站点地址和更新标记 | `content.json` |
| 研究或项目、学习经历、技能、兴趣与相册顺序 | `content.json` 中对应的数组 |
| 界面用语与各语言译文 | `src/i18n.json` |
| 页面结构、配色、控件和排版 | `src/index.html`、`src/style.css`、`src/controls.css`、`src/editorial.css` |
| 场景插画与动作 | `scripts/illustrations.mjs`、`scripts/hobby-scenes.mjs`、`scripts/sketch-pencil.mjs`、`src/style.css` 和 `src/app.js` |

主站以 `content.json` 生成首屏和默认英文正文，切换语言时读取 `src/i18n.json`。改动可翻译的内容时，同步各语言的对应字段，包括主站英文词典。项目的 `className` 与兴趣项的 `symbol` 对应插画，翻译时保留它们。

相册照片放在 `dist/assets/photos/`。每张准备 `名称.webp` 和 `名称-small.webp` 两个版本，再将不带扩展名的名称填入 `gallery[].image`，补上标题、图注、替代文本和构图位置。译文通过 `image` 关联同一张图。个人主页的页眉头像由 `src/index.html` 直接引用 `dist/assets/photos/header-mascot.webp`；独立模板使用自己的头像素材。更新照片建议先移除不希望公开的 EXIF 信息。

`dist/` 同时包含发布结果和构建输入。`dist/assets/` 中的照片、字体和徽章会在构建时读取或校验，请保留这些资源。页面与脚本从源文件生成。

## 发布

主站在 `main` 收到相关页面、脚本或资源变更后，由 GitHub Actions 构建并发布 `dist/`。[主站工作流](.github/workflows/pages.yml)

模板默认只做本地预览。要发布到自己的仓库，请依次完成以下设置。

1. 把 `content.json` 的 `siteUrl` 改成自己的完整线上地址。使用项目站点时，地址要带仓库子路径。替换示例联系方式与图片，再把项目推送到自己的仓库。
2. 在自己的仓库里，将模板附带的 `deploy/pages.yml.example` 复制为 `.github/workflows/pages.yml`，提交到默认分支。在 **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**。[GitHub Pages 发布设置](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
3. 打开 **Actions**，选择 Pages 工作流，点击 **Run workflow** 并选定要发布的分支。这个示例工作流仅在手动运行时构建并发布 `dist/`。

## 使用许可

本站原创代码与原创插画按 MIT 许可提供。作者的个人照片、头像和个人文字不在模板复用许可内。主站的 Anthropic 字体有单独的网页使用授权，模板使用另有开放许可的字体。第三方素材的归属与许可分别列在素材说明中。[代码许可](LICENSE) · [素材说明](ASSET-LICENSES.md)

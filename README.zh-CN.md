[English](README.md) | [中文](README.zh-CN.md)

# Gofish 的个人主页

我喜欢把在意的事讲具体，也愿意给听的人留一点余地。做这个主页时，我把这种分寸叫作“有体温的克制”。一些 AI 产品用深底、霓虹渐变和玻璃光晕表现未来感，我更想让这里像一册摊开的手记。一道研究问题能写得严谨，我和父母的毕业照也有自己的位置。

访问主站可以读到研究笔记、求学经历和生活照片。想搭自己的主页，也可以直接取用中性模板。[中文主页](https://gofish040821.github.io/?lang=zh) · [English](https://gofish040821.github.io/?lang=en) · [设计说明](DESIGN.zh-CN.md)

## 预览作者主页

更新于 2026-11-02。主页入口加了一个轻量 key 门：访客答对“只因名？”后才进入主页。它只是前端拦截，挡随手点开的陌生访客，不构成安全边界。结构、样式和校验脚本都内联在 `src/index.html`，方便之后重新设计。

更新于 2026-11-02。中文标题改用自托管的思源宋体（Noto Serif SC）子集，不再落到系统宋体。浅色陶土色对比度已修正，首屏图注用到的斜体 Serif 也加入了预加载。

更新于 2026-11-02。兴趣标题“羽毛球”改为“运动”，保留原有羽毛球插画。页眉和页尾采用更清晰的四层纸纤维与暗角：浅色主题配深纸，深色主题配浅纸。纸面随可用宽高自适应，文字、控件和边线也随局部纸色调整。

阅读时，纸质页眉会保持吸顶。离开页顶区域后，控件淡出，完整的 `Gofish.` 字标平滑移到视口中央；回到顶部后恢复完整导航。过渡适配系统的减少动态效果，隐藏控件也会退出键盘焦点顺序。

更新于 2026-11-01。技能与工具新增 Figma、Zotero、Manim、DaVinci Resolve 和 REAPER，与开发和研究工具放在同一列表中，沿用单色铅笔图标与标签样式。展开后可查看全部 30 项工具。

`main` 是线上主站的源码。页面支持 14 种语言、浅色与深色主题。第三版保留了 11 幅原有铅笔插画，为每幅画单独安排动作。例如，笔尖会分两次落在纸上，汉堡抽出中层后会斜着停一会儿。

在仓库根目录用 Node.js 20 或以上版本构建和预览，无需安装第三方依赖。

```sh
npm run build
npm run preview
```

打开 [本地预览](http://127.0.0.1:4173)。修改源文件后重新构建，刷新浏览器即可看到变化。按 `Ctrl+C` 结束预览。

## 用模板做自己的主页

模板提供中英文、示例项目、示意图和可再分发的字体。新站主可以替换个人资料、头像和联系方式。

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

相册照片放在 `dist/assets/photos/`。每张准备 `名称.webp` 和 `名称-small.webp` 两个版本，再将不带扩展名的名称填入 `gallery[].image`，补上标题、图注、替代文本和构图位置。译文通过 `image` 关联同一张图。导航头像同样使用 `avatar.webp` 和 `avatar-small.webp`。更新照片建议先移除不希望公开的 EXIF 信息。

`dist/` 同时包含发布结果和构建输入。`dist/assets/` 中的照片、字体和徽章会在构建时读取或校验，请保留这些资源。页面与脚本从源文件生成。

## 发布

主站在 `main` 收到相关页面、脚本或资源变更后，由 GitHub Actions 构建并发布 `dist/`。[主站工作流](.github/workflows/pages.yml)

模板默认只做本地预览。要发布到自己的仓库，请依次完成以下设置。

1. 把 `content.json` 的 `siteUrl` 改成自己的完整线上地址。使用项目站点时，地址要带仓库子路径。替换示例联系方式与图片，再把项目推送到自己的仓库。
2. 在自己的仓库里，将模板附带的 `deploy/pages.yml.example` 复制为 `.github/workflows/pages.yml`，提交到默认分支。在 **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**。[GitHub Pages 发布设置](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
3. 打开 **Actions**，选择 Pages 工作流，点击 **Run workflow** 并选定要发布的分支。这个示例工作流仅在手动运行时构建并发布 `dist/`。

## 使用许可

本站原创代码与原创插画按 MIT 许可提供。作者的个人照片、头像和个人文字不在模板复用许可内。主站的 Anthropic 字体有单独的网页使用授权，模板使用另有开放许可的字体。第三方素材的归属与许可分别列在素材说明中。[代码许可](LICENSE) · [素材说明](ASSET-LICENSES.md)

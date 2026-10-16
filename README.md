# Gofish 的个人主页

已上线：[中文主页](https://gofish040821.github.io/?lang=zh) · [English](https://gofish040821.github.io/?lang=en)

个人介绍、研究兴趣、教育经历、兴趣爱好与生活照片。页面采用暖米白、陶土橙和深灰配色，搭配衬线标题、手绘插画与轻量动效，支持手机布局和深浅主题。英文个人介绍模块标题为 **About me**，导航保留 **About**。

## 页面功能

- 支持 14 种语言：中文、英语、意大利语、法语、德语、西班牙语、葡萄牙语、阿拉伯语、印地语、乌尔都语、孟加拉语、日语、韩语和俄语；阿拉伯语、乌尔都语适配从右到左阅读。
- 两项研究兴趣分别围绕肯德基吮指原味鸡的序贯决策与强化学习、麦当劳巨无霸中层面包的结构化消融展开，展示待探索的问题与方法，不代表已完成实验或发表成果。
- 研究详情在各自按钮下方向下展开；桌面双栏中，操作一侧不会移动另一侧卡片或按钮。
- 11 幅原创分层插画使用松散墨线、暖纸色与陶土橙。写字、抽出汉堡中层、搅拌和蒸汽等动作分别编排，首次进入视口播放一次，悬停或触摸可重播；播放期间不会叠加，并尊重减少动态效果设置。
- 技术栈默认展示 6 项，其余项目可展开。相册包含 14 张照片，支持展开、放大、键盘左右切换、Esc 关闭和手机滑动切换。
- 点击照片立即复用已加载缩略图，从原位置放大，再淡入解码完成的高清图；关闭时回落，切图时保留可见照片。意图预取和相邻预取减少等待，缓存最多保留 6 份已解码照片，省流量或 2G 网络关闭猜测预取；原照片质量与完整构图保留。

品牌名称直接写在文中：中文使用“肯德基”“麦当劳”，英文及其他语言使用“Kentucky Fried Chicken”“McDonald's”。

## 字体

标题使用 **Anthropic Serif**，正文与界面使用 **Anthropic Sans**，章节标注、日期和照片序号使用 **Anthropic Mono**。五份官方 WOFF2 字体以本地文件提供，支持 300–800 可变字重；Serif / Sans 包含真实斜体并启用光学字号。首屏预加载 Serif / Sans 常规体，其余样式按需加载。

站点所有者已确认具有网页使用授权。字体来源与说明见 [Anthropic-FONTS.md](dist/assets/fonts/Anthropic-FONTS.md)，不适用目录中原有 Source 字体的 SIL Open Font License。

Anthropic 字体不包含中文、日文、韩文、阿拉伯文等字形，这些文字由对应语言的系统字体补足；各语言版本中的拉丁文字仍优先使用 Anthropic 字体，无需请求外部字体服务。

## 本地构建与预览

使用 Node.js 20 或更新版本，无需安装第三方依赖。在仓库根目录依次运行：

```sh
node scripts/build.mjs
node scripts/serve.mjs
```

访问 [http://127.0.0.1:4173](http://127.0.0.1:4173)，按 Ctrl+C 结束预览。修改内容或样式后，重新构建并刷新页面。生成后的网页位于 `dist/`；关闭 JavaScript 仍可阅读正文、查看全部照片并打开原图。

## 部署

本仓库通过 [Deploy Gofish homepage](https://github.com/gofish040821/gofish040821.github.io/actions/workflows/pages.yml) 工作流发布到 GitHub Pages。`main` 分支中的 `content.json`、`src/`、`scripts/` 或 `dist/` 更新会自动触发构建与发布；仅修改 README 不会重新部署。也可在 Actions 页面手动运行工作流。

工作流使用 Node.js 22 执行构建，再发布 `dist/`。构建会根据 CSS 和 JavaScript 内容生成资源版本，避免页面更新后继续加载旧缓存。

`dist/` 内的照片、字体和徽章是项目资源，必须保留并提交，不要删除整个目录或将其加入 `.gitignore`。生成的 `dist/index.html`、CSS 和 JavaScript 应通过构建更新，不要直接编辑。更改域名或部署子路径时，先更新 `content.json` 的 `siteUrl`，再构建。

## 内容维护

`content.json` 保存基础内容和相册顺序；`src/i18n.json` 保存各语言的界面文字与内容，**包括英文版本**。修改文案时同步对应翻译，避免首次加载与切换语言后的内容不同。

| 想改什么 | 对应位置 |
| --- | --- |
| 个人简介与首页文案 | `content.json` 的 `about`、`headline`、`intro`，以及各语言对应内容 |
| 模块标题与导航 | `src/i18n.json` 的 `strings`；英文 `aboutTitle` 为 `About me`，`navAbout` 为 `About`；同时维护模板默认文字 |
| GitHub、LinkedIn、公开邮箱 | `github`、`linkedin`、`email`；邮箱留空时不展示入口 |
| 研究兴趣与展开内容 | `research` 的 `subtitle`、`description`、`details` |
| 技术栈 | `skills`、`agentSkills`；默认排序在构建脚本中维护 |
| 教育经历与兴趣爱好 | `education`、`hobbies` |
| 相册与首页大图 | `gallery`、`heroImage`、`heroCaption` |
| 个人信息说明与更新时间 | `profileNote`、`updated`；`{age}` 在构建时替换为年龄 |

配色在 `src/style.css` 顶部，按钮和菜单样式在 `src/controls.css`，字体与排版精修在最后加载的 `src/editorial.css`。维护多语种排版时，保留各文字系统的字体回退、字距、行高和阅读方向规则。

## 照片维护

照片位于 `dist/assets/photos/`，使用 WebP 正常版及 `-small` 缩略版。新增照片时：

1. 准备 `new-trip.webp` 与 `new-trip-small.webp`，放入照片目录；建议长边分别为 1800 和 720 像素，并移除 EXIF 信息。
2. 在 `content.json` 的 `gallery` 中添加记录，`image` 填写不含扩展名的 `new-trip`，补全 `title`、`caption`、`alt`、`position`，并同步各语言的照片记录。
3. 重新构建并检查布局。相册按 `content.json` 排序，构建通过 `image` 匹配翻译并检查缺失、重复项，避免调序后配文错位。

缩略图保留照片原始比例，放大后显示完整照片。更换导航头像时，替换 `avatar.webp` 和 `avatar-small.webp`。

## 文件结构

```text
content.json                 基础内容与相册顺序
src/i18n.json                14 种语言的界面文字与内容
src/index.html               网页结构模板
src/style.css                配色、响应式布局与插画动效
src/controls.css             按钮、导航和菜单样式
src/editorial.css            字体、阅读节奏与照片排版
src/app.js                   语言、主题、展开和相册交互
scripts/build.mjs            无依赖静态构建
scripts/serve.mjs            本地预览
scripts/illustrations.mjs    模块与研究场景的分层矢量插画
scripts/hobby-scenes.mjs     四幅爱好场景的分层矢量插画
scripts/skill-icons.mjs      技术图标与徽章
scripts/fish-mark.mjs        页脚小鱼标识
src/assets/fish.svg          小鱼 SVG 源文件
dist/                       生成的网页与必需静态资源
dist/assets/fonts/          字体文件及来源、许可说明
.github/workflows/pages.yml  GitHub Pages 构建与部署
```

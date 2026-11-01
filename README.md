# Personal homepage template

一份可在本地运行的双语个人主页模板。页面使用暖米白、陶土橙、手绘铅笔插画和 Source Serif / Source Sans 开放字体。示例姓名、项目、经历、联系方式和图片都需要按实际情况替换。

需要 Node.js 20 或更新版本，无第三方运行或构建依赖。

```sh
npm run build
npm run preview
```

浏览器打开 http://127.0.0.1:4173/ 。停止预览使用 Ctrl+C。可通过 PORT 环境变量选择其他端口。

## 修改内容

先读 AGENTS.md 和 content.json。content.json 保存姓名、联系方式、站点地址、封面、正文、项目、教育、技能、爱好和相册顺序。构建时以它生成英文正文。src/i18n.json 保存中英文界面文字和中文译文，英文界面文案也在这里。

修改中文时同步 src/i18n.json 的 zh，保持图片 image、项目 className 和爱好 symbol 一致。不要把示例项目当成自己的真实成果。示例链接 your-username、your-name 和 hello@example.com 应替换成自己的账号。

模板有两项示例项目。chicken 和 burger 是它们采用的插画名称，可以保留或改为 scripts/illustrations.mjs 中已有的其他名称。图标的笔压与局部变化在 src/app.js，整体动作在 src/style.css。

相册图片在 dist/assets/photos/。每个 image 对应 name.webp 和 name-small.webp，两张图片应有相同的构图与比例。封面默认 sample-01，头像文件为 avatar.webp / avatar-small.webp。替换图片后维护标题、图注和 alt，重新构建。模板图片是抽象占位插画。

## 修改设计

DESIGN.md 说明了配色、字体、留白、内容层次和动效方法。src/style.css 提供基础样式与动效，src/controls.css 提供控件样式，最后加载的 src/editorial.css 提供字体和排版。逐项调整变量和组件，修改后检查手机、桌面、浅色与深色模式。

dist/ 既有生成文件，也包含构建需要的图片、字库和技能图标。不要删除整个目录。生成 HTML / CSS / JS 请运行构建更新。

## 部署到自己的站点

先修改 content.json 的 siteUrl，并把项目推送到自己的仓库。用户名主页通常使用 https://your-username.github.io，项目站点使用 https://your-username.github.io/repository-name。路径资源使用相对地址，404、canonical、robots 与 sitemap 会跟随 siteUrl。

如果使用 GitHub Pages，先把 deploy/pages.yml.example 复制为自己仓库中的 .github/workflows/pages.yml。在仓库 Settings → Pages 中把 Source 设为 GitHub Actions，然后到 Actions 手动运行 Deploy homepage。这个配置只支持手动触发。也可以把构建后的 dist 上传到自己的静态服务器。

导出项目不带原站的 Git 历史、个人资料、访问统计和专有字体。代码与原创模板插画使用 MIT，Source 字体使用各自附带的 SIL OFL。新增素材时保留来源和许可。

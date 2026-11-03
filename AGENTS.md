# 维护个人主页与可复用模板

本仓库的 main 分支发布站主的个人主页。template/ 保存匿名导出所需的内容、页面覆盖文件和素材。template 分支提供已经导出的独立项目。

## 先确定修改对象

- 修改站主主页时，使用根目录 content.json、src/ 和 scripts/，先核对用户指定的动效版本。dist/ 中的照片、字库、技能图标是构建输入，需要保留。
- 给其他人建站时，先运行 node scripts/create-template.mjs ../my-homepage，或克隆 template 分支。进入新目录再工作，从它的 AGENTS.md 和 content.json 开始。不要从根站复制个人经历、照片或联系方式。
- src/app.js 和 src/style.css 包含已审阅的完整插画动作。图标原形在 scripts/illustrations.mjs、hobby-scenes.mjs 和 sketch-pencil.mjs。修改动效前确认静止路径，避免拿已放弃的重绘稿代替线上图。

## 修改与验证

根站 content.json 是基础内容，src/i18n.json 包含 14 种语言的译文，根站英文内容仍需同步维护两处。匿名模板使用两种语言，构建时英文正文以 content.json 为准。

运行 npm run build，再运行 npm run preview 检查手机和桌面、中英文、明暗主题、键盘与触摸。动效需要检查首次进入、再次悬停、减少动态效果以及结束时还原。生成文件通过构建更新。

模板导出采用允许列表。新增资源或源文件时检查 scripts/create-template.mjs，验证导出项目能独立构建，并扫描它的源文件和 dist 中是否残留站主资料。默认不带访客统计、站主照片和专有字库。素材许可见 ASSET-LICENSES.md。

发布仅按用户指定的仓库、分支和范围进行。完成后确认 Actions 和线上实际内容，并清理本次不再需要的临时脚本。

每次个人主页有新变动上线时，按需同步更新 README.md 和 README.zh-CN.md 的概括性项目说明，并更新 content.json 的 updated。README 以设计理念、使用方法和当前功能为主，不逐条记录修改日志；变更历史以 Git 提交为准。涉及设计或交互取舍时，同步更新 DESIGN.md 与 DESIGN.zh-CN.md。涉及模板能力时，也更新模板的说明和独立 template 分支，发布前检查双语文档与实际页面一致。

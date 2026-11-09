# Mizzen FGD · 可持续迭代的前端原型

## 给产品同学的最简使用方式

你不需要直接修改代码，也不需要自己运行 Git 命令。

1. 双击 `启动原型.command`，在固定地址 http://localhost:3106 查看。
2. 继续在 Codex 对话里说“改哪个角色、哪个页面、哪里”，可以附截图。例如“旁听室的小纸条输入框加高，线上线下都同步”。我按对应模块修改，你刷新查看或等待热更新。
3. 满意后说“把这版定为评审版”，在接入 GitHub 后将它保存成明确版本；继续修改时仍保留已确认版本，研发按指定版本接收。
4. 要发给研发时双击 `打包给研发.command`，生成源码 ZIP。文件在旁边的 `fgd-workbench-deliveries`，不用自己挑文件或压缩整个工作目录。

`localhost` 预览只能在你这台电脑访问。要让同事直接点链接评审，还需要单独部署一个团队可访问的预览站点；仅上传 GitHub 不会自动产生这个站点。

### GitHub 的建议

版本管理方式见 [Git 版本管理](docs/Git版本管理.md)，每次可评审的变化记在 [CHANGELOG](CHANGELOG.md)。任务分支通过 PR 保存，确认后再合并到 `main`；提交会自动运行格式、类型、测试与构建检查。

本原型使用个人账号下的独立私有仓库 [2023liushuya-lab/mizzen-fgd-prototype](https://github.com/2023liushuya-lab/mizzen-fgd-prototype)，用于备份、版本比较、云端 Agent 协作和研发交接。由 Codex 处理提交和同步，你只确认评审版本。不要把产品讨论中的每次尝试直接提交进正式业务前端。正式研发需要时，从指定版本挑选模块或移植代码。

推荐分为“持续修改版”和“已确认评审版”，研发使用后者的版本号／提交号。预览部署可以后续关联仓库，改完后自动更新预览；仓库和预览站点的访问权限分别设置。仓库内容与本地工程同步；GitHub 不会自动同步未提交的本地修改，也不会自动部署预览站点。

### 研发能直接复用什么

可以复用题型渲染、作答表单、布局、样式、弹窗及明确的交互逻辑；具体模块入口见下方。当前是可运行的前端交互原型，**没有正式后端**。`prototype-repository.ts`、本地命令日志、模拟 AI 和媒体状态都需要研发替换为正式 API／服务，权限、真实音视频、AI 和并发行为仍需正式实现与验收。相同框架和语言便于移植，不代表代码可以无需适配直接上线。

源码包附带 `交接版本.json`，记录打包时间及文件 SHA-256，便于确认研发收到的是哪一版。浏览器里填写的答案和测试名单不在源码包内。

这个目录是后续迭代的源码真源。使用与当前 Mizzen 前端相同的 Next.js 16.2.6、React 19.2.6、TypeScript 5、Tailwind CSS 4、Zustand 5；基础按钮、弹窗使用 shadcn/ui 同类的 Radix + CVA 组合方式。

旧单文件 HTML 继续保留，**不再作为日常修改入口**。本工程没有把旧页面包进 iframe，也不再从主持台抓取 DOM。主持人和旁听者直接使用同一个 React 题目模块，通过权限参数区分操作。

## 每天怎么打开

双击本目录的 `启动原型.command`，然后打开 **http://localhost:3106**。启动窗口保持运行；下一次只要打开这个地址。源码保存后，开发服务器自动刷新界面，通常不需要重启或重新导出 HTML。

这使用 Next.js 内置的 [Fast Refresh](https://nextjs.org/docs/architecture/fast-refresh)，已经实际验证样式更新后原回答、纸条和草稿保留。

也可以在终端进入本目录运行：

```bash
pnpm install  # 第一次或依赖变化时
pnpm dev
```

原型的运行只需要前端，不需要启动 Mizzen 的数据库、API、AI 或 LiveKit。端口 3106 与正式本地前端的 3000 分开。电脑重启后需要重新启动本原型。

## 用什么格式、改哪里

| 要调整的内容 | 源文件格式 | 位置 |
| --- | --- | --- |
| 页面布局、按钮、卡片与交互展示 | `.tsx` | `src/features/entry`、`questions`、`workbench`、`participant` |
| 题目与演示名单 | `.ts`，有类型校验的数据 | `src/data/questions.ts`、`seed.ts` |
| 业务状态与三端联动 | `.ts` | `src/stores/fgd-store.ts`、`src/lib/fgd-reducer.ts` |
| 色彩、字体、共用控件 | `.css` | `src/styles/globals.css` |
| 某个模块的局部视觉 | `.module.css` | 与对应 React 模块放在一起 |
| 产品规则、验收与迁移说明 | `.md` | `docs/` |

以后仍然直接用自然语言提需求即可。例如“把旁听小纸条的输入框再高一点”，只需改 `workbench/PaperNotes.module.css`；“调整单选题的总结层级”，改 `questions/QuestionWorkspace.tsx`，主持人与旁听室同时生效。**不要让三个角色分别复制一套题目页面。**

## 路由和演示

- `/`：Mizzen 工作空间 → 焦点小组 → 创建研究。
- `/outline?project=...`：编辑大纲、章节分钟、题型配置并发布。
- `/project?project=...`：场次列表、创建与进入旁听。
- `/setup?project=...&session=...`：同页线上／线下配置，导入名单、个人二维码、线下声纹和座位。
- `/host?project=...&session=...`：主持台。
- `/participant?project=...&session=...`：受访者，房间码与名单认领。
- `/observer?project=...&session=...&token=...`：独立旁听室。
- `/scenarios`：开发用的常见状态，一键新建演示场次，减少重复走入场流程。

主流程：配置页打开受访者与旁听链接 → 受访者输入房间码并认领 → 主持人进入并开始题目 → 实际提交回答／模拟口头发言 → 三端同步。请在同一浏览器的不同窗口演示。

## 发布与检查

```bash
pnpm typecheck
pnpm test
pnpm build
pnpm start  # 运行构建后的版本
pnpm format
```

日常开发只运行 `pnpm dev`，不必每次修改都 build。需要分享给同事时，可以发布预览地址，或提供整个工程／构建包；本轮没有部署公网，也没有实现 Next 工程到单个可双击 HTML 的导出。

## 演示边界

业务状态保存在浏览器本地，采用独立名称空间的命令日志。多个窗口读取同一份状态，避免用整页快照传递 UI；它仍不是跨设备协作服务。页面里的音视频画面、设备状态、音量、网络信息及 AI 方向为本地原型演示，未连接生产音视频／模型／后台权限。AI 文字从实际输入中抽取，不把示例答案当作已提交答案；`/scenarios` 的数据是明确标注的样例。

原始文件位于 `../fgd-fused-20261109/` 与 `../fgd-merged-20261108/`，本工程不会修改它们。

## 云端 Agent 协作

在云端 Agent 中连接本私有仓库，使用独立任务分支（例如 `codex/participant-device-check`）；提交合并请求，确认效果后再合并到 `main`。不要让多个任务同时改共享状态或全局样式。云端不会自动继承本地对话和上级目录规则，先读本仓库 `AGENTS.md`、`docs/维护与规则.md` 与 `docs/原版一致性检查.md`。

环境要求为 Node.js 22 LTS 与 pnpm 10.19.0。安装命令：

```bash
npm install --global pnpm@10.19.0
pnpm install --frozen-lockfile
pnpm exec next typegen
pnpm check
pnpm build
```

本地启动用 `pnpm dev`。云端浏览器需监听容器外部地址时，可运行 `pnpm exec next dev --hostname 0.0.0.0 --port 3106`，再使用该平台提供的预览转发。无需生产环境密钥。

本仓库不包含浏览器 localStorage 中的个人演示数据；云端首次打开会使用源码中的演示数据。多端联动请用同一浏览器的多个窗口；跨设备同步仍需要正式服务端。历史单文件 HTML 保留在用户本地归档目录，不依赖那些文件也能安装、构建和运行本工程。

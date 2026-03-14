# OpenClaw 桌宠系统进展

更新时间：2026-03-13

## 阶段目标
- 熟悉项目基本架构、核心能力与代码基线。

## 当前概况
1. **项目定位**: 面向 macOS 的 OpenClaw Agent 桌面桌宠应用。以悬浮小窗和控制面板的形式，将远程或本地工作中的 Agent 化身为“桌面宠物”并提供直观交互。
2. **架构分层**:
   - `apps/macos-shell`: 核心端侧壳层（Electron 提供系统级窗口控制和 SSH 隧道能力；React 负责可视化状态管理、交互逻辑与动效）。
   - `packages/bridge`: 负责承接 OpenClaw 通信协议，作为数据与状态流向主应用的中转枢纽。
   - `packages/domain`: 抽离的核心业务模型，维护跨包共享的类型系统（如 `PetStatus`）。
3. **技术栈特点**: `pnpm` workspace Monorepo 机制，渲染层采用 `React 19` 搭配 `zustand/xstate` 做状态管理，桌面层用 `Electron`。
4. **近期动效与视觉**: 偏向更精细的可控时间轴方案（例如和尚桌宠从 CSS 机械敲击改成 GSAP timeline 实现轻重缓急，修正了视觉空间关系）。
5. **用户界面设定**: 强调极致“现代高级设计感”。

## 已完成事项
- [x] 梳理阅读根目录及文档结构（README, 既往设计文档记录）。
- [x] 了解 `apps` 和 `packages` 彼此的依赖边界，以及组件化设计思路(`features/` 分模块)。
- [x] 创建和初始化项目的执行日志与后续开发进展基链文档 `doc/progress.md`。

## 下一步工作开展
- 准备就绪。将会遵循“精简实现、高复用低耦合、注重安全与极简日志、零 Lint 报错”的策略推进后续变更的任务。
- [x] 将重设面板 (SettingsPanel) 抽离出来，提升了 WidgetPanel.tsx 的内部模块化程度
- [x] 成功修复由 `socket` 导致的 TS 编译报错和在 React 更新中的 Hook 渲染死循环报错的问题
- [x] 优化 UI：引入毛玻璃特效、更新聊天输入框为消息样式、重构圆角与阴影以贴近 macOS/iOS 等现代平台设计风格
- [x] **[当前进度]** 成功配置并连接 `stitch` MCP 服务，借用其设计的可爱毛玻璃与粉系配色（#eb477e），完成了 UI 视觉令牌提取。
- [x] **[当前进度]** 彻底重构了原有的单调垂直堆叠布局，改为顶部居中的多标签（Tab: 💬 Chat | 🐾 Gallery | ⚙️ Setup）卡片化分段器 (Segmented Control)。
- [x] **[当前进度]** 专属抽离出 `GalleryPanel.tsx` 设计，运用网格卡片（Grid Card）清晰优美地展示所有桌宠角色，支持状态绿点和悬浮动作。
- [x] **[当前进度]** 修复并重写了 `App.test.tsx` 中由于全新多 Tab 结构及 Empty State 文本更改引发的 Unit Testing 错误，当前测试 100% 通过。
- [x] **[当前进度]** 激活面板顶部类似 macOS 风格的三个控制小圆点（支持关闭、最小化）。
- [x] **[当前进度]** 将画廊的头像从 Emoji 切到了 `DesktopPetIllustration`，直接提取各个桌宠的实装 SVG。
- [x] **[当前进度]** 优化设置页里的 Connection 的 UX 逻辑，拍扁多余的 Accordion 层级，直接暴露网关状态与快速重连功能。
- [x] **[当前进度]** 重构聊天体验：支持回车(Enter)直接发送消息；输入 `/` 自动弹出 Telegram 风格的快捷命令补全菜单并且支持鼠标直接点选；支持获取新消息时面板自动柔和向下滚动到底部。
- [x] **[当前进度]** (Round 4) 彻底修复面板左上角三个控制圆点的样式和由于 CSS 注入错位导致的无法点击问题，现已完全正常具备 hover 与点击反馈。
- [x] **[当前进度]** (Round 4) 修复了 Gallery 面板中 `DesktopPetIllustration` 组件的 Prop 传递错误，所有桌宠形象（猫咪、和尚、机器人等）现已在网格内活灵活现地精准显示。
- [x] **[当前进度]** (Round 4) 极致精简 Setup 中 Connection 的交互逻辑，彻底去除了双层折叠与重复的 "Gateway management" 标题和按钮，直观展现网关状态。
- [x] **[当前进度]** (Round 5) 赋予了面板级窗口原生可交互能力：支持通过拖拽顶部导航栏移动窗口 (`-webkit-app-region: drag`)，同时支持边缘拖拽以调整尺寸 (`resizable: true`)。
- [x] **[当前进度]** (Round 6) 彻底修复画廊界面的布局：对齐了不规则的画廊卡片 (`grid-auto-rows: 1fr`)，修复了 SVG 头像定位错乱和被边缘切断的问题，同时为画廊中的宠物装配了真实状态驱动的 **呼吸及动态动画** (`desktop-pet` 环境包裹)。
- [x] **[当前进度]** (Round 7) 补全了最后两个系统级窗口交互遗留缺陷：修补了由于层级导致的顶部导航栏无法顺滑拖拽移动的问题（通过添加绝对定位拖拽热区 `::before`）；并将整体 DOM 结构由硬性 Grid 替换为纵向 `flex: 1` 组合，彻底修复了拉长面板高度时聊天窗口无法填满下方空白的响应式问题。
- [x] **[当前进度]** (Round 8) 彻底解决了每次重启应用后 Gateway 连接信息丢失的问题。根因是 `localStorage` 在 Electron 环境中跨重启不可靠。解决方案：在 Electron 主进程中新增了 `settings:read`/`settings:write` IPC 通道，将设置持久化到 `userData` 目录下的 `openclaw-settings.json` 文件；并为 Zustand 编写了自定义存储适配器 `createElectronStorage()`，实现 localStorage + 磁盘双写备份。启动时 `preloadSettingsFromDisk()` 先从磁盘恢复设置再注入安全 token。
- [x] **[当前进度]** (Round 9) Panel UI 优化：① 强化聊天输入框视觉（白底、1.5px 边框、focus 时粉色高亮光晕）；② 收到回复消息后也触发自动滚动到底部（`useEffect` 依赖从 `messages.length` 改为 `messages` 引用）；③ 重构面板 flex 布局：`panel-header`（window-bar + tabs）设为 `flex-shrink: 0` 常驻顶部不参与滚动，`panel-content` 占满剩余空间；Chat tab 中输入框 `flex-shrink: 0` 吸底，消息列表独立滚动；④ 移除了左上角无功能的绿灯和右上角冗余的最小化按钮；⑤ 快捷命令更新：移除 `/ping`、`/clear`，新增 `/think`（深度思考）、`/new`（新建会话）。全部 95 个测试通过。
- [x] **[当前进度]** (Round 9) Setup 与 Gallery 职责分离：移除 Setup 标签页中的 Display 区块（Mode 单/多 + Pinned 下拉），改为在 Gallery 中统一完成：Gallery 头部增加 Single/Group 显示模式切换，Pin 仍由每张卡片上的星标按钮完成；Setup 仅保留「Gateway Connections」。测试已更新为在 Gallery 中操作显示模式与 Pin，全部通过。
- [x] **[当前进度]** (Round 10) 桌面端基础修复：解决了 `pnpm dev:desktop` 时由于 node_modules 中缺失 `tsx` 依赖引起的 `sh: tsx: command not found` 报错问题，通过执行工作区根目录下的重新安装确保所有相关基础依赖被正确解析，服务已经可以顺利启动并进入开发模式。
- [x] **[当前进度]** (Round 11) 删除复杂特性：彻底移除了 Gallery 和 App 中的 Group（多选）展现模式以及 `MultiPetShell` 相关逻辑，现在画廊中仅保留纯粹的单桌宠切换与标记逻辑（Pin），精简了全局的状态机（移除了 `displayMode`，`groupSelectedAgentIds` 等状态），进一步减轻了 UI 的复杂度和心智负担。全部 95 个测试和 Lint 校验通过。
- [x] **[当前进度]** (Round 12) 为每个形象设计两套动画（工作中 / 空闲中），由既有 `petStatus` → `resolvePetAnimationState()` 的 activity 判断：① 和尚 working 使用 GSAP 时间轴加快敲击节奏（lift/strike/recover 总周期由 ~0.72s 缩至 ~0.42s），功德粒子间隔同步为 420ms；② 龙虾空闲为慢速放松摇摆（2.8s），工作中为更快敲键盘感（0.5s）；③ 猫空闲为慵懒呼吸（2.8s），工作中为专注点头（0.6s）；④ 机器人空闲为待机呼吸（2.4s），工作中为扫描感（0.55s）。猫/机器人/龙虾的 keyframes 区分度增强。
- [x] 新增 `doc/桌宠三态动画设计.md`：梳理四只桌宠（龙虾/猫/机器人/和尚）在**工作中、空闲、掉线**三态下的动画方案；明确当前实现与缺口，并给出掉线态专用 keyframes 与可选灰化等实现建议。
- [x] 改进桌宠动画设计：统一为 **SVG + GSAP** 方案（与 monk 一致），重写 `doc/桌宠三态动画设计.md`，为 lobster/cat/robot 设计可动部件 class 与三态 GSAP timeline 思路；**已知问题**：monk 动画长时间运行后手与棍子会偏离位置，待后续修复。
- [x] 在 `doc/桌宠三态动画设计.md` 中新增 **趣味性与成长体系设计**：仿照 Monk 功德体系，为龙虾（修得/码力）、猫咪（清单点/规划）、机器人（巡检点/运维）设计成长单位、粒子文案、里程碑与庆祝方式，并约定统一技术方案（store、MeritParticles、MeritCelebration 按 role 扩展）；含趣味细节建议（达成时小动画、便签/屏幕进度展示等）。
- [x] **[当前进度]** 调用 Stitch MCP 完成了 4 个桌宠形象（和尚、龙虾、猫咪、机器人）的视觉设计，涵盖“工作中、空闲、掉线”三态，设计风格统一为现代高级感，且针对 SVG + GSAP 动画进行了分层优化。


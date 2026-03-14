# Rive 动画方案介绍与价格对比

本文介绍 Rive 作为桌宠动画方案的要点，以及官方定价与可选档位对比，便于评估是否采用 Rive 做官方 Pet Pack。

---

## 一、Rive 是什么

**Rive** 是一款面向 App / Web / 游戏的 **2D 实时动画** 工具与运行时：

- **编辑器**：在 [editor.rive.app](https://editor.rive.app) 里画矢量、绑骨骼、做状态机与过渡，导出为 `.riv` 文件。
- **运行时**：在应用内用官方 Runtime 加载 `.riv`，通过 API 控制状态机输入（如 `idle` / `working` / `offline`）、监听事件（如敲击瞬间触发粒子），实现可交互动画。

和 Lottie 相比，Rive 支持 **状态机（State Machine）**、**数据绑定**、**脚本**，更适合「多状态 + 代码驱动」的桌宠；和纯 SVG+GSAP 相比，动画在编辑器中可视化制作、迭代快，运行时只需加载一个 `.riv` 并设状态，无需手写每段 timeline。

---

## 二、与桌宠系统的契合点

| 需求 | Rive 能力 |
|------|-----------|
| 三态切换（工作中 / 空闲 / 掉线） | 状态机多状态 + 输入布尔/枚举，运行时 `setInput('working', true)` 即可切换。 |
| 敲击/扫描等节奏事件驱动粒子 | 在时间轴上打 **Event**（如 `strike`），运行时监听后触发功德/修得等粒子。 |
| 多只桌宠共用一套渲染管线 | 一个 `RivePetRenderer` 组件，按 pack 加载不同 `.riv`，统一用 `scene.activity` 驱动状态机。 |
| 官方/第三方 Pet Pack 扩展 | 第三方可自行用 Rive 做 `.riv` + manifest，不依赖项目内 GSAP 代码。 |

当前项目里已有规划：Pet Pack 的 `manifest.json` 可声明 `renderer: "rive"`，由 `RivePetRenderer` 挂载对应 `.riv` 并驱动状态（见 `docs/plans/2026-03-11-desktop-pet-platform-implementation.md` Task 7）。

---

## 三、技术集成方式（React）

- **推荐包**：`@rive-app/react-webgl2`（性能与特性最全）或 `@rive-app/react-canvas`（体积更小）。
- **用法示例**：用 `useRive` 传入 `src`（.riv 地址）、`stateMachines`（状态机名），用 `useStateMachineInput` 绑定输入项（如 `working`、`idle`），根据 `scene.activity` 或 `connectionStatus` 设值即可。
- **事件**：在 Rive 时间轴上添加 Event，运行时监听后触发 `MeritParticles` 或各角色成长体系的「+1」逻辑。

文档与示例：[Rive – React](https://rive.app/docs/runtimes/react)。

---

## 四、价格对比（官方定价，以官网为准）

Rive 采用 **按席位（seat）月费**，核心差异在于 **能否导出 .riv 用于正式发布**：

| 档位 | 月费（每席） | 协作文件数 | 导出 .riv / 发布 | 适用场景 |
|------|--------------|------------|------------------|----------|
| **Free** | $0 | 3 个协作文件 | ❌ 不可导出 | 仅学习、个人试玩；不能把动画真正“发到”产品里。 |
| **Cadet** | **$9** | 无限 | ✅ 可导出、无限文件 | 小团队正式上线（最多 3 席）。 |
| **Voyager** | $32 | 无限 | ✅ + CDN 托管、Embed 链接、优先支持 | 需要资源托管与更大协作（最多 25 席）。 |
| **Enterprise** | $120 | 无限 | ✅ + 自定义 S3、自定义 Runtime、SSO、SOC2 | 年收入 $10M+ 的大团队与合规需求。 |

要点：

- **免费版不能导出**：编辑器里可做状态机、动画、脚本，但无法导出 `.riv` 用于 App/Web 发布，官网标语即 “Free to create, $9/mo to ship”。
- **运行时使用不额外收费**：在应用里用 `@rive-app/react-*` 加载并播放 `.riv` 不需要再付 Rive 授权费；付费的是「在 Rive 里做出并导出 .riv」的席位。
- **年付有折扣**：例如 Cadet 年付约 $108/席/年，Voyager 约 $384/席/年。
- **学生计划**：有教育优惠，需验证身份。

更多细节与最新价格见：[Rive Pricing](https://rive.app/pricing)。

---

## 五、与本项目的取舍

- **若采用 Rive 做官方桌宠包**：至少需要 **Cadet（$9/月/席）**，才能导出 `.riv` 并随应用分发；1 个设计师/开发者席位即可完成制作与集成。
- **若暂时不付费**：可继续用当前 **SVG + GSAP** 方案完成四只桌宠的三态与成长体系；后续若希望用 Rive 做更复杂或可编辑的 Pet Pack，再升级 Cadet 即可。
- **若希望用户/社区自制桌宠**：用户需自备 Rive 导出能力（即至少 Cadet），或我们提供「仅用 Rive 编辑器 + 我们提供的模板」的指引，由我们统一导出并打包进应用（我们侧需至少一席 Cadet）。

---

## 六、小结

| 项目 | 说明 |
|------|------|
| **方案** | Rive = 编辑器做 2D 状态机动画 + 运行时在 React 中加载 .riv、设状态、监听事件，与桌宠三态与成长体系契合。 |
| **价格** | Free 不可导出；**$9/月/席（Cadet）** 起才能导出并正式使用；运行时免费。 |
| **建议** | 先以 SVG+GSAP 完成首版趣味与成长；若后续要官方 Rive 包或支持社区 Rive 包，再评估 Cadet 席位。 |

# Lottie 动画接入操作指南（免费方案）

本文档指导你如何为桌宠制作 Lottie 动画并接入项目。每只桌宠有 3 个独立的 Lottie JSON 文件，分别对应 3 个状态。

---

## 免费工具推荐

| 工具 | 费用 | 适用场景 | 导出格式 |
|------|------|----------|----------|
| **LottieFiles Creator** (lottiefiles.com/creator) | 免费 | 在线编辑器，直接制作动画 | Lottie JSON |
| **SVGator** (svgator.com) | 免费版可用 | 可视化 SVG 动画编辑器 | Lottie JSON / SVG |
| **Haiku Animator** | 免费 | 桌面应用，可导入 Sketch/Figma 素材 | Lottie JSON |
| **After Effects + Bodymovin** | AE 付费，Bodymovin 免费 | 专业动画制作 | Lottie JSON |
| **Figma + LottieFiles 插件** | 均有免费版 | 从 Figma 设计稿直接做动画 | Lottie JSON |
| **Keyshape** (macOS) | 一次付费 ~$30 | 轻量 SVG 动画工具 | Lottie JSON |

**推荐新手路线**：LottieFiles Creator（纯在线，零门槛）或 SVGator（可视化拖拽）。

---

## 一、制作动画

### 每只桌宠需要 3 个动画文件

| 文件名 | 状态 | 动画内容 | 循环 |
|--------|------|----------|------|
| `{role}-idle.json` | 空闲 | 慢节奏，呼吸/待机感（2-3 秒周期） | 循环 |
| `{role}-working.json` | 工作中 | 快节奏，明确动作（0.4-0.6 秒周期） | 循环 |
| `{role}-offline.json` | 掉线 | 静帧或极慢呼吸（4-5 秒周期） | 单次或极慢循环 |

### 以 monk 为例

**idle（慢敲木鱼）**：
1. 导入和尚 SVG 素材（可从现有 `DesktopPetIllustration.tsx` 的 SVG 代码复制并保存为 .svg 文件）
2. 对手臂 + 木槌做关键帧动画：缓慢抬起 → 落下敲击 → 恢复
3. 周期约 2 秒，循环播放
4. 导出为 `monk-idle.json`

**working（快敲木鱼）**：
1. 同样的动作，但速度快 4-5 倍
2. 周期约 0.42 秒
3. 导出为 `monk-working.json`

**offline（静止）**：
1. 所有部件静止不动
2. 可选：极慢 opacity 变化（4 秒周期）
3. 导出为 `monk-offline.json`

### 从现有 SVG 提取素材

项目中已有各角色的内联 SVG 代码，你可以直接用：

1. 打开 `apps/macos-shell/src/features/widget/DesktopPetIllustration.tsx`
2. 复制对应角色的 `<svg>...</svg>` 代码
3. 保存为 `.svg` 文件
4. 导入到 LottieFiles Creator / SVGator 中作为素材
5. 在动画工具中对各部件添加关键帧动画

---

## 二、放入项目

### 1. 创建资产目录

```bash
mkdir -p apps/macos-shell/public/assets/pets
```

### 2. 放入文件

```bash
# 以 monk 为例
cp monk-idle.json     apps/macos-shell/public/assets/pets/
cp monk-working.json  apps/macos-shell/public/assets/pets/
cp monk-offline.json  apps/macos-shell/public/assets/pets/
```

最终目录结构：
```
apps/macos-shell/
├── public/
│   └── assets/
│       └── pets/
│           ├── monk-idle.json
│           ├── monk-working.json
│           ├── monk-offline.json
│           ├── lobster-idle.json      ← 其他角色同理
│           ├── lobster-working.json
│           ├── lobster-offline.json
│           └── ...
```

---

## 三、在代码中启用

只需改一个文件：`apps/macos-shell/src/features/widget/pet-engine.ts`

找到 `LOTTIE_ASSETS`，取消对应角色的注释：

```ts
const LOTTIE_ASSETS: Partial<Record<PetRolePackId, LottieAssetSet>> = {
  monk: {                                          // ← 取消注释
    idle: '/assets/pets/monk-idle.json',
    working: '/assets/pets/monk-working.json',
    offline: '/assets/pets/monk-offline.json',
  },
  // lobster: { ... },  ← 其他角色准备好后再取消注释
  // cat: { ... },
  // robot: { ... },
};
```

**不需要改其他任何代码。**

---

## 四、工作原理

代码中已实现完整的 Lottie 渲染链路：

```
pet-engine.ts          →  resolveEngine('monk')
                          → 发现有 Lottie 资产 → type: 'lottie'
    ↓
PetRenderer.tsx        →  选择 LottiePetRenderer
    ↓
LottiePetRenderer.tsx  →  根据 activity 映射到 lottieState (idle/working/offline)
                          → 加载对应的 .json 文件
                          → 状态变化时销毁旧动画，加载新动画
```

**状态映射：**

| petStatus | → lottieState | 播放的文件 |
|-----------|---------------|-----------|
| idle / waiting / done | idle | `{role}-idle.json` |
| working / thinking | working | `{role}-working.json` |
| blocked / disconnected | offline | `{role}-offline.json` |

**Fallback 机制**：Lottie 加载失败时自动回退到 SVG + GSAP。

**功德粒子**：每次 Lottie 动画循环播放完成时自动触发（`loopComplete` 事件），与动画节奏同步。

---

## 五、引擎优先级

项目同时支持 Rive、Lottie 和 SVG 三种引擎，优先级为：

```
Rive (.riv) > Lottie (.json) > SVG + GSAP (内置 fallback)
```

如果一个角色同时配了 Rive 和 Lottie，会优先使用 Rive。

每只角色可以独立选择引擎，互不影响。例如 monk 用 Lottie，lobster 用 SVG + GSAP，cat 用 Rive，完全没问题。

---

## 六、测试验证

### 本地验证

1. `pnpm dev` 启动应用
2. 确认桌宠渲染正常（应该看到 Lottie 动画而非之前的 SVG）
3. 在 Gallery 面板用 "SET WORKING" 按钮切换状态，观察动画是否切换
4. 断开连接，观察是否进入 offline 状态

### 验证 checklist

- [ ] idle 状态：慢节奏循环动画
- [ ] working 状态：快节奏循环动画
- [ ] offline 状态：静帧或极慢呼吸
- [ ] idle ↔ working 切换正常，无跳变
- [ ] working → offline → idle 切换正常
- [ ] 功德粒子正常出现（每次动画循环完成时触发）
- [ ] Lottie 加载失败时 fallback 到 SVG + GSAP

---

## 七、Lottie JSON 文件规范

- **尺寸**：建议画布 160x150（与现有 SVG viewBox 一致）
- **帧率**：30fps 即可（桌宠动画不需要 60fps）
- **文件大小**：尽量控制在 50KB 以内（避免嵌入位图）
- **颜色**：使用纯色 fill/stroke，不嵌入位图
- **命名**：`{rolePack}-{state}.json`，如 `monk-idle.json`

---

## 八、已安装的依赖

- `lottie-web`（已安装，纯 JS 库，免费开源，~250KB gzipped）
- `LottiePetRenderer.tsx`（已实现）
- `PetRenderer.tsx`（已更新，支持三引擎切换）
- `pet-engine.ts`（已更新，包含 Lottie 资产映射表）

**你只需要：做好 3 个 Lottie JSON 文件 → 放入 public 目录 → 取消注释一段配置。**

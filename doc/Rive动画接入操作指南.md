# Rive 动画接入操作指南

本文档指导你如何为桌宠制作 Rive 动画并接入项目。以 monk 为例，其他角色流程完全一致。

---

## 一、在 Rive 编辑器中制作动画

### 1. 打开 Rive 编辑器

访问 https://rive.app ，注册/登录后新建文件。

### 2. 导入 SVG 素材

你可以选择以下任一方式：

- **方式 A**：直接在 Rive 中绘制角色
- **方式 B**：从 Figma/Illustrator 导出 SVG，拖入 Rive 画布

无论哪种方式，需要确保**可动部件是独立图层**（如手臂、木槌、身体各自分层）。

### 3. 创建 3 个动画时间轴

在 Rive 编辑器左下角的 "Animations" 面板中，创建 3 个动画：

| 动画名称 | 类型 | 说明 |
|----------|------|------|
| `idle` | Loop | 空闲状态，慢节奏（约 2-3 秒一个周期） |
| `working` | Loop | 工作状态，快节奏（约 0.4-0.6 秒一个周期） |
| `offline` | One-shot 或极慢 Loop | 掉线状态，静帧或极慢呼吸 |

每个动画中对关键部件做关键帧动画。例如 monk：
- **idle**：手臂缓慢抬起 → 敲击 → 恢复，周期 ~2s
- **working**：同样动作但快 4-5 倍，周期 ~0.42s
- **offline**：所有部件静止（可选极慢 opacity 呼吸）

### 4. 创建 State Machine

这是**最关键的一步**，让代码能控制动画切换。

1. 在 Animations 面板点击 "+" → 选择 **"State Machine"**
2. **命名为 `PetStateMachine`**（必须一字不差）
3. 添加一个 **Number 类型的 Input**，**命名为 `status`**
4. 在 State Machine 画布中创建状态节点：

```
         ┌──────────┐
    ┌────│  Entry   │────┐
    │    └──────────┘    │
    ▼                    ▼
┌────────┐         ┌──────────┐
│  idle  │◄───────►│ working  │
└────────┘         └──────────┘
    │                    │
    ▼                    ▼
┌──────────┐       ┌──────────┐
│ offline  │       │ offline  │
└──────────┘       └──────────┘
```

5. 为每个状态节点指定对应的动画（idle 节点 → idle 动画，以此类推）
6. 添加 **Transitions**（状态转换条件）：

| 从 | 到 | 条件 |
|----|-----|------|
| Entry | idle | status == 0 |
| Entry | working | status == 2 |
| Entry | offline | status == 5 |
| idle | working | status == 2 |
| idle | offline | status == 5 |
| working | idle | status == 0 |
| working | offline | status == 5 |
| offline | idle | status == 0 |
| offline | working | status == 2 |

> **status 值映射**（与代码中 `ACTIVITY_TO_RIVE_INPUT` 对应）：
> - `0` = idle（空闲）
> - `1` = thinking（思考，可复用 working 动画或单独做）
> - `2` = working（工作中）
> - `3` = waiting（等待，可复用 idle）
> - `4` = done（完成，可复用 idle）
> - `5` = blocked / offline（掉线）

### 5. 可选：添加 strike 事件

如果你想让功德粒子与动画精确同步（而不是定时器估算）：

1. 在 idle 和 working 动画的**敲击落下瞬间**添加一个 **Rive Event**
2. 命名为 **`strike`**（必须一字不差）
3. 代码中的 `RivePetRenderer` 会自动监听这个事件并触发粒子

### 6. 导出 .riv 文件

File → Export → 下载 `.riv` 文件，命名为 `monk.riv`。

---

## 二、将 .riv 文件放入项目

### 1. 创建资产目录

```bash
mkdir -p apps/macos-shell/public/assets/pets
```

### 2. 放入文件

```bash
cp ~/Downloads/monk.riv apps/macos-shell/public/assets/pets/monk.riv
```

最终目录结构：
```
apps/macos-shell/
├── public/
│   └── assets/
│       └── pets/
│           ├── monk.riv        ← 你放这里
│           ├── lobster.riv     ← 以后其他角色
│           ├── cat.riv
│           └── robot.riv
```

---

## 三、在代码中启用

只需改一个文件：`apps/macos-shell/src/features/widget/pet-engine.ts`

### 修改前（当前状态）：

```ts
const RIVE_ASSETS: Partial<Record<PetRolePackId, string>> = {
  // Uncomment as .riv files become available:
  // monk: '/assets/pets/monk.riv',
  // lobster: '/assets/pets/lobster.riv',
  // cat: '/assets/pets/cat.riv',
  // robot: '/assets/pets/robot.riv',
};
```

### 修改后：

```ts
const RIVE_ASSETS: Partial<Record<PetRolePackId, string>> = {
  monk: '/assets/pets/monk.riv',
  // lobster: '/assets/pets/lobster.riv',
  // cat: '/assets/pets/cat.riv',
  // robot: '/assets/pets/robot.riv',
};
```

取消注释一行即可。**不需要改其他任何代码。**

---

## 四、工作原理（已实现，无需修改）

代码中已有完整的 Rive 渲染链路：

```
pet-engine.ts          →  resolveEngine('monk') → 发现有 .riv → type: 'rive'
    ↓
PetRenderer.tsx        →  选择 RivePetRenderer（而非 SVG fallback）
    ↓
RivePetRenderer.tsx    →  加载 .riv，驱动 state machine
    ↓
状态同步               →  animationState.activity 变化时
                          → 自动设置 status input 的值
                          → Rive 自动切换到对应动画
```

状态来源（与当前 GSAP 方案完全一致）：
- 工作中（working/thinking） → `status = 2`
- 空闲（idle/waiting/done） → `status = 0`
- 掉线（blocked/disconnected） → `status = 5`

如果 .riv 加载失败，会自动 fallback 到当前的 SVG + GSAP 方案。

---

## 五、测试验证

### 本地验证

1. `pnpm dev` 启动应用
2. 确认桌宠渲染正常（应该看到 Rive 动画而非之前的 SVG）
3. 在 Gallery 面板用 "SET WORKING" 按钮切换状态，观察动画是否切换
4. 断开连接，观察是否进入 offline 静帧

### 验证 checklist

- [ ] idle 状态：慢节奏循环动画
- [ ] working 状态：快节奏循环动画
- [ ] offline 状态：静帧或极慢呼吸
- [ ] idle ↔ working 切换流畅，无跳变
- [ ] working → offline → idle 切换正常
- [ ] 功德粒子正常出现（如果配了 strike 事件则精确同步，否则用定时器）
- [ ] .riv 加载失败时 fallback 到 SVG + GSAP

---

## 六、其他角色

其他 3 只桌宠流程完全一样：

1. 在 Rive 中制作动画，State Machine 命名 `PetStateMachine`，Input 命名 `status`
2. 导出 .riv 到 `public/assets/pets/{rolePack}.riv`
3. 在 `pet-engine.ts` 取消对应注释

每只宠可以独立启用，互不影响。未启用 Rive 的角色继续使用 SVG + GSAP。

---

## 七、Rive 编辑器常用技巧

- **骨骼绑定**：给角色加 Bones，可以做更自然的关节动画
- **约束**：用 Constraints 让眼睛跟随鼠标等交互效果
- **混合状态**：State Machine 支持 Blend State，可在 idle 和 working 之间做平滑过渡
- **文件大小**：一个角色的 .riv 通常 50-200KB，远小于 Lottie JSON
- **调试**：Rive 编辑器内可直接测试 State Machine，修改 status 值观察切换效果

---

## 八、项目中已有的 Rive 依赖

- `@rive-app/react-canvas: ^4.27.1`（已安装在 package.json）
- `RivePetRenderer.tsx`（已实现，监听 status input 和 strike event）
- `PetRenderer.tsx`（已实现，自动选择 Rive / SVG）
- `pet-engine.ts`（已实现，资产映射表和引擎选择逻辑）

**你不需要安装任何新依赖，也不需要写任何新代码。只需制作 .riv 文件并取消注释一行配置。**

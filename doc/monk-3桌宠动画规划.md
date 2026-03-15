# Monk-3 桌宠动画规划

基于 `apps/macos-shell/public/assets/pets/monk-3.svg` 的分组 ID，规划三态（空闲 / 工作中 / 掉线）GSAP 骨架动画。

---

## 一、SVG 分组结构（monk-3.svg）

viewBox: `0 0 1024 1024`。**不需要改命名**，代码已按当前 SVG 里的 id（中文或实体解析结果）查找分组。

---

## 二、可动部件与旋转/缩放原点（建议）

原点需按 1024×1024 坐标实测或从设计稿获取，以下为占位与参考（与 monk-bone 逻辑对应）：

| 部件     | 对应分组 | 建议原点 (x y) | 说明           |
|----------|----------|----------------|----------------|
| root     | 和尚 (1) 1 | 512 512        | 整体中心       |
| head     | 头       | ~512 490       | 脖子底部       |
| body     | 袈裟     | ~502 677       | 躯干中心       |
| rightArm | 右臂     | ~370 496       | 右肩           |
| leftArm  | 左臂     | ~650 497       | 左肩           |
| stick    | 木棍     | ~287 438       | 棍子握点（上） |
| fish     | 木鱼     | ~686 839       | 木鱼中心       |

实现时可在控制台用 `getBBox()` 或设计稿核对后微调。

---

## 三、三态动画设计

### 3.1 空闲（Idle）

- **周期**：约 3s 一轮，节奏慢、幅度小。
- **root**：整体轻微上下漂移（如 y: 0 → -5 → 0），`sine.inOut`。
- **head**：头轻微左右摆（如 rotation -2° ~ 1.5°），与呼吸错峰。
- **rightArm + stick**：慢速抬起（约 1.2s）后轻敲落下（约 0.6s），与木鱼压扁同步。
- **fish**：在棍子落下瞬间极短压扁（scaleY 0.93, scaleX 1.04）后弹性恢复 `elastic.out(1, 0.4)`。
- **leftArm**：与头反向轻微摆动，幅度约 -2° ~ 0°。
- **body（袈裟）**：可选轻微前后倾（约 1°），与敲击节奏一致。

全部使用 `fromTo` 固定起止值，避免长时间运行漂移（参见《桌宠三态动画设计》）。

### 3.2 工作中（Working）

- **周期**：约 0.4–0.5s 一轮，节奏快。
- **rightArm + stick**：快速抬起（约 0.12s）→ 落下敲击（约 0.08s）→ 回弹（约 0.2s），ease 发力用 `power2.out` / `power3.in`，回弹用 `sine.out`。
- **head**：每敲一下轻微点头（约 2° → -1.5° → 0）。
- **body**：敲击瞬间略前倾约 1° 再回正。
- **fish**：敲击瞬间压扁（scaleY 0.90, scaleX 1.06）后弹性恢复。
- **leftArm**：可保持静止或极小幅随动。

### 3.3 掉线（Blocked）

- 不跑 GSAP 时间轴，静帧。
- 容器加灰化：`filter: grayscale(0.5) brightness(0.88)`（与现有 SvgBonePetRenderer 一致）。

---

## 四、实现要点

1. **选择器**：用 `container.querySelector('[id="头"]')` 等形式，避免 ID 含空格或中文时的转义问题；根节点用 `'[id="和尚 (1) 1"]'`。
2. **fromTo**：所有循环关键 pose 使用 `gsap.fromTo(el, { ...from }, { ...to })`，避免 to() 累积漂移。
3. **svgOrigin**：每个可旋转/缩放的部件统一设 `svgOrigin: 'x y'`，与上述原点表一致。
4. **无障碍**：若后续接入 `prefers-reduced-motion`，build*Timeline 接收 `reducedMotion`，为 true 时仅极弱呼吸或暂停动画。
5. **功德粒子**：敲击节奏与现有 MeritParticles 间隔一致（idle 2100ms、working 420ms），无需改粒子逻辑，仅确保 timeline 周期与之一致即可。

---

## 五、与现有 monk-bone 的差异

| 项目       | monk-bone.svg      | monk-3.svg        |
|------------|--------------------|-------------------|
| 分组 ID    | head, body, left arm, righ arm, Wooden stick, Wooden Fish, monk 1 | 头, 袈裟, 木鱼, 木棍, 右臂, 左臂, 和尚 (1) 1 |
| 右臂       | righ arm           | 右臂（第二处袈裟/袖） |
| 木鱼内 body | 无                 | 有 body 子组（为木鱼造型，不参与躯干动画） |

实现时在 SvgBonePetRenderer 中按 `src` 或 rig 类型分支：使用 monk-3 时用上述中文 ID 选择器与对应原点，其余逻辑（idle/working/offline、灰化、粒子间隔）与现有一致。

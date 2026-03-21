# OpenClaw Pets Widget 测试教程

这份教程按真实使用路径来写：先验证代码质量，再启动桌面挂件，然后连接另一台电脑上已经常驻运行的 OpenClaw。

## 1. 环境准备

在仓库根目录执行：

```bash
pnpm install
```

如果本机还没有 `pnpm`，先执行：

```bash
corepack enable
corepack prepare pnpm@10.0.0 --activate
```

## 2. 自动验证

先跑这三条：

```bash
pnpm lint
pnpm test
pnpm --filter @openclaw-habitat/macos-shell exec playwright test
```

预期结果：

- `pnpm lint` 全部通过
- `pnpm test` 全部通过
- Playwright 显示 `1 passed`

说明：

- Playwright 用的是仓库里的 mock gateway
- 它会走新的 SSH-first 表单，但不会真的起 SSH 隧道
- 不需要你准备真实远程 OpenClaw

## 3. 启动桌面挂件

执行：

```bash
pnpm dev:desktop
```

预期结果：

- 桌面上出现一个透明的宠物挂件
- 它是置顶、无边框的小窗口
- 点击宠物后，会在旁边弹出控制面板

如果你只想看 renderer 页面，也可以单独执行：

```bash
pnpm dev
```

但这不是主要使用方式；真正要测的是 `pnpm dev:desktop`。

## 4. 连接远程 OpenClaw

你的远程机器要满足这几个前提：

- 远程机器已经常驻运行 OpenClaw Gateway
- 你本机可以正常 SSH 到那台机器
- 你手里有 Gateway token

在桌宠面板里按下面顺序填：

1. 点击 `Connect Remote`
2. `Remote Host` 填远程机器地址
3. `SSH User` 填登录用户名
4. `SSH Port` 默认 `22`
5. `Identity File` 可留空
6. `Gateway Port` 默认填远程 Gateway 端口，一般是 `18789`
7. `Gateway Token` 填真实 token
8. 点击 `Connect`

说明：

- `Identity File` 留空时，应用会复用系统 `~/.ssh/config`、默认 key 和 `ssh-agent`
- 你不需要自己手动执行 `ssh -L ...`
- 如果连接失败，应用只会显示失败，不会帮你在远程机器上启动 OpenClaw

连接成功后，你应该看到：

- 顶部状态变成 `Connected`
- 面板里出现 agent/pet
- 选中 pet 后可以发消息，看到最近结果卡片

## 5. 建议你实际手测的顺序

1. 先跑 `pnpm lint`
2. 再跑 `pnpm test`
3. 再跑 `pnpm --filter @openclaw-habitat/macos-shell exec playwright test`
4. 启动 `pnpm dev:desktop`
5. 双击桌宠，确认面板会展开
6. 拖动桌宠，确认松手后会吸附到屏幕边缘
7. 填远程 SSH 信息连接真实 OpenClaw
8. 发一条消息，确认结果卡片更新

## 6. 常见问题

### 状态一直是 `Offline`

优先检查：

- 终端里直接执行 `ssh user@host` 是否能登录
- 远程 OpenClaw Gateway 是否真的在目标端口监听
- `Gateway Token` 是否正确

### 连接时报 SSH 相关错误

优先检查：

- 你的系统 SSH 配置是否正确
- `ssh-agent` 是否已经加载对应 key
- 如果系统配置不生效，再显式填写 `Identity File`

### 连接时报认证失败

一般是 `Gateway Token` 无效或过期。

### E2E 失败

优先重试：

```bash
pnpm --filter @openclaw-habitat/macos-shell exec playwright test
```

如果还失败，再看：

- `apps/macos-shell/test-results/`
- Playwright 输出里的 `error-context.md`

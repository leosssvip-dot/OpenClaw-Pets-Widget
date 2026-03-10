# OpenClaw Habitat 测试教程

这份教程分两部分：

- 自动验证：确认 lint、单元测试、组件测试、E2E 都能通过
- 手动验证：你自己打开页面，按步骤点一遍主要流程

## 1. 环境准备

在仓库根目录执行：

```bash
corepack enable
corepack prepare pnpm@10.0.0 --activate
pnpm install
```

如果你已经装好了 `pnpm`，可以直接执行：

```bash
pnpm install
```

## 2. 自动验证

### 2.1 运行类型检查和 lint

```bash
pnpm lint
```

预期结果：

- `packages/domain lint: Done`
- `packages/bridge lint: Done`
- `apps/macos-shell lint: Done`

### 2.2 运行单元测试和组件测试

```bash
pnpm test
```

预期结果：

- `packages/domain test` 通过
- `packages/bridge test` 通过
- `apps/macos-shell test` 通过
- 总体没有 failed test

### 2.3 运行端到端测试

```bash
pnpm --filter @openclaw-habitat/macos-shell exec playwright test
```

预期结果：

- `1 passed`
- 用例名为 `connects to a mock gateway and sends a quick message`

说明：

- 这条命令会自动拉起 Vite 页面
- 也会自动启动仓库里的 mock gateway
- 不需要你额外准备真实 OpenClaw Gateway

## 3. 手动验证

手动验证分两种方式。

### 方式 A：先做自动验证，再看页面

先执行：

```bash
pnpm --filter @openclaw-habitat/macos-shell exec playwright test
```

确认自动流程通过后，再本地启动页面：

```bash
pnpm dev
```

打开浏览器访问：

```text
http://127.0.0.1:5173
```

这一步只适合检查静态界面、布局、样式，不会自动连上真实 Gateway。

你应该能看到：

- 页面标题 `Agent Habitat`
- 顶部连接状态徽标
- `Gateways` 区块
- `Bindings` 区块
- 没连接前显示 `No pets connected`

### 方式 B：连接真实 Gateway 做手工联调

如果你本地或远程已经有可用的 OpenClaw Gateway，可以手工联调。

先启动页面：

```bash
pnpm dev
```

浏览器打开：

```text
http://127.0.0.1:5173
```

然后按下面步骤操作：

1. 点击 `Add Gateway`
2. 在 `Gateway URL` 输入你的 Gateway 地址
3. 点击 `Connect`
4. 观察顶部状态是否变成 `Connected`
5. 确认页面出现 pet 卡片
6. 点击一个 pet
7. 在 `Message` 输入框里输入一条消息
8. 点击 `Send`
9. 观察 pet 气泡和结果卡片是否更新

建议你优先使用下面这种 URL 形式：

- 本地网关：`http://127.0.0.1:4318`
- 远程网关经 SSH 隧道转发后：`http://127.0.0.1:4318`

如果你的 Gateway 需要 token，可以先设置：

```bash
cp .env.example .env
```

然后把 `.env` 里的值改成真实 token：

```bash
VITE_OPENCLAW_GATEWAY_TOKEN=your-real-token
```

再重新启动：

```bash
pnpm dev
```

## 4. 你这次测试时建议重点看什么

建议你按下面顺序检查：

1. `pnpm lint`
2. `pnpm test`
3. `pnpm --filter @openclaw-habitat/macos-shell exec playwright test`
4. `pnpm dev` 后打开页面看 UI
5. 如果你有真实 Gateway，再做手工连接测试

## 5. 常见问题

### `pnpm: command not found`

执行：

```bash
corepack enable
corepack prepare pnpm@10.0.0 --activate
```

### 页面能打开，但一直是 `Offline`

优先检查：

- Gateway URL 是否可达
- 端口是否正确
- token 是否正确
- 是否需要先做 SSH 隧道转发

### 出现 `Auth expired`

说明 token 无效或过期。更新 `.env` 里的 `VITE_OPENCLAW_GATEWAY_TOKEN` 后重启页面再试。

### E2E 失败

优先重试：

```bash
pnpm --filter @openclaw-habitat/macos-shell exec playwright test
```

如果还是失败，再看：

- `apps/macos-shell/test-results/`
- Playwright 输出里的 `error-context.md`

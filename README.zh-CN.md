# OpenClaw Pets Widget

[English](./README.md) | [简体中文](./README.zh-CN.md)

OpenClaw Pets Widget 是 OpenClaw agents 的桌面宠物挂件。它会以一个悬浮桌宠的形式运行，点击后打开控制面板，并连接本机或通过 SSH 连接远程的 OpenClaw Gateway。

桌宠使用 Rive 动画，支持多个 agent persona，并通过 Electron IPC 保持面板与宠物窗口同步。

## 特性

- 悬浮桌宠，以及独立的聊天和设置面板
- 内置基于 Rive 的桌宠动画
- 支持为每个 agent 选择角色和自定义头像
- 支持本地 Gateway 模式和通过 SSH 的远程 Gateway 模式
- 基于 Electron 的桌面应用，支持 macOS 和 Windows 打包

## 平台支持

- macOS
- Windows

当前还没有 Linux 的打包产物或文档。

## 环境要求

- Node.js 20+
- pnpm 10+
- 一个可访问的 OpenClaw Gateway

如果要连接远程 Gateway，还需要：

- 目标机器的 SSH 访问权限
- 一个有效的 Gateway token

## 快速开始

在仓库根目录执行：

```bash
pnpm install
pnpm dev:desktop
```

常用工作区命令：

```bash
pnpm dev
pnpm build
pnpm test
pnpm lint
```

## 连接 Gateway

应用支持两种连接模式：

1. 本地 Gateway
   当 OpenClaw Gateway 运行在当前机器时使用。
2. 通过 SSH 连接远程 Gateway
   当 Gateway 运行在另一台机器上，并由桌面应用为你建立隧道时使用。

远程连接前检查：

- 远程机器已经运行 OpenClaw Gateway
- 你的机器可以通过现有 SSH 配置连接到该主机
- 你已经拿到该 Gateway 实例的 token

如果你的 Gateway 部署在家里的本地网络中，而你人又在外面，通常无法直接通过 SSH 连回这台机器，除非这台机器已经能从外部网络访问。这种情况下，需要先通过 Tailscale 这类安全的远程网络方案，让家里的机器可以被 SSH 访问，然后在应用里使用它的 Tailscale IP 或主机名进行连接。

在应用中：

1. 使用 `pnpm dev:desktop` 启动桌面应用
2. 从桌宠打开控制面板
3. 进入 `Settings`
4. 添加本地或 SSH Gateway 配置
5. 连接并等待 agent 列表出现

### Gateway 认证说明

由于 `openclaw 2026.3.13` 的一个已知 bug，在桌面应用无法正常连接时，你可能需要为 Control UI 打开 insecure auth。

更新 Gateway 配置：

```json
{
  "gateway": {
    "controlUi": {
      "allowInsecureAuth": true
    }
  }
}
```

或者使用 CLI：

```bash
# 设置配置项
openclaw config set gateway.controlUi.allowInsecureAuth true --json

# 查看当前值
openclaw config get gateway.controlUi.allowInsecureAuth

# 重启 gateway
openclaw gateway restart
```

如果你需要查找 Gateway token，可以查看以下位置：

1. `~/.openclaw/openclaw.json`
   查找 `gateway.auth.token`。OpenClaw Gateway 默认使用 `gateway.auth.token` 或环境变量 `OPENCLAW_GATEWAY_TOKEN` 进行认证。
2. `~/.openclaw/.env`
   查找 `OPENCLAW_GATEWAY_TOKEN`，例如：

```bash
cat ~/.openclaw/.env | grep OPENCLAW_GATEWAY_TOKEN
```

## 开发

当前生效的桌面应用位于 [`apps/macos-shell`](./apps/macos-shell)。

在该目录下常用的命令：

```bash
pnpm dev:desktop
pnpm start:desktop
pnpm pack
pnpm dist:mac
pnpm dist:win
```

更多文档：

- [测试指南](./docs/testing-guide.md)
- [桌宠动画导入指南](./docs/pet-animation-import-guide.md)

## 项目结构

```text
apps/macos-shell/     Electron shell、renderer、桌宠 UI、打包
packages/bridge/      Bridge client 和 OpenClaw gateway 集成
packages/domain/      共享领域类型与逻辑
docs/                 测试说明、设计文档、动画导入说明
```

## 自定义桌宠资源

- 内置桌宠使用 [`apps/macos-shell/public/assets/pets`](./apps/macos-shell/public/assets/pets) 下的 `.riv` 文件
- 面板中也支持以下格式的自定义静态图片：
  - `https://...`
  - `file:///absolute/path/to/file.png`
  - `data:image/...`

支持的自定义图片格式：

- PNG
- JPG / JPEG
- WEBP
- GIF
- SVG

## 测试

在仓库根目录执行：

```bash
pnpm test
```

针对应用的检查命令：

```bash
pnpm --filter @openclaw-habitat/macos-shell test
pnpm --filter @openclaw-habitat/macos-shell lint
pnpm --filter @openclaw-habitat/macos-shell build
```

## 当前状态

项目仍在持续演进中。核心桌面流程已经可用，但 UI、打包流程和动画工作流仍在持续打磨。

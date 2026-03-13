# Chat Panel 分阶段实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将发消息能力抽离为独立聊天界面，包含消息列表、历史展示、OpenClaw 兼容命令，分三阶段实现。

**Architecture:** 在现有 unified panel 内，用 ChatPanel 替换 QuickComposer + ResultCard 区域。消息列表由前端 session 内存累积（user + assistant），Phase 2 视 Gateway API 情况接入 chat.history。Slash 命令由 Gateway 解析，前端原样透传 chat.send。

**Tech Stack:** React, Zustand, 现有 bridge (chat.send / chat.message 事件)

---

## 设计假设（已确认）

| 问题 | 假设 |
|------|------|
| 聊天界面位置 | 替换 QuickComposer + ResultCard，集成在 unified panel 内 |
| 会话模型 | 单会话（当前 pinned companion） |
| 历史消息 | Phase 1：仅当前会话内存累积；Phase 2：若 Gateway 有 chat.history 则接入 |
| 命令解析 | Gateway 解析，前端原样透传 chat.send |

---

## Phase 1: 基础聊天 UI

### Task 1.1: 定义 ChatMessage 类型与 chatStore

**Files:**
- Create: `apps/macos-shell/src/features/chat/types.ts`
- Create: `apps/macos-shell/src/features/chat/store.ts`

**Step 1: 定义类型**

```ts
// apps/macos-shell/src/features/chat/types.ts
export type ChatMessageRole = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  role: ChatMessageRole;
  content: string;
  timestamp: number;
}
```

**Step 2: 创建 chatStore**

```ts
// apps/macos-shell/src/features/chat/store.ts
import { createStore } from 'zustand/vanilla';
import type { ChatMessage } from './types';

export interface ChatState {
  messages: ChatMessage[];
  addUserMessage: (content: string) => void;
  addAssistantMessage: (content: string, final?: boolean) => void;
  clearMessages: () => void;
}

let messageId = 0;
function nextId() {
  return `msg-${Date.now()}-${++messageId}`;
}

export const createChatStore = () =>
  createStore<ChatState>((set) => ({
    messages: [],
    addUserMessage: (content) =>
      set((s) => ({
        messages: [
          ...s.messages,
          { id: nextId(), role: 'user', content, timestamp: Date.now() }
        ]
      })),
    addAssistantMessage: (content, final = true) =>
      set((s) => {
        const last = s.messages[s.messages.length - 1];
        if (last?.role === 'assistant' && !final) {
          return {
            messages: [
              ...s.messages.slice(0, -1),
              { ...last, content }
            ]
          };
        }
        return {
          messages: [
            ...s.messages,
            { id: nextId(), role: 'assistant', content, timestamp: Date.now() }
          ]
        };
      }),
    clearMessages: () => set({ messages: [] })
  }));
```

**Step 3: 导出 chatStore 单例**

```ts
export const chatStore = createChatStore();
```

**Step 4: Commit**

```bash
git add apps/macos-shell/src/features/chat/types.ts apps/macos-shell/src/features/chat/store.ts
git commit -m "feat(chat): add ChatMessage types and chatStore"
```

---

### Task 1.2: 创建 ChatMessageList 组件

**Files:**
- Create: `apps/macos-shell/src/features/chat/ChatMessageList.tsx`
- Modify: `apps/macos-shell/src/styles.css` (添加 chat 相关样式)

**Step 1: 实现 ChatMessageList**

```tsx
// apps/macos-shell/src/features/chat/ChatMessageList.tsx
import type { ChatMessage } from './types';

export function ChatMessageList({ messages }: { messages: ChatMessage[] }) {
  if (messages.length === 0) {
    return (
      <div className="chat-message-list chat-message-list--empty" aria-label="Chat messages">
        <p className="chat-message-list__empty">No messages yet. Send a message to start.</p>
      </div>
    );
  }

  return (
    <ul className="chat-message-list" aria-label="Chat messages">
      {messages.map((m) => (
        <li
          key={m.id}
          className={`chat-message chat-message--${m.role}`}
          data-testid={`chat-msg-${m.role}`}
        >
          <span className="chat-message__role" aria-hidden="true">
            {m.role === 'user' ? 'You' : 'Assistant'}
          </span>
          <p className="chat-message__content">{m.content}</p>
        </li>
      ))}
    </ul>
  );
}
```

**Step 2: 添加样式**

在 `apps/macos-shell/src/styles.css` 末尾添加：

```css
/* Chat panel */
.chat-message-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 240px;
  overflow-y: auto;
}

.chat-message-list--empty {
  min-height: 80px;
  align-items: center;
  justify-content: center;
}

.chat-message-list__empty {
  color: var(--color-text-muted, #666);
  font-size: 13px;
  margin: 0;
}

.chat-message {
  padding: 10px 12px;
  border-radius: 10px;
  background: var(--color-surface-alt, #f5f5f5);
}

.chat-message--user {
  align-self: flex-end;
  max-width: 85%;
  background: var(--color-accent-subtle, #e8f0fe);
}

.chat-message--assistant {
  align-self: flex-start;
  max-width: 90%;
}

.chat-message__role {
  display: block;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
  color: var(--color-text-muted, #666);
}

.chat-message__content {
  margin: 0;
  font-size: 14px;
  line-height: 1.45;
  white-space: pre-wrap;
  word-break: break-word;
}
```

**Step 3: Commit**

```bash
git add apps/macos-shell/src/features/chat/ChatMessageList.tsx apps/macos-shell/src/styles.css
git commit -m "feat(chat): add ChatMessageList component"
```

---

### Task 1.3: 创建 ChatInput 组件

**Files:**
- Create: `apps/macos-shell/src/features/chat/ChatInput.tsx`

**Step 1: 实现 ChatInput**

```tsx
// apps/macos-shell/src/features/chat/ChatInput.tsx
import { useState } from 'react';

export function ChatInput({
  placeholder = 'Message...',
  disabled = false,
  onSubmit
}: {
  placeholder?: string;
  disabled?: boolean;
  onSubmit: (text: string) => void | Promise<void>;
}) {
  const [value, setValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = value.trim();
    if (!text || disabled) return;
    void onSubmit(text);
    setValue('');
  };

  return (
    <form className="chat-input" onSubmit={handleSubmit}>
      <textarea
        className="chat-input__field"
        aria-label="Message"
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={disabled}
        rows={2}
      />
      <button type="submit" className="chat-input__submit" disabled={disabled || !value.trim()}>
        Send
      </button>
    </form>
  );
}
```

**Step 2: 添加 chat-input 样式**

```css
.chat-input {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.chat-input__field {
  width: 100%;
  min-height: 60px;
  padding: 10px 12px;
  border: 1px solid var(--color-border, #ddd);
  border-radius: 8px;
  font-size: 14px;
  resize: vertical;
}

.chat-input__field:focus {
  outline: 2px solid var(--color-accent, #1a73e8);
  outline-offset: 2px;
}

.chat-input__submit {
  align-self: flex-end;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  border-radius: 8px;
  background: var(--color-accent, #1a73e8);
  color: white;
  border: none;
  cursor: pointer;
}

.chat-input__submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

**Step 3: Commit**

```bash
git add apps/macos-shell/src/features/chat/ChatInput.tsx apps/macos-shell/src/styles.css
git commit -m "feat(chat): add ChatInput component"
```

---

### Task 1.4: 创建 ChatPanel 并接入 store / 事件

**Files:**
- Create: `apps/macos-shell/src/features/chat/ChatPanel.tsx`
- Modify: `apps/macos-shell/src/features/chat/store.ts` (支持按 petId 隔离，可选)
- Modify: `apps/macos-shell/src/features/widget/WidgetPanel.tsx`
- Modify: `apps/macos-shell/src/App.tsx` (订阅 chat.message 并写入 chatStore)

**Step 1: 实现 ChatPanel**

```tsx
// apps/macos-shell/src/features/chat/ChatPanel.tsx
import { useStore } from 'zustand';
import { chatStore } from './store';
import { ChatMessageList } from './ChatMessageList';
import { ChatInput } from './ChatInput';

export function ChatPanel({
  petName,
  placeholder,
  disabled,
  onSubmit
}: {
  petName: string;
  placeholder?: string;
  disabled?: boolean;
  onSubmit: (text: string) => void | Promise<void>;
}) {
  const messages = useStore(chatStore, (s) => s.messages);
  const addUserMessage = useStore(chatStore, (s) => s.addUserMessage);

  const handleSubmit = async (text: string) => {
    addUserMessage(text);
    await onSubmit(text);
  };

  return (
    <section className="chat-panel" aria-label={`Chat with ${petName}`}>
      <ChatMessageList messages={messages} />
      <ChatInput
        placeholder={placeholder ?? `Message ${petName}...`}
        disabled={disabled}
        onSubmit={handleSubmit}
      />
    </section>
  );
}
```

**Step 2: 在 App 中订阅 chat.message 并写入 chatStore**

在 `App.tsx` 中，找到 `subscribe` 的调用处，在 `applyEvent` 之后增加对 `chat.message` 的 chatStore 写入：

```ts
// 在 applyEvent 之后
if (event.kind === 'chat.message' && event.petId) {
  chatStore.getState().addAssistantMessage(event.text, event.final);
}
```

**Step 3: 替换 WidgetPanel 中的 QuickComposer + ResultCard**

将 `QuickComposer` 和 `ResultCard` 替换为 `ChatPanel`，传入 `onSubmitQuickPrompt` 作为 `onSubmit`。

**Step 4: 在发送前 addUserMessage**

ChatPanel 的 handleSubmit 已调用 addUserMessage，无需在 App 层重复。

**Step 5: 切换 companion 时清空消息（可选）**

在 `App.tsx` 或 `WidgetPanel` 中，当 `pinnedAgentId` 变化时调用 `chatStore.getState().clearMessages()`。若希望保留多 companion 各自历史，则需扩展 store 支持 `petId -> messages`，Phase 1 可简化为单会话清空。

**Step 6: Commit**

```bash
git add apps/macos-shell/src/features/chat/ChatPanel.tsx apps/macos-shell/src/App.tsx apps/macos-shell/src/features/widget/WidgetPanel.tsx
git commit -m "feat(chat): integrate ChatPanel, wire chat.message to chatStore"
```

---

### Task 1.5: 流式更新 assistant 消息

**Files:**
- Modify: `apps/macos-shell/src/features/chat/store.ts`
- Modify: `apps/macos-shell/src/App.tsx` (或 bridge 订阅处)

**Step 1: 确认 chat.message 的 final 语义**

`chat.message` 事件中 `final: false` 表示流式中间 chunk，`final: true` 表示完成。store 的 `addAssistantMessage(content, final)` 已支持：当最后一条是 assistant 且 `final=false` 时更新该条，否则追加新消息。

**Step 2: 验证 openclaw-event-parser 传递 final**

检查 `parseOpenClawEvent` 对 `chat` 事件的解析是否包含 `final` 字段，若无则补充。

**Step 3: 运行测试**

```bash
pnpm test --filter=macos-shell
```

**Step 4: Commit**

```bash
git add apps/macos-shell/src/features/chat/store.ts packages/bridge/src/openclaw-event-parser.ts
git commit -m "fix(chat): support streaming assistant messages (final flag)"
```

---

## Phase 2: 历史消息

### Task 2.1: 调研 Gateway chat.history API

**Files:**
- Modify: `docs/research/openclaw-bridge-contract.md` (记录调研结果)

**Step 1: 查阅 Gateway 协议**

检查 OpenClaw Gateway 是否提供 `chat.history` 或类似方法，用于拉取会话历史。若无，则 Phase 2 采用「本地持久化」方案。

**Step 2: 若存在 chat.history**

- 在 `BridgeClient` 中新增 `getChatHistory(sessionKey, options?)` 方法
- 在 `OpenClawClient` 中实现对应请求
- ChatPanel 挂载时调用并填充 chatStore

**Step 3: 若不存在**

- 使用 `localStorage` 或 IndexedDB 按 `sessionKey` 持久化 messages
- 连接建立后从本地恢复

**Step 4: 更新计划文档**

在 `docs/plans/2026-03-12-chat-panel-implementation.md` 的 Phase 2 部分记录最终方案。

---

### Task 2.2: 实现历史加载（按 Task 2.1 结论）

**Files:**
- 按 Task 2.1 结论修改 bridge / store / ChatPanel

**Step 1–4: 按选定方案实现**

（具体步骤依赖 Task 2.1 结论，此处略）

---

## Phase 3: OpenClaw 兼容命令

### Task 3.1: 命令透传与 UI 提示

**Goal:** Gateway 已通过 `chat.send` 解析 slash 命令，前端只需透传。增加输入框占位符或帮助文案，提示用户可使用 `/help` 等命令。

**Files:**
- Modify: `apps/macos-shell/src/features/chat/ChatInput.tsx`
- Modify: `apps/macos-shell/src/features/chat/ChatPanel.tsx`

**Step 1: 更新 placeholder**

```ts
placeholder="Message or /help, /status, /commands..."
```

**Step 2: 可选：添加命令提示**

在 ChatPanel 或 ChatInput 下方添加一行小字：`Tip: Use /help for commands.`

**Step 3: 验证**

发送 `/help`，确认 Gateway 返回帮助内容，且 ChatPanel 正确展示。

**Step 4: Commit**

```bash
git add apps/macos-shell/src/features/chat/ChatInput.tsx apps/macos-shell/src/features/chat/ChatPanel.tsx
git commit -m "feat(chat): add slash command hint in placeholder"
```

---

## 验收标准

- [x] Phase 1: 用户可在 ChatPanel 输入、发送消息，消息列表展示 user + assistant，支持流式更新 (2026-03-12 完成)
- [x] Phase 2: 历史消息可加载（本地 localStorage，按 profileId:agentId 持久化，最多 100 条）(2026-03-12 完成)
- [x] Phase 3: 用户可发送 `/help` 等命令，Gateway 解析并返回，placeholder 提示 `/help`、`/status` (2026-03-12 完成)

---

## 依赖与风险

- **chat.message 事件格式**: 依赖 `openclaw-event-parser` 正确解析 Gateway 的 `chat` 事件，需确认 `final` 字段
- **chat.history**: 若 Gateway 无此 API，Phase 2 仅能做本地持久化，无法跨设备同步

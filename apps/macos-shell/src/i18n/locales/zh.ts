const zh: Record<string, string> = {
  // WidgetPanel tabs & empty state
  'tab.chat': '聊天',
  'tab.gallery': '宠物',
  'tab.settings': '设置',
  'empty.noCompanion': '还没有宠物上场',
  'empty.noCompanionHint': '从宠物列表中选择一个，或先连接网关。',
  'empty.browseGallery': '浏览宠物',
  'empty.connectGateway': '连接网关',

  // ChatInput
  'cmd.help': '显示可用命令',
  'cmd.status': '检查连接状态',
  'cmd.new': '开始新会话',
  'cmd.models': '列出可用的提供商和模型',
  'cmd.think': '设置推理深度',
  'cmd.verbose': '设置回复详细程度',
  'cmd.compact': '压缩对话上下文',
  'cmd.reset': '重置当前会话',
  'cmd.stop': '停止当前生成',
  'chat.send': '发送',
  'chat.imageHint': '图片将作为附件发送给 AI 模型。',
  'chat.placeholder': '输入消息...',

  // ChatMessageList
  'chat.you': '你',
  'chat.emptyMessages': '还没有消息，发送一条消息开始对话。',
  'chat.scrollToLatest': '滚动到最新消息',

  // SettingsPanel
  'settings.title': '系统设置',
  'settings.subtitle': '网关连接',
  'settings.language': '语言',

  // GatewayProfiles
  'gateway.heading': '连接与网关',
  'gateway.description': '已保存的链接和网关配置。',
  'gateway.addGateway': '添加网关',
  'gateway.connecting': '连接中...',
  'gateway.cancel': '取消',
  'gateway.sshTunnel': 'SSH 隧道',
  'gateway.local': '本地',
  'gateway.connect': '连接',
  'gateway.edit': '编辑',
  'gateway.delete': '删除',
  'gateway.confirm': '确认',
  'gateway.save': '保存',

  // SshConnectionForm
  'ssh.remoteHost': '远程主机',
  'ssh.sshUser': 'SSH 用户名',
  'ssh.sshPort': 'SSH 端口',
  'ssh.sshPassword': 'SSH 密码',
  'ssh.gatewayPort': '网关端口',
  'ssh.gatewayToken': '网关令牌',
  'ssh.hint': '使用系统 SSH 配置和已加载的密钥。密码会安全缓存以便重连。',
  'local.hint': '直接连接到本机运行的 OpenClaw 网关 ws://127.0.0.1:{port}。',

  // ConnectionBadge
  'status.connecting': '连接中',
  'status.connected': '已连接',
  'status.reconnecting': '重连中',
  'status.offline': '离线',
  'status.authExpired': '认证过期',

  // ReconnectBanner
  'reconnect.authExpired': '网关认证已过期，请使用新凭据重新连接。',
  'reconnect.offline': '网关连接不可用，重试以恢复实时代理更新。',
  'reconnect.retry': '重试',

  // GalleryPanel
  'gallery.title': '宠物',
  'gallery.subtitle': '你的桌面小宠物',
  'gallery.noCompanions': '暂无可用宠物',
  'gallery.noCompanionsHint': '请先连接网关以加载可用的宠物。',
  'gallery.unpin': '取消置顶',
  'gallery.pin': '置顶到桌面',

  // DesktopPet
  'pet.idle': '空闲 — 等待任务',
  'pet.thinking': '思考中...',
  'pet.working': '工作中...',
  'pet.waiting': '等待输入...',
  'pet.done': '任务完成！',
  'pet.blocked': '出了点问题',
  'pet.contextSendMessage': '发送消息',
  'pet.contextSettings': '设置',
  'pet.tooltip': '拖动移动，单击聊天，双击打开面板，右键菜单。',

  // Pet role packs
  'role.lobster.label': '程序蟹',
  'role.lobster.roleLabel': '编码',
  'role.lobster.tagline': '耳机戴好，键盘就绪，已锁定 Bug。',
  'role.lobster.promptHint': '请求修复、重构或实现补丁。',
  'role.lobster.panelTitle': '你的编码宠物已就位。',
  'role.lobster.panelDescription': '这个角色专注于编码、修补和修复。',
  'role.lobster.signalLabel': '修 Bug 中',
  'role.lobster.quickPromptExample': '请修复、重构或打补丁...',

  'role.cat.label': '规划猫',
  'role.cat.roleLabel': '规划',
  'role.cat.tagline': '便签摊开，优先级排好，下一步已就绪。',
  'role.cat.promptHint': '请求分解、计划或任务排序。',
  'role.cat.panelTitle': '你的规划宠物已理清头绪。',
  'role.cat.panelDescription': '这个角色把模糊的需求变成清晰的任务卡、步骤和优先级。',
  'role.cat.signalLabel': '梳理任务',
  'role.cat.quickPromptExample': '规划任务、设置优先级...',

  'role.robot.label': '运维机器人',
  'role.robot.roleLabel': '运维',
  'role.robot.tagline': '信号正常，灯塔在线，运行时监控中。',
  'role.robot.promptHint': '请求状态检查、重连或运行时诊断。',
  'role.robot.panelTitle': '你的运维宠物正在监控运行状态。',
  'role.robot.panelDescription': '这个角色保持桥接稳定、呈现连接健康状况、及早发现系统偏移。',
  'role.robot.signalLabel': '监控中',
  'role.robot.quickPromptExample': '检查状态、诊断问题...',

  'role.monk.label': '木鱼僧',
  'role.monk.roleLabel': '专注',
  'role.monk.tagline': '木鱼稳定，节奏锁定，执行进行中。',
  'role.monk.promptHint': '请求开始、继续或完成下一个专注动作。',
  'role.monk.panelTitle': '你的专注宠物保持节奏推动执行。',
  'role.monk.panelDescription': '这个角色适合深度工作，聚焦下一步、保持动力、标记稳步进展。',
  'role.monk.signalLabel': '敲木鱼中',
  'role.monk.quickPromptExample': '专注于下一个任务...',
};

export default zh;

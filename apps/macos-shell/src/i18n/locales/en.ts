const en: Record<string, string> = {
  // WidgetPanel tabs & empty state
  'tab.chat': 'Chat',
  'tab.gallery': 'Gallery',
  'tab.settings': 'Settings',
  'empty.noCompanion': 'No companion on stage',
  'empty.noCompanionHint': 'Pick a companion from the Gallery, or connect a gateway first.',
  'empty.browseGallery': 'Browse Gallery',
  'empty.connectGateway': 'Connect gateway',

  // ChatInput
  'cmd.help': 'Show available commands',
  'cmd.status': 'Check connection status',
  'cmd.new': 'Start a new session',
  'cmd.models': 'List available providers & models',
  'cmd.think': 'Set reasoning depth',
  'cmd.verbose': 'Set response verbosity',
  'cmd.compact': 'Compact conversation context',
  'cmd.reset': 'Reset current session',
  'cmd.stop': 'Stop current generation',
  'chat.send': 'Send',
  'chat.imageHint': 'Images will be sent as attachments to the AI model.',
  'chat.placeholder': 'Message...',

  // ChatMessageList
  'chat.you': 'You',
  'chat.emptyMessages': 'No messages yet. Send a message to start.',
  'chat.scrollToLatest': 'Scroll to latest messages',

  // SettingsPanel
  'settings.title': 'System Setup',
  'settings.subtitle': 'Gateway Connections',
  'settings.language': 'Language',

  // GatewayProfiles
  'gateway.heading': 'Connection & Gateways',
  'gateway.description': 'Saved links and gateway setup for this companion.',
  'gateway.addGateway': 'Add gateway',
  'gateway.connecting': 'Connecting...',
  'gateway.cancel': 'Cancel',
  'gateway.sshTunnel': 'SSH Tunnel',
  'gateway.local': 'Local',
  'gateway.connect': 'Connect',
  'gateway.edit': 'Edit',
  'gateway.delete': 'Delete',
  'gateway.confirm': 'Confirm',
  'gateway.save': 'Save',

  // SshConnectionForm
  'ssh.remoteHost': 'Remote Host',
  'ssh.sshUser': 'SSH User',
  'ssh.sshPort': 'SSH Port',
  'ssh.sshPassword': 'SSH Password',
  'ssh.gatewayPort': 'Gateway Port',
  'ssh.gatewayToken': 'Gateway Token',
  'ssh.hint': 'Uses your system SSH config and loaded keys. Password is securely cached for reconnects.',
  'local.hint': 'Connects directly to an OpenClaw gateway running on this machine at ws://127.0.0.1:{port}.',

  // ConnectionBadge
  'status.connecting': 'Connecting',
  'status.connected': 'Connected',
  'status.reconnecting': 'Reconnecting',
  'status.offline': 'Offline',
  'status.authExpired': 'Auth expired',

  // ReconnectBanner
  'reconnect.authExpired': 'Gateway authentication expired. Reconnect with fresh credentials.',
  'reconnect.offline': 'Gateway link is unavailable. Retry to restore live agent updates.',
  'reconnect.retry': 'Retry',

  // GalleryPanel
  'gallery.title': 'Companions',
  'gallery.subtitle': 'Your lovely desktop pets',
  'gallery.noCompanions': 'No companions available',
  'gallery.noCompanionsHint': 'Connect to a gateway first to load your available companions.',
  'gallery.unpin': 'Unpin companion',
  'gallery.pin': 'Pin companion to stage',

  // DesktopPet
  'pet.idle': 'Idle — ready for a task',
  'pet.thinking': 'Thinking...',
  'pet.working': 'Working on it...',
  'pet.waiting': 'Waiting for input...',
  'pet.done': 'Task complete!',
  'pet.blocked': 'Something went wrong',
  'pet.contextSendMessage': 'Send Message',
  'pet.contextSettings': 'Settings',
  'pet.tooltip': 'Drag to move. Click to chat. Double-click to open panel. Right-click for menu.',

  // Pet role packs
  'role.lobster.label': 'Coder Claw',
  'role.lobster.roleLabel': 'Code',
  'role.lobster.tagline': 'Headset on, keyboard ready, bug already spotted.',
  'role.lobster.promptHint': 'Ask for a fix, refactor, or implementation patch.',
  'role.lobster.panelTitle': 'Your coding pet is already at the keyboard.',
  'role.lobster.panelDescription': 'Every main-panel variant should read like a clear work role first. This one is here to code, patch, and fix.',
  'role.lobster.signalLabel': 'typing bugfix',
  'role.lobster.quickPromptExample': 'Ask to fix, refactor, or patch...',

  'role.cat.label': 'Planner Cat',
  'role.cat.roleLabel': 'Plan',
  'role.cat.tagline': 'Sticky notes out, priorities sorted, next step in sight.',
  'role.cat.promptHint': 'Ask for a breakdown, plan, or task ordering.',
  'role.cat.panelTitle': 'Your planning pet already sorted the next three moves.',
  'role.cat.panelDescription': 'This character turns fuzzy asks into clear task cards, scoped steps, and visible priority decisions.',
  'role.cat.signalLabel': 'task mapping',
  'role.cat.quickPromptExample': 'Plan tasks, set priorities...',

  'role.robot.label': 'Ops Bot',
  'role.robot.roleLabel': 'Ops',
  'role.robot.tagline': 'Signals clean, beacon live, runtime under watch.',
  'role.robot.promptHint': 'Ask for a status check, reconnect, or runtime diagnosis.',
  'role.robot.panelTitle': 'Your ops pet is watching the runtime for you.',
  'role.robot.panelDescription': 'This character exists to keep the bridge stable, surface connection health, and catch system drift early.',
  'role.robot.signalLabel': 'runtime watch',
  'role.robot.quickPromptExample': 'Check status, diagnose issues...',

  'role.monk.label': 'Mokugyo Monk',
  'role.monk.roleLabel': 'Focus',
  'role.monk.tagline': 'Wooden fish steady, rhythm locked, execution underway.',
  'role.monk.promptHint': 'Ask to start, continue, or finish the next focused action.',
  'role.monk.panelTitle': 'Your focus pet keeps the rhythm and pushes execution forward.',
  'role.monk.panelDescription': 'This character is for deep work. It narrows the next action, keeps momentum, and marks steady progress.',
  'role.monk.signalLabel': 'working-time tapping',
  'role.monk.quickPromptExample': 'Focus on the next task...',
};

export default en;

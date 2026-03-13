/**
 * Parse assistant messages for inline action buttons (Telegram-style).
 *
 * Supports two response formats:
 *
 * Format 1 – bullet list with "Use:" hint:
 *   Providers:
 *   - anthropic (2)
 *   - bailian (8)
 *   Use: /models <provider>
 *
 * Format 2 – inline "Options:" comma list (needs triggerCommand from previous user message):
 *   Current thinking level: medium.
 *   Options: off, minimal, low, medium, high, xhigh, adaptive.
 */

export interface MessageAction {
  label: string;
  detail?: string;
  command: string;
}

/**
 * Extract inline actions from an assistant message.
 *
 * @param content       The assistant message text.
 * @param triggerCommand  The slash command from the preceding user message (e.g. "/think").
 *                        Used as template when the response has no explicit "Use:" hint.
 */
export function parseMessageActions(
  content: string,
  triggerCommand?: string | null,
): MessageAction[] {
  const lines = content.split('\n').map((l) => l.trim());

  // --- Strategy 1: bullet list + "Use:" / "Switch:" hint ---
  const listItems: { raw: string; detail?: string }[] = [];
  for (const line of lines) {
    const m = line.match(/^-\s+(\S+)(?:\s+\(([^)]*)\))?/);
    if (m) {
      listItems.push({ raw: m[1], detail: m[2] });
    }
  }

  let template = findTemplate(lines);

  if (listItems.length > 0 && template) {
    return listItems.map((item) => ({
      label: item.raw,
      detail: item.detail,
      command: `${template} ${item.raw}`,
    }));
  }

  // If we found list items but no template, try the trigger command
  if (listItems.length > 0 && triggerCommand) {
    return listItems.map((item) => ({
      label: item.raw,
      detail: item.detail,
      command: `${triggerCommand} ${item.raw}`,
    }));
  }

  // --- Strategy 2: "Options: a, b, c, d" inline comma list ---
  for (const line of lines) {
    const m = line.match(/^Options:\s*(.+)/i);
    if (m) {
      const optionValues = m[1]
        .replace(/\.$/, '') // strip trailing period
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      if (optionValues.length === 0) continue;

      // Need a command template — prefer explicit "Use:", fallback to trigger
      const cmdTemplate = template ?? triggerCommand;
      if (!cmdTemplate) continue;

      return optionValues.map((val) => ({
        label: val,
        command: `${cmdTemplate} ${val}`,
      }));
    }
  }

  return [];
}

/** Scan lines for "Use: /cmd" or "Switch: /cmd" and return the command root. */
function findTemplate(lines: string[]): string | null {
  for (const line of lines) {
    const useMatch = line.match(/^Use:\s*(\/\w+)/i);
    if (useMatch) return useMatch[1];
  }
  for (const line of lines) {
    const switchMatch = line.match(/^Switch:\s*(\/\w+)/i);
    if (switchMatch) return switchMatch[1];
  }
  return null;
}

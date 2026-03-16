/**
 * PetContextMenu — right-click context menu for the desktop pet.
 *
 * Actions:
 *   - Send message (opens panel chat tab)
 *   - Switch character
 */

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { PetRolePackId } from './pet-appearance';
import { PET_ROLE_PACKS } from './pet-appearance';

export interface PetContextMenuAction {
  id: string;
  label: string;
  icon?: string;
  disabled?: boolean;
}

interface PetContextMenuProps {
  x: number;
  y: number;
  currentRole: PetRolePackId;
  onAction: (actionId: string) => void;
  onClose: () => void;
  /** 菜单挂载后报告高度，用于窗口扩展避免裁切 */
  onMeasured?: (height: number) => void;
}

const MENU_ACTIONS: PetContextMenuAction[] = [
  { id: 'chat', label: 'Send Message' },
];

export function PetContextMenu({
  x,
  y,
  currentRole,
  onAction,
  onClose,
  onMeasured,
}: PetContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ left: x, top: y });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // 测量菜单高度并做上下翻转，避免超出视口被裁切；同时上报高度供窗口扩展
  useLayoutEffect(() => {
    const el = menuRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const padding = 8;
    const fitsBelow = rect.bottom + padding <= window.innerHeight;
    const top = fitsBelow ? y : Math.max(padding, y - rect.height);
    setPosition({ left: x, top });
    onMeasured?.(Math.ceil(rect.height) + padding);
  }, [x, y, onMeasured]);

  return (
    <div
      ref={menuRef}
      className="pet-context-menu"
      style={{ left: position.left, top: position.top }}
      role="menu"
    >
      {MENU_ACTIONS.map((action) => (
        <button
          key={action.id}
          className="pet-context-menu__item"
          role="menuitem"
          disabled={action.disabled}
          onClick={() => {
            onAction(action.id);
            onClose();
          }}
        >
          {action.label}
        </button>
      ))}
      <div className="pet-context-menu__separator" />
      <div className="pet-context-menu__group-label">Switch Character</div>
      {PET_ROLE_PACKS.map((pack) => (
        <button
          key={pack.id}
          className={`pet-context-menu__item${pack.id === currentRole ? ' pet-context-menu__item--active' : ''}`}
          role="menuitem"
          onClick={() => {
            onAction(`switch:${pack.id}`);
            onClose();
          }}
        >
          {pack.label}
          {pack.id === currentRole ? ' \u2713' : ''}
        </button>
      ))}
    </div>
  );
}

/**
 * PetContextMenu — right-click context menu for the desktop pet.
 *
 * Actions:
 *   - Send message (opens chat bubble)
 *   - Assign task
 *   - View status
 *   - Switch character
 */

import { useEffect, useRef } from 'react';
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
}

const MENU_ACTIONS: PetContextMenuAction[] = [
  { id: 'chat', label: 'Send Message' },
  { id: 'task', label: 'Assign Task' },
  { id: 'status', label: 'View Status' },
];

export function PetContextMenu({
  x,
  y,
  currentRole,
  onAction,
  onClose,
}: PetContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

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

  return (
    <div
      ref={menuRef}
      className="pet-context-menu"
      style={{ left: x, top: y }}
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

import type { HabitatEvent } from '@openclaw-habitat/bridge';
import type { PetStatus } from '@openclaw-habitat/domain';
import type { AgentSnapshot } from './agent-snapshots';

export interface HabitatPet {
  id: string;
  agentId: string;
  gatewayId: string;
  status: PetStatus;
  name?: string;
  bubbleText?: string;
}

/** 本地覆盖：发消息后立即显示 working，出错时显示 blocked，等 bridge 事件再清除 */
export type LocalPetStatusOverride = 'thinking' | 'working' | 'blocked';

/** 收到回复后 working 状态多延续一段时间（时间戳，过期前展示为 working） */
export const WORKING_EXTEND_MS = 3200;

export interface HabitatState {
  pets: Record<string, HabitatPet>;
  agentSnapshots: Record<string, AgentSnapshot>;
  /** 发送消息/出错时设的临时状态，收到该 pet 的 bridge 事件时清除 */
  localStatusByPetId: Record<string, LocalPetStatusOverride>;
  /** 在该时间戳之前对该 pet 强制展示为 working，用于延长“工作中”动画 */
  workingUntilByPetId: Record<string, number>;
  selectedPetId: string | null;
  seedPets: (pets: HabitatPet[]) => void;
  selectPet: (petId: string) => void;
  markPetAsThinking: (petId: string, content: string) => void;
  markPetAsWorking: (petId: string) => void;
  markPetAsBlocked: (petId: string, message: string) => void;
  applyEvent: (event: HabitatEvent) => void;
  clearExpiredWorkingUntil: () => void;
}

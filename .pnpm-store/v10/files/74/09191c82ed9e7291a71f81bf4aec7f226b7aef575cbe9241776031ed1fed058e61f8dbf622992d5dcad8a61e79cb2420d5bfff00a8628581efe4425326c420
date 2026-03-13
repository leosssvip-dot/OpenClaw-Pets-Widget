import { AnyActorLogic, AnyStateMachine, EventFromLogic, InputFrom, SnapshotFrom, ExecutableActionsFrom, AnyTransitionDefinition, AnyMachineSnapshot } from "./types.js";
/**
 * Given actor `logic`, a `snapshot`, and an `event`, returns a tuple of the
 * `nextSnapshot` and `actions` to execute.
 *
 * This is a pure function that does not execute `actions`.
 */
export declare function transition<T extends AnyActorLogic>(logic: T, snapshot: SnapshotFrom<T>, event: EventFromLogic<T>): [nextSnapshot: SnapshotFrom<T>, actions: ExecutableActionsFrom<T>[]];
/**
 * Given actor `logic` and optional `input`, returns a tuple of the
 * `nextSnapshot` and `actions` to execute from the initial transition (no
 * previous state).
 *
 * This is a pure function that does not execute `actions`.
 */
export declare function initialTransition<T extends AnyActorLogic>(logic: T, ...[input]: undefined extends InputFrom<T> ? [input?: InputFrom<T>] : [input: InputFrom<T>]): [SnapshotFrom<T>, ExecutableActionsFrom<T>[]];
/**
 * Given a state `machine`, a `snapshot`, and an `event`, returns an array of
 * microsteps, where each microstep is a tuple of `[snapshot, actions]`.
 *
 * This is a pure function that does not execute `actions`.
 */
export declare function getMicrosteps<T extends AnyStateMachine>(machine: T, snapshot: SnapshotFrom<T>, event: EventFromLogic<T>): Array<[SnapshotFrom<T>, ExecutableActionsFrom<T>[]]>;
/**
 * Given a state `machine` and optional `input`, returns an array of microsteps
 * from the initial transition, where each microstep is a tuple of `[snapshot,
 * actions]`.
 *
 * This is a pure function that does not execute `actions`.
 */
export declare function getInitialMicrosteps<T extends AnyStateMachine>(machine: T, ...[input]: undefined extends InputFrom<T> ? [input?: InputFrom<T>] : [input: InputFrom<T>]): Array<[SnapshotFrom<T>, ExecutableActionsFrom<T>[]]>;
/**
 * Gets all potential next transitions from the current state.
 *
 * Returns all transitions that are available from the current state, including:
 *
 * - All transitions from atomic states (leaf states in the current state
 *   configuration)
 * - All transitions from ancestor states (parent states that may handle events)
 * - All guarded transitions (regardless of whether their guards would pass)
 * - Always (eventless) transitions
 * - After (delayed) transitions
 *
 * The order of transitions is deterministic:
 *
 * 1. Atomic states are processed in document order
 * 2. For each atomic state, transitions are collected from the state itself first,
 *    then its ancestors
 * 3. Within each state node, transitions are in the order they appear in the state
 *    definition
 *
 * @param state - The current machine snapshot
 * @returns Array of transition definitions from the current state, in
 *   deterministic order
 */
export declare function getNextTransitions(state: AnyMachineSnapshot): AnyTransitionDefinition[];

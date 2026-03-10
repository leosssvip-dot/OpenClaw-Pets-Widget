import { createMachine } from 'xstate';

export const petMachine = createMachine({
  id: 'pet',
  initial: 'idle',
  states: {
    idle: {
      on: {
        THINK: 'thinking',
        WORK: 'working',
        WAIT: 'waiting',
        COMPLETE: 'done',
        BLOCK: 'blocked'
      }
    },
    thinking: {
      on: {
        WORK: 'working',
        WAIT: 'waiting',
        COMPLETE: 'done',
        BLOCK: 'blocked'
      }
    },
    working: {
      on: {
        WAIT: 'waiting',
        COMPLETE: 'done',
        BLOCK: 'blocked'
      }
    },
    waiting: {
      on: {
        WORK: 'working',
        COMPLETE: 'done',
        BLOCK: 'blocked'
      }
    },
    done: {
      on: {
        THINK: 'thinking',
        WORK: 'working'
      }
    },
    blocked: {
      on: {
        THINK: 'thinking',
        WORK: 'working'
      }
    }
  }
});

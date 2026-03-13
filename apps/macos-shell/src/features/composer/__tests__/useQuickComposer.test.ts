import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as runtimeDeps from '../../../runtime/runtime-deps';
import { habitatStore } from '../../habitat/store';
import { useQuickComposer } from '../useQuickComposer';

function createDeferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });

  return { promise, resolve };
}

describe('useQuickComposer', () => {
  const sendMessage = vi.fn();

  beforeEach(() => {
    sendMessage.mockReset();
    vi.spyOn(runtimeDeps, 'getRuntimeDeps').mockReturnValue({
      connectionManager: { sendMessage } as any,
      bridge: {} as any
    } as ReturnType<typeof runtimeDeps.getRuntimeDeps>);
    habitatStore.setState({
      pets: {},
      agentSnapshots: {},
      selectedPetId: null
    });
    habitatStore.getState().seedPets([
      {
        id: 'pet-1',
        agentId: 'main',
        gatewayId: 'remote-1',
        status: 'idle',
        name: 'Main'
      }
    ]);
  });

  it('shows thinking feedback immediately while the bridge request is pending', async () => {
    const deferred = createDeferred<void>();
    sendMessage.mockReturnValue(deferred.promise);
    const submit = useQuickComposer('pet-1');

    const pending = submit('Follow up on the current task');

    expect(sendMessage).toHaveBeenCalledWith({
      petId: 'pet-1',
      agentId: 'main',
      content: 'Follow up on the current task'
    });
    expect(habitatStore.getState().pets['pet-1']).toMatchObject({
      status: 'thinking',
      bubbleText: 'Follow up on the current task'
    });

    deferred.resolve();
    await pending;
  });

  it('surfaces a send failure instead of failing silently', async () => {
    sendMessage.mockRejectedValue(new Error('Bridge client is not connected'));
    const submit = useQuickComposer('pet-1');

    await expect(submit('Check the gateway status')).resolves.toBeUndefined();

    expect(habitatStore.getState().pets['pet-1']).toMatchObject({
      status: 'blocked',
      bubbleText: 'Bridge client is not connected'
    });
  });
});

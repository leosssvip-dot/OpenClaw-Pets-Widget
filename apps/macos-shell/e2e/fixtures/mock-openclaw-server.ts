import { WebSocketServer } from 'ws';

export async function startMockOpenClawServer(port = 4318) {
  const server = new WebSocketServer({ port });

  server.on('connection', (socket) => {
    socket.on('message', (raw) => {
      const message = JSON.parse(String(raw)) as {
        type: string;
        params?: {
          auth?: {
            token?: string;
          };
        };
        payload?: {
          petId?: string;
        };
      };

      if (message.type === 'connect') {
        socket.send(
          JSON.stringify({
            type: 'connect.result',
            payload: {
              type:
                message.params?.auth?.token === 'expired'
                  ? 'auth-expired'
                  : 'hello-ok',
              protocolVersion: 3
            }
          })
        );
        return;
      }

      if (message.type === 'agents.list') {
        socket.send(
          JSON.stringify({
            type: 'agents.list.result',
            payload: [
              {
                id: 'pet-scout',
                agentId: 'scout',
                gatewayId: 'remote-1',
                label: 'Scout',
                status: 'idle'
              }
            ]
          })
        );
        return;
      }

      if (message.type === 'agent.message.send') {
        setTimeout(() => {
          socket.send(
            JSON.stringify({
              type: 'agent.task.completed',
              agentId: 'scout',
              gatewayId: 'remote-1',
              petId: message.payload?.petId ?? 'pet-scout'
            })
          );
        }, 100);
      }
    });
  });

  return {
    close: async () => {
      for (const client of server.clients) {
        client.terminate();
      }

      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      });
    }
  };
}

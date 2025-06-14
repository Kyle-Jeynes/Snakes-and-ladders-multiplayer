import { extractPaths } from './board.js';
import { dispatch } from './event.js';

export async function client(playerId = null, token = null, name = null) {
    return new Promise((resolve, reject) => {
        // For now, we only have a single game server, so we hardcode the URL
        let gameServer = 'ws://localhost:8080';

        // Append the name
        if (name) {
            gameServer = `${gameServer}?name=${name}`;
        }

        // Check if we have local authentication
        if (playerId && token) {
            gameServer = `${gameServer}&playerId=${playerId}&token=${token}`;
        }
        
        const socket = new WebSocket(gameServer);

        socket.addEventListener('open', (event) => {
            console.log('[WebSocket] Connected to server');

            window.addEventListener('beforeunload', () => {
                socket.close(1000, 'Window closing');
            });
        });

        socket.addEventListener('message', (event) => {
            const data = JSON.parse(event.data);
            console.log('[WebSocket] Message received:', data);

            const { event: handle, data: payload } = data;
            
            switch (handle) {
                case 'playerInfo':
                    localStorage.setItem('player', JSON.stringify(payload));
                    dispatch('player:updated', payload);
                    break;
                case 'gameStateUpdate':
                    const [snakes, ladders] = [extractPaths(payload.mapStructure, 's'), extractPaths(payload.mapStructure, 'l')];
                    dispatch('game:updated', {
                        ...payload,
                        snakes,
                        ladders,
                    });
                    break;
                default:
                    console.warn('Unsupported handle type', handle);
                    break;
            }
        });

        socket.addEventListener('close', (event) => {
            console.log('[WebSocket] Connection closed:', event);
        });

        socket.addEventListener('error', (event) => {
            console.error('[WebSocket] Error occurred:', event);
        });

        resolve(socket);
    });
};
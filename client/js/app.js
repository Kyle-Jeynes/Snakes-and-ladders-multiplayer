import { client } from './client.js';
import { getPlayer } from './storage.js';
import { processRegistration } from './register.js';
import { drawBoard } from './board.js';

let player = getPlayer();
let gameState = {};

const connectToGameServer = async () => {
    return new Promise((resolve, reject) => {
        client(player.id, player.token, player.name).then((socket) => {
            resolve(socket);
        }).catch((error) => {
            console.error('[WebSocket] Error connecting to server:', error);
            reject(error);
        });
    });
};

const startGame = (socket) => {
    if (player.isHost && socket) {
        socket.send(JSON.stringify({
            event: 'startGame',
            data: {},
        }));

        document.querySelector('.host button').classList.add('hidden');
    }
};

switch (player === null) {
    case true:
        processRegistration();
        break;
    case false:
        const rollDOM = document.querySelector('.buttons button');

        window.addEventListener('player:updated', (event) => {
            player = event.detail;
            rollDOM.disabled = !player.rolling;

            if ((gameState.status || 'waiting') !== 'waiting' && player.rolling && document.querySelector('.rolling').classList.contains('hidden')) {
                document.querySelector('.rolling').classList.remove('hidden');
            }
        });

        window.addEventListener('game:updated', async (event) => {
            gameState = event.detail;

            const {status} = gameState;

            rollDOM.disabled = status === 'waiting' ? true : !player.rolling;

            if (status === 'waiting' && player.isHost) {
                document.querySelector('.host button').classList.remove('hidden');
            } else if (!document.querySelector('.host button').classList.contains('hidden')) {
                document.querySelector('.host button').classList.add('hidden');
            }

            if (status === 'waiting' && !document.querySelector('.rolling').classList.contains('hidden')) {
                document.querySelector('.rolling').classList.add('hidden');
            }

            await drawBoard(gameState);
        });

        connectToGameServer().then((socket) => {
            document.querySelector('.host button').addEventListener('click', () => {
                startGame(socket);
            });

            document.querySelector('.buttons button').addEventListener('click', (element) => {
                socket.send(JSON.stringify({
                    event: 'playTurn',
                    data: {},
                }));

                if (!document.querySelector('.rolling').classList.contains('hidden')) {
                    document.querySelector('.rolling').classList.add('hidden');
                }

                element.target.disabled = true;
                document.querySelector('.actions img').classList.add('rotating-image');
            });
        });

        break;
}
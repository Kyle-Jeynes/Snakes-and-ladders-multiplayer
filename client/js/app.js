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

switch (player === null) {
    case true:
        processRegistration();
        break;
    case false:
        window.addEventListener('player:updated', (event) => {
            player = event.detail;

            const rollDOM = document.querySelector('.buttons button');
            rollDOM.disabled = player.rolling;
        });

        window.addEventListener('game:updated', async (event) => {
            gameState = event.detail;
            await drawBoard(gameState);
        });

        connectToGameServer().then((socket) => {
            document.querySelector('.buttons button').addEventListener('click', (element) => {
                socket.send(JSON.stringify({
                    event: 'playTurn',
                    data: {},
                }));

                element.target.disabled = true;
                document.querySelector('.actions img').classList.add('rotating-image');
            });
        });

        break;
}
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const play_1 = __importDefault(require("../services/play"));
function tryRegisterPlayerService(container, playerId) {
    if (!container.has(`PlayService-${playerId}`)) {
        const player = container.resolve('PlayerService').getPlayer(playerId);
        container.register(`PlayService-${playerId}`, play_1.default, true);
        container.resolve(`PlayService-${playerId}`).setPlayer(player);
    }
}
class ConnectionBootstrapper {
    boot(container, socket, requestId, requestToken) {
        return new Promise((resolve, reject) => {
            // Attempt to reauthenticate existing player session
            if (requestId && requestToken) {
                const requestPlayer = container.resolve('PlayerService').getPlayer(requestId);
                // If the player exists and has a socket, we can reauthenticate
                if (requestPlayer) {
                    const { id, token, sockets } = requestPlayer;
                    // Check if the token matches the request token
                    if (token === requestToken) {
                        sockets.push(socket);
                        // Register the PlayService if it doesn't already exist
                        tryRegisterPlayerService(container, id);
                        // Request was authorized so we can resolve with the player's ID
                        return resolve(id);
                    }
                }
            }
            // Register a new player object
            const player = {
                id: crypto.randomUUID(),
                sockets: [socket],
                name: undefined,
                isReady: false,
                token: crypto.randomUUID(),
                isHost: container.resolve('PlayerService').playerCount() === 0,
                roll: undefined,
            };
            // Add the player to the PlayerService
            container.resolve('PlayerService')
                .addPlayer(player.id, player);
            // Register the PlayService if it doesn't already exist
            tryRegisterPlayerService(container, player.id);
            // Resolve with the new player's ID
            resolve(player.id);
        });
    }
    shutdown(container, socket, playerId) {
        return new Promise((resolve, reject) => {
            const player = container.resolve('PlayerService')
                .getPlayer(playerId);
            // If the player exists, remove the socket from their list
            if (player) {
                const index = player.sockets.indexOf(socket);
                if (index !== -1) {
                    player.sockets.splice(index, 1);
                }
                if (player.sockets.length === 0) {
                    // TODO: Update that the player is no longer connected
                }
                // If the player has no sockets left, remove the PlayService
                if (container.has(`PlayService-${player.id}`) && player.sockets.length === 0) {
                    container.delete(`PlayService-${player.id}`);
                }
            }
            resolve();
        });
    }
}
exports.default = ConnectionBootstrapper;
;

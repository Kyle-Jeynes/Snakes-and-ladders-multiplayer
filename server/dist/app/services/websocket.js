"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = require("ws");
class WebSocketServerService {
    port;
    wss;
    container;
    constructor(port = 8080, container) {
        this.port = port;
        this.wss = new ws_1.WebSocketServer({ port });
        this.container = container;
    }
    configurePort(port) {
        this.port = port;
    }
    async decodeMessage(data) {
        return new Promise((resolve, reject) => {
            try {
                const message = JSON.parse(data.toString());
                resolve(message);
            }
            catch (error) {
                reject(error);
            }
        });
    }
    start() {
        console.log(`[WS] Starting server on port ${this.port}`);
        this.wss.on('connection', async (socket, req) => {
            console.log(`[+] Client connected: ${req.socket.remoteAddress}`);
            // Attempt to extract the playerId and token from the query parameters
            const url = new URL(req.url, `http://${req.headers.host}`);
            const requestId = url.searchParams.get('playerId');
            const requestToken = url.searchParams.get('token');
            // Bootstrap the Connection
            const playerId = await this.container
                .resolve('ConnectionBootstrapper')
                .boot(this.container, socket, requestId, requestToken);
            console.log(`[+] Player ID: ${playerId}`);
            // TODO: Notify the player that they have successfully connected
            //       With their player ID and token
            const playerService = this.container.resolve('PlayerService');
            const gameService = this.container.resolve('GameService');
            // TODO: Add spectator mode support
            if (gameService.getMaxPlayers() === playerService.playerCount()) {
                console.log(`[-] Maximum players reached for game ${gameService.getId()}. Player ${playerId} cannot join.`);
                socket.close();
                return;
            }
            try {
                // Notify game service that a player has joined
                await gameService.handlePlayerJoined(playerId, playerService);
            }
            catch (error) {
                console.error(`[-] Error handling player join for game ${gameService.getId()}`);
                console.error(error);
                socket.close();
                return;
            }
            // TODO: Notify the player that they have successfully joined
            //       Notify all players that a new player has joined
            socket.on('message', async (data) => {
                try {
                    const { event, data: payload } = await this.decodeMessage(data);
                    await this.container.resolve(`PlayService-${playerId}`).handlePlayerEvent(event, payload);
                }
                catch (error) {
                    console.error(`[-] Error handling message for player ${playerId} for game ${gameService.getId()}`);
                    console.error(error);
                }
            });
            socket.on('close', async () => {
                console.log(`[-] Client disconnected: ${playerId}`);
                await this.container
                    .resolve('connectionBootstrapper')
                    .shutdown(this.container, socket, playerId);
            });
        });
    }
    stop() {
        this.wss.close();
    }
}
exports.default = WebSocketServerService;
;

import WebSocket, { WebSocketServer } from 'ws';
import IContainer from '../interfaces/container';
import IBootstrap from '../interfaces/bootstrap';
import { Game } from './game';
import PlayerService from './players';
import PlayService from './play';
import IMessage from '../interfaces/message';

export default class WebSocketServerService {
    private wss: WebSocketServer;
    private container: IContainer;

    constructor(private port = 8080, container: IContainer) {
        this.wss = new WebSocketServer({ port });
        this.container = container;
    }

    configurePort(port: number) {
        this.port = port;
    }

    private async decodeMessage(data: WebSocket.Data): Promise<IMessage> {
        return new Promise<IMessage>((resolve, reject) => {
            try {
                const message = JSON.parse(data.toString()) as IMessage;
                resolve(message);
            } catch (error) {
                reject(error);
            }
        });
    }

    async start() {
        return new Promise((resolve, reject) => {
            console.log(`[WS] Starting server on port ${this.port}`);

            this.wss.on('connection', async (socket, req) => {
                console.log(`[+] Client connected: ${req.socket.remoteAddress}`);

                (socket as any).isAlive = true;

                // Attempt to extract the playerId and token from the query parameters
                const url = new URL(req.url!, `http://${req.headers.host}`);
                const requestId = url.searchParams.get('playerId');
                const requestToken = url.searchParams.get('token');
                const name = url.searchParams.get('name') || 'Player';
                
                // Bootstrap the Connection
                const playerId: string = await this.container
                    .resolve<IBootstrap>('ConnectionBootstrapper')
                    .boot(this.container, socket, requestId, requestToken);

                console.log(`[+] Player ID: ${playerId}`);

                const player = this.container.resolve<PlayerService>('PlayerService').getPlayer(playerId)!;

                // Check if there is a host
                if (Array.from(this.container.resolve<PlayerService>('PlayerService').getAllPlayers().entries()).filter(([_, {isHost}]) => isHost).length <= 0) {
                    console.log(`[!] No host exists - ${player.id} is now hosting`);
                    [player.isHost, player.rolling] = [true, true];
                }
                
                // Update the player's name to the requested name and set them as ready
                [player.name, player.isReady] = [name, true];

                // Update player state to the client
                socket.send(JSON.stringify({
                    event: 'playerInfo',
                    data: {
                        id: playerId,
                        token: player.token,
                        isHost: player.isHost,
                        name: player.name || 'Player',
                        isReady: player.isReady,
                        roll: player.roll,
                        rolling: player.rolling,
                        position: player.position,
                    }
                }));

                const playerService = this.container.resolve<PlayerService>('PlayerService');
                const gameService = this.container.resolve<Game>('GameService');

                // TODO: Add spectator mode support
                if (gameService.getMaxPlayers() === playerService.playerCount()) {
                    console.log(`[-] Maximum players reached for game ${gameService.getId()}. Player ${playerId} cannot join.`);
                    socket.close();
                    return;
                }

                try {
                    // Notify game service that a player has joined
                    await gameService.handlePlayerJoined(playerId, playerService);
                } catch (error) {
                    console.error(`[-] Error handling player join for game ${gameService.getId()}`);
                    console.error(error);
                    socket.close();
                    return;
                }

                // Update all game states
                Array.from(this.container.resolve<PlayerService>('PlayerService').getAllPlayers().entries()).filter(([id, {isReady}]) => isReady).forEach(([id, { sockets }]) => {
                    sockets.forEach(s => {
                        this.container.resolve<Game>('GameService').updateGameState(s, this.container.resolve<PlayerService>('PlayerService'));
                    });
                });

                socket.on('message', async (data) => {
                    try {
                        const { event, data: payload } = await this.decodeMessage(data);
                        await this.container.resolve<PlayService>(`PlayService-${playerId}`).handlePlayerEvent(event, payload, this.container);
                    } catch (error) {
                        console.error(`[-] Error handling message for player ${playerId} for game ${gameService.getId()}`);
                        console.error(error);
                    }
                });

                socket.on('close', async () => {
                    await this.container
                        .resolve<IBootstrap>('ConnectionBootstrapper')
                        .shutdown(this.container, socket, playerId);
                });
            });
        });
    }

    stop() {
        this.wss.close();
    }
};
import IBootstrap from "../interfaces/bootstrap";
import IContainer from "../interfaces/container";
import IPlayer from "../interfaces/player";
import { Game } from "../services/game";
import PlayService from "../services/play";
import PlayerService from "../services/players";
import crypto from 'crypto';

function tryRegisterPlayerService(container: IContainer, playerId: string): void {
    if (!container.has(`PlayService-${playerId}`)) {
        const player = container.resolve<PlayerService>('PlayerService').getPlayer(playerId);
        container.register<PlayService>(`PlayService-${playerId}`, PlayService, true);
        container.resolve<PlayService>(`PlayService-${playerId}`).setPlayer(player as IPlayer);
    }
}

export default class ConnectionBootstrapper implements IBootstrap {
    boot(container: IContainer, socket: any, requestId: string|null, requestToken: string|null): Promise<string> {
        return new Promise((resolve, reject) => {
            // Attempt to reauthenticate existing player session
            if (requestId && requestToken) {
                const requestPlayer = container.resolve<PlayerService>('PlayerService').getPlayer(requestId);

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
            const player: IPlayer = {
                id: crypto.randomUUID(),
                sockets: [socket],
                name: undefined,
                isReady: false,
                token: crypto.randomUUID(),
                isHost: container.resolve<PlayerService>('PlayerService').playerCount() === 0,
                roll: undefined,
                points: 0,
            };

            // Add the player to the PlayerService
            container.resolve<PlayerService>('PlayerService')
                .addPlayer(player.id, player);

            // Register the PlayService if it doesn't already exist
            tryRegisterPlayerService(container, player.id);

            // Resolve with the new player's ID
            resolve(player.id);
        });
    }

    shutdown(container: IContainer, socket: any, playerId: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const player: IPlayer|undefined = container.resolve<PlayerService>('PlayerService')
                .getPlayer(playerId);

            // If the player exists, remove the socket from their list
            if (player) {
                console.log(`[-] Client Disconnected for Player ID: ${player.id}`)

                const index = player.sockets.indexOf(socket);

                if (index !== -1) {
                    player.sockets.splice(index, 1);
                }

                if (player.sockets.length === 0) {
                    // Remove the PlayService
                    if (container.has(`PlayService-${player.id}`)) {
                        container.delete(`PlayService-${player.id}`);
                    }

                    let migration = false;

                    // Check if we need to migrate the host
                    if (player.isHost) {
                        if (container.resolve<PlayerService>('PlayerService').playerCount() > 1) {
                            migration = true;
                        }
                    }

                    [player.isReady, player.isHost] = [false, false];

                    // Migrate the host
                    if (migration) {
                        const players = container.resolve<PlayerService>('PlayerService').getAllPlayers();

                        const newHostId = Array.from(players.entries())
                            .filter(([_, player]) => player.isReady)
                            .map(([id]) => id)
                            .shift() as string | null;

                            if (newHostId) {
                                container.resolve<PlayerService>('PlayerService').getPlayer(newHostId)!.isHost = true;
                            } else {
                                // TODO: Need to end the Game
                            }
                    }

                    // Update all game states
                    Array.from(container.resolve<PlayerService>('PlayerService').getAllPlayers().entries()).filter(([_, {isReady}]) => isReady).forEach(([_, { sockets }]) => {
                        sockets.forEach(s => {
                            container.resolve<Game>('GameService').updateGameState(s, container.resolve<PlayerService>('PlayerService'));
                        });
                    });
                }
            }

            resolve();
        });
    }
};
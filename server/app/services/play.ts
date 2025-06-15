import IContainer from "../interfaces/container";
import IPlayer from "../interfaces/player";
import { Game, GameStatus } from "./game";
import PlayerService from "./players";

export default class PlayService {
    private player: IPlayer | undefined;

    public setPlayer(player: IPlayer) {
        this.player = player;
    }

    public async rollDice(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (this.player && this.player.rolling === true) {
                this.player.roll = Math.floor(Math.random() * 6) + 1;
                return resolve(true);
            }

            resolve(false);
        });
    }

    private toFlatIndex([row, col]: [number, number]): number {
        const y = 9 - row;
        return y % 2 === 0 ? y * 10 + col : y * 10 + (9 - col); 
    }

    private toCoordinates(pos: number): [number, number] {
        const y = Math.floor(pos / 10);
        const row = 9 - y;
        let col = pos % 10;

        if (y % 2 === 1) {
            col = 9 - col;
        }

        return [row, col];
    }

    public async handlePlayerEvent(event: string, data: any, container: IContainer): Promise<void> {
        return new Promise((resolve, reject) => {
            console.log(`Player ${this.player!.id} sent an event ${event}`);

            switch (event) {
                case 'startGame':
                    container.resolve<Game>('GameService').startGameIfReady(
                        container.resolve<PlayerService>('PlayerService')
                    ).then(() => {
                        // Update UI Game State
                        Array.from(container.resolve<PlayerService>('PlayerService').getAllPlayers().entries())
                            .filter(([_, {isReady}]) => isReady)
                            .map(([id, {sockets}]) => ({id, sockets}))
                            .forEach(({sockets}) => {
                                sockets.forEach(s => {
                                    container.resolve<Game>('GameService').updateGameState(s, container.resolve<PlayerService>('PlayerService'));
                                });
                            });
                    }).catch(error => {
                        this.player!.sockets.forEach(s => {
                            s.send(JSON.stringify({
                                event: 'gameStartFailure',
                                data: {
                                    content: 'The Game cannot be started until there are enough players ready'
                                },
                            }));
                        })
                    });
                    break;
                case 'playTurn':
                    this.rollDice().then((rolled) => {
                        if (rolled) {
                            const tile = this.toFlatIndex(this.player!.position);
                            const newTile = (tile + this.player!.roll!);

                            // Rule ensures player gets to re-roll on a 6
                            // If the player cannot move, this doesn't apply
                            const playTurnAgain = this.player!.roll === 6 && newTile < 100;

                            this.player!.sockets.forEach(s => {
                                s.send(JSON.stringify({
                                    event: 'turnPlayed',
                                    data: {
                                        roll: this.player!.roll,
                                        reroll: playTurnAgain
                                    },
                                }));
                            });

                            console.log(`[*] Attempting to move Player ${this.player!.id} to Tile ${newTile}`);

                            let gameEnd = false;

                            if (newTile > 99) {
                                console.log(`[!] Player ${this.player!.id} could not proceed with roll because they rolled over the remaining length`);
                            } else if (newTile === 99) {
                                console.log(`[*] Player ${this.player!.id} has won the game`);
                                this.player!.points++;
                                gameEnd = true;
                            } else {
                                this.player!.position = this.toCoordinates(newTile);

                                // Calculate if we have hit a snake
                                const {end: snakeEnd} = container.resolve<Game>('GameService').getSnakes().find(({start}) => {
                                    const [x, y] = start;
                                    const [w, z] = this.player!.position;

                                    return x === w && y === z;
                                }) ?? {end: null};

                                if (snakeEnd) {
                                    console.log(`[*] Player ${this.player!.id} has hit a snake`);
                                    this.player!.position = snakeEnd;
                                }

                                // Calculate if we have hit a ladder
                                const {start: ladderEnd} = container.resolve<Game>('GameService').getLadders().find(({end}) => {
                                    const [x, y] = end;
                                    const [w, z] = this.player!.position;

                                    return x === w && y === z;
                                }) ?? {start: null};

                                if (ladderEnd) {
                                    console.log(`[*] Player ${this.player!.id} has hit a ladder`);
                                    this.player!.position = ladderEnd;
                                }
                            }

                            // Update the next player to roll
                            if (!playTurnAgain) {
                                this.player!.rolling = false;
                                const nextPlayer = container.resolve<PlayerService>('PlayerService')
                                    .getPlayer(container.resolve<Game>('GameService').nextPlayerTurn(this.player!.id));

                                if (nextPlayer) {
                                    nextPlayer.rolling = true;

                                    nextPlayer.sockets.forEach(s => {
                                        s.send(JSON.stringify({
                                            event: 'playerInfo',
                                            data: {
                                                id: nextPlayer.id,
                                                token: nextPlayer.token,
                                                isHost: nextPlayer.isHost,
                                                name: nextPlayer.name || 'Player',
                                                isReady: nextPlayer.isReady,
                                                roll: nextPlayer.roll,
                                                rolling: nextPlayer.rolling,
                                                position: nextPlayer.position,
                                            }
                                        }));
                                    });
                                } else {
                                    // Its all messed up
                                    console.log('[!!] Somethings gone far wrong for this to happen - debug here');
                                    gameEnd = true;
                                }
                            } else {
                                // Update current player they're re-rolling
                                this.player!.sockets.forEach(s => {
                                    s.send(JSON.stringify({
                                        event: 'playerInfo',
                                        data: {
                                            id: this.player!.id,
                                            token: this.player!.token,
                                            isHost: this.player!.isHost,
                                            name: this.player!.name || 'Player',
                                            isReady: this.player!.isReady,
                                            roll: this.player!.roll,
                                            rolling: this.player!.rolling,
                                            position: this.player!.position,
                                        }
                                    }));
                                });
                            }

                            // Update UI Game State
                            Array.from(container.resolve<PlayerService>('PlayerService').getAllPlayers().entries())
                                .filter(([_, {isReady}]) => isReady)
                                .map(([id, {sockets}]) => ({id, sockets}))
                                .forEach(({sockets}) => {
                                    sockets.forEach(s => {
                                        container.resolve<Game>('GameService').updateGameState(s, container.resolve<PlayerService>('PlayerService'));
                                    });
                                });

                            // Handle Game End
                            if (gameEnd) {
                                container.resolve<Game>('GameService').setStatus(GameStatus.WAITING);
                                Array.from(container.resolve<PlayerService>('PlayerService').getAllPlayers().entries())
                                    .filter(([_, {isReady}]) => isReady)
                                    .forEach(([id, availablePlayer]) => {
                                        availablePlayer.position = [9, 0];
                                    });

                                // Update Game UI State
                                Promise.allSettled([new Promise<void>((resolve, _) => {
                                    Array.from(container.resolve<PlayerService>('PlayerService').getAllPlayers().entries())
                                        .filter(([_, {isReady}]) => isReady)
                                        .map(([id, {sockets}]) => ({id, sockets}))
                                        .forEach(({sockets}) => {
                                            sockets.forEach(s => {
                                                container.resolve<Game>('GameService').updateGameState(s, container.resolve<PlayerService>('PlayerService'));
                                            });
                                        });
                                        
                                    resolve();
                                })]);
                            }
                        }
                    });
                    break;
                default:
                    break;
            }

            resolve();
            
        });
    }
};
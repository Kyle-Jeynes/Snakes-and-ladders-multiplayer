import PlayerService from "./players";
import MapGenerator from "./map";
import crypto from 'crypto';

export enum GameStatus {
    WAITING = "waiting",
    IN_PROGRESS = "in_progress"
};

export class Game {
    private id: string;
    private status: string = GameStatus.WAITING;
    private port: number;
    private maxPlayers: number = 4;
    private round: number = 1;
    private rollTimer: number = 30 * 1000;

    // Default Map Structure
    private mapStructure: string[][] = [
        ['o', 'o', 's', 'o', 'o', 'o', 'l', 'o', 'o', 'o'],
        ['o', 'o', 's', 'o', 'o', 'o', 'l', 'o', 'o', 'o'],
        ['o', 'o', 's', 'o', 'o', 'o', 'l', 'o', 'o', 'o'],
        ['o', 'o', 'o', 'o', 'o', 'o', 'l', 'o', 'o', 'o'],
        ['o', 'o', 'l', 'o', 'o', 'o', 'o', 'o', 's', 'o'],
        ['o', 'o', 'l', 'o', 's', 'o', 'o', 'o', 's', 'o'],
        ['o', 'o', 'l', 'o', 's', 'o', 'o', 'o', 's', 'o'],
        ['o', 'o', 'l', 'o', 'o', 'o', 'o', 'o', 's', 'o'],
        ['o', 'o', 'o', 'o', 'o', 'l', 'o', 'o', 'o', 'o'],
        ['o', 'o', 'o', 'o', 'o', 'l', 'o', 'o', 'o', 'o'],
    ];

    public constructor(port: number) {
        this.id = crypto.randomUUID();
        this.port = port;
    }

    public getId(): string {
        return this.id;
    }

    public getStatus(): string {
        return this.status;
    }

    public getPort(): number {
        return this.port;
    }

    public getMaxPlayers(): number {
        return this.maxPlayers;
    }

    public getRound(): number {
        return this.round;
    }

    public setRound(round: number): void {
        this.round = round;
    }

    public setStatus(status: GameStatus): void {
        this.status = status;
    }

    public async updateGameState(s: any, playerService: PlayerService) {
        return new Promise<void>((resolve, reject) => {
            s.send(JSON.stringify({
                event: 'gameStateUpdate',
                data: {
                    players: Array.from(playerService.getAllPlayers().entries())
                        .filter(([_, player]) => player.isReady)
                        .map(([id, player]) => ({ id, name: player.name, isHost: player.isHost, roll: player.roll || null, points: player.points })),
                    status: this.status,
                    mapStructure: this.mapStructure,
                    rollTimer: this.rollTimer,
                },
            }));

            resolve();
        });
    }

    public async handlePlayerJoined(playerId: string, playerService: PlayerService): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            if (this.status !== GameStatus.WAITING) {
                console.log(`[-] Game ${this.id} is already in progress. Player ${playerId} cannot join.`);
                reject(new Error(`Game is already in progress.`));
                return;
            }

            playerService.getPlayer(playerId)!.sockets.forEach(s => {
                this.updateGameState(s, playerService);
            });

            console.log(`[+] Player ${playerId} has joined the game ${this.id}.`);

            resolve();
        });
    }

    public getRollTimer(): number {
        return this.rollTimer;
    }

    public async startGameIfReady(playerService: PlayerService): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            if (this.status !== GameStatus.WAITING) {
                console.log(`[!] Game ${this.id} is already in progress.`);
                reject(new Error(`Game is already in progress.`));
                return;
            }

            if (playerService.playerCount() < 2) {
                console.log(`Game ${this.id} cannot start. Not enough players.`);
                reject(new Error(`Not enough players to start the game.`));
                return;
            }

            console.log(`[!] Game ${this.id} is ready to start with ${playerService.playerCount()} players.`);

            this.startGame()
                .then(() => {
                    console.log(`[!] Game ${this.id} has started successfully.`);
                    resolve();
                })
                .catch((error) => {
                    console.error(`Error starting game ${this.id}:`, error);
                    reject(error);
                });
        });
    }

    private async startGame(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            if (this.status !== GameStatus.WAITING) {
                console.log(`[!] Game ${this.id} is already in progress.`);
                reject(new Error(`Game is already in progress.`));
                return;
            }

            this.status = GameStatus.IN_PROGRESS;
            console.log(`[!] Game ${this.id} has started.`);
            resolve();
        });
    }

    public getMapStructure(): string[][] {
        return this.mapStructure;
    }

    public async generateMapStructure(): Promise<void> {
        const map = new MapGenerator();
        this.mapStructure = await map.generateMapStructure();
    }
};
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Game = exports.GameStatus = void 0;
const map_1 = __importDefault(require("./map"));
var GameStatus;
(function (GameStatus) {
    GameStatus["WAITING"] = "waiting";
    GameStatus["IN_PROGRESS"] = "in_progress";
})(GameStatus || (exports.GameStatus = GameStatus = {}));
;
class Game {
    id;
    status = GameStatus.WAITING;
    port;
    maxPlayers = 4;
    round = 1;
    rollTimer = 30 * 1000;
    // Default Map Structure
    mapStructure = [
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
    constructor(port) {
        this.id = crypto.randomUUID();
        this.port = port;
    }
    getId() {
        return this.id;
    }
    getStatus() {
        return this.status;
    }
    getPort() {
        return this.port;
    }
    getMaxPlayers() {
        return this.maxPlayers;
    }
    getRound() {
        return this.round;
    }
    setRound(round) {
        this.round = round;
    }
    setStatus(status) {
        this.status = status;
    }
    async handlePlayerJoined(playerId, playerService) {
        return new Promise((resolve, reject) => {
            if (this.status !== GameStatus.WAITING) {
                console.log(`Game ${this.id} is already in progress. Player ${playerId} cannot join.`);
                reject(new Error(`Game is already in progress.`));
                return;
            }
            console.log(`Player ${playerId} has joined the game ${this.id}.`);
        });
    }
    getRollTimer() {
        return this.rollTimer;
    }
    async startGameIfReady(playerService) {
        return new Promise((resolve, reject) => {
            if (this.status !== GameStatus.WAITING) {
                console.log(`Game ${this.id} is already in progress.`);
                reject(new Error(`Game is already in progress.`));
                return;
            }
            if (playerService.playerCount() < 2) {
                console.log(`Game ${this.id} cannot start. Not enough players.`);
                reject(new Error(`Not enough players to start the game.`));
                return;
            }
            console.log(`Game ${this.id} is ready to start with ${playerService.playerCount()} players.`);
            this.startGame()
                .then(() => {
                console.log(`Game ${this.id} has started successfully.`);
                resolve();
            })
                .catch((error) => {
                console.error(`Error starting game ${this.id}:`, error);
                reject(error);
            });
        });
    }
    async startGame() {
        return new Promise((resolve, reject) => {
            if (this.status !== GameStatus.WAITING) {
                console.log(`Game ${this.id} is already in progress.`);
                reject(new Error(`Game is already in progress.`));
                return;
            }
            this.status = GameStatus.IN_PROGRESS;
            console.log(`Game ${this.id} has started.`);
            resolve();
        });
    }
    getMapStructure() {
        return this.mapStructure;
    }
    async generateMapStructure() {
        const map = new map_1.default();
        this.mapStructure = await map.generateMapStructure();
    }
}
exports.Game = Game;
;

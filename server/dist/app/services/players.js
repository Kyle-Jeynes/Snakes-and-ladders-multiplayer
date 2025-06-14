"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class PlayerService {
    players;
    constructor() {
        this.players = new Map();
    }
    addPlayer(playerId, player) {
        this.players.set(playerId, player);
    }
    getPlayer(playerId) {
        return this.players.get(playerId);
    }
    removePlayer(playerId) {
        return this.players.delete(playerId);
    }
    getAllPlayers() {
        return this.players;
    }
    clearPlayers() {
        this.players.clear();
    }
    playerCount() {
        return this.players.size;
    }
}
exports.default = PlayerService;
;

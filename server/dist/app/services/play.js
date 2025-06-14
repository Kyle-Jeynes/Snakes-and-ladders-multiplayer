"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class PlayService {
    player;
    setPlayer(player) {
        this.player = player;
    }
    rollDice() {
        if (this.player && this.player.roll === undefined) {
            this.player.roll = Math.floor(Math.random() * 6) + 1;
            return true;
        }
        return false;
    }
    async handlePlayerEvent(event, data) {
        return new Promise((resolve, reject) => {
            if (!this.player) {
                return reject(new Error("Player not set in PlayService"));
            }
            // TODO: Handle different player events here
        });
    }
}
exports.default = PlayService;
;

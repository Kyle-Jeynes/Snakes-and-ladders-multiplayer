"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class MapGenerator {
    WIDTH = 10;
    HEIGHT = 10;
    MAX_LADDER_LENGTH = 6;
    MAX_SNAKE_LENGTH = 6;
    MAX_SNAKE_HORIZONTAL_WARP = 2;
    NUM_LADDERS = 5;
    NUM_SNAKES = 5;
    async generateMapStructure() {
        const board = Array.from({ length: this.HEIGHT }, () => Array(this.WIDTH).fill('o'));
        const isValid = (x, y) => x >= 0 && x < this.HEIGHT && y >= 0 && y < this.WIDTH;
        const ladderDirections = [
            [-1, 0], // up
            [-1, 1], // up-right
            [-1, -1], // up-left
        ];
        const placeLadders = () => {
            for (let i = 0; i < this.NUM_LADDERS; i++) {
                const length = this.getRandomInt(2, this.MAX_LADDER_LENGTH);
                const dir = ladderDirections[this.getRandomInt(0, ladderDirections.length)];
                let x = this.getRandomInt(length, this.HEIGHT - 1); // start lower
                let y = this.getRandomInt(0, this.WIDTH - 1);
                for (let j = 0; j < length; j++) {
                    if (!isValid(x, y) || board[x][y] !== 'o')
                        break;
                    board[x][y] = 'l';
                    x += dir[0];
                    y += dir[1];
                }
            }
        };
        const placeSnakes = () => {
            for (let i = 0; i < this.NUM_SNAKES; i++) {
                let x = this.getRandomInt(0, this.HEIGHT - this.MAX_SNAKE_LENGTH - 1);
                let y = this.getRandomInt(0, this.WIDTH - 1);
                let horizontalMoves = 0;
                let downMoves = 0;
                while ((horizontalMoves + downMoves) < this.MAX_SNAKE_LENGTH) {
                    if (!isValid(x, y) || board[x][y] !== 'o')
                        break;
                    board[x][y] = 's';
                    const canWarp = horizontalMoves < this.MAX_SNAKE_HORIZONTAL_WARP;
                    const shouldWarp = canWarp && Math.random() < 0.5;
                    if (shouldWarp) {
                        y += this.getRandomInt(0, 2) === 0 ? -1 : 1; // left or right
                        horizontalMoves++;
                    }
                    else {
                        x += 1; // move down
                        downMoves++;
                    }
                }
            }
        };
        placeLadders();
        placeSnakes();
        return board;
    }
    getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min)) + min;
    }
}
exports.default = MapGenerator;

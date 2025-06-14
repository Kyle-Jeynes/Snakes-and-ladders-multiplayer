export default class MapGenerator {
    private readonly WIDTH = 10;
    private readonly HEIGHT = 10;
    private readonly MAX_LADDER_LENGTH = 6;
    private readonly MAX_SNAKE_LENGTH = 6;
    private readonly MAX_SNAKE_HORIZONTAL_WARP = 2;
    private readonly NUM_LADDERS = 5;
    private readonly NUM_SNAKES = 5;

    public async generateMapStructure(): Promise<string[][]> {
        const board: string[][] = Array.from({ length: this.HEIGHT }, () =>
            Array(this.WIDTH).fill('o')
        );

        const isValid = (x: number, y: number): boolean =>
            x >= 0 && x < this.HEIGHT && y >= 0 && y < this.WIDTH;

        const ladderDirections: [number, number][] = [
            [-1, 0],   // up
            [-1, 1],   // up-right
            [-1, -1],  // up-left
        ];

        const placeLadders = () => {
            for (let i = 0; i < this.NUM_LADDERS; i++) {
                const length = this.getRandomInt(2, this.MAX_LADDER_LENGTH);
                const dir = ladderDirections[this.getRandomInt(0, ladderDirections.length)];
                let x = this.getRandomInt(length, this.HEIGHT - 1); // start lower
                let y = this.getRandomInt(0, this.WIDTH - 1);

                for (let j = 0; j < length; j++) {
                    if (!isValid(x, y) || board[x][y] !== 'o') break;
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
                    if (!isValid(x, y) || board[x][y] !== 'o') break;

                    board[x][y] = 's';

                    const canWarp = horizontalMoves < this.MAX_SNAKE_HORIZONTAL_WARP;
                    const shouldWarp = canWarp && Math.random() < 0.5;

                    if (shouldWarp) {
                        y += this.getRandomInt(0, 2) === 0 ? -1 : 1; // left or right
                        horizontalMoves++;
                    } else {
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

    private getRandomInt(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min)) + min;
    }
}
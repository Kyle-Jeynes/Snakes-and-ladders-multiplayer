export function extractPaths(board: string[][], tileType: string) {
    const height = board.length;
    const width = board[0].length;
    const visited = Array.from({ length: height }, () => Array(width).fill(false));
    const paths = [];

    const bfs = (startX: any, startY: any) => {
        const queue = [[startX, startY]];
        const path = [];
        visited[startX][startY] = true;

        while (queue.length > 0) {
            const [x, y] = queue.shift() ?? [];
            
            if (x === undefined || y === undefined) {
                continue;
            }

            path.push([x, y]);

            // we should only ever need to go down, right or left
            for (const [dx, dy] of [[1, 0], [0, 1], [0, -1]]) { 
                const nx = x + dx;
                const ny = y + dy;

                if (
                    nx >= 0 && nx < height &&
                    ny >= 0 && ny < width &&
                    !visited[nx][ny] &&
                    board[nx][ny] === tileType
                ) {
                    visited[nx][ny] = true;
                    queue.push([nx, ny]);
                }
            }
        }

        return path;
    };

    for (let i = 0; i < height; i++) {
        for (let j = 0; j < width; j++) {
            if (board[i][j] === tileType && !visited[i][j]) {
                const path = bfs(i, j);
                if (path.length > 1) {
                    paths.push({
                        type: tileType,
                        start: path[0],
                        end: path[path.length - 1],
                    });
                }
            }
        }
    }

    return paths;
}
export function extractPaths(board, tileType) {
    const height = board.length;
    const width = board[0].length;
    const visited = Array.from({ length: height }, () => Array(width).fill(false));
    const paths = [];

    const bfs = (startX, startY) => {
        const queue = [[startX, startY]];
        const path = [];
        visited[startX][startY] = true;

        while (queue.length > 0) {
            const [x, y] = queue.shift();
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

export async function drawBoard(board) {
    return new Promise((resolve, reject) => {
        const boardDOM = document.getElementById('board');

        // reset the DOM
        boardDOM.innerHTML = '';

        // render
        const { mapStructure, players } = board;

        mapStructure.forEach((row, index) => {
            const rowDOM = document.createElement('div');
            rowDOM.classList.add('board-row');
            rowDOM.setAttribute('data-row', index.toString());

            row.forEach((tile, tIndex) => {
                const tileDOM = document.createElement('div');
                tileDOM.classList.add('board-tile');
                tileDOM.setAttribute('data-tile', tile);
                tileDOM.setAttribute('data-index', tIndex.toString());
                
                switch (tile) {
                    case 's':
                        tileDOM.innerText = '🐍';
                        break;
                    case 'l':
                        tileDOM.innerText = '🪜';
                        break;
                    default:
                        break;
                }

                const tileNumberDOM = document.createElement('span');
                const totalRows = 10;
                const totalCols = 10;

                const row = index;
                const col = tIndex;

                const isReversed = (totalRows - row - 1) % 2 === 1;

                const position = isReversed
                ? (totalRows - row - 1) * totalCols + (totalCols - col - 1)
                : (totalRows - row - 1) * totalCols + col;

                tileNumberDOM.innerText = (position + 1).toString();
                tileDOM.appendChild(tileNumberDOM);

                rowDOM.appendChild(tileDOM);
            });

            boardDOM.appendChild(rowDOM);
        });

        // TODO: Put players on the board

        // Load the leaderboard
        const leadersDOM = document.getElementById('player-leaders');

        leadersDOM.innerHTML = '';

        players.forEach(({id, name, points, roll}, index) => {
            const liDOM = document.createElement('li');
            const cList = index === 0 ? 'gold' : (index === 1 ? 'silver' : (index === 2 ? 'bronze' : null));
            
            if (cList) {
                liDOM.classList.add(cList);
            }

            const [playerRank, playerName, playerScore] = [
                document.createElement('span'),
                document.createElement('span'),
                document.createElement('span'),
            ];

            playerName.innerText = name;
            playerName.classList.add('player-name');

            playerRank.innerText = (index +1).toString();
            playerRank.classList.add('player-rank');

            playerScore.innerText = `${points} pts`;
            playerScore.classList.add('player-score');

            liDOM.appendChild(playerRank);
            liDOM.appendChild(playerName);
            liDOM.appendChild(playerScore);

            leadersDOM.appendChild(liDOM);
        });

        resolve();
    });
};
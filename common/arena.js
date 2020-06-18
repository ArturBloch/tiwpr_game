const Player = require('./player');
const Cell = require('./cell');

module.exports = class Arena {
    constructor() {
        this.length = 15;
        this.width = this.length;
        this.height = this.length;
        this.maze = [];
        for (let i = 0; i < this.length; i++) {
            this.maze[i] = [];
            for (let j = 0; j < this.length; j++) {
                this.maze[i][j] = new Cell(j, i);
            }
        }
        this.timer = 5;
        this.prevTime = 0;
        this.player1 = new Player({id: 1, name: ""});
        this.player2 = new Player({id: 2, name: ""});
        this.paused = true;
        this.loaded = false;
    }

    start() {

    }

    update(nowTime) {
        if (!this.paused) {
            this.timer = (this.timer - (nowTime - this.prevTime) / 1000);
            if (this.timer < 0) {
                console.log("timer = ", this.timer);
                this.timer += 5;
                this.switchPlayer();
            }
            this.prevTime = nowTime;
        }
    }

    setTime(newTime, prevTime) {
        this.timer = newTime;
        this.prevTime = prevTime;
    }

    generate() {
        let current = this.maze[0][0];
        let stack = [];
        current.visited = true;
        stack.push(current);
        do {
            let next = this.getUnvisitedNeighbour(this.maze, current);
            console.log("next now", next)
            if (next != null) {
                this.removeWall(current, next);
                stack.push(current);
                current = next;
                current.visited = true;
                console.log("stack now", current)
            } else {
                current = stack.pop();
            }
        }
        while (stack.length !== 0);
        console.log(this.maze)
    }

    getUnvisitedNeighbours(cells, {column, row}) {
        const previousColumn = column > 0 ? cells[row][column - 1] : null;
        const previousRow = row > 0 ? cells[row - 1][column] : null;
        const nextColumn = column < cells[column].length - 1 ? cells[row][column + 1] : null;
        const nextRow = row < cells.length - 1 ? cells[row + 1][column] : null;
        console.log(previousColumn, previousRow, nextColumn, nextRow)
        return [previousColumn, previousRow, nextColumn, nextRow]
            .filter(Boolean)
            .filter(cell => cell.visited === false);
    }

    getUnvisitedNeighbour(cells, cell) {
        const neighbours = this.getUnvisitedNeighbours(cells, cell);
        console.log(neighbours)
        return neighbours[Math.floor(Math.random() * neighbours.length)] || null;
    }

    playerNewName(gameId, newName){
        if(this.player1.gameId === gameId){
            this.player1.name = newName;
        } else if(this.player2.gameId === gameId){
            this.player2.name = newName;
        }
    }

    newPlayerGameIds(player1GameId, player2GameId){
        this.player1.gameId = player1GameId;
        this.player2.gameId = player2GameId;
    }

    changePlayerStatus(playerGameId, playerReadyStatus){
        console.log(playerGameId, playerReadyStatus)
        if(this.player1.gameId === playerGameId){
            this.player1.ready = playerReadyStatus === "1";
            console.log(this.player1.ready)
        } else if(this.player2.gameId === playerGameId){
            this.player2.ready = playerReadyStatus === "1";
        }
    }

    removeWall(current, next) {
        if ((current.column === next.column) && (current.row === next.row + 1)) {/// top
            current.top = false;
            next.bottom = false;
        }
        if (current.column === next.column && (current.row === next.row - 1)) {///bottom
            current.bottom = false;
            next.top = false;
        }
        if ((current.column === next.column - 1) && current.row === next.row) {///right
            current.right = false;
            next.left = false;
        }
        if ((current.column === next.column + 1) && current.row === next.row) {///left
            current.left = false;
            next.right = false;
        }
    }
}
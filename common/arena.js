const Player = require('./player');
const Cell = require('./cell');

module.exports = class Arena {
    constructor() {
        this.length = 15;
        this.width = this.length;
        this.height = this.length;
        this.maze = [];
        this.exitZone = null;
        this.startZone = null;
        for (let i = 0; i < this.length; i++) {
            this.maze[i] = [];
            for (let j = 0; j < this.length; j++) {
                this.maze[i][j] = new Cell(j, i);
            }
        }
        this.timer = 5;
        this.countdownTimer = 0;
        this.appTime = 0;
        this.player1 = new Player({id: 0, name: ""});
        this.player2 = new Player({id: 1, name: ""});
        this.loaded = false;
        this.gameStarted = false;
    }

    start() {

    }

    countdownTimerUpdate(nowTime){
        this.countdownTimer = (this.countdownTimer - (nowTime - this.appTime) / 1000);
    }

    update(nowTime) {
        if(this.countdownTimer < 0) {
            this.gameStarted = true;
        }
        if(this.countdownStarted()) this.countdownTimerUpdate(nowTime);
        if(this.gameStarted) this.updateMazeTimers(nowTime);
        this.checkPlayerFinish();
        this.setAppTime(nowTime);
    }

    setAppTime(newTime){
        this.appTime = newTime;
    }

    checkPlayerFinish() {
        if (this.exitZone !== null) {
            if (!this.player1.finished && this.player1.position !== null && this.player1.position.isSame(this.exitZone)) {
                this.player1.finished = true;
            }
            if (!this.player2.finished && this.player2.position !== null && this.player2.position.isSame(this.exitZone)) {
                this.player2.finished = true;
            }
        }
    }

    setCountdownTimer(newCountdownTime, newAppTime){
        this.countdownTimer = newCountdownTime;
        this.appTime = newAppTime;
    }

    setTime(newTime, appTime) {
        this.timer = newTime;
        this.appTime = appTime;
    }

    playersReady(){
        return this.player1.ready && this.player2.ready;
    }

    startCountDownTimer(startAppTime){
        this.countdownTimer = 5;
        this.setAppTime(startAppTime);
    }

    updateMazeTimers(nowTime){
        if(!this.player1.finished) this.player1.mazeTimer = (this.player1.mazeTimer + (nowTime - this.appTime) / 1000);
        if(!this.player2.finished) this.player2.mazeTimer = (this.player2.mazeTimer + (nowTime - this.appTime) / 1000);
    }

    countdownStarted(){
        return this.countdownTimer !== 0;
    }

    setStart(startingX, startingY){
        this.startZone = this.maze[startingY][startingX];
    }

    setExit(endingX, endingY){
        this.exitZone = this.maze[endingY][endingX];
    }

    setPlayerFinalMazeTimer(gameId, mazeTimer){
        if(this.player1.gameId === gameId){
            this.player1.mazeTimer = mazeTimer;
            this.player1.finished = true;
        }
        if(this.player2.gameId === gameId){
            this.player2.mazeTimer = mazeTimer;
            this.player2.finished = true;
        }
    }

    setPlayerPosition(gameId, positionX, positionY){
        if(this.player1.gameId === gameId){
            this.player1.position = this.maze[positionY][positionX];
        }
        if(this.player2.gameId === gameId){
            this.player2.position = this.maze[positionY][positionX];
        }
    }

    movePlayer(player, direction){
        if(this.isMoveAllowed(player.position, direction)){
            let lastPosition = player.position;
            switch(direction){
                case "UP":
                    player.position = this.maze[lastPosition.row - 1][lastPosition.column];
                    return true;
                case "DOWN":
                    player.position = this.maze[lastPosition.row + 1][lastPosition.column];
                    return true;
                case "LEFT":
                    player.position = this.maze[lastPosition.row][lastPosition.column - 1];
                    return true;
                case "RIGHT":
                    player.position = this.maze[lastPosition.row][lastPosition.column + 1];
                    return true;
            }
        }
        return false;
    }

    generate() {
        let randomStartY = Math.floor(Math.random() * this.height);
        let randomStartX = Math.floor(Math.random() * this.width);
        this.startZone = this.maze[randomStartY][randomStartX];
        let current = this.startZone;
        let stack = [];
        current.visited = true;
        stack.push(current);
        let counter = 0;
        do {
            let next = this.getUnvisitedNeighbour(this.maze, current);
            counter++;
            if (next != null) {
                this.removeWall(current, next);
                stack.push(current);
                current = next;
                current.visited = true;
            } else {
                current = stack.pop();
                if(counter > 10 && this.exitZone === null){
                    this.exitZone = this.maze[current.row][current.column];
                }
            }
        }
        while (stack.length !== 0);
        this.player1.position = this.startZone;
        this.player2.position = this.startZone;
    }

    manhattanDistance(startX, startY, endX, endY){
        return Math.abs((startX - endX) + (startY - endY));
    }

    getUnvisitedNeighbours(cells, {column, row}) {
        const previousColumn = column > 0 ? cells[row][column - 1] : null;
        const previousRow = row > 0 ? cells[row - 1][column] : null;
        const nextColumn = column < cells[column].length - 1 ? cells[row][column + 1] : null;
        const nextRow = row < cells.length - 1 ? cells[row + 1][column] : null;
        return [previousColumn, previousRow, nextColumn, nextRow]
            .filter(Boolean)
            .filter(cell => cell.visited === false);
    }

    getUnvisitedNeighbour(cells, cell) {
        const neighbours = this.getUnvisitedNeighbours(cells, cell);
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
        if(this.player1.gameId === playerGameId){
            this.player1.ready = playerReadyStatus === "1";
        } else if(this.player2.gameId === playerGameId){
            this.player2.ready = playerReadyStatus === "1";
        }
    }

    removeWall(current, next) {
        if ((current.column === next.column) && (current.row === next.row + 1)) {/// topWall
            current.topWall = false;
            next.bottomWall = false;
        }
        if (current.column === next.column && (current.row === next.row - 1)) {///bottomWall
            current.bottomWall = false;
            next.topWall = false;
        }
        if ((current.column === next.column - 1) && current.row === next.row) {///rightWall
            current.rightWall = false;
            next.leftWall = false;
        }
        if ((current.column === next.column + 1) && current.row === next.row) {///leftWall
            current.leftWall = false;
            next.rightWall = false;
        }
    }

    isMoveAllowed(cell, direction){
        if(direction === "UP"){
            return !cell.topWall;
        } else if(direction === "DOWN"){
            return !cell.bottomWall;
        } else if(direction === "LEFT"){
            return !cell.leftWall;
        } else if(direction === "RIGHT") {
            return !cell.rightWall;
        }
    }
}
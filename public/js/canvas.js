const canvas = document.querySelector('canvas');
const context = canvas.getContext('2d');
const ConnManager = require('./connectionManager');
const connectionManager = new ConnManager();
const arena = connectionManager.arena;
canvas.height = window.innerHeight;
canvas.width = window.innerWidth;

let cellSize = calculateCellSize();
let boardWidth = 15 * cellSize;
let myself = arena.player1;
let enemy = arena.player2;
let resized = true;
const fontSize = 50;
const fontBase = 1920;

connectionManager.connect('ws://localhost:3000/index');

const sessionId = window.location.hash.split('#')[1];

connectionManager.conn.onopen = function () {
    connectionManager.joinSession(sessionId);
}

connectionManager.events.listen('join-session-response', response => {
    if (response === "Session-is-full") {
        window.location.href = "index.html";
        return;
    } else {
        console.log(response);
        let hash = '#' + response;
        connectionManager.getArenaInformation();
        window.location.hash = hash;
    }
});

document.addEventListener('keydown', event => {
    if (event.code === "KeyR") {
        connectionManager.sendKeyPress("R");
    }
    if (!myself.finished) {
        if (event.code === "KeyW" || event.code === "ArrowUp") {
            if (arena.movePlayer(myself, "UP")) {
                connectionManager.sendMoveAction("UP");
            }
        }
        if (event.code === "KeyA" || event.code === "ArrowLeft") {
            if (arena.movePlayer(myself, "LEFT")) {
                connectionManager.sendMoveAction("LEFT");
            }
        }
        if (event.code === "KeyD" || event.code === "ArrowRight") {
            if (arena.movePlayer(myself, "RIGHT")) {
                connectionManager.sendMoveAction("RIGHT");
            }
        }
        if (event.code === "KeyS" || event.code === "ArrowDown") {
            if (arena.movePlayer(myself, "DOWN")) {
                connectionManager.sendMoveAction("DOWN");
            }
        }
    }
});

function getTextWidth(text) {
    context.font = getFont();
    const metrics = context.measureText(text);
    return metrics.width;
}

function getLineHeight() {
    return context.measureText("M").width * 1.2;
}

function getFontSize() {
    const ratio = fontSize / fontBase;
    return canvas.width * ratio;
}

function getFont() {
    return (getFontSize() | 0) + 'px ARIAL'; // set font
}

function calculateCellSize() {
    return Math.floor(canvas.width / 40);
}

function drawMaze(player) {
    let displacementX = cellSize * 2 + player.id * cellSize * 20;
    let displacementY = cellSize * 2;
    if (arena.gameStarted && player.position !== null) {
        context.fillStyle = "#404040";
        context.fillRect(displacementX + cellSize * arena.startZone.column, displacementY + cellSize * arena.startZone.row, cellSize, cellSize);
        context.fillStyle = "#72923F";
        context.fillRect(displacementX + cellSize * arena.exitZone.column, displacementY + cellSize * arena.exitZone.row, cellSize, cellSize);
        context.beginPath();
        context.arc(displacementX + cellSize * player.position.column + cellSize / 2, displacementY + cellSize * player.position.row + cellSize / 2, cellSize / 4, 0, 2 * Math.PI, false);
        context.fillStyle = "#D68840";
        context.strokeStyle = "#72923F"
        context.fill();
        context.lineWidth = 1;
        context.stroke();
    }
    for (let row = 0; row < arena.height; row++) {
        for (let col = 0; col < arena.height; col++) {
            context.strokeStyle = 'rgb(255, 255, 255)';
            if (arena.loaded) {
                if (arena.maze[row][col].topWall) {
                    context.beginPath();
                    context.moveTo(displacementX + cellSize * col, displacementY + cellSize * row);
                    context.lineTo(displacementX + cellSize * (col + 1), displacementY + cellSize * row);
                    context.stroke();
                }
                if (arena.maze[row][col].leftWall) {
                    context.beginPath();
                    context.moveTo(displacementX + cellSize * col, displacementY + cellSize * row);
                    context.lineTo(displacementX + cellSize * col, displacementY + cellSize * (row + 1));
                    context.stroke();
                }
                if (arena.maze[row][col].rightWall) {
                    context.beginPath();
                    context.moveTo(displacementX + cellSize * (col + 1), displacementY + cellSize * (row + 1));
                    context.lineTo(displacementX + cellSize * (col + 1), displacementY + cellSize * row);
                    context.stroke();
                }
                if (arena.maze[row][col].bottomWall) {
                    context.beginPath();
                    context.moveTo(displacementX + cellSize * (col + 1), displacementY + cellSize * (row + 1));
                    context.lineTo(displacementX + cellSize * col, displacementY + cellSize * (row + 1));
                    context.stroke();
                }
            }
        }
    }
}


window.addEventListener('resize', resizeCanvas, false);

function resizeCanvas() {
    resized = true;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    cellSize = calculateCellSize();
    boardWidth = cellSize * 15;
    drawBoard();
    print(arena.player1);
    print(arena.player2);
    printGeneral();
}

function printGeneral() {
    if (arena.gameFinished) {
        let finishedMessage = "";
        context.fillStyle = "RED";
        if (arena.winner == null) {
            finishedMessage = "The game ended in a draw! \nThere is no winner";
            context.fillText(finishedMessage, (canvas.width - getTextWidth(finishedMessage)) / 2, ((canvas.height) / 2));
        } else {
            let finishedMessage = "The winner of this game is : ";
            context.fillText(finishedMessage + arena.winner.name, (canvas.width - getTextWidth(finishedMessage)) / 2, ((canvas.height) / 2));
            context.fillText("with time : " + parseFloat(arena.winner.mazeTimer).toFixed(2) + "s", (canvas.width - getTextWidth(finishedMessage)) / 2, ((canvas.height) / 2) + getLineHeight());
        }
    }
}

function print(player) {
    let displacementX = cellSize * 2 + player.id * cellSize * 20;
    let displacementY = cellSize * 3;
    context.font = getFont();
    if (player.finished) {
        context.fillStyle = "GREEN";
    } else {
        context.fillStyle = "WHITE";
    }
    let mazeTimerMessage = parseFloat(player.mazeTimer).toFixed(2) + "s";
    context.fillText(mazeTimerMessage, displacementX, displacementY - cellSize);
    context.fillText(player.name, displacementX, boardWidth + displacementY);
    let getReadyMessage = "Press R to make yourself ready";
    let getReadyMessagePosition = (boardWidth - getTextWidth(getReadyMessage)) / 2;
    if (!player.ready && player.connected) {
        context.fillStyle = "RED";
        context.fillText(getReadyMessage, getReadyMessagePosition + displacementX, displacementY + boardWidth / 2);
    }
    let countdownMessage = "GET READY! " + parseFloat(5 - arena.countdownTimer).toFixed(2) + "s";
    let countdownTimerPosition = cellSize * 2 + (boardWidth - getTextWidth(countdownMessage)) / 2;
    if (arena.countdownStarted && !arena.gameStarted) {
        context.fillStyle = "RED";
        context.fillText(countdownMessage, countdownTimerPosition, displacementY + boardWidth / 2);
    }
    let disconnectedMSG = "DISCONNECTED";
    let disconnectedMSGpos = (boardWidth - getTextWidth(disconnectedMSG)) / 2;
    if (!player.connected) {
        context.fillStyle = "RED";
        context.fillText(disconnectedMSG, disconnectedMSGpos + displacementX, displacementY + boardWidth / 2);
    }
}

function update() {
    setInterval(function () {
        arena.update(Date.now());
        drawBoard()
        print(arena.player1);
        print(arena.player2);
        printGeneral();
        if (resized) resized = false;
    }, 10);
}

function heartbeat() {
    setInterval(function () {
        connectionManager.heartbeat();
    }, 20000);
}

function startGame() {
    update()
    heartbeat()
}

function drawBoard() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    drawMaze(myself)
    drawMaze(enemy)
}

startGame()
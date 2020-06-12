const canvas = document.querySelector('canvas');
const context = canvas.getContext('2d');
const ConnManager = require('./connectionManager');
const connectionManager = new ConnManager();
const arena = connectionManager.arena;
canvas.height = window.innerHeight;
canvas.width = window.innerWidth;

let cellSize = Math.floor(canvas.width / 30);
let mouseX, mouseY;
let boardWidth = 6 * cellSize;
const spriteSheet = new Image();
let myself = arena.player1;
let enemy = arena.player2;

const fontSize = 50;
const fontBase = 1920;

connectionManager.connect('ws://localhost:3000/index');

const rects = [];

function getTextWidth(text) {
    context.font = getFont();
    const metrics = context.measureText(text);
    return metrics.width;
}

function getFontSize() {
    const ratio = fontSize / fontBase;
    return canvas.width * ratio;
}

function getFont() {
    return (getFontSize() | 0) + 'px ARIAL'; // set font
}

function getSizeRatio() {
    return canvas.width / 1920;
}

function loadSprites() {
    spriteSheet.src = 'res/tiwpr.png';
    spriteSheet.onload = function () {
    }
}

canvas.onmousemove = function (e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
};

function createRectangleArray(id) {
    cellSize = Math.floor(canvas.width / 30);
    boardWidth = 6 * cellSize;
    let distance = canvas.width - 6 * cellSize - boardWidth * 2;
    let deltaX = (id - 1) * distance + cellSize * 6;
    let deltaY = 5 * cellSize;
    for (let i = 0; i < 36; i++) {
        let x = Math.floor(i % 6);
        let y = Math.floor(i / 6);
        rects[i] = {
            x: deltaX + x * cellSize,
            y: deltaY + y * cellSize,
            size: cellSize
        }
    }
    console.table(rects);
}

function drawGrid({id}) {
    let highlightSquareY = -1;
    let highlightSquareX = -1;

    cellSize = Math.floor(canvas.width / 30);
    boardWidth = 6 * cellSize;
    let distance = canvas.width - 6 * cellSize - boardWidth * 2;
    let deltaX = (id - 1) * distance + cellSize * 6;
    let deltaY = 5 * cellSize;
    for (let i = 0; i < 36; i++) {
        let x = Math.floor(i % 6);
        let y = Math.floor(i / 6);
        let square = y * 6 + x;
        if (square === 0) {
            context.drawImage(spriteSheet, 0, 0, 128, 128, deltaX + x * cellSize, deltaY + y * cellSize, cellSize, cellSize);
        } else if (square === 5) {
            context.drawImage(spriteSheet, 256, 0, 128, 128, deltaX + x * cellSize, deltaY + y * cellSize, cellSize, cellSize);
        } else if (square === 30) {
            context.drawImage(spriteSheet, 0, 256, 128, 128, deltaX + x * cellSize, deltaY + y * cellSize, cellSize, cellSize);
        } else if (square === 35) {
            context.drawImage(spriteSheet, 256, 256, 128, 128, deltaX + x * cellSize, deltaY + y * cellSize, cellSize, cellSize);
        } else if (y === 0) {
            context.drawImage(spriteSheet, 128, 0, 128, 128, deltaX + x * cellSize, deltaY + y * cellSize, cellSize, cellSize);
        } else if (x === 0) {
            context.drawImage(spriteSheet, 0, 128, 128, 128, deltaX + x * cellSize, deltaY + y * cellSize, cellSize, cellSize);
        } else if (x === 5) {
            context.drawImage(spriteSheet, 256, 128, 128, 128, deltaX + x * cellSize, deltaY + y * cellSize, cellSize, cellSize);
        } else if (y === 5) {
            context.drawImage(spriteSheet, 128, 256, 128, 128, deltaX + x * cellSize, deltaY + y * cellSize, cellSize, cellSize);
        } else {
            let pickOne = Math.floor(Math.random() * 2);
            if (pickOne === 0) {
                context.drawImage(spriteSheet, 128, 128, 128, 128, deltaX + x * cellSize, deltaY + y * cellSize, cellSize, cellSize);
            } else if (pickOne === 1) {
                context.drawImage(spriteSheet, 384, 256, 128, 128, deltaX + x * cellSize, deltaY + y * cellSize, cellSize, cellSize);
            }
        }
        context.beginPath();
        context.lineWidth = 2;
        if (mouseX > deltaX + x * cellSize && mouseX < deltaX + x * cellSize + cellSize && mouseY > deltaY + y * cellSize && mouseY < deltaY + y * cellSize + cellSize) {
            highlightSquareX = deltaX + x * cellSize;
            highlightSquareY = deltaY + y * cellSize;
        }
        context.strokeStyle = 'green';
        context.strokeRect(deltaX + x * cellSize, deltaY + y * cellSize, cellSize, cellSize);
        context.closePath();
    }
    if (highlightSquareX !== -1) {
        context.beginPath();
        context.strokeStyle = 'red';
        context.strokeRect(highlightSquareX, highlightSquareY, cellSize, cellSize);
        context.closePath();
    }
}

window.addEventListener('resize', resizeCanvas, false);

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    createRectangleArray(1);
    drawBoard();
}

function print(time) {
    let distance = canvas.width - 6 * cellSize - boardWidth * 2;
    let deltaX = (myself.id - 1) * distance + cellSize * 6;
    let deltaY = (myself.id - 1) * distance + cellSize * 5 - getSizeRatio() * 10;
    context.font = getFont();
    context.fillStyle = "WHITE";
    context.fillText(myself.name, deltaX, deltaY);
    context.fillText("gold: " + myself.gold, deltaX + cellSize * 4, deltaY);

    context.font = getFont();
    context.fillStyle = "RED";
    context.fillText(arena.getPlayerTurn().name, deltaX, getFontSize());
    context.fillStyle = "WHITE";
    context.fillText("is making a move", deltaX + getTextWidth(myself.name) + getSizeRatio() * 10, getFontSize());
    let seconds = time;
    context.fillStyle = "RED";
    context.fillText(seconds, deltaX, getFontSize() * 2);
    context.fillStyle = "WHITE";
    context.fillText("seconds left", deltaX + getTextWidth(seconds) + getSizeRatio() * 10, getFontSize() * 2);

    deltaX = (enemy.id - 1) * distance + cellSize * 6;
    context.font = getFont();
    context.fillStyle = "WHITE";
    context.fillText(enemy.name, deltaX, deltaY);
    context.fillText("gold: " + enemy.gold, deltaX + cellSize * 4, deltaY);
}

function update() {
    setInterval(function () {
        drawBoard()
        arena.update(performance.now());
        print(arena.getTime());
    }, 10);
}

function startGame() {
    loadSprites()
    update()
}

startGame()

function drawBoard() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid(myself)
    drawGrid(enemy)
}
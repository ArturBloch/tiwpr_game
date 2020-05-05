const canvas = document.querySelector('canvas');
const context = canvas.getContext('2d');

canvas.height = window.innerHeight;
canvas.width = window.innerWidth;

let cellSize = Math.floor(canvas.width / 30);
let boardWidth = 6 * cellSize;
const spriteSheet = new Image();
const myself = new Player({id : 1, name: "Artur"});
const enemy = new Player({id : 2, name: "Mariusz"});
const fontSize = 50;
const fontBase = 1920;

const connectionManager = new ConnectionManager();
connectionManager.connect('ws://localhost:3000/index');

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

function drawGrid({id}) {
    cellSize = Math.floor(canvas.width / 30);
    boardWidth = 6 * cellSize;
    let distance = canvas.width - 6 * cellSize - boardWidth * 2;
    let deltaX = (id - 1) * distance + cellSize * 6;
    let deltaY = 5 * cellSize;
    for (let i = 0; i < 36; i++) {
        let x = Math.floor(i % 6);
        let y = Math.floor(i / 6);
        let square = y * 6 + x;
        context.strokeStyle = "green";
        context.lineWidth = 2;
        context.strokeRect(deltaX + x * cellSize, deltaY + y * cellSize, cellSize, cellSize);
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
    }
}

window.addEventListener('resize', resizeCanvas, false);

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
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
    context.fillText(myself.name, deltaX, getFontSize());
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
    let t1 = 0;
    setInterval(function () {
        let t0 = performance.now();
        drawBoard()
        let secondsLeft = 5 - Math.floor((t0 - t1) / 1000);
        print(secondsLeft)
        if (secondsLeft === 0) {
            t1 = performance.now();
        }
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
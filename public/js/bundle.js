(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
const Player = require('./player');

module.exports = class Arena {
    constructor() {
        this.timer = 5;
        this.prevTime = 0;
        this.player1 = new Player({ id : 1});
        this.player2 = new Player({ id : 2});
        this.playerTurn = this.player1;
    }

    start(){

    }

    update(nowTime) {
        this.timer = (this.timer - (nowTime - this.prevTime) / 1000);
        if(this.timer < 0){
            this.timer += 5;
            this.switchPlayer();
        }
        this.prevTime = nowTime;
    }

    setTime(newTime, prevTime){
        this.timer = newTime;
        this.prevTime = prevTime;
    }

    getTime(){
        return this.timer.toFixed(2);
    }

    switchPlayer() {
        if (this.playerTurn === this.player1) {
            this.playerTurn = this.player2;
        } else {
            this.playerTurn = this.player1;
        }
        console.log(this.playerTurn.name);
    }
}
},{"./player":3}],2:[function(require,module,exports){
module.exports = class Cell {
    constructor() {
        this.house = false;
    }
}
},{}],3:[function(require,module,exports){
const Cell = require('./cell');
module.exports =  class Player {
    constructor({id = 0, name = "", gold = 0} = {}, client = {}, ) {
        this.client = client;
        this.id = id;
        this.gold = gold;
        this.map = [[]];
        for (let i = 0; i < 6; i++) {
            this.map[i] = [];
            for (let j = 0; j < 6; j++) {
                this.map[i][j] = new Cell();
            }
        }
        this._name = name;
    }


    get name() {
        return this._name;
    }

    set name(value) {
        this._name = value;
    }


}
},{"./cell":2}],4:[function(require,module,exports){
const canvas = document.querySelector('canvas');
const context = canvas.getContext('2d');
const Arena = require('../../common/arena');
const ConnManager = require('./connectionManager');
const arena = new Arena();
console.log("o co tu kurde chodzi ");
console.log(arena);
const connectionManager = new ConnManager(arena);

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

var rects = [];

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

canvas.onmousemove = function(e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
};

function createRectangleArray(id){
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
        if(mouseX > deltaX + x * cellSize && mouseX < deltaX + x * cellSize + cellSize && mouseY > deltaY + y * cellSize && mouseY < deltaY + y * cellSize + cellSize)
        {
            highlightSquareX = deltaX + x * cellSize;
            highlightSquareY = deltaY + y * cellSize;
            console.log("YES");

        }
        context.strokeStyle = 'green';
        context.strokeRect(deltaX + x * cellSize, deltaY + y * cellSize, cellSize, cellSize);
        context.closePath();
    }
    if(highlightSquareX !== -1){
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
    context.fillText(myself.name, deltaX, getFontSize());
    context.fillStyle = "WHITE";
    context.fillText("is making a move", deltaX + getTextWidth(myself.name) + getSizeRatio() * 10, getFontSize());
    let seconds = time;
    context.fillStyle = "RED";
    context.fillText(seconds, deltaX, getFontSize() * 2);
    context.fillStyle = "WHITE";
    context.fillText("seconds left", deltaX + getTextWidth(seconds) + getSizeRatio() * 10, getFontSize() * 2);

    deltaX = (enemy.id - 1) * distance + cellSize * 6;
    console.log(enemy.id);
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
},{"../../common/arena":1,"./connectionManager":5}],5:[function(require,module,exports){
module.exports = class ConnectionManager {
    constructor(arena) {
        this.conn = null;
        this.arena = arena;
        this.id = "";
    }

    connect(address) {
        this.conn = new WebSocket(address);
        this.conn.binaryType = "arraybuffer";

        this.conn.addEventListener('open', () => {
            console.log('Connection established');
            this.initializeConnection();
            this.initSession();
        });

        this.conn.addEventListener('message', event => {
            console.log('Message received', event.data);
            this.receive(event.data);
        });
    }

    initSession() {
        const sessionId = window.location.hash.split('#')[1];
        console.log("sess id" + sessionId);
        if (sessionId) {
            this.send([{
                    type: 'join-session',
                    value: [sessionId]
                }]);
        } else {
            this.send([{
                type: 'create-session',
                value: []
            }]);
        }
    }

    send(data) {
        let finalMSG = "";
        for (let i = 0; i < data.length; i++) {
            finalMSG = finalMSG === "" ? data[i].type : finalMSG + " " + data[i].type;
            for (let j = 0; j < data[i].value.length; j++) {
                finalMSG = data[i].value[j] === undefined ? finalMSG : finalMSG + " " + data[i].value[j];
            }
        }
        let byteId = new TextEncoder().encode(finalMSG);
        console.log(`Sending message ${finalMSG} in byteArray ` + byteId);
        this.conn.send(byteId, function ack(err) {
            if (err) {
                console.error('Message failed', byteId, err);
            }
        });
    }

    receive(data) {
        let str = this.decodeMsg(data);
        let messages = str.split(" ");
        for (let i = 0; i < messages.length; i++) {
            if (messages[i] === "session-created") {
                let value = messages[++i];
                console.log("id " + value);
                window.location.hash = value;
            }
            if (messages[i] === "time-update") {
                let value = messages[++i];
                this.arena.setTime(value, performance.now());
                console.log("new time" + value);
            }
            if (messages[i] === "client-id") {
                let value = messages[++i];
                this.id = value;
                localStorage.setItem("id", value);
                console.log("my id " + this.id);
            }
        }
    }

    decodeMsg(data) {
        return new TextDecoder().decode(data);
    }

    initializeConnection(){
        let storedId = localStorage.getItem("id");
        console.log("my id is " + storedId);
        if(storedId === null){
            this.send([{
                type: 'welcome',
                value: []
            }]);
        } else {
            this.send([{
                type: 'welcome-again',
                value: [storedId],
            }]);
        }
    }
}
},{}]},{},[4,5,3,1,2]);

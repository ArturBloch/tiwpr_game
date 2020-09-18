const Arena = require('./../common/arena');
const performance = require('perf_hooks').performance;
const WebSocket = require('ws');
const {v4: uuidv4} = require('uuid');

class Session {
    constructor(id) {
        this.id = id;
        this.arena = new Arena();
        this.arena.player1.gameId = uuidv4();
        this.arena.player2.gameId = uuidv4();
        this.client1 = null;
        this.client2 = null;
        this.player1Finished = false;
        this.player2Finished = false;
        this.gameFinished = false;
    }

    join(client) {
        console.log("client joining");
        if (client.session) {
            console.error('Client already in session');
        } else {
            if(this.client1 === null){
                console.log("added client 1");
                this.client1 = client;
                this.arena.player1.client = client;
                client.session = this;
                return;
            } else if(this.client2 === null){
                console.log("added client 2");
                this.client2 = client;
                this.arena.player2.client = client;
                client.session = this;
                return;
            }
        }
        if((this.client1 !== null && client.id === this.client1.id) || (this.client2 !== null && client.id === this.client2.id)){
            this.reconnectClient();
        } else {
            console.log("Session full or user belongs to other session");
        }
    }

    reconnectClient(){
        console.log("Client Reconnected");
    }

    leave(client) {
        if (client.session !== this) {
            throw new Error('Client not in session');
        }
        this.clients.delete(client);
        client.session = null;
    }

    update() {
        this.arena.update(performance.now());
        if(this.arena.playersReady() && !this.arena.countdownStarted()){
            this.arena.startCountDownTimer(performance.now());
        }
        if(this.arena.countdownTimer < 0){
            this.arena.gameStarted = true;
        }
    }

    sendUpdate() {
        if(this.arena.countdownTimer > 0 && this.arena.playersReady()){
            this.sendCountDownTimers();
        }
        if(this.arena.countdownTimer < 0.6 && !this.arena.gameStarted && this.arena.countdownStarted()) {
            this.sendMsgToClients("maze-start-exit", [this.arena.startZone.column, this.arena.startZone.row, this.arena.exitZone.column, this.arena.exitZone.row]);
            this.sendMsgToClients("player-position", [this.arena.player1.gameId, this.arena.player1.position.column, this.arena.player1.position.row]);
            this.sendMsgToClients("player-position", [this.arena.player2.gameId, this.arena.player2.position.column, this.arena.player2.position.row]);
        }
        this.checkIfPlayerFinished();
        return this.checkIfGameFinished();
    }

    checkIfGameFinished(){
        if(this.player1Finished && this.player2Finished && !this.gameFinished){
            const winningPlayer = this.arena.getWinner();
            this.gameFinished = true;
            if(winningPlayer == null) {
                this.sendMsgToClients("game-finished", ["draw"])
            } else {
                this.sendMsgToClients("game-finished", [winningPlayer.gameId])
            }
            return true;
        }
    }


    checkIfPlayerFinished(){
        if(this.arena.player1.finished && !this.player1Finished){
            this.arena.player1.mazeTimer = this.arena.player1.mazeTimer - ((performance.now() - this.client1.timeOfLastMessage) / 1000);
            this.sendMsgToClients("player-finished", [this.arena.player1.gameId, this.arena.player1.mazeTimer])
            this.player1Finished = true;
        }
        if(this.arena.player2.finished && !this.player2Finished){
            this.arena.player2.mazeTimer = this.arena.player2.mazeTimer - ((performance.now() - this.client2.timeOfLastMessage) / 1000);
            this.sendMsgToClients("player-finished", [this.arena.player2.gameId, this.arena.player2.mazeTimer])
            this.player2Finished = true;
        }
    }

    sendCountDownTimers(){
        this.client1.send([{
            type: 'countdown-update',
            value: [this.arena.countdownTimer]
        }]);
        this.arena.countdownTimerUpdate(performance.now());
        this.client2.send([{
            type: 'countdown-update',
            value: [this.arena.countdownTimer]
        }]);
    }


    differentClient(client) {
        if(client.id === this.client1.id)
            return this.client2;
        if(client.id === this.client2.id)
            return this.client1;
        return null;
    }

    timerUpdates(){
        if (this.playerConnectionReady(this.client1)) {
            console.log("P1 ready");
            this.client1.send([{
                type: 'time-update',
                value: [this.arena.timer]
            }]);
        }
        if (this.playerConnectionReady(this.client2)) {
            console.log("P2 ready");
            this.client2.send([{
                type: 'time-update',
                value: [this.arena.timer]
            }]);
        }
    }

    isFull(){
        return this.client1 !== null && this.client2 !== null;
    }

    playerConnectionReady(client){
        if(client !== null && client !== undefined && client.conn.readyState !== WebSocket.CLOSED){
            return true;
        }
        return false;
    }

    sendMsgToClients(msg, data) {
        if (this.client1 !== null) {
            this.client1.send([{
                type: msg,
                value: data
            }]);
        }
        if (this.client2 !== null) {
            this.client2.send([{
                type: msg,
                value: data
            }]);
        }
    }
}

module.exports = Session;
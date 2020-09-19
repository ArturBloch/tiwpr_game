const Arena = require('./../common/arena');
const {v4: uuidv4} = require('uuid');

class Session {
    constructor(id) {
        this.id = id;
        this.arena = new Arena();
        this.arena.player1.gameId = uuidv4();
        this.arena.player2.gameId = uuidv4();
        this.player1Finished = false;
        this.player2Finished = false;
        this.gameFinished = false;
        this.gameStarted = false;
    }

    join(client) {
        console.log("client joining");
        if (client.session) {
            console.error('Client already in session');
        } else {
            if (this.arena.player1.client == null) {
                this.arena.player1.client = client;
                this.arena.player1.name = client.name;
                this.arena.player1.connected = true;
                client.session = this;
                return;
            } else if (this.arena.player2.client == null) {
                this.arena.player2.client = client;
                this.arena.player2.name = client.name;
                this.arena.player2.connected = true;
                client.session = this;
                return;
            }
        }
    }

    reconnectIfPossible(client) {
        if ((this.arena.player1.client !== null && client.id === this.arena.player1.client.id)) {
            this.arena.player1.client = client;
            this.arena.player1.connected = true;
            client.session = this;
            return true;
        } else if (this.arena.player2.client !== null && client.id === this.arena.player2.client.id) {
            this.arena.player2.client = client;
            this.arena.player2.connected = true;
            client.session = this;
            return true;
        }
        return false;
    }

    reconnect(client) {
        this.shareConnectionStatus();
        this.shareReadyStatus();
        this.shareSessionNames();
        if (this.gameStarted) {
            client.send([{
                type: "maze-start-exit",
                value: [this.arena.startZone.column, this.arena.startZone.row, this.arena.exitZone.column, this.arena.exitZone.row]
            }]);
            client.send([{
                type: "gameId-playerPos",
                value: [this.arena.player1.gameId, this.arena.player1.position.column, this.arena.player1.position.row]
            }]);
            client.send([{
                type: "gameId-playerPos",
                value: [this.arena.player2.gameId, this.arena.player2.position.column, this.arena.player2.position.row]
            }]);
            if(this.arena.player1.finished){
                client.send([{
                    type: "player-finished",
                    value: [this.arena.player1.gameId, this.arena.player1.mazeTimer]
                }]);
            }
            if(this.arena.player2.finished){
                client.send([{
                    type: "player-finished",
                    value: [this.arena.player2.gameId, this.arena.player2.mazeTimer]
                }]);
            }
        }
    }

    removeClient(client) {
        if (client.session !== this) {
            console.log('Client not in session');
            return;
        }
        if (this.arena.player1.client != null && this.arena.player1.client.id === client.id) {
            if (!this.arena.playersReady()) {
                this.arena.player1.client = null;
            }
            this.arena.player1.connected = false;
            this.sendMsgToClients("player-connection-status", [this.arena.player1.gameId, this.arena.player1.connected]);
        }
        if (this.arena.player2.client != null && this.arena.player2.client.id === client.id) {
            if (!this.arena.playersReady()) {
                this.arena.player2.client = null;
            }
            this.arena.player2.connected = false;
            this.sendMsgToClients("player-connection-status", [this.arena.player2.gameId, this.arena.player2.connected]);
        }
    }

    update() {
        this.arena.update(Date.now());
    }

    checkIfGameFinished() {
        if ((this.player1Finished || (this.gameStarted && !this.arena.player1.connected))
            && (this.player2Finished || (this.gameStarted && !this.arena.player2.connected))
            && !this.gameFinished) {
            const winningPlayer = this.arena.getWinner();
            this.gameFinished = true;
            if (winningPlayer == null) {
                this.sendMsgToClients("game-finished", ["draw"])
            } else {
                this.sendMsgToClients("game-finished", [winningPlayer.gameId])
            }
            return true;
        }
    }

    checkIfPlayerFinished() {
        if (this.arena.player1.finished && !this.player1Finished) {
            this.arena.player1.mazeTimer = ((Date.now() - this.arena.gameTime) / 1000);
            this.sendMsgToClients("player-finished", [this.arena.player1.gameId, this.arena.player1.mazeTimer])
            this.player1Finished = true;
        }
        if (this.arena.player2.finished && !this.player2Finished) {
            this.arena.player2.mazeTimer = ((Date.now() - this.arena.gameTime) / 1000);
            this.sendMsgToClients("player-finished", [this.arena.player2.gameId, this.arena.player2.mazeTimer])
            this.player2Finished = true;
        }
    }

    isFull() {
        return this.arena.player1.client !== null && this.arena.player2.client !== null;
    }

    differentClient(client) {
        if (this.arena.player1.client != null && client.id === this.arena.player1.client.id)
            return this.arena.player1.client;
        if (this.arena.player2.client != null && client.id === this.arena.player2.client.id)
            return this.arena.player2.client;
        return null;
    }

    sendUpdate() {
        if (this.arena.countdownStarted && !this.arena.gameStarted) {
            this.sendCountDownTimers();
        }
        if (this.arena.gameStarted && !this.gameStarted) {
            this.gameStarted = true;
            this.sendGameTimer();
        }
        if (this.arena.countdownTimer > 4.4 && !this.arena.gameStarted && this.arena.countdownStarted) {
            this.sendMsgToClients("maze-start-exit", [this.arena.startZone.column, this.arena.startZone.row, this.arena.exitZone.column, this.arena.exitZone.row]);
            this.sendMsgToClients("gameId-playerPos", [this.arena.player1.gameId, this.arena.player1.position.column, this.arena.player1.position.row]);
            this.sendMsgToClients("gameId-playerPos", [this.arena.player2.gameId, this.arena.player2.position.column, this.arena.player2.position.row]);
        }
        this.checkIfPlayerFinished();
        return this.checkIfGameFinished();
    }

    sendMsgToClients(msg, data) {
        if (this.arena.player1.client !== null) {
            this.arena.player1.client.send([{
                type: msg,
                value: data
            }]);
        }
        if (this.arena.player2.client !== null) {
            this.arena.player2.client.send([{
                type: msg,
                value: data
            }]);
        }
    }

    sendCountDownTimers() {
        this.sendMsgToClients("readyTime", [this.arena.readyTime]);
    }

    sendGameTimer() {
        this.sendMsgToClients("gameTime", [this.arena.gameTime]);
    }

    shareConnectionStatus() {
        this.sendMsgToClients("player-connection-status", [this.arena.player1.gameId, this.arena.player1.connected]);
        this.sendMsgToClients("player-connection-status", [this.arena.player2.gameId, this.arena.player2.connected]);
    }

    shareReadyStatus() {
        this.sendMsgToClients("changed-ready-status", [this.arena.player1.gameId, this.arena.player1.ready]);
        this.sendMsgToClients("changed-ready-status", [this.arena.player2.gameId, this.arena.player2.ready]);
    }

    shareSessionNames() {
        this.sendMsgToClients("player-name", [this.arena.player1.gameId, this.arena.player1.name]);
        this.sendMsgToClients("player-name", [this.arena.player2.gameId, this.arena.player2.name]);
    }

    shareSessionInformation() {
        this.shareConnectionStatus();
        this.shareSessionNames();
    }
}

module.exports = Session;
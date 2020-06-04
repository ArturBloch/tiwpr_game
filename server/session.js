const Arena = require('./../common/arena');
const performance = require('perf_hooks').performance;
const WebSocket = require('ws');

class Session {
    constructor(id) {
        this.id = id;
        this.clients = new Set;
        this.arena = new Arena();
    }

    join(client) {
        if (client.session) {
            console.error('Client already in session');
        } else {
            if (Object.keys(this.arena.player1.client).length === 0) {
                this.arena.player1.client = client;
                this.clients.add(client);
                client.session = this;
                return;
            } else if (Object.keys(this.arena.player2.client).length === 0) {
                this.arena.player2.client = client;
                this.clients.add(client);
                client.session = this;
                return;
            }
        }
        if(client.id === this.arena.player1.client.id || client.id === this.arena.player2.client.id){
            this.reconnectClient();
        } else {
            console.log("Session full");
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
        console.log(this.arena.timer);
    }

    sendUpdate() {
        this.timerUpdates()
        this.currentPlayerUpdate()
    }

    timerUpdates(){
        if (this.playerConnectionReady(this.arena.player1)) {
            this.arena.player1.client.send([{
                type: 'time-update',
                value: this.arena.timer,
            }]);
        }
        if (this.playerConnectionReady(this.arena.player2)) {
            this.arena.player2.client.send([{
                type: 'time-update',
                value: this.arena.timer,
            }]);
        }
    }

    currentPlayerUpdate() {
        if (this.playerConnectionReady(this.arena.player1)) {
            this.arena.player1.client.send([{
                type: 'current-player',
                value: this.arena.playerTurn.id,
            }]);
        }
        if (this.playerConnectionReady(this.arena.player2)) {
            this.arena.player2.client.send([{
                type: 'current-player',
                value: this.arena.playerTurn.id,
            }]);
        }
    }

    playerConnectionReady(player){
        if (Object.keys(player.client).length !== 0 && player.client.conn.readyState !== WebSocket.CLOSED) {
            return true;
        }
        return false;
    }
}

module.exports = Session;
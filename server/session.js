const Arena = require('./../common/arena');
const performance = require('perf_hooks').performance;
const WebSocket = require('ws');

class Session {
    constructor(id) {
        this.id = id;
        this.arena = new Arena();
        this.inactive = 0;
        this.client1 = null;
        this.client2 = null;
    }

    join(client) {
        console.log("client joining");
        if (client.session) {
            console.error('Client already in session');
        } else {
            if(this.client1 === null){
                console.log("added client 1");
                this.client1 = client;
                client.session = this;
                return;
            } else if(this.client2 === null){
                console.log("added client 2");
                this.client2 = client;
                client.session = this;
                return;
            }
            // if (Object.keys(this.arena.player1.client).length === 0) {
            //     this.arena.player1.client = client;
            //     this.clients.add(client);
            //     client.session = this;
            //     return;
            // } else if (Object.keys(this.arena.player2.client).length === 0) {
            //     this.arena.player2.client = client;
            //     this.clients.add(client);
            //     client.session = this;
            //     return;
            // }
        }
        if(client.id === this.client1.id || client.id === this.client2.id){
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
    }

    sendUpdate() {
        this.timerUpdates()
        this.currentPlayerUpdate()
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
            this.client2.send([{
                type: 'time-update',
                value: [this.arena.timer]
            }]);
        }
    }

    currentPlayerUpdate() {
        if (this.playerConnectionReady(this.client1)) {
            this.client1.send([{
                type: 'current-player',
                value: [this.arena.playerTurn.id]
            }]);
        }
        if (this.playerConnectionReady(this.client2)) {
            this.client2.send([{
                type: 'current-player',
                value: [this.arena.playerTurn.id]
            }]);
        }
    }

    isFull(){
        const isFull = this.client1 !== null && this.client2 !== null;
        console.log("IS FULL? ", isFull);
        return isFull;
    }

    playerConnectionReady(client){
        if(client !== null && client !== undefined && client.conn.readyState !== WebSocket.CLOSED){
            return true;
        }
        return false;
    }
}

module.exports = Session;